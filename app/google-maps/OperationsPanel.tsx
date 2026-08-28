import {
  getMapsServiceGroup,
  type MapsMonitoringConfig,
  type MapsOperationUsage,
  type MapsServiceGroup,
} from '@/lib/maps-monitoring';
import { formatNumber, formatOperation } from './view-helpers';

export function OperationsPanel({
  configs,
  operations,
  selectedApi,
}: {
  configs: MapsMonitoringConfig[];
  operations: MapsOperationUsage[];
  selectedApi: MapsServiceGroup | null;
}) {
  const configByKey = new Map(configs.map((config) => [config.config_key, config]));
  const aggregateByOperation = new Map<
    string,
    {
      configKey: string;
      operation: string;
      successful: number;
      failed: number;
      estimatedEvents: number;
      latency: number;
    }
  >();

  for (const row of operations) {
    const config = configByKey.get(row.config_key);
    const group = config ? getMapsServiceGroup(config.service) : null;
    if (!group || (selectedApi && group !== selectedApi)) continue;
    const key = `${row.config_key}:${row.operation}`;
    const aggregate = aggregateByOperation.get(key) ?? {
      configKey: row.config_key,
      operation: row.operation,
      successful: 0,
      failed: 0,
      estimatedEvents: 0,
      latency: 0,
    };
    aggregate.successful += row.successful_requests;
    aggregate.failed += row.failed_requests;
    aggregate.estimatedEvents += row.estimated_billable_events;
    aggregate.latency += row.total_latency_ms;
    aggregateByOperation.set(key, aggregate);
  }

  const rows = [...aggregateByOperation.values()].sort((left, right) => {
    const leftName = configByKey.get(left.configKey)?.sku_name ?? left.configKey;
    const rightName = configByKey.get(right.configKey)?.sku_name ?? right.configKey;
    return leftName.localeCompare(rightName) || left.operation.localeCompare(right.operation);
  });

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Consumo por operação
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Soma dos registros diários agregados no período selecionado.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                API / operação
              </th>
              {['Eventos estimados', 'Sucessos', 'Erros', 'Latência média'].map(
                (label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-300"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-400">
                  Nenhum consumo registrado neste mês.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const requestCount = row.successful + row.failed;
                return (
                  <tr
                    key={`${row.configKey}:${row.operation}`}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {configByKey.get(row.configKey)?.sku_name ?? row.configKey}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatOperation(row.operation)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(row.estimatedEvents)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                      {formatNumber(row.successful)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700 dark:text-red-400">
                      {formatNumber(row.failed)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      {requestCount > 0
                        ? `${formatNumber(row.latency / requestCount, 1)} ms`
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
