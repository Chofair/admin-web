'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import styles from './marketing.module.css';

export default function AppDownloadQr() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<{ path: string; size: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let started = false;
    const desktop = window.matchMedia('(min-width: 1024px)');

    async function generate() {
      if (started || !desktop.matches) return;
      started = true;
      try {
        // Encode our own origin only; no query parameters or external QR service.
        const { toQR } = await import('toqr');
        const matrix = toQR(new URL('/aplicativo', window.location.origin).href, 0);
        const size = Math.sqrt(matrix.length);
        let path = '';
        matrix.forEach((filled, index) => {
          if (filled) path += `M${index % size + 4} ${Math.floor(index / size) + 4}h1v1h-1z`;
        });
        if (!disposed) setQr({ path, size: size + 8 });
      } catch {
        // The normal link remains usable if the optional QR cannot load.
      }
    }

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void generate();
    }, { rootMargin: '200px' }) : null;
    if (observer) observer.observe(container);
    else void generate();
    const onResize = () => { if (desktop.matches) void generate(); };
    desktop.addEventListener('change', onResize);
    return () => {
      disposed = true;
      observer?.disconnect();
      desktop.removeEventListener('change', onResize);
    };
  }, []);

  return (
    <div className={styles.qrBlock} ref={containerRef}>
      <Link href="/aplicativo" className={styles.qrLink} aria-label="Abrir a página do aplicativo Chofair">
        <span className={styles.qrImage}>
          {qr ? (
            <svg viewBox={`0 0 ${qr.size} ${qr.size}`} width="152" height="152" role="img" aria-label="QR Code para a página do aplicativo Chofair" shapeRendering="crispEdges">
              <path fill="#fff" d={`M0 0h${qr.size}v${qr.size}H0z`} />
              <path fill="#081d36" d={qr.path} />
            </svg>
          ) : <Smartphone size={42} aria-hidden="true" />}
        </span>
        <span>{qr ? 'Escaneie para baixar' : 'Ver opções de download'}</span>
      </Link>
      <p>{qr ? 'Escolha sua loja no celular.' : 'Google Play e App Store.'}</p>
    </div>
  );
}
