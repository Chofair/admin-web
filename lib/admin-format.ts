import 'server-only';

const ADMIN_TIME_ZONE = 'America/Sao_Paulo';

export function formatAdminDateTime(value?: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleString('pt-BR', {
    timeZone: ADMIN_TIME_ZONE,
  });
}
