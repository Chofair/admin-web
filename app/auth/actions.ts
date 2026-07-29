'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAuthCookieNames } from '@/lib/supabase-auth-cookies';

export async function logout() {
  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error && error.code !== 'session_not_found') {
      console.error('Erro ao encerrar sessão administrativa:', {
        code: error.code,
        message: error.message,
      });
    }
  } catch {
    console.error('Falha inesperada ao encerrar sessão administrativa.');
  }

  // Defesa em profundidade: mesmo se a revogação remota falhar, remove somente
  // os cookies de autenticação deste projeto Supabase no navegador atual.
  const cookieStore = await cookies();
  const authCookieNames = getSupabaseAuthCookieNames(cookieStore.getAll());
  for (const name of authCookieNames) {
    cookieStore.set(name, '', {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  redirect('/login');
}
