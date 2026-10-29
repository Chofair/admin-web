'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { driverEditError, getEditableDriver } from '@/lib/admin-driver-edit';
import { CNH_MAX_BYTES, CNH_MIME_EXTENSIONS, UUID_PATTERN, validDocumentSignature, validateCnhChanges, validateDriverChanges } from '@/lib/driver-edit-validation';

export type DriverEditState = { status: 'idle' | 'error' | 'success'; message: string };

function validContext(id: string, revision: string, reason: string) {
  return UUID_PATTERN.test(id) && /^[a-f0-9]{32}$/.test(revision) && reason.trim().length >= 10 && reason.trim().length <= 500;
}
function refreshDriver(id: string) {
  for (const path of ['/motoristas', `/motoristas/${id}`, `/usuarios/${id}`, '/usuarios', '/acessibilidade', `/acessibilidade/${id}`]) revalidatePath(path);
}
function validUploadPath(id: string, path: string) {
  return UUID_PATTERN.test(id) && new RegExp('^' + id + '/[0-9a-f-]{36}\\.(pdf|jpg|png)$').test(path);
}

export async function saveDriverChanges(id: string, revision: string, fields: unknown, reason: string, confirmed: boolean): Promise<DriverEditState> {
  const { supabase } = await requireAdmin();
  if (!confirmed || !validContext(id, revision, reason)) return { status: 'error', message: 'Confira os dados e informe um motivo entre 10 e 500 caracteres.' };
  const result = validateDriverChanges(fields);
  if (result.error || !result.fields) return { status: 'error', message: result.error ?? 'Dados inválidos.' };
  const { error } = await supabase.rpc('admin_atualizar_dados_motorista', {
    p_motorista_id: id, p_fields: result.fields, p_revision: revision, p_reason: reason.trim(),
  });
  if (error) {
    console.error('Falha na edição administrativa de motorista', { code: error.code });
    return { status: 'error', message: driverEditError(error, 'Não foi possível salvar. Confira os campos e tente novamente.') };
  }
  refreshDriver(id);
  return { status: 'success', message: 'Dados atualizados. O motivo e as alterações foram registrados no histórico.' };
}

export async function correctDriverLoginEmail(id: string, revision: string, email: string, reason: string, confirmed: boolean): Promise<DriverEditState> {
  const { supabase } = await requireAdmin();
  if (!confirmed || !validContext(id, revision, reason) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 'error', message: 'Confira o e-mail, o motivo e a confirmação de identidade.' };
  const { data, error } = await supabase.functions.invoke('admin-corrigir-email-motorista', { body: { driverId: id, revision, email: email.trim().toLowerCase(), reason: reason.trim(), confirmed } });
  if (error || !data?.ok) {
    let message = 'Não foi possível corrigir o login. Recarregue a ficha e confira os dados antes de tentar novamente.';
    if (error?.context instanceof Response) {
      try { const body = await error.context.json(); if (typeof body.error === 'string') message = body.error; } catch { /* Keep the safe fallback. */ }
    }
    return { status: 'error', message };
  }
  refreshDriver(id);
  return { status: 'success', message: 'E-mail de acesso corrigido. O motorista deve usar o novo endereço para entrar. A correção foi auditada.' };
}

export async function prepareCnhUpload(id: string, mime: string, size: number) {
  const { supabase } = await requireAdmin();
  if (!UUID_PATTERN.test(id) || !Object.hasOwn(CNH_MIME_EXTENSIONS, mime) || !Number.isInteger(size) || size <= 0 || size > CNH_MAX_BYTES) return { error: 'Envie PDF, JPG ou PNG de até 10 MB.' };
  if (!await getEditableDriver(supabase, id)) return { error: 'Motorista não encontrado.' };
  const path = `${id}/${randomUUID()}.${CNH_MIME_EXTENSIONS[mime]}`;
  const { data, error } = await supabase.storage.from('cnh-documentos').createSignedUploadUrl(path, { upsert: false });
  if (error) return { error: 'Não foi possível preparar o envio. Verifique sua sessão e tente novamente.' };
  return { path, token: data.token };
}

export async function discardCnhUpload(id: string, path: string) {
  const { supabase } = await requireAdmin();
  if (!validUploadPath(id, path)) return;
  // RLS prevents deleting either the current file or one referenced in the audit history.
  await supabase.storage.from('cnh-documentos').remove([path]);
}

export async function finishCnhUpload(id: string, revision: string, path: string, mime: string, cnh: Record<string, unknown>, reason: string, confirmed: boolean): Promise<DriverEditState> {
  const { supabase } = await requireAdmin();
  if (!validUploadPath(id, path)) return { status: 'error', message: 'Dados do documento inválidos.' };
  let saved = false;
  try {
    if (!confirmed || !validContext(id, revision, reason) || !Object.hasOwn(CNH_MIME_EXTENSIONS, mime)) return { status: 'error', message: 'Dados do documento inválidos.' };
    const validated = validateCnhChanges(cnh);
    if (!validated.fields) return { status: 'error', message: validated.error ?? 'Confira número, validade e categoria da CNH.' };
    const { data: blob, error: downloadError } = await supabase.storage.from('cnh-documentos').download(path);
    if (downloadError || !blob || blob.size > CNH_MAX_BYTES || blob.size <= 0 || blob.type !== mime || !validDocumentSignature(new Uint8Array(await blob.slice(0, 16).arrayBuffer()), mime)) {
      return { status: 'error', message: 'O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido.' };
    }
    const { error } = await supabase.rpc('admin_substituir_cnh_motorista', {
      p_motorista_id: id, p_path: path, p_mime: mime, p_revision: revision, p_reason: reason.trim(), p_cnh: validated.fields,
    });
    if (error) return { status: 'error', message: driverEditError(error, 'Não foi possível substituir a CNH. Confira o documento e os dados.') };
    saved = true;
    refreshDriver(id);
    return { status: 'success', message: 'CNH substituída com segurança. Dados e documento foram salvos juntos, mantendo o status do motorista.' };
  } finally {
    if (!saved) await supabase.storage.from('cnh-documentos').remove([path]);
  }
}
