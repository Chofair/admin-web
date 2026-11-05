import Link from 'next/link';
import { Activity } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { requireAdmin } from '@/lib/auth';
import { EVENT_LABELS, MODALITY_LABELS, ROLE_LABELS, demandRpcArgs, demandUrl, isDemandSetupMissing, parseDemandFilters, type DemandData, type Query } from '@/lib/admin-demand';
import { UFS } from '../constants';

const input = 'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950';
const table = 'w-full text-left text-sm [&_th]:px-4 [&_th]:py-3 [&_td]:px-4 [&_td]:py-3 [&_tr]:border-b [&_tr]:border-zinc-100 dark:[&_tr]:border-zinc-800';
const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
const number = (value: number) => value.toLocaleString('pt-BR');

export default async function DemandaPage({ searchParams }: { searchParams: Promise<Query> }) {
  const { supabase } = await requireAdmin();
  const { filters, error: filterError } = parseDemandFilters(await searchParams, UFS);
  let error = filterError;
  let data: DemandData | null = null;
  if (!error) {
    const result = await supabase.rpc('admin_consultar_demanda_cidades', demandRpcArgs(filters));
    if (result.error || !result.data?.resumo || !Array.isArray(result.data.eventos) || !Array.isArray(result.data.cidades)) {
      const code = result.error?.code ?? 'INVALID_RESPONSE';
      if (isDemandSetupMissing(result.error)) {
        console.info(`[Demanda] Configuração do banco pendente: ${code}`);
        error = 'O monitoramento ainda não está disponível neste ambiente. A configuração do banco precisa ser atualizada.';
      } else {
        console.error(`Falha na consulta de demanda: ${code}`);
        error = 'Não foi possível carregar os registros. Tente novamente.';
      }
    } else { data = result.data as DemandData; }
  }
  const cards = data ? [
    { label: 'Cadastros sem cobertura', value: data.resumo.interesses, detail: 'A conta foi concluída com sucesso.' },
    { label: 'Recusas por cidade', value: data.resumo.recusas_cidade, detail: 'Cadastro ou pedido sem cobertura disponível.' },
    { label: 'Recusas por modalidade', value: data.resumo.recusas_modalidade, detail: 'A cidade atende outro tipo de corrida.' },
    { label: 'Falhas técnicas reportadas', value: data.resumo.falhas, detail: 'Ocorrências para investigação da equipe.' },
  ] : [];
  const last = data?.eventos.at(-1);
  return <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"><NavBar>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="my-6 flex items-start gap-3"><Activity className="mt-1 shrink-0 text-blue-600" aria-hidden="true" />
        <div><h1 className="text-2xl font-bold">Ocorrências de cadastro</h1><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Acompanhe o interesse por praça, os pedidos recusados e as falhas reportadas nos fluxos monitorados.</p></div>
      </header>
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="grid gap-1 text-sm">De<input className={input} name="inicio" type="date" defaultValue={filters.inicio} required /></label>
        <label className="grid gap-1 text-sm">Até<input className={input} name="fim" type="date" defaultValue={filters.fim} required /></label>
        <label className="grid gap-1 text-sm">Cidade<input className={input} name="cidade" placeholder="Nome completo" maxLength={100} defaultValue={filters.cidade} /></label>
        <label className="grid gap-1 text-sm">UF<select className={input} name="uf" defaultValue={filters.uf}><option value="">Todas</option>{UFS.map(uf => <option key={uf}>{uf}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Ocorrência<select className={input + ' max-w-64'} name="tipo" defaultValue={filters.tipo}><option value="">Todas</option>{Object.entries(EVENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Perfil<select className={input} name="papel" defaultValue={filters.papel}><option value="">Todos</option>{Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="grid gap-1 text-sm">Modalidade<select className={input} name="modalidade" defaultValue={filters.modalidade}><option value="">Todas</option>{Object.entries(MODALITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Consultar</button>
        <Link href="/cidades/demanda" className="px-2 py-2 text-sm text-zinc-600 hover:underline dark:text-zinc-400">Limpar</Link>
        <p className="w-full text-xs text-zinc-500">Histórico dos últimos 30 dias · limpeza automática diária · horários de Brasília. Os registros começam com a implantação do monitoramento; recusas antigas não são recuperadas.</p>
      </form>
      {error && <div role="alert" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
      {data && <>
        <section aria-label="Resumo do período" className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="text-sm font-medium">{card.label}</h2><p className="my-2 text-3xl font-bold tabular-nums">{number(card.value)}</p><p className="text-xs text-zinc-500">{card.detail}</p></div>)}</section>
        <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Por cidade</h2><p className="mb-3 text-sm text-zinc-500">Até 30 praças com mais ocorrências no período. Selecione uma cidade para detalhar.</p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><table className={table}><thead><tr><th>Cidade / UF</th><th>Cadastros</th><th>Recusas</th><th>Falhas</th></tr></thead><tbody>
            {!data.cidades.length && <tr><td colSpan={4} className="text-zinc-500">Nenhuma ocorrência para os filtros selecionados.</td></tr>}
            {data.cidades.map((city, index) => <tr key={`${city.cidade}-${city.estado}-${index}`}><td>{city.cidade ? <Link className="text-blue-700 hover:underline dark:text-blue-400" href={demandUrl(filters, undefined, city)}>{city.cidade}{city.estado ? `/${city.estado}` : ''}</Link> : 'Não informada'}</td><td>{number(city.interesses)}</td><td>{number(city.recusas)}</td><td>{number(city.falhas)}</td></tr>)}
          </tbody></table></div>
        </section>
        <section><h2 className="mb-3 text-lg font-semibold">Histórico de ocorrências</h2><p className="mb-3 text-sm text-zinc-500">{number(data.resumo.total)} registros no período · até 50 por página. Interesse de cadastro não representa falha.</p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><table className={table}><thead><tr><th>Quando</th><th>Ocorrência</th><th>Momento</th><th>Cidade / UF</th><th>Perfil</th><th>Modalidade</th><th>Conta</th></tr></thead><tbody>
            {!data.eventos.length && <tr><td colSpan={7} className="text-zinc-500">Nenhum registro nesta página.</td></tr>}
            {data.eventos.map(event => <tr key={event.id}><td className="whitespace-nowrap">{formatDate(event.criado_em)}</td><td><span className={event.tipo === 'falha_tecnica' ? 'font-medium text-rose-700 dark:text-rose-400' : ''}>{EVENT_LABELS[event.tipo]}</span>{event.tipo === 'falha_tecnica' && <code className="mt-1 block text-xs text-zinc-500">{event.codigo}</code>}</td><td>{event.momento === 'cadastro' ? 'Cadastro' : 'Pedido de corrida'}</td><td>{event.cidade ?? 'Não informada'}{event.estado ? `/${event.estado}` : ''}</td><td>{ROLE_LABELS[event.papel]}</td><td>{event.modalidade ? MODALITY_LABELS[event.modalidade] : '—'}</td><td>{event.usuario_id ? <Link href={`/usuarios/${event.usuario_id}`} className="whitespace-nowrap text-blue-700 hover:underline dark:text-blue-400">Ver conta</Link> : 'Sem vínculo'}</td></tr>)}
          </tbody></table></div>
          <nav aria-label="Paginação das ocorrências" className="mt-4 flex items-center justify-between text-sm"><Link className="rounded-lg border px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" href={demandUrl(filters)}>Início da consulta</Link>{data.mais && last && <Link className="rounded-lg border px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" href={demandUrl(filters, last)}>Mais antigas →</Link>}</nav>
        </section>
      </>}
    </main>
  </NavBar></div>;
}
