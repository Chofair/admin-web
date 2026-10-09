import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest } from 'next/server.js';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server.js';

const require = createRequire(import.meta.url);
const testProcess = { env: {
  NEXT_PUBLIC_SUPABASE_URL: 'https://testproject.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  NODE_ENV: 'test',
} };
function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', 'process', code)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    loadedModule, loadedModule.exports, testProcess,
  );
  return loadedModule.exports;
}
async function adapter(store) {
  const { createSupabaseServerClient } = load('lib/supabase-server.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, options) => options.cookies },
    'next/headers': { cookies: async () => store },
  });
  return createSupabaseServerClient();
}
const cookie = { name: 'sb-testproject-auth-token', value: 'new-test-session', options: { path: '/', httpOnly: true } };

test('read-only rendering tolerates the specific Next.js cookie restriction', async () => {
  const incoming = [{ name: cookie.name, value: 'test-session' }];
  const cookies = await adapter({
    getAll: () => incoming,
    set: () => { throw new Error('Cookies can only be modified in a Server Action or Route Handler. Read more: test'); },
  });
  assert.deepEqual(cookies.getAll(), incoming);
  assert.doesNotThrow(() => cookies.setAll([cookie]));
});
test('Server Actions still persist cookies and their options', async () => {
  const writes = [];
  const cookies = await adapter({ getAll: () => [], set: (...args) => writes.push(args) });
  cookies.setAll([cookie]);
  assert.deepEqual(writes, [[cookie.name, cookie.value, cookie.options]]);
});
test('unrelated cookie errors are not suppressed', async () => {
  const failure = new Error('Unexpected cookie failure');
  const cookies = await adapter({ getAll: () => [], set: () => { throw failure; } });
  assert.throws(() => cookies.setAll([cookie]), error => error === failure);
});
function proxyModule(user) {
  return load('proxy.ts', {
    '@/lib/supabase-auth-cookies': load('lib/supabase-auth-cookies.ts', { 'server-only': {} }),
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: {
      getUser: async () => {
        if (user) options.cookies.setAll([cookie], { 'Cache-Control': 'private, no-store' });
        return { data: { user }, error: null };
      },
    } }) },
  });
}
test('proxy matches cancellations, payouts, nested paths and the existing financial queue', () => {
  const { config } = proxyModule(null);
  for (const url of ['/cancelamentos', '/cancelamentos?id=test', '/cancelamentos/test', '/cancelamentos-pagamento', '/repasses', '/repasses?filter=pendente', '/repasses/test']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
  }
  assert.equal(unstable_doesMiddlewareMatch({ config, url: '/cancelamentos-publicos' }), false);
  assert.equal(unstable_doesMiddlewareMatch({ config, url: '/repasses-publicos' }), false);
});
test('cancellations redirects unauthenticated visitors to login', async () => {
  const { proxy } = proxyModule(null);
  const response = await proxy(new NextRequest('https://admin.example/cancelamentos'));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://admin.example/login');
});
test('cancellations refreshes cookies before rendering and persists them in the response', async () => {
  const { proxy } = proxyModule({ id: 'test-user' });
  const request = new NextRequest('https://admin.example/cancelamentos');
  const response = await proxy(request);
  assert.equal(request.cookies.get(cookie.name)?.value, cookie.value);
  assert.equal(response.cookies.get(cookie.name)?.value, cookie.value);
  assert.equal(response.headers.get('x-middleware-request-cookie'), `${cookie.name}=${cookie.value}`);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-middleware-next'), '1');
});

test('payouts redirects unauthenticated visitors to login', async () => {
  const { proxy } = proxyModule(null);
  const response = await proxy(new NextRequest('https://admin.example/repasses?filter=pendente'));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://admin.example/login');
});

test('payouts refreshes cookies before rendering and persists them in the response', async () => {
  const { proxy } = proxyModule({ id: 'test-user' });
  const request = new NextRequest('https://admin.example/repasses');
  const response = await proxy(request);
  assert.equal(request.cookies.get(cookie.name)?.value, cookie.value);
  assert.equal(response.cookies.get(cookie.name)?.value, cookie.value);
  assert.equal(response.headers.get('x-middleware-request-cookie'), `${cookie.name}=${cookie.value}`);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-middleware-next'), '1');
});
