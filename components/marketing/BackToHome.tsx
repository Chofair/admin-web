import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './marketing.module.css';

export default function BackToHome() {
  return (
    <Link href="/" className={styles.backLink}>
      <span className={styles.backIcon}><ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" /></span>
      Voltar para o início
    </Link>
  );
}
