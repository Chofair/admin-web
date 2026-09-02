import { requireAdmin } from '@/lib/auth';
import { getAdminProfile } from '@/lib/admin-profiles';
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import { aprovarMotorista, rejeitarMotorista, suspenderMotorista, reativarMotorista } from './actions';
import { getVehicleStatusLabel, getVehicleStatusStyle } from '@/lib/vehicle-validation';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCPF(cpf?: string | null) {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

function formatCurrency(val?: number) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
  suspenso: 'bg-zinc-200 text-zinc-700',
};

const solicitacaoStatusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  finalizada: 'bg-orange-100 text-orange-800',
  concluida: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
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

  const [{ data: motorista }, profile, { data: veiculos }, { data: documentos }, { data: corridas }] =
    await Promise.all([
      supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', id)
        .single(),
      getAdminProfile(supabase, id),
      supabase
        .from('veiculos')
        .select('id, placa, marca, modelo, ano, cor, status_validacao')
        .eq('motorista_id', id)
        .eq('ativo', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('documentos_motorista')
        .select('*')
        .eq('motorista_id', id)
        .order('data_upload', { ascending: false }),
      supabase
        .from('solicitacoes')
        .select('id, tipo_solicitacao, data_servico, horario_inicio, status, preco_motorista, created_at')
        .eq('motorista_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  if (!motorista) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-zinc-500">Motorista não encontrado.</p>
          <Link href="/motoristas" className="text-blue-600 hover:underline mt-4 inline-block">
            Voltar
          </Link>
        </main>
      </div>
    );
  }

  const statusAtual = motorista.status_motorista ?? 'pendente';
  const totalGanhos = corridas?.reduce((acc, c) => acc + (c.preco_motorista ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/motoristas" className="text-zinc-500 hover:text-zinc-900 text-sm">
            ← Motoristas
          </Link>
        </div>

        {msg === 'aprovado' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
            Motorista aprovado com sucesso.
          </div>
        )}
        {msg === 'rejeitado' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
            Motorista rejeitado.
          </div>
        )}
        {msg === 'suspenso' && (
          <div className="mb-4 bg-zinc-50 border border-zinc-200 text-zinc-800 px-4 py-3 rounded-lg text-sm font-medium">
            Motorista suspenso.
          </div>
        )}
        {msg === 'reativado' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
            Motorista reativado.
          </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{profile?.name ?? '—'}</h2>
              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  statusColors[statusAtual]
                }`}
              >
                {statusAtual.charAt(0).toUpperCase() + statusAtual.slice(1)}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {statusAtual === 'pendente' && (
                <form
                  action={async () => {
                    'use server';
                    await aprovarMotorista(id);
                  }}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Aprovar
                  </button>
                </form>
              )}
              {(statusAtual === 'pendente' || statusAtual === 'aprovado') && (
                <form action={rejeitarMotorista} className="flex gap-2 items-center">
                  <input type="hidden" name="motorista_id" value={id} />
                  <input
                    type="text"
                    name="motivo"
                    placeholder="Motivo da rejeição"
                    required
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Rejeitar
                  </button>
                </form>
              )}
              {statusAtual === 'aprovado' && (
                <form
                  action={async () => {
                    'use server';
                    await suspenderMotorista(id);
                  }}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-600 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Suspender
                  </button>
                </form>
              )}
              {statusAtual === 'suspenso' && (
                <form
                  action={async () => {
                    'use server';
                    await reativarMotorista(id);
                  }}
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Reativar
                  </button>
                </form>
              )}
            </div>
          </div>

          {motorista.motivo_rejeicao && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
              Motivo da rejeição: {motorista.motivo_rejeicao}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">CPF</p>
              <p className="font-mono text-zinc-900">{formatCPF(profile?.cpf)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Telefone</p>
              <p className="text-zinc-900">{profile?.telefone ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Nascimento</p>
              <p className="text-zinc-900">{formatDate(profile?.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">CNH Número</p>
              <p className="text-zinc-900">{motorista.cnh_numero ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">CNH Validade</p>
              <p className="text-zinc-900">{formatDate(motorista.cnh_validade)}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">CNH Categoria</p>
              <p className="text-zinc-900">{motorista.cnh_categoria ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Chave PIX</p>
              <p className="font-mono text-zinc-900">{motorista.chave_pix ?? '—'}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Cadastro</p>
              <p className="text-zinc-900">{formatDate(profile?.created_at)}</p>
            </div>
            {motorista.data_aprovacao && (
              <div>
                <p className="text-zinc-500 font-medium mb-0.5">Aprovado em</p>
                <p className="text-zinc-900">{formatDate(motorista.data_aprovacao)}</p>
              </div>
            )}
            <div>
              <p className="text-zinc-500 font-medium mb-0.5">Total ganhos</p>
              <p className="font-semibold text-emerald-700">{formatCurrency(totalGanhos)}</p>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto mb-6">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-800">Veículos ({veiculos?.length ?? 0})</h3>
          </div>
          {!veiculos || veiculos.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-400 text-sm">Nenhum veículo cadastrado</p>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Placa</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Modelo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Ano</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Cor</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Ação</th>
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-50">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-900">{v.placa}</td>
                    <td className="px-4 py-3 text-zinc-900">
                      {v.marca} {v.modelo}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">{v.ano}</td>
                    <td className="px-4 py-3 text-zinc-900">{v.cor}</td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' + getVehicleStatusStyle(v.status_validacao)}>
                        {getVehicleStatusLabel(v.status_validacao)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={'/veiculos/' + v.id} className="font-medium text-blue-600 hover:underline">
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-800">
              Documentos ({(documentos?.length ?? 0) + (motorista.cnh_foto_url ? 1 : 0)})
            </h3>
          </div>
          {!motorista.cnh_foto_url && (!documentos || documentos.length === 0) ? (
            <p className="px-6 py-8 text-center text-zinc-400 text-sm">Nenhum documento enviado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Upload</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Pré-visualização</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {motorista.cnh_foto_url && (
                  <tr className="border-b border-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">CNH</td>
                    <td className="px-4 py-3 text-zinc-900">Foto da CNH</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[motorista.status_motorista ?? 'pendente']
                        }`}
                      >
                        {motorista.status_motorista ?? 'pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-900">—</td>
                    <td className="px-4 py-3">
                      <a href={motorista.cnh_foto_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={motorista.cnh_foto_url}
                          alt="Foto da CNH"
                          className="h-14 w-20 object-cover rounded border border-zinc-200"
                        />
                      </a>
                    </td>
                    <td className="px-4 py-3 space-x-3">
                      <a
                        href={motorista.cnh_foto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Ver
                      </a>
                      <a
                        href={motorista.cnh_foto_url}
                        download
                        className="text-blue-600 hover:underline"
                      >
                        Baixar
                      </a>
                    </td>
                  </tr>
                )}
                {documentos?.map((d) => (
                  <tr key={d.id} className="border-b border-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">{d.tipo_documento}</td>
                    <td className="px-4 py-3 text-zinc-900">{d.nome_documento}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.status_verificacao === 'aprovado'
                            ? 'bg-green-100 text-green-800'
                            : d.status_verificacao === 'rejeitado'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {d.status_verificacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-900">{formatDate(d.data_upload)}</td>
                    <td className="px-4 py-3">
                      {d.arquivo_url && (
                        <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={d.arquivo_url}
                            alt={d.nome_documento}
                            className="h-14 w-20 object-cover rounded border border-zinc-200"
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
                            className="text-blue-600 hover:underline"
                          >
                            Ver
                          </a>
                          <a href={d.arquivo_url} download className="text-blue-600 hover:underline">
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

        {/* Recent rides */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-800">
              Corridas Recentes ({corridas?.length ?? 0})
            </h3>
          </div>
          {!corridas || corridas.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-400 text-sm">Nenhuma corrida realizada</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Ganho</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {corridas.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-50">
                    <td className="px-4 py-3 text-zinc-900">
                      {c.tipo_solicitacao === 'motorista' ? 'Só Motorista' : 'Motorista + Carro'}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">{formatDate(c.data_servico)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          solicitacaoStatusColors[c.status] ?? 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatCurrency(c.preco_motorista)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/solicitacoes/${c.id}`}
                        className="text-blue-600 hover:underline font-medium"
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
      </main>
    </div>
  );
}
