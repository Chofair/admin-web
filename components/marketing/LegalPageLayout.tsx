import type { ReactNode } from 'react';
import LandingHeader from '@/components/LandingHeader';
import BackToHome from './BackToHome';
import SiteFooter from './SiteFooter';
import SupportEmailLink from './SupportEmailLink';
import styles from './marketing.module.css';

type LegalPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function LegalPageLayout({ title, description, children }: LegalPageLayoutProps) {
  return (
    <div className={styles.site}>
      <LandingHeader />
      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <section className={styles.legalHero} aria-labelledby="legal-title">
          <div className={`${styles.container} ${styles.legalContainer}`}>
            <BackToHome />
            <p className={styles.eyebrow}>Informações legais</p>
            <span className={styles.yellowRule} aria-hidden="true" />
            <h1 id="legal-title">{title}</h1>
            <p className={styles.legalLead}>{description}</p>
            <p className={styles.legalSupport}>Contato e suporte: <SupportEmailLink /></p>
          </div>
        </section>
        <div className={`${styles.container} ${styles.legalContainer} ${styles.legalBody}`}>
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
