import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync('lib/regional-v2-tariffs.ts', 'utf8');
const exports = {};
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports);
const { parseV2TariffForm, v2TimeCharges } = exports;
function form(overrides = {}) {
  const values = { id: 'padrao', nome: 'Padrão', limite_km: '13', fixa_centavos: '7.80', km_curta_centavos: '1.76',
    minimo_centavos: '7.90', hora_centavos: '22.83', domingo_hora_centavos: '32.61', km_longa_centavos: '.78', ...overrides };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
test('parses cents and meters exactly, accepting decimal commas', () => {
  const parsed = parseV2TariffForm(form({ km_longa_centavos: '0,78', limite_km: '13.001' }));
  assert.equal(parsed.value.limite_curta_metros, 13001);
  assert.equal(parsed.value.hora_centavos, 2283);
  assert.equal(parsed.value.km_longa_centavos, 78);
  assert.equal(parsed.value.id, 'padrao');
});
for (const [name, change] of Object.entries({ unknownRegion: { id: 'qualquer' }, negative: { fixa_centavos: '-1' },
  zero: { hora_centavos: '0' }, oversized: { km_longa_centavos: '10000.01' }, fractionalCent: { hora_centavos: '22.831' },
  fractionalMeter: { limite_km: '13.0001' }, aboveRouteCap: { limite_km: '1200.001' }, exponent: { hora_centavos: '1e2' } })) {
  test(`rejects ${name}`, () => assert.ok(parseV2TariffForm(form({ km_longa_centavos: '0.78', ...change })).error));
}

test('time charges follow each profile and round each block before the extension', () => {
  assert.deepEqual(v2TimeCharges({ hora_centavos: 2283, domingo_hora_centavos: 3261 }),
    { baseBlockCents: 571, sundayBlockCents: 815, baseExtensionCents: 2284, sundayExtensionCents: 3260 });
  assert.deepEqual(v2TimeCharges({ hora_centavos: 2000, domingo_hora_centavos: 3002 }),
    { baseBlockCents: 500, sundayBlockCents: 751, baseExtensionCents: 2000, sundayExtensionCents: 3004 });
});
