import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import AppDownloadQr from './AppDownloadQr';
import StoreButtons from './StoreButtons';
import styles from './marketing.module.css';

export default function DownloadSection() {
  return (
    <section id="baixar" className={styles.downloadSection} aria-labelledby="download-title">
      <div className={`${styles.container} ${styles.downloadInner}`}>
        <div>
          <span className={styles.yellowRule} aria-hidden="true" />
          <h2 id="download-title">Leve a Chofair com você</h2>
          <p>Escolha seu serviço e faça o agendamento pelo aplicativo.</p>
          <StoreButtons />
          <Link href="/aplicativo" className={styles.downloadDetails}>Conheça o aplicativo <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <AppDownloadQr />
      </div>
    </section>
  );
}
