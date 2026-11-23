'use client';
import { useActionState } from 'react';
import { updateV2Tariff, updateV2Activation, type CityFormState } from './actions';
import { V2_TARIFF_FIELDS, type V2Tariff } from '@/lib/regional-v2-tariffs';
const initial: CityFormState = { status: 'idle', message: '' };
const inputClass = 'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';
const buttonClass = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50';
function Feedback({ state }: { state: CityFormState }) {
  return state.message ? <p role="status" className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400'}`}>{state.message}</p> : null;
}
function TariffForm({ tariff }: { tariff: V2Tariff }) {
  const [state, action, pending] = useActionState(updateV2Tariff, initial);
  return <form action={action} className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
    <h3 className="font-semibold">{tariff.nome}</h3>
    <input type="hidden" name="id" value={tariff.id} /><input type="hidden" name="nome" value={tariff.nome} />
    <input type="hidden" name="updated_at" value={tariff.updated_at} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm">Limite da corrida curta — ida (km)
        <input className={inputClass} type="number" name="limite_km" step="0.001" min="0.001" max="1200" required defaultValue={tariff.limite_curta_metros / 1000} />
      </label>
      {V2_TARIFF_FIELDS.map(([key, label]) => <label key={key} className="text-sm">{label}
        <input className={inputClass} type="number" inputMode="decimal" name={key} min={key === 'fixa_centavos' ? '0' : '0.01'} max="10000" step="0.01" required defaultValue={(tariff[key] / 100).toFixed(2)} />
      </label>)}
    </div>
    <div className="flex flex-wrap items-center gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Salvando...' : 'Salvar tarifa'}</button><Feedback state={state} /></div>
  </form>;
}
export default function V2Tariffs({ tariffs, active, unavailable }: { tariffs: V2Tariff[]; active: boolean; unavailable: boolean }) {
  const [state, action, pending] = useActionState(updateV2Activation, initial);
  return <details className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
    <summary className="cursor-pointer font-semibold">Tarifas da V2 · {active ? 'Nova precificação ativa' : 'Nova precificação desativada'}</summary>
    <p className="my-3 text-sm text-zinc-500 dark:text-zinc-400">Cada perfil é independente. Alterações valem para novas cotações; corridas contratadas mantêm suas condições. O processamento do cartão não integra o repasse de 92%.</p>
    {unavailable ? <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">A configuração de tarifas ainda não está disponível neste ambiente.</p> : <>
      <form action={action} className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ativa" defaultChecked={active} />Ativar nova precificação nas novas cotações compatíveis</label>
        <button disabled={pending} className={buttonClass}>{pending ? 'Salvando...' : 'Salvar ativação'}</button><Feedback state={state} />
      </form>
      <div className="space-y-4">{tariffs.map(tariff => <TariffForm key={`${tariff.id}-${tariff.updated_at}`} tariff={tariff} />)}</div>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Na curta, permanência e excedente custam R$ 5,71 por bloco de 15 min. Na longa, a permanência usa a parcela horária; o excedente custa R$ 5,71 por bloco, ou R$ 8,15 aos domingos. A região tarifária não libera atendimento.</p>
    </>}
  </details>;
}
