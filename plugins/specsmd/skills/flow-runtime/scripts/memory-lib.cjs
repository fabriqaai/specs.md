/**
 * Memory lifecycle: semantic current truth vs episodic history.
 * Pointers go up one hop to a semantic document; they never chain sideways.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

const HEADER_RE = /^>\s*Historical record \(([^)]+)\)\.\s*Current truth:\s*(.+?)\.\s*$/m;
const INDEX_LINE_RE =
  /^\s*-\s*\[([^\]]+)\]\(([^)]+)\)(?:\s+[—–-]\s*(?:consult(?:\s+when)?\s*)?(.*))?\s*$/i;
const COMPACT_LINE_RE = /^\s*-\s*\[([^\]]+)\]\(([^)]+)\)(?:\s+[—–-]\s*(\S+))?(?:\s+[—–-]\s*(.*))?\s*$/;

function memoryConfig(contract) {
  const c = contract || lib.loadContract();
  const section = c.memory_class || {};
  return {
    header: section.header || 'Historical record ({date}). Current truth: {semantic_document}.',
    defaultCurrentTruth: section.default_current_truth || 'project.md',
    archivePath: section.archive_path || 'archive',
    retentionHorizon: section.retention_horizon || 'P90D',
    compactIndex: section.compact_index || 'bolts/index.md',
  };
}

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function artifactRel(rootPath, filePath, contract) {
  return posixRel(lib.artifactRoot(rootPath, contract), filePath);
}

function projectRel(rootPath, filePath) {
  return posixRel(path.resolve(rootPath), filePath);
}

function formatHeader(date, pointer) {
  const day = String(date || lib.nowStamp()).slice(0, 10);
  const target = String(pointer || '').replace(/\.$/, '').trim();
  return `> Historical record (${day}). Current truth: ${target}.`;
}

function parseHistoricalHeader(body) {
  const m = String(body || '').match(HEADER_RE);
  if (!m) return null;
  return { date: m[1], current_truth: m[2].trim() };
}

function applyHistoricalHeader(body, date, pointer) {
  const line = formatHeader(date, pointer);
  const text = String(body == null ? '' : body);
  if (HEADER_RE.test(text)) return text.replace(HEADER_RE, line);
  const trimmed = text.replace(/^\uFEFF?[\s\r\n]*/, '');
  return trimmed ? `${line}\n\n${trimmed}` : `${line}\n`;
}

function stripHistoricalHeader(body) {
  return String(body || '').replace(HEADER_RE, '').replace(/^\uFEFF?[\s\r\n]*/, '');
}

function hasHistoricalHeader(body) {
  return Boolean(parseHistoricalHeader(body));
}

