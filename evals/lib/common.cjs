#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_INTENT = '001-unified-bolt-flow';
const ALLOWED_COMPLEXITY = new Set(['high', 'medium', 'low']);
const BLOCKING_FINDING_CLASSES = new Set(['divergence', 'contradiction']);

function findRepoRoot(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  while (true) {
    const hasDocs = fs.existsSync(path.join(dir, 'docs', 'specsmd'));
    const hasPkg = fs.existsSync(path.join(dir, 'package.json'));
    if (hasDocs && hasPkg) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        'Could not find the specsmd repository root (expected docs/specsmd and package.json). Pass --root.'
      );
    }
    dir = parent;
  }
}

function resolveRoot(explicit) {
  return explicit ? path.resolve(explicit) : findRepoRoot(process.cwd());
}

function loadYaml(repoRoot) {
  const here = __dirname;
  const candidates = [
    repoRoot ? path.join(repoRoot, 'src', 'node_modules', 'js-yaml') : null,
    repoRoot ? path.join(repoRoot, 'node_modules', 'js-yaml') : null,
    path.join(here, '..', '..', 'src', 'node_modules', 'js-yaml'),
    path.join(here, '..', '..', 'node_modules', 'js-yaml'),
    'js-yaml',
  ].filter(Boolean);
  const errors = [];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (err) {
      errors.push(`${candidate}: ${err.message}`);
    }
  }
  throw new Error(
    'js-yaml is required to parse work-item frontmatter and findings. Run `cd src && npm ci`.\n' +
      errors.join('\n')
  );
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--') {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i += 1;
      }
    } else {
      out._.push(token);
    }
  }
  return out;
}

function splitFrontmatter(content) {
  const match = String(content).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/);
  if (!match) return null;
  return { raw: match[1], body: match[2] };
}

function parseFrontmatter(content, yaml) {
  const split = splitFrontmatter(content);
  if (!split) return { data: null, body: String(content), raw: null };
  return { data: yaml.load(split.raw) || {}, body: split.body, raw: split.raw };
}

function formatYamlScalar(key, value) {
  if (value === null || value === undefined) return `${key}:`;
  if (typeof value === 'boolean' || typeof value === 'number') return `${key}: ${value}`;
  const str = String(value);
  if (str === '') return `${key}: ""`;
  if (/[:#{}[\],&*?|<>=!%@`]/.test(str) || /^\s|\s$/.test(str) || str.includes('\n')) {
    return `${key}: ${JSON.stringify(str)}`;
  }
  return `${key}: ${str}`;
}

function upsertFrontmatterFields(content, fields) {
  const match = String(content).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error('File has no YAML frontmatter to update.');
  }
  let yamlBlock = match[1];
  for (const [key, value] of Object.entries(fields)) {
    const lineRe = new RegExp(`^${key}:\\s*.*$`, 'm');
    const formatted = formatYamlScalar(key, value);
    if (lineRe.test(yamlBlock)) {
      yamlBlock = yamlBlock.replace(lineRe, formatted);
    } else {
      yamlBlock = `${yamlBlock}\n${formatted}`;
    }
  }
  return `---\n${yamlBlock}\n---${content.slice(match[0].length)}`;
}

function workItemsDir(repoRoot, intentId) {
  return path.join(repoRoot, 'docs', 'specsmd', 'intents', intentId, 'work-items');
}

function tasksFilePath(repoRoot, intentId) {
  return path.join(repoRoot, 'docs', 'specsmd', 'intents', intentId, 'tasks.md');
}

const TASK_HEADING = /^## (\d{3}-[a-z0-9-]+)\s*$/;
const META_LINE = /^([a-z][a-z0-9_]*)\s*:\s*(.*?)\s*$/;

function parseTaskMetaValue(raw) {
  const text = String(raw || '').trim();
  if (text === '' || text === '[]') return text === '[]' ? [] : '';
  if (text === 'null') return null;
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  if (text.startsWith('[') && text.endsWith(']')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.replace(/^['"]|['"]$/g, ''));
  }
  return text;
}

function parseTasksFile(content, file) {
  const text = String(content);
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(TASK_HEADING);
    if (match) starts.push({ line: i, id: match[1] });
  }
  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].line : lines.length;
    const sectionLines = lines.slice(start.line + 1, end);
    const data = { id: start.id };
    let bodyStart = 0;
    while (bodyStart < sectionLines.length && sectionLines[bodyStart].trim() === '') bodyStart += 1;
    while (bodyStart < sectionLines.length) {
      const meta = sectionLines[bodyStart].match(META_LINE);
      if (!meta) break;
      data[meta[1]] = parseTaskMetaValue(meta[2]);
      bodyStart += 1;
    }
    while (bodyStart < sectionLines.length && sectionLines[bodyStart].trim() === '') bodyStart += 1;
    const body = sectionLines.slice(bodyStart).join('\n');
    const dod = parseDodCriteria(body);
    const section = [lines[start.line], ...sectionLines].join('\n');
    return {
      file,
      content: section,
      data,
      body,
      criteria: dod.criteria,
      dodSection: dod.section,
      kind: 'tasks-section',
      id: String(data.id || start.id),
    };
  });
}

