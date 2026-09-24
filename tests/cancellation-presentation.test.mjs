import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync('lib/cancellation-presentation.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
new Function('exports',code)(exports);
const { casePresentation, financialQueuePresentation } = exports;
const base = { automatica: true, motorista_nome: null, reembolso: 'aprovado', repasse: 'negado', valor_reembolso_centavos: 0, situacao: 'resolvido' };
test('unpaid automatic cancellation has no zero-value refund action', () => {
  const result = casePresentation({ ...base, sem_pagamento: true });
  assert.equal(result.refund,'Sem valor a devolver');
  assert.equal(result.payout,'Não se aplica');
  assert.equal(result.resolved,true);
});
test('uncertain charge is monitoring, not a completed refund', () => {
  const result = casePresentation({ ...base, situacao: 'processamento', cobranca_em_acompanhamento: true });
  assert.equal(result.refund,'Aguardando confirmação da cobrança');
  assert.equal(result.resolved,false);
});
test('received and returned payment is shown as a completed refund', () => {
  const result = casePresentation({ ...base, sem_pagamento: false, reembolso: 'pago', valor_reembolso_centavos: 12629 });
  assert.equal(result.refund,'Concluído');
});
test('manual payout denial remains distinct from automatic ineligibility', () => {
  assert.equal(casePresentation({ ...base, automatica: false, motorista_nome: 'Motorista de teste' }).payout,'Não aprovado');
});
const row = { status: 'resolvida', resultado: 'cobranca_cancelada', pagamento_status_atual: 'CANCELLED', pago_em: null, tratamento_financeiro: 'reembolso' };
test('unpaid resolved financial item links to history', () => {
  assert.deepEqual(financialQueuePresentation(row,true),{ unpaid: true, title: 'Sem valor a devolver', link: 'Ver histórico do cancelamento' });
});
test('pending provider result stays in monitoring even without receipt', () => {
  assert.equal(financialQueuePresentation({...row,status:'aberta'},true).unpaid,false);
});
test('received or refunded payment cannot be labelled unpaid', () => {
  for(const status of ['PAID','REFUNDED']) assert.equal(financialQueuePresentation({...row,pagamento_status_atual:status},true).unpaid,false);
  assert.equal(financialQueuePresentation({...row,pago_em:'2026-09-24T06:00:00Z'},true).unpaid,false);
});
