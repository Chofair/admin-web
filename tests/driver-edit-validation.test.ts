import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CNH_MAX_BYTES, DRIVER_CHANGE_LABELS, DRIVER_EDIT_FIELDS, TRAINING_LABELS, getDriverFormChanges, getVisibleDriverChanges, hasLoginEmailChange, validCpf, validDocumentSignature, validateCnhChanges, validateDriverChanges } from '../lib/driver-edit-validation';

const validate = (input: unknown) => validateDriverChanges(input, '2026-10-28');
const validCnh = { cnh_numero: '12345678901', cnh_categoria: 'B', cnh_validade: '2028-10-28' };
const validateCnh = (fields: Record<string, unknown>) => validateCnhChanges({ ...validCnh, ...fields }, '2026-10-28');

test('detects real form edits, ignores reason/confirmation and returns clean when reverted', () => {
  const values: Record<string, unknown> = { name: 'Motorista de teste', cpf: '52998224725', telefone: '11999998888', cep: '01310100', estado: 'SP', chave_pix: 'teste@fixture.invalid', accessibility_training: { pcdService: true } };
  const form = new FormData();
  for (const { key } of DRIVER_EDIT_FIELDS) form.set(key, String(values[key] ?? ''));
  form.set('training_pcdService', 'on');
  assert.deepEqual(getDriverFormChanges(form, values), {});
  form.set('reason', 'Motivo de teste informado'); form.set('confirmed', 'on');
  assert.deepEqual(getDriverFormChanges(form, values), {});
  form.set('cpf', '529.982.247-25'); form.set('telefone', '(11) 99999-8888'); form.set('cep', '01310-100'); form.set('estado', 'sp');
  assert.deepEqual(getDriverFormChanges(form, values), {});
  form.set('name', 'Nome corrigido');
  assert.deepEqual(getDriverFormChanges(form, values), { name: 'Nome corrigido' });
  form.set('name', ' Motorista de teste ');
  assert.deepEqual(getDriverFormChanges(form, values), {});
  form.delete('training_pcdService');
  assert.deepEqual(getDriverFormChanges(form, values), { accessibility_training: Object.fromEntries(Object.keys(TRAINING_LABELS).map(key => [key, false])) });
  form.set('training_pcdService', 'on');
  assert.deepEqual(getDriverFormChanges(form, values), {});
  form.set('chave_pix', '');
  assert.deepEqual(getDriverFormChanges(form, values), { chave_pix: null });
});
test('enables email correction only for a different nonempty address', () => {
  for (const value of ['', ' ', 'motorista@fixture.invalid', ' MOTORISTA@fixture.invalid ']) assert.equal(hasLoginEmailChange(value, 'motorista@fixture.invalid'), false);
  assert.equal(hasLoginEmailChange('novo@fixture.invalid', 'motorista@fixture.invalid'), true);
});

test('validates CPF checksums and rejects repeated digits', () => {
  assert.equal(validCpf('52998224725'), true);
  for (const value of ['11111111111', '52998224724', '', '529.982.247-25']) assert.equal(validCpf(value), false);
  assert.deepEqual(validate({ cpf: '529.982.247-25' }).fields, { cpf: '52998224725' });
});
test('allows operational fields and rejects privilege, document and status changes', () => {
  for (const input of [[], null, {}, { is_admin: true }, { status_motorista: 'aprovado' }, { cnh_storage_path: 'other/file.pdf' }, { cnh_foto_url: 'https://other.invalid/file' }, { saldo: '100' }, { name: {} }]) assert.ok(validate(input).error);
  assert.deepEqual(validate({ telefone: '(11) 99999-8888', estado: 'sp', cep: '01310-100' }).fields, { telefone: '11999998888', estado: 'SP', cep: '01310100' });
});
test('keeps CNH changes in the document flow and removes contact/avatar editing', () => {
  for (const input of [{ email: 'valid@fixture.invalid' }, { foto_perfil_url: 'https://stage.supabase.co/storage/v1/object/public/avatars/a.png' }, { cnh_numero: validCnh.cnh_numero }, { cnh_validade: validCnh.cnh_validade }, { cnh_categoria: 'B' }]) assert.ok(validate(input).error);
  assert.ok(validateCnhChanges({}, '2026-10-28').error);
  assert.ok(validateCnhChanges({ cnh_numero: validCnh.cnh_numero }, '2026-10-28').error);
  for (const input of [{ name: 'Forbidden' }, { chave_pix: '12345678901' }, { accessibility_training: { pcdService: true } }]) assert.ok(validateCnh(input).error);
  assert.deepEqual(validateCnh({ cnh_categoria: 'ab' }).fields, { ...validCnh, cnh_categoria: 'AB' });
  assert.equal(DRIVER_CHANGE_LABELS.cnh_numero, 'Número da CNH');
  assert.equal(DRIVER_CHANGE_LABELS.email, 'E-mail');
  assert.equal(DRIVER_CHANGE_LABELS.foto_perfil_url, 'Foto do perfil');
});

test('shows one email correction while preserving standalone legacy email changes', () => {
  const email = { before: 'old@fixture.invalid', after: 'new@fixture.invalid' };
  const changes = { login_email: email, email, cnh_foto_url: { before: null, after: 'private:document' }, cnh_mime_type: { before: null, after: 'application/pdf' } };
  assert.deepEqual(getVisibleDriverChanges(changes), [['login_email', email]]);
  assert.deepEqual(getVisibleDriverChanges({ email }), [['email', email]]);
  assert.deepEqual(Object.keys(changes), ['login_email', 'email', 'cnh_foto_url', 'cnh_mime_type']);
});
test('checks calendar dates, birth dates and expired CNHs', () => {
  for (const value of ['2026-02-30', '2026-13-01', '27/10/2026', '2026-10-27', '']) assert.ok(validateCnh({ cnh_validade: value }).error);
  assert.ok(validateCnh({ cnh_validade: '2026-10-28' }).fields);
  assert.ok(validateCnh({ cnh_validade: '2027-01-01' }).fields);
  for (const value of ['2026-10-28', '1899-01-01', '2024-02-30']) assert.ok(validate({ data_nascimento: value }).error);
  assert.ok(validate({ data_nascimento: '2000-02-29' }).fields);
});
test('limits field lengths and restricts training keys', () => {
  for (const input of [{ name: 'a'.repeat(121) }, { telefone: '123' }, { estado: 'XX' }, { chave_pix: 'x' }, { accessibility_training: { is_admin: true } }, { accessibility_training: { toString: true } }, { accessibility_training: { pcdService: 'true' } }]) assert.ok(validate(input).error);
  assert.ok(validate({ accessibility_training: { pcdService: true } }).fields);
  assert.ok(validateCnh({ cnh_numero: '123' }).error);
});
test('checks actual file headers rather than trusting MIME or extension', () => {
  assert.equal(CNH_MAX_BYTES, 10485760);
  assert.ok(validDocumentSignature(new TextEncoder().encode('%PDF-1.7'), 'application/pdf'));
  assert.ok(validDocumentSignature(new Uint8Array([255,216,255,224]), 'image/jpeg'));
  assert.ok(validDocumentSignature(new Uint8Array([137,80,78,71,13,10,26,10]), 'image/png'));
  for (const mime of ['application/pdf', 'image/jpeg', 'image/png', 'text/html']) assert.equal(validDocumentSignature(new TextEncoder().encode('<script>'), mime), false);
});
