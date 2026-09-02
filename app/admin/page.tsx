import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Car,
  CarFront,
  ClipboardList,
  Clock,
  CreditCard,
  ListChecks,
  RefreshCcw,
  Users,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { countAdminProfiles } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import { getOperationalAlerts } from '@/lib/admin-operations';

async function getDashboardStats() {
  const { supabase } = await requireAdmin();
  const [
    totalUsers,
    { count: totalDrivers },
    { count: pendingDrivers },
    { count: totalSolicitacoes },
    { count: pendingSolicitacoes },
    { count: activeSolicitacoes },
    { count: pendingVehicles },
    { count: totalPagamentos },
    { count: paidPagamentos },
    operationalAlerts,
  ] = await Promise.all([
    countAdminProfiles(supabase, 'user'),
    supabase.from('driver_profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('driver_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status_motorista', 'pendente'),
    supabase.from('solicitacoes').select('id', { count: 'exact', head: true }),
    supabase
      .from('solicitacoes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente'),
    supabase
      .from('solicitacoes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmada', 'em_andamento']),
    supabase
      .from('veiculos')
      .select('id', { count: 'exact', head: true })
      .in('status_validacao', [
        'pendente_upload',
        'pendente_extracao',
        'extraido_parcial',
        'pendente_revisao',
      ]),
    supabase.from('pagamentos').select('id', { count: 'exact', head: true }),
    supabase
      .from('pagamentos')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PAID'),
    getOperationalAlerts(supabase),
  ]);

  return {
    totalUsers,
    totalDrivers: totalDrivers ?? 0,
    pendingDrivers: pendingDrivers ?? 0,
    totalSolicitacoes: totalSolicitacoes ?? 0,
    pendingSolicitacoes: pendingSolicitacoes ?? 0,
    activeSolicitacoes: activeSolicitacoes ?? 0,
    pendingVehicles: pendingVehicles ?? 0,
    totalPagamentos: totalPagamentos ?? 0,
    paidPagamentos: paidPagamentos ?? 0,
    alerts: operationalAlerts.data,
    alertsUnavailable: operationalAlerts.error,
  };
}

export default async function Dashboard() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Veículos',
      value: stats.pendingVehicles,
      sub: 'aguardando revisão',
      href: '/veiculos',
      color: stats.pendingVehicles > 0 ? 'bg-orange-500' : 'bg-green-500',
      Icon: CarFront,
    },
    {
      title: 'Usuários',
      value: stats.totalUsers,
      sub: 'clientes cadastrados',
      href: '/usuarios',
      color: 'bg-blue-500',
      Icon: Users,
    },
    {
      title: 'Motoristas',
      value: stats.totalDrivers,
      sub: `${stats.pendingDrivers} aguardando aprovação`,
      href: '/motoristas',
      color: stats.pendingDrivers > 0 ? 'bg-orange-500' : 'bg-green-500',
      Icon: Car,
    },
    {
      title: 'Solicitações',
      value: stats.totalSolicitacoes,
      sub: `${stats.pendingSolicitacoes} pendentes · ${stats.activeSolicitacoes} ativas`,
      href: '/solicitacoes',
      color: 'bg-purple-500',
      Icon: ClipboardList,
    },
    {
      title: 'Pagamentos',
      value: stats.totalPagamentos,
      sub: `${stats.paidPagamentos} pagos`,
      href: '/pagamentos',
      color: 'bg-emerald-500',
      Icon: CreditCard,
    },
  ];

  const alerts = [
    {
      title: 'Revisões de corridas',
      value: stats.alerts.revisoes_corridas_abertas,
      sub: 'aguardando decisão administrativa',
      href: '/revisoes-corridas?status=aberta',
      Icon: ListChecks,
      tone: 'orange',
    },
    {
      title: 'Cancelamentos financeiros',
      value: stats.alerts.cancelamentos_abertos,
      sub: `${stats.alerts.reembolsos_manuais_pendentes} aguardando reembolso`,
      href: '/cancelamentos-pagamento?status=aberta',
      Icon: BadgeDollarSign,
      tone: 'purple',
    },
    {
      title: 'Conciliação pendente',
      value: stats.alerts.pagamentos_pendentes_conciliacao,
      sub: 'cobranças PENDING com mais de 10 min',
      href: '/pagamentos?filter=PENDING',
      Icon: RefreshCcw,
      tone: 'blue',
    },
    {
      title: 'Conciliação interrompida',
      value: stats.alerts.conciliacoes_encerradas_pendentes,
      sub: 'exigem verificação manual',
      href: '/pagamentos?filter=PENDING',
      Icon: AlertTriangle,
      tone: 'red',
    },
  ] as const;

  const alertTones = {
    orange:
      'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200',
    purple:
      'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
    red: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-6 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Visão geral
        </h1>

        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                >
                  <card.Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="mb-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {card.value}
              </p>
              <p className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {card.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.sub}</p>
            </Link>
          ))}
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-zinc-200">
              <AlertTriangle size={18} className="text-amber-500" />
              Alertas operacionais
            </h2>
            {stats.alertsUnavailable && (
              <span className="text-xs text-red-600 dark:text-red-400">
                Contadores indisponíveis — verifique a migration do painel
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {alerts.map((alert) => (
              <Link
                key={alert.title}
                href={alert.href}
                className={`rounded-xl border p-5 transition-transform hover:-translate-y-0.5 ${alertTones[alert.tone]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <alert.Icon size={20} />
                  <span className="text-2xl font-bold">{alert.value}</span>
                </div>
                <p className="mt-4 text-sm font-semibold">{alert.title}</p>
                <p className="mt-1 text-xs opacity-75">{alert.sub}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Link
              href="/veiculos?filter=pendentes"
              className="flex flex-col items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-4 text-center transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900"
            >
              <CarFront size={22} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Revisar veículos ({stats.pendingVehicles})
              </span>
            </Link>
            <Link
              href="/motoristas?filter=pendente"
              className="flex flex-col items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 p-4 text-center transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950 dark:hover:bg-orange-900"
            >
              <Clock size={22} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                Aprovar motoristas ({stats.pendingDrivers})
              </span>
            </Link>
            <Link
              href="/revisoes-corridas?status=aberta"
              className="flex flex-col items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 p-4 text-center transition-colors hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950 dark:hover:bg-purple-900"
            >
              <ListChecks size={22} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                Revisar corridas ({stats.alerts.revisoes_corridas_abertas})
              </span>
            </Link>
            <Link
              href="/solicitacoes?filter=em_andamento"
              className="flex flex-col items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-center transition-colors hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:hover:bg-blue-900"
            >
              <Activity size={22} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                Corridas ativas ({stats.activeSolicitacoes})
              </span>
            </Link>
            <Link
              href="/cancelamentos-pagamento?status=aberta"
              className="flex flex-col items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900"
            >
              <BadgeDollarSign size={22} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Tratar reembolsos ({stats.alerts.reembolsos_manuais_pendentes})
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
