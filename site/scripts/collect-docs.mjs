import {execFileSync} from 'node:child_process';
import {existsSync, statSync} from 'node:fs';
import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const documentsRoot = path.resolve(siteRoot, '..');
const developmentsRoot = path.dirname(documentsRoot);
const generatedRoot = path.join(siteRoot, '.generated');
const generatedDocsRoot = path.join(generatedRoot, 'docs');
const allowDirty = process.argv.includes('--allow-dirty');
const writeLock = process.argv.includes('--write-lock');

const excludedNames = new Set([
  '.DS_Store',
  '.git',
  'legacy-development-notes.md',
  'node_modules',
  'target',
]);

const excludedPublishedPaths = new Set([
  'illuminatio-parent:api/documentation-coverage.md',
  'illuminatio-market:rate-sourcing-and-generation-architecture.md',
  'illuminatio-market:rate-generation-defaulting-table.md',
  'illuminatio-subledger:TRANSACTION_SERVICES.md',
  'illuminatio-testdata:full-platform-demo/coverage-matrix.md',
  'illuminatio-testdata:full-platform-demo/persona-journeys.md',
  'illuminatio-testdata:full-platform-demo/reference-inventory.md',
  'illuminatio-testdata:full-platform-demo/report-matrix.md',
  'illuminatio-testdata:full-platform-demo/ruleset-matrix.md',
  'illuminatio-testdata:full-platform-demo/workflow-matrix.md',
]);

function runGit(repository, args, fallback = '') {
  try {
    return execFileSync('git', ['-C', repository, ...args], {encoding: 'utf8'}).trim();
  } catch {
    return fallback;
  }
}

function githubBase(remote, repositoryName) {
  if (!remote) {
    return `https://github.com/mjeremym/${repositoryName}`;
  }
  return remote
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');
}

function repositoryInfo(repository) {
  const name = path.basename(repository);
  const commit = runGit(repository, ['rev-parse', 'HEAD']);
  const branch = runGit(repository, ['branch', '--show-current'], 'detached');
  const status = runGit(repository, ['status', '--porcelain']);
  const remote = runGit(repository, ['remote', 'get-url', 'origin']);
  if (!commit) {
    throw new Error(`${repository} is not a Git repository`);
  }
  return {
    name,
    path: repository,
    commit,
    branch,
    dirty: status.length > 0,
    remote: githubBase(remote, name),
  };
}

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function destinationRelative(sourceRelative) {
  const normalized = sourceRelative.split(path.sep).join('/');
  if (normalized === 'README.md') {
    return 'index.md';
  }
  return normalized.replace(/\/README\.md$/i, '/index.md');
}

const menuTerms = new Map([
  ['acl', 'ACL'],
  ['ai', 'AI'],
  ['api', 'API'],
  ['apis', 'APIs'],
  ['bdd', 'BDD'],
  ['datatables', 'DataTables'],
  ['docker', 'Docker'],
  ['fix', 'FIX'],
  ['graphql', 'GraphQL'],
  ['grpc', 'gRPC'],
  ['id', 'ID'],
  ['insomnia', 'Insomnia'],
  ['jar', 'JAR'],
  ['javadoc', 'Javadoc'],
  ['jwt', 'JWT'],
  ['liquibase', 'Liquibase'],
  ['maven', 'Maven'],
  ['oauth', 'OAuth'],
  ['openapi', 'OpenAPI'],
  ['querybuilder', 'QueryBuilder'],
  ['rabbitmq', 'RabbitMQ'],
  ['rest', 'REST'],
  ['spring', 'Spring'],
  ['ui', 'UI'],
]);

