import { AlertTriangle, Clock3, Cloud, Gauge } from 'lucide-react';
import { formatAdminDateTime } from '@/lib/admin-format';
import {
  getMapsServiceGroup,
  MAPS_SERVICE_GROUPS,
  type MapsDashboardData,
  type MapsServiceGroup,
} from '@/lib/maps-monitoring';
import { AlertsPanel } from './AlertsPanel';
import { BillingPanel } from './BillingPanel';
import { OperationsPanel } from './OperationsPanel';
import { UsageCards } from './UsageCards';

function formatMonth(monthStart: string) {
  const label = new Date(`${monthStart}T12:00:00Z`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

export function MapsDashboardView({
  dashboard,
  monthKey,
  monthStart,
  selectedApi,
  selectedSku,
}: {
  dashboard: MapsDashboardData;
  monthKey: string;
  monthStart: string;
  selectedApi: MapsServiceGroup | null;
  selectedSku: string | null;
}) {
  const skuOptions = [
    ...new Map(
      dashboard.billing
        .filter((row) => row.sku_id)
        .map((row) => [
          row.sku_id as string,
          {
            id: row.sku_id as string,
            label: row.sku_description ?? (row.sku_id as string),
          },
        ]),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label));
  const visibleAlerts = dashboard.alerts.filter((alert) => {
    if (!selectedApi) return true;
    const config = dashboard.configs.find(
      (current) => current.config_key === alert.config_key,
    );
    return config ? getMapsServiceGroup(config.service) === selectedApi : false;
  });
  const pendingAlerts = visibleAlerts.filter((alert) => !alert.acknowledged_at).length;
  const syncStatusLabels: Record<string, string> = {
    never_run: 'Nunca executado',
    running: 'Sincronizando',
    success: 'Sincronizado',
    failed: 'Falha na sincronização',
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="text-blue-600 dark:text-blue-400" size={24} />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Google Maps Platform
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Consumo interno estimado, franquias e custos importados do Google Cloud
            Billing. Os indicadores são informativos e nunca bloqueiam requisições.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <Cloud size={16} />
            {syncStatusLabels[dashboard.syncState?.status ?? 'never_run'] ??
              dashboard.syncState?.status}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Último sucesso: {formatAdminDateTime(dashboard.syncState?.last_success_at)}
          </p>
          {dashboard.syncState?.last_source_date && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Dados de origem até {dashboard.syncState.last_source_date}
            </p>
          )}
        </div>
      </div>

      <form
        method="get"
        className="mb-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end dark:border-zinc-700 dark:bg-zinc-900"
      >
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mês
          <input
            type="month"
            name="month"
            defaultValue={monthKey}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          API
          <select
            name="api"
            defaultValue={selectedApi ?? ''}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas</option>
            {MAPS_SERVICE_GROUPS.map((group) => (
              <option key={group.key} value={group.key}>
                {group.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          SKU do Billing
          <select
            name="sku"
            defaultValue={selectedSku ?? ''}
            className="min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todos os SKUs</option>
            {skuOptions.map((sku) => (
              <option key={sku.id} value={sku.id}>
                {sku.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Aplicar filtros
        </button>
      </form>

      {dashboard.unavailableSections.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <p>
            Parte dos dados está indisponível:{' '}
            {dashboard.unavailableSections.join(', ')}. As demais seções continuam
            utilizáveis.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Consumo de {formatMonth(monthStart)}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {dashboard.projectEnvironment === 'staging'
              ? 'Ambiente de staging'
              : 'Ambiente de produção'}{' '}
            · estimativas internas do Supabase
          </p>
        </div>
        {pendingAlerts > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
            {pendingAlerts} alerta(s) pendente(s)
          </span>
        )}
      </div>

      <UsageCards
        configs={dashboard.configs}
        monthlyUsage={dashboard.monthlyUsage}
        selectedApi={selectedApi}
      />
      <BillingPanel
        billing={dashboard.billing}
        selectedApi={selectedApi}
        selectedSku={selectedSku}
      />
      <OperationsPanel
        configs={dashboard.configs}
        operations={dashboard.operationUsage}
        selectedApi={selectedApi}
      />
      <AlertsPanel
        alerts={dashboard.alerts}
        configs={dashboard.configs}
        selectedApi={selectedApi}
      />

      <footer className="mt-10 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <Clock3 className="mt-0.5 shrink-0" size={17} />
        <p>
          Os volumes exibidos são estimativas internas de telemetria. O Cloud Billing é
          a referência para custos importados e pode ter atraso de sincronização. Nenhum
          percentual ou alerta deste painel altera o funcionamento das APIs.
        </p>
      </footer>
    </main>
  );
}
