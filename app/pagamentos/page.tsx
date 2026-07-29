import Link from 'next/link';
import { BadgeDollarSign, RefreshCcw, TriangleAlert } from 'lucide-react';
import NavBar from '@/components/NavBar';
import SafeExternalLink from '@/components/SafeExternalLink';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import { requireAdmin } from '@/lib/auth';
import type { createSupabaseServerClient } from '@/lib/supabase-server';
import { confirmarRepasse, reverterRepasse } from './actions';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type PaymentRow = {
  id: string;
  solicitacao_id: string;
  abacatepay_billing_id: string | null;
  url_pagamento: string | null;
  valor_centavos: number;
  status: string;
  tipo_pagamento: 'inicial' | 'excedente';
  pago_em: string | null;
  created_at: string;
  conciliacao_verificada_em: string | null;
  conciliacao_tentativas: number;
  conciliacao_nao_encontrado_tentativas: number;
  conciliacao_encerrada_em: string | null;
  conciliacao_motivo: string | null;
  solicitacoes: {
    usuario_id: string;
    tipo_solicitacao: string;
  } | null;
  clienteNome: string | null;
};

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

const validRepasseStatuses = ['pendente', 'pago', 'cancelado'];

async function getRepasses(
  supabase: SupabaseServerClient,
  filter?: string,
): Promise<RepasseRow[]> {
  let query = supabase
    .from('repasses_motorista')
    .select(`
      id,
      solicitacao_id,
      motorista_id,
      valor,
      status,
      pago_em,
      created_at,
      solicitacoes!solicitacao_id(preco_total, preco_final, tipo_solicitacao, data_servico),
      driver_profiles!motorista_id(chave_pix, profiles(name))
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filter && validRepasseStatuses.includes(filter)) {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar repasses:', {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  return (data ?? []) as unknown as RepasseRow[];
}

async function getPagamentos(
  supabase: SupabaseServerClient,
  filter?: string,
): Promise<PaymentRow[]> {
  let query = supabase
    .from('pagamentos')
    .select(`
      id,
      solicitacao_id,
      abacatepay_billing_id,
      url_pagamento,
      valor_centavos,
      status,
      tipo_pagamento,
      pago_em,
      created_at,
      conciliacao_verificada_em,
      conciliacao_tentativas,
      conciliacao_nao_encontrado_tentativas,
      conciliacao_encerrada_em,
      conciliacao_motivo,
      solicitacoes!solicitacao_id(usuario_id, tipo_solicitacao)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (filter && validPaymentStatuses.includes(filter)) {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar pagamentos:', {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  const payments = (data ?? []) as unknown as Omit<PaymentRow, 'clienteNome'>[];
  const userIds = [
    ...new Set(
      payments
        .map((payment) => payment.solicitacoes?.usuario_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const { data: clients } = userIds.length
    ? await supabase.from('profiles').select('id, name').in('id', userIds)
    : { data: [] as { id: string; name: string | null }[] };
  const namesById = new Map((clients ?? []).map((client) => [client.id, client.name]));

  return payments.map((payment) => ({
    ...payment,
    clienteNome: payment.solicitacoes?.usuario_id
      ? namesById.get(payment.solicitacoes.usuario_id) ?? null
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
  searchParams: Promise<{ filter?: string; repasseFilter?: string }>;
}) {
  const { filter, repasseFilter } = await searchParams;
  const { supabase } = await requireAdmin();
  const [payments, payouts] = await Promise.all([
    getPagamentos(supabase, filter),
    getRepasses(supabase, repasseFilter),
  ]);

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
              {payments.length} registros nesta página
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

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.key || (!filter && !item.key);
            const href = item.key ? `/pagamentos?filter=${item.key}` : '/pagamentos';
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
                        {payment.clienteNome ?? '—'}
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
                        title={payment.abacatepay_billing_id ?? undefined}
                      >
                        {payment.abacatepay_billing_id ?? 'Sem billing ID'}
                      </p>
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
