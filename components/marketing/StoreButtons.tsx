import { APP_STORES } from '@/lib/site-content';
import styles from './marketing.module.css';

export default function StoreButtons() {
  return (
    <div className={styles.storeButtons}>
      <a href={APP_STORES.android} target="_blank" rel="noopener noreferrer" className={styles.storeBadge} aria-label="Baixar Chofair para Android no Google Play (abre em uma nova aba)">
        <svg viewBox="0 0 32 36" width="28" height="32" aria-hidden="true" focusable="false">
          <path fill="#35C3EA" d="M1 1 18 18 1 35Z" />
          <path fill="#00D26A" d="m1 1 21 12-4 5Z" />
          <path fill="#FFCE00" d="m22 13 8 4.5a.6.6 0 0 1 0 1L22 23l-5-5Z" />
          <path fill="#FF4B55" d="m1 35 21-12-4-5Z" />
        </svg>
        <span><small>Disponível no</small><strong>Google Play</strong></span>
      </a>
      <a href={APP_STORES.ios} target="_blank" rel="noopener noreferrer" className={styles.storeBadge} aria-label="Baixar Chofair para iPhone na App Store (abre em uma nova aba)">
        <svg viewBox="0 0 24 24" width="30" height="32" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <span><small>Baixar na</small><strong>App Store</strong></span>
      </a>
    </div>
  );
}
