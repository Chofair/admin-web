import { requireAdmin } from '@/lib/auth';
import { getAdminProfile } from '@/lib/admin-profiles';
import { listAdminRequests } from '@/lib/admin-operations';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCPF(cpf?: string | null) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatCurrency(val?: number | null) {
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

export default async function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();
  const [profile, requestsResult] = await Promise.all([
    getAdminProfile(supabase, id),
    listAdminRequests(supabase, { userId: id, limit: 20 }),
  ]);
  const solicitacoes = requestsResult.items;

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-zinc-500">Usuário não encontrado.</p>
          <Link href="/usuarios" className="text-blue-600 hover:underline mt-4 inline-block">
            Voltar
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/usuarios" className="text-zinc-500 hover:text-zinc-900 text-sm">
            ← Usuários
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">{profile.name ?? '—'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">CPF</p>
              <p className="font-mono">{formatCPF(profile.cpf)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Tipo</p>
              <p>{profile.terms_role === 'user' ? 'Cliente' : 'Motorista'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Telefone</p>
              <p>{profile.telefone ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Nascimento</p>
              <p>{formatDate(profile.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Cadastro</p>
              <p>{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">ID</p>
              <p className="font-mono text-xs text-zinc-400 truncate">{profile.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-800">
              Solicitações ({solicitacoes?.length ?? 0})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Horário</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Valor</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!solicitacoes || solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                solicitacoes.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      {s.tipo_solicitacao === 'motorista' ? 'Só Motorista' : 'Motorista + Carro'}
                    </td>
                    <td className="px-4 py-3">{formatDate(s.data_servico)}</td>
                    <td className="px-4 py-3">{s.horario_inicio}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[s.status] ?? 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(s.preco_total)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${s.id}`}
                        className="text-blue-600 hover:underline font-medium"
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
