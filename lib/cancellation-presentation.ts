export type CancellationCase = {
    sem_pagamento?: boolean;
    cobranca_em_acompanhamento?: boolean;
    situacao?: string;
    conciliacoes?: CancellationReconciliation[];
    solicitacao_id: string;
    cliente_nome: string;
    motorista_nome: string | null;
    origem: string;
    motivo: string;
    solicitada_em: string;
    automatica: boolean;
    status_operacional: string;
    iniciada_em: string | null;
    finalizada_em: string | null;
    reembolso: string;
    reembolso_decisao: string;
    repasse: string;
    repasse_valor_centavos: number | null;
    valor_reembolso_centavos: number;
    valor_devolvido_centavos: number;
    transferencia_id: string | null;
    repasse_composicao: {
        contratado: number;
        adicionais: number;
        total: number;
    } | null;
    eventos: {
        id: string;
        ator_id: string | null;
        evento: string;
        motivo: string;
        criado_em: string;
    }[];
    reembolsos: {
        id: string;
        pagamento_id: string;
        status: string;
        valor_centavos: number;
        ambiente: string;
        tentativas: number;
        ultimo_codigo: string | null;
        provedor_reembolso_id: string | null;
    }[];
};
export type CancellationReconciliation = {
  fase?: 'cobranca' | 'reembolso';
  pagamento_id: string; ambiente: string | null; rodadas: number; consultas: number; consultas_manuais: number;
  proxima_em: string | null; suspensa_em: string | null; codigo: string | null; status_provedor: string | null;
  manual_pendente: boolean; sem_ambiente: boolean;
};
export const cancellationLabels: Record<string, string> = {
  pendente: 'Aguardando decisão', aprovado: 'Aprovado', negado: 'Não aprovado',
  processando: 'Em processamento', pago: 'Concluído', falha: 'Precisa de atenção',
  reembolsado: 'Concluído', solicitado: 'Agendado',
};
export const originLabels: Record<string, string> = { usuario: 'Cliente', motorista: 'Motorista', sistema: 'Sistema' };
export const rideLabels: Record<string, string> = {
  cancelada: 'Cancelada', em_andamento: 'Em andamento', finalizada: 'Atendimento encerrado', concluida: 'Concluída', confirmada: 'Confirmada',
};
export const eventLabels: Record<string, string> = {
  cancelamento_registrado: 'Cancelamento registrado', motorista_liberou: 'Motorista liberou a corrida',
  reembolso_aprovado: 'Reembolso aprovado', reembolso_negado: 'Reembolso não aprovado',
  repasse_aprovado: 'Repasse aprovado', repasse_negado: 'Repasse não aprovado', repasse_pago: 'Transferência registrada',
  cobranca_conciliada: 'Situação da cobrança verificada',
  conciliacao_verificada: 'Verificação financeira registrada',
  conciliacao_notificada: 'Confirmação recebida do provedor',
  conciliacao_reprocessamento_admin: 'Verificação adicional solicitada',
};
export function casePresentation(c: CancellationCase) {
  const resolved = c.situacao === 'resolvido';
  const title = ({ analise: 'Aguardando decisão', processamento: 'Em processamento', atencao: 'Precisa de atenção', repasse: 'Transferência pendente', resolvido: 'Resolvido' } as Record<string,string>)[c.situacao ?? ''] ?? 'Acompanhamento';
  const refund = c.sem_pagamento ? 'Sem valor a devolver' : c.cobranca_em_acompanhamento && c.valor_reembolso_centavos === 0 ? 'Aguardando confirmação da cobrança' : cancellationLabels[c.reembolso] ?? c.reembolso;
  const payout = c.repasse === 'negado' && (c.automatica || !c.motorista_nome) ? 'Não se aplica' : cancellationLabels[c.repasse] ?? c.repasse;
  const processingTitle = c.cobranca_em_acompanhamento ? 'Conciliação de cobrança pendente' : c.reembolso_decisao === 'aprovado' && !c.sem_pagamento ? 'Reembolso em processamento' : title;
  return { resolved, title: c.situacao === 'processamento' ? processingTitle : title, refund, payout };
}
export function financialQueuePresentation(row: { status: string; resultado: string | null; pagamento_status_atual: string | null; pago_em: string | null; tratamento_financeiro: string }, isV2: boolean) {
  const unpaid = row.status === 'resolvida' && ['cobranca_cancelada','cobranca_expirada'].includes(row.resultado ?? '') && !row.pago_em && !['PAID','REFUNDED'].includes(row.pagamento_status_atual ?? '');
  return {
    unpaid,
    title: unpaid ? 'Sem valor a devolver' : row.status === 'resolvida' ? 'Resolvido' : isV2 ? 'Acompanhar cancelamento' : 'Aguardando tratamento',
    link: row.status === 'resolvida' ? 'Ver histórico do cancelamento' : 'Ver decisões e acompanhamento',
  };
}
