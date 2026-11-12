import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const documentsRoot = path.resolve(siteRoot, '..');
const developmentsRoot = path.dirname(documentsRoot);
const parentRoot = path.join(developmentsRoot, 'illuminatio-parent');
const generatedRoot = path.join(siteRoot, '.generated');
const generatedSourceRoot = path.join(siteRoot, 'src', 'generated');
const publishedRoot = path.join(siteRoot, 'static', 'javadoc');
const allowMissing = process.argv.includes('--allow-missing');

function runGit(repository, args, fallback = '') {
  try {
    return execFileSync('git', ['-C', repository, ...args], {encoding: 'utf8'}).trim();
  } catch {
    return fallback;
  }
}

async function filesUnder(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const candidate = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(candidate));
    } else if (entry.isFile()) {
      files.push(candidate);
    }
  }
  return files;
}

async function reactorModules() {
  const pom = await readFile(path.join(parentRoot, 'pom.xml'), 'utf8');
  return [...pom.matchAll(/<module>\.\.\/(illuminatio-[^<]+)<\/module>/g)]
    .map((match) => match[1]);
}

async function latestModified(files) {
  let latest = 0;
  for (const file of files) {
    const details = await stat(file);
    latest = Math.max(latest, details.mtimeMs);
  }
  return latest;
}

async function inspectModule(name) {
  if (!/^illuminatio-[a-z0-9-]+$/.test(name)) {
    throw new Error(`Unsafe reactor module name: ${name}`);
  }
  const repository = path.join(developmentsRoot, name);
  const sourceRoot = path.join(repository, 'src', 'main', 'java');
  const javaSources = (await filesUnder(sourceRoot)).filter((file) => file.endsWith('.java'));
  if (javaSources.length === 0) return null;

  const outputRoot = path.join(repository, 'target', 'reports', 'apidocs');
  const index = path.join(outputRoot, 'index.html');
  if (!existsSync(index)) {
    return {name, repository, state: 'missing', reason: 'Javadoc has not been generated'};
  }

  const freshnessInputs = [...javaSources, path.join(repository, 'pom.xml'), path.join(parentRoot, 'pom.xml')]
    .filter((file) => existsSync(file));
  const sourceModified = await latestModified(freshnessInputs);
  const outputModified = (await stat(index)).mtimeMs;
  if (outputModified < sourceModified) {
    return {name, repository, state: 'stale', reason: 'Javadoc predates Java or Maven source'};
  }

  return {
    name,
    repository,
    outputRoot,
    state: 'published',
    commit: runGit(repository, ['rev-parse', 'HEAD']),
    route: `/javadoc/${name}/`,
  };
}

async function main() {
  const inspected = (await Promise.all((await reactorModules()).map(inspectModule)))
    .filter(Boolean);
  const unavailable = inspected.filter((module) => module.state !== 'published');

  if (unavailable.length > 0 && !allowMissing) {
    throw new Error(
      `Release Javadoc collection requires fresh output for every Java module:\n${unavailable
        .map((module) => `- ${module.name}: ${module.reason}`)
        .join('\n')}`,
    );
  }

  await rm(publishedRoot, {recursive: true, force: true});
  await mkdir(publishedRoot, {recursive: true});

  const published = inspected.filter((module) => module.state === 'published');
  for (const module of published) {
    const destination = path.join(publishedRoot, module.name);
    await cp(module.outputRoot, destination, {recursive: true});
    if (!existsSync(path.join(destination, 'index.html'))) {
      throw new Error(`Staged Javadoc is missing its index: ${module.name}`);
    }
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    allowMissing,
    expectedCount: inspected.length,
    publishedCount: published.length,
    modules: published.map(({name, commit, route}) => ({name, commit, route})),
    unavailable: unavailable.map(({name, state, reason}) => ({name, state, reason})),
  };

  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  await mkdir(generatedRoot, {recursive: true});
  await mkdir(generatedSourceRoot, {recursive: true});
  await writeFile(path.join(generatedRoot, 'javadoc-manifest.json'), serialized);
  await writeFile(path.join(generatedSourceRoot, 'javadoc-manifest.json'), serialized);

  console.log(`Staged Javadoc for ${published.length}/${inspected.length} Java modules.`);
  if (unavailable.length > 0) {
    console.warn(`Local snapshot omits unavailable Javadoc: ${unavailable.map((module) => module.name).join(', ')}`);
  }
}

await main();
