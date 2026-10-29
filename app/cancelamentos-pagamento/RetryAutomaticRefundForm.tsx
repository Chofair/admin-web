'use client';
import { useActionState } from 'react';
import { retryAutomaticRefund, requestCancellationVerification, type ManualRefundActionState } from './actions';
const initial: ManualRefundActionState = { status: 'idle', message: '' };
export function RetryAutomaticRefundForm({ refundId, paymentId }: { refundId?: string; paymentId?: string }) {
  const [state, action, pending] = useActionState(paymentId ? requestCancellationVerification : retryAutomaticRefund, initial);
  return <form action={action} className="mt-4 space-y-3">
    <input type="hidden" name={paymentId ? 'pagamento_id' : 'reembolso_id'} value={paymentId ?? refundId} />
    <p>Após conferir o caso, solicite uma verificação adicional. O histórico e os limites automáticos são preservados. Há um intervalo mínimo de 30 minutos e limite de três solicitações em 24 horas por cobrança.</p>
    <label className="grid gap-1 font-medium">Justificativa
      <textarea name="motivo" required minLength={10} maxLength={500} rows={2}
        className="rounded border border-zinc-300 bg-white p-2 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100" />
    </label>
    <button disabled={pending || state.status === 'success'} className="min-h-11 rounded bg-blue-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
      {pending ? 'Solicitando…' : 'Solicitar nova verificação'}
    </button>
    <p role="status">{state.message}</p>
  </form>;
}
