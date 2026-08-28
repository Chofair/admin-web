import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatAdminDateTime } from '@/lib/admin-format';
import {
  getMapsServiceGroup,
  type MapsApiAlert,
  type MapsMonitoringConfig,
  type MapsServiceGroup,
} from '@/lib/maps-monitoring';
import { AcknowledgeAlertButton } from './AcknowledgeAlertButton';
import { formatNumber } from './view-helpers';

export function AlertsPanel({
  alerts,
  configs,
  selectedApi,
}: {
  alerts: MapsApiAlert[];
  configs: MapsMonitoringConfig[];
  selectedApi: MapsServiceGroup | null;
}) {
  const configByKey = new Map(configs.map((config) => [config.config_key, config]));
  const visibleAlerts = alerts.filter((alert) => {
    if (!selectedApi) return true;
    const config = configByKey.get(alert.config_key);
    return config ? getMapsServiceGroup(config.service) === selectedApi : false;
  });

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <AlertTriangle size={19} className="text-amber-500" />
          Histórico de alertas
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Um registro por API, mês e limite atingido.
        </p>
      </div>

      <div className="grid gap-3">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nenhum alerta gerado neste mês.
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const config = configByKey.get(alert.config_key);
            const tone =
              alert.threshold_percentage >= 95
                ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950'
                : alert.threshold_percentage >= 80
                  ? 'border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
                  : 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950';
            return (
              <article
                key={alert.id}
                className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${tone}`}
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {config?.sku_name ?? alert.config_key} ·{' '}
                    {alert.threshold_percentage}%
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {formatNumber(alert.usage_count)} eventos ao gerar o alerta ·{' '}
                    {formatAdminDateTime(alert.created_at)}
                  </p>
                  {alert.acknowledged_at && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={14} />
                      Reconhecido por{' '}
                      {alert.acknowledged_by_name ??
                        alert.acknowledged_by?.slice(0, 8) ??
                        'admin'}{' '}
                      em {formatAdminDateTime(alert.acknowledged_at)}
                    </p>
                  )}
                </div>
                {alert.acknowledged_at ? (
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 sm:self-center dark:bg-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 size={13} />
                    Reconhecido
                  </span>
                ) : (
                  <AcknowledgeAlertButton alertId={alert.id} />
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
