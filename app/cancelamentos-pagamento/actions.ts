'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type { ManualRefundMethod } from '@/lib/admin-operations';

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

function parseCurrencyToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function getSafeRpcMessage(message: string) {
  const knownMessages = [
    'Este cancelamento nao esta aguardando reembolso',
    'O pagamento nao esta PAID na AbacatePay; aguarde a conciliacao antes do registro manual',
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
  const amountInCents = parseCurrencyToCents(String(formData.get('valor') ?? ''));
  const reference = String(formData.get('referencia') ?? '').trim();
  const observation = String(formData.get('observacao') ?? '').trim();

  if (!UUID_PATTERN.test(cancellationId) || !UUID_PATTERN.test(requestId)) {
    return { status: 'error', message: 'Cancelamento inválido.' };
  }

  if (!VALID_METHODS.includes(method)) {
    return { status: 'error', message: 'Selecione um método válido.' };
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
  const { error } = await supabase.rpc('admin_registrar_reembolso_manual', {
    cancelamento_id_input: cancellationId,
    metodo_input: method,
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
  revalidatePath(`/solicitacoes/${requestId}`);
  revalidatePath('/pagamentos');
  revalidatePath('/admin');

  return {
    status: 'success',
    message:
      'Reembolso manual registrado. O status da AbacatePay foi preservado.',
  };
}
