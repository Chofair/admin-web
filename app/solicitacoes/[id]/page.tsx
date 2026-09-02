import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeDollarSign,
  Clock3,
  ListChecks,
  MapPin,
  ReceiptText,
  Route,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import SafeExternalLink from '@/components/SafeExternalLink';
import { formatAdminDateTime as formatDateTime } from '@/lib/admin-format';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import {
  getAdminRequestPayments,
  getRequestAdminContext,
  type AdminPaymentItem,
  type ManualRefundRecord,
  type PaymentCancellationContext,
  type RequestAdminContext,
  type RideReviewContext,
} from '@/lib/admin-operations';

type RequestRow = {
  id: string;
  usuario_id: string;
  motorista_id: string | null;
  tipo_solicitacao: string;
  data_servico: string;
  horario_inicio: string;
  horario_fim: string;
  duracao_horas: number;
  observacoes: string | null;
  status: string;
  taxa_por_hora: number | null;
  preco_total: number | null;
  preco_motorista: number | null;
  preco_chofair_bruto: number | null;
  preco_chofair_imposto: number | null;
  preco_chofair_liquido: number | null;
  tempo_real_minutos: number | null;
  tempo_excedido_minutos: number | null;
  extensao_confirmada_minutos: number | null;
  preco_tempo_excedido: number | null;
  preco_final: number | null;
  preco_motorista_final: number | null;
  limite_cobranca_em: string | null;
  finalizada_por: string | null;
  revisao_solicitada_em: string | null;
  motivo_revisao: string | null;
  confirmada_em: string | null;
  iniciada_em: string | null;
  finalizada_em: string | null;
  concluida_em: string | null;
  cancelado_por: string | null;
  motivo_cancelamento: string | null;
  cancelado_em: string | null;
  created_at: string;
};

