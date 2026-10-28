import Link from 'next/link';
import { InstagramIcon, WhatsAppIcon } from '@/components/marketing/BrandIcons';
import { SITE_CONTACT, SITE_NAVIGATION } from '@/lib/site-content';
import BrandLogo from '@/components/marketing/BrandLogo';
import MobileNavigation from '@/components/marketing/MobileNavigation';
import styles from '@/components/marketing/marketing.module.css';

export default function LandingHeader() {
  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brandLink} aria-label="Chofair — página inicial"><BrandLogo /></Link>
        <nav className={styles.desktopNavigation} aria-label="Navegação principal">
          {SITE_NAVIGATION.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className={styles.headerActions}>
          <a href={SITE_CONTACT.instagramHref} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram da Chofair (abre em uma nova aba)" title="Instagram da Chofair">
            <InstagramIcon size={23} aria-hidden="true" />
          </a>
          <a href={SITE_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Conversar com a Chofair pelo WhatsApp (abre em uma nova aba)" title="WhatsApp da Chofair">
            <WhatsAppIcon size={23} aria-hidden="true" />
          </a>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
