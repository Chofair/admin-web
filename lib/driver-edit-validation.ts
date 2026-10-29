export const DRIVER_EDIT_FIELDS = [
  { key: 'name', label: 'Nome completo', group: 'Dados pessoais', type: 'text', max: 120 },
  { key: 'cpf', label: 'CPF', group: 'Dados pessoais', type: 'text', max: 14 },
  { key: 'telefone', label: 'Telefone', group: 'Dados pessoais', type: 'tel', max: 18 },
  { key: 'data_nascimento', label: 'Data de nascimento', group: 'Dados pessoais', type: 'date', max: 10 },
  { key: 'cep', label: 'CEP', group: 'Endereço', type: 'text', max: 9 },
  { key: 'logradouro', label: 'Logradouro', group: 'Endereço', type: 'text', max: 200 },
  { key: 'numero', label: 'Número', group: 'Endereço', type: 'text', max: 30 },
  { key: 'complemento', label: 'Complemento', group: 'Endereço', type: 'text', max: 100 },
  { key: 'bairro', label: 'Bairro', group: 'Endereço', type: 'text', max: 100 },
  { key: 'cidade', label: 'Cidade', group: 'Endereço', type: 'text', max: 100 },
  { key: 'estado', label: 'UF', group: 'Endereço', type: 'text', max: 2 },
  { key: 'chave_pix', label: 'Chave Pix', group: 'Dados profissionais', type: 'text', max: 140 },
] as const;

export const CNH_EDIT_FIELDS = [
  { key: 'cnh_numero', label: 'Número da CNH', max: 11 },
  { key: 'cnh_validade', label: 'Validade da CNH', max: 10 },
  { key: 'cnh_categoria', label: 'Categoria da CNH', max: 3 },
] as const;

// Retain readable labels for changes recorded before the form was simplified.
export const DRIVER_CHANGE_LABELS: Record<string, string> = {
  ...Object.fromEntries([...DRIVER_EDIT_FIELDS, ...CNH_EDIT_FIELDS].map(({ key, label }) => [key, label])),
  email: 'E-mail', foto_perfil_url: 'Foto do perfil',
  cnh_storage_path: 'Arquivo da CNH', accessibility_training: 'Treinamentos declarados', login_email: 'E-mail de acesso',
};

export function getVisibleDriverChanges(changes: Record<string, { before: unknown; after: unknown }>) {
  return Object.entries(changes).filter(([key]) =>
    !['cnh_foto_url', 'cnh_mime_type'].includes(key) && (key !== 'email' || !Object.hasOwn(changes, 'login_email'))
  );
}

export const TRAINING_LABELS: Record<string, string> = {
  pcdService: 'Atendimento a PCD', wheelchairBoarding: 'Embarque em cadeira de rodas',
  visualImpairmentService: 'Deficiência visual', hearingImpairmentService: 'Deficiência auditiva',
};
export const CNH_MAX_BYTES = 10 * 1024 * 1024;
export const CNH_MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png',
};
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeEditableValue(key: string, value: unknown) {
  let text = String(value ?? '').trim();
  if (['cpf', 'telefone', 'cep', 'cnh_numero'].includes(key)) text = text.replace(/\D/g, '');
  if (key === 'estado' || key === 'cnh_categoria') text = text.toUpperCase();
  return text;
}

export function getDriverFormChanges(form: FormData, values: Record<string, unknown>) {
  const changes: Record<string, unknown> = {};
  for (const { key } of DRIVER_EDIT_FIELDS) {
    const value = normalizeEditableValue(key, form.get(key));
    if (value !== normalizeEditableValue(key, values[key])) changes[key] = value || null;
  }
  const previous = (values.accessibility_training ?? {}) as Record<string, unknown>;
  const training = Object.fromEntries(Object.keys(TRAINING_LABELS).map((key) => [key, form.get('training_' + key) === 'on']));
  if (Object.entries(training).some(([key, value]) => value !== (previous[key] === true))) changes.accessibility_training = training;
  return changes;
}

export function hasLoginEmailChange(value: string, current: string | null) {
  const next = value.trim().toLowerCase();
  return next.length > 0 && next !== (current ?? '').trim().toLowerCase();
}

export function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(value[i]) * (length + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(value[length])) return false;
  }
  return true;
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
}

function todayInBrazil() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export function validateDriverChanges(input: unknown, today = todayInBrazil()) {
  return validateFields(input, DRIVER_EDIT_FIELDS, true, today);
}

export function validateCnhChanges(input: unknown, today = todayInBrazil()) {
  const result = validateFields(input, CNH_EDIT_FIELDS, false, today);
  if (result.error) return result;
  return result.fields && Object.keys(result.fields).length === CNH_EDIT_FIELDS.length
    ? result : { error: 'Confira número, validade e categoria da CNH.' };
}

function validateFields(input: unknown, specs: readonly { key: string; label: string; max: number }[], allowTraining: boolean, today: string) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Dados de edição inválidos.' };
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'accessibility_training' && allowTraining) {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([k, v]) => !Object.hasOwn(TRAINING_LABELS, k) || typeof v !== 'boolean')) return { error: 'Treinamentos inválidos.' };
      fields[key] = value;
      continue;
    }
    const spec = specs.find((field) => field.key === key);
    if (!spec || (value !== null && typeof value !== 'string')) return { error: 'Campo de edição não permitido.' };
    let text = String(value ?? '').trim();
    if (text.length > spec.max) return { error: `${spec.label}: valor muito longo.` };
    text = normalizeEditableValue(key, text);
    if (key === 'name' && !text) return { error: 'Informe o nome completo.' };
    if (key === 'cpf' && !validCpf(text)) return { error: 'Informe um CPF válido.' };
    if (key === 'telefone' && !/^\d{10,11}$/.test(text)) return { error: 'Informe um telefone com DDD.' };
    if (key === 'data_nascimento' && (!validDate(text) || text >= today || text < '1900-01-01')) return { error: 'Informe uma data de nascimento válida.' };
    if (key === 'cep' && text && !/^\d{8}$/.test(text)) return { error: 'Informe um CEP válido.' };
    if (key === 'estado' && text && !['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(text)) return { error: 'Informe uma UF válida.' };
    if (key === 'cnh_numero' && !/^\d{11}$/.test(text)) return { error: 'A CNH deve ter 11 dígitos.' };
    if (key === 'cnh_categoria' && !['A','B','AB','C','D','E','AC','AD','AE','ACC'].includes(text)) return { error: 'Categoria da CNH inválida.' };
    if (key === 'cnh_validade' && (!validDate(text) || text < today)) return { error: 'A nova CNH deve estar dentro da validade.' };
    if (key === 'chave_pix' && text.length < 3) return { error: 'Informe uma chave Pix válida.' };
    fields[key] = text || null;
  }
  return Object.keys(fields).length ? { fields } : { error: 'Nenhuma alteração informada.' };
}

export function validDocumentSignature(bytes: Uint8Array, mime: string) {
  const signature = [...bytes.slice(0, 8)];
  if (mime === 'application/pdf') return signature.slice(0, 5).join(',') === '37,80,68,70,45';
  if (mime === 'image/jpeg') return signature.slice(0, 3).join(',') === '255,216,255';
  return mime === 'image/png' && signature.join(',') === '137,80,78,71,13,10,26,10';
}
