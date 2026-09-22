'use client';
import { useActionState } from 'react';
import { retryAutomaticRefund, type ManualRefundActionState } from './actions';
const initial: ManualRefundActionState = { status: 'idle', message: '' };
export function RetryAutomaticRefundForm({ refundId }: { refundId: string }) {
  const [state, action, pending] = useActionState(retryAutomaticRefund, initial);
  return <form action={action} className="mt-4 space-y-3">
    <input type="hidden" name="reembolso_id" value={refundId} />
    <p>Após verificar a falha, solicite nova tentativa. O sistema consultará o provedor antes de tentar novamente, preservando a mesma operação.</p>
    <label className="grid gap-1 font-medium">Justificativa
      <textarea name="motivo" required minLength={10} maxLength={500} rows={2}
        className="rounded border border-zinc-300 bg-white p-2 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100" />
    </label>
    <button disabled={pending} className="rounded bg-blue-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
      {pending ? 'Solicitando…' : 'Solicitar nova tentativa de reembolso'}
    </button>
    <p role="status">{state.message}</p>
  </form>;
}
