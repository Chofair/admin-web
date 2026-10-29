import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminDriverDetail } from './admin-driver-vehicles';
import type { AdminProfile } from './admin-profiles';

export type DriverChange = {
  id: string; reason: string; created_at: string; actor_name: string | null;
  changes: Record<string, { before: unknown; after: unknown }>;
};
export type EditableDriverDetail = AdminDriverDetail & {
  profile: AdminProfile & { email: string | null; deleted_at: string | null };
  editable: Record<string, unknown>;
  revision: string;
  login_email: string | null;
  login_email_editable: boolean;
  history: DriverChange[];
};

export async function getEditableDriver(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.rpc('admin_obter_edicao_motorista', { p_motorista_id: id });
  if (error) {
    console.error('Falha ao consultar edição de motorista', { code: error.code });
    throw new Error('Não foi possível carregar os dados do motorista.');
  }
  return data as EditableDriverDetail | null;
}

export async function resolveCnhDocument(supabase: SupabaseClient, reference: { cnh_storage_path?: unknown; cnh_foto_url?: unknown; cnh_mime_type?: unknown }) {
  const mime = typeof reference.cnh_mime_type === 'string' ? reference.cnh_mime_type : null;
  const legacyReference = String(reference.cnh_foto_url ?? '');
  const path = reference.cnh_storage_path || (legacyReference.startsWith('private:cnh-documentos/') ? legacyReference.slice('private:cnh-documentos/'.length) : null);
  if (typeof path === 'string' && path) {
    const { data, error } = await supabase.storage.from('cnh-documentos').createSignedUrl(path, 300);
    return { url: error ? null : data.signedUrl, mime: mime ?? (path.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') };
  }
  try {
    const url = new URL(String(reference.cnh_foto_url ?? ''));
    const expected = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (url.origin === expected.origin && url.protocol === 'https:' && url.pathname.startsWith('/storage/v1/object/public/documentos/')) {
      return { url: url.href, mime: mime ?? (url.pathname.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') };
    }
  } catch { /* No usable document reference. */ }
  return { url: null, mime };
}

export function driverEditError(error: { code?: string; message?: string }, fallback: string) {
  const messages: Record<string, string> = {
    '40001': 'Os dados foram alterados por outra pessoa. Recarregue a ficha antes de salvar.',
    'PT409': 'Os dados foram alterados por outra pessoa. Recarregue a ficha antes de salvar.',
    '23505': 'Este CPF ou e-mail já está cadastrado. Confira os dados.',
    '42501': 'Sua sessão não tem permissão para esta operação. Entre novamente no painel.',
    'P0002': 'Motorista não encontrado.',
  };
  return messages[error.code ?? ''] ?? fallback;
}
