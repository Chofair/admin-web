import NavBar from '@/components/NavBar';
import { requireAdmin } from '@/lib/auth';
import { getMapsMonitoringDashboard } from '@/lib/maps-monitoring';
import { MapsDashboardView } from './MapsDashboardView';
import { isMapsServiceGroup } from './view-helpers';

type SearchParams = {
  month?: string | string[];
  api?: string | string[];
  sku?: string | string[];
};

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getCurrentMonthKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function normalizeMonth(value?: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : getCurrentMonthKey();
}

function getMonthBounds(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  return {
    monthStart: `${monthKey}-01`,
    nextMonthStart: `${nextMonth.getUTCFullYear()}-${String(
      nextMonth.getUTCMonth() + 1,
    ).padStart(2, '0')}-01`,
  };
}

export default async function GoogleMapsMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const monthKey = normalizeMonth(getSingleValue(query.month));
  const apiValue = getSingleValue(query.api);
  const selectedApi = isMapsServiceGroup(apiValue) ? apiValue : null;
  const requestedSku = getSingleValue(query.sku);
  const { monthStart, nextMonthStart } = getMonthBounds(monthKey);
  const { supabase } = await requireAdmin();
  const dashboard = await getMapsMonitoringDashboard(
    supabase,
    monthStart,
    nextMonthStart,
  );
  const selectedSku = dashboard.billing.some((row) => row.sku_id === requestedSku)
    ? requestedSku ?? null
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <MapsDashboardView
        dashboard={dashboard}
        monthKey={monthKey}
        monthStart={monthStart}
        selectedApi={selectedApi}
        selectedSku={selectedSku}
      />
    </NavBar></div>
  );
}
