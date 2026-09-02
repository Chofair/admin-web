import { requireAdmin } from '@/lib/auth';
import {
  listAdminDrivers,
  type AdminDriverSummary,
} from '@/lib/admin-driver-vehicles';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

const PAGE_SIZE = 50;

type MotoristaSummary = AdminDriverSummary & {
  profiles: {
    name: string | null;
    cpf: string | null;
    telefone: string | null;
  } | null;
};

async function getMotoristas(filter: string | undefined, page: number) {
  const { supabase } = await requireAdmin();
  const status =
    filter && ['pendente', 'aprovado', 'rejeitado', 'suspenso'].includes(filter)
      ? filter
      : undefined;
  const result = await listAdminDrivers(supabase, {
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const motoristas = result.items;
  const profiles = await getAdminProfilesByIds(
    supabase,
    motoristas.map((motorista) => motorista.id),
  );
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return {
    items: motoristas.map((motorista) => ({
      ...motorista,
      profiles: profilesById.get(motorista.id) ?? null,
    })) as MotoristaSummary[],
    total: result.total,
  };
}

function buildPageHref(filter: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? `/motoristas?${search}` : '/motoristas';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCPF(cpf?: string | null) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
  suspenso: 'bg-zinc-100 text-zinc-700',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  suspenso: 'Suspenso',
};

export default async function MotoristasPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter, page: pageParam } = await searchParams;
  const requestedPage = Number.parseInt(pageParam ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { items: motoristas, total } = await getMotoristas(filter, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filters = [
    { key: undefined, label: 'Todos' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'aprovado', label: 'Aprovados' },
    { key: 'rejeitado', label: 'Rejeitados' },
    { key: 'suspenso', label: 'Suspensos' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Motoristas</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{total} motoristas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.key || (!filter && !f.key);
            const href = buildPageHref(f.key, 1);
            return (
              <Link
                key={f.label}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">CPF</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">CNH</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Cadastro</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {motoristas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 dark:text-zinc-500">
                    Nenhum motorista encontrado
                  </td>
                </tr>
              ) : (
                motoristas.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {m.profiles?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                      {formatCPF(m.profiles?.cpf)}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {m.cnh_numero ?? '—'}
                      {m.cnh_validade && (
                        <span className="ml-1 text-xs text-zinc-600 dark:text-zinc-400">
                          (val: {formatDate(m.cnh_validade)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[m.status_motorista ?? 'pendente']
                        }`}
                      >
                        {statusLabels[m.status_motorista ?? 'pendente']}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/motoristas/${m.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginação de motoristas" className="mt-5 flex items-center justify-between gap-3 text-sm">
            <Link
              href={buildPageHref(filter, Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={`rounded-lg border px-3 py-2 ${
                page <= 1
                  ? 'pointer-events-none border-zinc-200 text-zinc-400 dark:border-zinc-800'
                  : 'border-zinc-300 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              Anterior
            </Link>
            <span className="text-zinc-500 dark:text-zinc-400">
              Página {Math.min(page, totalPages)} de {totalPages}
            </span>
            <Link
              href={buildPageHref(filter, Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={`rounded-lg border px-3 py-2 ${
                page >= totalPages
                  ? 'pointer-events-none border-zinc-200 text-zinc-400 dark:border-zinc-800'
                  : 'border-zinc-300 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              Próxima
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
