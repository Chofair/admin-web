import 'server-only';

import type { createSupabaseServerClient } from '@/lib/supabase-server';

export type AdminQueueStatus = 'aberta' | 'resolvida' | 'todas';
export type RideReviewDecision = 'manter_cobranca' | 'isentar_excedente_cliente';
export type PaymentProvider = 'mercadopago' | 'abacatepay' | 'sem_provedor';
export type PaymentEnvironment = 'sandbox' | 'production';
export type AdminRequestStatus =
  | 'aguardando_pagamento'
  | 'pagamento_expirado'
  | 'pendente'
  | 'confirmada'
  | 'em_andamento'
  | 'finalizada'
  | 'concluida'
  | 'cancelada';
export type AdminPayoutStatus = 'pendente' | 'pago' | 'cancelado';
export type ManualRefundMethod =
  | 'pix'
  | 'transferencia_bancaria'
  | 'dinheiro'
  | 'credito_em_conta'
  | 'outro';
export type ManualRefundReason =
  | 'cancelamento_solicitacao'
  | 'pagamento_duplicado'
  | 'cobranca_indevida'
  | 'falha_operacional'
  | 'acordo_com_cliente'
  | 'outro';

export type PaymentSummary = {
  id: string;
  tipo_pagamento: 'inicial' | 'excedente';
  status: string;
  valor_centavos: number;
  abacatepay_billing_id: string | null;
  mercadopago_payment_id: string | null;
  created_at: string;
  pago_em: string | null;
};

export type RideReviewItem = {
  id: string;
  solicitacao_id: string;
  revisao_status: 'aberta' | 'resolvida';
  motivo: string;
  solicitante_id: string | null;
  solicitante_papel: 'usuario' | 'motorista' | null;
  solicitante_nome: string | null;
  criada_em: string;
  decisao: RideReviewDecision | null;
  observacao_admin: string | null;
  resolvida_em: string | null;
  resolvida_por: string | null;
  revisor_nome: string | null;
  snapshot_financeiro: Record<string, unknown>;
  resultado_financeiro: Record<string, unknown>;
  corrida_status: string;
  usuario_id: string;
  usuario_nome: string | null;
  motorista_id: string | null;
  motorista_nome: string | null;
  tipo_solicitacao: string;
  data_servico: string;
  horario_inicio: string;
  horario_fim: string;
  iniciada_em: string | null;
  finalizada_em: string | null;
  finalizada_por: string | null;
  tempo_real_minutos: number | null;
  tempo_excedido_minutos: number | null;
  preco_total: number | null;
  preco_tempo_excedido: number | null;
  preco_final: number | null;
  preco_motorista: number | null;
  preco_motorista_final: number | null;
  pagamentos: PaymentSummary[];
};

export type ManualRefundRecord = {
  id: string;
  metodo: ManualRefundMethod;
  motivo: ManualRefundReason;
  administrador_id?: string;
  administrador_nome: string | null;
  realizado_em: string;
  valor_centavos: number;
  referencia: string;
  observacao: string;
  status_pagamento_no_registro: string;
};

export type PaymentCancellationItem = {
  id: string;
  solicitacao_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  pagamento_id: string | null;
  tratamento_financeiro: 'acompanhar_cobranca' | 'reembolso';
  status: 'aberta' | 'resolvida';
  motivo: string;
  criada_em: string;
  resolvida_em: string | null;
  resultado: 'cobranca_cancelada' | 'cobranca_expirada' | 'reembolsado' | null;
  snapshot_financeiro: Record<string, unknown>;
  pagamento_status_atual: string | null;
  valor_centavos: number | null;
  provedor: PaymentProvider | null;
  metodos: string[];
  abacatepay_billing_id: string | null;
  mercadopago_payment_id: string | null;
  mercadopago_status_detail: string | null;
  mercadopago_environment: PaymentEnvironment | null;
  pago_em: string | null;
  conciliacao_verificada_em: string | null;
  conciliacao_tentativas: number;
  conciliacao_nao_encontrado_tentativas: number;
  conciliacao_encerrada_em: string | null;
  conciliacao_motivo: string | null;
  reembolso_manual: ManualRefundRecord | null;
};

