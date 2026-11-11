import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documentsRoot = path.resolve(siteRoot, '..');
const checkoutRoot = path.dirname(documentsRoot);
const lock = JSON.parse(readFileSync(path.join(documentsRoot, 'docs-sources.lock.json'), 'utf8'));
const token = process.env.ILLUMINATIO_DOCS_TOKEN || process.env.GITHUB_TOKEN;

if (!token) throw new Error('ILLUMINATIO_DOCS_TOKEN (or GITHUB_TOKEN) is required');

const gitEnvironment = {
  ...process.env,
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
  GIT_CONFIG_VALUE_0: `AUTHORIZATION: bearer ${token}`,
};

for (const source of lock.sources) {
  const destination = path.join(checkoutRoot, source.name);
  execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', `${source.repository}.git`, destination], {
    env: gitEnvironment,
    stdio: 'inherit',
  });
  execFileSync('git', ['-C', destination, 'checkout', '--detach', source.commit], {
    env: gitEnvironment,
    stdio: 'inherit',
  });
}
