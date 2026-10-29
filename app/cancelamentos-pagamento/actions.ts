'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type {
  ManualRefundMethod,
  ManualRefundReason,
} from '@/lib/admin-operations';

export type ManualRefundActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_METHODS: ManualRefundMethod[] = [
  'pix',
  'transferencia_bancaria',
  'dinheiro',
  'credito_em_conta',
  'outro',
];
const VALID_REASONS: ManualRefundReason[] = [
  'cancelamento_solicitacao',
  'pagamento_duplicado',
  'cobranca_indevida',
  'falha_operacional',
  'acordo_com_cliente',
  'outro',
];

function parseCurrencyToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function getSafeRpcMessage(message: string) {
  const knownMessages = [
    'Este cancelamento nao esta aguardando reembolso',
    'O pagamento nao esta PAID; aguarde a conciliacao antes do registro manual',
    'O valor deve corresponder integralmente ao pagamento associado',
    'Cancelamento financeiro nao encontrado',
  ];

  return (
    knownMessages.find((knownMessage) => message.includes(knownMessage)) ??
    'Não foi possível registrar o reembolso. Atualize a fila e tente novamente.'
  );
}

export async function registerManualRefund(
  _previousState: ManualRefundActionState,
  formData: FormData,
): Promise<ManualRefundActionState> {
  const cancellationId = String(formData.get('cancelamento_id') ?? '').trim();
  const requestId = String(formData.get('solicitacao_id') ?? '').trim();
  const method = String(formData.get('metodo') ?? '').trim() as ManualRefundMethod;
  const reason = String(formData.get('motivo') ?? '').trim() as ManualRefundReason;
  const amountInCents = parseCurrencyToCents(String(formData.get('valor') ?? ''));
  const reference = String(formData.get('referencia') ?? '').trim();
  const observation = String(formData.get('observacao') ?? '').trim();
  const confirmedOutsideProvider = formData.get('confirmado_fora_provedor') === 'sim';

  if (!UUID_PATTERN.test(cancellationId) || !UUID_PATTERN.test(requestId)) {
    return { status: 'error', message: 'Cancelamento inválido.' };
  }

  if (!VALID_METHODS.includes(method)) {
    return { status: 'error', message: 'Selecione um método válido.' };
  }

  if (!VALID_REASONS.includes(reason)) {
    return { status: 'error', message: 'Selecione um motivo válido.' };
  }

  if (!confirmedOutsideProvider) {
    return {
      status: 'error',
      message: 'Confirme que o valor já foi devolvido fora do painel.',
    };
  }

  if (amountInCents == null) {
    return { status: 'error', message: 'Informe um valor válido.' };
  }

  if (reference.length < 3 || reference.length > 200) {
    return {
      status: 'error',
      message: 'A referência deve ter entre 3 e 200 caracteres.',
    };
  }

  if (observation.length < 10 || observation.length > 1000) {
    return {
      status: 'error',
      message: 'A observação deve ter entre 10 e 1000 caracteres.',
    };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_registrar_reembolso_manual_v2', {
    cancelamento_id_input: cancellationId,
    metodo_input: method,
    motivo_input: reason,
    valor_centavos_input: amountInCents,
    referencia_input: reference,
    observacao_input: observation,
  });

  if (error) {
    console.error('Erro ao registrar reembolso manual:', {
      code: error.code,
      message: error.message,
      cancellationId,
    });
    return { status: 'error', message: getSafeRpcMessage(error.message) };
  }

  revalidatePath('/cancelamentos-pagamento');
  revalidatePath('/cancelamentos');
  revalidatePath(`/solicitacoes/${requestId}`);
  revalidatePath('/pagamentos');
  revalidatePath('/admin');

  return {
    status: 'success',
    message: 'Reembolso manual registrado. O status do provedor foi preservado.',
  };
}

export async function reopenPaymentReconciliation(
  _previousState: ManualRefundActionState,
  formData: FormData,
): Promise<ManualRefundActionState> {
  const paymentId = String(formData.get('pagamento_id') ?? '').trim();
  const reason = String(formData.get('motivo_reabertura') ?? '').trim();

  if (!UUID_PATTERN.test(paymentId)) {
    return { status: 'error', message: 'Pagamento inválido.' };
  }

  if (reason.length < 10 || reason.length > 500) {
    return {
      status: 'error',
      message: 'Informe uma justificativa entre 10 e 500 caracteres.',
    };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_reabrir_conciliacao_pagamento', {
    pagamento_id_input: paymentId,
    motivo_input: reason,
  });

  if (error) {
    console.error('Erro ao reabrir conciliação:', {
      code: error.code,
      message: error.message,
      paymentId,
    });
    return {
      status: 'error',
      message: 'Não foi possível reabrir a conciliação. Atualize a fila e tente novamente.',
    };
  }

  revalidatePath('/cancelamentos-pagamento');
  revalidatePath('/cancelamentos');
  revalidatePath('/pagamentos');
  revalidatePath('/admin');

  return {
    status: 'success',
    message: 'Conciliação reaberta para a próxima execução automática.',
  };
}

export async function retryAutomaticRefund(
  _previousState: ManualRefundActionState, formData: FormData,
): Promise<ManualRefundActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('reembolso_id') ?? '');
  const reason = String(formData.get('motivo') ?? '').trim();
  if (!UUID_PATTERN.test(id) || reason.length < 10 || reason.length > 500)
    return { status: 'error', message: 'Informe um reembolso válido e uma justificativa entre 10 e 500 caracteres.' };
  const { error } = await supabase.rpc('admin_reprocessar_reembolso_automatico',
    { reembolso_id_input: id, motivo_input: reason });
  if (error) return { status: 'error', message: error.code === 'PT429' ? 'Aguarde 30 minutos entre verificações. O limite é de três solicitações em 24 horas por cobrança.' : 'Não foi possível reprocessar. Atualize a página e confira se o reembolso ainda está em falha.' };
  revalidatePath('/cancelamentos-pagamento');
  revalidatePath('/cancelamentos');
  revalidatePath('/admin');
  return { status: 'success', message: 'Nova tentativa agendada. Acompanhe a confirmação nesta fila.' };
}

export async function requestCancellationVerification(_previous: ManualRefundActionState, formData: FormData): Promise<ManualRefundActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('pagamento_id') ?? '');
  const reason = String(formData.get('motivo') ?? '').trim();
  if (!UUID_PATTERN.test(id) || reason.length < 10 || reason.length > 500) return { status: 'error', message: 'Informe uma cobrança válida e uma justificativa entre 10 e 500 caracteres.' };
  const { error } = await supabase.rpc('admin_solicitar_verificacao_cancelamento', { pagamento_id_input: id, motivo_input: reason });
  if (error) return { status: 'error', message: error.code === 'PT429' ? 'Aguarde 30 minutos entre verificações. O limite é de três solicitações em 24 horas por cobrança.' : 'A verificação não pôde ser agendada. Atualize a página e confira a situação da cobrança.' };
  revalidatePath('/cancelamentos'); revalidatePath('/cancelamentos-pagamento'); revalidatePath('/admin');
  return { status: 'success', message: 'Verificação adicional agendada. O histórico e os limites automáticos foram preservados.' };
}