export type AdminPaymentItem = {
  id: string;
  solicitacao_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  tipo_solicitacao: string | null;
  tipo_pagamento: 'inicial' | 'excedente';
  status: string;
  valor_centavos: number;
  metodos: string[];
  provedor: PaymentProvider;
  abacatepay_billing_id: string | null;
  mercadopago_payment_id: string | null;
  mercadopago_status_detail: string | null;
  mercadopago_environment: PaymentEnvironment | null;
  url_pagamento: string | null;
  created_at: string;
  pago_em: string | null;
  conciliacao_verificada_em: string | null;
  conciliacao_tentativas: number;
  conciliacao_nao_encontrado_tentativas: number;
  conciliacao_encerrada_em: string | null;
  conciliacao_motivo: string | null;
};

export type RideReviewContext = {
  id: string;
  status: 'aberta' | 'resolvida';
  motivo: string;
  solicitante_papel: string | null;
  solicitante_nome: string | null;
  criada_em: string;
  decisao: RideReviewDecision | null;
  observacao_admin: string | null;
  resolvida_em: string | null;
  revisor_nome: string | null;
  snapshot_financeiro: Record<string, unknown>;
  resultado_financeiro: Record<string, unknown>;
};

export type PaymentCancellationContext = {
  id: string;
  tratamento_financeiro: 'acompanhar_cobranca' | 'reembolso';
  status: 'aberta' | 'resolvida';
  motivo: string;
  criada_em: string;
  resolvida_em: string | null;
  resultado: string | null;
  snapshot_financeiro: Record<string, unknown>;
};

export type RequestAdminContext = {
  revisao: RideReviewContext | null;
  cancelamento: PaymentCancellationContext | null;
  reembolso_manual: ManualRefundRecord | null;
};

export type AdminRequestDetail = {
  request: Record<string, unknown>;
  addresses: Record<string, unknown>[];
  payout: Record<string, unknown> | null;
};

export type AdminRequestListItem = {
  id: string;
  usuario_id: string;
  motorista_id: string | null;
  tipo_solicitacao: string;
  data_servico: string;
  horario_inicio: string;
  horario_fim: string;
  duracao_horas: number;
  status: AdminRequestStatus;
  preco_total: number | null;
  preco_final: number | null;
  preco_motorista: number | null;
  preco_tempo_excedido: number | null;
  revisao_solicitada_em: string | null;
  created_at: string;
};

export type AdminPayoutItem = {
  id: string;
  solicitacao_id: string;
  motorista_id: string;
  valor: number;
  status: AdminPayoutStatus;
  pago_em: string | null;
  created_at: string;
  solicitacoes: {
    preco_total: number | null;
    preco_final: number | null;
    tipo_solicitacao: string;
    data_servico: string;
  };
  driver_profiles: { chave_pix: string | null } | null;
};

export type OperationalAlerts = {
  revisoes_corridas_abertas: number;
  cancelamentos_abertos: number;
  reembolsos_manuais_pendentes: number;
  pagamentos_pendentes_conciliacao: number;
  conciliacoes_encerradas_pendentes: number;
};

