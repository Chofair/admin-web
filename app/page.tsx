import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDown, ArrowRight } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import ContactSection from '@/components/marketing/ContactSection';
import DownloadSection from '@/components/marketing/DownloadSection';
import ServiceList from '@/components/marketing/ServiceList';
import SiteFooter from '@/components/marketing/SiteFooter';
import hero from '@/public/images/chofair-coastal-hero.webp';
import styles from '@/components/marketing/marketing.module.css';

export const metadata: Metadata = {
  title: 'Chofair — Seu caminho merece uma boa companhia',
  description: 'Conheça a Chofair: viaje no seu carro, no carro do motorista ou escolha uma corrida acessível. Conheça os serviços e baixe o aplicativo.',
  icons: { icon: '/brand/chofair-icon.png', apple: '/brand/chofair-icon.png' },
  openGraph: {
    title: 'Chofair — Seu caminho merece uma boa companhia',
    description: 'Motorista particular, conforto e cuidado para o seu caminho. Conheça a Chofair.',
    locale: 'pt_BR', type: 'website',
  },
};

export default function LandingPage() {
  return (
    <div className={styles.site}>
      <LandingHeader />
      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <section id="sobre" className={styles.hero} aria-labelledby="hero-title">
          <Image src={hero} alt="" fill preload placeholder="blur" sizes="100vw" className={styles.heroImage} />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={`${styles.container} ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}><span aria-hidden="true" />Mobilidade com cuidado</p>
              <h1 id="hero-title">Seu caminho merece uma boa companhia.</h1>
              <p className={styles.heroDescription}>Conheça a Chofair e nossos serviços de motorista particular.</p>
            </div>
            <div className={styles.heroButtons}>
              <a href="#servicos" className={styles.primaryButton}>Conheça nossos serviços <ArrowDown size={18} aria-hidden="true" /></a>
              <a href="#contato" className={styles.secondaryButton}>Fale com a gente <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </section>
        <section id="servicos" className={styles.servicesSection} aria-labelledby="services-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Nossos serviços</p><span className={styles.yellowRule} aria-hidden="true" />
              <h2 id="services-title">Mais conforto para o seu dia.</h2>
            </div>
            <ServiceList />
          </div>
        </section>
        <DownloadSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
