import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { Users, Car, CarFront, ClipboardList, CreditCard, Clock, Activity } from 'lucide-react';

async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();
  const [
    { count: totalUsers },
    { count: totalDrivers },
    { count: pendingDrivers },
    { count: totalSolicitacoes },
    { count: pendingSolicitacoes },
    { count: activeSolicitacoes },
    { count: pendingVehicles },
    { count: totalPagamentos },
    { count: paidPagamentos },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('terms_role', 'user'),
    supabase.from('driver_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('driver_profiles').select('*', { count: 'exact', head: true }).eq('status_motorista', 'pendente'),
    supabase.from('solicitacoes').select('*', { count: 'exact', head: true }),
    supabase.from('solicitacoes').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('solicitacoes').select('*', { count: 'exact', head: true }).in('status', ['confirmada', 'em_andamento']),
    supabase.from('veiculos').select('*', { count: 'exact', head: true }).in('status_validacao', ['pendente_upload', 'pendente_extracao', 'extraido_parcial', 'pendente_revisao']),
    supabase.from('pagamentos').select('*', { count: 'exact', head: true }),
    supabase.from('pagamentos').select('*', { count: 'exact', head: true }).eq('status', 'PAID'),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalDrivers: totalDrivers ?? 0,
    pendingDrivers: pendingDrivers ?? 0,
    totalSolicitacoes: totalSolicitacoes ?? 0,
    pendingSolicitacoes: pendingSolicitacoes ?? 0,
    activeSolicitacoes: activeSolicitacoes ?? 0,
    pendingVehicles: pendingVehicles ?? 0,
    totalPagamentos: totalPagamentos ?? 0,
    paidPagamentos: paidPagamentos ?? 0,
  };
}

export default async function Dashboard() {
  const stats = await getDashboardStats();

  const cards = [
    { title: 'Veículos', value: stats.pendingVehicles, sub: 'aguardando revisão', href: '/veiculos', color: stats.pendingVehicles > 0 ? 'bg-orange-500' : 'bg-green-500', Icon: CarFront },
    { title: 'Usuários', value: stats.totalUsers, sub: 'clientes cadastrados', href: '/usuarios', color: 'bg-blue-500', Icon: Users },
    { title: 'Motoristas', value: stats.totalDrivers, sub: `${stats.pendingDrivers} aguardando aprovação`, href: '/motoristas', color: stats.pendingDrivers > 0 ? 'bg-orange-500' : 'bg-green-500', Icon: Car },
    { title: 'Solicitações', value: stats.totalSolicitacoes, sub: `${stats.pendingSolicitacoes} pendentes • ${stats.activeSolicitacoes} ativas`, href: '/solicitacoes', color: 'bg-purple-500', Icon: ClipboardList },
    { title: 'Pagamentos', value: stats.totalPagamentos, sub: `${stats.paidPagamentos} pagos`, href: '/pagamentos', color: 'bg-emerald-500', Icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-6">Visão Geral</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{card.value}</p>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{card.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.sub}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link href="/veiculos?filter=pendentes" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors text-center">
              <CarFront size={22} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Revisar Veículos ({stats.pendingVehicles})
              </span>
            </Link>
            <Link href="/motoristas?filter=pendente" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-900 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors text-center">
              <Clock size={22} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">Aprovar Motoristas ({stats.pendingDrivers})</span>
            </Link>
            <Link href="/solicitacoes?filter=pendente" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors text-center">
              <ClipboardList size={22} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Solicitações Pendentes ({stats.pendingSolicitacoes})</span>
            </Link>
            <Link href="/solicitacoes?filter=em_andamento" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-center">
              <Activity size={22} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Corridas Ativas ({stats.activeSolicitacoes})</span>
            </Link>
            <Link href="/pagamentos?filter=PENDING" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors text-center">
              <CreditCard size={22} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Pagamentos Pendentes</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
