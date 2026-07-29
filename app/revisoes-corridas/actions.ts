'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type { RideReviewDecision } from '@/lib/admin-operations';

export type ReviewActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_DECISIONS: RideReviewDecision[] = [
  'manter_cobranca',
  'isentar_excedente_cliente',
];

function getSafeRpcMessage(message: string) {
  const knownMessages = [
    'A corrida nao possui excedente para isentar',
    'O excedente ja foi pago; trate o estorno antes de conceder a isencao',
    'Existe uma cobranca de excedente pendente; aguarde a conciliacao antes de conceder a isencao',
    'A corrida nao possui uma revisao aberta',
    'Revisao nao encontrada',
  ];

  return (
    knownMessages.find((knownMessage) => message.includes(knownMessage)) ??
    'Não foi possível resolver a revisão. Atualize a fila e tente novamente.'
  );
}

export async function resolveRideReview(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const requestId = String(formData.get('solicitacao_id') ?? '').trim();
  const decision = String(formData.get('decisao') ?? '').trim() as RideReviewDecision;
  const observation = String(formData.get('observacao') ?? '').trim();

  if (!UUID_PATTERN.test(requestId)) {
    return { status: 'error', message: 'Solicitação inválida.' };
  }

  if (!VALID_DECISIONS.includes(decision)) {
    return { status: 'error', message: 'Selecione uma decisão válida.' };
  }

  if (observation.length < 10 || observation.length > 1000) {
    return {
      status: 'error',
      message: 'A observação deve ter entre 10 e 1000 caracteres.',
    };
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_resolver_revisao_corrida', {
    solicitacao_id_input: requestId,
    decisao_input: decision,
    observacao_input: observation,
  });

  if (error) {
    console.error('Erro ao resolver revisão de corrida:', {
      code: error.code,
      message: error.message,
      requestId,
    });
    return { status: 'error', message: getSafeRpcMessage(error.message) };
  }

  revalidatePath('/revisoes-corridas');
  revalidatePath(`/solicitacoes/${requestId}`);
  revalidatePath('/solicitacoes');
  revalidatePath('/admin');

  return {
    status: 'success',
    message: 'Revisão resolvida e registrada na auditoria.',
  };
}
