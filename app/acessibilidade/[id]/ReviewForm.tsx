'use client';

import { useActionState, useState } from 'react';
import { reviewDriver, reviewVehicle, type ReviewState } from './actions';

const initial: ReviewState = { status: 'idle', message: '' };
export default function ReviewForm({ kind, applicationId, driverId, currentStatus }: { kind: 'driver' | 'vehicle'; applicationId: string; driverId: string; currentStatus: string }) {
  const [action, setAction] = useState<'approve' | 'reject' | 'suspend'>(currentStatus === 'approved' ? 'suspend' : 'approve');
  const [state, formAction, pending] = useActionState(kind === 'driver' ? reviewDriver : reviewVehicle, initial);
  const needsReason = action !== 'approve';
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="driver_id" value={driverId} />
      <label className="block text-sm font-medium">Decisão
        <select name="review_action" value={action} onChange={(event) => setAction(event.target.value as typeof action)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
          {currentStatus === 'pending' && <><option value="approve">Aprovar</option><option value="reject">Rejeitar</option></>}
          {currentStatus === 'approved' && <option value="suspend">Suspender</option>}
        </select>
      </label>
      {kind === 'driver' && action === 'approve' && <label className="block rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">EAR observado na CNH (informativo)
        <select name="ear_observed" required defaultValue="false" className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-zinc-900 dark:border-blue-800 dark:bg-zinc-950 dark:text-zinc-100">
          <option value="false">Não ou não confirmado</option>
          <option value="true">Sim</option>
        </select>
        <span className="mt-2 block text-xs">A aprovação pode ser concedida em qualquer opção; a decisão é da operação.</span>
      </label>}
      {needsReason && <label className="block text-sm font-medium">Motivo
        <textarea name="reason" required minLength={10} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
      </label>}
      {state.message && <p className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{state.message}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Registrando...' : 'Registrar decisão'}</button>
    </form>
  );
}
