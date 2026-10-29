/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavBar from '@/components/NavBar';
import AuditEventAccordion from '@/components/AuditEventAccordion';
import { getAccessibilityDetail, signAccessibilityEvidence } from '@/lib/admin-accessibility';
import { requireAdmin } from '@/lib/auth';
import ReviewForm from './ReviewForm';
import { resolveCnhDocument } from '@/lib/admin-driver-edit';

const trainingLabels: Record<string, string> = { pcdService: 'Atendimento a PCD', wheelchairBoarding: 'Embarque em cadeira de rodas', visualImpairmentService: 'Deficiência visual', hearingImpairmentService: 'Deficiência auditiva' };
const featureLabels: Record<string, string> = { wheelchairAccessible: 'Veículo adaptado', hasRamp: 'Rampa', hasLiftPlatform: 'Plataforma elevatória', wheelchairSecurement: 'Fixação da cadeira', guideDogFriendly: 'Espaço para cão-guia', largeTrunk: 'Porta-malas ampliado', swivelSeat: 'Banco giratório', bariatricAdapted: 'Adaptação bariátrica', boardingAssistanceSupported: 'Auxílio no embarque' };
function text(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value); }
function date(value: unknown) { return typeof value === 'string' ? new Date(value).toLocaleString('pt-BR') : '-'; }
function enabled(value: unknown, labels: Record<string, string>) { const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}; return Object.entries(record).filter(([key, active]) => key !== 'enabled' && active === true).map(([key]) => labels[key] ?? key); }

export default async function AccessibilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const detail = await getAccessibilityDetail(supabase, id);
  if (!detail) notFound();
  const evidence = await signAccessibilityEvidence(supabase, detail);
  const driver = detail.driver;
  const application = detail.driver_application;
  const cnh = await resolveCnhDocument(supabase, driver);
  const cnhUrl = cnh.url;
  const status = String(application.status);
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><NavBar><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Link href="/acessibilidade" className="text-sm text-zinc-500 hover:text-zinc-900">← Fila de acessibilidade</Link>
    <div className="my-5"><h1 className="text-2xl font-bold">{text(driver.name)}</h1><p className="text-sm text-zinc-500">CPF {text(driver.cpf)} · CNH {text(driver.cnh_numero)} · validade {text(driver.cnh_validade)}</p></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]"><div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold">Perfil do motorista</h2><p className="text-xs text-zinc-500">Envio {date(application.submitted_at)} · versão {text(application.submission_version)}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold dark:bg-zinc-800">{status}</span></div>
        <ul className="mb-4 space-y-1 text-sm">{enabled(application.declared_training, trainingLabels).map((item) => <li key={item}>• {item}</li>)}</ul>
        <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">EAR observado na última análise: {application.ear_observed ? 'sim' : 'não ou ainda não conferido'}. Este dado é informativo e não impede aprovação.</p>
        <h3 className="mb-2 text-sm font-semibold">CNH atual do motorista</h3>
        {cnhUrl ? <a href={`/api/admin/motoristas/${id}/cnh`} target="_blank" rel="noreferrer" className="block rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">{cnh.mime === 'application/pdf' ? <span className="flex h-32 items-center justify-center text-sm font-semibold">Documento PDF</span> : <img src={cnhUrl} alt="CNH do motorista" className="h-64 w-full object-contain" />}<span className="mt-2 block text-center text-sm text-blue-700 dark:text-blue-300">Abrir CNH</span></a> : <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">A CNH não está disponível. O perfil não deve ser aprovado até a correção.</p>}
        <Link href={`/motoristas/${id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-blue-700 underline dark:text-blue-300">Corrigir cadastro ou substituir CNH</Link>
      </section>
      {detail.vehicles.map((vehicle) => {
        const vehicleEvidence = evidence.filter((item) => item.vehicle_application_id === vehicle.id && item.submission_version === vehicle.submission_version);
        const vehicleStatus = String(vehicle.status);
        return <section key={String(vehicle.id)} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-semibold">{text(vehicle.make)} {text(vehicle.model)} · {text(vehicle.plate)}</h2><p className="text-xs text-zinc-500">Cadastro geral: {text(vehicle.generic_status)} · envio v{text(vehicle.submission_version)}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold dark:bg-zinc-800">{vehicleStatus}</span></div>
          <p className={`mb-3 rounded-lg p-3 text-sm ${vehicle.declared_plate === vehicle.plate ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>Placa declarada: {text(vehicle.declared_plate)} · placa atual: {text(vehicle.plate)}</p>
          <ul className="mb-4 space-y-1 text-sm">{enabled(vehicle.declared_features, featureLabels).map((item) => <li key={item}>• {item}</li>)}</ul>
          <div className="grid gap-3 sm:grid-cols-2">{vehicleEvidence.map((item) => item.signedUrl ? <a key={item.storage_path} href={item.signedUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 p-2"><img src={item.signedUrl} alt={item.evidence_type === 'vehicle_plate' ? 'Placa do veículo' : 'Adaptação do veículo'} className="h-56 w-full object-contain" /><span className="mt-2 block text-center text-xs text-blue-600">{item.evidence_type === 'vehicle_plate' ? 'Placa' : 'Adaptação'} · abrir</span></a> : <p key={item.storage_path} className="text-sm text-red-600">Evidência indisponível</p>)}</div>
          {(vehicleStatus === 'pending' || vehicleStatus === 'approved') && <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-700"><ReviewForm kind="vehicle" applicationId={String(vehicle.id)} driverId={id} currentStatus={vehicleStatus} /></div>}
        </section>;
      })}
    </div><aside className="space-y-6">
      {(status === 'pending' || status === 'approved') && <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"><h2 className="mb-4 font-semibold">Decisão do perfil</h2><ReviewForm kind="driver" applicationId={String(application.id)} driverId={id} currentStatus={status} /></section>}
      {application.rejection_reason ? <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"><h2 className="mb-2 font-semibold">Motivo atual</h2>{text(application.rejection_reason)}</section> : null}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 font-semibold">Auditoria</h2>
        {!detail.events.length ? <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum evento registrado.</p> : <ol className="space-y-3">{detail.events.map((event, index) => <li key={String(event.id ?? index)}>
          <AuditEventAccordion title={text(event.event_type).replaceAll('_', ' ')} metadata={<>{date(event.created_at)} · {text(event.actor_role)}</>}>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div><dt className="text-xs text-zinc-600 dark:text-zinc-400">Antes</dt><dd className="mt-1 font-medium">{text(event.previous_status)}</dd></div>
              <div><dt className="text-xs text-zinc-600 dark:text-zinc-400">Depois</dt><dd className="mt-1 font-medium">{text(event.new_status)}</dd></div>
            </dl>
            {event.reason ? <p className="whitespace-pre-wrap">{text(event.reason)}</p> : null}
          </AuditEventAccordion>
        </li>)}</ol>}
      </section>
    </aside></div>
  </main></NavBar></div>;
}
