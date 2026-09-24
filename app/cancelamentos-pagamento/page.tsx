import { financialQueuePresentation } from '@/lib/cancellation-presentation';
import { RefreshButton } from '../cancelamentos/RefreshButton';
import { AutomaticRefundPanel, type AutomaticRefund } from './AutomaticRefundPanel';
import Link from 'next/link';
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCcw,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { requireAdmin } from '@/lib/auth';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import {
  listPaymentCancellations,
  type AdminQueueStatus,
} from '@/lib/admin-operations';
import { ManualRefundForm } from './ManualRefundForm';
import { RetryReconciliationForm } from './RetryReconciliationForm';

function formatCents(value?: number | null) {
  if (value == null) return '—';
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function normalizeStatus(value?: string): AdminQueueStatus {
  return value === 'resolvida' || value === 'todas' ? value : 'aberta';
}

function getSnapshotText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function paymentLabel(status?: string | null) {
  return ({ PAID: 'Confirmado', PENDING: 'Aguardando pagamento', REFUNDED: 'Reembolsado', EXPIRED: 'Expirado', CANCELLED: 'Cancelado' } as Record<string,string>)[status ?? ''] ?? status ?? 'Sem pagamento';
}
function getPaymentStatusStyle(status?: string | null) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    case 'REFUNDED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
    case 'EXPIRED':
    case 'CANCELLED':
      return 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

function getProviderLabel(provider?: string | null) {
  if (provider === 'mercadopago') return 'Mercado Pago';
  if (provider === 'abacatepay') return 'AbacatePay (legado)';
  return 'Sem cobrança criada';
}

function getProviderReference(cancellation: {
  mercadopago_payment_id: string | null;
  abacatepay_billing_id: string | null;
}) {
  return cancellation.mercadopago_payment_id ?? cancellation.abacatepay_billing_id;
}

export default async function PaymentCancellationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const cursor =
    params.cursor && !Number.isNaN(Date.parse(params.cursor)) ? params.cursor : undefined;
  const { supabase } = await requireAdmin();
  const queue = await listPaymentCancellations(supabase, status, cursor);
  const v2Cases = await supabase.rpc('admin_obter_cancelamentos_v2', { solicitacoes_input: queue.items.map(item => item.solicitacao_id) });
  const v2Ids = new Set<string>((v2Cases.data ?? []) as string[]);
  const paymentIds = queue.items.flatMap(item => item.pagamento_id ? [item.pagamento_id] : []);
  const refunds = paymentIds.length
    ? await supabase.rpc('admin_obter_reembolsos_automaticos', { pagamentos_input: paymentIds })
    : { data: [], error: null };
  const automaticRefunds = new Map<string, AutomaticRefund>(
    ((refunds.data ?? []) as AutomaticRefund[]).map(item => [item.pagamento_id, item]),
  );

  const filters: Array<{ value: AdminQueueStatus; label: string }> = [
    { value: 'aberta', label: 'Abertos' },
    { value: 'resolvida', label: 'Resolvidos' },
    { value: 'todas', label: 'Todos' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <BadgeDollarSign size={19} />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Fila financeira
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Fila de reembolsos
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
              Acompanhe devoluções e cobranças em conciliação. As decisões ficam na tela de Cancelamentos.
            </p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {queue.items.length} registro(s) nesta página
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <RefreshButton />
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={`/cancelamentos-pagamento?status=${filter.value}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === filter.value
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {(refunds.error || v2Cases.error) && <p role="alert" className="mb-4 rounded border border-red-300 p-4">Não foi possível consultar os reembolsos automáticos. Atualize a página. Os registros manuais estão temporariamente bloqueados.</p>}
        {queue.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {queue.error} Confirme se as migrations mais recentes foram aplicadas.
          </div>
        )}

        <div className="space-y-5">
          {queue.items.map((cancellation) => {
            const snapshotStatus = getSnapshotText(
              cancellation.snapshot_financeiro,
              'pagamento_status',
            );
            const automaticRefund = cancellation.pagamento_id ? automaticRefunds.get(cancellation.pagamento_id) : undefined;
            const isV2 = v2Ids.has(cancellation.solicitacao_id);
            const presentation = financialQueuePresentation(cancellation, isV2);
            const canRegisterManualRefund = !v2Cases.error && !isV2 && !refunds.error && !automaticRefund &&
              cancellation.status === 'aberta' &&
              cancellation.tratamento_financeiro === 'reembolso' &&
              cancellation.pagamento_status_atual === 'PAID' &&
              cancellation.valor_centavos != null;
            const providerReference = getProviderReference(cancellation);
            const canRetryReconciliation =
              cancellation.status === 'aberta' &&
              cancellation.pagamento_status_atual === 'PENDING' &&
              Boolean(cancellation.conciliacao_encerrada_em) &&
              Boolean(cancellation.pagamento_id) &&
              Boolean(providerReference);

            return (
              <article
                key={cancellation.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cancellation.status === 'aberta'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {cancellation.status === 'aberta' ? (
                          <Clock3 size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {presentation.title}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cancellation.tratamento_financeiro === 'reembolso'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {presentation.unpaid ? 'Sem pagamento' : cancellation.tratamento_financeiro === 'reembolso' ? 'Reembolso' : 'Acompanhar cobrança'}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {cancellation.usuario_nome ?? 'Cliente não identificado'}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {cancellation.motivo}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Criado em {formatDateTime(cancellation.criada_em)}
                    </p>
                  </div>

                  <Link
                    href={`/solicitacoes/${cancellation.solicitacao_id}`}
                    className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ver solicitação {cancellation.solicitacao_id.slice(0, 8)}…
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-500">Status financeiro atual</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(
                        cancellation.pagamento_status_atual,
                      )}`}
                    >
                      {paymentLabel(cancellation.pagamento_status_atual)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Status no cancelamento</p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {snapshotStatus ? paymentLabel(snapshotStatus) : 'Sem confirmação'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{presentation.unpaid ? 'Valor previsto (não pago)' : 'Valor do pagamento'}</p>
                    <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCents(cancellation.valor_centavos)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">
                      {getProviderLabel(cancellation.provedor)} / referência
                    </p>
                    <p
                      className="mt-1 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300"
                      title={providerReference ?? undefined}
                    >
                      {providerReference ?? '—'}
                    </p>
                    {cancellation.mercadopago_environment && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Ambiente: {cancellation.mercadopago_environment}
                      </p>
                    )}
                    {cancellation.mercadopago_status_detail && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Detalhe: {cancellation.mercadopago_status_detail}
                      </p>
                    )}
                  </div>
                </div>

                {presentation.unpaid && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Cancelamento encerrado sem pagamento confirmado. Nenhum reembolso foi necessário. O registro permanece no histórico.</p>}
                {isV2 && <Link href={'/cancelamentos?id=' + cancellation.solicitacao_id} className="mt-4 block rounded border border-blue-400 p-4 font-semibold text-blue-700 dark:text-blue-300">{presentation.link}</Link>}
                {canRetryReconciliation && cancellation.pagamento_id && (
                  <RetryReconciliationForm paymentId={cancellation.pagamento_id} />
                )}

                {cancellation.status === 'aberta' &&
                  cancellation.tratamento_financeiro === 'acompanhar_cobranca' && (
                    <div className="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                      <RefreshCcw className="mt-0.5 shrink-0" size={17} />
                      <p>
                        A cobrança ainda está pendente. A conciliação automática poderá
                        expirar/cancelar a fila ou convertê-la em reembolso se o provedor
                        confirmar o pagamento.
                      </p>
                    </div>
                  )}

                {cancellation.status === 'aberta' &&
                  cancellation.tratamento_financeiro === 'reembolso' &&
                  !canRegisterManualRefund && !isV2 && (
                    <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      <CircleAlert className="mt-0.5 shrink-0" size={17} />
                      <p>
                        O registro manual só é liberado quando o pagamento estiver confirmado.
                        Atualize a fila após a conciliação antes de prosseguir.
                      </p>
                    </div>
                  )}

                {automaticRefund && <AutomaticRefundPanel refund={automaticRefund} />}
                {canRegisterManualRefund && (
                  <ManualRefundForm
                    cancellationId={cancellation.id}
                    requestId={cancellation.solicitacao_id}
                    amountInCents={cancellation.valor_centavos ?? 0}
                  />
                )}

                {cancellation.reembolso_manual && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
                    <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 size={17} />
                      Reembolso manual auditado
                    </div>
                    <dl className="mt-3 grid gap-3 text-emerald-900 dark:text-emerald-200 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-xs opacity-70">Motivo</dt>
                        <dd className="mt-1 font-medium">
                          {cancellation.reembolso_manual.motivo.replaceAll('_', ' ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-70">Método / valor</dt>
                        <dd className="mt-1 font-medium">
                          {cancellation.reembolso_manual.metodo.replaceAll('_', ' ')} ·{' '}
                          {formatCents(cancellation.reembolso_manual.valor_centavos)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-70">Administrador / data</dt>
                        <dd className="mt-1 font-medium">
                          {cancellation.reembolso_manual.administrador_nome ?? 'Administrador'} ·{' '}
                          {formatDateTime(cancellation.reembolso_manual.realizado_em)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-70">Referência</dt>
                        <dd className="mt-1 font-mono text-xs">
                          {cancellation.reembolso_manual.referencia}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs opacity-70">Status do provedor preservado</dt>
                        <dd className="mt-1 font-medium">
                          {cancellation.reembolso_manual.status_pagamento_no_registro}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-emerald-800 dark:text-emerald-300">
                      {cancellation.reembolso_manual.observacao}
                    </p>
                  </div>
                )}

                {cancellation.status === 'resolvida' && !cancellation.reembolso_manual && (
                  <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Resultado: {cancellation.resultado === 'reembolso_negado' ? 'Reembolso não aprovado' : cancellation.resultado?.replaceAll('_', ' ') ?? '—'} ·{' '}
                    {formatDateTime(cancellation.resolvida_em)}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {!queue.error && queue.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
            <p className="mt-3 font-medium text-zinc-800 dark:text-zinc-200">
              Nenhum cancelamento nesta fila.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          {cursor ? (
            <Link
              href={`/cancelamentos-pagamento?status=${status}`}
              className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
            >
              Voltar ao início
            </Link>
          ) : (
            <span />
          )}
          {queue.nextCursor && queue.items.length === queue.limit && (
            <Link
              href={`/cancelamentos-pagamento?status=${status}&cursor=${encodeURIComponent(
                queue.nextCursor,
              )}`}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Carregar mais antigos
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
