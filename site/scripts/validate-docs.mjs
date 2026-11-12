import {existsSync} from 'node:fs';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const generatedRoot = path.join(siteRoot, '.generated');
const docsRoot = path.join(generatedRoot, 'docs');
const javadocRoot = path.join(siteRoot, 'static', 'javadoc');

async function filesUnder(root, current = root) {
  const result = [];
  for (const entry of await readdir(current, {withFileTypes: true})) {
    const candidate = path.join(current, entry.name);
    if (entry.isDirectory()) {
      result.push(...await filesUnder(root, candidate));
    } else if (entry.isFile()) {
      result.push(candidate);
    }
  }
  return result;
}

function resolveLocalTarget(markdownFile, target) {
  const [rawPath] = target.split('#', 1);
  if (!rawPath) {
    return undefined;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    decoded = rawPath;
  }
  return path.resolve(path.dirname(markdownFile), decoded);
}

function targetExists(candidate) {
  if (!candidate) {
    return true;
  }
  if (existsSync(candidate)) {
    return true;
  }
  return existsSync(`${candidate}.md`) || existsSync(path.join(candidate, 'index.md'));
}

async function main() {
  if (!existsSync(docsRoot)) {
    throw new Error('No collected documentation. Run npm run collect:local or npm run collect first.');
  }
  if (!existsSync(path.join(generatedRoot, 'source-manifest.json'))) {
    throw new Error('Missing generated source manifest.');
  }
  const javadocManifestPath = path.join(generatedRoot, 'javadoc-manifest.json');
  if (!existsSync(javadocManifestPath)) {
    throw new Error('Missing generated Javadoc manifest. Run the Javadoc collector.');
  }

  const files = await filesUnder(docsRoot);
  const markdownFiles = files.filter((file) => /\.mdx?$/i.test(file));
  const broken = [];

  for (const file of markdownFiles) {
    const content = await readFile(file, 'utf8');
    for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].trim();
      const target = rawTarget.startsWith('<')
        ? rawTarget.slice(1, rawTarget.indexOf('>'))
        : rawTarget.split(/\s+/, 1)[0];
      if (!target || target.startsWith('#') || target.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
        continue;
      }
      const candidate = resolveLocalTarget(file, target);
      if (!targetExists(candidate)) {
        broken.push(`${path.relative(docsRoot, file)} -> ${target}`);
      }
    }
  }

  const moduleIndex = await readFile(path.join(docsRoot, 'modules', 'index.md'), 'utf8');
  const moduleCount = [...moduleIndex.matchAll(/\]\(\/docs\/modules\/illuminatio-/g)].length;
  if (moduleCount !== 36) {
    throw new Error(`Expected 36 reactor modules in the generated catalogue, found ${moduleCount}.`);
  }

  if (broken.length > 0) {
    throw new Error(`Broken local documentation links:\n${broken.join('\n')}`);
  }

  const javadocManifest = JSON.parse(await readFile(javadocManifestPath, 'utf8'));
  if (!javadocManifest.allowMissing
      && javadocManifest.publishedCount !== javadocManifest.expectedCount) {
    throw new Error(
      `Release Javadoc is incomplete: ${javadocManifest.publishedCount}/${javadocManifest.expectedCount}.`,
    );
  }
  for (const module of javadocManifest.modules) {
    if (!/^illuminatio-[a-z0-9-]+$/.test(module.name)
        || module.route !== `/javadoc/${module.name}/`) {
      throw new Error(`Unsafe or inconsistent Javadoc manifest entry: ${JSON.stringify(module)}`);
    }
    if (!existsSync(path.join(javadocRoot, module.name, 'index.html'))) {
      throw new Error(`Missing staged Javadoc index for ${module.name}.`);
    }
  }

  console.log(
    `Validated ${markdownFiles.length} Markdown files, ${moduleCount} reactor modules and `
      + `${javadocManifest.publishedCount} Javadoc sites.`,
  );
}

await main();
