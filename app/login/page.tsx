'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import appIcon from '@/public/brand/chofair-icon.png';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

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
    <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.intro}>
          <h1 id="login-title">Acesse o painel</h1>
          <p>Entre com sua conta administrativa.</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form} aria-busy={loading}>
          <div className={styles.field}>
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              disabled={loading}
              placeholder="seuemail@empresa.com.br"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div role="alert" className={styles.error}>
              <p>{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submit}
          >
            {loading ? <><LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin" />Entrando...</> : <>Entrar <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link href="/" className={styles.brand} aria-label="Chofair — voltar ao site">
          <Image src={appIcon} alt="" width={60} height={60} sizes="60px" className={styles.logo} />
          <span><strong>Chofair</strong><span>Painel administrativo</span><span className={styles.yellowRule} aria-hidden="true" /></span>
        </Link>
        <Suspense fallback={<div className={styles.card} role="status">Carregando formulário de acesso...</div>}>
          <LoginForm />
        </Suspense>
        <Link href="/" className={styles.back}><ArrowLeft size={17} aria-hidden="true" />Voltar ao site</Link>
      </div>
    </main>
  );
}
