'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { approveVehicle, type VehicleActionState } from './actions';

const INITIAL_STATE: VehicleActionState = { status: 'idle', message: '' };

export default function VehicleApprovalForm({
  vehicleId,
  alreadyApproved,
  blockingReasons,
}: {
  vehicleId: string;
  alreadyApproved: boolean;
  blockingReasons: string[];
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction, pending] = useActionState(approveVehicle, INITIAL_STATE);

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [router, state.status]);

  if ((alreadyApproved && blockingReasons.length === 0) || state.status === 'success') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        <CheckCircle2 size={18} />
        {state.message || 'Este veículo já foi aprovado.'}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm('Confirma a aprovação deste veículo?')) event.preventDefault();
      }}
      className="space-y-4"
    >
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      {blockingReasons.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          <p className="font-semibold">A aprovação está bloqueada:</p>
          <ul className="mt-2 space-y-1">
            {blockingReasons.map((reason) => <li key={reason}>• {reason}</li>)}
          </ul>
        </div>
      )}
      <label className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          Conferi o CRLV-e, os dados declarados, as divergências e os requisitos operacionais.
        </span>
      </label>
      <button
        type="submit"
        disabled={!confirmed || pending || blockingReasons.length > 0}
        className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {pending ? 'Aprovando...' : 'Aprovar veículo'}
      </button>
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
