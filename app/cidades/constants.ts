export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

// ativo_cliente é coluna gerada (v1 OR v2 OR v3) e nunca deve ser enviada no insert/update.
export const CITY_FLAGS = [
  { key: 'ativo_cliente_v1', label: 'Cliente V1 (só motorista)' },
  { key: 'ativo_cliente_v2', label: 'Cliente V2 (motorista + carro)' },
  { key: 'ativo_cliente_v3', label: 'Cliente V3 (acessibilidade)' },
  { key: 'ativo_motorista', label: 'Motorista' },
  { key: 'ativo_motorista_acessibilidade', label: 'Motorista acessib.' },
  { key: 'ativo_vans', label: 'Vans' },
] as const;

export type CityFlagKey = (typeof CITY_FLAGS)[number]['key'];

export type CityRow = Record<CityFlagKey, boolean> & {
  id: string;
  cidade: string;
  estado: string;
  ativo_cliente: boolean;
  updated_at: string;
};
