'use client';

import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCity, updateCity, type CityFormState } from './actions';
import { CITY_FLAGS, UFS, type CityRow as CityRowData } from './constants';

const initial: CityFormState = { status: 'idle', message: '' };
const inputClassName =
  'rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

export default function CityRow({ city }: { city: CityRowData }) {
  const [saveState, saveAction, saving] = useActionState(updateCity, initial);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCity, initial);
  // <form> não pode envolver um <tr>; os campos das células apontam para ele via atributo form.
  const formId = `cidade-${city.id}`;
  const message = deleteState.status === 'error' ? deleteState : saveState;

  return (
    <tr className="border-b border-zinc-100 align-top hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
      <td className="px-4 py-3">
        <input
          form={formId}
          name="cidade"
          required
          minLength={2}
          maxLength={100}
          defaultValue={city.cidade}
          aria-label="Cidade"
          className={`${inputClassName} w-full min-w-40`}
        />
      </td>
      <td className="px-4 py-3">
        <select form={formId} name="estado" defaultValue={city.estado} aria-label="UF" className={inputClassName}>
          {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </td>
      {CITY_FLAGS.map(({ key, label }) => (
        <td key={key} className="px-3 py-3 text-center">
          <input
            form={formId}
            type="checkbox"
            name={key}
            defaultChecked={city[key]}
            aria-label={`${label} em ${city.cidade}`}
            className="mt-2 h-4 w-4 accent-blue-600"
          />
        </td>
      ))}
      <td className="px-3 py-3 text-center">
        <span
          title="Calculado automaticamente: V1, V2 ou V3 ativo"
          className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
            city.ativo_cliente
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {city.ativo_cliente ? 'Sim' : 'Não'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <form id={formId} action={saveAction}>
            <input type="hidden" name="id" value={city.id} />
            <button
              disabled={saving || deleting}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm(`Excluir ${city.cidade}/${city.estado}? Essa ação não pode ser desfeita.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={city.id} />
            <button
              disabled={saving || deleting}
              aria-label={`Excluir ${city.cidade}`}
              title="Excluir cidade"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </form>
        </div>
        {message.message && (
          <p role="status" className={`mt-1 text-xs ${message.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.message}
          </p>
        )}
      </td>
    </tr>
  );
}
