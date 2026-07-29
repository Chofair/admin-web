'use client';

import { useActionState } from 'react';
import {
  resolveRideReview,
  type ReviewActionState,
} from '@/app/revisoes-corridas/actions';

const initialState: ReviewActionState = {
  status: 'idle',
  message: '',
};

export function ReviewResolutionForm({
  requestId,
  canExemptOvertime,
}: {
  requestId: string;
  canExemptOvertime: boolean;
}) {
  const [state, action, pending] = useActionState(resolveRideReview, initialState);

  return (
    <form action={action} className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-700">
      <input type="hidden" name="solicitacao_id" value={requestId} />

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.6fr)_1fr_auto] lg:items-end">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Decisão
          <select
            name="decisao"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="manter_cobranca">Manter cobrança</option>
            {canExemptOvertime && (
              <option value="isentar_excedente_cliente">Isentar excedente do cliente</option>
            )}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Fundamentação administrativa
          <textarea
            name="observacao"
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            placeholder="Descreva evidências e justificativa da decisão."
            className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Resolvendo…' : 'Resolver revisão'}
        </button>
      </div>

      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm ${
            state.status === 'success'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-red-700 dark:text-red-400'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
