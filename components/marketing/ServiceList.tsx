import { Accessibility, CarFront } from 'lucide-react';
import { SteeringWheelIcon } from './BrandIcons';
import { SITE_SERVICES } from '@/lib/site-content';
import styles from './marketing.module.css';

const icons = { motorista: SteeringWheelIcon, motorista_carro: CarFront, acessibilidade: Accessibility };

export default function ServiceList() {
  return (
    <ul className={styles.services}>
      {SITE_SERVICES.map(({ id, title, description }) => {
        const Icon = icons[id];
        return (
          <li key={id} className={styles.service}>
            <Icon className={styles.serviceIcon} size={48} strokeWidth={1.6} aria-hidden="true" />
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>
        );
      })}
    </ul>
  );
}