type AddressRow = {
  id: string;
  tipo: string;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PaymentDetail = AdminPaymentItem;

type PayoutDetail = {
  id: string;
  valor: number;
  status: string;
  pago_em: string | null;
  created_at: string;
  driver_profiles: { chave_pix: string | null } | null;
};

type ProfileSummary = {
  id: string;
  name: string | null;
  cpf: string | null;
  telefone: string | null;
};

type TimelineTone = 'zinc' | 'blue' | 'green' | 'orange' | 'red' | 'purple';
type TimelineEvent = {
  date: string;
  title: string;
  description?: string | null;
  tone: TimelineTone;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requestStatusColors: Record<string, string> = {
  pendente: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300',
  confirmada: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
  em_andamento: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  finalizada: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
  concluida: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  cancelada: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  EXPIRED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
};

const timelineToneColors: Record<TimelineTone, string> = {
  zinc: 'bg-zinc-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatCurrency(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCents(value?: number | null) {
  if (value == null) return '—';
  return formatCurrency(value / 100);
}

function formatCPF(value?: string | null) {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9)}`;
}

function formatLabel(value?: string | null) {
  if (!value) return '—';
  return value.replaceAll('_', ' ');
}

function addEvent(
  events: TimelineEvent[],
  date: string | null | undefined,
  title: string,
  tone: TimelineTone,
  description?: string | null,
) {
  if (date) events.push({ date, title, tone, description });
}

function buildTimeline(
  request: RequestRow,
  payments: PaymentDetail[],
  context: RequestAdminContext | null,
) {
  const events: TimelineEvent[] = [];

  addEvent(events, request.created_at, 'Solicitação criada', 'zinc');

  for (const payment of payments) {
    const type = payment.tipo_pagamento === 'excedente' ? 'excedente' : 'inicial';
    addEvent(
      events,
      payment.created_at,
      `Cobrança ${type} criada`,
      payment.tipo_pagamento === 'excedente' ? 'orange' : 'blue',
      `${formatCents(payment.valor_centavos)} · ${payment.status}`,
    );
    addEvent(
      events,
      payment.pago_em,
      `Pagamento ${type} confirmado`,
      'green',
      `${formatCents(payment.valor_centavos)} · ${
        payment.provedor === 'mercadopago'
          ? 'Mercado Pago'
          : payment.provedor === 'abacatepay'
            ? 'AbacatePay (legado)'
            : 'sem cobrança criada'
      }`,
    );
    addEvent(
      events,
      payment.conciliacao_verificada_em,
      `Conciliação da cobrança ${type}`,
      'blue',
      `${payment.conciliacao_tentativas} tentativa(s)`,
    );
    addEvent(
      events,
      payment.conciliacao_encerrada_em,
      `Conciliação da cobrança ${type} interrompida`,
      'red',
      payment.conciliacao_motivo,
    );
  }

  addEvent(events, request.confirmada_em, 'Motorista confirmou a solicitação', 'green');
  addEvent(events, request.iniciada_em, 'Corrida iniciada', 'blue');
  addEvent(
    events,
    request.finalizada_em,
    'Corrida finalizada',
    'orange',
    request.finalizada_por ? `Por ${formatLabel(request.finalizada_por)}` : null,
  );
  addEvent(
    events,
    context?.revisao?.criada_em ?? request.revisao_solicitada_em,
    'Revisão administrativa solicitada',
    'purple',
    context?.revisao?.motivo ?? request.motivo_revisao,
  );
  addEvent(
    events,
    context?.revisao?.resolvida_em,
    'Revisão administrativa resolvida',
    'purple',
    context?.revisao?.decisao
      ? `${formatLabel(context.revisao.decisao)} · ${
          context.revisao.revisor_nome ?? 'Administrador'
        }`
      : null,
  );
  addEvent(events, request.concluida_em, 'Corrida concluída', 'green');
  addEvent(
    events,
    request.cancelado_em,
    'Solicitação cancelada',
    'red',
    request.motivo_cancelamento,
  );
  addEvent(
    events,
    context?.cancelamento?.criada_em,
    'Tratamento financeiro aberto',
    'orange',
    context?.cancelamento
      ? formatLabel(context.cancelamento.tratamento_financeiro)
      : null,
  );
  addEvent(
    events,
    context?.reembolso_manual?.realizado_em,
    'Reembolso manual registrado',
    'purple',
    context?.reembolso_manual
      ? `${formatCents(context.reembolso_manual.valor_centavos)} · ${
          context.reembolso_manual.administrador_nome ?? 'Administrador'
        }`
      : null,
  );
  addEvent(
    events,
    context?.cancelamento?.resolvida_em,
    'Tratamento financeiro resolvido',
    'green',
    context?.cancelamento?.resultado
      ? formatLabel(context.cancelamento.resultado)
      : null,
  );

  return events.sort((left, right) => {
    return new Date(left.date).getTime() - new Date(right.date).getTime();
  });
}

function PersonCard({
  title,
  person,
  profileHref,
  emptyLabel,
}: {
  title: string;
  person: ProfileSummary | null;
  profileHref?: string;
  emptyLabel: string;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 font-semibold text-zinc-800 dark:text-zinc-200">{title}</h2>
      {person ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{person.name ?? '—'}</p>
          <p className="font-mono text-xs text-zinc-500">{formatCPF(person.cpf)}</p>
          {person.telefone && (
            <p className="text-zinc-700 dark:text-zinc-300">{person.telefone}</p>
          )}
          {profileHref && (
            <Link
              href={profileHref}
              className="inline-block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver perfil
            </Link>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">{emptyLabel}</p>
      )}
    </section>
  );
}

function ReviewAudit({ review }: { review: RideReviewContext }) {
  return (
    <section className="rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-900 dark:bg-purple-950">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-200">
          <ListChecks size={18} />
          Revisão da corrida
        </h2>
        <Link
          href="/revisoes-corridas"
          className="text-xs font-semibold text-purple-700 hover:underline dark:text-purple-300"
        >
          Abrir fila
        </Link>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-purple-900 dark:text-purple-200 sm:grid-cols-2">
        <div>
          <dt className="text-xs opacity-70">Status / solicitante</dt>
          <dd className="mt-1 font-medium">
            {formatLabel(review.status)} ·{' '}
            {review.solicitante_nome ?? formatLabel(review.solicitante_papel)}
          </dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Aberta em</dt>
          <dd className="mt-1 font-medium">{formatDateTime(review.criada_em)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-purple-800 dark:text-purple-300">{review.motivo}</p>
      {review.status === 'resolvida' && (
        <div className="mt-4 border-t border-purple-200 pt-4 text-sm dark:border-purple-900">
          <p className="font-semibold">
            {formatLabel(review.decisao)} · {review.revisor_nome ?? 'Administrador'} ·{' '}
            {formatDateTime(review.resolvida_em)}
          </p>
          <p className="mt-1">{review.observacao_admin}</p>
        </div>
      )}
    </section>
  );
}

function CancellationAudit({
  cancellation,
  refund,
}: {
  cancellation: PaymentCancellationContext;
  refund: ManualRefundRecord | null;
}) {
  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-orange-900 dark:text-orange-200">
          <BadgeDollarSign size={18} />
          Tratamento financeiro
        </h2>
        <Link
          href="/cancelamentos-pagamento"
          className="text-xs font-semibold text-orange-700 hover:underline dark:text-orange-300"
        >
          Abrir fila
        </Link>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-orange-900 dark:text-orange-200 sm:grid-cols-3">
        <div>
          <dt className="text-xs opacity-70">Tratamento</dt>
          <dd className="mt-1 font-medium">
            {formatLabel(cancellation.tratamento_financeiro)}
          </dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Status / resultado</dt>
          <dd className="mt-1 font-medium">
            {formatLabel(cancellation.status)} · {formatLabel(cancellation.resultado)}
          </dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Criado / resolvido</dt>
          <dd className="mt-1 font-medium">
            {formatDateTime(cancellation.criada_em)} ·{' '}
            {formatDateTime(cancellation.resolvida_em)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-orange-800 dark:text-orange-300">
        {cancellation.motivo}
      </p>
      {refund && (
        <div className="mt-4 rounded-lg bg-white/70 p-4 text-sm text-purple-900 dark:bg-zinc-950/50 dark:text-purple-200">
          <p className="font-semibold">
            Reembolso manual: {formatCents(refund.valor_centavos)} via{' '}
            {formatLabel(refund.metodo)}
          </p>
          <p className="mt-1">
            {refund.administrador_nome ?? 'Administrador'} ·{' '}
            {formatDateTime(refund.realizado_em)}
          </p>
          <p className="mt-1 font-mono text-xs">Referência: {refund.referencia}</p>
          <p className="mt-2 text-xs">{refund.observacao}</p>
          <p className="mt-2 text-xs font-semibold">
            Status do provedor preservado no registro: {refund.status_pagamento_no_registro}
          </p>
        </div>
      )}
    </section>
  );
}

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [
    { data: requestData, error: requestError },
    { data: addressData },
    paymentResult,
    { data: payoutData },
    adminContext,
  ] = await Promise.all([
    supabase.from('solicitacoes').select('*').eq('id', id).single(),
    supabase.from('enderecos').select('*').eq('solicitacao_id', id),
    getAdminRequestPayments(supabase, id),
    supabase
      .from('repasses_motorista')
      .select('id, valor, status, pago_em, created_at, driver_profiles!motorista_id(chave_pix)')
      .eq('solicitacao_id', id)
      .maybeSingle(),
    getRequestAdminContext(supabase, id),
  ]);

  if (requestError || !requestData) {
    if (requestError) {
      console.error('Erro ao buscar solicitação:', {
        code: requestError.code,
        message: requestError.message,
        id,
      });
    }
    notFound();
  }

  const request = requestData as unknown as RequestRow;
  const addresses = (addressData ?? []) as unknown as AddressRow[];
  const payments = paymentResult.items as PaymentDetail[];
  const payout = payoutData as unknown as PayoutDetail | null;
  const profileIds = [request.usuario_id, request.motorista_id].filter(
    (value): value is string => Boolean(value),
  );
  const profiles = (await getAdminProfilesByIds(
    supabase,
    profileIds,
  )) as ProfileSummary[];
  const user = profiles.find((profile) => profile.id === request.usuario_id) ?? null;
  const driver =
    profiles.find((profile) => profile.id === request.motorista_id) ?? null;
  const timeline = buildTimeline(request, payments, adminContext);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <Link
            href="/solicitacoes"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Solicitações
          </Link>
        </div>

        <div
          className={`mb-6 rounded-xl border px-5 py-4 ${
            requestStatusColors[request.status] ?? requestStatusColors.pendente
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Status da corrida</p>
              <p className="mt-1 text-lg font-bold capitalize">
                {formatLabel(request.status)}
              </p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-mono text-xs opacity-70">{request.id}</p>
              {request.revisao_solicitada_em && (
                <p className="mt-1 font-semibold">Aguardando revisão administrativa</p>
              )}
            </div>
          </div>
          {request.motivo_cancelamento && (
            <p className="mt-3 border-t border-current/20 pt-3 text-sm">
              {request.motivo_cancelamento}
            </p>
          )}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <Route size={18} />
              Serviço
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-zinc-500">Modalidade</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {request.tipo_solicitacao === 'motorista'
                    ? 'Só motorista'
                    : 'Motorista + carro'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Data</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDate(request.data_servico)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Janela contratada</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {request.horario_inicio} – {request.horario_fim} · {request.duracao_horas}h
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Tempo real</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {request.tempo_real_minutos ?? '—'} min
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Extensão confirmada</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {request.extensao_confirmada_minutos ?? 0} min
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Limite de cobrança</dt>
                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {formatDateTime(request.limite_cobranca_em)}
                </dd>
              </div>
            </dl>
            {request.observacoes && (
              <p className="mt-5 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                {request.observacoes}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <ReceiptText size={18} />
              Composição financeira
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Taxa por hora</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(request.taxa_por_hora)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Cobrança inicial</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(request.preco_total)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 text-orange-700 dark:text-orange-400">
                <dt>Excedente ({request.tempo_excedido_minutos ?? 0} min)</dt>
                <dd className="font-semibold">
                  {formatCurrency(request.preco_tempo_excedido)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                <dt className="font-semibold text-zinc-700 dark:text-zinc-300">Total final</dt>
                <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(request.preco_final ?? request.preco_total)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Motorista recebe</dt>
                <dd className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(
                    request.preco_motorista_final ?? request.preco_motorista,
                  )}
                </dd>
              </div>
              {request.preco_chofair_bruto != null && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Chofair bruto</dt>
                    <dd>{formatCurrency(request.preco_chofair_bruto)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Imposto estimado</dt>
                    <dd>{formatCurrency(request.preco_chofair_imposto)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Chofair líquido</dt>
                    <dd className="font-semibold text-blue-700 dark:text-blue-400">
                      {formatCurrency(request.preco_chofair_liquido)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </section>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <PersonCard
            title="Cliente"
            person={user}
            profileHref={`/usuarios/${request.usuario_id}`}
            emptyLabel="Cliente não encontrado"
          />
          <PersonCard
            title="Motorista"
            person={driver}
            profileHref={
              request.motorista_id ? `/motoristas/${request.motorista_id}` : undefined
            }
            emptyLabel="Sem motorista atribuído"
          />
        </div>

        {addresses.length > 0 && (
          <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <MapPin size={18} />
              Endereços
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {formatLabel(address.tipo)}
                  </p>
                  <p>
                    {address.rua ?? 'Endereço não informado'}
                    {address.numero ? `, ${address.numero}` : ''}
                    {address.complemento ? ` — ${address.complemento}` : ''}
                  </p>
                  {address.bairro && <p>{address.bairro}</p>}
                  <p>
                    {address.cidade ?? '—'}
                    {address.estado ? ` - ${address.estado}` : ''}
                    {address.cep ? ` · CEP ${address.cep}` : ''}
                  </p>
                  {address.latitude != null && address.longitude != null && (
                    <p className="mt-2 font-mono text-xs text-zinc-400">
                      {address.latitude}, {address.longitude}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(adminContext?.revisao || adminContext?.cancelamento) && (
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {adminContext.revisao && <ReviewAudit review={adminContext.revisao} />}
            {adminContext.cancelamento && (
              <CancellationAudit
                cancellation={adminContext.cancelamento}
                refund={adminContext.reembolso_manual}
              />
            )}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <ReceiptText size={18} />
            Pagamentos do cliente
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum pagamento vinculado.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                        Pagamento {payment.tipo_pagamento}
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-400">
                        {payment.provedor === 'mercadopago'
                          ? 'Mercado Pago'
                          : payment.provedor === 'abacatepay'
                            ? 'AbacatePay (legado)'
                            : 'Sem cobrança criada'}
                        {' · '}
                        {payment.mercadopago_payment_id ??
                          payment.abacatepay_billing_id ??
                          'sem referência'}
                      </p>
                      {payment.mercadopago_environment && (
                        <p className="mt-1 text-xs text-zinc-400">
                          {payment.mercadopago_environment}
                          {payment.mercadopago_status_detail
                            ? ` · ${payment.mercadopago_status_detail}`
                            : ''}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        paymentStatusColors[payment.status] ?? paymentStatusColors.EXPIRED
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCents(payment.valor_centavos)}
                  </p>
                  <dl className="mt-4 space-y-2 text-xs text-zinc-500">
                    <div className="flex justify-between gap-3">
                      <dt>Criado</dt>
                      <dd>{formatDateTime(payment.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Pago</dt>
                      <dd>{formatDateTime(payment.pago_em)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Última conciliação</dt>
                      <dd>{formatDateTime(payment.conciliacao_verificada_em)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Tentativas / não localizado</dt>
                      <dd>
                        {payment.conciliacao_tentativas} /{' '}
                        {payment.conciliacao_nao_encontrado_tentativas}
                      </dd>
                    </div>
                    {payment.conciliacao_encerrada_em && (
                      <div className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
                        <dt className="font-semibold">
                          Conciliação interrompida em{' '}
                          {formatDateTime(payment.conciliacao_encerrada_em)}
                        </dt>
                        <dd className="mt-1">{payment.conciliacao_motivo ?? 'Sem motivo'}</dd>
                      </div>
                    )}
                  </dl>
                  <SafeExternalLink
                    href={payment.url_pagamento}
                    className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Abrir checkout
                  </SafeExternalLink>
                </article>
              ))}
            </div>
          )}
        </section>

        {payout && (
          <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
              <BadgeDollarSign size={18} />
              Repasse ao motorista
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-1 font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                  {payout.status}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Valor</dt>
                <dd className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(payout.valor)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Chave PIX</dt>
                <dd className="mt-1 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {payout.driver_profiles?.chave_pix ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Pago em</dt>
                <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                  {formatDateTime(payout.pago_em)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
            <Clock3 size={18} />
            Linha do tempo consolidada
          </h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum evento registrado.</p>
          ) : (
            <ol className="space-y-0">
              {timeline.map((event, index) => (
                <li
                  key={`${event.date}-${event.title}-${index}`}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {index < timeline.length - 1 && (
                    <span className="absolute left-[5px] top-3 h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                  )}
                  <span
                    className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                      timelineToneColors[event.tone]
                    }`}
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </p>
                    <p className="text-xs text-zinc-400">{formatDateTime(event.date)}</p>
                    {event.description && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {event.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