function readableMenuLabel(source) {
  let name = path.basename(source, path.extname(source));
  if (/^(?:README|index)$/i.test(name)) {
    name = path.basename(path.dirname(source));
    if (name.toLowerCase() === 'docs') return 'Overview';
  }
  const words = name.split(/[_-]+/).filter(Boolean);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      const term = menuTerms.get(lower);
      if (term) return term;
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

function addFrontMatterValue(content, key, value) {
  if (new RegExp(`^${key}:`, 'm').test(content.match(/^---\n[\s\S]*?\n---\n/)?.[0] ?? '')) {
    return content;
  }
  const entry = `${key}: ${JSON.stringify(value)}\n`;
  if (content.startsWith('---\n')) {
    return content.replace(/^---\n/, `---\n${entry}`);
  }
  return `---\n${entry}---\n\n${content}`;
}

async function listSourceFiles(root, current = root) {
  if (!existsSync(current)) {
    return [];
  }
  const files = [];
  for (const entry of await readdir(current, {withFileTypes: true})) {
    if (excludedNames.has(entry.name) || entry.name.startsWith('_TEMPLATE')) {
      continue;
    }
    const candidate = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listSourceFiles(root, candidate));
    } else if (entry.isFile()) {
      files.push(candidate);
    }
  }
  return files;
}

function isPublishedDocumentation(repository, sourceRoot, source) {
  const relative = path.relative(sourceRoot, source).split(path.sep).join('/');

  if (excludedPublishedPaths.has(`${repository.name}:${relative}`)) {
    return false;
  }

  if (repository.name === 'illuminatio-parent'
      && (relative.startsWith('plans/') || relative.startsWith('decisions/'))) {
    return false;
  }

  if (repository.name !== 'illuminatio-parent') {
    const base = path.basename(source);
    if (/(?:-|_)plan\.md$/i.test(base)
        || /(?:^|\/)(?:adr|decisions?|migrations?)(?:\/|$)/i.test(relative)
        || /^adr[-_]\d+.*\.md$/i.test(base)
        || /(?:^|[-_])migration(?:[-_]|\.)/i.test(base)) {
      return false;
    }
  }

  return true;
}

function splitLinkTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    return end >= 0
      ? {target: trimmed.slice(1, end), suffix: trimmed.slice(end + 1)}
      : {target: trimmed, suffix: ''};
  }
  const match = trimmed.match(/^(\S+)([\s\S]*)$/);
  return match ? {target: match[1], suffix: match[2]} : {target: trimmed, suffix: ''};
}

function linkToSource(info, absoluteTarget) {
  const repositoryRelative = path.relative(info.path, absoluteTarget).split(path.sep).join('/');
  return `${info.remote}/blob/${info.commit}/${encodeURI(repositoryRelative)}`;
}

function githubSourceTarget(target, repositories) {
  let url;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (url.hostname !== 'github.com') return null;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 5 || segments[2] !== 'blob') return null;
  const repository = repositories.find((candidate) => candidate.name === segments[1]);
  if (!repository) return null;

  // Repository-authored links currently use a one-segment ref such as master or a commit SHA.
  // Once the owning checkout is known, resolve the remaining path against that checkout so the
  // assembled site can link internally instead of depending on whether that ref has been merged.
  const absoluteTarget = path.join(repository.path, ...segments.slice(4).map(decodeURIComponent));
  return {absoluteTarget, anchor: url.hash.slice(1)};
}

function rewriteLinks(content, record, sourceToDestination, repositories) {
  return content.replace(/(!?\[[^\]]*\]\()([^)]+)(\))/g, (whole, prefix, rawTarget, suffix) => {
    const {target, suffix: titleSuffix} = splitLinkTarget(rawTarget);
    if (!target || target.startsWith('#')) {
      return whole;
    }

    const githubTarget = githubSourceTarget(target, repositories);
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !githubTarget) return whole;

    const [pathPart, relativeAnchor = ''] = target.split('#', 2);
    const anchor = githubTarget?.anchor || relativeAnchor;
    if (!pathPart || pathPart.includes('<') || pathPart.includes('>')) {
      return whole;
    }

    let decoded;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      decoded = pathPart;
    }

    let absoluteTarget = githubTarget?.absoluteTarget ?? path.resolve(path.dirname(record.source), decoded);
    if (existsSync(absoluteTarget)) {
      try {
        if (statSync(absoluteTarget).isDirectory()) {
          const readme = path.join(absoluteTarget, 'README.md');
          const index = path.join(absoluteTarget, 'index.md');
          absoluteTarget = existsSync(readme) ? readme : index;
        }
      } catch {
        return whole;
      }
    }

    const mapped = sourceToDestination.get(path.normalize(absoluteTarget));
    let rewritten;
    if (mapped) {
      rewritten = path.relative(path.dirname(record.destination), mapped).split(path.sep).join('/');
      if (!rewritten.startsWith('.')) {
        rewritten = `./${rewritten}`;
      }
    } else if (existsSync(absoluteTarget)) {
      const owningRepository = repositories.find((repository) => isWithin(absoluteTarget, repository.path));
      if (!owningRepository) return whole;
      rewritten = linkToSource(owningRepository, absoluteTarget);
    } else {
      return whole;
    }

    if (anchor) {
      rewritten += `#${anchor}`;
    }
    return `${prefix}${rewritten}${titleSuffix}${suffix}`;
  });
}

