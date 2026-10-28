// Aligned with ChofairApp's rideServicePresentation and HomeServiceChoices.
export const SITE_SERVICES = [
  { id: 'motorista', title: 'Viajar no meu carro', description: 'Um motorista dirige seu carro para você, na ida e na volta.' },
  { id: 'motorista_carro', title: 'Viajar no carro do motorista', description: 'O motorista busca você com o veículo dele.' },
  { id: 'acessibilidade', title: 'Corrida acessível', description: 'Atendimento conforme suas necessidades.' },
] as const;

export const APP_STORES = {
  android: 'https://play.google.com/store/apps/details?id=com.chofair',
  ios: 'https://apps.apple.com/br/app/chofair/id6788883015',
} as const;

const COMPANY_EMAIL = 'chofairmobilidade@gmail.com';
const SUPPORT_EMAIL = 'suporte@chofair.com.br';

export const SITE_CONTACT = {
  email: COMPANY_EMAIL,
  gmailComposeHref: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(COMPANY_EMAIL)}`,
  supportEmail: SUPPORT_EMAIL,
  supportGmailComposeHref: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`,
  phone: '(13) 99656-7386',
  whatsappHref: 'https://wa.me/5513996567386',
  instagram: '@chofair_brasil',
  instagramHref: 'https://www.instagram.com/chofair_brasil/',
} as const;

export const SITE_NAVIGATION = [
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#servicos', label: 'Serviços' },
  { href: '/aplicativo', label: 'Aplicativo' },
  { href: '/#contato', label: 'Contato' },
] as const;
