import { formatAdminDateTime } from '@/lib/admin-format';
import type { CancellationReconciliation } from '@/lib/cancellation-presentation';
import { RetryAutomaticRefundForm } from '../cancelamentos-pagamento/RetryAutomaticRefundForm';
const reasons: Record<string,string> = {
  limite_conciliacao: 'O limite de consultas automáticas foi atingido. O resultado financeiro ainda precisa ser confirmado.',
  janela_conciliacao_encerrada: 'A janela de acompanhamento automático terminou. O resultado financeiro ainda precisa ser confirmado.',
  verificacao_manual_inconclusiva: 'A verificação adicional terminou sem uma conclusão. As consultas automáticas permanecem suspensas.',
  payment_search_not_found: 'A busca ainda não encontrou um pagamento correspondente. Isso não confirma ausência de cobrança.',
  payment_status_review: 'O status informado pelo provedor precisa de conferência antes de prosseguir.',
  payment_search_ambiguous: 'A busca encontrou mais de um pagamento possível. Confira a identidade da cobrança.',
  payment_search_incomplete: 'A busca retornou resultados incompletos. Confira a cobrança.',
  provider_paused: 'O processamento está aguardando a retomada das consultas ao provedor.',
  provider_response_uncertain: 'Não foi possível confirmar a consulta. A próxima verificação respeitará o limite configurado.',
  payment_mismatch: 'Os dados do provedor não correspondem à cobrança. Confira identidade, valor e ambiente.',
  provider_http_401: 'O provedor recusou a autenticação. É necessária uma verificação de configuração.',
  provider_http_403: 'O provedor recusou o acesso da integração. É necessária uma verificação de configuração.',
};
export default function CancellationReconciliationPanel({ items }: { items: CancellationReconciliation[] }) {
  const refundOnly = items.length > 0 && items.every(item => item.fase === 'reembolso');
  return <section aria-label={refundOnly ? 'Verificação do reembolso' : 'Acompanhamento da conciliação'} className="space-y-3"><h3 className="font-semibold">{refundOnly ? 'Verificação do reembolso' : 'Conciliação de cobranças incertas'}</h3>
    {items.map(item => <div key={item.pagamento_id} className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-700">
      <p className="font-semibold">{item.sem_ambiente || item.suspensa_em ? item.fase === 'reembolso' ? 'Reembolso precisa de verificação' : 'Cobrança precisa de verificação' : item.manual_pendente ? 'Verificação adicional agendada' : item.proxima_em ? item.fase === 'reembolso' ? 'Reembolso em processamento' : 'Conciliação pendente' : 'Verificação concluída'}</p>
      <p className="mt-2 break-all text-xs text-zinc-500 dark:text-zinc-400">Pagamento: {item.pagamento_id}</p>
      {item.sem_ambiente ? <p className="mt-2 text-amber-800 dark:text-amber-300">O ambiente do provedor não foi identificado neste registro. Confira a origem antes de qualquer processamento.</p> : <>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">Rodadas automáticas: {item.rodadas} de 6 · Consultas automáticas: {item.consultas} de 12</p>
        {item.consultas_manuais > 0 && <p className="mt-1 text-zinc-600 dark:text-zinc-300">Consultas adicionais: {item.consultas_manuais}</p>}
        {item.proxima_em && <p className="mt-2">Próxima verificação: {formatAdminDateTime(item.proxima_em)}</p>}
        {item.suspensa_em && <p className="mt-2 text-amber-800 dark:text-amber-300">{item.fase === 'reembolso' ? 'A devolução precisa de conferência; o pagamento já está identificado. Uma confirmação válida de reembolso ainda pode concluir este caso.' : 'As consultas automáticas foram suspensas. Uma confirmação válida do provedor ainda pode atualizar este caso.'}</p>}
        {item.codigo && <p className="mt-2 text-zinc-600 dark:text-zinc-300">{reasons[item.codigo] ?? 'Consulte o diagnóstico e o histórico para conferir a última verificação.'}</p>}
        {item.status_provedor && <p className="mt-2">Último status informado pelo provedor: <span className="font-mono">{item.status_provedor}</span></p>}
        {item.codigo && <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-blue-700 dark:text-blue-300">Diagnóstico técnico</summary><p className="break-all font-mono text-xs">{item.codigo}</p></details>}
        {item.suspensa_em && !item.manual_pendente && <RetryAutomaticRefundForm paymentId={item.pagamento_id} />}
      </>}
    </div>)}
  </section>;
}