function classifyPointerTarget(relFromRoot) {
  const rel = String(relFromRoot || '').replace(/\\/g, '/');
  if (rel === 'project.md') return 'project';
  if (rel === 'decisions/index.md') return 'decisions_index';
  if (rel === 'bolts/index.md') return 'bolts_index';
  if (rel.startsWith('system/') && rel.endsWith('.md')) return 'system';
  if (rel.startsWith('standards/')) return 'standard';
  if (rel.startsWith('recipes/') && rel.endsWith('.yaml')) return 'recipe';
  if (rel.startsWith('decisions/') && rel.endsWith('.md')) return 'decision';
  if (/^bolts\/[^/]+\/bolt\.md$/.test(rel)) return 'bolt';
  if (/^intents\/[^/]+\/brief\.md$/.test(rel)) return 'intent';
  if (/^intents\/[^/]+\/work-items\/[^/]+\.md$/.test(rel)) return 'work_item';
  if (/^bolts\/[^/]+\//.test(rel)) return 'stage_artifact';
  return null;
}

function resolvePointerAbs(rootPath, pointer, contract) {
  if (!pointer) return null;
  const raw = String(pointer).trim();
  const root = lib.artifactRoot(rootPath, contract);
  const project = path.resolve(rootPath);
  const candidates = [];
  if (path.isAbsolute(raw)) candidates.push(raw);
  candidates.push(path.join(root, raw));
  candidates.push(path.join(project, raw));
  if (raw.startsWith('docs/specsmd/')) candidates.push(path.join(project, raw));
  for (const abs of candidates) {
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function inspectPointer(rootPath, pointer, contract) {
  const c = contract || lib.loadContract();
  const abs = resolvePointerAbs(rootPath, pointer, c);
  if (!abs) return { ok: false, reason: 'missing', pointer };
  const rel = artifactRel(rootPath, abs, c);
  const typeName = classifyPointerTarget(rel);
  if (!typeName) return { ok: false, reason: 'unknown', pointer, path: rel };
  let status = null;
  if (typeName === 'stage_artifact') {
    const boltId = rel.split('/')[1];
    const boltFile = lib.boltPath(rootPath, boltId, c);
    if (fs.existsSync(boltFile)) {
      const bolt = lib.readMarkdown(boltFile);
      status = bolt && bolt.data && bolt.data.status;
    }
  } else if (['intent', 'work_item', 'bolt', 'decision', 'system', 'project'].includes(typeName)) {
    try {
      const md = lib.readMarkdown(abs);
      status = md && md.data && md.data.status;
    } catch {
      status = null;
    }
  }
  const memoryClass = lib.memoryClassFor(typeName, status, c);
  return {
    ok: memoryClass === 'semantic',
    reason: memoryClass === 'semantic' ? null : 'not_semantic',
    pointer,
    path: rel,
    type: typeName,
    status,
    memory_class: memoryClass,
  };
}

function chooseCurrentTruth(rootPath, preferred, contract) {
  const c = contract || lib.loadContract();
  const cfg = memoryConfig(c);
  const candidates = [];
  for (const item of Array.isArray(preferred) ? preferred : [preferred]) {
    if (item) candidates.push(item);
  }
  candidates.push(cfg.defaultCurrentTruth);
  for (const pointer of candidates) {
    const info = inspectPointer(rootPath, pointer, c);
    if (info.ok) return info.path;
  }
  return cfg.defaultCurrentTruth;
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(dir, e.name));
}

function listSystemDocs(rootPath, contract) {
  const c = contract || lib.loadContract();
  const dir = path.join(lib.artifactRoot(rootPath, c), 'system');
  const out = [];
  for (const file of listMdFiles(dir)) {
    const md = lib.readMarkdown(file);
    if (!md) continue;
    out.push({
      ...md.data,
      path: file,
      body: md.body,
      claimed_scope: md.data.claimed_scope,
    });
  }
  return out;
}

function listStandards(rootPath, contract) {
  const c = contract || lib.loadContract();
  const dir = path.join(lib.artifactRoot(rootPath, c), 'standards');
  return listMdFiles(dir).map((file) => ({
    id: path.basename(file, '.md'),
    path: file,
    rel: artifactRel(rootPath, file, c),
  }));
}

function decisionsIndexPath(rootPath, contract) {
  return path.join(lib.artifactRoot(rootPath, contract), 'decisions', 'index.md');
}

function parseIndexEntries(body) {
  const entries = [];
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(INDEX_LINE_RE);
    if (!m) continue;
    const hint = (m[3] || '').trim();
    entries.push({
      id: m[1].trim(),
      href: m[2].trim(),
      consult_when: hint.replace(/^consult\s+when\s+/i, '').trim(),
    });
  }
  return entries;
}

function renderDecisionsIndexBody(entries) {
  const lines = (entries || []).map((e) => {
    const hint = e.consult_when ? ` — consult when ${e.consult_when}` : '';
    return `- [${e.id}](${e.href})${hint}`;
  });
  return `# Decisions in force\n\n${lines.length ? lines.join('\n') + '\n' : '(none yet)\n'}`;
}

function readDecisionsIndex(rootPath, contract) {
  const c = contract || lib.loadContract();
  const file = decisionsIndexPath(rootPath, c);
  if (!fs.existsSync(file)) {
    return { path: file, data: { id: 'decisions-index', status: 'active' }, body: '', entries: [] };
  }
  const md = lib.readMarkdown(file);
  return { path: file, data: md.data || {}, body: md.body, entries: parseIndexEntries(md.body) };
}

function writeDecisionsIndex(rootPath, contract, data, entries) {
  const c = contract || lib.loadContract();
  const file = decisionsIndexPath(rootPath, c);
  const front = Object.assign({ id: 'decisions-index', status: 'active' }, data || {});
  lib.writeMarkdown(file, front, renderDecisionsIndexBody(entries), rootPath, c);
  return readDecisionsIndex(rootPath, c);
}

function indexHasDecision(index, id) {
  return (index.entries || []).some((e) => e.id === id);
}

function decisionPath(rootPath, id, contract) {
  return path.join(lib.artifactRoot(rootPath, contract), 'decisions', `${id}.md`);
}

function archivedDecisionPath(rootPath, id, contract) {
  const cfg = memoryConfig(contract);
  return path.join(lib.artifactRoot(rootPath, contract), cfg.archivePath, 'decisions', `${id}.md`);
}

function findDecisionFile(rootPath, id, contract) {
  const live = decisionPath(rootPath, id, contract);
  if (fs.existsSync(live)) return live;
  const archived = archivedDecisionPath(rootPath, id, contract);
  if (fs.existsSync(archived)) return archived;
  return null;
}

function listDecisions(rootPath, contract) {
  const c = contract || lib.loadContract();
  const root = lib.artifactRoot(rootPath, c);
  const files = listMdFiles(path.join(root, 'decisions')).filter(
    (f) => path.basename(f) !== 'index.md'
  );
  const archived = listMdFiles(path.join(root, memoryConfig(c).archivePath, 'decisions'));
  const out = [];
  for (const file of files.concat(archived)) {
    let md;
    try {
      md = lib.readMarkdown(file);
    } catch {
      continue;
    }
    if (!md) continue;
    out.push({
      ...md.data,
      path: file,
      body: md.body,
      archived: file.includes(`${path.sep}${memoryConfig(c).archivePath}${path.sep}`),
    });
  }
  return out;
}

function compactIndexPath(rootPath, contract) {
  const c = contract || lib.loadContract();
  return path.join(lib.artifactRoot(rootPath, c), memoryConfig(c).compactIndex);
}

function parseCompactEntries(body) {
  const entries = [];
  for (const line of String(body || '').split(/\r?\n/)) {
    const m = line.match(COMPACT_LINE_RE);
    if (!m) continue;
    entries.push({
      id: m[1].trim(),
      href: m[2].trim(),
      status: (m[3] || 'complete').trim(),
      completed: (m[4] || '').trim(),
    });
  }
  return entries;
}

function renderCompactBody(entries) {
  const lines = (entries || []).map((e) => {
    const status = e.status || 'complete';
    const when = e.completed ? ` — ${e.completed}` : '';
    return `- [${e.id}](${e.href}) — ${status}${when}`;
  });
  return `# Completed bolts\n\n${lines.length ? lines.join('\n') + '\n' : '(none yet)\n'}`;
}

function readCompactIndex(rootPath, contract) {
  const c = contract || lib.loadContract();
  const file = compactIndexPath(rootPath, c);
  if (!fs.existsSync(file)) {
    return { path: file, data: { id: 'bolts-index', status: 'active' }, body: '', entries: [] };
  }
  const md = lib.readMarkdown(file);
  return { path: file, data: md.data || {}, body: md.body, entries: parseCompactEntries(md.body) };
}

function upsertCompactBolt(rootPath, bolt, contract) {
  const c = contract || lib.loadContract();
  const current = readCompactIndex(rootPath, c);
  const id = bolt.id;
  const completed = String(bolt.completed || lib.nowStamp()).slice(0, 10);
  const entry = { id, href: `${id}/`, status: 'complete', completed };
  const entries = current.entries.filter((e) => e.id !== id);
  entries.push(entry);
  entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const data = Object.assign({ id: 'bolts-index', status: 'active' }, current.data);
  lib.writeMarkdown(current.path, data, renderCompactBody(entries), rootPath, c);
  return entry;
}

function scopeTokens(value) {
  const parts = lib.splitList(value);
  const out = [];
  for (const part of parts) {
    for (const token of String(part)
      .toLowerCase()
      .split(/[^a-z0-9]+/)) {
      if (token.length >= 2) out.push(token);
    }
  }
  return out;
}

function textHasToken(text, token) {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(String(text || ''));
}

function boltScopeHaystack(bolt, workItems) {
  // Only explicit scope — nlspec bodies describe behavior, not topics.
  const chunks = [];
  chunks.push(...lib.splitList(bolt && bolt.touched_scope));
  chunks.push(...lib.splitList(bolt && bolt.scope));
  for (const item of workItems || []) {
    chunks.push(...lib.splitList(item.scope));
    chunks.push(...lib.splitList(item.touched_scope));
  }
  return chunks.join(' ');
}

function systemDocMatches(doc, haystack) {
  const tokens = scopeTokens(doc.claimed_scope);
  if (!tokens.length) return false;
  return tokens.some((token) => textHasToken(haystack, token));
}

function matchSystemDocs(rootPath, bolt, workItems, contract) {
  const haystack = boltScopeHaystack(bolt, workItems);
  return listSystemDocs(rootPath, contract).filter((doc) => systemDocMatches(doc, haystack));
}

function normalizeProjection(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return { document: item, status: 'unreviewed' };
        return {
          document: item.document || item.id,
          path: item.path,
          status: item.status || 'unreviewed',
          verify: item.verify,
        };
      })
      .filter(Boolean);
  }
  return [];
}

