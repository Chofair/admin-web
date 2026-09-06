'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  CarFront,
  ClipboardList,
  CreditCard,
  MapPinned,
  Smartphone,
  Sun,
  Moon,
  ListChecks,
  BadgeDollarSign,
  LogOut,
  Accessibility,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { logout } from '@/app/auth/actions';

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/usuarios', label: 'Usuários', Icon: Users },
  { href: '/motoristas', label: 'Motoristas', Icon: Car },
  { href: '/veiculos', label: 'Veículos', Icon: CarFront },
  { href: '/acessibilidade', label: 'Acessibilidade', Icon: Accessibility },
  { href: '/solicitacoes', label: 'Solicitações', Icon: ClipboardList },
  { href: '/revisoes-corridas', label: 'Revisões', Icon: ListChecks },
  { href: '/cancelamentos-pagamento', label: 'Reembolsos', Icon: BadgeDollarSign },
  { href: '/pagamentos', label: 'Pagamentos', Icon: CreditCard },
  { href: '/google-maps', label: 'Google Maps', Icon: MapPinned },
  { href: '/aplicativo', label: 'Aplicativo', Icon: Smartphone },
];

export default function NavBar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <Link href="/admin" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Chofair Admin</Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Painel de controle</p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 text-sm font-medium lg:pb-0">
            {links.map(({ href, label, Icon }) => {
              const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggle}
            aria-label="Alternar tema"
            className="ml-2 p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sair do painel"
              title="Sair do painel"
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
