import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Components have read-only cookies. The proxy persists
            // refreshed sessions before rendering; Server Actions still write here.
            if (!(error instanceof Error) || !error.message.startsWith(
              'Cookies can only be modified in a Server Action or Route Handler.'
            )) {
              throw error;
            }
          }
        },
      },
    }
  );
}