function projectionItemsFor(boltId, matches) {
  return matches.map((doc) => ({
    document: doc.id || doc.name,
    path: `system/${path.basename(doc.path)}`,
    status: 'unreviewed',
    verify: `Confirm system/${path.basename(doc.path)} still states current reality after ${boltId}`,
  }));
}

function markProjection(items, reviewedIds, skipReview) {
  const reviewed = new Set(lib.splitList(reviewedIds).map((id) => String(id)));
  return items.map((item) => {
    const hit = reviewed.has(item.document) || reviewed.has(path.basename(item.path || '', '.md'));
    if (hit && !skipReview) return Object.assign({}, item, { status: 'reviewed' });
    return Object.assign({}, item, { status: skipReview || !hit ? 'declined' : item.status });
  });
}

function stampMarkdownFile(rootPath, filePath, date, pointer, contract) {
  const c = contract || lib.loadContract();
  lib.assertInsideRoot(rootPath, filePath, c);
  if (!fs.existsSync(filePath)) return false;
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = lib.parseFrontmatter(text);
  const nextBody = applyHistoricalHeader(parsed ? parsed.body : text, date, pointer);
  if (parsed) {
    lib.writeMarkdown(filePath, parsed.data, nextBody, rootPath, c);
  } else {
    fs.writeFileSync(filePath, nextBody.endsWith('\n') ? nextBody : `${nextBody}\n`, 'utf8');
  }
  return true;
}

