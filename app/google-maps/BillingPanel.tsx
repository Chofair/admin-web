import { CircleDollarSign } from 'lucide-react';
import { formatAdminDateTime } from '@/lib/admin-format';
import {
  inferBillingServiceGroup,
  type MapsBillingMonthly,
  type MapsServiceGroup,
} from '@/lib/maps-monitoring';
import { formatCurrency, formatNumber } from './view-helpers';

function getNetCost(row: MapsBillingMonthly) {
  return row.net_cost ?? (row.gross_cost ?? 0) + (row.credits_amount ?? 0);
}

export function BillingPanel({
  billing,
  selectedApi,
  selectedSku,
}: {
  billing: MapsBillingMonthly[];
  selectedApi: MapsServiceGroup | null;
  selectedSku: string | null;
}) {
  const visibleRows = billing.filter((row) => {
    if (selectedSku && row.sku_id !== selectedSku) return false;
    if (selectedApi && inferBillingServiceGroup(row.sku_description) !== selectedApi) {
      return false;
    }
    return true;
  });
  const costByCurrency = new Map<
    string,
    { gross: number; credits: number; net: number }
  >();
  for (const row of visibleRows) {
    const currency = row.currency ?? 'N/A';
    const total = costByCurrency.get(currency) ?? { gross: 0, credits: 0, net: 0 };
    total.gross += row.gross_cost ?? 0;
    total.credits += row.credits_amount ?? 0;
    total.net += getNetCost(row);
    costByCurrency.set(currency, total);
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <CircleDollarSign size={19} className="text-emerald-600" />
            Google Cloud Billing
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Custos importados por SKU; a moeda original é preservada.
          </p>
        </div>
        <p className="max-w-xl rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          O banco ainda não possui tabela de preços para calcular custo monetário
          estimado. A estimativa interna disponível é o volume de eventos faturáveis.
        </p>
      </div>

      {costByCurrency.size > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {[...costByCurrency.entries()].map(([currency, cost]) => (
            <div
              key={currency}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Total líquido · {currency}
              </p>
              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(cost.net, currency)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Bruto {formatCurrency(cost.gross, currency)} · créditos{' '}
                {formatCurrency(cost.credits, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              {['Serviço / SKU', 'Uso oficial', 'Bruto', 'Créditos', 'Líquido', 'Atualização'].map(
                (label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                  Nenhum custo importado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => {
                const currency = row.currency ?? 'N/A';
                return (
                  <tr
                    key={`${row.sku_id}-${currency}-${index}`}
                    className="border-b border-zinc-100 align-top dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {row.sku_description ?? 'SKU sem descrição'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {row.service_description ?? '—'} · {row.sku_id ?? 'sem ID'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatNumber(row.usage_amount, 6)} {row.usage_unit ?? ''}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatCurrency(row.gross_cost ?? 0, currency)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatCurrency(row.credits_amount ?? 0, currency)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(getNetCost(row), currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatAdminDateTime(row.source_updated_at)}
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
