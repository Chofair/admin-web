import NavBar from '@/components/NavBar';
import { LoaderCircle } from 'lucide-react';

export default function AdminLoading() {
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><NavBar>
    <main aria-busy="true" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p role="status" className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300"><LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />Carregando dados…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-28 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />)}</div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">{[0, 1, 2, 3, 4].map((key) => <div key={key} className="my-4 h-8 rounded bg-zinc-100 dark:bg-zinc-800" />)}</div>
      </div>
    </main>
  </NavBar></div>;
}
