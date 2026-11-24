export type V2Tariff = {
  id: string; nome: string; limite_curta_metros: number; fixa_centavos: number;
  km_curta_centavos: number; minimo_centavos: number; hora_centavos: number;
  domingo_hora_centavos: number; km_longa_centavos: number; updated_at: string;
};
export const V2_TARIFF_FIELDS = [
  ['fixa_centavos', 'Parcela fixa da curta (R$)'],
  ['km_curta_centavos', 'Quilômetro da curta (R$)'],
  ['minimo_centavos', 'Preço mínimo (R$)'],
  ['hora_centavos', 'Hora-base — Longa e adicionais da Curta (R$)'],
  ['domingo_hora_centavos', 'Hora da longa — domingo (R$)'],
  ['km_longa_centavos', 'Quilômetro da longa (R$)'],
] as const;
export function v2TimeCharges(tariff: Pick<V2Tariff, 'hora_centavos' | 'domingo_hora_centavos'>) {
  const baseBlockCents = Math.round(tariff.hora_centavos / 4);
  const sundayBlockCents = Math.round(tariff.domingo_hora_centavos / 4);
  return { baseBlockCents, sundayBlockCents,
    baseExtensionCents: baseBlockCents * 4, sundayExtensionCents: sundayBlockCents * 4 };
}
function decimal(value: FormDataEntryValue | null, scale: number) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!new RegExp(`^\\d{1,7}(?:\\.\\d{1,${scale}})?$`).test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 10 ** scale + Number(fraction.padEnd(scale, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
export function parseV2TariffForm(form: FormData): { value: Omit<V2Tariff, 'updated_at'> } | { error: string } {
  const id = String(form.get('id') ?? '');
  const nome = String(form.get('nome') ?? '').trim();
  if (!['vale', 'grande_sp', 'padrao'].includes(id) || !nome || nome.length > 80) return { error: 'Perfil tarifário inválido.' };
  const limit = decimal(form.get('limite_km'), 3);
  if (limit == null || limit < 1 || limit > 1200000) return { error: 'Informe um limite entre 0,001 e 1.200 km.' };
  const values: Record<string, number> = {};
  for (const [key, label] of V2_TARIFF_FIELDS) {
    const cents = decimal(form.get(key), 2);
    if (cents == null || cents < (key === 'fixa_centavos' ? 0 : 1) || cents > 1000000) return { error: `Valor inválido: ${label}. Use até duas casas decimais.` };
    values[key] = cents;
  }
  return { value: { id, nome, limite_curta_metros: limit, ...values } as Omit<V2Tariff, 'updated_at'> };
}
