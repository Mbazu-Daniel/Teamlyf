import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Branch decides the worker, so `dev` and `main` can never overwrite each
// other. `main` maps to the `production` block in wrangler.jsonc; anything else
// deploys the top-level (dev) worker. --keep-vars preserves dashboard-set
// variables that are not in the config file.
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const branch = process.env.WORKERS_CI_BRANCH ?? process.env.GITHUB_REF_NAME ?? 'dev';
const isProd = branch === 'main';
const wranglerArgs = isProd ? ['--env', 'production', '--keep-vars'] : ['--keep-vars'];
const target = isProd ? 'teamlyf-prod' : 'teamlyf-web';

console.log(`[cf-deploy] branch=${branch} worker=${target}`);

const result = spawnSync('pnpm', ['exec', 'wrangler', 'deploy', '--', ...wranglerArgs], {
  cwd: webRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);