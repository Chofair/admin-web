'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveVehicleReview, type VehicleActionState } from './actions';

const INITIAL_STATE: VehicleActionState = { status: 'idle', message: '' };

type ReviewValues = {
  placa: string;
  renavam: string;
  marca: string;
  modelo: string;
  ano: number | null;
  cor: string;
  capacidade_passageiros: number | null;
};

export default function VehicleReviewForm({
  vehicleId,
  values,
  minimumYear,
}: {
  vehicleId: string;
  values: ReviewValues;
  minimumYear: number;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction, pending] = useActionState(saveVehicleReview, INITIAL_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh();
    }
  }, [router, state.status]);

  const inputClassName =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950';

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Placa</span>
          <input name="placa" defaultValue={values.placa} maxLength={7} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">RENAVAM</span>
          <input name="renavam" defaultValue={values.renavam} inputMode="numeric" maxLength={11} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Marca</span>
          <input name="marca" defaultValue={values.marca} maxLength={80} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Modelo</span>
          <input name="modelo" defaultValue={values.modelo} maxLength={120} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Ano</span>
          <input name="ano" type="number" defaultValue={values.ano ?? ''} min={minimumYear} max={new Date().getFullYear() + 1} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Cor</span>
          <input name="cor" defaultValue={values.cor} maxLength={50} required className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Capacidade de passageiros</span>
          <input name="capacidade_passageiros" type="number" defaultValue={values.capacidade_passageiros ?? ''} min={1} max={20} required className={inputClassName} />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>Confirmei estes valores diretamente no CRLV-e apresentado.</span>
      </label>
      <button
        type="submit"
        disabled={!confirmed || pending}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {pending ? 'Salvando revisão...' : 'Salvar revisão manual'}
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
