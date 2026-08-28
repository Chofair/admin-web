'use client';

import { useActionState } from 'react';
import {
  reopenPaymentReconciliation,
  type ManualRefundActionState,
} from '@/app/cancelamentos-pagamento/actions';

const initialState: ManualRefundActionState = {
  status: 'idle',
  message: '',
};

export function RetryReconciliationForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(
    reopenPaymentReconciliation,
    initialState,
  );

  return (
    <form
      action={action}
      className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
    >
      <input type="hidden" name="pagamento_id" value={paymentId} />
      <p className="text-sm font-semibold text-red-900 dark:text-red-200">
        Conciliação automática interrompida
      </p>
      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
        Reabra somente após confirmar que o identificador e o ambiente do provedor estão
        corretos. A próxima rotina automática fará uma nova consulta; nenhuma cobrança ou
        devolução será criada por esta ação.
      </p>
      <label className="mt-3 grid gap-1.5 text-sm font-medium text-red-950 dark:text-red-200">
        Justificativa da reabertura
        <textarea
          name="motivo_reabertura"
          required
          minLength={10}
          maxLength={500}
          rows={2}
          placeholder="Ex.: pagamento confirmado no portal do provedor."
          className="resize-y rounded-lg border border-red-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 dark:border-red-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          role="status"
          className={`text-sm ${
            state.status === 'success'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-red-700 dark:text-red-300'
          }`}
        >
          {state.message}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Reabrindo…' : 'Reabrir conciliação'}
        </button>
      </div>
    </form>
  );
}
