'use client';

import { useTransition } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import NavBar from './NavBar';

export default function AdminError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><NavBar><main className="mx-auto max-w-xl px-4 py-16">
    <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <AlertTriangle className="mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold">Não foi possível carregar os dados</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Confira sua conexão e tente novamente. Você também pode acessar outra seção pelo menu.</p>
      <button disabled={pending} onClick={() => startTransition(() => unstable_retry())} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><RefreshCcw size={16} aria-hidden="true" />{pending ? 'Carregando…' : 'Tentar novamente'}</button>
    </section>
  </main></NavBar></div>;
}