function stampChangeRecord(rootPath, filePath, data, body, date, pointer, contract) {
  const stamped = applyHistoricalHeader(body, date, pointer);
  lib.writeMarkdown(filePath, data, stamped, rootPath, contract);
  return stamped;
}

function listStageArtifactFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'bolt.md') continue;
    const abs = path.join(dir, name);
    if (!fs.statSync(abs).isFile()) continue;
    if (!/\.(md|txt)$/i.test(name)) continue;
    out.push(abs);
  }
  return out;
}

function stampBoltEpisodic(rootPath, boltId, date, pointer, contract) {
  const c = contract || lib.loadContract();
  const dir = lib.boltDir(rootPath, boltId, c);
  const boltFile = lib.boltPath(rootPath, boltId, c);
  if (fs.existsSync(boltFile)) stampMarkdownFile(rootPath, boltFile, date, pointer, c);
  for (const file of listStageArtifactFiles(dir)) {
    stampMarkdownFile(rootPath, file, date, pointer, c);
  }
}

function isReflectedDiscovery(rootPath, discovery, contract) {
  const tokenSource = String(discovery || '');
  const tokens = scopeTokens(tokenSource);
  if (!tokens.length) return true;
  const docs = listSystemDocs(rootPath, contract);
  if (!docs.length) return false;
  for (const doc of docs) {
    const hay = [doc.id, doc.name, doc.purpose, doc.body, lib.splitList(doc.claimed_scope).join(' ')]
      .concat(doc.facts && typeof doc.facts === 'object' ? Object.values(doc.facts) : [])
      .join(' ');
    if (tokens.every((token) => textHasToken(hay, token)) || textHasToken(hay, tokenSource)) {
      return true;
    }
  }
  return false;
}

