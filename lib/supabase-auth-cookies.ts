import 'server-only';

type NamedCookie = { name: string };

function getSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const [projectRef] = new URL(supabaseUrl).hostname.split('.');
    return /^[a-z0-9]+$/i.test(projectRef) ? projectRef : null;
  } catch {
    return null;
  }
}

export function getSupabaseAuthCookieNames(cookies: readonly NamedCookie[]) {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) return [];

  const storageKey = `sb-${projectRef}-auth-token`;
  return [
    ...new Set(
      cookies
        .map((cookie) => cookie.name)
        .filter(
          (name) =>
            name === storageKey ||
            name.startsWith(`${storageKey}.`) ||
            name.startsWith(`${storageKey}-`),
        ),
    ),
  ];
}

export function isTerminalRefreshTokenError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;

  return (
    error.code === 'refresh_token_not_found' ||
    error.code === 'refresh_token_already_used' ||
    error.message?.includes('Invalid Refresh Token') === true
  );
}
