import 'server-only';

import type { createSupabaseServerClient } from '@/lib/supabase-server';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type AdminProfile = {
  id: string;
  name: string | null;
  cpf: string | null;
  phone: string | null;
  birthdate: string | null;
  cep: string | null;
  numero: string | null;
  estado: string | null;
  cidade: string | null;
  created_at: string | null;
  telefone: string | null;
  foto_perfil_url: string | null;
  data_nascimento: string | null;
  terms_role: 'user' | 'driver' | null;
  terms_version_accepted: number | null;
  terms_accepted_at: string | null;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  accessibility_profile: Record<string, unknown> | null;
};

type ListAdminProfilesOptions = {
  ids?: string[];
  role?: 'user' | 'driver';
  limit?: number;
  offset?: number;
};

type AdminProfilesPayload = {
  items?: unknown;
  total?: unknown;
};

export async function listAdminProfiles(
  supabase: SupabaseServerClient,
  options: ListAdminProfilesOptions = {},
) {
  const ids = options.ids ? [...new Set(options.ids)] : undefined;
  if (ids && ids.length === 0) {
    return { items: [] as AdminProfile[], total: 0 };
  }

  const limit = options.limit ?? (ids ? Math.min(ids.length, 200) : 50);
  const { data, error } = await supabase.rpc('admin_listar_perfis', {
    ids_input: ids ?? null,
    papel_input: options.role ?? null,
    limite_input: limit,
    deslocamento_input: options.offset ?? 0,
  });

  if (error) {
    console.error('Erro ao consultar perfis pela RPC administrativa:', {
      code: error.code,
      message: error.message,
    });
    throw new Error('Nao foi possivel consultar os perfis administrativos.');
  }

  const payload = (data ?? {}) as AdminProfilesPayload;
  const items = Array.isArray(payload.items)
    ? (payload.items as AdminProfile[])
    : [];
  const parsedTotal = Number(payload.total ?? 0);

  return {
    items,
    total: Number.isFinite(parsedTotal) ? parsedTotal : 0,
  };
}

export async function getAdminProfilesByIds(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  const uniqueIds = [...new Set(ids)];
  const profiles: AdminProfile[] = [];

  for (let index = 0; index < uniqueIds.length; index += 200) {
    const batch = uniqueIds.slice(index, index + 200);
    const result = await listAdminProfiles(supabase, { ids: batch });
    profiles.push(...result.items);
  }

  return profiles;
}

export async function getAdminProfile(
  supabase: SupabaseServerClient,
  id: string,
) {
  const profiles = await getAdminProfilesByIds(supabase, [id]);
  return profiles[0] ?? null;
}

export async function countAdminProfiles(
  supabase: SupabaseServerClient,
  role?: 'user' | 'driver',
) {
  return (await listAdminProfiles(supabase, { role, limit: 1 })).total;
}