function uncapturedTruth(rootPath, artifact, contract) {
  const c = contract || lib.loadContract();
  const reasons = [];
  const kind = artifact.kind;
  if (kind === 'decision') {
    const index = readDecisionsIndex(rootPath, c);
    if (!indexHasDecision(index, artifact.id)) {
      reasons.push({
        kind: 'unindexed_decision',
        name: artifact.id,
        destination: projectRel(rootPath, decisionsIndexPath(rootPath, c)),
        message: `Decision ${artifact.id} is absent from the decisions index.`,
      });
    }
  }
  const discoveries = []
    .concat(lib.splitList(artifact.discoveries))
    .concat(lib.splitList(artifact.data && artifact.data.discoveries));
  for (const discovery of discoveries) {
    const reflectedIn = artifact.reflected_in || (artifact.data && artifact.data.reflected_in);
    if (reflectedIn && resolvePointerAbs(rootPath, reflectedIn, c)) continue;
    if (isReflectedDiscovery(rootPath, discovery, c)) continue;
    reasons.push({
      kind: 'unreflected_discovery',
      name: discovery,
      destination: projectRel(rootPath, path.join(lib.artifactRoot(rootPath, c), 'system')),
      message: `Discovery "${discovery}" changed behavior but is reflected in no semantic document.`,
    });
  }
  return reasons;
}

function archiveDest(rootPath, sourceAbs, contract) {
  const c = contract || lib.loadContract();
  const cfg = memoryConfig(c);
  const rel = artifactRel(rootPath, sourceAbs, c);
  if (rel.startsWith(`${cfg.archivePath}/`)) return sourceAbs;
  return path.join(lib.artifactRoot(rootPath, c), cfg.archivePath, rel);
}

function isArchivedPath(rootPath, filePath, contract) {
  const rel = artifactRel(rootPath, filePath, contract);
  return rel.split('/')[0] === memoryConfig(contract).archivePath;
}

function moveToArchive(rootPath, sourceAbs, contract) {
  const c = contract || lib.loadContract();
  const dest = archiveDest(rootPath, sourceAbs, c);
  if (path.resolve(sourceAbs) === path.resolve(dest)) return dest;
  lib.assertInsideRoot(rootPath, dest, c);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(sourceAbs, dest);
  return dest;
}

function factsOf(doc) {
  const facts = doc && doc.facts;
  if (!facts || typeof facts !== 'object' || Array.isArray(facts)) return {};
  return facts;
}

function normalizeClaims(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((claim) => {
      if (!claim) return null;
      if (typeof claim === 'string') return { path: claim };
      return {
        path: claim.path,
        contains: claim.contains,
        must_not_contain: claim.must_not_contain || claim.mustNotContain,
      };
    })
    .filter((claim) => claim && claim.path);
}

