'use client';

import { useActionState } from 'react';
import {
  acknowledgeMapsAlert,
  type AcknowledgeMapsAlertState,
} from '@/app/google-maps/actions';

const initialState: AcknowledgeMapsAlertState = {
  status: 'idle',
  message: '',
};

export function AcknowledgeAlertButton({ alertId }: { alertId: string }) {
  const [state, action, pending] = useActionState(acknowledgeMapsAlert, initialState);

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="alert_id" value={alertId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? 'Reconhecendo…' : 'Reconhecer alerta'}
      </button>
      {state.message && (
        <span
          role="status"
          className={`max-w-52 text-right text-[11px] ${
            state.status === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
