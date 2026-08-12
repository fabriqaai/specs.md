#!/usr/bin/env node
/**
 * Detect artifact drift. Repair only with consent (--fix or --finding).
 * Usage: node validate-integrity.cjs <rootPath> [--fix] [--finding ID] [--stale-after P7D]
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const lib = require('./lib.cjs');

const STATUS_REPAIRS = {
  'in-progress': 'active',
  completed: 'complete',
  done: 'complete',
};

function relToRoot(rootPath, filePath) {
  return path.relative(rootPath, filePath).split(path.sep).join('/');
}

function integrityConfig(contract) {
  const section = contract.integrity || {};
  return {
    staleAfter: section.stale_active_after || 'P7D',
    maintenanceLog: section.maintenance_log || 'maintenance-log.md',
  };
}

function parseThreshold(raw, contract) {
  const value = String(raw || '').trim();
  if (!value) {
    return lib.parseIsoDuration(integrityConfig(contract).staleAfter, contract);
  }
  if (/^P/i.test(value)) return lib.parseIsoDuration(value, contract);
  const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i);
  if (match) {
    const n = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const ms = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    return n * ms[unit];
  }
  throw lib.terminal(
    'DURATION_INVALID',
    `Stale threshold "${raw}" is not an ISO-8601 duration.`,
    `Pass --stale-after ${integrityConfig(contract).staleAfter} (or 7d, 24h).`
  );
}

function safeReadMarkdown(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, code: 'MISSING', path: filePath };
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.trim()) return { ok: false, code: 'EMPTY', path: filePath };
  const parsed = lib.parseFrontmatter(text);
  if (!parsed) return { ok: false, code: 'PARSE_FRONTMATTER', path: filePath };
  return { ok: true, data: parsed.data || {}, body: parsed.body, path: filePath };
}

function scanTree(rootPath, contract) {
  const arts = { project: null, intents: [], workItems: [], bolts: [], unreadable: [] };
  const rootDir = lib.artifactRoot(rootPath, contract);

  function take(filePath, extra) {
    const read = safeReadMarkdown(filePath);
    if (!read.ok) {
      arts.unreadable.push({ ...read, ...extra });
      return null;
    }
    return { ...read.data, path: filePath, body: read.body, ...extra };
  }

  const projectFile = path.join(rootDir, 'project.md');
  if (fs.existsSync(projectFile)) {
    arts.project = take(projectFile, { kind: 'project', locationId: 'project' });
  }

  const intentsDir = path.join(rootDir, 'intents');
  if (fs.existsSync(intentsDir)) {
    for (const name of lib.listDirNames(intentsDir)) {
      const file = lib.intentPath(rootPath, name, contract);
      if (!fs.existsSync(file)) continue;
      const intent = take(file, { kind: 'intent', locationId: name });
      if (intent) arts.intents.push(intent);

      const itemsDir = path.join(intentsDir, name, 'work-items');
      if (!fs.existsSync(itemsDir)) continue;
      for (const entry of fs.readdirSync(itemsDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const itemPath = path.join(itemsDir, entry.name);
        const item = take(itemPath, {
          kind: 'work_item',
          locationId: entry.name.slice(0, -3),
          locationIntent: name,
        });
        if (item) arts.workItems.push(item);
      }
    }
  }

  const boltsDir = path.join(rootDir, 'bolts');
  if (fs.existsSync(boltsDir)) {
    for (const name of lib.listDirNames(boltsDir)) {
      const file = lib.boltPath(rootPath, name, contract);
      if (!fs.existsSync(file)) continue;
      const bolt = take(file, { kind: 'bolt', locationId: name });
      if (bolt) arts.bolts.push(bolt);
    }
  }

  return arts;
}

function lastStateChangeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function collectFindings(rootPath, contract, opts) {
  const options = opts || {};
  const root = lib.assertRoot(rootPath);
  const c = contract || lib.loadContract();
  const staleRaw = options.staleAfter || integrityConfig(c).staleAfter;
  const staleMs = parseThreshold(staleRaw, c);
  const now = options.now == null ? Date.now() : options.now;
  const arts = scanTree(root, c);
  const findings = [];
  const knownIds = new Set(arts.workItems.map((w) => w.id).filter(Boolean));

  function push(finding) {
    findings.push(finding);
  }

  for (const bad of arts.unreadable) {
    const rel = relToRoot(root, bad.path);
    push({
      code: 'UNREADABLE',
      class: 'unreadable',
      severity: 'error',
      auto_repairable: false,
      path: rel,
      artifact: path.basename(bad.path),
      message: `${rel} cannot be read (${bad.code}).`,
      remediation: `Restore YAML frontmatter at the top of ${rel} using the fields listed for this artifact type in the flow contract.`,
    });
  }

  const statusBearers = [];
  if (arts.project) statusBearers.push(arts.project);
  statusBearers.push(...arts.intents, ...arts.workItems, ...arts.bolts);

  for (const art of statusBearers) {
    const rel = relToRoot(root, art.path);
    const label = art.id || art.locationId || rel;
    if (art.status == null || art.status === '') {
      push({
        code: 'ILLEGAL_STATUS',
        class: 'illegal-status',
        severity: 'error',
        auto_repairable: false,
        path: rel,
        artifact: label,
        message: `${label} has no status.`,
        remediation: `Set status to one of: ${c.status.values.join(', ')} in ${rel}.`,
      });
      continue;
    }
    if (!c.status.values.includes(art.status)) {
      const expected = STATUS_REPAIRS[art.status];
      const rejected = (c.status.rejected_synonyms || []).includes(art.status);
      push({
        code: 'ILLEGAL_STATUS',
        class: 'illegal-status',
        severity: 'error',
        auto_repairable: Boolean(expected),
        path: rel,
        artifact: label,
        message: `${label} has status "${art.status}" which is not in the contract vocabulary.`,
        remediation: expected
          ? `Set status to ${expected} in ${rel}. "${art.status}" is not a status token.`
          : `Set status to one of: ${c.status.values.join(', ')} in ${rel}.${
              rejected ? ` Never use ${(c.status.rejected_synonyms || []).join(', ')}.` : ''
            }`,
        expected_status: expected || undefined,
      });
    }
  }

  for (const art of [...arts.intents, ...arts.workItems, ...arts.bolts]) {
    const rel = relToRoot(root, art.path);
    const idMismatch = art.id !== art.locationId;
    const intentMismatch = Boolean(art.locationIntent) && art.intent !== art.locationIntent;
    if (!idMismatch && !intentMismatch) continue;
    const parts = [];
    if (idMismatch) {
      parts.push(`Set id to "${art.locationId}" in ${rel} so it matches the ${art.kind === 'work_item' ? 'filename' : 'directory'}.`);
    }
    if (intentMismatch) {
      parts.push(`Set intent to "${art.locationIntent}" in ${rel} so it matches the parent intent directory.`);
    }
    push({
      code: 'ID_LOCATION',
      class: 'id-location',
      severity: 'error',
      auto_repairable: true,
      path: rel,
      artifact: art.id || art.locationId,
      message: idMismatch
        ? `${rel} is stored as ${art.locationId} but frontmatter id is "${art.id}".`
        : `${rel} lives under intent ${art.locationIntent} but frontmatter intent is "${art.intent}".`,
      remediation: parts.join(' '),
      expected_id: art.locationId,
      expected_intent: intentMismatch ? art.locationIntent : undefined,
    });
  }

  for (const item of arts.workItems) {
    const rel = relToRoot(root, item.path);
    for (const dep of lib.splitList(item.depends_on)) {
      if (knownIds.has(dep)) continue;
      push({
        code: 'ORPHAN_REF',
        class: 'orphaned-reference',
        severity: 'error',
        auto_repairable: false,
        path: rel,
        artifact: item.id || item.locationId,
        message: `Work item ${item.id || item.locationId} depends on "${dep}" which does not exist.`,
        remediation: `Create work item ${dep} or remove it from depends_on in ${rel}.`,
        reference: dep,
      });
    }
  }

  for (const bolt of arts.bolts) {
    const rel = relToRoot(root, bolt.path);
    for (const wi of lib.splitList(bolt.work_items)) {
      if (knownIds.has(wi)) continue;
      push({
        code: 'ORPHAN_REF',
        class: 'orphaned-reference',
        severity: 'error',
        auto_repairable: false,
        path: rel,
        artifact: bolt.id || bolt.locationId,
        message: `Bolt ${bolt.id || bolt.locationId} names work item "${wi}" which does not exist.`,
        remediation: `Create work item ${wi} or remove it from work_items in ${rel}.`,
        reference: wi,
      });
    }
    if (bolt.adopted_draft) {
      const draftId = String(bolt.adopted_draft);
      if (!arts.bolts.some((b) => b.id === draftId || b.locationId === draftId)) {
        push({
          code: 'ORPHAN_REF',
          class: 'orphaned-reference',
          severity: 'error',
          auto_repairable: false,
          path: rel,
          artifact: bolt.id || bolt.locationId,
          message: `Bolt ${bolt.id || bolt.locationId} names adopted draft "${draftId}" which does not exist.`,
          remediation: `Restore bolt ${draftId} or clear adopted_draft in ${rel}.`,
          reference: draftId,
        });
      }
    }
  }

  for (const bolt of arts.bolts) {
    if (bolt.status !== 'complete') continue;
    const rel = relToRoot(root, bolt.path);
    for (const wi of lib.splitList(bolt.work_items)) {
      const item = arts.workItems.find((w) => w.id === wi);
      if (!item) continue;
      if (item.status === 'complete' || item.status === 'abandoned') continue;
      const itemRel = relToRoot(root, item.path);
      push({
        code: 'CASCADE_DRIFT',
        class: 'status-cascade',
        severity: 'error',
        auto_repairable: true,
        path: itemRel,
        artifact: item.id || wi,
        message: `Bolt ${bolt.id || bolt.locationId} is complete but work item ${wi} is ${item.status}.`,
        remediation: `Set status to complete in ${itemRel}. Bolt ${bolt.id || bolt.locationId} (${rel}) lists this work item and is complete.`,
        expected_status: 'complete',
        source: rel,
      });
    }
  }

  for (const intent of arts.intents) {
    if (intent.status === 'draft') continue;
    const items = arts.workItems.filter((w) => w.intent === intent.id || w.locationIntent === intent.locationId);
    const expected = lib.deriveIntentStatus(items, c);
    if (intent.status === expected) continue;
    const rel = relToRoot(root, intent.path);
    push({
      code: 'CASCADE_DRIFT',
      class: 'status-cascade',
      severity: 'error',
      auto_repairable: true,
      path: rel,
      artifact: intent.id || intent.locationId,
      message: `Intent ${intent.id || intent.locationId} is ${intent.status} but work items require ${expected}.`,
      remediation: `Set status to ${expected} in ${rel}. ${
        items.length
          ? `Work item statuses: ${items.map((w) => `${w.id || w.locationId}=${w.status}`).join(', ')}.`
          : 'The intent has no work items, so status should be active.'
      }`,
      expected_status: expected,
    });
  }

  for (const bolt of arts.bolts) {
    if (bolt.status !== 'active') continue;
    const changed = lastStateChangeMs(bolt.path);
    if (!changed) continue;
    if (now - changed < staleMs) continue;
    const rel = relToRoot(root, bolt.path);
    const ageMs = now - changed;
    push({
      code: 'STALE_ACTIVE',
      class: 'stale-active',
      severity: 'warning',
      auto_repairable: false,
      path: rel,
      artifact: bolt.id || bolt.locationId,
      message: `Bolt ${bolt.id || bolt.locationId} is active and has had no state change for ${formatDuration(ageMs)} (threshold ${staleRaw}).`,
      remediation: `Resume bolt ${bolt.id || bolt.locationId} with update-stage or update-checkpoint, or set status to abandoned in ${rel}.`,
      stale_after: staleRaw,
    });
  }

  findings.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    if (a.code !== b.code) return a.code < b.code ? -1 : 1;
    return String(a.message).localeCompare(String(b.message));
  });

  findings.forEach((finding, index) => {
    finding.index = index + 1;
    finding.id = `F${index + 1}`;
  });

  return findings;
}

function formatDuration(ms) {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 120) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 120) return `${min}m`;
  const hours = Math.round(min / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function parseConsent(opts) {
  const flags = opts || {};
  if (flags.fix === true || flags.fix === 'true') return { all: true, ids: new Set() };
  const raw = [];
  for (const key of ['fix', 'finding', 'fix-id', 'fix_id']) {
    if (flags[key] && flags[key] !== true) raw.push(flags[key]);
  }
  if (Array.isArray(flags.findingIds)) raw.push(...flags.findingIds);
  const ids = new Set();
  for (const value of raw) {
    for (const part of lib.splitList(value)) ids.add(part);
  }
  return { all: false, ids };
}

function isConsented(finding, consent) {
  if (!finding.auto_repairable) return false;
  if (consent.all) return true;
  if (!consent.ids.size) return false;
  return (
    consent.ids.has(finding.id) ||
    consent.ids.has(String(finding.index)) ||
    consent.ids.has(finding.code) ||
    consent.ids.has(`${finding.code}:${finding.path}`)
  );
}

function applyRepair(rootPath, contract, finding) {
  const abs = path.join(rootPath, finding.path);
  if (!fs.existsSync(abs)) return null;
  const parsed = lib.readMarkdown(abs);
  const before = JSON.stringify(parsed.data);
  if (finding.code === 'CASCADE_DRIFT' && finding.expected_status) {
    parsed.data.status = finding.expected_status;
  } else if (finding.code === 'ILLEGAL_STATUS' && finding.expected_status) {
    parsed.data.status = finding.expected_status;
  } else if (finding.code === 'ID_LOCATION') {
    if (finding.expected_id) parsed.data.id = finding.expected_id;
    if (finding.expected_intent) parsed.data.intent = finding.expected_intent;
  } else {
    return null;
  }
  if (JSON.stringify(parsed.data) === before) return null;
  lib.writeMarkdown(abs, parsed.data, parsed.body, rootPath, contract);
  return {
    id: finding.id,
    code: finding.code,
    path: finding.path,
    change: describeChange(finding),
    why: finding.message,
  };
}

function describeChange(finding) {
  if (finding.expected_status) return `status → ${finding.expected_status}`;
  const parts = [];
  if (finding.expected_id) parts.push(`id → ${finding.expected_id}`);
  if (finding.expected_intent) parts.push(`intent → ${finding.expected_intent}`);
  return parts.join('; ') || 'frontmatter updated';
}

function maintenanceLogPath(rootPath, contract) {
  return path.join(lib.artifactRoot(rootPath, contract), integrityConfig(contract).maintenanceLog);
}

function appendMaintenanceLog(rootPath, contract, repaired) {
  if (!repaired.length) return null;
  const file = maintenanceLogPath(rootPath, contract);
  lib.assertInsideRoot(rootPath, file, contract);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      '# Maintenance log\n\nRepairs applied by the integrity validator. Each entry records what changed and why.\n',
      'utf8'
    );
  }
  const stamp = lib.nowStamp();
  const rows = repaired
    .map((item) => `| ${item.code} | ${item.path} | ${item.change} | ${item.why} |`)
    .join('\n');
  const entry = [
    '',
    `## ${stamp}`,
    '',
    '| Finding | Path | Change | Why |',
    '|---------|------|--------|-----|',
    rows,
    '',
  ].join('\n');
  fs.appendFileSync(file, entry, 'utf8');
  return relToRoot(rootPath, file);
}

function repairConsented(rootPath, contract, opts) {
  const consent = parseConsent(opts);
  if (!consent.all && !consent.ids.size) return [];
  const repaired = [];
  const seen = new Set();
  const passes = consent.all ? 3 : 1;
  for (let i = 0; i < passes; i++) {
    const findings = collectFindings(rootPath, contract, opts);
    let did = false;
    for (const finding of findings) {
      if (!isConsented(finding, consent)) continue;
      const key = `${finding.code}:${finding.path}:${finding.expected_status || ''}:${finding.expected_id || ''}:${finding.expected_intent || ''}`;
      if (seen.has(key)) continue;
      const result = applyRepair(rootPath, contract, finding);
      if (result) {
        seen.add(key);
        repaired.push(result);
        did = true;
      }
    }
    if (!did) break;
  }
  return repaired;
}

function validateIntegrity(rootPath, opts) {
  const options = opts || {};
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const before = collectFindings(root, contract, options);
  const repaired = repairConsented(root, contract, options);
  const logPath = repaired.length ? appendMaintenanceLog(root, contract, repaired) : null;
  const findings = collectFindings(root, contract, options);
  const scanned = scanTree(root, contract);
  return {
    findings,
    repaired,
    stale_after: options.staleAfter || integrityConfig(contract).staleAfter,
    maintenance_log: logPath,
    scanned: {
      intents: scanned.intents.length,
      work_items: scanned.workItems.length,
      bolts: scanned.bolts.length,
    },
    detected: before.length,
  };
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim());
    });
  });
}

async function collectInteractiveConsent(findings) {
  const ids = [];
  const repairable = findings.filter((f) => f.auto_repairable);
  if (!repairable.length) return ids;
  process.stderr.write(
    `${findings.length} finding(s), ${repairable.length} auto-repairable. Consent is required for each repair.\n`
  );
  for (const finding of repairable) {
    process.stderr.write(
      `\n${finding.id} ${finding.code} [${finding.severity}] ${finding.path}\n  ${finding.message}\n  ${finding.remediation}\n`
    );
    const answer = await prompt('Repair this finding? [y/N] ');
    if (/^(y|yes)$/i.test(answer)) ids.push(finding.id);
  }
  return ids;
}

async function runCli(argv) {
  const contract = lib.loadContract();
  const { positional, flags } = lib.parseArgs(argv);
  const root = positional[0] || process.cwd();
  const opts = {
    staleAfter: flags['stale-after'],
    fix: flags.fix,
    finding: flags.finding,
    'fix-id': flags['fix-id'],
  };
  if (flags.interactive === true || flags.interactive === 'true') {
    if (!process.stdin.isTTY) {
      throw lib.terminal(
        'NOT_INTERACTIVE',
        'Interactive repair needs a TTY.',
        'Re-run without --interactive and pass --fix or --finding <id>.'
      );
    }
    const preview = collectFindings(root, contract, opts);
    opts.findingIds = await collectInteractiveConsent(preview);
    delete opts.fix;
  }
  return validateIntegrity(root, opts);
}

if (require.main === module) {
  const contract = lib.loadContract();
  Promise.resolve()
    .then(() => runCli(process.argv))
    .then((data) => {
      lib.emitSuccess(data);
      process.exit(data.findings.length ? 1 : 0);
    })
    .catch((err) => {
      lib.emitFailure(err, contract);
    });
}

module.exports = { validateIntegrity, collectFindings };
