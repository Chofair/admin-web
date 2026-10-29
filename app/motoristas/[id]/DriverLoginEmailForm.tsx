'use client';

import { useActionState, useState } from 'react';
import { Mail } from 'lucide-react';
import { correctDriverLoginEmail, type DriverEditState } from './edit-actions';
import { driverAccordionSummaryClass, driverInputClass } from './DriverEditForm';
import { hasLoginEmailChange } from '@/lib/driver-edit-validation';

const initial: DriverEditState = { status: 'idle', message: '' };

export default function DriverLoginEmailForm({ driverId, revision, email, editable }: { driverId: string; revision: string; email: string | null; editable: boolean }) {
  const context = revision + ':' + (email ?? '');
  const [edited, setEdited] = useState({ context, changed: false });
  const hasChanges = edited.context === context && edited.changed;
  const [state, action, pending] = useActionState(async (_: DriverEditState, form: FormData) => correctDriverLoginEmail(driverId, revision, String(form.get('email') ?? ''), String(form.get('reason') ?? ''), form.get('confirmed') === 'on'), initial);
  return <details className="group mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
    <summary className={driverAccordionSummaryClass}><Mail size={18} aria-hidden="true" />E-mail de acesso</summary>
    <div className="space-y-4 border-t border-zinc-200 p-4 text-sm dark:border-zinc-700">
      <p className="break-all text-zinc-600 dark:text-zinc-300">Atual: <strong>{email ?? 'Não informado'}</strong></p>
      {editable ? <form key={context} action={action} aria-busy={pending}
        onChange={(event) => setEdited({ context, changed: hasLoginEmailChange(String(new FormData(event.currentTarget).get('email') ?? ''), email) })}
        onReset={() => setEdited({ context, changed: false })}
        className="space-y-4">
        <p className="text-zinc-600 dark:text-zinc-400">Corrija o endereço usado pelo motorista para entrar e recuperar a senha, após conferir sua identidade e a titularidade do novo e-mail.</p>
        <fieldset disabled={pending} className="space-y-4">
          <label className="block space-y-1"><span>Novo e-mail de acesso</span><input name="email" type="email" autoComplete="off" required maxLength={254} className={driverInputClass} /></label>
          <label className="block space-y-1"><span>Motivo da correção do login</span><textarea name="reason" required minLength={10} maxLength={500} rows={3} className={driverInputClass} /></label>
          <label className="flex items-start gap-2"><input name="confirmed" type="checkbox" required className="mt-1 h-4 w-4" />Conferi a identidade do motorista e a titularidade do novo e-mail. Entendo que o endereço de acesso será alterado.</label>
          <button disabled={pending || !hasChanges} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:enabled:bg-blue-700 disabled:opacity-60">{pending ? 'Corrigindo login…' : 'Confirmar correção do login'}</button>
        </fieldset>
        {state.message && <p role={state.status === 'error' ? 'alert' : 'status'} className={state.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}>{state.message}</p>}
      </form> : <p className="text-zinc-600 dark:text-zinc-400">Esta conta usa login social. A correção do endereço de acesso deve ser feita junto ao provedor da conta.</p>}
    </div>
  </details>;
}
