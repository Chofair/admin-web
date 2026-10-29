'use client';

/* Private documents are displayed directly, without the shared image optimization cache. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CNH_MAX_BYTES, CNH_MIME_EXTENSIONS, validDocumentSignature } from '@/lib/driver-edit-validation';
import { discardCnhUpload, finishCnhUpload, prepareCnhUpload, type DriverEditState } from './edit-actions';
import { driverAccordionSummaryClass, driverInputClass } from './DriverEditForm';

export default function CnhReplacementForm({ driverId, revision, values }: { driverId: string; revision: string; values: Record<string, unknown> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<DriverEditState>({ status: 'idle', message: '' });
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState('');
  const selection = useRef(0);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function chooseFile(selected: File | undefined) {
    const current = ++selection.current;
    setFile(null); setPreview(null); setState({ status: 'idle', message: '' });
    if (!selected) return;
    const valid = Object.hasOwn(CNH_MIME_EXTENSIONS, selected.type) && selected.size > 0 && selected.size <= CNH_MAX_BYTES && validDocumentSignature(new Uint8Array(await selected.slice(0, 16).arrayBuffer()), selected.type);
    if (current !== selection.current) return;
    if (!valid) {
      setState({ status: 'error', message: 'Selecione um PDF, JPG ou PNG válido, de até 10 MB.' });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected); setPreview(URL.createObjectURL(selected));
  }

  function submit(form: FormData) {
    startTransition(async () => {
      if (!file) { setState({ status: 'error', message: 'Selecione o novo documento da CNH.' }); return; }
      let path: string | undefined;
      try {
        setStep('Preparando envio…'); setState({ status: 'idle', message: '' });
        const upload = await prepareCnhUpload(driverId, file.type, file.size);
        if (upload.error || !upload.path || !upload.token) throw new Error(upload.error ?? 'Não foi possível preparar o envio.');
        path = upload.path;
        setStep('Enviando documento…');
        const { error } = await supabase.storage.from('cnh-documentos').uploadToSignedUrl(path, upload.token, file, { contentType: file.type, cacheControl: '0' });
        if (error) throw new Error('Falha no envio. O documento atual foi mantido. Tente novamente.');
        setStep('Validando e salvando…');
        const result = await finishCnhUpload(driverId, revision, path, file.type, {
          cnh_numero: String(form.get('cnh_numero') ?? ''), cnh_validade: String(form.get('cnh_validade') ?? ''), cnh_categoria: String(form.get('cnh_categoria') ?? ''),
        }, String(form.get('reason') ?? ''), form.get('confirmed') === 'on');
        setState(result);
        if (result.status === 'success') { setFile(null); setPreview(null); formRef.current?.reset(); }
      } catch (error) {
        if (path) await discardCnhUpload(driverId, path).catch(() => {});
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível substituir a CNH. O documento atual foi mantido.' });
      } finally { setStep(''); }
    });
  }

  return (
    <details className="group mt-5 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <summary className={driverAccordionSummaryClass}><FileUp size={18} aria-hidden="true" />Substituir CNH</summary>
      <form key={revision} ref={formRef} action={submit} className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-700 sm:p-5" aria-busy={pending}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Confira o novo arquivo e os dados abaixo. A troca mantém o status atual do motorista e registra a versão anterior no histórico.</p>
        <fieldset disabled={pending} className="space-y-4">
          <label className="block space-y-2 text-sm text-zinc-700 dark:text-zinc-300"><span>Novo documento — PDF, JPG ou PNG, até 10 MB</span><input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" required onChange={(event) => void chooseFile(event.target.files?.[0])} className={driverInputClass} /></label>
          {file && preview && <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950"><p className="mb-2 break-all text-sm font-medium">Prévia: {file.name}</p>{file.type === 'application/pdf' ? <iframe src={preview} title="Prévia da nova CNH" className="h-80 w-full rounded border-0" /> : <img src={preview} alt="Prévia da nova CNH" className="max-h-80 w-full object-contain" />}</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm"><span>Número da CNH</span><input name="cnh_numero" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} required defaultValue={String(values.cnh_numero ?? '')} className={driverInputClass} /></label>
            <label className="space-y-1 text-sm"><span>Validade</span><input name="cnh_validade" type="date" required defaultValue={String(values.cnh_validade ?? '')} className={driverInputClass} /></label>
            <div className="space-y-1 text-sm"><label htmlFor="replacement-cnh-category">Categoria</label><select id="replacement-cnh-category" name="cnh_categoria" required defaultValue={String(values.cnh_categoria ?? '')} className={driverInputClass}><option value="">Selecione</option>{['A','B','AB','C','D','E','AC','AD','AE','ACC'].map((category) => <option key={category}>{category}</option>)}</select></div>
          </div>
          <label className="block space-y-1 text-sm"><span>Motivo da substituição</span><textarea name="reason" minLength={10} maxLength={500} required rows={3} className={driverInputClass} placeholder="Ex.: renovação da CNH vencida, conferida pela operação." /></label>
          <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"><input type="checkbox" name="confirmed" required className="mt-1 h-4 w-4" />Conferi o documento, a identidade do motorista, a categoria e a validade.</label>
          <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending || !file} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{pending ? step : 'Confirmar substituição'}</button><button type="button" disabled={pending} onClick={() => { ++selection.current; setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; }} className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">Limpar seleção</button></div>
        </fieldset>
        {pending && step && <p role="status" className="text-sm text-blue-700 dark:text-blue-300">{step}</p>}
        {state.message && <p role={state.status === 'error' ? 'alert' : 'status'} className={'text-sm ' + (state.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400')}>{state.message}</p>}
        <button type="button" disabled={pending} onClick={() => router.refresh()} className="inline-flex min-h-11 items-center gap-2 text-sm text-blue-700 dark:text-blue-300"><RefreshCw size={15} aria-hidden="true" />Recarregar dados e documento atual</button>
      </form>
    </details>
  );
}
