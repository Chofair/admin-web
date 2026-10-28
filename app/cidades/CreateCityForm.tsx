'use client';

import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { createCity, type CityFormState } from './actions';
import { CITY_FLAGS, UFS } from './constants';

const initial: CityFormState = { status: 'idle', message: '' };
const inputClassName =
  'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

export default function CreateCityForm() {
  const [state, formAction, pending] = useActionState(createCity, initial);
  const values = state.status === 'error' ? state.values : undefined;

  return (
    <form
      // Remonta após cada resposta para aplicar os valores ecoados em caso de erro.
      key={JSON.stringify(state)}
      action={formAction}
      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Nova cidade</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cidade
          <input
            name="cidade"
            required
            minLength={2}
            maxLength={100}
            defaultValue={String(values?.cidade ?? '')}
            placeholder="Ex.: Belém"
            className={inputClassName}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          UF
          <select name="estado" required defaultValue={String(values?.estado ?? '')} className={inputClassName}>
            <option value="" disabled>—</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Serviços ativos</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {CITY_FLAGS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name={key} defaultChecked={values?.[key] === true} className="h-4 w-4 accent-blue-600" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={16} />
          {pending ? 'Cadastrando...' : 'Cadastrar cidade'}
        </button>
        {state.message && (
          <p role="status" className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
