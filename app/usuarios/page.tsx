import { requireAdmin } from '@/lib/auth';
import { listAdminProfiles } from '@/lib/admin-profiles';
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const PAGE_SIZE = 50;

type UsuarioRow = {
  id: string;
  name: string | null;
  cpf: string | null;
  terms_role: string | null;
  telefone: string | null;
  created_at: string | null;
};

async function getUsuarios(page: number) {
  const { supabase } = await requireAdmin();
  const result = await listAdminProfiles(supabase, {
    role: 'user',
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  return {
    usuarios: result.items as UsuarioRow[],
    total: result.total,
  };
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

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { usuarios, total } = await getUsuarios(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    redirect(totalPages > 1 ? `/usuarios?page=${totalPages}` : '/usuarios');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">Usuários</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{total} clientes cadastrados</p>
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
        {totalPages > 1 && (
          <nav className="mt-5 flex items-center justify-between text-sm">
            <Link
              href={page > 2 ? `/usuarios?page=${page - 1}` : '/usuarios'}
              aria-disabled={page <= 1}
              className={`rounded-lg border px-3 py-2 ${
                page <= 1
                  ? 'pointer-events-none border-zinc-100 text-zinc-300'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Anterior
            </Link>
            <span className="text-zinc-500">
              P&aacute;gina {Math.min(page, totalPages)} de {totalPages}
            </span>
            <Link
              href={`/usuarios?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={`rounded-lg border px-3 py-2 ${
                page >= totalPages
                  ? 'pointer-events-none border-zinc-100 text-zinc-300'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Pr&oacute;xima
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
