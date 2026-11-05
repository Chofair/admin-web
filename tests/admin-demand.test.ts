import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demandRpcArgs, demandUrl, isDemandSetupMissing, parseDemandFilters, type EventRow } from '../lib/admin-demand';
const now = new Date('2026-11-04T01:00:00Z'); // Still November 3 in Brasília.
const parse = (query: Parameters<typeof parseDemandFilters>[0]) => parseDemandFilters(query, ['SP', 'RJ'], now);

test('defaults to thirty days in Brasília rather than the server timezone', () => {
  const { filters, error } = parse({});
  assert.equal(error, null);
  assert.equal(filters.inicio, '2026-10-05');
  assert.equal(filters.fim, '2026-11-03');
  assert.equal(demandRpcArgs(filters).p_cidade, null);
});
test('rejects invalid dates, reversed periods, future dates and unbounded history', () => {
  for (const query of [
    { inicio: '2026-02-30' }, { inicio: 'not-a-date' }, { inicio: '2026-11-03', fim: '2026-10-30' },
    { fim: '2026-11-04' }, { inicio: '2026-01-01' }, { inicio: '2026-08-01', fim: '2026-11-03' },
    { uf: ['SP', 'RJ'] },
  ]) assert.ok(parse(query).error, JSON.stringify(query));
});
test('accepts thirty calendar days and rejects the thirty-first day', () => {
  assert.equal(parse({ inicio: '2026-10-05', fim: '2026-11-03' }).error, null);
  assert.ok(parse({ inicio: '2026-10-04', fim: '2026-11-03' }).error);
  assert.ok(parse({ inicio: '2026-10-04', fim: '2026-10-05' }).error);
});
test('recognizes a missing demand RPC without hiding permission or other errors', () => {
  for (const code of ['PGRST202', '42883']) {
    assert.equal(isDemandSetupMissing({ code, message: 'Could not find public.admin_consultar_demanda_cidades' }), true);
  }
  for (const error of [null, { code: '42501', message: 'admin_consultar_demanda_cidades forbidden' },
    { code: 'PGRST202', message: 'Could not find other_function' }, { code: 'XX000' }]) {
    assert.equal(isDemandSetupMissing(error), false);
  }
});
test('keeps the four categories separate and validates all enum inputs including prototype keys', () => {
  for (const tipo of ['interesse_cadastro', 'recusa_cidade', 'recusa_modalidade', 'falha_tecnica']) {
    assert.equal(parse({ tipo }).error, null);
  }
  for (const query of [{ uf: 'XX' }, { cidade: 'x'.repeat(101) }, { tipo: 'toString' }, { papel: '__proto__' }, { modalidade: 'constructor' }]) {
    assert.ok(parse(query).error);
  }
  const result = demandRpcArgs(parse({ cidade: ' Miracatu ', uf: 'SP', papel: 'driver', modalidade: 'acessibilidade' }).filters);
  assert.equal(result.p_cidade, 'Miracatu'); assert.equal(result.p_estado, 'SP');
  assert.equal(result.p_papel, 'driver'); assert.equal(result.p_modalidade, 'acessibilidade');
});
test('preserves microseconds and bigint precision in keyset pagination', () => {
  const cursor = { id: '9223372036854775807', criado_em: '2026-11-03T12:00:00.123456+00:00' } as EventRow;
  const filters = parse({ tipo: 'recusa_cidade', cidade: 'São Paulo', uf: 'SP' }).filters;
  const url = demandUrl(filters, cursor);
  const parsed = parse(Object.fromEntries(new URL(url, 'https://fixture.invalid').searchParams));
  assert.equal(parsed.error, null);
  assert.equal(demandRpcArgs(parsed.filters).p_antes_id, cursor.id);
  assert.equal(demandRpcArgs(parsed.filters).p_antes, cursor.criado_em);
  assert.equal(parsed.filters.cidade, 'São Paulo');
  const first = new URL(demandUrl(parsed.filters), 'https://fixture.invalid');
  assert.equal(first.searchParams.has('antes'), false);
  assert.equal(first.searchParams.has('antes_id'), false);
  const city = new URL(demandUrl(parsed.filters, undefined, { cidade: 'Miracatu', estado: 'SP' }), 'https://fixture.invalid');
  assert.equal(city.searchParams.get('cidade'), 'Miracatu');
  assert.equal(city.searchParams.get('tipo'), 'recusa_cidade');
  assert.equal(city.searchParams.has('antes'), false);
});
test('rejects incomplete, overflowing and malformed cursors before querying', () => {
  for (const query of [
    { antes: '2026-11-03T12:00:00Z' }, { antes_id: '1' },
    { antes: '2026-11-03T12:00:00Z', antes_id: '9223372036854775808' },
    { antes: 'invalid', antes_id: '1' }, { antes: '2026-11-03T12:00:00Z', antes_id: '-1' },
  ]) assert.ok(parse(query).error);
});