function checkClaims(rootPath, doc) {
  const failures = [];
  for (const claim of normalizeClaims(doc.claims)) {
    const abs = path.resolve(rootPath, claim.path);
    if (!fs.existsSync(abs)) {
      failures.push(Object.assign({}, claim, { reason: 'missing_file' }));
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    if (claim.contains && !text.includes(String(claim.contains))) {
      failures.push(Object.assign({}, claim, { reason: 'missing_text' }));
    }
    if (claim.must_not_contain && text.includes(String(claim.must_not_contain))) {
      failures.push(Object.assign({}, claim, { reason: 'forbidden_text' }));
    }
  }
  return failures;
}

const SOURCE_SKIP = new Set(['node_modules', '.git', 'dist', 'coverage', 'docs', 'archive', '.specsmd']);

function findScopedSourceFiles(rootPath, scopes, dir, depth, out) {
  if (depth > 5 || out.length > 40) return;
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SOURCE_SKIP.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findScopedSourceFiles(rootPath, scopes, abs, depth + 1, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const rel = posixRel(rootPath, abs).toLowerCase();
    const hit = scopes.some(
      (scope) => rel.includes(`/${scope}.`) || rel.includes(`/${scope}/`) || rel.startsWith(`${scope}.`) || rel.endsWith(`/${scope}`)
    );
    if (hit) out.push(abs);
  }
}

// When a system doc states facts but has no claims[], look for source files named after claimed_scope.
function checkFactsAgainstCodebase(rootPath, doc) {
  if (normalizeClaims(doc.claims).length) return [];
  const facts = factsOf(doc);
  const keys = Object.keys(facts);
  if (!keys.length) return [];
  const scopes = scopeTokens(doc.claimed_scope);
  if (!scopes.length) return [];
  const files = [];
  findScopedSourceFiles(rootPath, scopes, path.resolve(rootPath), 0, files);
  if (!files.length) return [];
  const failures = [];
  for (const [key, value] of Object.entries(facts)) {
    const needle = String(value);
    if (files.some((file) => fs.readFileSync(file, 'utf8').includes(needle))) continue;
    failures.push({
      path: posixRel(rootPath, files[0]),
      contains: needle,
      reason: 'missing_text',
      fact: key,
    });
  }
  return failures;
}

function alwaysSemanticRel(rel) {
  const n = String(rel || '').replace(/\\/g, '/');
  if (n === 'project.md' || n === 'decisions/index.md' || n === 'bolts/index.md') return true;
  if (n.startsWith('system/')) return true;
  if (n.startsWith('standards/')) return true;
  if (n.startsWith('recipes/')) return true;
  return false;
}

function episodicWhenMs(header, data) {
  if (header && header.date) {
    const raw = header.date.length === 10 ? `${header.date}T00:00:00Z` : header.date;
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  if (data) {
    for (const key of ['completed', 'created']) {
      const t = Date.parse(data[key]);
      if (Number.isFinite(t)) return t;
    }
  }
  return NaN;
}

function semanticReadPath(rootPath, contract) {
  const c = contract || lib.loadContract();
  const system = listSystemDocs(rootPath, c).map((doc) => ({
    id: doc.id,
    name: doc.name,
    purpose: doc.purpose,
    claimed_scope: doc.claimed_scope,
    last_verified: doc.last_verified || null,
    verified_by: doc.verified_by || null,
    path: artifactRel(rootPath, doc.path, c),
  }));
  const standards = listStandards(rootPath, c);
  const index = readDecisionsIndex(rootPath, c);
  return {
    order: ['system', 'standards', 'decisions_index'],
    system,
    standards,
    decisions_index: {
      path: artifactRel(rootPath, index.path, c),
      in_force: index.entries,
    },
    guidance:
      'Read semantic memory first (system/, standards/, decisions/index.md). Open episodic artifacts only when a semantic document refers to them or the user asks for history.',
  };
}

function appendMaintenanceLog(rootPath, contract, repaired) {
  if (!repaired || !repaired.length) return null;
  const file = path.join(lib.artifactRoot(rootPath, contract), (contract.integrity || {}).maintenance_log || 'maintenance-log.md');
  lib.assertInsideRoot(rootPath, file, contract);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      '# Maintenance log\n\nRepairs applied by flow-runtime. Each entry records what changed and why.\n',
      'utf8'
    );
  }
  const stamp = lib.nowStamp();
  const rows = repaired.map((item) => `| ${item.code} | ${item.path} | ${item.change} | ${item.why} |`).join('\n');
  fs.appendFileSync(
    file,
    `\n## ${stamp}\n\n| Finding | Path | Change | Why |\n|---------|------|--------|-----|\n${rows}\n`,
    'utf8'
  );
  return projectRel(rootPath, file);
}

function headerDate(stamp) {
  return String(stamp || lib.nowStamp()).slice(0, 10);
}

module.exports = {
  memoryConfig,
  posixRel,
  artifactRel,
  projectRel,
  formatHeader,
  parseHistoricalHeader,
  applyHistoricalHeader,
  stripHistoricalHeader,
  hasHistoricalHeader,
  inspectPointer,
  chooseCurrentTruth,
  listSystemDocs,
  listStandards,
  listDecisions,
  decisionsIndexPath,
  parseIndexEntries,
  readDecisionsIndex,
  writeDecisionsIndex,
  indexHasDecision,
  decisionPath,
  findDecisionFile,
  compactIndexPath,
  readCompactIndex,
  upsertCompactBolt,
  scopeTokens,
  matchSystemDocs,
  normalizeProjection,
  projectionItemsFor,
  markProjection,
  stampMarkdownFile,
  stampChangeRecord,
  stampBoltEpisodic,
  listStageArtifactFiles,
  uncapturedTruth,
  isReflectedDiscovery,
  archiveDest,
  isArchivedPath,
  moveToArchive,
  factsOf,
  checkClaims,
  checkFactsAgainstCodebase,
  alwaysSemanticRel,
  episodicWhenMs,
  semanticReadPath,
  appendMaintenanceLog,
  headerDate,
  HEADER_RE,
};
