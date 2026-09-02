import Link from 'next/link';
import { BadgeDollarSign, RefreshCcw, TriangleAlert } from 'lucide-react';
import NavBar from '@/components/NavBar';
import SafeExternalLink from '@/components/SafeExternalLink';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import {
  listAdminPayouts,
  listAdminPayments,
  type AdminPayoutStatus,
  type AdminPaymentItem,
  type PaymentEnvironment,
  type PaymentProvider,
} from '@/lib/admin-operations';
import type { createSupabaseServerClient } from '@/lib/supabase-server';
import { confirmarRepasse, reverterRepasse } from './actions';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type PaymentRow = AdminPaymentItem;

type RepasseRow = {
  id: string;
  solicitacao_id: string;
  motorista_id: string;
  valor: number;
  status: string;
  pago_em: string | null;
  created_at: string;
  solicitacoes: {
    preco_total: number | null;
    preco_final: number | null;
    tipo_solicitacao: string;
    data_servico: string;
  } | null;
  driver_profiles: {
    chave_pix: string | null;
    profiles: { name: string | null } | null;
  } | null;
};

function formatCents(value?: number | null) {
  if (value == null) return '—';
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatReais(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  EXPIRED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
};

const validPaymentStatuses = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

const repasseStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  pago: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const validRepasseStatuses: AdminPayoutStatus[] = ['pendente', 'pago', 'cancelado'];

function getProviderLabel(provider: PaymentProvider) {
  if (provider === 'mercadopago') return 'Mercado Pago';
  if (provider === 'abacatepay') return 'AbacatePay (legado)';
  return 'Sem cobrança criada';
}

async function getRepasses(
  supabase: SupabaseServerClient,
  filter?: string,
): Promise<RepasseRow[]> {
  const status =
    filter && validRepasseStatuses.includes(filter as AdminPayoutStatus)
      ? (filter as AdminPayoutStatus)
      : undefined;
  const { items } = await listAdminPayouts(supabase, { status, limit: 50 });
  const payouts = items as unknown as RepasseRow[];
  const profiles = await getAdminProfilesByIds(
    supabase,
    payouts.map((payout) => payout.motorista_id),
  );
  const namesById = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return payouts.map((payout) => ({
    ...payout,
    driver_profiles: payout.driver_profiles
      ? {
          ...payout.driver_profiles,
          profiles: { name: namesById.get(payout.motorista_id) ?? null },
        }
      : null,
  }));
}

function ReconciliationCell({ payment }: { payment: PaymentRow }) {
  if (payment.conciliacao_encerrada_em) {
    return (
      <div className="max-w-64">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
          <TriangleAlert size={13} />
          Interrompida
        </span>
        <p className="mt-1 text-xs text-zinc-500">
          {formatDateTime(payment.conciliacao_encerrada_em)}
        </p>
        {payment.conciliacao_motivo && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            {payment.conciliacao_motivo}
          </p>
        )}
      </div>
    );
  }

  if (payment.conciliacao_verificada_em) {
    return (
      <div className="max-w-64 text-xs text-zinc-600 dark:text-zinc-300">
        <span className="inline-flex items-center gap-1 font-semibold">
          <RefreshCcw size={12} />
          {payment.conciliacao_tentativas} tentativa(s)
        </span>
        <p className="mt-1">{formatDateTime(payment.conciliacao_verificada_em)}</p>
        {payment.conciliacao_nao_encontrado_tentativas > 0 && (
          <p className="mt-1 text-amber-700 dark:text-amber-400">
            {payment.conciliacao_nao_encontrado_tentativas} não localizada(s)
          </p>
        )}
      </div>
    );
  }

  return (
    <span className="text-xs text-zinc-400">
      {payment.status === 'PENDING' ? 'Aguardando primeira verificação' : 'Não necessária'}
    </span>
  );
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    provider?: string;
    environment?: string;
    cursor?: string;
    repasseFilter?: string;
  }>;
}) {
  const { filter, provider, environment, cursor, repasseFilter } = await searchParams;
  const { supabase } = await requireAdmin();
  const safeStatus = filter && validPaymentStatuses.includes(filter) ? filter : undefined;
  const safeProvider = ['mercadopago', 'abacatepay', 'sem_provedor'].includes(provider ?? '')
    ? (provider as PaymentProvider)
    : undefined;
  const safeEnvironment = ['sandbox', 'production'].includes(environment ?? '')
    ? (environment as PaymentEnvironment)
    : undefined;
  const safeCursor = cursor && !Number.isNaN(Date.parse(cursor)) ? cursor : undefined;
  const [paymentQueue, payouts] = await Promise.all([
    listAdminPayments(supabase, safeStatus, safeProvider, safeEnvironment, safeCursor),
    getRepasses(supabase, repasseFilter),
  ]);
  const payments = paymentQueue.items;

  const filters = [
    { key: undefined, label: 'Todos' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'PAID', label: 'Pagos' },
    { key: 'EXPIRED', label: 'Expirados' },
    { key: 'CANCELLED', label: 'Cancelados' },
    { key: 'REFUNDED', label: 'Reembolsados' },
  ];

  const payoutFilters = [
    { key: undefined, label: 'Todos' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'pago', label: 'Pagos' },
    { key: 'cancelado', label: 'Cancelados' },
  ];

  const paidInitial = payments
    .filter((payment) => payment.status === 'PAID' && payment.tipo_pagamento === 'inicial')
    .reduce((total, payment) => total + payment.valor_centavos, 0);
  const paidOvertime = payments
    .filter((payment) => payment.status === 'PAID' && payment.tipo_pagamento === 'excedente')
    .reduce((total, payment) => total + payment.valor_centavos, 0);
  const pendingPayouts = payouts
    .filter((payout) => payout.status === 'pendente')
    .reduce((total, payout) => total + payout.valor, 0);
  const paidPayouts = payouts
    .filter((payout) => payout.status === 'pago')
    .reduce((total, payout) => total + payout.valor, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Pagamentos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {payments.length} registros nesta página · dados restritos a administradores
            </p>
          </div>
          <Link
            href="/cancelamentos-pagamento?status=aberta"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
          >
            <BadgeDollarSign size={17} />
            Cancelamentos e reembolsos
          </Link>
        </div>

        {paymentQueue.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {paymentQueue.error} Confirme se a migration financeira foi aplicada.
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Pagamentos iniciais PAID
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {formatCents(paidInitial)}
            </p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
              Excedentes PAID
            </p>
            <p className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-200">
              {formatCents(paidOvertime)}
            </p>
          </div>
        </div>

        <form
          method="get"
          className="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-3"
        >
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Provedor
            <select
              name="provider"
              defaultValue={safeProvider ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="abacatepay">AbacatePay (legado)</option>
              <option value="sem_provedor">Sem cobrança criada</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ambiente Mercado Pago
            <select
              name="environment"
              defaultValue={safeEnvironment ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              <option value="production">Produção</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </label>
          {safeStatus && <input type="hidden" name="filter" value={safeStatus} />}
          <button
            type="submit"
            className="self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Aplicar filtros
          </button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.key || (!filter && !item.key);
            const query = new URLSearchParams();
            if (item.key) query.set('filter', item.key);
            if (safeProvider) query.set('provider', safeProvider);
            if (safeEnvironment) query.set('environment', safeEnvironment);
            const href = query.size ? `/pagamentos?${query.toString()}` : '/pagamentos';
            return (
              <Link
                key={item.label}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="min-w-[1180px] w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Cliente / solicitação
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Valor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Status do provedor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Reconciliação
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Criado / pago
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Checkout
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-zinc-100 align-top hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {payment.usuario_nome ?? '—'}
                      </p>
                      <Link
                        href={`/solicitacoes/${payment.solicitacao_id}`}
                        className="mt-1 inline-block font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {payment.solicitacao_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          payment.tipo_pagamento === 'excedente'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {payment.tipo_pagamento === 'excedente' ? 'Excedente' : 'Inicial'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCents(payment.valor_centavos)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusColors[payment.status] ?? statusColors.EXPIRED
                        }`}
                      >
                        {payment.status}
                      </span>
                      <p
                        className="mt-2 max-w-48 truncate font-mono text-[11px] text-zinc-400"
                        title={
                          payment.mercadopago_payment_id ??
                          payment.abacatepay_billing_id ??
                          undefined
                        }
                      >
                        {getProviderLabel(payment.provedor)}
                      </p>
                      <p className="mt-1 max-w-48 truncate font-mono text-[11px] text-zinc-400">
                        {payment.mercadopago_payment_id ??
                          payment.abacatepay_billing_id ??
                          'Sem referência do provedor'}
                      </p>
                      {payment.mercadopago_environment && (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {payment.mercadopago_environment}
                          {payment.mercadopago_status_detail
                            ? ` · ${payment.mercadopago_status_detail}`
                            : ''}
                        </p>
                      )}
                      {payment.metodos.length > 0 && (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {payment.metodos.join(' / ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ReconciliationCell payment={payment} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      <p>{formatDateTime(payment.created_at)}</p>
                      <p className="mt-1 text-zinc-400">
                        Pago: {formatDateTime(payment.pago_em)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <SafeExternalLink
                        href={payment.url_pagamento}
                        fallback={<span className="text-xs text-zinc-400">—</span>}
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Abrir
                      </SafeExternalLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between">
          {safeCursor ? (
            <Link
              href="/pagamentos"
              className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
            >
              Voltar ao início
            </Link>
          ) : (
            <span />
          )}
          {paymentQueue.nextCursor && payments.length === paymentQueue.limit && (
            <Link
              href={`/pagamentos?${new URLSearchParams({
                ...(safeStatus ? { filter: safeStatus } : {}),
                ...(safeProvider ? { provider: safeProvider } : {}),
                ...(safeEnvironment ? { environment: safeEnvironment } : {}),
                cursor: paymentQueue.nextCursor,
              }).toString()}`}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Carregar mais antigos
            </Link>
          )}
        </div>

        <div className="mb-6 mt-10">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Repasses aos motoristas
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {payouts.length} registros ·{' '}
            <span className="font-semibold text-yellow-700 dark:text-yellow-400">
              {formatReais(pendingPayouts)} a pagar
            </span>{' '}
            ·{' '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {formatReais(paidPayouts)} repassados
            </span>
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {payoutFilters.map((item) => {
            const active = repasseFilter === item.key || (!repasseFilter && !item.key);
            const href = item.key
              ? `/pagamentos?repasseFilter=${item.key}`
              : '/pagamentos';
            return (
              <Link
                key={item.label}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Motorista
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Solicitação
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Total / repasse
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Chave PIX
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Status / data
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                    Nenhum repasse encontrado
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link href={`/motoristas/${payout.motorista_id}`} className="hover:underline">
                        {payout.driver_profiles?.profiles?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${payout.solicitacao_id}`}
                        className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {payout.solicitacao_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      <p>{formatReais(payout.solicitacoes?.preco_final ?? payout.solicitacoes?.preco_total)}</p>
                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatReais(payout.valor)}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      {payout.driver_profiles?.chave_pix ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          repasseStatusColors[payout.status] ?? repasseStatusColors.cancelado
                        }`}
                      >
                        {payout.status}
                      </span>
                      <p className="mt-2 text-xs text-zinc-400">
                        {formatDateTime(payout.pago_em)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {payout.status === 'pendente' && (
                        <form
                          action={async () => {
                            'use server';
                            await confirmarRepasse(payout.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Confirmar pagamento
                          </button>
                        </form>
                      )}
                      {payout.status === 'pago' && (
                        <form
                          action={async () => {
                            'use server';
                            await reverterRepasse(payout.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                          >
                            Desfazer
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
