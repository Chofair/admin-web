import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = process.env.ADMIN_STAGING_ENV_FILE || resolve(projectDir, '..', 'admin-staging.env');
const require = createRequire(import.meta.url);

try {
  if (process.env.VERCEL) throw new Error('Este comando é exclusivo do desenvolvimento local.');
  const config = parseEnv(readFileSync(envFile, 'utf8'));
  const ref = config.ADMIN_STAGING_PROJECT_REF;
  if (config.ADMIN_ENVIRONMENT !== 'staging' || !/^[a-z0-9]{20}$/.test(ref || '')) {
    throw new Error('O arquivo precisa identificar explicitamente o projeto de staging.');
  }
  if (config.NEXT_PUBLIC_SUPABASE_URL !== 'https://' + ref + '.supabase.co') {
    throw new Error('A URL do Supabase não corresponde ao projeto de staging informado.');
  }
  const key = config.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  let publicKey = key.startsWith('sb_publishable_');
  if (!publicKey && key.split('.').length === 3) {
    try {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url'));
      publicKey = claims.role === 'anon' && claims.ref === ref;
    } catch {
      publicKey = false;
    }
  }
  if (!publicKey) throw new Error('Informe somente a chave pública do Supabase.');
  const mapsEnvironment = config.MAPS_MONITORING_ENVIRONMENT || 'production';
  if (!['development', 'preview', 'production'].includes(mapsEnvironment)) {
    throw new Error('O ambiente de telemetria do Maps é inválido.');
  }
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], {
    cwd: projectDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ADMIN_ENVIRONMENT: 'staging',
      NEXT_PUBLIC_SUPABASE_URL: config.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      MAPS_MONITORING_ENVIRONMENT: mapsEnvironment,
    },
  });
  console.log('Painel local conectado ao staging: ' + ref);
  child.on('error', () => { console.error('Não foi possível iniciar o painel.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch (error) {
  console.error(error.code === 'ENOENT'
    ? 'Arquivo de staging ausente. Configure ../admin-staging.env ou ADMIN_STAGING_ENV_FILE.'
    : error.message);
  process.exitCode = 1;
}
