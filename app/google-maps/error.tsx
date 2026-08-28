'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import NavBar from '@/components/NavBar';

export default function GoogleMapsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Falha ao renderizar monitoramento Google Maps:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto flex max-w-7xl justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-zinc-900">
          <AlertTriangle className="mx-auto text-red-500" size={34} />
          <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Não foi possível carregar o monitoramento
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Verifique a conexão com o Supabase e tente novamente. Nenhum dado foi
            alterado.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCcw size={16} />
            Tentar novamente
          </button>
        </div>
      </main>
    </div>
  );
}
