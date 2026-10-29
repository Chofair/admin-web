import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getEditableDriver, resolveCnhDocument } from '@/lib/admin-driver-edit';
import { UUID_PATTERN } from '@/lib/driver-edit-validation';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const historyId = new URL(request.url).searchParams.get('history');
  if (!UUID_PATTERN.test(id) || (historyId && !UUID_PATTERN.test(historyId))) return new NextResponse('Documento não encontrado.', { status: 404 });
  const detail = await getEditableDriver(supabase, id);
  if (!detail) return new NextResponse('Documento não encontrado.', { status: 404 });
  let reference = detail.editable;
  if (historyId) {
    const entry = detail.history.find((item) => item.id === historyId);
    if (!entry) return new NextResponse('Documento não encontrado.', { status: 404 });
    reference = { cnh_storage_path: entry.changes.cnh_storage_path?.before, cnh_foto_url: entry.changes.cnh_foto_url?.before, cnh_mime_type: entry.changes.cnh_mime_type?.before };
  }
  const document = await resolveCnhDocument(supabase, reference);
  if (!document.url) return new NextResponse('Documento indisponível. Recarregue a ficha e tente novamente.', { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  const response = NextResponse.redirect(document.url);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
