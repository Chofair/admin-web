'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';

const loginErrorMessages: Record<string, string> = {
  acesso_negado: 'Você não tem permissão de acesso ao painel admin.',
  configuracao: 'O painel está sem a configuração necessária do Supabase.',
  sessao_expirada: 'Sua sessão anterior expirou. Entre novamente.',
  sessao_indisponivel: 'Não foi possível validar sua sessão. Tente entrar novamente.',
  verificacao: 'Não foi possível verificar sua permissão administrativa agora.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('erro') ?? '';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(loginErrorMessages[errorCode] ?? '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

      if (error || !data.user) {
        setErro('Email ou senha incorretos.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut({ scope: 'local' });
        setErro('Não foi possível verificar sua permissão administrativa. Tente novamente.');
        return;
      }

      if (!profile?.is_admin) {
        await supabase.auth.signOut({ scope: 'local' });
        setErro('Você não tem permissão de acesso ao painel admin.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setErro('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0058A3]">Chofair</h1>
          <p className="text-slate-400 mt-1 text-sm">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800 rounded-2xl p-8 shadow-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0058A3] focus:border-transparent"
              placeholder="admin@chofair.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0058A3] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0058A3] hover:bg-[#0069C0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-slate-400 transition-colors hover:text-white"
        >
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
