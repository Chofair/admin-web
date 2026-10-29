'use client';

import Link, { useLinkStatus } from 'next/link';
import Image from 'next/image';
import appIcon from '@/public/brand/chofair-icon.png';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './admin-navigation.module.css';
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
  HandCoins,
  Accessibility,
  MapPin,
  LoaderCircle,
  Menu,
  X,
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
  { href: '/cancelamentos', label: 'Cancelamentos', Icon: BadgeDollarSign },
  { href: '/cancelamentos-pagamento', label: 'Reembolsos', Icon: BadgeDollarSign },
  { href: '/pagamentos', label: 'Pagamentos', Icon: CreditCard },
  { href: '/repasses', label: 'Repasses', Icon: HandCoins },
  { href: '/cidades', label: 'Cidades', Icon: MapPin },
  { href: '/google-maps', label: 'Google Maps', Icon: MapPinned },
  { href: '/aplicativo', label: 'Aplicativo', Icon: Smartphone },
];

function NavigationLabel({ Icon, label }: { Icon: LucideIcon; label: string }) {
  const { pending } = useLinkStatus();
  return <><span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">{pending ? <LoaderCircle size={15} className="motion-safe:animate-spin" /> : <Icon size={15} />}</span><span className="whitespace-nowrap">{label}</span>{pending && <span role="status" className="sr-only">Carregando {label}…</span>}</>;
}

export default function NavBar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const dialog = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeMobileMenu = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener('change', closeMobileMenu);
    return () => desktop.removeEventListener('change', closeMobileMenu);
  }, []);

  const navigation = (mobile = false) => <nav aria-label="Navegação principal" className={styles.navigation}>
    {links.map(({ href, label, Icon }) => {
      const isActive = pathname === href || pathname.startsWith(href + '/');
      return <Link key={href} href={href} aria-current={isActive ? 'page' : undefined}
        onClick={mobile ? () => dialog.current?.close() : undefined}
        className={styles.link + (isActive ? ' ' + styles.active : '')}>
        <NavigationLabel Icon={Icon} label={label} />
      </Link>;
    })}
  </nav>;

  return <div className={styles.layout}>
    <a href="#admin-content" className={styles.skipLink}>Ir para o conteúdo</a>
    <header className={styles.header}>
      <Link href="/admin" aria-label="Chofair Admin — painel de controle" className={styles.brand}>
        <Image src={appIcon} alt="" width={48} height={48} sizes="48px" className={styles.logo} />
        <span><strong>Chofair Admin</strong><span>Painel de controle</span></span>
      </Link>
      <div className={styles.actions}>
        <button onClick={toggle} aria-label="Alternar tema" className={styles.iconButton}>
          {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
        <form action={logout}><button type="submit" aria-label="Sair do painel" title="Sair do painel" className={styles.iconButton}>
          <LogOut size={19} aria-hidden="true" />
        </button></form>
        <button type="button" aria-label="Abrir menu de navegação" aria-expanded={menuOpen} aria-controls="admin-mobile-menu"
          className={styles.iconButton + ' ' + styles.menuButton}
          onClick={() => { dialog.current?.showModal(); setMenuOpen(true); }}><Menu size={21} aria-hidden="true" /></button>
      </div>
    </header>
    <aside className={styles.sidebar} aria-label="Menu do painel">{navigation()}</aside>
    <dialog ref={dialog} id="admin-mobile-menu" aria-labelledby="admin-menu-title" className={styles.mobileDialog}
      onClose={() => setMenuOpen(false)}
      onClick={event => { if (event.target !== event.currentTarget) return; const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current?.close(); }}>
      <div className={styles.dialogHeader}><h2 id="admin-menu-title">Menu do painel</h2>
        <button type="button" className={styles.iconButton} aria-label="Fechar menu de navegação" onClick={() => dialog.current?.close()}><X size={21} aria-hidden="true" /></button>
      </div>
      {navigation(true)}
    </dialog>
    <div id="admin-content" tabIndex={-1} className={styles.content}>{children}</div>
  </div>;
}
