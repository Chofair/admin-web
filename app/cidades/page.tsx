import Link from 'next/link';
import { MapPin } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { requireAdmin } from '@/lib/auth';
import CityRow from './CityRow';
import CreateCityForm from './CreateCityForm';
import { CITY_FLAGS, UFS, type CityFlagKey, type CityRow as CityRowData } from './constants';

const inputClassName =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

export default async function CidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; uf?: string; servico?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? '').trim().slice(0, 100);
  const uf = (UFS as readonly string[]).includes(params.uf ?? '') ? params.uf! : undefined;
  const service = CITY_FLAGS.some(({ key }) => key === params.servico)
    ? (params.servico as CityFlagKey)
    : undefined;

  const { supabase } = await requireAdmin();
  let query = supabase
    .from('cidades_atendimento')
    .select(
      'id, cidade, estado, ativo_cliente, ativo_cliente_v1, ativo_cliente_v2, ativo_cliente_v3, ativo_motorista, ativo_motorista_acessibilidade, ativo_vans, updated_at',
    )
    .order('estado')
    .order('cidade');
  if (search) query = query.ilike('cidade', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
  if (uf) query = query.eq('estado', uf);
  if (service) query = query.eq(service, true);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao listar cidades de atendimento:', { code: error.code, message: error.message });
  }
  const cities = (data ?? []) as CityRowData[];
  const hasFilters = Boolean(search || uf || service);

  const summary = [
    { label: 'Cidades listadas', value: cities.length },
    { label: 'Ativas para clientes', value: cities.filter((city) => city.ativo_cliente).length },
    { label: 'Ativas para motoristas', value: cities.filter((city) => city.ativo_motorista).length },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <MapPin className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Cidades de atendimento</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Controle em quais cidades cada serviço do aplicativo está disponível
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <CreateCityForm />
        </div>

        <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar cidade"
            aria-label="Buscar cidade"
            className={`${inputClassName} w-56`}
          />
          <select name="uf" defaultValue={uf ?? ''} aria-label="Filtrar por UF" className={inputClassName}>
            <option value="">Todas as UFs</option>
            {UFS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="servico" defaultValue={service ?? ''} aria-label="Filtrar por serviço" className={inputClassName}>
            <option value="">Todos os serviços</option>
            {CITY_FLAGS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </select>
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/cidades"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Limpar
            </Link>
          )}
        </form>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Não foi possível carregar as cidades. Tente novamente.
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Cidade</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">UF</th>
                {CITY_FLAGS.map(({ key, label }) => (
                  <th key={key} className="px-3 py-3 text-center font-semibold text-zinc-600 dark:text-zinc-300">
                    {label}
                  </th>
                ))}
                <th
                  className="px-3 py-3 text-center font-semibold text-zinc-600 dark:text-zinc-300"
                  title="Calculado automaticamente: V1, V2 ou V3 ativo"
                >
                  Cliente (geral)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={CITY_FLAGS.length + 4} className="px-4 py-10 text-center text-zinc-400">
                    {hasFilters ? 'Nenhuma cidade encontrada com esses filtros' : 'Nenhuma cidade cadastrada'}
                  </td>
                </tr>
              ) : (
                // A chave inclui updated_at para remontar a linha com os valores salvos.
                cities.map((city) => <CityRow key={`${city.id}-${city.updated_at}`} city={city} />)
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
