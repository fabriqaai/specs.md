/**
 * Hierarchical standards: constitution is root-only; everything else
 * resolves by nearest declared scope. Module files live under the
 * artifact root so scripts never write outside it.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

const BUNDLED_STANDARDS = path.join(lib.REFERENCES, 'standards');
const BUNDLED_NLSPEC = path.join(lib.REFERENCES, 'nlspec.md');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'vendor',
  'target',
  '.next',
  '.cache',
  '.turbo',
  '.output',
]);

const MANIFEST_NAMES = [
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'requirements.txt',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Gemfile',
  'composer.json',
  'mix.exs',
];

const SOURCE_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.cs',
  '.rb',
  '.php',
  '.swift',
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.vue',
  '.svelte',
]);

const MONOREPO_MARKERS = [
  'pnpm-workspace.yaml',
  'lerna.json',
  'nx.json',
  'turbo.json',
  'rush.json',
  'go.work',
];

const MODULE_PARENTS = ['packages', 'apps', 'services', 'libs', 'modules'];

function standardsConfig(contract) {
  return (contract && contract.standards) || {};
}

function constitutionId(contract) {
  return standardsConfig(contract).constitution_id || 'constitution';
}

function isConstitutionId(id, contract) {
  return String(id) === constitutionId(contract);
}

function enforcementTiers(contract) {
  return standardsConfig(contract).enforcement_tiers || ['principle', 'review', 'mechanical'];
}

function overridableIds(contract) {
  return (standardsConfig(contract).overridable || []).slice();
}

function shippedIds(contract) {
  return (standardsConfig(contract).shipped || []).slice();
}

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function rootStandardsDir(rootPath, contract) {
  return path.join(lib.artifactRoot(rootPath, contract), 'standards');
}

function scopesDir(rootPath, contract) {
  return path.join(rootStandardsDir(rootPath, contract), 'scopes');
}

function standardPath(rootPath, id, scope, contract) {
  lib.assertSafeId(id, 'standard id');
  if (!scope || scope === 'root') {
    return path.join(rootStandardsDir(rootPath, contract), `${id}.md`);
  }
  const parts = String(scope)
    .split(/[\\/]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length || parts.some((p) => p === '..' || p === '.')) {
    throw lib.terminal(
      'SCOPE_INVALID',
      `Scope "${scope}" is not a safe module path.`,
      'Use a project-relative module path such as packages/api, with no parent segments.'
    );
  }
  return path.join(scopesDir(rootPath, contract), ...parts, `${id}.md`);
}

function isDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function listMdStems(dir) {
  if (!isDir(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.slice(0, -3))
    .sort();
}

function hasManifest(dir) {
  return MANIFEST_NAMES.some((name) => isFile(path.join(dir, name)));
}

function renderTemplate(text, vars) {
  return String(text).replace(/\{\{([a-z0-9_]+)\}\}/gi, (_, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

function assertTier(tier, contract) {
  const allowed = enforcementTiers(contract);
  if (!allowed.includes(tier)) {
    throw lib.terminal(
      'TIER_INVALID',
      `Enforcement tier "${tier}" is not in the contract.`,
      `Use one of: ${allowed.join(', ')}.`
    );
  }
}

function loadTemplate(id) {
  if (id === 'nlspec') {
    if (!isFile(BUNDLED_NLSPEC)) {
      throw lib.structural(
        'TEMPLATE_MISSING',
        'Shipped nlspec template is missing.',
        'Reinstall the specsmd plugin so flow-runtime/references/nlspec.md is present.'
      );
    }
    return fs.readFileSync(BUNDLED_NLSPEC, 'utf8');
  }
  const file = path.join(BUNDLED_STANDARDS, `${id}.md`);
  if (!isFile(file)) {
    throw lib.structural(
      'TEMPLATE_MISSING',
      `Shipped standard template "${id}" is missing.`,
      `Reinstall the specsmd plugin so flow-runtime/references/standards/${id}.md is present.`
    );
  }
  return fs.readFileSync(file, 'utf8');
}

function parseStandardText(text, filePath) {
  const parsed = lib.parseFrontmatter(text);
  if (!parsed) {
    throw lib.structural(
      'PARSE_FRONTMATTER',
      `No YAML frontmatter in ${filePath || 'standard'}.`,
      'Add a YAML frontmatter block with id, invariant, enforcement_tier, and remediation.'
    );
  }
  return { data: parsed.data || {}, body: parsed.body || '', path: filePath || null };
}

function readStandardFile(filePath) {
  if (!isFile(filePath)) return null;
  const parsed = parseStandardText(fs.readFileSync(filePath, 'utf8'), filePath);
  parsed.path = filePath;
  return parsed;
}

function defaultProposalVars(id, workspace) {
  const structure = (workspace && workspace.structure) || 'single';
  const defaults = {
    constitution: {
      invariant:
        'Rules in this constitution hold for every file in the project and cannot be waived by a module standard.',
    },
    'tech-stack': {
      invariant:
        'New work uses the language, runtime, and libraries declared for its scope. The declaration may be filled when the first stack choice is made.',
      language: 'not yet chosen',
      runtime: 'not yet chosen',
      package_manager: 'not yet chosen',
      framework: 'none declared',
    },
    coding: {
      invariant: 'Source in a given scope is consistent with the formatting, naming, and structure declared for that scope.',
      linter: 'not yet chosen',
      formatter: 'not yet chosen',
    },
    testing: {
      invariant: 'Changed behavior is covered by automated tests before a bolt completes.',
      test_runner: 'not yet chosen',
    },
    architecture: {
      invariant:
        structure === 'monorepo'
          ? 'New surfaces preserve the declared module boundaries of their scope.'
          : 'New surfaces preserve the declared architectural boundaries of their scope.',
      structure,
    },
  };
  return defaults[id] || {};
}

function proposalFromTemplate(id, vars, contract, scope) {
  const created = vars.created || lib.nowStamp();
  const text = renderTemplate(loadTemplate(id), { ...vars, created });
  const parsed = parseStandardText(text, `${id}.md`);
  const tier = parsed.data.enforcement_tier || 'principle';
  assertTier(tier, contract);
  return {
    id,
    title: parsed.data.title || id,
    scope: scope || 'root',
    kind: parsed.data.kind || (isConstitutionId(id, contract) ? 'constitution' : 'overridable'),
    override: isConstitutionId(id, contract) ? 'never' : parsed.data.override || 'allowed',
    enforcement_tier: tier,
    invariant: String(parsed.data.invariant || vars.invariant || '').trim(),
    remediation: String(parsed.data.remediation || '').trim(),
    values: vars,
    body: parsed.body,
    data: parsed.data,
  };
}

function collectIgnoreReason(scope, relPath) {
  return {
    scope,
    path: relPath,
    reason: 'constitution is never overridden; root always wins',
  };
}

function discoverModuleScopes(rootPath, contract) {
  const root = path.resolve(rootPath);
  const base = scopesDir(root, contract);
  const scopes = [];
  if (!isDir(base)) return scopes;

  function walk(dir, relParts) {
    const stems = listMdStems(dir);
    if (stems.length && relParts.length) {
      scopes.push({
        id: relParts.join('/'),
        directory: dir,
        ids: stems,
      });
    }
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === '..') continue;
      walk(path.join(dir, entry.name), relParts.concat(entry.name));
    }
  }

  walk(base, []);
  return scopes;
}

function listScopes(rootPath, contract) {
  const rootDir = rootStandardsDir(rootPath, contract);
  const scopes = [
    {
      id: 'root',
      directory: rootDir,
      ids: listMdStems(rootDir),
    },
  ];
  return scopes.concat(discoverModuleScopes(rootPath, contract));
}

function matchingScopes(rootPath, filePath, contract) {
  const root = path.resolve(rootPath);
  const abs = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath);
  const rel = posixRel(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw lib.terminal(
      'FILE_OUTSIDE_ROOT',
      `File "${filePath}" is outside the project root.`,
      'Pass a path inside the project to resolve standards.'
    );
  }
  const all = listScopes(root, contract);
  const matched = all.filter((scope) => {
    if (scope.id === 'root') return true;
    return rel === scope.id || rel.startsWith(scope.id + '/');
  });
  matched.sort((a, b) => {
    if (a.id === 'root') return 1;
    if (b.id === 'root') return -1;
    return b.id.length - a.id.length;
  });
  return { file: rel, scopes: matched };
}

function resolveOne(id, fileRel, scopes, rootPath, contract) {
  const constId = constitutionId(contract);
  if (id === constId) {
    const rootScope = scopes.find((s) => s.id === 'root') || {
      id: 'root',
      directory: rootStandardsDir(rootPath, contract),
    };
    const file = path.join(rootScope.directory, `${id}.md`);
    const ignored = [];
    for (const scope of scopes) {
      if (scope.id === 'root') continue;
      const nested = path.join(scope.directory, `${id}.md`);
      if (isFile(nested)) {
        ignored.push(collectIgnoreReason(scope.id, posixRel(path.resolve(rootPath), nested)));
      }
    }
    if (!isFile(file)) return null;
    const parsed = readStandardFile(file);
    return {
      id,
      title: parsed.data.title || id,
      scope: 'root',
      path: posixRel(path.resolve(rootPath), file),
      kind: 'constitution',
      override: 'never',
      enforcement_tier: parsed.data.enforcement_tier || 'review',
      invariant: parsed.data.invariant || '',
      remediation: parsed.data.remediation || '',
      won_because: 'constitution is never overridden; root always wins',
      ignored_overrides: ignored,
    };
  }

  for (const scope of scopes) {
    const file = path.join(scope.directory, `${id}.md`);
    if (!isFile(file)) continue;
    const parsed = readStandardFile(file);
    const nearer =
      scope.id === 'root'
        ? 'no nearer scope than root declares this standard'
        : `nearest scope ${scope.id} has ${id} (longest matching prefix of ${fileRel})`;
    return {
      id,
      title: parsed.data.title || id,
      scope: scope.id,
      path: posixRel(path.resolve(rootPath), file),
      kind: parsed.data.kind || 'overridable',
      override: parsed.data.override || 'allowed',
      enforcement_tier: parsed.data.enforcement_tier || 'principle',
      invariant: parsed.data.invariant || '',
      remediation: parsed.data.remediation || '',
      won_because: nearer,
      ignored_overrides: [],
    };
  }
  return null;
}

function resolveStandardsForFile(rootPath, filePath, contract) {
  const c = contract || lib.loadContract();
  const { file, scopes } = matchingScopes(rootPath, filePath, c);
  const ids = new Set();
  for (const scope of scopes) {
    for (const id of scope.ids || []) {
      if (id === constitutionId(c) && scope.id !== 'root') continue;
      ids.add(id);
    }
  }
  const standards = [];
  for (const id of [...ids].sort()) {
    const resolved = resolveOne(id, file, scopes, rootPath, c);
    if (resolved) standards.push(resolved);
  }
  return {
    file,
    scopes_considered: scopes.map((scope) => ({
      id: scope.id,
      path: posixRel(path.resolve(rootPath), scope.directory),
      reason:
        scope.id === 'root'
          ? 'project root scope'
          : `declared scope ${scope.id} prefixes ${file}`,
    })),
    standards,
  };
}

function formatViolation(opts) {
  const standard = opts.standard;
  const file = opts.file;
  const change = opts.change;
  if (!standard || !file || !change) {
    throw lib.terminal(
      'VIOLATION_INCOMPLETE',
      'A violation needs a standard, a file, and the change that satisfies it.',
      'Pass --standard, --file, and --change.'
    );
  }
  const rec = typeof standard === 'string' ? { id: standard, title: '', remediation: '' } : standard;
  const name = rec.title && rec.title !== rec.id ? `${rec.id} (${rec.title})` : rec.id;
  const template =
    rec.remediation && String(rec.remediation).trim()
      ? String(rec.remediation).trim()
      : 'To satisfy {standard} in {file}, {change}.';
  return template
    .replace(/\{standard\}/g, name)
    .replace(/\{file\}/g, file)
    .replace(/\{change\}/g, change)
    .replace(/\{invariant\}/g, rec.invariant || '');
}

function reportViolation(rootPath, opts, contract) {
  const c = contract || lib.loadContract();
  const file = opts.file;
  const id = opts.standard;
  const change = opts.change;
  let resolved = { id, title: id, remediation: '' };
  if (file && id) {
    const set = resolveStandardsForFile(rootPath, file, c);
    resolved = set.standards.find((s) => s.id === id) || resolved;
  }
  const remediation = formatViolation({ standard: resolved, file, change });
  return {
    standard: resolved.id || id,
    file,
    change,
    remediation,
  };
}

function writeStandard(rootPath, proposal, contract) {
  const c = contract || lib.loadContract();
  const id = proposal.id;
  const scope = proposal.scope || 'root';
  if (isConstitutionId(id, c) && scope !== 'root') {
    throw lib.terminal(
      'CONSTITUTION_IMMUNE',
      `Constitution cannot be recorded at module scope "${scope}".`,
      `Write constitution only at ${posixRel(path.resolve(rootPath), standardPath(rootPath, id, 'root', c))}.`
    );
  }
  const file = standardPath(rootPath, id, scope, c);
  lib.assertInsideRoot(rootPath, file, c);
  if (isFile(file) && !proposal.overwrite) {
    return { id, scope, path: posixRel(path.resolve(rootPath), file), action: 'exists' };
  }
  const created = proposal.created || lib.nowStamp();
  const vars = Object.assign({}, proposal.values || {}, {
    created,
    invariant: proposal.invariant,
  });
  let body = proposal.body;
  let data = proposal.data;
  if (!body || !data) {
    const rendered = parseStandardText(
      renderTemplate(loadTemplate(id), vars),
      file
    );
    data = rendered.data;
    body = rendered.body;
  }
  data = Object.assign({}, data, {
    id,
    title: proposal.title || data.title || id,
    status: proposal.status || data.status || 'active',
    kind: isConstitutionId(id, c) ? 'constitution' : proposal.kind || data.kind || 'overridable',
    override: isConstitutionId(id, c) ? 'never' : proposal.override || data.override || 'allowed',
    enforcement_tier: proposal.enforcement_tier || data.enforcement_tier || 'principle',
    invariant: proposal.invariant || data.invariant,
    remediation: proposal.remediation || data.remediation,
    created: data.created || created,
  });
  if (scope !== 'root') data.scope = scope;
  assertTier(data.enforcement_tier, c);
  lib.assertStatus(data.status, c);
  lib.writeMarkdown(file, data, body.endsWith('\n') ? body : body + '\n', rootPath, c);
  return { id, scope, path: posixRel(path.resolve(rootPath), file), action: 'written' };
}

function recordProposals(rootPath, proposals, contract) {
  const written = [];
  for (const proposal of proposals || []) {
    written.push(writeStandard(rootPath, proposal, contract));
  }
  return written;
}

function ensureFoundationStandards(rootPath, contract) {
  const c = contract || lib.loadContract();
  const out = [];
  const constitution = proposalFromTemplate(
    constitutionId(c),
    defaultProposalVars(constitutionId(c), { structure: 'single' }),
    c,
    'root'
  );
  out.push(writeStandard(rootPath, constitution, c));
  const nlspecPath = path.join(rootStandardsDir(rootPath, c), 'nlspec.md');
  if (!isFile(nlspecPath) && isFile(BUNDLED_NLSPEC)) {
    lib.assertInsideRoot(rootPath, nlspecPath, c);
    fs.mkdirSync(path.dirname(nlspecPath), { recursive: true });
    fs.copyFileSync(BUNDLED_NLSPEC, nlspecPath);
    out.push({ id: 'nlspec', scope: 'root', path: posixRel(path.resolve(rootPath), nlspecPath), action: 'written' });
  } else if (isFile(nlspecPath)) {
    out.push({ id: 'nlspec', scope: 'root', path: posixRel(path.resolve(rootPath), nlspecPath), action: 'exists' });
  }
  return out;
}

function defaultProposals(workspace, contract) {
  const c = contract || lib.loadContract();
  const ids = overridableIds(c).filter((id) => id !== 'nlspec');
  return ids.map((id) => proposalFromTemplate(id, defaultProposalVars(id, workspace), c, 'root'));
}

function walkLimited(dir, onFile, depth, acc) {
  if (acc.stop || depth > 6) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (acc.stop) return;
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkLimited(full, onFile, depth + 1, acc);
    } else if (entry.isFile()) {
      onFile(full, entry.name, acc);
    }
  }
}

function listChildModules(root, parentRel) {
  const dir = path.join(root, parentRel);
  if (!isDir(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const child = path.join(dir, name);
    if (isDir(child) && hasManifest(child)) {
      out.push(`${parentRel}/${name}`.split(path.sep).join('/'));
    }
  }
  return out;
}

function expandWorkspacePattern(root, pattern) {
  const cleaned = String(pattern || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '');
  if (!cleaned || cleaned.startsWith('!') || cleaned.includes('..')) return [];
  if (cleaned.endsWith('/*')) {
    return listChildModules(root, cleaned.slice(0, -2));
  }
  const abs = path.join(root, cleaned);
  if (isDir(abs) && hasManifest(abs)) return [cleaned.split(path.sep).join('/')];
  return [];
}

function detectModules(root, evidence) {
  const modules = new Set();
  const pkg = readJson(path.join(root, 'package.json'));
  if (pkg && pkg.workspaces) {
    evidence.push('package.json#workspaces');
    const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || [];
    for (const pattern of patterns) {
      for (const mod of expandWorkspacePattern(root, pattern)) modules.add(mod);
    }
  }
  const pnpm = path.join(root, 'pnpm-workspace.yaml');
  if (isFile(pnpm)) {
    evidence.push('pnpm-workspace.yaml');
    try {
      const data = lib.parseYaml(fs.readFileSync(pnpm, 'utf8'));
      const patterns = (data && data.packages) || [];
      for (const pattern of Array.isArray(patterns) ? patterns : []) {
        for (const mod of expandWorkspacePattern(root, pattern)) modules.add(mod);
      }
    } catch {
      // fall through to directory scan
    }
  }
  for (const parent of MODULE_PARENTS) {
    for (const mod of listChildModules(root, parent)) modules.add(mod);
  }
  return [...modules].sort();
}

function detectWorkspace(rootPath) {
  const root = path.resolve(rootPath);
  const evidence = [];
  let hasManifestFile = false;
  let hasSource = false;

  for (const name of MANIFEST_NAMES) {
    if (isFile(path.join(root, name))) {
      hasManifestFile = true;
      evidence.push(name);
    }
  }
  for (const name of MONOREPO_MARKERS) {
    if (isFile(path.join(root, name))) evidence.push(name);
  }

  const cargo = path.join(root, 'Cargo.toml');
  if (isFile(cargo) && /\[workspace\]/.test(fs.readFileSync(cargo, 'utf8'))) {
    evidence.push('Cargo.toml#workspace');
  }

  walkLimited(
    root,
    (full, name, acc) => {
      if (SOURCE_EXT.has(path.extname(name))) {
        hasSource = true;
        acc.stop = true;
      }
    },
    0,
    { stop: false }
  );

  const modules = detectModules(root, evidence);
  const structure = modules.length > 0 || MONOREPO_MARKERS.some((name) => isFile(path.join(root, name))) || evidence.includes('package.json#workspaces') || evidence.includes('Cargo.toml#workspace')
    ? 'monorepo'
    : 'single';
  if (structure === 'monorepo' && !evidence.includes('monorepo')) {
    if (modules.length) evidence.push(`modules:${modules.join(',')}`);
  }

  const uniqueEvidence = [...new Set(evidence)].sort();
  return {
    kind: hasManifestFile || hasSource || modules.length > 0 ? 'existing' : 'greenfield',
    structure,
    modules: modules.map((p) => ({ path: p })),
    evidence: uniqueEvidence,
  };
}

function detectStack(dir, relHint) {
  const sources = [];
  const pkg = readJson(path.join(dir, 'package.json'));
  if (pkg) sources.push(relHint ? `${relHint}/package.json` : 'package.json');

  let language = 'not yet chosen';
  let runtime = 'not yet chosen';
  if (isFile(path.join(dir, 'tsconfig.json')) || (pkg && ((pkg.devDependencies && pkg.devDependencies.typescript) || (pkg.dependencies && pkg.dependencies.typescript)))) {
    language = 'TypeScript';
    runtime = 'Node';
    if (isFile(path.join(dir, 'tsconfig.json'))) sources.push(relHint ? `${relHint}/tsconfig.json` : 'tsconfig.json');
  } else if (pkg) {
    language = 'JavaScript';
    runtime = 'Node';
  } else if (isFile(path.join(dir, 'Cargo.toml'))) {
    language = 'Rust';
    runtime = 'cargo';
    sources.push(relHint ? `${relHint}/Cargo.toml` : 'Cargo.toml');
  } else if (isFile(path.join(dir, 'go.mod'))) {
    language = 'Go';
    runtime = 'go';
    sources.push(relHint ? `${relHint}/go.mod` : 'go.mod');
  } else if (isFile(path.join(dir, 'pyproject.toml')) || isFile(path.join(dir, 'requirements.txt'))) {
    language = 'Python';
    runtime = 'python';
    sources.push(
      isFile(path.join(dir, 'pyproject.toml'))
        ? relHint
          ? `${relHint}/pyproject.toml`
          : 'pyproject.toml'
        : relHint
          ? `${relHint}/requirements.txt`
          : 'requirements.txt'
    );
  } else if (isFile(path.join(dir, 'pom.xml')) || isFile(path.join(dir, 'build.gradle')) || isFile(path.join(dir, 'build.gradle.kts'))) {
    language = 'Java';
    runtime = 'jvm';
    sources.push(
      isFile(path.join(dir, 'pom.xml'))
        ? relHint
          ? `${relHint}/pom.xml`
          : 'pom.xml'
        : relHint
          ? `${relHint}/build.gradle`
          : 'build.gradle'
    );
  } else if (isFile(path.join(dir, 'Gemfile'))) {
    language = 'Ruby';
    runtime = 'ruby';
    sources.push(relHint ? `${relHint}/Gemfile` : 'Gemfile');
  }

  let packageManager = 'not yet chosen';
  const lockToPm = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
    ['Cargo.lock', 'cargo'],
    ['poetry.lock', 'poetry'],
    ['Gemfile.lock', 'bundler'],
  ];
  for (const [lock, pm] of lockToPm) {
    if (isFile(path.join(dir, lock))) {
      packageManager = pm;
      sources.push(relHint ? `${relHint}/${lock}` : lock);
      break;
    }
  }
  if (packageManager === 'not yet chosen' && pkg) packageManager = 'npm';

  const deps = Object.assign({}, (pkg && pkg.dependencies) || {}, (pkg && pkg.devDependencies) || {});
  const frameworkMarks = [
    ['next', 'Next.js'],
    ['react', 'React'],
    ['vue', 'Vue'],
    ['@nestjs/core', 'Nest'],
    ['express', 'Express'],
    ['fastify', 'Fastify'],
  ];
  let framework = 'none declared';
  for (const [dep, label] of frameworkMarks) {
    if (deps[dep]) {
      framework = label;
      break;
    }
  }

  let testRunner = 'not yet chosen';
  const scripts = (pkg && pkg.scripts) || {};
  const scriptBlob = Object.values(scripts).join(' ');
  if (deps.vitest || /\bvitest\b/.test(scriptBlob)) testRunner = 'vitest';
  else if (deps.jest || /\bjest\b/.test(scriptBlob)) testRunner = 'jest';
  else if (deps.mocha || /\bmocha\b/.test(scriptBlob)) testRunner = 'mocha';
  else if (language === 'Python') testRunner = 'pytest';
  else if (language === 'Go') testRunner = 'go test';
  else if (language === 'Rust') testRunner = 'cargo test';

  let linter = 'not yet chosen';
  let formatter = 'not yet chosen';
  if (
    isFile(path.join(dir, '.eslintrc.json')) ||
    isFile(path.join(dir, '.eslintrc.js')) ||
    isFile(path.join(dir, 'eslint.config.js')) ||
    isFile(path.join(dir, 'eslint.config.mjs')) ||
    deps.eslint
  ) {
    linter = 'eslint';
  } else if (isFile(path.join(dir, 'ruff.toml')) || isFile(path.join(dir, '.ruff.toml'))) {
    linter = 'ruff';
  } else if (isFile(path.join(dir, '.golangci.yml'))) {
    linter = 'golangci-lint';
  }
  if (
    isFile(path.join(dir, '.prettierrc')) ||
    isFile(path.join(dir, '.prettierrc.json')) ||
    isFile(path.join(dir, 'prettier.config.js')) ||
    deps.prettier
  ) {
    formatter = 'prettier';
  } else if (language === 'Rust') {
    formatter = 'rustfmt';
  } else if (language === 'Go') {
    formatter = 'gofmt';
  }

  return {
    language,
    runtime,
    package_manager: packageManager,
    framework,
    test_runner: testRunner,
    linter,
    formatter,
    inferred_from: [...new Set(sources)].sort(),
  };
}

function stackInvariant(stack, scope) {
  const where = scope && scope !== 'root' ? ` in ${scope}` : '';
  if (stack.language === 'not yet chosen') {
    return `New work${where} uses the language, runtime, and libraries declared for its scope.`;
  }
  const framework = stack.framework && stack.framework !== 'none declared' ? ` with ${stack.framework}` : '';
  return `New work${where} uses ${stack.language} on ${stack.runtime}${framework}.`;
}

function codingInvariant(stack, scope) {
  const where = scope && scope !== 'root' ? ` in ${scope}` : '';
  const bits = [];
  if (stack.formatter && stack.formatter !== 'not yet chosen') bits.push(stack.formatter);
  if (stack.linter && stack.linter !== 'not yet chosen') bits.push(stack.linter);
  if (bits.length) {
    return `Source${where} stays consistent with ${bits.join(' and ')}.`;
  }
  return `Source${where} is consistent with the formatting, naming, and structure declared for that scope.`;
}

function testingInvariant(stack) {
  if (stack.test_runner && stack.test_runner !== 'not yet chosen') {
    return `Changed behavior is covered by automated ${stack.test_runner} tests before a bolt completes.`;
  }
  return 'Changed behavior is covered by automated tests before a bolt completes.';
}

function architectureInvariant(workspace, scope) {
  if (scope && scope !== 'root') {
    return `New surfaces in ${scope} preserve that module's declared boundary.`;
  }
  if (workspace.structure === 'monorepo') {
    return 'New surfaces preserve the declared module boundaries of their scope.';
  }
  return 'New surfaces preserve the declared architectural boundaries of their scope.';
}

function inferStandards(rootPath, workspace, contract) {
  const c = contract || lib.loadContract();
  const root = path.resolve(rootPath);
  const ws = workspace || detectWorkspace(root);
  const rootStack = detectStack(root, '');
  const proposals = [];

  const push = (id, scope, vars) => {
    const proposal = proposalFromTemplate(id, vars, c, scope);
    proposal.inferred_from = vars.inferred_from || [];
    proposal.values = vars;
    proposals.push(proposal);
  };

  push('tech-stack', 'root', {
    ...defaultProposalVars('tech-stack', ws),
    ...rootStack,
    invariant: stackInvariant(rootStack, 'root'),
  });
  push('coding', 'root', {
    ...defaultProposalVars('coding', ws),
    ...rootStack,
    invariant: codingInvariant(rootStack, 'root'),
  });
  push('testing', 'root', {
    ...defaultProposalVars('testing', ws),
    ...rootStack,
    invariant: testingInvariant(rootStack),
  });
  push('architecture', 'root', {
    ...defaultProposalVars('architecture', ws),
    structure: ws.structure,
    invariant: architectureInvariant(ws, 'root'),
    inferred_from: ws.evidence.slice(),
  });

  if (ws.structure === 'monorepo') {
    for (const mod of ws.modules || []) {
      const stack = detectStack(path.join(root, mod.path), mod.path);
      if (stack.language === rootStack.language && stack.runtime === rootStack.runtime && stack.framework === rootStack.framework) {
        continue;
      }
      if (stack.language === 'not yet chosen') continue;
      push('tech-stack', mod.path, {
        ...defaultProposalVars('tech-stack', ws),
        ...stack,
        invariant: stackInvariant(stack, mod.path),
      });
    }
  }

  proposals.sort((a, b) => {
    if (a.scope === b.scope) return a.id.localeCompare(b.id);
    if (a.scope === 'root') return -1;
    if (b.scope === 'root') return 1;
    return a.scope.localeCompare(b.scope) || a.id.localeCompare(b.id);
  });
  return proposals;
}

function publicProposal(proposal) {
  return {
    id: proposal.id,
    title: proposal.title,
    scope: proposal.scope,
    invariant: proposal.invariant,
    enforcement_tier: proposal.enforcement_tier,
    remediation: proposal.remediation,
    inferred_from: proposal.inferred_from || [],
    values: proposal.values || {},
  };
}

module.exports = {
  BUNDLED_STANDARDS,
  constitutionId,
  isConstitutionId,
  enforcementTiers,
  shippedIds,
  overridableIds,
  standardPath,
  listScopes,
  resolveStandardsForFile,
  formatViolation,
  reportViolation,
  writeStandard,
  recordProposals,
  ensureFoundationStandards,
  defaultProposals,
  detectWorkspace,
  inferStandards,
  proposalFromTemplate,
  publicProposal,
  loadTemplate,
  parseStandardText,
};
