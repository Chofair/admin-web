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
              Cancelamentos e reembolsos
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
              Acompanhe cobranças canceladas antes do aceite e registre reembolsos
              manuais com comprovante. O status exibido da AbacatePay continua sendo o
              status real do provedor.
            </p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {queue.items.length} registro(s) nesta página
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
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
            const canRegisterManualRefund =
              cancellation.status === 'aberta' &&
              cancellation.tratamento_financeiro === 'reembolso' &&
              cancellation.pagamento_status_atual === 'PAID' &&
              cancellation.valor_centavos != null;

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
                        {cancellation.status === 'aberta' ? 'Aguardando tratamento' : 'Resolvido'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cancellation.tratamento_financeiro === 'reembolso'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {cancellation.tratamento_financeiro === 'reembolso'
                          ? 'Reembolso'
                          : 'Acompanhar cobrança'}
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
                    <p className="text-xs text-zinc-500">Status AbacatePay atual</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusStyle(
                        cancellation.pagamento_status_atual,
                      )}`}
                    >
                      {cancellation.pagamento_status_atual ?? '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Status no cancelamento</p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {snapshotStatus ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Valor</p>
                    <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCents(cancellation.valor_centavos)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Billing ID</p>
                    <p
                      className="mt-1 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300"
                      title={cancellation.abacatepay_billing_id ?? undefined}
                    >
                      {cancellation.abacatepay_billing_id ?? '—'}
                    </p>
                  </div>
                </div>

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
                  !canRegisterManualRefund && (
                    <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      <CircleAlert className="mt-0.5 shrink-0" size={17} />
                      <p>
                        O registro manual só é liberado enquanto o pagamento estiver PAID.
                        Atualize a fila após a conciliação antes de prosseguir.
                      </p>
                    </div>
                  )}

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
                    Resultado: {cancellation.resultado?.replaceAll('_', ' ') ?? '—'} ·{' '}
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
