export const EVENT_LABELS = {
  interesse_cadastro: 'Cadastro concluído sem cobertura',
  recusa_cidade: 'Recusa por cidade',
  recusa_modalidade: 'Recusa por modalidade',
  falha_tecnica: 'Falha técnica reportada',
} as const;
export const MODALITY_LABELS = { motorista: 'Carro do cliente', motorista_carro: 'Carro do motorista', acessibilidade: 'Corrida acessível' } as const;
export const ROLE_LABELS = { user: 'Cliente', driver: 'Motorista' } as const;
export type EventType = keyof typeof EVENT_LABELS;
export type Filters = { inicio: string; fim: string; cidade: string; uf: string; tipo: string; papel: string; modalidade: string; antes?: string; antesId?: string };
export type EventRow = { id: string; criado_em: string; usuario_id: string | null; tipo: EventType; momento: string; papel: keyof typeof ROLE_LABELS; cidade: string | null; estado: string | null; modalidade: keyof typeof MODALITY_LABELS | null; codigo: string };
export type DemandData = {
  resumo: { total: number; interesses: number; recusas_cidade: number; recusas_modalidade: number; falhas: number };
  cidades: { cidade: string | null; estado: string | null; total: number; interesses: number; recusas: number; falhas: number }[];
  eventos: EventRow[]; mais: boolean;
};
export type Query = Record<string, string | string[] | undefined>;
const isoDay = (value: Date) => value.toISOString().slice(0, 10);
const dayOffset = (day: string, amount: number) => isoDay(new Date(Date.parse(day + 'T00:00:00Z') + amount * 86400000));
const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day + 'T00:00:00Z')) && isoDay(new Date(day + 'T00:00:00Z')) === day;
export function parseDemandFilters(query: Query, states: readonly string[], now = new Date()): { filters: Filters; error: string | null } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const get = (key: string) => typeof query[key] === 'string' ? query[key].trim() : '';
  const filters: Filters = { inicio: get('inicio') || dayOffset(today, -29), fim: get('fim') || today,
    cidade: get('cidade'), uf: get('uf'), tipo: get('tipo'), papel: get('papel'), modalidade: get('modalidade') };
  let error: string | null = null;
  if (Object.values(query).some(Array.isArray) || !validDay(filters.inicio) || !validDay(filters.fim)
    || filters.inicio > filters.fim || filters.fim > today || filters.inicio < dayOffset(today, -29)
    || Date.parse(filters.fim) - Date.parse(filters.inicio) > 29 * 86400000) error = 'Selecione um período nos últimos 30 dias.';
  if (filters.cidade.length > 100 || filters.uf && !states.includes(filters.uf)
    || filters.tipo && !Object.hasOwn(EVENT_LABELS, filters.tipo) || filters.papel && !Object.hasOwn(ROLE_LABELS, filters.papel)
    || filters.modalidade && !Object.hasOwn(MODALITY_LABELS, filters.modalidade)) error = 'Confira os filtros selecionados.';
  const before = get('antes'), id = get('antes_id');
  if (before || id) {
    if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before) || before.length > 40
      || !Number.isFinite(Date.parse(before)) || !/^[1-9]\d{0,18}$/.test(id) || BigInt(id || '0') > BigInt('9223372036854775807')) {
      error = 'A página informada é inválida. Volte ao início da consulta.';
    } else { filters.antes = before; filters.antesId = id; }
  }
  return { filters, error };
}
export function isDemandSetupMissing(error: { code?: string; message?: string } | null) {
  return !!error && ['PGRST202', '42883'].includes(error.code ?? '')
    && (error.message ?? '').includes('admin_consultar_demanda_cidades');
}
export function demandRpcArgs(filters: Filters) {
  return { p_inicio: filters.inicio, p_fim: filters.fim, p_cidade: filters.cidade || null, p_estado: filters.uf || null,
    p_tipo: filters.tipo || null, p_papel: filters.papel || null, p_modalidade: filters.modalidade || null,
    p_antes: filters.antes ?? null, p_antes_id: filters.antesId ?? null };
}
export function demandUrl(filters: Filters, cursor?: EventRow, city?: { cidade: string | null; estado: string | null }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value && key !== 'antes' && key !== 'antesId') params.set(key, value);
  if (city?.cidade) params.set('cidade', city.cidade);
  if (city?.estado) params.set('uf', city.estado);
  if (cursor) { params.set('antes', cursor.criado_em); params.set('antes_id', cursor.id); }
  return '/cidades/demanda?' + params.toString();
}