async function collectTree(repository, sourceRoot, destinationRoot, records, sourceToDestination) {
  const files = (await listSourceFiles(sourceRoot)).filter((source) => {
    const repositoryRelative = path.relative(repository.path, source).split(path.sep).join('/');
    return isPublishedDocumentation(repository, sourceRoot, source)
      && !(repository.name === 'illuminatio-parent'
        && repositoryRelative === 'docs/operations/developer-notes.md');
  });
  for (const source of files) {
    const relative = path.relative(sourceRoot, source);
    const destination = path.join(destinationRoot, destinationRelative(relative));
    const record = {source, destination, sourceRoot, destinationRoot, repository};
    records.push(record);
    sourceToDestination.set(path.normalize(source), destination);
  }
}

async function writeCollectedFiles(records, sourceToDestination, repositories) {
  const categoryDirectories = new Set();
  for (const record of records) {
    for (let directory = path.dirname(record.destination);
      directory !== record.destinationRoot && isWithin(directory, record.destinationRoot);
      directory = path.dirname(directory)) {
      categoryDirectories.add(directory);
    }
  }
  for (const directory of categoryDirectories) {
    const categoryFile = path.join(directory, '_category_.json');
    if (!existsSync(categoryFile)) {
      await mkdir(directory, {recursive: true});
      await writeFile(categoryFile, category(readableMenuLabel(directory), 1));
    }
  }

  for (const record of records) {
    await mkdir(path.dirname(record.destination), {recursive: true});
    if (/\.mdx?$/i.test(record.source)) {
      let content = await readFile(record.source, 'utf8');
      content = content.replace(/<(https?:\/\/[^ >]+)>/g, '[$1]($1)');
      // protoc-gen-doc emits HTML `name` anchors that MDX renders but Docusaurus does not index.
      // Convert them to explicit heading/span IDs while staging; the generated source stays untouched.
      content = content
        .replace(/^(# Protocol Documentation)\n<a name="top"><\/a>/m, '$1 {#top}')
        .replace(/<a name="([^"]+)"><\/a>\s*(?:<p[^>]*>[\s\S]*?<\/p>\s*)?(#{1,6}\s+[^\n]+)/g, '$2 {#$1}')
        .replace(/<a name="([^"]+)"\s*\/>/g, '<span id="$1"></span>')
        .replace(/\[([^\]]+)\]\(#(?:double|float|u?int32|u?int64|sint32|sint64|fixed32|fixed64|sfixed32|sfixed64|bool|string|bytes)\)/g, '`$1`')
        .replace(/\[([^\]]+)\]\(#google-protobuf-[^)]+\)/g, '`$1`');
      content = rewriteLinks(content, record, sourceToDestination, repositories);
      const sourceRelative = path.relative(record.repository.path, record.source).split(path.sep).join('/');
      const editUrl = `${record.repository.remote}/edit/${record.repository.branch}/${encodeURI(sourceRelative)}`;
      content = addFrontMatterValue(content, 'custom_edit_url', editUrl);
      content = addFrontMatterValue(content, 'sidebar_label', readableMenuLabel(record.source));
      await writeFile(record.destination, content);
    } else {
      await cp(record.source, record.destination);
    }
  }
}

async function moduleNames(parentRoot) {
  const pom = await readFile(path.join(parentRoot, 'pom.xml'), 'utf8');
  return [...pom.matchAll(/<module>\.\.\/(illuminatio-[^<]+)<\/module>/g)].map((match) => match[1]);
}

function category(label, position, link) {
  return JSON.stringify({label, position, ...(link ? {link} : {})}, null, 2) + '\n';
}

async function writeGeneratedNavigation(modules, sourceManifest) {
  await writeFile(
    path.join(generatedDocsRoot, '_category_.json'),
    category('Documentation', 1, {type: 'doc', id: 'index'}),
  );
  await writeFile(
    path.join(generatedDocsRoot, 'platform', '_category_.json'),
    category('Platform', 1, {type: 'doc', id: 'platform/index'}),
  );
  await writeFile(
    path.join(generatedDocsRoot, 'modules', '_category_.json'),
    category('Modules', 2, {type: 'doc', id: 'modules/index'}),
  );

  const moduleRows = modules
    .map((module) => {
      const source = sourceManifest.sources.find((candidate) => candidate.name === module);
      const state = source?.documentation === 'complete' ? 'Module documentation' : 'Documentation pending';
      return `| [\`${module}\`](/docs/modules/${module}) | ${state} |`;
    })
    .join('\n');

  await writeFile(
    path.join(generatedDocsRoot, 'index.md'),
    `---\nslug: /\ntitle: Engineering handbook\n---\n\n# Illuminatio engineering handbook\n\n` +
      `Understand how the platform is designed, how work moves through it, and how each module contributes to a complete business process. The handbook is assembled from documentation owned by the parent and module repositories.\n\n` +
      `## Start with the platform\n\n` +
      `- [System overview](/docs/platform/overview/system-overview) — the runtime topology, capability boundaries and principal actors.\n` +
      `- [Module capability map](/docs/platform/overview/module-capability-map) — what each module owns and when to use it.\n` +
      `- [Design fundamentals](/docs/platform/architecture/design-fundamentals) — the shared architecture pattern and why every module follows it.\n` +
      `- [Module dependencies and shared capabilities](/docs/platform/architecture/module-dependencies-and-shared-capabilities) — the build tree, runtime collaboration graph and cross-cutting capability plane.\n\n` +
      `## Follow the processing\n\n` +
      `- [Processing, rules and workflows](/docs/platform/architecture/processing-rules-workflows)\n` +
      `- [Trade to settlement](/docs/platform/overview/business-flows/trade-to-settlement)\n` +
      `- [Treasury, charges and payments](/docs/platform/overview/business-flows/treasury-charges-payments)\n` +
      `- [External gateway flows](/docs/platform/overview/business-flows/external-gateways)\n` +
      `- [Portfolio evidence to governed submission](/docs/platform/overview/business-flows/portfolio-decision-to-submission)\n\n` +
      `## Build and operate\n\n` +
      `- [Develop and compose an application](/docs/platform/architecture/service-composition-and-development) — choose an independent service or modular standalone application and wire the required Common capabilities.\n` +
      `- [Use AI productively](/docs/platform/architecture/ai-assisted-development) — give agents useful context, work in evidence-backed increments, and review generated changes safely.\n` +
      `- [Adopt Common in a service](/docs/modules/illuminatio-common/building-a-service-with-common) — annotations, properties, schemas, application contracts and tests.\n` +
      `- [Build a modular standalone application](/docs/modules/illuminatio-common/building-a-standalone-service) — complete Maven, Spring Boot, Liquibase, Docker and Compose example.\n` +
      `- [Deployment topologies and runbooks](/docs/platform/operations/deployment-topologies) — Local DEV, complete multi-service, Local Linux, Hetzner and provider-neutral deployments.\n` +
      `- [Module documentation](/docs/modules)\n` +
      `- [API reference catalogue](/docs/platform/api)\n` +
      `- [Discover APIs and use Insomnia](/docs/platform/api/using-apis-with-insomnia)\n` +
      `- [Official framework and tool references](/docs/platform/reference/external-technology-documentation) — version-aware upstream documentation for the technologies used by Illuminatio.\n` +
      `- [Deployment environments](/docs/platform/operations/deployment-environments)\n`,
  );
  await writeFile(
    path.join(generatedDocsRoot, 'modules', 'index.md'),
    `---\ntitle: Modules\n---\n\n# Illuminatio modules\n\n` +
      `Each module owns a bounded capability. Its documentation explains what the capability does, when to use it, the processing and integration flows it participates in, its deployment behavior, and links to source-owned API references and live discovery where configured.\n\n` +
      `| Module | Documentation state |\n|---|---|\n${moduleRows}\n`,
  );

  const sourceRows = sourceManifest.sources
    .map((source) => `| \`${source.name}\` | \`${source.commit.slice(0, 12)}\` | \`${source.branch}\` | ${source.dirty ? 'dirty local snapshot' : 'clean'} |`)
    .join('\n');
  await writeFile(
    path.join(generatedDocsRoot, 'build-info.md'),
    `---\ntitle: Build information\n---\n\n# Documentation source revisions\n\n` +
      `Generated from the following repository revisions. Release builds reject dirty sources.\n\n` +
      `| Repository | Commit | Branch | State |\n|---|---|---|---|\n${sourceRows}\n`,
  );
}

async function main() {
  const parentRoot = path.join(developmentsRoot, 'illuminatio-parent');
  const parent = repositoryInfo(parentRoot);
  const modules = await moduleNames(parentRoot);
  const repositories = [parent, ...modules.map((module) => repositoryInfo(path.join(developmentsRoot, module)))];

  const dirtyRepositories = repositories.filter((repository) => repository.dirty);
  if (dirtyRepositories.length > 0 && !allowDirty) {
    throw new Error(
      `Release collection requires clean sources. Dirty repositories: ${dirtyRepositories.map((item) => item.name).join(', ')}`,
    );
  }

  await rm(generatedRoot, {recursive: true, force: true});
  await mkdir(path.join(generatedDocsRoot, 'platform'), {recursive: true});
  await mkdir(path.join(generatedDocsRoot, 'modules'), {recursive: true});

  const records = [];
  const sourceToDestination = new Map();
  await collectTree(parent, path.join(parentRoot, 'docs'), path.join(generatedDocsRoot, 'platform'), records, sourceToDestination);

  const sources = [{...parent, documentation: 'complete'}];
  for (const module of modules) {
    const repository = repositories.find((candidate) => candidate.name === module);
    const sourceDocs = path.join(repository.path, 'docs');
    const destination = path.join(generatedDocsRoot, 'modules', module);
    const servicePage = path.join(sourceDocs, 'README.md');
    await mkdir(destination, {recursive: true});
    await writeFile(
      path.join(destination, '_category_.json'),
      category(module, 1, {type: 'doc', id: `modules/${module}/index`}),
    );
    if (existsSync(servicePage)) {
      await collectTree(repository, sourceDocs, destination, records, sourceToDestination);
      sources.push({...repository, documentation: 'complete'});
    } else {
      const rootReadme = path.join(repository.path, 'README.md');
      const rootReadmeUrl = existsSync(rootReadme) ? linkToSource(repository, rootReadme) : repository.remote;
      await writeFile(
        path.join(destination, 'index.md'),
        `---\ntitle: ${module}\n---\n\n# ${module}\n\n` +
          `Module documentation is pending owner review.\n\n` +
          `- [Repository](${repository.remote})\n` +
          `- [Current root README](${rootReadmeUrl})\n` +
          `- [Platform service catalogue](/docs/platform/services)\n`,
      );
      sources.push({...repository, documentation: 'pending'});
    }
  }

  await writeCollectedFiles(records, sourceToDestination, repositories);

  const sourceManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    allowDirty,
    sources: sources.map(({path: ignoredPath, remote, ...source}) => ({...source, repository: remote})),
  };
  await writeGeneratedNavigation(modules, sourceManifest);
  await writeFile(path.join(generatedRoot, 'source-manifest.json'), JSON.stringify(sourceManifest, null, 2) + '\n');

  if (writeLock) {
    const lock = {
      schemaVersion: 1,
      sources: sourceManifest.sources.map(({dirty: ignoredDirty, documentation: ignoredDocumentation, ...source}) => source),
    };
    await writeFile(path.join(documentsRoot, 'docs-sources.lock.json'), JSON.stringify(lock, null, 2) + '\n');
  }

  const complete = sources.filter((source) => source.documentation === 'complete').length - 1;
  console.log(`Collected platform documentation and ${complete}/${modules.length} module documentation trees.`);
  if (dirtyRepositories.length > 0) {
    console.warn(`Local snapshot includes dirty sources: ${dirtyRepositories.map((item) => item.name).join(', ')}`);
  }
}

await main();
