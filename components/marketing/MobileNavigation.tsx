'use client';

import { useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { SITE_NAVIGATION } from '@/lib/site-content';
import styles from './marketing.module.css';

export default function MobileNavigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        triggerRef.current?.focus();
      }
    }
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        if (menuRef.current) menuRef.current.open = false;
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, []);

  return (
    <details className={styles.mobileNavigation} ref={menuRef}>
      <summary ref={triggerRef} className={styles.menuTrigger} aria-label="Menu de navegação">
        <Menu className={styles.menuOpenIcon} size={24} aria-hidden="true" />
        <X className={styles.menuCloseIcon} size={24} aria-hidden="true" />
      </summary>
      <nav className={styles.mobileMenu} aria-label="Navegação principal no celular">
        {SITE_NAVIGATION.map(({ href, label }) => (
          <a key={href} href={href} onClick={() => {
            if (menuRef.current) menuRef.current.open = false;
          }}>{label}</a>
        ))}
      </nav>
    </details>
  );
}
