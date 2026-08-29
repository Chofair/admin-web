'use client';

import { useActionState } from 'react';
import {
  registerManualRefund,
  type ManualRefundActionState,
} from '@/app/cancelamentos-pagamento/actions';

const initialState: ManualRefundActionState = {
  status: 'idle',
  message: '',
};

export function ManualRefundForm({
  cancellationId,
  requestId,
  amountInCents,
}: {
  cancellationId: string;
  requestId: string;
  amountInCents: number;
}) {
  const [state, action, pending] = useActionState(registerManualRefund, initialState);
  const formattedAmount = (amountInCents / 100).toFixed(2).replace('.', ',');

  return (
    <form
      action={action}
      className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950"
    >
      <input type="hidden" name="cancelamento_id" value={cancellationId} />
      <input type="hidden" name="solicitacao_id" value={requestId} />

      <div className="mb-4">
        <h3 className="font-semibold text-purple-900 dark:text-purple-200">
          Registrar reembolso executado manualmente
        </h3>
        <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
          Esta ação apenas audita uma devolução já realizada fora do painel. Ela não
          solicita reembolso ao Mercado Pago e mantém o status do provedor intacto.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Motivo
          <select
            name="motivo"
            required
            defaultValue="cancelamento_solicitacao"
            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="cancelamento_solicitacao">Cancelamento da solicitação</option>
            <option value="pagamento_duplicado">Pagamento duplicado</option>
            <option value="cobranca_indevida">Cobrança indevida</option>
            <option value="falha_operacional">Falha operacional</option>
            <option value="acordo_com_cliente">Acordo com o cliente</option>
            <option value="outro">Outro</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Método
          <select
            name="metodo"
            required
            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="pix">PIX</option>
            <option value="transferencia_bancaria">Transferência bancária</option>
            <option value="credito_em_conta">Crédito em conta</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="outro">Outro</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Valor integral
          <div className="flex rounded-lg border border-purple-200 bg-white focus-within:border-purple-500 dark:border-purple-800 dark:bg-zinc-950">
            <span className="px-3 py-2 text-zinc-500">R$</span>
            <input
              name="valor"
              inputMode="decimal"
              required
              defaultValue={formattedAmount}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-zinc-900 outline-none dark:text-zinc-100"
            />
          </div>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Referência / comprovante
          <input
            name="referencia"
            required
            minLength={3}
            maxLength={200}
            placeholder="E2E, NSU ou protocolo"
            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Observação
        <textarea
          name="observacao"
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          placeholder="Descreva como e por que o reembolso foi realizado."
          className="resize-y rounded-lg border border-purple-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-purple-200 bg-white p-3 text-sm text-purple-950 dark:border-purple-800 dark:bg-zinc-950 dark:text-purple-200">
        <input
          type="checkbox"
          name="confirmado_fora_provedor"
          value="sim"
          required
          className="mt-0.5 h-4 w-4 accent-purple-700"
        />
        <span>
          Confirmo que o valor integral já foi devolvido ao cliente por um meio externo e
          que possuo o comprovante informado acima.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {state.message ? (
          <p
            role="status"
            className={`text-sm ${
              state.status === 'success'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {state.message}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Registrando…' : 'Confirmar registro manual'}
        </button>
      </div>
    </form>
  );
}
