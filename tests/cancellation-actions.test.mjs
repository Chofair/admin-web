import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function setup(decide, state = { message: '', ok: false }) {
  let submit;
  const mocks = {
    react: { useActionState(action) { submit = action; return [state, action, false]; } },
    './actions': { decideCancellation: decide },
    'next/navigation': { unstable_rethrow(error) {
      if (error?.digest?.startsWith('NEXT_REDIRECT;')) throw error;
    } },
  };
  const code = ts.transpileModule(readFileSync('app/cancelamentos/DecisionForm.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded, loaded.exports,
  );
  const tree = loaded.exports.DecisionForm({ id: '00000000-0000-4000-8000-000000000001', topic: 'repasse' });
  return { submit: data => submit({ message: '', ok: false }, data), tree };
}
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [node, ...elements(node.props.children)];
}

test('a lost response after a saved decision does not retry and requires verification', async () => {
  let requests = 0;
  let saved = false;
  const { submit } = setup(async () => {
    requests++;
    saved = true;
    throw new Error('An unexpected response was received from the server.');
  });
  const state = await submit(new FormData());
  assert.equal(saved, true);
  assert.equal(requests, 1);
  assert.equal(state.ok, false);
  assert.equal(state.needsRefresh, true);
  assert.match(state.message, /decisão pode ter sido registrada/);
  const tree = setup(async () => state, state).tree;
  assert.equal(elements(tree).find(node => node.type === 'fieldset').props.disabled, true);
  assert.ok(elements(tree).some(node => node.type === 'button' && node.props.children === 'Atualizar página'));
});

test('a successful decision preserves the result from the server', async () => {
  const expected = { ok: true, message: 'Decisão registrada.' };
  assert.equal(await setup(async () => expected).submit(new FormData()), expected);
});

test('a business rejection remains editable rather than a transport failure', async () => {
  const expected = { ok: false, message: 'Preencha a justificativa.' };
  const actual = await setup(async () => expected).submit(new FormData());
  assert.equal(actual, expected);
  assert.equal(actual.needsRefresh, undefined);
});

test('authentication redirects remain controlled by Next.js', async () => {
  const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;push;/login;303;' });
  await assert.rejects(setup(async () => { throw redirect; }).submit(new FormData()), error => error === redirect);
});
