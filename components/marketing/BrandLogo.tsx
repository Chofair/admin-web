import Image from 'next/image';
import symbol from '@/public/brand/chofair-symbol.webp';
import styles from './marketing.module.css';

export default function BrandLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={`${styles.brand} ${onDark ? styles.brandOnDark : ''}`}>
      <span className={styles.brandSymbol}>
        <Image src={symbol} alt="" width={36} height={36} />
      </span>
      <span>Chofair</span>
    </span>
  );
}
