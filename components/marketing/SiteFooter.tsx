import Link from 'next/link';
import BrandLogo from './BrandLogo';
import styles from './marketing.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <Link href="/" className={styles.brandLink} aria-label="Chofair — página inicial"><BrandLogo onDark /></Link>
        <p>© {new Date().getFullYear()} Chofair. Todos os direitos reservados.</p>
        <nav aria-label="Informações legais" className={styles.footerLinks}>
          <Link href="/termos">Termos de Uso</Link><Link href="/exclusao-de-conta">Exclusão de Conta</Link>
        </nav>
      </div>
    </footer>
  );
}
