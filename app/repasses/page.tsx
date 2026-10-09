import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import { listAdminPayouts, type AdminPayoutStatus } from '@/lib/admin-operations';
import type { createSupabaseServerClient } from '@/lib/supabase-server';
import PayoutActionForm from './PayoutActionForm';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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

function formatReais(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const repasseStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  pago: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const validRepasseStatuses: AdminPayoutStatus[] = ['pendente', 'pago', 'cancelado'];

async function getRepasses(
  supabase: SupabaseServerClient,
  status?: AdminPayoutStatus,
): Promise<RepasseRow[]> {
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

export default async function RepassesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { supabase } = await requireAdmin();
  const safeStatus = validRepasseStatuses.includes(filter as AdminPayoutStatus)
    ? (filter as AdminPayoutStatus)
    : undefined;
  const payouts = await getRepasses(supabase, safeStatus);

  const filters = [
    { key: undefined, label: 'Todos' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'pago', label: 'Pagos' },
    { key: 'cancelado', label: 'Cancelados' },
  ];

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Repasses aos motoristas
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {payouts.length} registros · dados restritos a administradores
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
              A pagar
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-900 dark:text-yellow-200">
              {formatReais(pendingPayouts)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Repassados
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {formatReais(paidPayouts)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = safeStatus === item.key;
            const href = item.key ? `/repasses?filter=${item.key}` : '/repasses';
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
                      <PayoutActionForm payoutId={payout.id} status={payout.status} />
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
