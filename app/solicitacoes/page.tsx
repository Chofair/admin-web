import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import {
  listAdminRequests,
  type AdminRequestListItem,
  type AdminRequestStatus,
} from '@/lib/admin-operations';

type RequestListRow = AdminRequestListItem & {
  nomeUsuario: string;
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrency(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  confirmada: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  finalizada: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  concluida: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelada: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const validStatuses: AdminRequestStatus[] = [
  'pendente',
  'confirmada',
  'em_andamento',
  'finalizada',
  'concluida',
  'cancelada',
];

async function getRequests(filter?: string): Promise<RequestListRow[]> {
  const { supabase } = await requireAdmin();
  const status =
    filter && validStatuses.includes(filter as AdminRequestStatus)
      ? (filter as AdminRequestStatus)
      : undefined;
  const { items: requests } = await listAdminRequests(supabase, {
    statuses: status ? [status] : undefined,
    limit: 50,
  });
  const userIds = [
    ...new Set(requests.map((request) => request.usuario_id).filter(Boolean)),
  ];
  const profiles = await getAdminProfilesByIds(supabase, userIds);
  const namesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.name ?? '—']),
  );

  return requests.map((request) => ({
    ...request,
    nomeUsuario: namesById.get(request.usuario_id) ?? '—',
  }));
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const requests = await getRequests(filter);
  const filters = [
    { key: undefined, label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'confirmada', label: 'Confirmadas' },
    { key: 'em_andamento', label: 'Em andamento' },
    { key: 'finalizada', label: 'Finalizadas' },
    { key: 'concluida', label: 'Concluídas' },
    { key: 'cancelada', label: 'Canceladas' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Solicitações
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {requests.length} registros nesta página
            </p>
          </div>
          <Link
            href="/revisoes-corridas?status=aberta"
            className="text-sm font-semibold text-orange-700 hover:underline dark:text-orange-400"
          >
            Abrir fila de revisões
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.key || (!filter && !item.key);
            const href = item.key ? `/solicitacoes?filter=${item.key}` : '/solicitacoes';
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
          <table className="min-w-[940px] w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Serviço
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Data / horário
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                  Operação
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {request.nomeUsuario}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {request.tipo_solicitacao === 'motorista'
                        ? 'Só motorista'
                        : 'Motorista + carro'}
                      <p className="mt-1 text-xs text-zinc-400">
                        {request.duracao_horas}h contratadas
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatDate(request.data_servico)}
                      <p className="mt-1 text-xs text-zinc-400">
                        {request.horario_inicio} – {request.horario_fim}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusColors[request.status] ?? statusColors.pendente
                        }`}
                      >
                        {request.status.replaceAll('_', ' ')}
                      </span>
                      {request.revisao_solicitada_em && (
                        <p className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-400">
                          Em revisão
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(request.preco_final ?? request.preco_total)}
                      {(request.preco_tempo_excedido ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-normal text-orange-700 dark:text-orange-400">
                          + {formatCurrency(request.preco_tempo_excedido)} excedente
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${request.id}`}
                        className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Ver detalhes
                      </Link>
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
