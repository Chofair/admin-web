import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { getAdminVehicle } from '@/lib/admin-driver-vehicles';
import { getAdminProfilesByIds } from '@/lib/admin-profiles';
import { requireAdmin } from '@/lib/auth';
import {
  formatVehicleFieldName,
  getVehicleStatusLabel,
  getVehicleStatusStyle,
} from '@/lib/vehicle-validation';
import VehicleApprovalForm from './VehicleApprovalForm';
import VehicleRejectionForm from './VehicleRejectionForm';
import VehicleReviewForm from './VehicleReviewForm';

type ProfileSummary = {
  id: string;
  name: string | null;
  cpf: string | null;
  telefone: string | null;
};

type CategoryRow = {
  categorias_veiculo:
    | { label: string; slug: string }
    | { label: string; slug: string }[]
    | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function formatDateTime(date?: string | null) {
  return date ? new Date(date).toLocaleString('pt-BR') : '-';
}

function displayValue(value: unknown) {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function normalizeComparable(value: unknown) {
  return displayValue(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

const accessibilityLabels: Record<string, string> = {
  wheelchairAccessible: 'Acesso para cadeira de rodas',
  hasRamp: 'Rampa',
  hasLiftPlatform: 'Plataforma elevatória',
  wheelchairSecurement: 'Fixação para cadeira de rodas',
  guideDogFriendly: 'Aceita cão-guia',
  largeTrunk: 'Porta-malas amplo',
  swivelSeat: 'Banco giratório',
  bariatricAdapted: 'Adaptação bariátrica',
  boardingAssistanceSupported: 'Auxílio no embarque',
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const vehicle = await getAdminVehicle(supabase, id);
  if (!vehicle) notFound();

  const profileIds = [vehicle.motorista_id, vehicle.validado_por].filter(
    (profileId): profileId is string => Boolean(profileId)
  );
  const [profileRows, categoriesResult, signedUrlResult, minimumYearResult] = await Promise.all([
    getAdminProfilesByIds(supabase, profileIds),
    supabase
      .from('veiculo_categorias')
      .select('categorias_veiculo!veiculo_categorias_categoria_id_fkey(label, slug)')
      .eq('veiculo_id', vehicle.id),
    vehicle.crlv_path
      ? supabase.storage.from('crlv-documentos').createSignedUrl(vehicle.crlv_path, 120)
      : Promise.resolve({ data: null, error: null }),
    supabase
      .schema('configuracao')
      .from('ano_minimo_veiculo')
      .select('valor')
      .limit(1)
      .maybeSingle(),
  ]);

  if (categoriesResult.error) console.error('Erro ao buscar categorias do veículo:', categoriesResult.error);
  if (signedUrlResult.error) console.error('Erro ao gerar URL temporária do CRLV-e:', signedUrlResult.error.message);
  if (minimumYearResult.error) console.error('Erro ao buscar ano mínimo do veículo:', minimumYearResult.error);

  const profiles = new Map(
    (profileRows as ProfileSummary[]).map((profile) => [profile.id, profile])
  );
  const driver = profiles.get(vehicle.motorista_id);
  const reviewer = vehicle.validado_por ? profiles.get(vehicle.validado_por) : null;
  const categories = (categoriesResult.data ?? []).flatMap((row) => {
    const relationship = (row as unknown as CategoryRow).categorias_veiculo;
    return Array.isArray(relationship) ? relationship : relationship ? [relationship] : [];
  });
  const signedUrl = signedUrlResult.data?.signedUrl ?? null;
  const configuredMinimumYear = Number(minimumYearResult.data?.valor);
  const minimumYear = Number.isInteger(configuredMinimumYear)
    ? configuredMinimumYear
    : 1900;

  const extraction = asRecord(vehicle.dados_extraidos_crlv);
  const extractedFields = asRecord(extraction.fields);
  const pendingFields = asStringArray(vehicle.campos_pendentes);
  const mismatchFields = asStringArray(extraction.mismatch_fields);
  const comparisonRows = [
    { key: 'placa', label: 'Placa', declared: vehicle.placa, extracted: extractedFields.placa },
    { key: 'renavam', label: 'RENAVAM', declared: vehicle.renavam, extracted: extractedFields.renavam },
    { key: 'marca', label: 'Marca', declared: vehicle.marca, extracted: extractedFields.marca },
    { key: 'modelo', label: 'Modelo', declared: vehicle.modelo, extracted: extractedFields.modelo },
    { key: 'ano', label: 'Ano', declared: vehicle.ano, extracted: extractedFields.ano_modelo ?? extractedFields.ano_fabricacao },
    { key: 'cor', label: 'Cor', declared: vehicle.cor, extracted: extractedFields.cor },
    {
      key: 'capacidade_passageiros',
      label: 'Capacidade',
      declared: vehicle.capacidade_passageiros,
      extracted: extractedFields.capacidade_passageiros,
    },
  ];
  const accessibilityFeatures = Object.entries(asRecord(vehicle.accessibility_features))
    .filter(([key, value]) => key !== 'enabled' && value === true)
    .map(([key]) => accessibilityLabels[key] ?? key);
  const hasAccessibilityCategory = categories.some(
    (category) => category.slug === 'acessibilidade'
  );
  const blockingReasons = [
    minimumYearResult.error
      ? 'Não foi possível validar a configuração de ano mínimo.'
      : null,
    !vehicle.crlv_path ? 'CRLV-e não enviado.' : null,
    vehicle.crlv_path && !signedUrl ? 'O documento privado não pôde ser aberto.' : null,
    !vehicle.placa ? 'Placa não informada.' : null,
    !vehicle.renavam ? 'RENAVAM não informado.' : null,
    !vehicle.marca ? 'Marca não informada.' : null,
    !vehicle.modelo ? 'Modelo não informado.' : null,
    !vehicle.ano ? 'Ano não informado.' : null,
    vehicle.ano && vehicle.ano < minimumYear
      ? 'O ano está abaixo do mínimo permitido (' + minimumYear + ').'
      : null,
    !vehicle.cor ? 'Cor não informada.' : null,
    !vehicle.capacidade_passageiros ? 'Capacidade não informada.' : null,
    vehicle.ar_condicionado !== true ? 'Ar-condicionado não confirmado.' : null,
    categories.length === 0 ? 'Categoria não informada.' : null,
    hasAccessibilityCategory && accessibilityFeatures.length === 0
      ? 'Recursos de acessibilidade não informados.'
      : null,
    pendingFields.some(
      (field) =>
        field.endsWith('_divergente') ||
        ['placa', 'renavam', 'marca', 'modelo', 'ano', 'cor', 'capacidade_passageiros'].includes(field)
    )
      ? 'Salve a revisão manual para resolver as pendências documentais.'
      : null,
  ].filter((reason): reason is string => Boolean(reason));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <NavBar>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link href="/veiculos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Validação de veículos
        </Link>

        <div className="mt-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Veículo {vehicle.placa}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Cadastrado em {formatDateTime(vehicle.created_at)}
            </p>
          </div>
          <span className={'w-fit rounded-full px-3 py-1 text-sm font-semibold ' + getVehicleStatusStyle(vehicle.status_validacao)}>
            {getVehicleStatusLabel(vehicle.status_validacao)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">CRLV-e privado</h2>
                <p className="text-xs text-zinc-500">O acesso temporário expira em 2 minutos.</p>
              </div>
              {!vehicle.crlv_path ? (
                <p className="px-5 py-10 text-center text-sm text-zinc-500">CRLV-e não enviado.</p>
              ) : !signedUrl ? (
                <p className="px-5 py-10 text-center text-sm text-red-700 dark:text-red-400">
                  Não foi possível abrir o documento privado.
                </p>
              ) : (
                <div className="p-4">
                  {vehicle.crlv_mime_type?.startsWith('image/') ? (
                    // Signed URLs are short-lived and must bypass Next image optimization caches.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signedUrl} alt="CRLV-e do veículo" className="max-h-[620px] w-full object-contain" />
                  ) : vehicle.crlv_mime_type === 'application/pdf' ? (
                    <iframe src={signedUrl} title="CRLV-e do veículo" className="h-[620px] w-full border-0" />
                  ) : (
                    <p className="py-8 text-center text-sm text-zinc-500">Pré-visualização indisponível.</p>
                  )}
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Abrir documento <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Dados declarados e extraídos</h2>
                <p className="text-xs text-zinc-500">
                  Fonte: {extraction.source === 'mlkit_on_device' ? 'ML Kit no dispositivo' : extraction.source === 'manual_review' ? 'Revisão manual de PDF' : 'Sem extração'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800">
                      <th className="px-4 py-3 text-left text-zinc-600 dark:text-zinc-300">Campo</th>
                      <th className="px-4 py-3 text-left text-zinc-600 dark:text-zinc-300">Informado</th>
                      <th className="px-4 py-3 text-left text-zinc-600 dark:text-zinc-300">Extraído</th>
                      <th className="px-4 py-3 text-left text-zinc-600 dark:text-zinc-300">Conferência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      const divergent = mismatchFields.includes(row.key) || pendingFields.includes(row.key + '_divergente');
                      const hasExtractedValue =
                        row.extracted !== null &&
                        row.extracted !== undefined &&
                        row.extracted !== '';
                      const compatible =
                        hasExtractedValue &&
                        normalizeComparable(row.declared) === normalizeComparable(row.extracted);
                      const comparisonLabel = divergent
                        ? 'Divergente'
                        : !hasExtractedValue
                          ? 'Não extraído'
                          : compatible
                            ? 'Compatível'
                            : 'Revisar';
                      const comparisonStyle = divergent
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : compatible
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                      return (
                        <tr key={row.key} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="px-4 py-3 font-medium">{row.label}</td>
                          <td className="px-4 py-3">{displayValue(row.declared)}</td>
                          <td className="px-4 py-3">{displayValue(row.extracted)}</td>
                          <td className="px-4 py-3">
                            <span className={'rounded-full px-2 py-0.5 text-xs font-semibold ' + comparisonStyle}>
                              {comparisonLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-4">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Revisão manual</h2>
                <p className="text-xs text-zinc-500">
                  O resultado original do OCR será preservado para auditoria.
                </p>
              </div>
              <VehicleReviewForm
                key={[
                  vehicle.placa,
                  vehicle.renavam,
                  vehicle.marca,
                  vehicle.modelo,
                  vehicle.ano,
                  vehicle.cor,
                  vehicle.capacidade_passageiros,
                ].join('|')}
                vehicleId={vehicle.id}
                minimumYear={minimumYear}
                values={{
                  placa: vehicle.placa ?? '',
                  renavam: vehicle.renavam ?? '',
                  marca: vehicle.marca ?? '',
                  modelo: vehicle.modelo ?? '',
                  ano: vehicle.ano,
                  cor: vehicle.cor ?? '',
                  capacidade_passageiros: vehicle.capacidade_passageiros,
                }}
              />
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold text-zinc-800 dark:text-zinc-200">Aprovação</h2>
              <VehicleApprovalForm
                vehicleId={vehicle.id}
                alreadyApproved={vehicle.status_validacao === 'aprovado'}
                blockingReasons={blockingReasons}
              />
            </section>

            <section className="rounded-xl border border-red-200 bg-white p-5 dark:border-red-950 dark:bg-zinc-900">
              <h2 className="mb-4 font-semibold text-zinc-800 dark:text-zinc-200">Rejeição</h2>
              <VehicleRejectionForm
                vehicleId={vehicle.id}
                currentReason={vehicle.motivo_rejeicao}
              />
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">Pendências</h2>
              {pendingFields.length ? (
                <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
                  {pendingFields.map((field) => <li key={field}>• {formatVehicleFieldName(field)}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Nenhuma pendência registrada.</p>
              )}
              {vehicle.motivo_rejeicao && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
                  {vehicle.motivo_rejeicao}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">Motorista e operação</h2>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-zinc-500">Motorista</dt><dd className="font-medium">{driver?.name ?? '-'}</dd></div>
                <div><dt className="text-zinc-500">CPF</dt><dd>{driver?.cpf ?? '-'}</dd></div>
                <div><dt className="text-zinc-500">Telefone</dt><dd>{driver?.telefone ?? '-'}</dd></div>
                <div><dt className="text-zinc-500">Ar-condicionado</dt><dd>{displayValue(vehicle.ar_condicionado)}</dd></div>
                <div><dt className="text-zinc-500">Capacidade</dt><dd>{displayValue(vehicle.capacidade_passageiros)}</dd></div>
                <div><dt className="text-zinc-500">Ativo</dt><dd>{displayValue(vehicle.ativo)}</dd></div>
              </dl>
              <Link href={'/motoristas/' + vehicle.motorista_id} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Ver motorista
              </Link>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">Categorias</h2>
              <p className="text-sm">{categories.length ? categories.map((category) => category.label).join(', ') : '-'}</p>
              {accessibilityFeatures.length > 0 && (
                <>
                  <h3 className="mt-4 mb-2 text-sm font-semibold">Recursos de acessibilidade</h3>
                  <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {accessibilityFeatures.map((feature) => <li key={feature}>• {feature}</li>)}
                  </ul>
                </>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">Auditoria</h2>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-zinc-500">CRLV-e enviado em</dt><dd>{formatDateTime(vehicle.crlv_uploaded_at)}</dd></div>
                <div><dt className="text-zinc-500">Validado por</dt><dd>{reviewer?.name ?? '-'}</dd></div>
                <div><dt className="text-zinc-500">Validado em</dt><dd>{formatDateTime(vehicle.validado_em)}</dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </NavBar></div>
  );
}
