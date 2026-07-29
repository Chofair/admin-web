import { requireAdmin } from '@/lib/auth';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

type UsuarioRow = {
  id: string;
  name: string | null;
  cpf: string | null;
  terms_role: string | null;
  telefone: string | null;
  created_at: string | null;
};

async function getUsuarios() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, cpf, terms_role, telefone, created_at')
    .eq('terms_role', 'user')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return (data ?? []) as UsuarioRow[];
}

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

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Usuários</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{usuarios.length} clientes cadastrados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">CPF</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Cadastro</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-400 dark:text-zinc-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{u.name ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{formatCPF(u.cpf)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/usuarios/${u.id}`}
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
