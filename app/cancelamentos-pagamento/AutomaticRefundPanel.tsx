import { formatAdminDateTime } from '@/lib/admin-format';
import { RetryAutomaticRefundForm } from './RetryAutomaticRefundForm';
import AuditEventAccordion from '@/components/AuditEventAccordion';
export type AutomaticRefund = {
  id: string; pagamento_id: string; status: 'solicitado' | 'processando' | 'reembolsado' | 'falha';
  ambiente: string; valor_centavos: number; tentativas: number; ultimo_codigo: string | null;
  provedor_reembolso_id: string | null; atualizada_em: string;
  eventos: { status: string; codigo: string | null; criada_em: string; observacao: string | null; administrador_id: string | null }[];
};
export function AutomaticRefundPanel({ refund }: { refund: AutomaticRefund }) {
  const labels = { solicitado: 'Reembolso solicitado', processando: 'Reembolso em processamento',
    reembolsado: 'Reembolso confirmado', falha: 'Reembolso precisa de atenção' };
  return <section className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-zinc-900 dark:border-blue-900 dark:bg-blue-950 dark:text-zinc-100">
    <p className="font-semibold">{labels[refund.status]}</p>
    <p className="mt-1">Devolução integral por cancelamento sem aceite: {(refund.valor_centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
    <p className="mt-1">Ambiente: {refund.ambiente === 'production' ? 'Produção' : 'Sandbox'} · Tentativas registradas: {refund.tentativas}</p>
    <p className="mt-1">Atualizado em: {formatAdminDateTime(refund.atualizada_em)}</p>
    {refund.provedor_reembolso_id && <p>Referência do reembolso: {refund.provedor_reembolso_id}</p>}
    {refund.status !== 'reembolsado' && <p className="mt-2">A confirmação depende do Mercado Pago. O registro manual está bloqueado para evitar devolução duplicada.</p>}
    {refund.ultimo_codigo && <p className="mt-2">Diagnóstico: {refund.ultimo_codigo}</p>}
    {refund.eventos.length > 0 && <div className="mt-3">
      <h3 className="font-medium">Histórico do processamento</h3>
      <ul className="mt-3 space-y-3">{refund.eventos.map((e, i) => <li key={i}>
        <AuditEventAccordion title={labels[e.status as keyof typeof labels] ?? e.status} metadata={formatAdminDateTime(e.criada_em)}>
          {e.codigo && <p className="break-all">Diagnóstico: {e.codigo}</p>}
          {e.observacao && <p className="whitespace-pre-wrap">{e.observacao}</p>}
          <p className="break-all text-xs text-zinc-600 dark:text-zinc-400">{e.administrador_id ? `Administrador: ${e.administrador_id}` : 'Processamento automático do sistema'}</p>
        </AuditEventAccordion>
      </li>)}</ul>
    </div>}
    {refund.status === 'falha' && <RetryAutomaticRefundForm refundId={refund.id} />}
  </section>;
}
