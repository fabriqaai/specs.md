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
  const text = fs.readFileSync(filePath, 'utf8');
  if (text.trim() === '') {
    throw retryable(
      'ARTIFACT_EMPTY',
      `${filePath} is empty.`,
      'Retry; a concurrent write may still be in progress. If the file stays empty, restore it from version control.'
    );
  }
  const parsed = parseFrontmatter(text);
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

function writeMarkdown(filePath, data, body, rootPath, contract) {
  const c = contract || loadContract();
  if (!rootPath) {
    throw structural(
      'ROOT_REQUIRED',
      'A project root is required to write artifacts.',
      'Pass the project root so the write can be checked against the artifact root.'
    );
  }
  assertInsideRoot(rootPath, filePath, c);
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

function touchUpdated(data) {
  data.updated = nowStamp();
  return data;
}

function kebab(value) {
  const s = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'item';
}

function assertSafeId(id, label) {
  const value = String(id || '');
  if (!value || value.includes('..') || /[\\/]/.test(value) || path.isAbsolute(value)) {
    throw terminal(
      'ID_INVALID',
      `The ${label} "${id}" is not a safe identifier.`,
      'Use a kebab slug with no path separators.'
    );
  }
}

function normalizePrefixedSlug(rawId, existing, width) {
  const given = rawId == null ? '' : String(rawId).trim();
  let value;
  if (!given) {
    value = null;
  } else if (!/^\d+-/.test(given)) {
    value = `${nextPrefixedId(existing, width)}-${kebab(given)}`;
  } else {
    const dash = given.indexOf('-');
    value = `${given.slice(0, dash)}-${kebab(given.slice(dash + 1))}`;
  }
  if (value && !/^\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw terminal(
      'ID_INVALID',
      `The identifier "${rawId}" is not {nnn}-{slug}.`,
      'Use digits, a hyphen, and a kebab slug (a-z, 0-9). No path separators.'
    );
  }
  return value;
}

function assertBoltId(id) {
  assertSafeId(id, 'bolt id');
  if (!/^bolt-[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/.test(id)) {
    throw terminal(
      'ID_INVALID',
      `Bolt id "${id}" does not match bolt-{worktree}-{nnn}.`,
      'Pass a bolt id created by init-bolt. Do not use path segments.'
    );
  }
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

function parseIsoDuration(iso, contract) {
  const raw = String(iso || '').trim();
  const match = raw.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
  if (!match || raw === 'P' || raw === 'PT') {
    throw terminal(
      'DURATION_INVALID',
      `Duration "${iso}" is not an ISO-8601 duration.`,
      `Use a duration such as ${((contract && contract.recipe && contract.recipe.time_box) || {}).duration_default || 'PT8H'}.`
    );
  }
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseFloat(match[4] || '0');
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

function constraintKindOf(constraint) {
  if (constraint == null) return '';
  if (typeof constraint === 'string') return constraint;
  return String(constraint.kind || '');
}

function normalizeConstraint(constraint, recipeId, contract) {
  const kind = constraintKindOf(constraint);
  const known = (contract.recipe && contract.recipe.constraint_kinds) || [];
  if (!known.includes(kind)) {
    throw terminal(
      'CONSTRAINT_UNKNOWN',
      `Recipe "${recipeId}" declares unknown constraint kind "${kind || '(missing)'}".`,
      `Use one of: ${known.join(', ')}. Remove or rename the constraint and reload the recipe.`
    );
  }
  if (kind === 'time_box') {
    const tb = contract.recipe.time_box || {};
    const duration = (constraint && constraint.duration) || tb.duration_default || 'PT8H';
    parseIsoDuration(duration, contract);
    const onExpiry = (constraint && constraint.on_expiry) || tb.on_expiry_default || 'complete_with_findings';
    const allowed = tb.on_expiry_values || ['complete_with_findings'];
    if (!allowed.includes(onExpiry)) {
      throw terminal(
        'CONSTRAINT_UNKNOWN',
        `Recipe "${recipeId}" declares unknown time-box on_expiry "${onExpiry}".`,
        `Use one of: ${allowed.join(', ')}.`
      );
    }
    return { kind: 'time_box', duration, on_expiry: onExpiry };
  }
  if (kind === 'no_source_code') {
    const stages = splitList(constraint && constraint.stages);
    return { kind: 'no_source_code', stages };
  }
  return { kind };
}

function normalizeRecipe(raw, recipeId, contract) {
  if (!raw || !Array.isArray(raw.stages) || raw.stages.length === 0) {
    throw structural(
      'RECIPE_INVALID',
      `Recipe "${recipeId}" has no stages.`,
      `Give the recipe an ordered stages list with id, produces, and gateable on each stage. See the shipped recipes in ${BUNDLED_RECIPES}.`
    );
  }
  const stages = raw.stages.map((stage, index) => {
    if (!stage || !stage.id) {
      throw structural(
        'RECIPE_INVALID',
        `Recipe "${recipeId}" stage ${index + 1} is missing id.`,
        'Give every stage an id, a produces list, and a gateable boolean.'
      );
    }
    if (stage.produces == null) {
      throw structural(
        'RECIPE_INVALID',
        `Recipe "${recipeId}" stage "${stage.id}" is missing produces.`,
        'Set produces to a list of artifact file names (empty list if the stage produces none).'
      );
    }
    if (typeof stage.gateable !== 'boolean') {
      throw structural(
        'RECIPE_INVALID',
        `Recipe "${recipeId}" stage "${stage.id}" is missing gateable.`,
        'Set gateable to true or false.'
      );
    }
    const produces = Array.isArray(stage.produces) ? stage.produces.map(String) : [String(stage.produces)];
    return { id: String(stage.id), produces, gateable: stage.gateable === true };
  });
  const rawConstraints = raw.constraints == null ? [] : raw.constraints;
  if (!Array.isArray(rawConstraints)) {
    throw structural(
      'RECIPE_INVALID',
      `Recipe "${recipeId}" constraints must be a list.`,
      'Declare constraints as a list of { kind, ... } maps.'
    );
  }
  const constraints = rawConstraints.map((constraint) => normalizeConstraint(constraint, recipeId, contract));
  const completionDefault = (contract.recipe && contract.recipe.completion_requires_default) || [];
  const completion =
    raw.completion_requires == null ? completionDefault.slice() : splitList(raw.completion_requires);
  return {
    id: raw.id || recipeId,
    title: raw.title || raw.id || recipeId,
    stages,
    completion_requires: completion,
    constraints,
  };
}

function snapshotRecipe(recipe) {
  return JSON.parse(JSON.stringify(recipe));
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
  return normalizeRecipe(recipe, id, contract);
}

function recipeForBolt(rootPath, boltData, contract) {
  if (boltData && boltData.recipe_snapshot && typeof boltData.recipe_snapshot === 'object') {
    return normalizeRecipe(boltData.recipe_snapshot, boltData.recipe, contract);
  }
  return loadRecipe(rootPath, boltData && boltData.recipe, contract);
}

function timeBoxConstraint(recipe) {
  const list = (recipe && recipe.constraints) || [];
  return list.find((constraint) => constraintKindOf(constraint) === 'time_box') || null;
}

function isTimeBoxExpired(boltData, recipe, nowMs) {
  if (!boltData || boltData.status !== 'active') return false;
  const constraint = timeBoxConstraint(recipe);
  if (!constraint) return false;
  const start = Date.parse(boltData.activated_at || boltData.created);
  if (!Number.isFinite(start)) return false;
  const durationMs = parseIsoDuration(constraint.duration);
  const now = nowMs == null ? Date.now() : nowMs;
  return now >= start + durationMs;
}

function ensureFindingsArtifact(rootPath, boltId, contract) {
  const name = (((contract.recipe || {}).time_box || {}).findings_artifact) || 'findings.md';
  const dir = boltDir(rootPath, boltId, contract);
  const file = path.join(dir, name);
  assertInsideRoot(rootPath, file, contract);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      file,
      [
        '# Findings',
        '',
        'Time box expired. Partial findings are a valid outcome.',
        '',
        '## What was learned',
        '',
        '(not yet recorded)',
        '',
        '## Recommendation',
        '',
        'Stop. The bolt is complete; start a new bolt if more work remains.',
        '',
      ].join('\n'),
      'utf8'
    );
  }
  return file;
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
  for (const dir of ['intents', 'bolts', 'recipes', 'standards', 'decisions', 'system', 'archive', 'releases']) {
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

  const boltsIndex = path.join(root, 'bolts', 'index.md');
  if (!fs.existsSync(boltsIndex)) {
    writeMarkdown(
      boltsIndex,
      { id: 'bolts-index', status: 'active' },
      '# Completed bolts\n\n(none yet)\n',
      rootPath,
      contract
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
      '# Project\n\nAutonomy bias for this workspace. Change it by editing this frontmatter through the flow tooling.\n',
      rootPath,
      contract
    );
  }
  return readMarkdown(projectFile);
}

function ensureProject(rootPath, contract) {
  if (!projectExists(rootPath, contract)) {
    throw terminal(
      'PROJECT_MISSING',
      'No artifact root yet.',
      'Run init-project with --autonomy-bias first. Autonomy bias is the one required question; this script will not default it.'
    );
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
  if (raw === 'granted' || contract.approval.grant.includes(raw)) return 'granted';
  if (contract.approval.deny.includes(raw)) return 'denied';
  throw terminal(
    'APPROVAL_UNRECOGNIZED',
    `Could not normalize "${phrase}" to a checkpoint decision.`,
    `Use an approval phrase (${contract.approval.grant.slice(0, 6).join(', ')}) or a deny phrase. Do not pass checkpoint states such as not-required or none.`
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
function releaseDir(rootPath, releaseId, contract) {
  return path.join(artifactRoot(rootPath, contract), 'releases', releaseId);
}
function releasePath(rootPath, releaseId, contract) {
  return path.join(releaseDir(rootPath, releaseId, contract), 'release.md');
}
function verificationDir(rootPath, releaseId, contract) {
  return path.join(releaseDir(rootPath, releaseId, contract), 'verifications');
}
function verificationPath(rootPath, releaseId, verificationId, contract) {
  return path.join(verificationDir(rootPath, releaseId, contract), `${verificationId}.md`);
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
  assertBoltId(boltId);
  const file = boltPath(rootPath, boltId, contract);
  assertInsideRoot(rootPath, file, contract);
  if (!fs.existsSync(file)) {
    throw terminal(
      'BOLT_MISSING',
      `Bolt "${boltId}" was not found.`,
      `Start a bolt with init-bolt, or pass an existing id from ${path.join(artifactRoot(rootPath, contract), 'bolts')}.`
    );
  }
  return readMarkdown(file);
}

function assertReleaseId(id) {
  assertSafeId(id, 'release id');
  if (!/^\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw terminal(
      'ID_INVALID',
      `Release id "${id}" is not {nnn}-{slug}.`,
      'Use digits, a hyphen, and a kebab slug (a-z, 0-9). No path separators.'
    );
  }
}

function listReleases(rootPath, contract) {
  const dir = path.join(artifactRoot(rootPath, contract), 'releases');
  const out = [];
  for (const id of listDirNames(dir)) {
    const file = releasePath(rootPath, id, contract);
    if (!fs.existsSync(file)) continue;
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out.sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')));
}

function readRelease(rootPath, releaseId, contract) {
  assertReleaseId(releaseId);
  const file = releasePath(rootPath, releaseId, contract);
  assertInsideRoot(rootPath, file, contract);
  if (!fs.existsSync(file)) {
    throw terminal(
      'RELEASE_MISSING',
      `Release "${releaseId}" was not found.`,
      `Produce a checklist with init-release, or pass an existing id from ${path.join(artifactRoot(rootPath, contract), 'releases')}.`
    );
  }
  return readMarkdown(file);
}

function listVerifications(rootPath, releaseId, contract) {
  const dir = verificationDir(rootPath, releaseId, contract);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const file = path.join(dir, name);
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out.sort((a, b) => String(a.confirmed_at || a.created || '').localeCompare(String(b.confirmed_at || b.created || '')));
}

function releasedBoltMap(releases) {
  const map = new Map();
  for (const rel of releases || []) {
    for (const boltId of splitList(rel.bolts)) {
      map.set(boltId, rel.id);
    }
  }
  return map;
}

function listDecisions(rootPath, contract) {
  const dir = path.join(artifactRoot(rootPath, contract), 'decisions');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md') || name === 'index.md') continue;
    const file = path.join(dir, name);
    const md = readMarkdown(file);
    out.push({ ...md.data, path: file, body: md.body });
  }
  return out;
}

function inForceDecisionIds(rootPath, contract) {
  const file = path.join(artifactRoot(rootPath, contract), 'decisions', 'index.md');
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const ids = [];
  const re = /\[(\d+-[a-z0-9-]+)\]/g;
  let match;
  while ((match = re.exec(text))) ids.push(match[1]);
  return ids;
}

function extractMarkdownSection(body, heading) {
  const escaped = String(heading).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^#{1,6}\\s+${escaped}\\s*$`, 'i');
  const lines = String(body || '').split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return '';
  const out = [];
  for (let i = start; i < lines.length; i++) {
    if (/^#{1,6}\s+\S/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

function readLooseMarkdown(filePath) {
  if (!fs.existsSync(filePath)) return { data: {}, body: '', path: filePath, missing: true };
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(text);
  if (parsed) {
    parsed.path = filePath;
    parsed.missing = false;
    return parsed;
  }
  return { data: {}, body: text, path: filePath, missing: false };
}

function assertStatus(value, contract) {
  const rejected = (contract.status && contract.status.rejected_synonyms) || [];
  if (rejected.includes(value)) {
    throw structural(
      'STATUS_INVALID',
      `Status "${value}" is not in the contract vocabulary.`,
      `Use one of: ${contract.status.values.join(', ')}. Never use ${rejected.join(', ')}.`
    );
  }
  if (!contract.status.values.includes(value)) {
    throw structural(
      'STATUS_INVALID',
      `Status "${value}" is not in the contract vocabulary.`,
      `Use one of: ${contract.status.values.join(', ')}.`
    );
  }
}

function memoryClassFor(typeName, status, contract) {
  const type = contract.artifact_types[typeName];
  if (!type) {
    throw structural(
      'TYPE_UNKNOWN',
      `Artifact type "${typeName}" is not in the contract.`,
      `Use one of: ${Object.keys(contract.artifact_types).join(', ')}.`
    );
  }
  if (type.memory_class === 'change_record') {
    const terminal = contract.status.terminal || [];
    const derivation = (contract.memory_class && contract.memory_class.derivation && contract.memory_class.derivation.change_record) || {};
    return terminal.includes(status) ? derivation.terminal || 'episodic' : derivation.non_terminal || 'semantic';
  }
  return type.memory_class;
}

function deriveIntentStatus(items, contract) {
  if (!items || !items.length) return 'active';
  const terminal = contract.status.terminal || [];
  if (items.every((item) => item.status === 'abandoned')) return 'abandoned';
  if (items.every((item) => terminal.includes(item.status))) return 'complete';
  if (items.some((item) => item.status === 'active' || item.status === 'pending')) return 'active';
  return 'active';
}

function detectCycle(nodes) {
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
  const text = String(body || '');
  if (/```/.test(text) || /~~~/.test(text)) return true;
  if (/^diff --git /m.test(text)) return true;
  if (/^@@ -\d/.test(text)) return true;
  return false;
}

function walkthroughHasDeviations(body) {
  return /^#{1,6}\s*Deviations from plan\s*$/im.test(String(body || ''));
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
  exitCodeFor,
  emitSuccess,
  emitFailure,
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
  touchUpdated,
  kebab,
  assertSafeId,
  normalizePrefixedSlug,
  assertBoltId,
  worktreeToken,
  nextPrefixedId,
  listDirNames,
  projectExists,
  readProject,
  loadRecipe,
  normalizeRecipe,
  snapshotRecipe,
  recipeForBolt,
  parseIsoDuration,
  timeBoxConstraint,
  isTimeBoxExpired,
  ensureFindingsArtifact,
  listRecipes,
  initProjectTree,
  ensureProject,
  memoryClassFor,
  deriveIntentStatus,
  suggestCeremony,
  recommendRecipe,
  normalizeApproval,
  stageNeedsGate,
  initialCheckpoint,
  intentPath,
  workItemPath,
  boltPath,
  boltDir,
  releaseDir,
  releasePath,
  verificationDir,
  verificationPath,
  listIntents,
  listWorkItems,
  listAllWorkItems,
  findWorkItem,
  listBolts,
  readBolt,
  assertReleaseId,
  listReleases,
  readRelease,
  listVerifications,
  releasedBoltMap,
  listDecisions,
  inForceDecisionIds,
  extractMarkdownSection,
  readLooseMarkdown,
  assertStatus,
  detectCycle,
  uncheckedGatingCriteria,
  walkthroughHasCode,
  walkthroughHasDeviations,
  parseArgs,
  splitList,
  REFERENCES,
  BUNDLED_RECIPES,
};
