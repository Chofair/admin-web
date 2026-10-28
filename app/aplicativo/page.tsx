import type { Metadata } from 'next';
import { CalendarClock, CreditCard, MapPin, Smartphone } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import BrandLogo from '@/components/marketing/BrandLogo';
import BackToHome from '@/components/marketing/BackToHome';
import ContactSection from '@/components/marketing/ContactSection';
import ServiceList from '@/components/marketing/ServiceList';
import SiteFooter from '@/components/marketing/SiteFooter';
import StoreButtons from '@/components/marketing/StoreButtons';
import styles from '@/components/marketing/marketing.module.css';

export const metadata: Metadata = {
  title: 'Baixe o aplicativo Chofair — Android e iPhone',
  description: 'Baixe a Chofair no Google Play ou na App Store. Escolha seu serviço e faça o agendamento pelo aplicativo.',
  icons: { icon: '/brand/chofair-icon.png', apple: '/brand/chofair-icon.png' },
};

const steps = [
  { icon: Smartphone, title: 'Escolha o serviço', description: 'Viaje no seu carro, no carro do motorista ou escolha uma corrida acessível.' },
  { icon: CalendarClock, title: 'Agende seu horário', description: 'Informe a data e os horários para o atendimento.' },
  { icon: MapPin, title: 'Defina o trajeto', description: 'Indique seu ponto de partida e seu destino.' },
  { icon: CreditCard, title: 'Pague pelo aplicativo', description: 'Confira os detalhes e as opções de pagamento antes de confirmar.' },
];

export default function AplicativoPage() {
  return (
    <div className={styles.site}>
      <LandingHeader />
      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <section className={styles.appSection} aria-labelledby="app-title">
          <div className={styles.container}>
            <BackToHome />
            <div className={styles.appIntro}>
              <div className={styles.appCopy}>
                <p className={styles.eyebrow}>Chofair no seu celular</p><span className={styles.yellowRule} aria-hidden="true" />
                <h1 id="app-title">Leve a Chofair<br />com você.</h1>
                <p>Escolha seu serviço e faça o agendamento pelo aplicativo. Baixe na loja do seu celular para começar.</p>
                <StoreButtons />
                <p className={styles.appAvailability}>Disponível para Android e iPhone. Grátis para baixar.</p>
              </div>
              <div className={styles.appBrandPanel}>
                <BrandLogo onDark /><span className={styles.yellowRule} aria-hidden="true" />
                <p>Seu caminho merece<br />uma boa companhia.</p><span>Mobilidade com cuidado, direto do celular.</span>
              </div>
            </div>
          </div>
        </section>
        <section id="servicos" className={styles.servicesSection} aria-labelledby="app-services-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Uma escolha para cada caminho</p><span className={styles.yellowRule} aria-hidden="true" />
              <h2 id="app-services-title">Como você quer viajar?</h2>
            </div>
            <ServiceList />
          </div>
        </section>
        <section className={styles.stepsSection} aria-labelledby="steps-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Tudo pelo aplicativo</p><span className={styles.yellowRule} aria-hidden="true" />
              <h2 id="steps-title">Do seu jeito, em poucos passos.</h2>
            </div>
            <ol className={styles.steps}>
              {steps.map(({ icon: Icon, title, description }, index) => (
                <li key={title}>
                  <div className={styles.stepTop}><span>0{index + 1}</span><Icon size={25} aria-hidden="true" /></div>
                  <h3>{title}</h3><p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
