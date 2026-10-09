'use client';
import { useActionState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { decideCancellation, type DecisionState } from './actions';

async function submitDecision(previous: DecisionState, form: FormData): Promise<DecisionState> {
  try {
    return await decideCancellation(previous, form);
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      needsRefresh: true,
      message: 'Não foi possível confirmar a resposta do servidor. A decisão pode ter sido registrada. Atualize a página para conferir antes de tentar novamente.',
    };
  }
}
export function DecisionForm({ id, topic, canApprove = true }: {
  id: string; topic: 'reembolso' | 'repasse' | 'transferencia'; canApprove?: boolean;
}) {
  const [state, action, pending] = useActionState(submitDecision, { message: '', ok: false });
  const transfer = topic === 'transferencia';
  return <form action={action} className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-700">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="tema" value={topic} />
    <fieldset disabled={pending || state.ok || state.needsRefresh} className="space-y-4 disabled:opacity-60">
      <legend className="mb-3 text-sm font-semibold">{transfer ? 'Registrar transferência realizada' : `Decidir ${topic}`}</legend>
      {!transfer && <label className="grid gap-2 text-sm font-medium">Decisão
        <select name="decisao" required defaultValue="" className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 focus:outline-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100">
          <option value="" disabled>Selecione uma decisão</option><option value="aprovado" disabled={!canApprove}>Aprovar valor integral</option><option value="negado">Não aprovar</option>
        </select></label>}
      {!canApprove && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">A aprovação fica disponível após o encerramento do atendimento e a consolidação dos valores.</p>}
      <label className="grid gap-2 text-sm font-medium">{transfer ? 'Referência da transferência' : 'Justificativa'}
        <textarea name="motivo" required minLength={transfer ? 3 : 10} maxLength={transfer ? 200 : 500} rows={3}
          placeholder={transfer ? 'Identificador ou comprovante da transferência' : 'Explique o motivo da decisão (mínimo de 10 caracteres)'}
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 focus:outline-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-5"><input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700" />
        {transfer ? 'Confirmo que a transferência integral ao motorista já foi realizada. Este registro não envia dinheiro.' : 'Conferi a ocorrência e os valores. Entendo que esta decisão não poderá ser reaberta pelo painel.'}</label>
      <button className="min-h-11 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
        {pending ? 'Registrando…' : transfer ? 'Registrar transferência' : `Confirmar decisão de ${topic}`}
      </button>
    </fieldset>
    {state.needsRefresh && <button type="button" onClick={() => window.location.reload()}
      className="mt-3 min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
      Atualizar página
    </button>}
    {state.message && <p role={state.ok ? 'status' : 'alert'} className={`mt-3 rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>{state.message}</p>}
  </form>;
}