function upsertTaskSectionFields(fileContent, taskId, fields) {
  const lines = String(fileContent).split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(TASK_HEADING);
    if (match) starts.push({ line: i, id: match[1] });
  }
  const index = starts.findIndex((row) => row.id === taskId);
  if (index === -1) {
    throw new Error(`Task ${taskId} is not in this tasks.md.`);
  }
  const start = starts[index].line + 1;
  const end = index + 1 < starts.length ? starts[index + 1].line : lines.length;
  let cursor = start;
  while (cursor < end && lines[cursor].trim() === '') cursor += 1;
  const metaStart = cursor;
  while (cursor < end && META_LINE.test(lines[cursor])) cursor += 1;
  const metaLines = lines.slice(metaStart, cursor);
  const keys = new Set(Object.keys(fields));
  const nextMeta = metaLines.map((line) => {
    const meta = line.match(META_LINE);
    if (!meta || !Object.prototype.hasOwnProperty.call(fields, meta[1])) return line;
    keys.delete(meta[1]);
    return formatYamlScalar(meta[1], fields[meta[1]]);
  });
  for (const key of keys) {
    nextMeta.push(formatYamlScalar(key, fields[key]));
  }
  const next = [...lines.slice(0, metaStart), ...nextMeta, ...lines.slice(cursor)];
  return next.join('\n');
}

function listWorkItemFiles(repoRoot, intentId) {
  const tasks = tasksFilePath(repoRoot, intentId);
  if (fs.existsSync(tasks)) return [tasks];
  const dir = workItemsDir(repoRoot, intentId);
  if (!fs.existsSync(dir)) {
    throw new Error(
      `No tasks.md or work-items/ under docs/specsmd/intents/${intentId}/.`
    );
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name));
}

function listWorkItems(repoRoot, intentId, yaml) {
  const tasks = tasksFilePath(repoRoot, intentId);
  if (fs.existsSync(tasks)) {
    return parseTasksFile(fs.readFileSync(tasks, 'utf8'), tasks);
  }
  return listWorkItemFiles(repoRoot, intentId).map((file) => {
    const item = loadWorkItemFile(file, yaml);
    return {
      ...item,
      kind: 'file',
      id: String(item.data.id || path.basename(file, '.md')),
    };
  });
}

