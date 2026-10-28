'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { CITY_FLAGS, UFS } from './constants';

export type CityFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  // Ecoa o que foi enviado para que o formulário não perca os dados após um erro.
  values?: Record<string, string | boolean>;
};

function echo(formData: FormData) {
  return {
    cidade: String(formData.get('cidade') ?? ''),
    estado: String(formData.get('estado') ?? ''),
    ...Object.fromEntries(CITY_FLAGS.map(({ key }) => [key, formData.get(key) === 'on'])),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ParsedCity =
  | { error: string }
  | { value: { cidade: string; estado: string } & Record<(typeof CITY_FLAGS)[number]['key'], boolean> };

function parseCity(formData: FormData): ParsedCity {
  const cidade = String(formData.get('cidade') ?? '').trim().replace(/\s+/g, ' ');
  const estado = String(formData.get('estado') ?? '').trim().toUpperCase();
  if (cidade.length < 2 || cidade.length > 100) {
    return { error: 'Informe o nome da cidade (2 a 100 caracteres).' };
  }
  if (!(UFS as readonly string[]).includes(estado)) {
    return { error: 'Selecione uma UF válida.' };
  }
  const flags = Object.fromEntries(
    CITY_FLAGS.map(({ key }) => [key, formData.get(key) === 'on']),
  ) as Record<(typeof CITY_FLAGS)[number]['key'], boolean>;
  return { value: { cidade, estado, ...flags } };
}

function errorMessage(error: { code?: string; message: string }, fallback: string) {
  if (error.code === '23505') return 'Esta cidade já está cadastrada para essa UF.';
  if (error.code === '42501') return 'Sem permissão para alterar cidades.';
  console.error(fallback, { code: error.code, message: error.message });
  return fallback;
}

export async function createCity(_state: CityFormState, formData: FormData): Promise<CityFormState> {
  const parsed = parseCity(formData);
  if ('error' in parsed) return { status: 'error', message: parsed.error, values: echo(formData) };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('cidades_atendimento').insert(parsed.value);
  if (error) {
    return {
      status: 'error',
      message: errorMessage(error, 'Não foi possível cadastrar a cidade.'),
      values: echo(formData),
    };
  }

  revalidatePath('/cidades');
  return { status: 'success', message: `${parsed.value.cidade}/${parsed.value.estado} cadastrada.` };
}

export async function updateCity(_state: CityFormState, formData: FormData): Promise<CityFormState> {
  const id = String(formData.get('id') ?? '');
  if (!UUID.test(id)) return { status: 'error', message: 'Cidade inválida.' };
  const parsed = parseCity(formData);
  if ('error' in parsed) return { status: 'error', message: parsed.error };

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('cidades_atendimento')
    .update(parsed.value)
    .eq('id', id)
    .select('id');
  if (error) return { status: 'error', message: errorMessage(error, 'Não foi possível salvar a cidade.') };
  // Com RLS, um update bloqueado não gera erro: apenas não afeta linhas.
  if (!data?.length) return { status: 'error', message: 'Cidade não encontrada ou sem permissão.' };

  revalidatePath('/cidades');
  return { status: 'success', message: 'Salvo.' };
}

export async function deleteCity(_state: CityFormState, formData: FormData): Promise<CityFormState> {
  const id = String(formData.get('id') ?? '');
  if (!UUID.test(id)) return { status: 'error', message: 'Cidade inválida.' };

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('cidades_atendimento')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) return { status: 'error', message: errorMessage(error, 'Não foi possível excluir a cidade.') };
  if (!data?.length) return { status: 'error', message: 'Cidade não encontrada ou sem permissão.' };

  revalidatePath('/cidades');
  return { status: 'success', message: 'Cidade excluída.' };
}
