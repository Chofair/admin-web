import type { DriverChange } from '@/lib/admin-driver-edit';
import AuditEventAccordion from '@/components/AuditEventAccordion';
import { DRIVER_CHANGE_LABELS, TRAINING_LABELS, getVisibleDriverChanges } from '@/lib/driver-edit-validation';
import { formatAdminDate } from '@/lib/admin-format';

function display(value: unknown, key: string) {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (key === 'cnh_storage_path') return 'Documento privado arquivado';
  if (key === 'cnh_validade' || key === 'data_nascimento') return formatAdminDate(String(value));
  if (key === 'accessibility_training' && typeof value === 'object') return Object.entries(TRAINING_LABELS).filter(([field]) => (value as Record<string, unknown>)[field] === true).map(([, label]) => label).join(', ') || 'Nenhum treinamento declarado';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function DriverChangeHistory({ driverId, history }: { driverId: string; history: DriverChange[] }) {
  return (
    <section className="my-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="driver-history-title">
      <h3 id="driver-history-title" className="font-semibold text-zinc-900 dark:text-zinc-100">Histórico de correções</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Últimas 20 alterações administrativas. Aprovações e suspensões continuam nas ações próprias.</p>
      {!history.length ? <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Nenhuma correção administrativa registrada.</p> : <ol className="mt-5 space-y-3">
        {history.map((item) => <li key={item.id}>
          <AuditEventAccordion
            title={<>{item.actor_name ?? 'Administrador'} <span className="font-normal text-zinc-500 dark:text-zinc-400">· <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</time></span></>}
            description={item.reason}
          >
              <dl className="space-y-2 text-xs">{getVisibleDriverChanges(item.changes).map(([key, change]) => <div key={key} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                <dt className="font-semibold text-zinc-700 dark:text-zinc-300">{DRIVER_CHANGE_LABELS[key] ?? key}</dt>
                <dd className="mt-1 break-all text-zinc-600 dark:text-zinc-400">Antes: {display(change.before, key)}</dd><dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">Depois: {display(change.after, key)}</dd>
              </div>)}</dl>
              {Boolean(item.changes.cnh_storage_path?.before || item.changes.cnh_foto_url?.before) && <a href={`/api/admin/motoristas/${driverId}/cnh?history=${item.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-blue-700 underline dark:text-blue-300">Abrir CNH anterior</a>}
          </AuditEventAccordion>
        </li>)}
      </ol>}
    </section>
  );
}
