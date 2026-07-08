import { createSupabaseServerClient } from '@/lib/supabase-server';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCurrency(val?: number) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  finalizada: 'bg-orange-100 text-orange-800',
  concluida: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
};

const validStatuses = ['pendente', 'confirmada', 'em_andamento', 'finalizada', 'concluida', 'cancelada'];

async function getSolicitacoes(filter?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('solicitacoes')
    .select('id, tipo_solicitacao, data_servico, horario_inicio, horario_fim, duracao_horas, status, preco_total, created_at, usuario_id, motorista_id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (filter && validStatuses.includes(filter)) {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }

  const usuarioIds = [...new Set((data ?? []).map((s: any) => s.usuario_id).filter(Boolean))];
  let nomesPorId: Record<string, string> = {};

  if (usuarioIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', usuarioIds);
    nomesPorId = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.name]));
  }

  return (data ?? []).map((s: any) => ({ ...s, nomeUsuario: nomesPorId[s.usuario_id] ?? '—' }));
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const solicitacoes = await getSolicitacoes(filter);

  const filters = [
    { key: undefined, label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'confirmada', label: 'Confirmadas' },
    { key: 'em_andamento', label: 'Em Andamento' },
    { key: 'finalizada', label: 'Finalizadas' },
    { key: 'concluida', label: 'Concluídas' },
    { key: 'cancelada', label: 'Canceladas' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Solicitações</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{solicitacoes.length} solicitações</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.key || (!filter && !f.key);
            const href = f.key ? `/solicitacoes?filter=${f.key}` : '/solicitacoes';
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
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Data Serviço</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Horário</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Dur.</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Valor</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-zinc-400 dark:text-zinc-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                solicitacoes.map((s: any) => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {s.nomeUsuario}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {s.tipo_solicitacao === 'motorista' ? 'Só Motorista' : 'Mot. + Carro'}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatDate(s.data_servico)}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {s.horario_inicio} – {s.horario_fim}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{s.duracao_horas}h</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[s.status] ?? 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(s.preco_total)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${s.id}`}
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
      </main>
    </div>
  );
}
