import Link from 'next/link';
import { Accessibility, ChevronRight } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { listAccessibilityApplications, type ApprovalStatus } from '@/lib/admin-accessibility';
import { requireAdmin } from '@/lib/auth';

const statuses: Array<{ value: ApprovalStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' }, { value: 'rejected', label: 'Rejeitados' },
  { value: 'suspended', label: 'Suspensos' }, { value: 'draft', label: 'Rascunhos' },
];
const labels: Record<ApprovalStatus, string> = { draft: 'Rascunho', pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado', suspended: 'Suspenso' };
function date(value: string | null) { return value ? new Date(value).toLocaleString('pt-BR') : '-'; }

export default async function AccessibilityQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const query = await searchParams;
  const selected = statuses.some((item) => item.value === query.status) ? query.status as ApprovalStatus | 'all' : 'pending';
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const { supabase } = await requireAdmin();
  const result = await listAccessibilityApplications(supabase, selected === 'all' ? null : selected, page);
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Accessibility className="text-blue-600" />
          <div><h1 className="text-2xl font-bold">Acessibilidade</h1><p className="text-sm text-zinc-500">Análise manual de motoristas, CNH e veículos adaptados</p></div>
        </div>
        <nav className="mb-5 flex gap-2 overflow-x-auto">
          {statuses.map((item) => <Link key={item.value} href={`/acessibilidade?status=${item.value}`} className={`rounded-full px-4 py-2 text-sm ${selected === item.value ? 'bg-blue-600 text-white' : 'border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>{item.label}</Link>)}
        </nav>
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 text-sm text-zinc-500 dark:border-zinc-700">{result.total} cadastro(s)</div>
          {result.items.length === 0 ? <p className="p-10 text-center text-sm text-zinc-500">Nenhum cadastro neste filtro.</p> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
              <thead className="bg-zinc-50 text-left dark:bg-zinc-800"><tr><th className="px-5 py-3">Motorista</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Veículos</th><th className="px-5 py-3">Envio</th><th className="px-5 py-3" /></tr></thead>
              <tbody>{result.items.map((item) => <tr key={item.driver_id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-5 py-4"><p className="font-semibold">{item.driver_name ?? '-'}</p><p className="text-xs text-zinc-500">{item.driver_cpf ?? '-'}</p></td>
                <td className="px-5 py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold dark:bg-zinc-800">{labels[item.status]}</span></td>
                <td className="px-5 py-4"><p>{item.pending_vehicles} pendente(s)</p><p className="text-xs text-zinc-500">{item.approved_vehicles}/{item.total_vehicles} aprovados</p></td>
                <td className="px-5 py-4 text-zinc-500">{date(item.submitted_at)}</td>
                <td className="px-5 py-4"><Link href={`/acessibilidade/${item.driver_id}`} aria-label={`Revisar ${item.driver_name ?? 'motorista'}`} className="inline-flex items-center gap-1 font-semibold text-blue-600">Revisar <ChevronRight size={16} /></Link></td>
              </tr>)}</tbody>
            </table></div>
          )}
          <div className="flex justify-between border-t border-zinc-200 px-5 py-4 text-sm dark:border-zinc-700">
            {page > 1 ? <Link href={`/acessibilidade?status=${selected}&page=${page - 1}`}>← Anterior</Link> : <span />}
            {page * result.limit < result.total ? <Link href={`/acessibilidade?status=${selected}&page=${page + 1}`}>Próxima →</Link> : <span />}
          </div>
        </section>
      </main>
    </div>
  );
}
