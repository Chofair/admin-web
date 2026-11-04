'use client';

import { useFormStatus } from 'react-dom';
import { LoaderCircle, LogOut } from 'lucide-react';
import styles from './admin-navigation.module.css';

export default function LogoutButton() {
  const { pending } = useFormStatus();
  const label = pending ? 'Saindo do painel…' : 'Sair do painel';
  return <>
    <button type="submit" disabled={pending} aria-busy={pending} aria-label={label} title={label}
      className={styles.iconButton + ' ' + styles.logoutButton}>
      {pending ? <LoaderCircle size={19} className="motion-safe:animate-spin" aria-hidden="true" /> : <LogOut size={19} aria-hidden="true" />}
      <span className={styles.logoutLabel}>{pending ? 'Saindo…' : 'Sair'}</span>
    </button>
    <span role="status" className="sr-only">{pending ? 'Encerrando sua sessão no painel.' : ''}</span>
  </>;
}
