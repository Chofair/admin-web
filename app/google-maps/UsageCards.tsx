import type { LucideIcon } from 'lucide-react';
import { LocateFixed, MapPinned, Route, Smartphone } from 'lucide-react';
import {
  getMapsServiceGroup,
  MAPS_SERVICE_GROUPS,
  type MapsMonitoringConfig,
  type MapsMonthlyUsage,
  type MapsServiceGroup,
} from '@/lib/maps-monitoring';
import { formatNumber, getUsageTone } from './view-helpers';

const SERVICE_ICONS: Record<MapsServiceGroup, LucideIcon> = {
  places: MapPinned,
  geocoding: LocateFixed,
  routes: Route,
  maps_sdk: Smartphone,
};

export function UsageCards({
  configs,
  monthlyUsage,
  selectedApi,
}: {
  configs: MapsMonitoringConfig[];
  monthlyUsage: MapsMonthlyUsage[];
  selectedApi: MapsServiceGroup | null;
}) {
  const usageByConfigKey = new Map(
    monthlyUsage
      .filter((usage) => usage.config_key)
      .map((usage) => [usage.config_key as string, usage]),
  );
  const serviceCards = MAPS_SERVICE_GROUPS.filter(
    (group) => !selectedApi || group.key === selectedApi,
  ).map((group) => {
    const groupConfigs = configs.filter(
      (config) => getMapsServiceGroup(config.service) === group.key,
    );
    const rows = groupConfigs
      .map((config) => usageByConfigKey.get(config.config_key))
      .filter((usage) => Boolean(usage));
    const successful = rows.reduce(
      (total, usage) => total + (usage?.successful_requests ?? 0),
      0,
    );
    const failed = rows.reduce(
      (total, usage) => total + (usage?.failed_requests ?? 0),
      0,
    );
    const events = rows.reduce(
      (total, usage) => total + (usage?.estimated_billable_events ?? 0),
      0,
    );
    const latency = rows.reduce(
      (total, usage) => total + (usage?.total_latency_ms ?? 0),
      0,
    );
    const limits = groupConfigs
      .map((config) => config.free_monthly_limit)
      .filter((limit): limit is number => limit != null);
    const limit = limits.length
      ? limits.reduce((total, current) => total + current, 0)
      : null;
    const percentage =
      limit == null ? null : Number(((events * 100) / limit).toFixed(2));

    return {
      ...group,
      configs: groupConfigs,
      successful,
      failed,
      events,
      averageLatency:
        successful + failed > 0 ? latency / (successful + failed) : null,
      limit,
      percentage,
      remaining: limit == null ? null : Math.max(limit - events, 0),
    };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {serviceCards.map((card) => {
        const tone = getUsageTone(card.percentage);
        const Icon = SERVICE_ICONS[card.key];
        return (
          <article
            key={card.key}
            className={`rounded-xl border bg-white p-5 dark:bg-zinc-900 ${tone.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Icon size={20} />
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
              >
                {tone.label}
              </span>
            </div>
            <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">
              {card.label}
            </h3>
            <p className="mt-1 min-h-8 text-xs text-zinc-500 dark:text-zinc-400">
              {card.description}
            </p>

            <div className="mt-5 flex items-baseline justify-between gap-3">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(card.events)}
              </p>
              <p className="text-xs text-zinc-500">
                {card.limit == null
                  ? 'sem limite mensal'
                  : `de ${formatNumber(card.limit)}`}
              </p>
            </div>

            {card.percentage == null ? (
              <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Gratuito/ilimitado · não gera alerta de franquia
              </p>
            ) : (
              <>
                <div
                  role="progressbar"
                  aria-label={`Consumo de ${card.label}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(card.percentage, 100)}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                >
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${Math.min(card.percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatNumber(card.percentage, 2)}%
                  </span>
                  <span className="text-zinc-500">
                    Saldo: {formatNumber(card.remaining)}
                  </span>
                </div>
              </>
            )}

            <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4 text-center dark:border-zinc-800">
              <div>
                <dt className="text-[11px] text-zinc-500">Sucessos</dt>
                <dd className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatNumber(card.successful)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-zinc-500">Erros</dt>
                <dd className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                  {formatNumber(card.failed)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-zinc-500">Latência</dt>
                <dd className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {card.averageLatency == null
                    ? '—'
                    : `${formatNumber(card.averageLatency, 1)} ms`}
                </dd>
              </div>
            </dl>
            <p
              className="mt-3 truncate text-[11px] text-zinc-400"
              title={card.configs.map((config) => config.sku_name).join(', ')}
            >
              {card.configs.map((config) => config.sku_name).join(' · ') ||
                'Configuração indisponível'}
            </p>
          </article>
        );
      })}
    </div>
  );
}
