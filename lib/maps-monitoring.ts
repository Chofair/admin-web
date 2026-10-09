import 'server-only';

import type { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type MapsServiceGroup = 'places' | 'geocoding' | 'routes' | 'maps_sdk';

export type MapsMonitoringConfig = {
  config_key: string;
  service: string;
  sku_name: string;
  free_monthly_limit: number | null;
  warning_thresholds: number[];
  enabled: boolean;
};

export type MapsMonthlyUsage = {
  reference_month: string | null;
  environment: string | null;
  config_key: string | null;
  service: string | null;
  sku_name: string | null;
  free_monthly_limit: number | null;
  successful_requests: number | null;
  failed_requests: number | null;
  estimated_billable_events: number | null;
  total_latency_ms: number | null;
  average_latency_ms: number | null;
  free_events_remaining: number | null;
  usage_percentage: number | null;
  highest_threshold_reached: number | null;
  updated_at: string | null;
};

export type MapsOperationUsage = {
  config_key: string;
  operation: string;
  successful_requests: number;
  failed_requests: number;
  estimated_billable_events: number;
  total_latency_ms: number;
  updated_at: string;
};

export type MapsBillingMonthly = {
  reference_month: string | null;
  service_description: string | null;
  sku_id: string | null;
  sku_description: string | null;
  usage_amount: number | null;
  usage_unit: string | null;
  gross_cost: number | null;
  credits_amount: number | null;
  net_cost: number | null;
  currency: string | null;
  source_updated_at: string | null;
  updated_at: string | null;
};

export type MapsBillingSyncState = {
  source: string;
  status: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_source_date: string | null;
  rows_imported: number;
  error_message: string | null;
  updated_at: string;
};

export type MapsApiAlert = {
  id: string;
  reference_month: string;
  environment: string;
  config_key: string;
  threshold_percentage: number;
  usage_count: number;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
};

export type MapsDashboardData = {
  projectEnvironment: 'staging' | 'production';
  configs: MapsMonitoringConfig[];
  monthlyUsage: MapsMonthlyUsage[];
  operationUsage: MapsOperationUsage[];
  billing: MapsBillingMonthly[];
  syncState: MapsBillingSyncState | null;
  alerts: MapsApiAlert[];
  unavailableSections: string[];
};

export const MAPS_SERVICE_GROUPS: Array<{
  key: MapsServiceGroup;
  label: string;
  description: string;
}> = [
  {
    key: 'places',
    label: 'Places Autocomplete',
    description: 'Sugestões de endereços e locais.',
  },
  {
    key: 'geocoding',
    label: 'Geocoding',
    description: 'Conversão entre endereços e coordenadas.',
  },
  {
    key: 'routes',
    label: 'Routes Essentials',
    description: 'Cálculo das rotas utilizadas pelo aplicativo.',
  },
  {
    key: 'maps_sdk',
    label: 'Maps SDK Android/iOS',
    description: 'Carregamentos dos mapas nativos.',
  },
];

export function getMapsServiceGroup(service: string): MapsServiceGroup | null {
  if (service === 'places') return 'places';
  if (service === 'geocoding') return 'geocoding';
  if (service === 'routes') return 'routes';
  if (service === 'maps_android' || service === 'maps_ios') return 'maps_sdk';
  return null;
}

export function inferBillingServiceGroup(
  skuDescription: string | null,
): MapsServiceGroup | null {
  const value = skuDescription?.toLocaleLowerCase('en-US') ?? '';
  if (value.includes('autocomplete') || value.includes('places')) return 'places';
  if (value.includes('geocod')) return 'geocoding';
  if (value.includes('route')) return 'routes';
  if (value.includes('map load') || value.includes('maps sdk')) return 'maps_sdk';
  return null;
}

function logQueryError(section: string, error: { code?: string; message?: string } | null) {
  if (!error) return;
  console.error(`Erro ao consultar ${section} do monitoramento Google Maps:`, {
    code: error.code,
    message: error.message,
  });
}

export async function getMapsMonitoringDashboard(
  supabase: SupabaseServerClient,
  monthStart: string,
  nextMonthStart: string,
): Promise<MapsDashboardData> {
  const mapsEnvironment = process.env.VERCEL
    ? 'production'
    : process.env.MAPS_MONITORING_ENVIRONMENT || 'production';
  if (!['development', 'preview', 'production'].includes(mapsEnvironment)) {
    throw new Error('Ambiente de monitoramento Google Maps inválido.');
  }
  const [
    configResult,
    monthlyResult,
    operationResult,
    billingResult,
    syncResult,
    alertsResult,
  ] = await Promise.all([
    supabase
      .from('maps_monitoring_config')
      .select('config_key, service, sku_name, free_monthly_limit, warning_thresholds, enabled')
      .eq('enabled', true)
      .order('service'),
    supabase
      .from('maps_api_usage_monthly')
      .select(
        'reference_month, environment, config_key, service, sku_name, free_monthly_limit, successful_requests, failed_requests, estimated_billable_events, total_latency_ms, average_latency_ms, free_events_remaining, usage_percentage, highest_threshold_reached, updated_at',
      )
      .eq('reference_month', monthStart)
      .eq('environment', mapsEnvironment),
    supabase
      .from('maps_api_usage_daily')
      .select(
        'config_key, operation, successful_requests, failed_requests, estimated_billable_events, total_latency_ms, updated_at',
      )
      .eq('environment', mapsEnvironment)
      .gte('usage_date', monthStart)
      .lt('usage_date', nextMonthStart)
      .order('config_key')
      .order('operation'),
    supabase
      .from('maps_billing_by_sku_monthly')
      .select(
        'reference_month, service_description, sku_id, sku_description, usage_amount, usage_unit, gross_cost, credits_amount, net_cost, currency, source_updated_at, updated_at',
      )
      .eq('reference_month', monthStart)
      .order('service_description')
      .order('sku_description'),
    supabase
      .from('maps_billing_sync_state')
      .select(
        'source, status, last_attempt_at, last_success_at, last_source_date, rows_imported, error_message, updated_at',
      )
      .eq('source', 'google_cloud_billing_export')
      .maybeSingle(),
    supabase
      .from('maps_api_alerts')
      .select(
        'id, reference_month, environment, config_key, threshold_percentage, usage_count, created_at, acknowledged_at, acknowledged_by',
      )
      .eq('reference_month', monthStart)
      .eq('environment', mapsEnvironment)
      .order('created_at', { ascending: false }),
  ]);

  logQueryError('configuração', configResult.error);
  logQueryError('consolidado mensal', monthlyResult.error);
  logQueryError('operações diárias', operationResult.error);
  logQueryError('faturamento mensal', billingResult.error);
  logQueryError('sincronização do Billing', syncResult.error);
  logQueryError('alertas', alertsResult.error);

  if (configResult.error) {
    throw new Error('Não foi possível carregar a configuração do monitoramento Google Maps.');
  }

  const unavailableSections: string[] = [];
  if (monthlyResult.error) unavailableSections.push('consumo mensal');
  if (operationResult.error) unavailableSections.push('operações');
  if (billingResult.error) unavailableSections.push('faturamento');
  if (syncResult.error) unavailableSections.push('sincronização');
  if (alertsResult.error) unavailableSections.push('alertas');

  const rawAlerts = (alertsResult.data ?? []) as unknown as Omit<
    MapsApiAlert,
    'acknowledged_by_name'
  >[];
  const administratorIds = [
    ...new Set(
      rawAlerts
        .map((alert) => alert.acknowledged_by)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const administratorProfiles = await getAdminProfilesByIds(
    supabase,
    administratorIds,
  );
  const administratorNames = new Map(
    administratorProfiles.map((profile) => [profile.id, profile.name]),
  );

  return {
    projectEnvironment:
      !process.env.VERCEL && process.env.ADMIN_ENVIRONMENT === 'staging'
        ? 'staging'
        : 'production',
    configs: (configResult.data ?? []) as unknown as MapsMonitoringConfig[],
    monthlyUsage: (monthlyResult.data ?? []) as unknown as MapsMonthlyUsage[],
    operationUsage: (operationResult.data ?? []) as unknown as MapsOperationUsage[],
    billing: (billingResult.data ?? []) as unknown as MapsBillingMonthly[],
    syncState: (syncResult.data as unknown as MapsBillingSyncState | null) ?? null,
    alerts: rawAlerts.map((alert) => ({
      ...alert,
      acknowledged_by_name: alert.acknowledged_by
        ? administratorNames.get(alert.acknowledged_by) ?? null
        : null,
    })),
    unavailableSections,
  };
}
