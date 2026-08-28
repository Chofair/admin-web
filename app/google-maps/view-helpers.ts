import type { MapsServiceGroup } from '@/lib/maps-monitoring';

export type UsageTone = {
  label: string;
  border: string;
  badge: string;
  bar: string;
};

export function formatNumber(value?: number | null, maximumFractionDigits = 0) {
  return (value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits });
}

export function formatCurrency(value: number, currency: string) {
  try {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  } catch {
    return `${currency} ${formatNumber(value, 6)}`;
  }
}

export function formatOperation(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getUsageTone(percentage: number | null): UsageTone {
  if (percentage == null) {
    return {
      label: 'Gratuito e ilimitado',
      border: 'border-blue-200 dark:border-blue-900',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      bar: 'bg-blue-500',
    };
  }
  if (percentage >= 95) {
    return {
      label: 'Crítico',
      border: 'border-red-300 dark:border-red-900',
      badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      bar: 'bg-red-600',
    };
  }
  if (percentage >= 80) {
    return {
      label: 'Alto',
      border: 'border-orange-300 dark:border-orange-900',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      bar: 'bg-orange-500',
    };
  }
  if (percentage >= 50) {
    return {
      label: 'Atenção',
      border: 'border-amber-300 dark:border-amber-900',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      bar: 'bg-amber-500',
    };
  }
  return {
    label: 'Normal',
    border: 'border-emerald-200 dark:border-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  };
}

export function isMapsServiceGroup(value?: string): value is MapsServiceGroup {
  return ['places', 'geocoding', 'routes', 'maps_sdk'].includes(value ?? '');
}
