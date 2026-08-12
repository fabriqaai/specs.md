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

function listWorkItemFiles(repoRoot, intentId) {
  const dir = workItemsDir(repoRoot, intentId);
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Work-item directory not found: ${dir}. Expected docs/specsmd/intents/${intentId}/work-items/.`
    );
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name));
}

function extractDodSection(body) {
  const lines = String(body).split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^## Definition of Done\s*$/.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return null;
  const collected = [];
  for (let i = start; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) break;
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
  const files = listWorkItemFiles(repoRoot, intentId);
  for (const file of files) {
    const item = loadWorkItemFile(file, yaml);
    const id = String(item.data.id || path.basename(file, '.md'));
    if (id === workItemId || path.basename(file, '.md') === workItemId) {
      return { ...item, id, intentId };
    }
  }
  throw new Error(
    `Work item ${workItemId} not found under docs/specsmd/intents/${intentId}/work-items/.`
  );
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
  loadFindingsFile,
  loadWorkItemFile,
  loadYaml,
  normalizeFinding,
  openBlockingFindings,
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
  workItemsDir,
};
