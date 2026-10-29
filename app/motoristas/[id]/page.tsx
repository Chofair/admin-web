/* eslint-disable @next/next/no-img-element -- Private documents bypass the shared image cache. */
import { requireAdmin } from '@/lib/auth';
import { getEditableDriver, resolveCnhDocument } from '@/lib/admin-driver-edit';
import { listAdminRequests } from '@/lib/admin-operations';
import NavBar from '@/components/NavBar';
import PendingSubmitButton from '@/components/PendingSubmitButton';
import Link from 'next/link';
import { aprovarMotorista, rejeitarMotorista, suspenderMotorista, reativarMotorista } from './actions';
import { getVehicleStatusLabel, getVehicleStatusStyle } from '@/lib/vehicle-validation';
import DriverEditForm from './DriverEditForm';
import CnhReplacementForm from './CnhReplacementForm';
import DriverChangeHistory from './DriverChangeHistory';
import DriverLoginEmailForm from './DriverLoginEmailForm';
import { formatAdminDate as formatDate } from '@/lib/admin-format';

function formatCPF(cpf?: string | null) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatCEP(cep?: string | null) {
  if (!cep) return '—';
  const c = cep.replace(/\D/g, '');
  if (c.length !== 8) return cep;
  return `${c.slice(0, 5)}-${c.slice(5)}`;
}

function formatLogradouro(
  logradouro?: string | null,
  numero?: string | null,
  complemento?: string | null,
) {
  const base = [logradouro, numero].filter(Boolean).join(', ');
  if (!base) return '—';
  return complemento ? `${base} — ${complemento}` : base;
}

function formatCurrency(val?: number | null) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  rejeitado: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  suspenso: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
};

const solicitacaoStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  confirmada: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  finalizada: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  concluida: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelada: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export default async function MotoristaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { id } = await params;
  const { msg } = await searchParams;
  const { supabase } = await requireAdmin();

  const [driverDetail, requestsResult] = await Promise.all([
    getEditableDriver(supabase, id),
    listAdminRequests(supabase, { driverId: id, limit: 10 }),
  ]);
  const corridas = requestsResult.items;
  const profile = driverDetail?.profile ?? null;
  const motorista = driverDetail?.motorista ?? null;
  const veiculos = driverDetail?.veiculos ?? [];
  const documentos = driverDetail?.documentos ?? [];

  if (!motorista) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <NavBar>
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-zinc-500 dark:text-zinc-400">Motorista não encontrado.</p>
          <Link href="/motoristas" className="text-blue-600 hover:underline mt-4 inline-block dark:text-blue-400">
            Voltar
          </Link>
        </main>
      </NavBar></div>
    );
  }

  const cidadeEstado = [profile?.cidade, profile?.estado].filter(Boolean).join(' / ') || '—';

  const statusAtual = motorista.status_motorista ?? 'pendente';
  const cnhDocument = await resolveCnhDocument(supabase, driverDetail?.editable ?? {});
  const totalGanhos = corridas?.reduce((acc, c) => acc + (c.preco_motorista ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/motoristas" className="text-zinc-500 hover:text-zinc-900 text-sm dark:text-zinc-400 dark:hover:text-zinc-100">
            ← Motoristas
          </Link>
        </div>

        {msg === 'aprovado' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium dark:bg-green-950 dark:border-green-900 dark:text-green-300">
            Motorista aprovado com sucesso.
          </div>
        )}
        {msg === 'rejeitado' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium dark:bg-red-950 dark:border-red-900 dark:text-red-300">
            Motorista rejeitado.
          </div>
        )}
        {msg === 'suspenso' && (
          <div className="mb-4 bg-zinc-50 border border-zinc-200 text-zinc-800 px-4 py-3 rounded-lg text-sm font-medium dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-200">
            Motorista suspenso.
          </div>
        )}
        {msg === 'reativado' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium dark:bg-green-950 dark:border-green-900 dark:text-green-300">
            Motorista reativado.
          </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6 dark:bg-zinc-900 dark:border-zinc-700">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 break-words">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{profile?.name ?? '—'}</h1>
              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  statusColors[statusAtual]
                }`}
              >
                {statusAtual.charAt(0).toUpperCase() + statusAtual.slice(1)}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2 sm:justify-end">
              {statusAtual === 'pendente' && (
                <form
                  action={async () => {
                    'use server';
                    await aprovarMotorista(id);
                  }}
                >
                  <PendingSubmitButton
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Aprovar
                  </PendingSubmitButton>
                </form>
              )}
              {(statusAtual === 'pendente' || statusAtual === 'aprovado') && (
                <form action={rejeitarMotorista} className="flex min-w-0 flex-wrap items-center gap-2">
                  <input type="hidden" name="motorista_id" value={id} />
                  <input
                    type="text"
                    name="motivo"
                    placeholder="Motivo da rejeição"
                    required
                    className="min-w-0 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-zinc-600 dark:bg-zinc-950 sm:w-auto"
                  />
                  <PendingSubmitButton
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Rejeitar
                  </PendingSubmitButton>
                </form>
              )}
              {statusAtual === 'aprovado' && (
                <form
                  action={async () => {
                    'use server';
                    await suspenderMotorista(id);
                  }}
                >
                  <PendingSubmitButton
                    type="submit"
                    className="px-4 py-2 bg-zinc-600 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Suspender
                  </PendingSubmitButton>
                </form>
              )}
              {statusAtual === 'suspenso' && (
                <form
                  action={async () => {
                    'use server';
                    await reativarMotorista(id);
                  }}
                >
                  <PendingSubmitButton
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Reativar
                  </PendingSubmitButton>
                </form>
              )}
            </div>
          </div>

          {motorista.motivo_rejeicao && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm dark:bg-red-950 dark:border-red-900 dark:text-red-300">
              Motivo da rejeição: {motorista.motivo_rejeicao}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 break-words text-sm">
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">CPF</p>
              <p className="font-mono text-zinc-900 dark:text-zinc-100">{formatCPF(profile?.cpf)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Telefone</p>
              <p className="text-zinc-900 dark:text-zinc-100">{profile?.telefone ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Nascimento</p>
              <p className="text-zinc-900 dark:text-zinc-100">{formatDate(profile?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Cidade / UF</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cidadeEstado}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Bairro</p>
              <p className="text-zinc-900 dark:text-zinc-100">{profile?.bairro ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Logradouro</p>
              <p className="text-zinc-900 dark:text-zinc-100">
                {formatLogradouro(profile?.logradouro, profile?.numero, profile?.complemento)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">CEP</p>
              <p className="font-mono text-zinc-900 dark:text-zinc-100">{formatCEP(profile?.cep)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">CNH Número</p>
              <p className="text-zinc-900 dark:text-zinc-100">{motorista.cnh_numero ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">CNH Validade</p>
              <p className="text-zinc-900 dark:text-zinc-100">{formatDate(motorista.cnh_validade)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">CNH Categoria</p>
              <p className="text-zinc-900 dark:text-zinc-100">{motorista.cnh_categoria ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Chave PIX</p>
              <p className="font-mono text-zinc-900 dark:text-zinc-100">{motorista.chave_pix ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Cadastro</p>
              <p className="text-zinc-900 dark:text-zinc-100">{formatDate(profile?.created_at)}</p>
            </div>
            {motorista.data_aprovacao && (
              <div>
                <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Aprovado em</p>
                <p className="text-zinc-900 dark:text-zinc-100">{formatDate(motorista.data_aprovacao)}</p>
              </div>
            )}
            <div>
              <p className="text-zinc-500 font-medium mb-0.5 dark:text-zinc-400">Total ganhos</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalGanhos)}</p>
            </div>
          </div>
        </div>

        {driverDetail && !profile?.deleted_at && <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"><h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Correção do cadastro</h3><DriverEditForm driverId={id} revision={driverDetail.revision} values={driverDetail.editable} /><DriverLoginEmailForm driverId={id} revision={driverDetail.revision} email={driverDetail.login_email} editable={driverDetail.login_email_editable} /></div>}

        {/* Documents */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto mb-6 dark:bg-zinc-900 dark:border-zinc-700">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
              Documentos ({(documentos?.length ?? 0) + (motorista.cnh_foto_url ? 1 : 0)})
            </h3>
          </div>
          {driverDetail && !profile?.deleted_at && <div className="px-5 pb-5"><CnhReplacementForm driverId={id} revision={driverDetail.revision} values={driverDetail.editable} /></div>}
          {!motorista.cnh_foto_url && (!documentos || documentos.length === 0) ? (
            <p className="px-6 py-8 text-center text-zinc-500 text-sm dark:text-zinc-400">Nenhum documento enviado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Upload</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Pré-visualização</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {motorista.cnh_foto_url && (
                  <tr className="border-b border-zinc-50 dark:border-zinc-800">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">CNH</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">Documento da CNH</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[motorista.status_motorista ?? 'pendente']
                        }`}
                      >
                        {motorista.status_motorista ?? 'pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">—</td>
                    <td className="px-4 py-3">
                      {cnhDocument.url ? <a href={cnhDocument.url} target="_blank" rel="noopener noreferrer">
                        {cnhDocument.mime === 'application/pdf' ? <span className="inline-flex h-14 w-20 items-center justify-center rounded border border-zinc-200 text-xs font-semibold dark:border-zinc-700">PDF</span> :
                        <img
                          src={cnhDocument.url}
                          alt="Documento da CNH"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-14 w-20 object-cover rounded border border-zinc-200 dark:border-zinc-700"
                        />}
                      </a> : <span className="text-xs text-zinc-500 dark:text-zinc-400">Prévia indisponível</span>}
                    </td>
                    <td className="px-4 py-3 space-x-3">
                      <a
                        href={`/api/admin/motoristas/${id}/cnh`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Ver
                      </a>
                      <a
                        href={`/api/admin/motoristas/${id}/cnh`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Baixar
                      </a>
                    </td>
                  </tr>
                )}
                {documentos?.map((d) => (
                  <tr key={d.id} className="border-b border-zinc-50 dark:border-zinc-800">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{d.tipo_documento}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{d.nome_documento}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.status_verificacao === 'aprovado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : d.status_verificacao === 'rejeitado'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
                        }`}
                      >
                        {d.status_verificacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatDate(d.data_upload)}</td>
                    <td className="px-4 py-3">
                      {d.arquivo_url && (
                        <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={d.arquivo_url}
                            alt={d.nome_documento}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-20 object-cover rounded border border-zinc-200 dark:border-zinc-700"
                          />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-3">
                      {d.arquivo_url && (
                        <>
                          <a
                            href={d.arquivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Ver
                          </a>
                          <a href={d.arquivo_url} download className="text-blue-600 hover:underline dark:text-blue-400">
                            Baixar
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Vehicles */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto mb-6 dark:bg-zinc-900 dark:border-zinc-700">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Veículos ({veiculos?.length ?? 0})</h3>
          </div>
          {!veiculos || veiculos.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-500 text-sm dark:text-zinc-400">Nenhum veículo cadastrado</p>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Placa</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Modelo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Ano</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Cor</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Ação</th>
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-50 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">{v.placa}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {v.marca} {v.modelo}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{v.ano}</td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{v.cor}</td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' + getVehicleStatusStyle(v.status_validacao)}>
                        {getVehicleStatusLabel(v.status_validacao)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={'/veiculos/' + v.id} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent rides */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto dark:bg-zinc-900 dark:border-zinc-700">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
              Corridas Recentes ({corridas?.length ?? 0})
            </h3>
          </div>
          {!corridas || corridas.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-500 text-sm dark:text-zinc-400">Nenhuma corrida realizada</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Ganho</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {corridas.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-50 dark:border-zinc-800">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {c.tipo_solicitacao === 'motorista' ? 'Só Motorista' : 'Motorista + Carro'}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{formatDate(c.data_servico)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          solicitacaoStatusColors[c.status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(c.preco_motorista)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${c.id}`}
                        className="text-blue-600 hover:underline font-medium dark:text-blue-400"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {driverDetail && <DriverChangeHistory driverId={id} history={driverDetail.history} />}
      </main>
    </NavBar></div>
  );
}
