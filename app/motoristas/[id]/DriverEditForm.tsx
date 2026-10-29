'use client';

import { useActionState, useState } from 'react';
import { PencilLine } from 'lucide-react';
import { DRIVER_EDIT_FIELDS, TRAINING_LABELS, getDriverFormChanges } from '@/lib/driver-edit-validation';
import { saveDriverChanges, type DriverEditState } from './edit-actions';

const initial: DriverEditState = { status: 'idle', message: '' };
export const driverInputClass = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';
export const driverAccordionSummaryClass = 'flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 group-open:rounded-b-none group-open:bg-blue-100 group-open:text-blue-900 group-open:hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 dark:group-open:bg-blue-950 dark:group-open:text-blue-200 dark:group-open:hover:bg-blue-950';

export default function DriverEditForm({ driverId, revision, values }: { driverId: string; revision: string; values: Record<string, unknown> }) {
  const [edited, setEdited] = useState({ revision, changed: false });
  const hasChanges = edited.revision === revision && edited.changed;
  const [state, action, pending] = useActionState(async (_previous: DriverEditState, form: FormData) => {
    return saveDriverChanges(driverId, revision, getDriverFormChanges(form, values), String(form.get('reason') ?? ''), form.get('confirmed') === 'on');
  }, initial);

  return (
    <details className="group mt-5 rounded-xl border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
      <summary className={driverAccordionSummaryClass}><PencilLine size={17} aria-hidden="true" />Editar dados do motorista</summary>
      <form key={revision} action={action} aria-busy={pending}
        onChange={(event) => setEdited({ revision, changed: Object.keys(getDriverFormChanges(new FormData(event.currentTarget), values)).length > 0 })}
        onReset={() => setEdited({ revision, changed: false })}
        className="space-y-6 border-t border-blue-100 p-4 dark:border-blue-900 sm:p-5">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Altere os campos necessários e registre o motivo. Para atualizar a CNH, utilize a seção Documentos.</p>
        <fieldset disabled={pending} className="space-y-6">
          {['Dados pessoais', 'Endereço', 'Dados profissionais'].map((group) => (
            <fieldset key={group} className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{group}</legend>
              <div className={group === 'Dados profissionais' ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
                {DRIVER_EDIT_FIELDS.filter((field) => field.group === group).map(({ key, label, type, max }) => (
                  <label key={key} className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300"><span>{label}</span><input name={key} type={type} maxLength={max} defaultValue={String(values[key] ?? '')} className={driverInputClass} /></label>
                ))}
              </div>
              {group === 'Dados profissionais' && <fieldset className="space-y-3 pt-3">
                <legend className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Treinamentos declarados</legend>
                <div className="grid gap-3 sm:grid-cols-2">{Object.entries(TRAINING_LABELS).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"><input type="checkbox" name={'training_' + key} defaultChecked={(values.accessibility_training as Record<string, unknown> | null)?.[key] === true} className="h-4 w-4" />{label}</label>)}</div>
              </fieldset>}
            </fieldset>
          ))}
          <label className="block space-y-1 text-sm text-zinc-700 dark:text-zinc-300"><span>Motivo da correção</span><textarea name="reason" minLength={10} maxLength={500} required rows={3} className={driverInputClass} placeholder="Descreva por que os dados precisam ser corrigidos." /></label>
          <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"><input type="checkbox" name="confirmed" required className="mt-1 h-4 w-4" />Conferi os dados informados, incluindo CPF e chave Pix quando alterados.</label>
          <button type="submit" disabled={pending || !hasChanges} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:enabled:bg-blue-700 disabled:opacity-60">{pending ? 'Salvando alterações…' : 'Salvar alterações'}</button>
        </fieldset>
        {state.message && <p role={state.status === 'error' ? 'alert' : 'status'} className={'text-sm ' + (state.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400')}>{state.message}</p>}
      </form>
    </details>
  );
}