function extractDodSection(body) {
  const lines = String(body).split(/\r?\n/);
  let start = -1;
  let level = 2;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{2,3}) Definition of Done\s*$/);
    if (match) {
      start = i + 1;
      level = match[1].length;
      break;
    }
  }
  if (start === -1) return null;
  const collected = [];
  for (let i = start; i < lines.length; i += 1) {
    const heading = lines[i].match(/^(#{1,6}) /);
    if (heading && heading[1].length <= level) break;
    collected.push(lines[i]);
  }
  return collected.join('\n');
}

function parseDodCriteria(body) {
  const section = extractDodSection(body);
  const source = section === null ? String(body) : section;
  const criteria = [];
  const re = /^- \[([ xX])\]\s*(?:\((gating|advisory)\))?\s*(.*)$/gm;
  let match;
  let index = 0;
  while ((match = re.exec(source)) !== null) {
    index += 1;
    criteria.push({
      index,
      checked: match[1].toLowerCase() === 'x',
      tier: match[2] || 'unmarked',
      text: match[3].trim(),
    });
  }
  return { section, criteria };
}

function loadWorkItemFile(file, yaml) {
  const content = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(content, yaml);
  const dod = parseDodCriteria(parsed.body);
  return {
    file,
    content,
    data: parsed.data || {},
    body: parsed.body,
    criteria: dod.criteria,
    dodSection: dod.section,
  };
}

function findWorkItem(repoRoot, intentId, workItemId, yaml) {
  const items = listWorkItems(repoRoot, intentId, yaml);
  for (const item of items) {
    if (item.id === workItemId) {
      return { ...item, intentId };
    }
  }
  throw new Error(
    `Work item ${workItemId} not found under docs/specsmd/intents/${intentId}/tasks.md.`
  );
}

function upsertWorkItemFields(item, fields) {
  if (item.kind === 'tasks-section') {
    const current = fs.readFileSync(item.file, 'utf8');
    return upsertTaskSectionFields(current, item.id, fields);
  }
  return upsertFrontmatterFields(item.content, fields);
}

function protocolForComplexity(complexity) {
  const value = String(complexity || '').toLowerCase();
  if (value === 'high') {
    return { id: 'triangulation', file: 'triangulation.md', label: 'triangulation' };
  }
  if (value === 'medium' || value === 'low') {
    return { id: 'adversarial-review', file: 'adversarial-review.md', label: 'adversarial review' };
  }
  return null;
}

function sufficiencyReportAbs(repoRoot, intentId, workItemId) {
  return path.join(repoRoot, 'docs', 'specsmd', 'intents', intentId, 'sufficiency', `${workItemId}.md`);
}

function sufficiencyReportRel(intentId, workItemId) {
  return `docs/specsmd/intents/${intentId}/sufficiency/${workItemId}.md`;
}

function normalizeFinding(raw, index) {
  const finding = raw && typeof raw === 'object' ? raw : {};
  const status = String(finding.status || 'open').toLowerCase();
  const klass = String(finding.class || finding.kind || 'advisory').toLowerCase();
  return {
    id: String(finding.id || `F${index + 1}`),
    class: klass,
    status,
    summary: String(finding.summary || finding.title || '').trim(),
    detail: String(finding.detail || finding.description || '').trim(),
    resolution: String(finding.resolution || '').trim(),
  };
}

function loadFindingsFile(file, yaml) {
  if (!file) return { findings: [], meta: {} };
  const raw = yaml.load(fs.readFileSync(file, 'utf8')) || {};
  const list = Array.isArray(raw) ? raw : raw.findings || [];
  return {
    findings: list.map((item, index) => normalizeFinding(item, index)),
    meta: Array.isArray(raw) ? {} : raw,
  };
}

function openBlockingFindings(findings) {
  return findings.filter((finding) => {
    if (!BLOCKING_FINDING_CLASSES.has(finding.class)) return false;
    return finding.status !== 'resolved' && finding.status !== 'named-freedom';
  });
}

function deriveSufficiency(findings) {
  return openBlockingFindings(findings).length === 0 ? 'cleared' : 'not-cleared';
}

function normalizeProbes(meta) {
  const raw = meta && typeof meta === 'object' ? meta : {};
  if (Array.isArray(raw.probes)) {
    return raw.probes.map((probe, index) => ({
      id: String((probe && probe.id) || `P${index + 1}`),
      isolated: probe && probe.isolated === true,
      observable: String((probe && (probe.observable || probe.notes)) || '').trim(),
    }));
  }
  if (raw.probe) {
    return [
      {
        id: 'legacy-single-probe',
        isolated: false,
        observable: String(raw.probe).trim(),
      },
    ];
  }
  return [];
}

function protocolEvidenceErrors(protocol, meta) {
  const raw = meta && typeof meta === 'object' ? meta : {};
  const errors = [];
  if (!protocol || !protocol.id) {
    errors.push('No protocol selected.');
    return errors;
  }
  if (protocol.id === 'triangulation') {
    const probes = normalizeProbes(raw);
    if (probes.length < 2) {
      errors.push(
        'Triangulation requires two isolated probes, each with observable-behavior notes. A single self-probe is not the protocol.'
      );
    }
    probes.forEach((probe) => {
      if (!probe.observable) {
        errors.push(`Probe ${probe.id} is missing observable-behavior notes.`);
      }
      if (!probe.isolated) {
        errors.push(`Probe ${probe.id} must attest isolated: true (spec + standards only).`);
      }
    });
    const judge = String(raw.judge || raw.judge_notes || '').trim();
    if (!judge) {
      errors.push('Triangulation requires a judge note comparing the two probes.');
    }
  } else if (protocol.id === 'adversarial-review') {
    if (!String(raw.reviewer || '').trim()) {
      errors.push('Adversarial review requires a reviewer attestation before the spec can be cleared.');
    }
  }
  return errors;
}

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function posix(rel) {
  return String(rel).replace(/\\/g, '/');
}

module.exports = {
  ALLOWED_COMPLEXITY,
  BLOCKING_FINDING_CLASSES,
  DEFAULT_INTENT,
  deriveSufficiency,
  findRepoRoot,
  findWorkItem,
  formatYamlScalar,
  isoNow,
  listWorkItemFiles,
  listWorkItems,
  loadFindingsFile,
  loadWorkItemFile,
  loadYaml,
  normalizeFinding,
  normalizeProbes,
  openBlockingFindings,
  protocolEvidenceErrors,
  parseArgs,
  parseDodCriteria,
  parseFrontmatter,
  posix,
  protocolForComplexity,
  resolveRoot,
  splitFrontmatter,
  sufficiencyReportAbs,
  sufficiencyReportRel,
  upsertFrontmatterFields,
  upsertWorkItemFields,
  workItemsDir,
};
