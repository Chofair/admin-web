import { createBrowserClient } from '@supabase/ssr';

// Client para uso em client components (browser)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