export type QueueResult<T> = {
  items: T[];
  nextCursor: string | null;
  limit: number;
  error: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseQueue<T>(value: unknown): Omit<QueueResult<T>, 'error'> {
  if (!isRecord(value)) {
    return { items: [], nextCursor: null, limit: 50 };
  }

  return {
    items: Array.isArray(value.items) ? (value.items as T[]) : [],
    nextCursor: typeof value.next_cursor === 'string' ? value.next_cursor : null,
    limit: toSafeNumber(value.limit) || 50,
  };
}

function parseAdminList<T>(value: unknown): { items: T[]; total: number } {
  if (!isRecord(value)) return { items: [], total: 0 };

  const parsedTotal = Number(value.total ?? 0);
  return {
    items: Array.isArray(value.items) ? (value.items as T[]) : [],
    total: Number.isFinite(parsedTotal) ? parsedTotal : 0,
  };
}

export async function listRideReviews(
  supabase: SupabaseServerClient,
  status: AdminQueueStatus,
  cursor?: string,
): Promise<QueueResult<RideReviewItem>> {
  const { data, error } = await supabase.rpc('admin_listar_revisoes_corridas', {
    status_input: status,
    limite_input: 50,
    antes_de_input: cursor ?? null,
  });

  if (error) {
    console.error('Erro ao listar revisões de corridas:', {
      code: error.code,
      message: error.message,
    });
    return {
      items: [],
      nextCursor: null,
      limit: 50,
      error: 'Não foi possível carregar a fila de revisões.',
    };
  }

  return { ...parseQueue<RideReviewItem>(data), error: null };
}

export async function listPaymentCancellations(
  supabase: SupabaseServerClient,
  status: AdminQueueStatus,
  cursor?: string,
): Promise<QueueResult<PaymentCancellationItem>> {
  const { data, error } = await supabase.rpc('admin_listar_cancelamentos_pagamento', {
    status_input: status,
    limite_input: 50,
    antes_de_input: cursor ?? null,
  });

  if (error) {
    console.error('Erro ao listar cancelamentos financeiros:', {
      code: error.code,
      message: error.message,
    });
    return {
      items: [],
      nextCursor: null,
      limit: 50,
      error: 'Não foi possível carregar a fila de cancelamentos e reembolsos.',
    };
  }

  return { ...parseQueue<PaymentCancellationItem>(data), error: null };
}

export async function listAdminPayments(
  supabase: SupabaseServerClient,
  status: string | undefined,
  provider: PaymentProvider | undefined,
  environment: PaymentEnvironment | undefined,
  cursor?: string,
): Promise<QueueResult<AdminPaymentItem>> {
  const { data, error } = await supabase.rpc('admin_listar_pagamentos', {
    status_input: status ?? 'todos',
    provedor_input: provider ?? 'todos',
    ambiente_input: environment ?? 'todos',
    limite_input: 50,
    antes_de_input: cursor ?? null,
  });

  if (error) {
    console.error('Erro ao listar pagamentos administrativos:', {
      code: error.code,
      message: error.message,
    });
    return {
      items: [],
      nextCursor: null,
      limit: 50,
      error: 'Não foi possível carregar os pagamentos.',
    };
  }

  return { ...parseQueue<AdminPaymentItem>(data), error: null };
}

export async function getAdminRequestPayments(
  supabase: SupabaseServerClient,
  requestId: string,
): Promise<{ items: AdminPaymentItem[]; error: string | null }> {
  const { data, error } = await supabase.rpc('admin_obter_pagamentos_solicitacao', {
    solicitacao_id_input: requestId,
  });

  if (error) {
    console.error('Erro ao carregar pagamentos da solicitação:', {
      code: error.code,
      message: error.message,
      requestId,
    });
    return { items: [], error: 'Não foi possível carregar os pagamentos.' };
  }

  return { items: Array.isArray(data) ? (data as AdminPaymentItem[]) : [], error: null };
}

export async function getAdminRequestDetail(
  supabase: SupabaseServerClient,
  requestId: string,
): Promise<AdminRequestDetail | null> {
  const { data, error } = await supabase.rpc('admin_obter_detalhe_solicitacao', {
    solicitacao_id_input: requestId,
  });

  if (error) {
    console.error('Erro ao carregar detalhe administrativo da solicitacao:', {
      code: error.code,
      message: error.message,
      requestId,
    });
    throw new Error('Nao foi possivel carregar o detalhe da solicitacao.');
  }

  if (!isRecord(data) || !isRecord(data.solicitacao)) return null;

  return {
    request: data.solicitacao,
    addresses: Array.isArray(data.enderecos)
      ? (data.enderecos as Record<string, unknown>[])
      : [],
    payout: isRecord(data.repasse) ? data.repasse : null,
  };
}

export async function listAdminRequests(
  supabase: SupabaseServerClient,
  options: {
    statuses?: AdminRequestStatus[];
    userId?: string;
    driverId?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { data, error } = await supabase.rpc('admin_listar_solicitacoes', {
    status_input: options.statuses ?? null,
    usuario_id_input: options.userId ?? null,
    motorista_id_input: options.driverId ?? null,
    limite_input: options.limit ?? 50,
    deslocamento_input: options.offset ?? 0,
  });

  if (error) {
    console.error('Erro ao listar solicitacoes administrativas:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel listar as solicitacoes administrativas.');
  }

  return parseAdminList<AdminRequestListItem>(data);
}

export async function countAdminRequests(
  supabase: SupabaseServerClient,
  statuses?: AdminRequestStatus[],
) {
  return (await listAdminRequests(supabase, { statuses, limit: 1 })).total;
}

export async function listAdminPayouts(
  supabase: SupabaseServerClient,
  options: {
    status?: AdminPayoutStatus;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { data, error } = await supabase.rpc('admin_listar_repasses', {
    status_input: options.status ?? null,
    limite_input: options.limit ?? 50,
    deslocamento_input: options.offset ?? 0,
  });

  if (error) {
    console.error('Erro ao listar repasses administrativos:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel listar os repasses administrativos.');
  }

  return parseAdminList<AdminPayoutItem>(data);
}

export async function getRequestAdminContext(
  supabase: SupabaseServerClient,
  requestId: string,
): Promise<RequestAdminContext | null> {
  const { data, error } = await supabase.rpc('admin_obter_contexto_solicitacao', {
    solicitacao_id_input: requestId,
  });

  if (error) {
    console.error('Erro ao carregar contexto administrativo da solicitação:', {
      code: error.code,
      message: error.message,
      requestId,
    });
    return null;
  }

  if (!isRecord(data)) return null;

  return {
    revisao: isRecord(data.revisao) ? (data.revisao as RideReviewContext) : null,
    cancelamento: isRecord(data.cancelamento)
      ? (data.cancelamento as PaymentCancellationContext)
      : null,
    reembolso_manual: isRecord(data.reembolso_manual)
      ? (data.reembolso_manual as ManualRefundRecord)
      : null,
  };
}

export async function getOperationalAlerts(
  supabase: SupabaseServerClient,
): Promise<{ data: OperationalAlerts; error: boolean }> {
  const empty: OperationalAlerts = {
    revisoes_corridas_abertas: 0,
    cancelamentos_abertos: 0,
    reembolsos_manuais_pendentes: 0,
    pagamentos_pendentes_conciliacao: 0,
    conciliacoes_encerradas_pendentes: 0,
  };

  const { data, error } = await supabase.rpc('admin_obter_alertas_operacionais');

  if (error) {
    console.error('Erro ao carregar alertas operacionais:', {
      code: error.code,
      message: error.message,
    });
    return { data: empty, error: true };
  }

  if (!isRecord(data)) return { data: empty, error: true };

  return {
    data: {
      revisoes_corridas_abertas: toSafeNumber(data.revisoes_corridas_abertas),
      cancelamentos_abertos: toSafeNumber(data.cancelamentos_abertos),
      reembolsos_manuais_pendentes: toSafeNumber(data.reembolsos_manuais_pendentes),
      pagamentos_pendentes_conciliacao: toSafeNumber(
        data.pagamentos_pendentes_conciliacao,
      ),
      conciliacoes_encerradas_pendentes: toSafeNumber(
        data.conciliacoes_encerradas_pendentes,
      ),
    },
    error: false,
  };
}
