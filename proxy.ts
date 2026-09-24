import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  getSupabaseAuthCookieNames,
  isTerminalRefreshTokenError,
} from '@/lib/supabase-auth-cookies';

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedRoutes = [
  '/admin',
  '/motoristas',
  '/veiculos',
  '/usuarios',
  '/solicitacoes',
  '/revisoes-corridas',
  '/cancelamentos-pagamento',
  '/cancelamentos',
  '/pagamentos',
  '/google-maps',
] as const;

function isProtectedPath(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getLoginUrl(request: NextRequest, errorCode?: string) {
  const url = new URL('/login', request.url);
  if (errorCode) url.searchParams.set('erro', errorCode);
  return url;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/login';
  const isProtected = isProtectedPath(pathname);

  // Defesa contra uma eventual ampliação acidental do matcher.
  if (!isLogin && !isProtected) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Configuração pública do Supabase ausente no painel administrativo.');
    return isProtected
      ? NextResponse.redirect(getLoginUrl(request, 'configuracao'))
      : NextResponse.next();
  }

  const pendingCookies = new Map<string, PendingCookie>();
  const pendingHeaders = new Map<string, string>();
  const incomingAuthCookieNames = getSupabaseAuthCookieNames(
    request.cookies.getAll(),
  );

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        for (const cookie of cookiesToSet) {
          pendingCookies.set(cookie.name, cookie);
          request.cookies.set(cookie.name, cookie.value);
        }
        for (const [name, value] of Object.entries(headersToSet)) {
          pendingHeaders.set(name, value);
        }
      },
    },
  });

  function finalizeResponse(
    response: NextResponse,
    { clearAuthCookies = false }: { clearAuthCookies?: boolean } = {},
  ) {
    for (const { name, value, options } of pendingCookies.values()) {
      response.cookies.set(name, value, options);
    }
    for (const [name, value] of pendingHeaders) {
      response.headers.set(name, value);
    }

    if (clearAuthCookies) {
      const authCookieNames = getSupabaseAuthCookieNames([
        ...request.cookies.getAll(),
        ...pendingCookies.values(),
      ]);
      for (const name of authCookieNames) {
        response.cookies.set(name, '', {
          expires: new Date(0),
          httpOnly: true,
          maxAge: 0,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
      response.headers.set(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate, max-age=0',
      );
      response.headers.set('Expires', '0');
      response.headers.set('Pragma', 'no-cache');
    }

    return response;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const terminalRefreshError = isTerminalRefreshTokenError(authError);
  const hasIncomingAuthCookies = incomingAuthCookieNames.length > 0;
  const requestedError = request.nextUrl.searchParams.get('erro');

  if (!user) {
    let errorCode: string | undefined;
    if (terminalRefreshError) {
      errorCode = 'sessao_expirada';
    } else if (authError && hasIncomingAuthCookies) {
      errorCode = 'sessao_indisponivel';
    }

    if (isProtected) {
      return finalizeResponse(
        NextResponse.redirect(getLoginUrl(request, errorCode)),
        { clearAuthCookies: terminalRefreshError },
      );
    }

    if (errorCode && !requestedError) {
      return finalizeResponse(
        NextResponse.redirect(getLoginUrl(request, errorCode)),
        { clearAuthCookies: terminalRefreshError },
      );
    }

    return finalizeResponse(NextResponse.next({ request }), {
      clearAuthCookies: terminalRefreshError,
    });
  }

  // As páginas protegidas repetem a autorização com requireAdmin perto dos
  // dados. O proxy faz apenas a checagem de sessão para evitar uma consulta de
  // perfil duplicada em toda navegação administrativa.
  if (isProtected) {
    return finalizeResponse(NextResponse.next({ request }));
  }

  // Em /login, uma sessão existente precisa ter o papel validado para evitar
  // loops entre login e dashboard quando o usuário não é administrador.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Erro ao verificar perfil administrativo no login:', {
      code: profileError.code,
      message: profileError.message,
    });

    if (requestedError === 'verificacao') {
      return finalizeResponse(NextResponse.next({ request }));
    }

    return finalizeResponse(
      NextResponse.redirect(getLoginUrl(request, 'verificacao')),
    );
  }

  if (!profile?.is_admin) {
    if (requestedError === 'acesso_negado') {
      return finalizeResponse(NextResponse.next({ request }), {
        clearAuthCookies: true,
      });
    }

    return finalizeResponse(
      NextResponse.redirect(getLoginUrl(request, 'acesso_negado')),
      { clearAuthCookies: true },
    );
  }

  return finalizeResponse(
    NextResponse.redirect(new URL('/admin', request.url)),
  );
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/motoristas/:path*',
    '/veiculos/:path*',
    '/usuarios/:path*',
    '/solicitacoes/:path*',
    '/revisoes-corridas/:path*',
    '/cancelamentos-pagamento/:path*',
    '/cancelamentos/:path*',
    '/pagamentos/:path*',
    '/google-maps/:path*',
  ],
};
