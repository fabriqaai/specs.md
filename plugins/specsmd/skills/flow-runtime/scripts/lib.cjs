#!/usr/bin/env node
/**
 * Shared runtime for the unified bolt flow.
 * Zero dependencies — must run in any project with Node, and must write
 * only inside the artifact root.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REFERENCES = path.resolve(__dirname, '..', 'references');
const CONTRACT_PATH = path.join(REFERENCES, 'flow-contract.yaml');
const BUNDLED_RECIPES = path.join(REFERENCES, 'recipes');

let cachedContract = null;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class FlowError extends Error {
  constructor(kind, code, message, remediation) {
    super(message);
    this.name = 'FlowError';
    this.kind = kind;
    this.code = code;
    this.remediation = remediation || '';
  }
}

function retryable(code, message, remediation) {
  return new FlowError('retryable', code, message, remediation);
}
function terminal(code, message, remediation) {
  return new FlowError('terminal', code, message, remediation);
}
function structural(code, message, remediation) {
  return new FlowError('structural', code, message, remediation);
}

function exitCodeFor(err, contract) {
  const codes = (contract && contract.errors) || { retryable: 1, terminal: 2, structural: 3 };
  if (err instanceof FlowError) return codes[err.kind] || 1;
  return 1;
}

function emitSuccess(data) {
  process.stdout.write(JSON.stringify({ ok: true, data }, null, 2) + '\n');
}

function emitFailure(err, contract) {
  const payload = {
    ok: false,
    kind: err.kind || 'retryable',
    code: err.code || 'UNKNOWN',
    message: err.message,
    remediation: err.remediation || 'See the flow contract and retry, or pass a different input.',
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  process.stderr.write(`${payload.kind} [${payload.code}]: ${payload.message} ${payload.remediation}\n`);
  process.exit(exitCodeFor(err, contract));
}

function runMain(fn) {
  const contract = loadContract();
  try {
    const data = fn(contract);
    emitSuccess(data);
  } catch (err) {
    emitFailure(err, contract);
  }
}

// ---------------------------------------------------------------------------
// Minimal YAML (subset: maps, lists, scalars, comments). Enough for the
// contract, recipes, and artifact frontmatter.
// ---------------------------------------------------------------------------

function parseYaml(text) {
  const lines = String(text).replace(/\t/g, '  ').split(/\r?\n/);
  let i = 0;

  function indentOf(line) {
    const m = line.match(/^( *)/);
    return m ? m[1].length : 0;
  }

  function parseScalar(raw) {
    const v = raw.trim();
    if (v === '' || v === 'null' || v === '~') return null;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === '[]') return [];
    if (v === '{}') return {};
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(',').map((s) => parseScalar(s));
    }
    return v;
  }

  function parseBlock(minIndent) {
    const peek = () => {
      while (i < lines.length) {
        const raw = lines[i];
        if (raw.trim() === '' || raw.trim().startsWith('#')) {
          i += 1;
          continue;
        }
        return raw;
      }
      return null;
    };

    const first = peek();
    if (first == null) return {};
    if (indentOf(first) < minIndent) return {};

    if (first.trim().startsWith('- ')) {
      const list = [];
      while (i < lines.length) {
        const line = peek();
        if (line == null) break;
        const ind = indentOf(line);
        if (ind < minIndent) break;
        if (!line.trim().startsWith('- ')) break;
        i += 1;
        const rest = line.trim().slice(2);
        if (rest.includes(':') && !rest.startsWith('[') && !rest.startsWith('{')) {
          const colon = rest.indexOf(':');
          const key = rest.slice(0, colon).trim();
          const valRaw = rest.slice(colon + 1);
          const obj = {};
          if (valRaw.trim() === '') {
            obj[key] = parseBlock(ind + 1);
          } else {
            obj[key] = parseScalar(valRaw);
            const nested = parseBlock(ind + 2);
            if (nested && typeof nested === 'object' && !Array.isArray(nested) && Object.keys(nested).length) {
              Object.assign(obj, nested);
            }
          }
          // Sibling keys of this list item (same indent as key, greater than dash indent)
          const more = parseBlock(ind + 2);
          if (more && typeof more === 'object' && !Array.isArray(more)) {
            Object.assign(obj, more);
          }
          list.push(obj);
        } else if (rest === '') {
          list.push(parseBlock(ind + 2));
        } else {
          list.push(parseScalar(rest));
        }
      }
      return list;
    }

    const map = {};
    while (i < lines.length) {
      const line = peek();
      if (line == null) break;
      const ind = indentOf(line);
      if (ind < minIndent) break;
      if (line.trim().startsWith('- ')) break;
      i += 1;
      const trimmed = line.trim();
      const hash = trimmed.indexOf(' #');
      const cleaned = hash === -1 ? trimmed : trimmed.slice(0, hash);
      const colon = cleaned.indexOf(':');
      if (colon === -1) continue;
      const key = cleaned.slice(0, colon).trim();
      const valRaw = cleaned.slice(colon + 1);
      if (valRaw.trim() === '') {
        const next = peek();
        if (next == null || indentOf(next) <= ind) {
          map[key] = {};
        } else {
          map[key] = parseBlock(ind + 1);
        }
      } else {
        map[key] = parseScalar(valRaw);
      }
    }
    return map;
  }

  i = 0;
  return parseBlock(0);
}

function stringifyYaml(value, indent) {
  const pad = ' '.repeat(indent || 0);
  if (value == null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (value === '' || /[:#\n]|^\s|\s$/.test(value) || value === 'true' || value === 'false' || value === 'null') {
      return JSON.stringify(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const allScalar = value.every((v) => v == null || typeof v !== 'object');
    if (allScalar) {
      return '[' + value.map((v) => stringifyYaml(v, 0)).join(', ') + ']';
    }
    return value
      .map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const keys = Object.keys(item);
          if (!keys.length) return pad + '- {}';
          const first = keys[0];
          const rest = keys.slice(1);
          let out = pad + '- ' + first + ': ' + formatInlineOrBlock(item[first], (indent || 0) + 2);
          for (const k of rest) {
            out += '\n' + ' '.repeat((indent || 0) + 2) + k + ': ' + formatInlineOrBlock(item[k], (indent || 0) + 4);
          }
          return out;
        }
        return pad + '- ' + stringifyYaml(item, (indent || 0) + 2);
      })
      .join('\n');
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    return keys
      .map((k) => {
        const v = value[k];
        if (v && typeof v === 'object') {
          if (Array.isArray(v) && (v.length === 0 || v.every((x) => x == null || typeof x !== 'object'))) {
            return pad + k + ': ' + stringifyYaml(v, 0);
          }
          if (Array.isArray(v)) {
            return pad + k + ':\n' + stringifyYaml(v, (indent || 0) + 2);
          }
          const nested = stringifyYaml(v, (indent || 0) + 2);
          if (nested === '{}') return pad + k + ': {}';
          return pad + k + ':\n' + nested;
        }
        return pad + k + ': ' + stringifyYaml(v, 0);
      })
      .join('\n');
  }
  return String(value);
}

function formatInlineOrBlock(value, indent) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const nested = stringifyYaml(value, indent);
    return nested.includes('\n') ? '\n' + nested : nested;
  }
  if (Array.isArray(value) && value.some((x) => x && typeof x === 'object')) {
    return '\n' + stringifyYaml(value, indent);
  }
  return stringifyYaml(value, 0);
}

function parseFrontmatter(content) {
  const match = String(content).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { data: parseYaml(match[1]) || {}, body: match[2] };
}

function dumpFrontmatter(data) {
  return stringifyYaml(data, 0);
}

function writeFrontmatter(data, body) {
  const yaml = dumpFrontmatter(data);
  const rest = body == null ? '' : body.startsWith('\n') ? body : '\n' + body;
  return `---\n${yaml}\n---${rest}`;
}

function readMarkdown(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
  if (!parsed) {
    throw structural(
      'PARSE_FRONTMATTER',
      `No YAML frontmatter in ${filePath}.`,
      `Add a YAML frontmatter block at the top of ${filePath} using the fields listed for this artifact type in the flow contract.`
    );
  }
  parsed.path = filePath;
  return parsed;
}

function writeMarkdown(filePath, data, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, writeFrontmatter(data, body), 'utf8');
}

// ---------------------------------------------------------------------------
// Contract / paths
// ---------------------------------------------------------------------------

function loadContract() {
  if (cachedContract) return cachedContract;
  if (!fs.existsSync(CONTRACT_PATH)) {
    throw structural(
      'CONTRACT_MISSING',
      `Flow contract not found at ${CONTRACT_PATH}.`,
      'Reinstall the specsmd plugin so flow-runtime/references/flow-contract.yaml is present.'
    );
  }
  cachedContract = parseYaml(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  return cachedContract;
}

function artifactRoot(rootPath, contract) {
  const c = contract || loadContract();
  return path.join(path.resolve(rootPath), c.artifact_root);
}

function assertRoot(rootPath) {
  if (!rootPath || typeof rootPath !== 'string' || !rootPath.trim()) {
    throw terminal('ROOT_REQUIRED', 'A project root path is required.', 'Pass the project root as the first argument.');
  }
  const resolved = path.resolve(rootPath);
  if (!fs.existsSync(resolved)) {
    throw terminal('ROOT_MISSING', `Project root not found: ${resolved}.`, 'Pass an existing directory as the project root.');
  }
  return resolved;
}

function assertInsideRoot(rootPath, targetPath, contract) {
  const root = artifactRoot(rootPath, contract);
  const resolved = path.resolve(targetPath);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw structural(
      'WRITE_OUTSIDE_ROOT',
      `Refusing to write outside the artifact root: ${resolved}.`,
      `Write only under ${root}.`
    );
  }
}

function nowStamp() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function kebab(value) {
  const s = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'item';
}

function worktreeToken(rootPath) {
  const resolved = path.resolve(rootPath);
  const base = kebab(path.basename(resolved));
  const hash = crypto.createHash('sha1').update(resolved).digest('hex').slice(0, 6);
  return `${base}-${hash}`;
}

function padNum(n, width) {
  return String(n).padStart(width, '0');
}

function nextPrefixedId(existing, width, prefix) {
  let max = 0;
  const re = prefix
    ? new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(\\d+)')
    : /^(\d+)/;
  for (const name of existing) {
    const m = String(name).match(re);
    if (!m) continue;
    const num = parseInt(prefix ? m[1] : m[1], 10);
    if (Number.isFinite(num) && num > max) max = num;
  }
  return padNum(max + 1, width);
}

function listDirNames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

function listFileStems(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => e.name.slice(0, -ext.length));
}

// ---------------------------------------------------------------------------
// Project / recipes
// ---------------------------------------------------------------------------

function projectExists(rootPath, contract) {
  return fs.existsSync(path.join(artifactRoot(rootPath, contract), 'project.md'));
}

function readProject(rootPath, contract) {
  const file = path.join(artifactRoot(rootPath, contract), 'project.md');
  return readMarkdown(file);
}

function recipeDir(rootPath, contract) {
  return path.join(artifactRoot(rootPath, contract), 'recipes');
}

function loadRecipe(rootPath, recipeId, contract) {
  const id = recipeId || contract.recipe.default;
  const projectFile = path.join(recipeDir(rootPath, contract), `${id}.yaml`);
  const bundledFile = path.join(BUNDLED_RECIPES, `${id}.yaml`);
  const file = fs.existsSync(projectFile) ? projectFile : bundledFile;
  if (!fs.existsSync(file)) {
    throw terminal(
      'RECIPE_MISSING',
      `Recipe "${id}" was not found in the project's recipe folder or the shipped recipes.`,
      `Add ${path.join(recipeDir(rootPath, contract), id + '.yaml')} or pass --recipe ${contract.recipe.default}.`
    );
  }
  const recipe = parseYaml(fs.readFileSync(file, 'utf8'));
  if (!recipe || !Array.isArray(recipe.stages) || recipe.stages.length === 0) {
    throw structural(
      'RECIPE_INVALID',
      `Recipe "${id}" has no stages.`,
      `Give the recipe an ordered stages list. See the shipped default recipe at ${path.join(BUNDLED_RECIPES, 'default.yaml')}.`
    );
  }
  recipe.id = recipe.id || id;
  recipe.completion_requires = recipe.completion_requires || [];
  return recipe;
}

function listRecipes(rootPath, contract) {
  const ids = new Set(listFileStems(BUNDLED_RECIPES, '.yaml'));
  for (const stem of listFileStems(recipeDir(rootPath, contract), '.yaml')) ids.add(stem);
  return [...ids];
}

function copyBundledRecipes(rootPath, contract) {
  const dest = recipeDir(rootPath, contract);
  fs.mkdirSync(dest, { recursive: true });
  if (!fs.existsSync(BUNDLED_RECIPES)) return;
  for (const name of fs.readdirSync(BUNDLED_RECIPES)) {
    if (!name.endsWith('.yaml')) continue;
    const target = path.join(dest, name);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(path.join(BUNDLED_RECIPES, name), target);
    }
  }
}

function initProjectTree(rootPath, contract, autonomyBias) {
  const root = artifactRoot(rootPath, contract);
  fs.mkdirSync(root, { recursive: true });
  for (const dir of ['intents', 'bolts', 'recipes', 'standards', 'decisions', 'system']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  copyBundledRecipes(rootPath, contract);

  const nlspecSrc = path.join(REFERENCES, 'nlspec.md');
  const nlspecDest = path.join(root, 'standards', 'nlspec.md');
  if (fs.existsSync(nlspecSrc) && !fs.existsSync(nlspecDest)) {
    fs.copyFileSync(nlspecSrc, nlspecDest);
  }

  const readme = path.join(root, 'README.md');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      '# docs/specsmd\n\nUnified bolt flow artifacts. Specs are project documentation; state lives in frontmatter.\n',
      'utf8'
    );
  }

  const index = path.join(root, 'decisions', 'index.md');
  if (!fs.existsSync(index)) {
    fs.writeFileSync(
      index,
      '---\nid: decisions-index\nstatus: active\n---\n\n# Decisions in force\n\n(none yet)\n',
      'utf8'
    );
  }

  const projectFile = path.join(root, 'project.md');
  const bias = autonomyBias || contract.ceremony.autonomy_bias.default;
  if (!contract.ceremony.autonomy_bias.values.includes(bias)) {
    throw terminal(
      'BIAS_INVALID',
      `Autonomy bias "${bias}" is not in the contract.`,
      `Use one of: ${contract.ceremony.autonomy_bias.values.join(', ')}.`
    );
  }
  if (!fs.existsSync(projectFile)) {
    writeMarkdown(
      projectFile,
      { status: 'active', autonomy_bias: bias, created: nowStamp() },
      '# Project\n\nAutonomy bias for this workspace. Change it by editing this frontmatter through the flow tooling.\n'
    );
  }
  return readMarkdown(projectFile);
}

function ensureProject(rootPath, contract) {
  if (!projectExists(rootPath, contract)) {
    initProjectTree(rootPath, contract);
  }
}

// ---------------------------------------------------------------------------
// Ceremony
// ---------------------------------------------------------------------------

function suggestCeremony(complexity, autonomyBias, contract) {
  const c = contract.ceremony.complexity.values.includes(complexity)
    ? complexity
    : contract.ceremony.complexity.default;
  const b = contract.ceremony.autonomy_bias.values.includes(autonomyBias)
    ? autonomyBias
    : contract.ceremony.autonomy_bias.default;
  return contract.ceremony.matrix[c][b];
}

function recommendRecipe(complexity, contract) {
  const c = contract.ceremony.complexity.values.includes(complexity)
    ? complexity
    : contract.ceremony.complexity.default;
  return contract.recipe.recommend_from_complexity[c] || contract.recipe.default;
}

function normalizeApproval(phrase, contract) {
  const raw = String(phrase || '').trim().toLowerCase();
  if (contract.checkpoint_state.values.includes(raw)) return raw;
  if (contract.approval.grant.includes(raw)) return 'granted';
  if (contract.approval.deny.includes(raw)) return 'denied';
  throw terminal(
    'APPROVAL_UNRECOGNIZED',
    `Could not normalize "${phrase}" to a checkpoint decision.`,
    `Use one of: ${contract.approval.grant.slice(0, 6).join(', ')}, or an explicit checkpoint state (${contract.checkpoint_state.values.join(', ')}).`
  );
}

function stageNeedsGate(recipe, stageId, ceremony, contract) {
  const policy = contract.ceremony.gates[ceremony];
  if (policy === 'none') return false;
  const stage = recipe.stages.find((s) => s.id === stageId);
  if (!stage || !stage.gateable) return false;
  if (policy === 'all_gateable') return true;
  if (policy === 'first_gateable') {
    const first = recipe.stages.find((s) => s.gateable);
    return first && first.id === stageId;
  }
  return false;
}

function initialCheckpoint(recipe, stageId, ceremony, contract) {
  return stageNeedsGate(recipe, stageId, ceremony, contract) ? 'awaiting' : 'not-required';
}

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

function intentPath(rootPath, intentId, contract) {
  return path.join(artifactRoot(rootPath, contract), 'intents', intentId, 'brief.md');
}
function workItemPath(rootPath, intentId, workItemId, contract) {
  return path.join(artifactRoot(rootPath, contract), 'intents', intentId, 'work-items', `${workItemId}.md`);
}
function boltPath(rootPath, boltId, contract) {
  return path.join(artifactRoot(rootPath, contract), 'bolts', boltId, 'bolt.md');
}
function boltDir(rootPath, boltId, contract) {
  return path.join(artifactRoot(rootPath, contract), 'bolts', boltId);
}

function listIntents(rootPath, contract) {
  const dir = path.join(artifactRoot(rootPath, contract), 'intents');
  const out = [];
  for (const id of listDirNames(dir)) {
    const file = intentPath(rootPath, id, contract);
    if (!fs.existsSync(file)) continue;
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out;
}

function listWorkItems(rootPath, intentId, contract) {
  const dir = path.join(artifactRoot(rootPath, contract), 'intents', intentId, 'work-items');
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out;
}

function listAllWorkItems(rootPath, contract) {
  const out = [];
  for (const intent of listIntents(rootPath, contract)) {
    out.push(...listWorkItems(rootPath, intent.id, contract));
  }
  return out;
}

function findWorkItem(rootPath, workItemId, contract) {
  const items = listAllWorkItems(rootPath, contract);
  const found = items.filter((w) => w.id === workItemId);
  if (found.length === 1) return found[0];
  if (found.length > 1) {
    throw terminal(
      'WORK_ITEM_AMBIGUOUS',
      `Work item "${workItemId}" exists under more than one intent.`,
      'Pass the fully qualified intent with --intent <intent-id>.'
    );
  }
  throw terminal(
    'WORK_ITEM_MISSING',
    `Work item "${workItemId}" was not found.`,
    'Create it with the work-item-decompose skill, or pass an existing work item id.'
  );
}

function listBolts(rootPath, contract) {
  const dir = path.join(artifactRoot(rootPath, contract), 'bolts');
  const out = [];
  for (const id of listDirNames(dir)) {
    const file = boltPath(rootPath, id, contract);
    if (!fs.existsSync(file)) continue;
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out;
}

function readBolt(rootPath, boltId, contract) {
  const file = boltPath(rootPath, boltId, contract);
  if (!fs.existsSync(file)) {
    throw terminal(
      'BOLT_MISSING',
      `Bolt "${boltId}" was not found.`,
      `Start a bolt with init-bolt, or pass an existing id from ${path.join(artifactRoot(rootPath, contract), 'bolts')}.`
    );
  }
  return readMarkdown(file);
}

function assertStatus(value, contract) {
  if (!contract.status.values.includes(value)) {
    throw structural(
      'STATUS_INVALID',
      `Status "${value}" is not in the contract vocabulary.`,
      `Use one of: ${contract.status.values.join(', ')}.`
    );
  }
}

function detectCycle(nodes) {
  // nodes: [{id, depends_on: []}]
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(id) {
    if (visited.has(id)) return null;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      return stack.slice(start).concat(id);
    }
    visiting.add(id);
    stack.push(id);
    const node = byId.get(id);
    for (const dep of splitList(node && node.depends_on)) {
      if (!byId.has(dep)) continue;
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const n of nodes) {
    const cycle = visit(n.id);
    if (cycle) return cycle;
  }
  return null;
}

function uncheckedGatingCriteria(body) {
  const lines = String(body || '').split(/\r?\n/);
  const missing = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*\[\s*\]\s*(?:\((gating)\)|\*\(gating\)\*)\s*(.*)$/i);
    if (m) missing.push(m[2].trim());
  }
  return missing;
}

function walkthroughHasCode(body) {
  return /```(?!text\b|plain\b|markdown\b|md\b)\w+/.test(String(body || ''));
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      positional.push(...args.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          flags[key] = next;
          i += 1;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function splitList(value) {
  if (value == null || value === true || value === '') return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  FlowError,
  retryable,
  terminal,
  structural,
  runMain,
  parseYaml,
  stringifyYaml,
  parseFrontmatter,
  writeFrontmatter,
  readMarkdown,
  writeMarkdown,
  loadContract,
  artifactRoot,
  assertRoot,
  assertInsideRoot,
  nowStamp,
  kebab,
  worktreeToken,
  nextPrefixedId,
  listDirNames,
  projectExists,
  readProject,
  loadRecipe,
  listRecipes,
  initProjectTree,
  ensureProject,
  suggestCeremony,
  recommendRecipe,
  normalizeApproval,
  stageNeedsGate,
  initialCheckpoint,
  intentPath,
  workItemPath,
  boltPath,
  boltDir,
  listIntents,
  listWorkItems,
  listAllWorkItems,
  findWorkItem,
  listBolts,
  readBolt,
  assertStatus,
  detectCycle,
  uncheckedGatingCriteria,
  walkthroughHasCode,
  parseArgs,
  splitList,
  REFERENCES,
  BUNDLED_RECIPES,
};
