import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleAlert, ClipboardList, History } from 'lucide-react';
import NavBar from '@/components/NavBar';
import AuditEventAccordion from '@/components/AuditEventAccordion';
import { requireAdmin } from '@/lib/auth';
import { formatAdminDateTime } from '@/lib/admin-format';
import { casePresentation, cancellationLabels, originLabels, rideLabels, eventLabels, type CancellationCase } from '@/lib/cancellation-presentation';
import { DecisionForm } from './DecisionForm';
import { RefreshButton } from './RefreshButton';
import { RetryAutomaticRefundForm } from '../cancelamentos-pagamento/RetryAutomaticRefundForm';
import CancellationReconciliationPanel from './CancellationReconciliationPanel';
const money = (c: number | null) => c === null ? '—' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800';
const section = 'rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-950';
export default async function Cancellations({ searchParams }: { searchParams: Promise<{ cursor?: string; id?: string; status?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const id = params.id && /^[0-9a-f-]{36}$/i.test(params.id) ? params.id : null;
  const status = params.status === 'resolvidos' || params.status === 'todos' ? params.status : 'abertos';
  const cursor = params.cursor && !Number.isNaN(Date.parse(params.cursor)) ? params.cursor : null;
  const { data, error } = id
    ? await supabase.rpc('obter_cancelamento_v2', { solicitacao_id_input: id })
    : await supabase.rpc('admin_listar_cancelamentos_v2', { limite_input: 40, antes_de_input: cursor, situacao_input: status });
  const cases: CancellationCase[] = error ? [] : id ? (data ? [data] : []) : (data ?? []);
  return <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"><NavBar>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400"><ClipboardList size={17} /> Gestão de cancelamentos</p>
          <h1 className="text-2xl font-bold">Cancelamentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">Analise os casos pendentes e acompanhe reembolsos e repasses. Casos resolvidos ficam no histórico.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/cancelamentos-pagamento" className={button}>Fila de reembolsos <ArrowRight size={16} /></Link><RefreshButton /></div>
      </header>
      <details className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer py-1 font-semibold">Como funcionam as decisões?</summary>
        <div className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400"><p>Reembolso ao cliente e repasse ao motorista são decisões independentes. Aprovar ambos transfere o custo à Chofair.</p>
          <p>Durante a análise, as cobranças continuam. Aprovar o reembolso devolve todos os pagamentos da corrida, cancela pendências e cobre confirmações tardias.</p>
          <p>O repasse só pode ser aprovado após o encerramento e a consolidação dos valores. A confirmação no painel registra uma transferência já realizada.</p></div>
      </details>
      <nav aria-label="Filtrar cancelamentos" className="flex flex-wrap gap-2">
        {([['abertos','Pendentes'],['resolvidos','Resolvidos'],['todos','Todos']] as const).map(([value,label]) =>
          <Link key={value} href={`/cancelamentos?status=${value}`} aria-current={!id && status === value ? 'page' : undefined}
            className={`${button} ${!id && status === value ? '!border-blue-700 !bg-blue-700 !text-white dark:!bg-blue-700' : ''}`}>{label}</Link>)}
      </nav>
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">Não foi possível carregar os cancelamentos. Atualize a página para tentar novamente. As decisões estão indisponíveis até a consulta ser concluída.</div>}
      {!error && cases.length === 0 && <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><BadgeCheck className="mx-auto mb-3 text-emerald-600" size={30} /><h2 className="font-semibold">{id ? 'Cancelamento não encontrado' : status === 'abertos' ? 'Nenhum caso pendente' : 'Nenhum caso neste filtro'}</h2><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Consulte os outros filtros para acompanhar o histórico.</p></div>}
      {!error && cases.length > 0 && <p className="text-sm text-zinc-600 dark:text-zinc-400">{cases.length} caso(s) nesta página</p>}
      {cases.map(c => {
        const view = casePresentation(c);
        const paidOut = c.repasse === 'pago';
        return <article key={c.solicitacao_id} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-4"><div>
            <div className="mb-3 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${view.resolved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{view.title}</span><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-800">{c.automatica ? 'Regra automática' : 'Análise da equipe'}</span></div>
            <h2 className="text-lg font-semibold">{c.cliente_nome || 'Cliente não identificado'}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Corrida {c.solicitacao_id.slice(0,8)} · {formatAdminDateTime(c.solicitada_em)}</p></div>
            <Link href={`/solicitacoes/${c.solicitacao_id}`} className={button}>Ver corrida <ArrowRight size={16} /></Link></header>
          <dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-zinc-600 dark:text-zinc-400">Solicitado por</dt><dd className="mt-1 font-medium">{originLabels[c.origem] ?? c.origem}</dd></div><div><dt className="text-zinc-600 dark:text-zinc-400">Motorista</dt><dd className="mt-1 font-medium">{c.motorista_nome ?? 'Sem motorista atribuído'}</dd></div><div><dt className="text-zinc-600 dark:text-zinc-400">Situação da corrida</dt><dd className="mt-1 font-medium">{rideLabels[c.status_operacional] ?? c.status_operacional}</dd></div></dl>
          <div className="border-l-4 border-zinc-300 pl-4 dark:border-zinc-600"><p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Motivo informado</p><p className="mt-1 whitespace-pre-wrap text-sm">{c.motivo}</p></div>
          {c.status_operacional === 'em_andamento' && <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"><CircleAlert size={18} className="shrink-0" /> O atendimento continua até o encerramento seguro pelo motorista.</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className={section}><h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Reembolso ao cliente</h3><p className="mt-2 text-lg font-bold">{view.refund}</p>
              {c.sem_pagamento ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Não houve pagamento confirmado nem cobrança aguardando conciliação. Nenhuma devolução precisa ser executada.</p>
                : c.valor_reembolso_centavos > 0 ? <><p className="mt-3 text-2xl font-bold">{money(c.valor_devolvido_centavos)} <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">de {money(c.valor_reembolso_centavos)}</span></p><p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Devolvido / total recebido vinculado à corrida</p></>
                : <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Nenhum pagamento confirmado até o momento. A cobrança continua sendo verificada antes de qualquer devolução.</p>}
              {c.cobranca_em_acompanhamento && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Há cobrança em conciliação. Uma confirmação tardia será tratada conforme a decisão do reembolso.</p>}
              {c.reembolso_decisao === 'pendente' && <DecisionForm key={c.solicitacao_id + ":reembolso"} id={c.solicitacao_id} topic="reembolso" />}
            </section>
            <section className={section}><h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Repasse ao motorista</h3><p className="mt-2 text-lg font-bold">{view.payout}</p>
              {c.repasse_valor_centavos !== null && <p className="mt-3 text-2xl font-bold">{money(c.repasse_valor_centavos)}</p>}
              {c.repasse === 'negado' ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{c.automatica || !c.motorista_nome ? 'Este cancelamento não gera repasse ao motorista.' : 'O repasse não foi aprovado. Consulte a justificativa no histórico.'}</p>
                : paidOut ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Transferência registrada. Referência: <span className="break-all font-mono">{c.transferencia_id}</span></p>
                : <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Inclui o valor contratado e adicionais realizados, mesmo que o cliente ainda não tenha pago. A Chofair assume essa diferença.</p>}
              {c.repasse_composicao && <dl className="mt-4 space-y-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-700">{[['Contratado',Math.round(c.repasse_composicao.contratado*100)],['Percursos adicionais',Math.round(c.repasse_composicao.adicionais*100)],['Excedentes',c.repasse_composicao.total-Math.round((c.repasse_composicao.contratado+c.repasse_composicao.adicionais)*100)]].map(([label,value]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{money(Number(value))}</dd></div>)}</dl>}
              {c.repasse === 'pendente' && <DecisionForm key={c.solicitacao_id + ":repasse"} id={c.solicitacao_id} topic="repasse" canApprove={['cancelada','finalizada','concluida'].includes(c.status_operacional)} />}
              {c.repasse === 'aprovado' && <DecisionForm key={c.solicitacao_id + ":transferencia"} id={c.solicitacao_id} topic="transferencia" />}
            </section>
          </div>
          {Boolean(c.conciliacoes?.length) && <CancellationReconciliationPanel items={c.conciliacoes!} />}
          {c.reembolsos.length > 0 && <section aria-label="Processamento das devoluções" className="space-y-3"><h3 className="font-semibold">Devoluções por pagamento</h3>{c.reembolsos.map(r => <div key={r.id} className={`rounded-xl border p-4 ${r.status === 'reembolsado' ? 'border-emerald-200 dark:border-emerald-900' : 'border-amber-200 dark:border-amber-900'}`}>
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{money(r.valor_centavos)} · {cancellationLabels[r.status] ?? r.status}</p><span className="text-xs text-zinc-600 dark:text-zinc-400">{r.ambiente === 'sandbox' ? 'Ambiente de testes' : 'Produção'}</span></div>
            {r.status === 'falha' && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">A devolução precisa de verificação. Consulte os detalhes antes de solicitar nova tentativa.</p>}
            <details className="mt-3 text-sm"><summary className="cursor-pointer py-2 font-medium text-blue-700 dark:text-blue-400">Detalhes do processamento</summary><div className="mt-2 space-y-1 break-all text-zinc-600 dark:text-zinc-400"><div>Pagamento: {r.pagamento_id}</div><div>Referência do reembolso: {r.provedor_reembolso_id ?? 'Aguardando confirmação'}</div><div>Tentativas: {r.tentativas}</div>{r.ultimo_codigo && <div>Diagnóstico: {r.ultimo_codigo}</div>}</div></details>
            {r.status === 'falha' && !c.conciliacoes?.some(item => item.pagamento_id === r.pagamento_id && item.suspensa_em) && <RetryAutomaticRefundForm refundId={r.id} />}</div>)}</section>}
          <section className="border-t border-zinc-200 pt-3 dark:border-zinc-800"><h3 className="py-2 text-sm font-semibold"><History className="mr-2 inline" size={16} /> Histórico e responsáveis ({c.eventos.length})</h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Início: {formatAdminDateTime(c.iniciada_em)} · Encerramento: {formatAdminDateTime(c.finalizada_em)}</p>
            {!c.eventos.length ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Nenhum evento registrado.</p> : <ol className="mt-4 space-y-3">{c.eventos.map(e => <li key={e.id}>
              <AuditEventAccordion title={eventLabels[e.evento] ?? e.evento.replaceAll('_',' ')} metadata={formatAdminDateTime(e.criado_em)}>
                <p className="whitespace-pre-wrap">{e.motivo}</p>
                <p className="break-all text-xs text-zinc-600 dark:text-zinc-400">{e.ator_id ? `Responsável: ${e.ator_id}` : 'Ação automática do sistema'}</p>
              </AuditEventAccordion>
            </li>)}</ol>}
          </section>
        </article>;
      })}
      {!id && <div className="flex flex-wrap justify-between gap-3">{cursor ? <Link className={button} href={`/cancelamentos?status=${status}`}>Voltar aos mais recentes</Link> : <span />}{cases.length === 40 && <Link className={button} href={`/cancelamentos?status=${status}&cursor=${encodeURIComponent(cases[cases.length-1].solicitada_em)}`}>Carregar mais antigos <ArrowRight size={16} /></Link>}</div>}
    </main>
  </NavBar></div>;
}
