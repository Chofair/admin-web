import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
function moduleFile(path, require) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', js)(exports, require);
  return exports;
}
const constants = moduleFile('app/cidades/constants.ts');
const tariffValidation = moduleFile('lib/regional-v2-tariffs.ts');
function setup(options = {}) {
  const writes = []; const filters = []; const invalidations = [];
  const query = { eq: (...args) => { filters.push(args); return query; }, select: async () => ({ data: options.stale ? [] : [{ id: 'padrao' }], error: null }) };
  const supabase = { from: name => ({ update: value => { writes.push({ name, value }); return query; } }) };
  const actions = moduleFile('app/cidades/actions.ts', name => {
    if (name === 'next/cache') return { revalidatePath: path => invalidations.push(path) };
    if (name === '@/lib/auth') return { requireAdmin: async () => { if (options.forbidden) throw new Error('FORBIDDEN'); return { supabase }; } };
    if (name === './constants') return constants;
    if (name === '@/lib/regional-v2-tariffs') return tariffValidation;
    throw new Error(`Unexpected import: ${name}`);
  });
  return { actions, writes, filters, invalidations };
}
function validForm() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: 'padrao', nome: 'Padrão', updated_at: '2026-11-22T12:00:00Z',
    limite_km: '13', fixa_centavos: '7.80', km_curta_centavos: '1.76', minimo_centavos: '7.90',
    hora_centavos: '22.83', domingo_hora_centavos: '32.61', km_longa_centavos: '0.78' })) data.set(key, value);
  return data;
}
test('tariff mutation requires administrator authorization', async () => {
  const { actions, writes } = setup({ forbidden: true });
  await assert.rejects(actions.updateV2Tariff({}, validForm()), /FORBIDDEN/);
  assert.deepEqual(writes, []);
});
test('tariff edit updates only its profile with an optimistic timestamp', async () => {
  const { actions, writes, filters, invalidations } = setup();
  const state = await actions.updateV2Tariff({}, validForm());
  assert.equal(state.status, 'success');
  assert.equal(writes[0].name, 'perfis_tarifarios_v2');
  assert.equal(writes[0].value.hora_centavos, 2283);
  assert.deepEqual(filters, [['id', 'padrao'], ['updated_at', '2026-11-22T12:00:00Z']]);
  assert.deepEqual(invalidations, ['/cidades']);
});
test('stale edits report conflict instead of overwriting another administrator', async () => {
  const { actions, invalidations } = setup({ stale: true });
  const state = await actions.updateV2Tariff({}, validForm());
  assert.equal(state.status, 'error');
  assert.match(state.message, /outra pessoa/);
  assert.deepEqual(invalidations, []);
});
test('cannot enable customer V2 without selecting a tariff', async () => {
  const { actions, writes } = setup();
  const data = new FormData();
  data.set('cidade', 'Socorro'); data.set('estado', 'SP'); data.set('ativo_cliente_v2', 'on');
  const state = await actions.createCity({}, data);
  assert.equal(state.status, 'error');
  assert.match(state.message, /região tarifária/);
  assert.deepEqual(writes, []);
});
test('tariff activation never mutates city coverage flags', async () => {
  const { actions, writes } = setup(); const form = new FormData(); form.set('ativa', 'on');
  assert.equal((await actions.updateV2Activation({}, form)).status, 'success');
  assert.deepEqual(writes, [{ name: 'configuracao_regional_v2', value: { ativa: true } }]);
});
