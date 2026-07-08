import { createSupabaseServerClient } from '@/lib/supabase-server';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR');
}

function formatCurrency(val?: number) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCPF(cpf?: string | null) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  finalizada: 'bg-orange-100 text-orange-800',
  concluida: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
};

const pagamentoStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-zinc-100 text-zinc-600',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

const repasseStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [
    { data: solicitacao, error: solicitacaoError },
    { data: enderecos },
    { data: pagamento },
    { data: repasse },
  ] = await Promise.all([
    supabase.from('solicitacoes').select('*').eq('id', id).single(),
    supabase.from('enderecos').select('*').eq('solicitacao_id', id),
    supabase
      .from('pagamentos')
      .select('*')
      .eq('solicitacao_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('repasses_motorista')
      .select('*, driver_profiles!motorista_id(chave_pix)')
      .eq('solicitacao_id', id)
      .maybeSingle(),
  ]);

  if (solicitacaoError) {
    console.error('Erro ao buscar solicitação:', solicitacaoError);
  }

  if (!solicitacao) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-zinc-500">Solicitação não encontrada.</p>
          <Link href="/solicitacoes" className="text-blue-600 hover:underline mt-4 inline-block">
            Voltar
          </Link>
        </main>
      </div>
    );
  }

  const pessoaIds = [solicitacao.usuario_id, solicitacao.motorista_id].filter(Boolean) as string[];
  const { data: pessoas } = pessoaIds.length
    ? await supabase.from('profiles').select('id, name, cpf, telefone').in('id', pessoaIds)
    : { data: [] as { id: string; name: string | null; cpf: string | null; telefone: string | null }[] };

  const usuario = pessoas?.find((p) => p.id === solicitacao.usuario_id) ?? null;
  const motorista = pessoas?.find((p) => p.id === solicitacao.motorista_id) ?? null;

  const enderecoOrigem = enderecos?.find((e: any) => e.tipo === 'origem');

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/solicitacoes" className="text-zinc-500 hover:text-zinc-900 text-sm">
            ← Solicitações
          </Link>
        </div>

        {/* Status Banner */}
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-semibold border ${
            solicitacao.status === 'pendente'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : solicitacao.status === 'cancelada'
              ? 'bg-red-50 border-red-200 text-red-800'
              : solicitacao.status === 'concluida'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          Status:{' '}
          <span className="uppercase tracking-wide">
            {solicitacao.status}
          </span>
          {solicitacao.motivo_cancelamento && (
            <span className="ml-2 font-normal">— {solicitacao.motivo_cancelamento}</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Solicitacao Details */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-800 mb-4">Detalhes da Solicitação</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">ID</span>
                <span className="font-mono text-xs text-zinc-400">{solicitacao.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tipo</span>
                <span className="font-medium text-zinc-900">
                  {solicitacao.tipo_solicitacao === 'motorista' ? 'Só Motorista' : 'Motorista + Carro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Data do serviço</span>
                <span className="text-zinc-900">{formatDate(solicitacao.data_servico)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Horário</span>
                <span className="text-zinc-900">{solicitacao.horario_inicio} – {solicitacao.horario_fim}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Duração</span>
                <span className="text-zinc-900">{solicitacao.duracao_horas}h</span>
              </div>
              {solicitacao.observacoes && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Observações</span>
                  <span className="text-right max-w-[60%] text-zinc-900">{solicitacao.observacoes}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Criado em</span>
                <span className="text-zinc-900">{formatDateTime(solicitacao.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-800 mb-4">Valores</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Taxa por hora</span>
                <span className="text-zinc-900">{formatCurrency(solicitacao.taxa_por_hora)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="font-bold text-lg text-zinc-900">{formatCurrency(solicitacao.preco_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Motorista recebe</span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(solicitacao.preco_motorista)}
                </span>
              </div>
              {solicitacao.preco_chofair_bruto != null && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chofair bruto</span>
                    <span className="text-zinc-900">{formatCurrency(solicitacao.preco_chofair_bruto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Imposto estimado</span>
                    <span className="text-zinc-900">{formatCurrency(solicitacao.preco_chofair_imposto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Chofair líquido</span>
                    <span className="font-semibold text-blue-700">
                      {formatCurrency(solicitacao.preco_chofair_liquido)}
                    </span>
                  </div>
                </>
              )}
              {(solicitacao.tempo_excedido_minutos ?? 0) > 0 && (
                <>
                  <hr className="border-zinc-100" />
                  <div className="flex justify-between text-orange-600">
                    <span>Tempo excedido</span>
                    <span>{solicitacao.tempo_excedido_minutos} min</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-semibold">
                    <span>Valor tempo excedido</span>
                    <span>{formatCurrency(solicitacao.preco_tempo_excedido)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>Total final</span>
                    <span>{formatCurrency(solicitacao.preco_final)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* People */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cliente */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-800 mb-4">Cliente</h3>
            {usuario ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-zinc-900">{usuario.name ?? '—'}</p>
                <p className="text-zinc-500 font-mono text-xs">{formatCPF(usuario.cpf)}</p>
                {usuario.telefone && (
                  <p className="text-zinc-900">{usuario.telefone}</p>
                )}
                <Link
                  href={`/usuarios/${solicitacao.usuario_id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Ver perfil
                </Link>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">—</p>
            )}
          </div>

          {/* Motorista */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-800 mb-4">Motorista</h3>
            {motorista ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-zinc-900">{motorista.name ?? '—'}</p>
                <p className="text-zinc-500 font-mono text-xs">{formatCPF(motorista.cpf)}</p>
                {motorista.telefone && (
                  <p className="text-zinc-900">{motorista.telefone}</p>
                )}
                <Link
                  href={`/motoristas/${solicitacao.motorista_id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Ver perfil
                </Link>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">Sem motorista atribuído</p>
            )}
          </div>
        </div>

        {/* Address */}
        {enderecoOrigem && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
            <h3 className="font-semibold text-zinc-800 mb-4">Endereço de Origem</h3>
            <div className="text-sm text-zinc-600 space-y-1">
              {enderecoOrigem.rua && (
                <p>
                  {enderecoOrigem.rua}
                  {enderecoOrigem.numero ? `, ${enderecoOrigem.numero}` : ''}
                  {enderecoOrigem.complemento ? ` — ${enderecoOrigem.complemento}` : ''}
                </p>
              )}
              {enderecoOrigem.bairro && <p>{enderecoOrigem.bairro}</p>}
              {enderecoOrigem.cidade && (
                <p>
                  {enderecoOrigem.cidade}
                  {enderecoOrigem.estado ? ` - ${enderecoOrigem.estado}` : ''}
                  {enderecoOrigem.cep ? ` — CEP: ${enderecoOrigem.cep}` : ''}
                </p>
              )}
              {enderecoOrigem.latitude && enderecoOrigem.longitude && (
                <p className="text-zinc-400 font-mono text-xs">
                  {enderecoOrigem.latitude}, {enderecoOrigem.longitude}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h3 className="font-semibold text-zinc-800 mb-4">Linha do Tempo</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-zinc-900">Criada</p>
                <p className="text-zinc-400">{formatDateTime(solicitacao.created_at)}</p>
              </div>
            </div>
            {solicitacao.confirmada_em && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">Confirmada</p>
                  <p className="text-zinc-400">{formatDateTime(solicitacao.confirmada_em)}</p>
                </div>
              </div>
            )}
            {solicitacao.iniciada_em && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">Iniciada</p>
                  <p className="text-zinc-400">{formatDateTime(solicitacao.iniciada_em)}</p>
                </div>
              </div>
            )}
            {solicitacao.finalizada_em && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">Finalizada</p>
                  <p className="text-zinc-400">{formatDateTime(solicitacao.finalizada_em)}</p>
                </div>
              </div>
            )}
            {solicitacao.concluida_em && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">Concluída</p>
                  <p className="text-zinc-400">{formatDateTime(solicitacao.concluida_em)}</p>
                </div>
              </div>
            )}
            {solicitacao.cancelado_em && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-900">Cancelada por: {solicitacao.cancelado_por ?? '—'}</p>
                  <p className="text-zinc-400">{formatDateTime(solicitacao.cancelado_em)}</p>
                  {solicitacao.motivo_cancelamento && (
                    <p className="text-zinc-500 italic">{solicitacao.motivo_cancelamento}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment + Repasse */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pagamento && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-semibold text-zinc-800 mb-4">Pagamento do Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      pagamentoStatusColors[pagamento.status] ?? 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {pagamento.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valor</span>
                  <span className="font-semibold text-zinc-900">
                    {formatCurrency(pagamento.valor_centavos / 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ID AbacatePay</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {pagamento.abacatepay_billing_id}
                  </span>
                </div>
                {pagamento.pago_em && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Pago em</span>
                    <span className="text-zinc-900">{formatDateTime(pagamento.pago_em)}</span>
                  </div>
                )}
                {pagamento.url_pagamento && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Link</span>
                    <a
                      href={pagamento.url_pagamento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Abrir link
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {repasse && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-semibold text-zinc-800 mb-4">Repasse ao Motorista</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      repasseStatusColors[repasse.status] ?? 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {repasse.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Valor</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(repasse.valor)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Chave PIX</span>
                  <span className="font-mono text-xs text-zinc-900">
                    {repasse.driver_profiles?.chave_pix ?? '—'}
                  </span>
                </div>
                {repasse.pago_em && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Pago em</span>
                    <span className="text-zinc-900">{formatDateTime(repasse.pago_em)}</span>
                  </div>
                )}
                <Link
                  href="/pagamentos"
                  className="text-blue-600 hover:underline text-xs inline-block mt-1"
                >
                  Gerenciar repasses →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
