import Link from 'next/link';
import { Search } from 'lucide-react';
import NavBar from '@/components/NavBar';
import {
  listAdminVehicles,
  type AdminVehicleSummary,
} from '@/lib/admin-driver-vehicles';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import {
  getVehicleStatusLabel,
  getVehicleStatusStyle,
  PENDING_VEHICLE_STATUSES,
} from '@/lib/vehicle-validation';

const PAGE_SIZE = 25;

type ProfileSummary = { id: string; name: string | null; cpf: string | null };
type CategoryRelationship = { label: string };
type CategoryRow = {
  veiculo_id: string;
  categorias_veiculo: CategoryRelationship | CategoryRelationship[] | null;
};

function formatDate(date?: string | null) {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '-';
}

function buildPageHref(filter: string, query: string, page: number) {
  const params = new URLSearchParams();
  params.set('filter', filter);
  if (query) params.set('q', query);
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search ? '/veiculos?' + search : '/veiculos';
}

async function getVehicles(filter: string, query: string, page: number) {
  const { supabase } = await requireAdmin();
  const from = (page - 1) * PAGE_SIZE;

  let statuses: string[] | undefined;
  if (filter === 'pendentes') {
    statuses = [...PENDING_VEHICLE_STATUSES];
  } else if (filter === 'aprovados') {
    statuses = ['aprovado'];
  } else if (filter === 'rejeitados') {
    statuses = ['rejeitado'];
  }

  let vehiclesResult;
  try {
    vehiclesResult = await listAdminVehicles(supabase, {
      statuses,
      plate: query || undefined,
      limit: PAGE_SIZE,
      offset: from,
    });
  } catch {
    return { vehicles: [], profiles: new Map(), categories: new Map(), count: 0, hasError: true };
  }

  const vehicles = vehiclesResult.items as AdminVehicleSummary[];
  const driverIds = [...new Set(vehicles.map((vehicle) => vehicle.motorista_id))];
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const [profileRows, categoriesResult] = await Promise.all([
    getAdminProfilesByIds(supabase, driverIds),
    vehicleIds.length
      ? supabase
          .from('veiculo_categorias')
          .select('veiculo_id, categorias_veiculo!veiculo_categorias_categoria_id_fkey(label)')
          .in('veiculo_id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesResult.error) console.error('Erro ao buscar categorias dos veículos:', categoriesResult.error);

  const profiles = new Map(
    (profileRows as ProfileSummary[]).map((profile) => [profile.id, profile])
  );
  const categories = new Map<string, string[]>();
  for (const row of (categoriesResult.data ?? []) as unknown as CategoryRow[]) {
    const relationship = row.categorias_veiculo;
    const labels = Array.isArray(relationship)
      ? relationship.map((category) => category.label)
      : relationship?.label
        ? [relationship.label]
        : [];
    categories.set(row.veiculo_id, [...(categories.get(row.veiculo_id) ?? []), ...labels]);
  }

  return { vehicles, profiles, categories, count: vehiclesResult.total, hasError: false };
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const validFilters = ['todos', 'pendentes', 'aprovados', 'rejeitados'];
  const filter = validFilters.includes(params.filter ?? '') ? params.filter! : 'pendentes';
  const query = (params.q ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
  const requestedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { vehicles, profiles, categories, count, hasError } = await getVehicles(filter, query, page);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const filters = [
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'aprovados', label: 'Aprovados' },
    { key: 'rejeitados', label: 'Rejeitados' },
    { key: 'todos', label: 'Todos' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
              Validação de veículos
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {count} {count === 1 ? 'veículo encontrado' : 'veículos encontrados'}
            </p>
          </div>
          <form action="/veiculos" className="flex w-full sm:w-auto gap-2">
            <input type="hidden" name="filter" value={filter} />
            <label htmlFor="vehicle-search" className="sr-only">Buscar por placa</label>
            <input
              id="vehicle-search"
              name="q"
              defaultValue={query}
              maxLength={10}
              placeholder="Buscar por placa"
              className="min-w-0 flex-1 sm:w-56 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              title="Buscar veículo"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Search size={17} />
            </button>
          </form>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={buildPageHref(item.key, query, 1)}
              className={'whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                (filter === item.key
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {hasError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Não foi possível carregar os veículos. Tente novamente.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  {['Placa', 'Motorista', 'Veículo', 'Categorias', 'Status', 'Cadastro', 'Ação'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400 dark:text-zinc-500">
                      Nenhum veículo encontrado
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => {
                    const profile = profiles.get(vehicle.motorista_id);
                    const vehicleCategories = categories.get(vehicle.id) ?? [];
                    return (
                      <tr key={vehicle.id} className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                        <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {vehicle.placa}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{profile?.name ?? '-'}</p>
                          <p className="text-xs text-zinc-500">{profile?.cpf ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {[vehicle.marca, vehicle.modelo].filter(Boolean).join(' ') || '-'}
                          {vehicle.ano ? <span className="block text-xs text-zinc-500">{vehicle.ano}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {vehicleCategories.length ? vehicleCategories.join(', ') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' + getVehicleStatusStyle(vehicle.status_validacao)}>
                            {getVehicleStatusLabel(vehicle.status_validacao)}
                          </span>
                          {(vehicle.campos_pendentes?.length ?? 0) > 0 && (
                            <p className="mt-1 text-xs text-zinc-500">{vehicle.campos_pendentes!.length} pendência(s)</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{formatDate(vehicle.created_at)}</td>
                        <td className="px-4 py-3">
                          <Link href={'/veiculos/' + vehicle.id} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                            Revisar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginação de veículos" className="mt-5 flex items-center justify-between gap-3 text-sm">
            <Link
              href={buildPageHref(filter, query, Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={'rounded-lg border px-3 py-2 ' + (page <= 1
                ? 'pointer-events-none border-zinc-200 text-zinc-400 dark:border-zinc-800'
                : 'border-zinc-300 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900')}
            >
              Anterior
            </Link>
            <span className="text-zinc-500 dark:text-zinc-400">
              Página {Math.min(page, totalPages)} de {totalPages}
            </span>
            <Link
              href={buildPageHref(filter, query, Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              className={'rounded-lg border px-3 py-2 ' + (page >= totalPages
                ? 'pointer-events-none border-zinc-200 text-zinc-400 dark:border-zinc-800'
                : 'border-zinc-300 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900')}
            >
              Próxima
            </Link>
          </nav>
        )}
      </main>
    </NavBar></div>
  );
}
