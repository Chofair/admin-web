import { ArrowUpRight, Mail } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon } from './BrandIcons';
import { SITE_CONTACT } from '@/lib/site-content';
import styles from './marketing.module.css';

export default function ContactSection() {
  return (
    <section id="contato" className={styles.contactSection} aria-labelledby="contact-title">
      <div className={styles.container}>
        <h2 id="contact-title">Vamos conversar?</h2>
        <p className={styles.contactIntro}>Dúvidas, parcerias ou sugestões. Fale com a gente.</p>
        <div className={styles.contacts}>
          <a href={SITE_CONTACT.gmailComposeHref} target="_blank" rel="noopener noreferrer" className={styles.contactLink} aria-label="Escrever para a Chofair no Gmail (abre em uma nova aba)">
            <Mail size={25} aria-hidden="true" /><span><small>E-mail pelo Gmail</small><span>{SITE_CONTACT.email}</span></span>
          </a>
          <a href={SITE_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.contactLink} aria-label="Conversar com a Chofair pelo WhatsApp (abre em uma nova aba)">
            <WhatsAppIcon size={25} aria-hidden="true" /><span><small>WhatsApp</small><span>{SITE_CONTACT.phone}</span></span>
          </a>
          <a href={SITE_CONTACT.instagramHref} target="_blank" rel="noopener noreferrer" className={styles.contactLink} aria-label="Instagram @chofair_brasil (abre em uma nova aba)">
            <InstagramIcon size={25} aria-hidden="true" /><span><small>Acompanhe no Instagram</small><span>{SITE_CONTACT.instagram}</span></span>
            <ArrowUpRight className={styles.contactArrow} size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
