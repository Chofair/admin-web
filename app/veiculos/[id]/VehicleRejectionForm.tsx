'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { rejectVehicle, type VehicleActionState } from './actions';

const INITIAL_STATE: VehicleActionState = { status: 'idle', message: '' };

export default function VehicleRejectionForm({
  vehicleId,
  currentReason,
}: {
  vehicleId: string;
  currentReason: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(rejectVehicle, INITIAL_STATE);

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm('Confirma a rejeição deste veículo?')) event.preventDefault();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Motivo da rejeição</span>
        <textarea
          name="reason"
          defaultValue={currentReason ?? ''}
          minLength={10}
          maxLength={250}
          rows={4}
          required
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? 'Rejeitando...' : currentReason ? 'Atualizar rejeição' : 'Rejeitar veículo'}
      </button>
      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={'text-sm ' + (state.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400')}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
