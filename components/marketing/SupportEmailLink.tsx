import { SITE_CONTACT } from '@/lib/site-content';
import styles from './marketing.module.css';

export default function SupportEmailLink() {
  return (
    <a
      href={SITE_CONTACT.supportGmailComposeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.legalEmailLink}
      aria-label="Escrever para o suporte da Chofair no Gmail (abre em uma nova aba)"
    >
      {SITE_CONTACT.supportEmail}
    </a>
  );
}
