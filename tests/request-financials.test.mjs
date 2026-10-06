import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync('lib/request-financials.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
new Function('exports',code)(exports);
const { requestFinancialSplit } = exports;
test('Chofair gross includes its share of overtime (CHO-552)', () => {
  // Só motorista, 2h contratadas + 30 min excedentes: cliente R$45/h, motorista R$30/h.
  const split = requestFinancialSplit({ preco_total: 90, preco_final: 112.5, preco_motorista: 60, preco_motorista_final: 75 });
  assert.equal(split.clientTotal, 112.5);
  assert.equal(split.driverTotal, 75);
  assert.equal(split.chofairGross, 37.5);
  assert.equal(split.chofairTax, 5.81);
  assert.equal(split.chofairNet, 31.69);
});
test('falls back to initial quote before the ride is finalized', () => {
  const split = requestFinancialSplit({ preco_total: 90, preco_final: null, preco_motorista: 60, preco_motorista_final: null });
  assert.equal(split.chofairGross, 30);
  assert.equal(split.chofairTax, 4.65);
});
test('returns null without driver or client amounts', () => {
  assert.equal(requestFinancialSplit({ preco_total: null, preco_final: null, preco_motorista: 60, preco_motorista_final: null }), null);
});
