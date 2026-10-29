import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3, ReceiptText } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { requireAdmin } from '@/lib/auth';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import {
  listRideReviews,
  type AdminQueueStatus,
  type RideReviewItem,
} from '@/lib/admin-operations';
import { ReviewResolutionForm } from './ReviewResolutionForm';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrency(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

function hasPendingOvertimePayment(review: RideReviewItem) {
  return review.pagamentos.some(
    (payment) => payment.tipo_pagamento === 'excedente' && payment.status === 'PENDING',
  );
}

function hasPaidOvertimePayment(review: RideReviewItem) {
  return review.pagamentos.some(
    (payment) => payment.tipo_pagamento === 'excedente' && payment.status === 'PAID',
  );
}

export default async function RideReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const cursor =
    params.cursor && !Number.isNaN(Date.parse(params.cursor)) ? params.cursor : undefined;
  const { supabase } = await requireAdmin();
  const queue = await listRideReviews(supabase, status, cursor);

  const filters: Array<{ value: AdminQueueStatus; label: string }> = [
    { value: 'aberta', label: 'Abertas' },
    { value: 'resolvida', label: 'Resolvidas' },
    { value: 'todas', label: 'Todas' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle size={18} />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Operação auditável
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Revisões de corridas
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
              Analise divergências de encerramento e excedente. A decisão é aplicada
              atomicamente pelo RPC administrativo e preserva o repasse calculado do
              motorista.
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
              href={`/revisoes-corridas?status=${filter.value}`}
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
          {queue.items.map((review) => {
            const overtimePending = hasPendingOvertimePayment(review);
            const overtimePaid = hasPaidOvertimePayment(review);
            const canExemptOvertime =
              (review.preco_tempo_excedido ?? 0) > 0 && !overtimePending && !overtimePaid;

            return (
              <article
                key={review.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          review.revisao_status === 'aberta'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {review.revisao_status === 'aberta' ? (
                          <Clock3 size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        {review.revisao_status === 'aberta' ? 'Aguardando decisão' : 'Resolvida'}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Aberta em {formatDateTime(review.criada_em)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {review.usuario_nome ?? 'Cliente não identificado'}
                      <span className="font-normal text-zinc-400"> · </span>
                      {review.motorista_nome ?? 'Sem motorista'}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      Solicitado por {review.solicitante_nome ?? review.solicitante_papel ?? '—'}:
                      {' “'}
                      {review.motivo}
                      {'”'}
                    </p>
                  </div>

                  <Link
                    href={`/solicitacoes/${review.solicitacao_id}`}
                    className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ver solicitação {review.solicitacao_id.slice(0, 8)}…
                  </Link>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-950 sm:grid-cols-3 lg:grid-cols-6">
                  <div>
                    <dt className="text-zinc-500">Serviço</dt>
                    <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {formatDate(review.data_servico)} · {review.horario_inicio}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Tempo real</dt>
                    <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {review.tempo_real_minutos ?? '—'} min
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Excedente</dt>
                    <dd className="mt-1 font-medium text-orange-700 dark:text-orange-400">
                      {review.tempo_excedido_minutos ?? 0} min ·{' '}
                      {formatCurrency(review.preco_tempo_excedido)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Valor inicial</dt>
                    <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(review.preco_total)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Total final</dt>
                    <dd className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(review.preco_final)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Motorista</dt>
                    <dd className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(review.preco_motorista_final ?? review.preco_motorista)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    <ReceiptText size={16} />
                    Pagamentos vinculados
                  </h3>
                  {review.pagamentos.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nenhum pagamento encontrado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {review.pagamentos.map((payment) => (
                        <span
                          key={payment.id}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          <strong className="capitalize">{payment.tipo_pagamento}</strong>
                          {' · '}
                          {payment.status}
                          {' · '}
                          {formatCents(payment.valor_centavos)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {review.revisao_status === 'aberta' && (
                  <>
                    {!canExemptOvertime && (review.preco_tempo_excedido ?? 0) > 0 && (
                      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        A isenção está indisponível porque o excedente já foi pago ou ainda
                        possui cobrança pendente. O banco também bloqueará qualquer tentativa
                        concorrente.
                      </p>
                    )}
                    <ReviewResolutionForm
                      requestId={review.solicitacao_id}
                      canExemptOvertime={canExemptOvertime}
                    />
                  </>
                )}

                {review.revisao_status === 'resolvida' && (
                  <div className="mt-5 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {review.decisao === 'isentar_excedente_cliente'
                        ? 'Excedente isentado'
                        : 'Cobrança mantida'}
                    </p>
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      {review.observacao_admin} · {review.revisor_nome ?? 'Administrador'} em{' '}
                      {formatDateTime(review.resolvida_em)}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!queue.error && queue.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
            <p className="mt-3 font-medium text-zinc-800 dark:text-zinc-200">
              Nenhuma revisão nesta fila.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          {cursor ? (
            <Link
              href={`/revisoes-corridas?status=${status}`}
              className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
            >
              Voltar ao início
            </Link>
          ) : (
            <span />
          )}
          {queue.nextCursor && queue.items.length === queue.limit && (
            <Link
              href={`/revisoes-corridas?status=${status}&cursor=${encodeURIComponent(
                queue.nextCursor,
              )}`}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Carregar mais antigas
            </Link>
          )}
        </div>
      </main>
    </NavBar></div>
  );
}
