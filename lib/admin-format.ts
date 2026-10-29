import 'server-only';

const ADMIN_TIME_ZONE = 'America/Sao_Paulo';

export function formatAdminDate(value?: string | null) {
  if (!value) return '—';
  // PostgreSQL date values have no time zone; parsing them as UTC loses a day in Brazil.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: ADMIN_TIME_ZONE });
}

export function formatAdminDateTime(value?: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleString('pt-BR', {
    timeZone: ADMIN_TIME_ZONE,
  });
}
