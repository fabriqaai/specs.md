#!/usr/bin/env node
/**
 * Memory gardening pass. Reports drift; changes nothing without consent.
 * Usage: node garden.cjs <rootPath> [--fix] [--finding F1]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');

function relProject(rootPath, filePath) {
  return memory.projectRel(rootPath, filePath);
}

function collectGardenFindings(rootPath, opts) {
  const options = opts || {};
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const cfg = memory.memoryConfig(contract);
  const now = options.now == null ? Date.now() : options.now;
  const horizonMs = lib.parseIsoDuration(options.horizon || cfg.retentionHorizon, contract);
  const findings = [];

  function push(finding) {
    findings.push(finding);
  }

  const systemDocs = memory.listSystemDocs(root, contract);
  for (const doc of systemDocs) {
    const rel = relProject(root, doc.path);
    const failures = memory.checkClaims(root, doc).concat(memory.checkFactsAgainstCodebase(root, doc));
    for (const fail of failures) {
      const detail =
        fail.reason === 'missing_file'
          ? `${fail.path} does not exist`
          : fail.reason === 'forbidden_text'
            ? `${fail.path} still contains "${fail.must_not_contain}"`
            : `${fail.path} does not contain "${fail.contains}"`;
      push({
        code: 'CONTRADICTS_CODEBASE',
        class: 'contradicts-codebase',
        severity: 'error',
        auto_repairable: false,
        path: rel,
        artifact: doc.id,
        message: `System document ${doc.id} contradicts the current system: ${detail}.`,
        remediation: `Update ${rel} so its claim matches ${fail.path}, or change ${fail.path} to match the claimed truth in ${rel}. Do not leave the contradiction in place.`,
        claim: fail,
      });
    }
  }

  const factOwners = new Map();
  for (const doc of systemDocs) {
    const facts = memory.factsOf(doc);
    for (const [key, value] of Object.entries(facts)) {
      const prev = factOwners.get(key);
      if (prev && String(prev.value) !== String(value)) {
        push({
          code: 'CONTRADICTS_SEMANTIC',
          class: 'contradicts-semantic',
          severity: 'error',
          auto_repairable: false,
          path: relProject(root, doc.path),
          artifact: doc.id,
          message: `System documents ${prev.id} and ${doc.id} disagree on "${key}" (${prev.value} vs ${value}).`,
          remediation: `Reconcile fact "${key}" in ${relProject(root, prev.path)} and ${relProject(root, doc.path)} so semantic memory has one value.`,
        });
      } else if (!prev) {
        factOwners.set(key, { id: doc.id, value, path: doc.path });
      }
    }
  }

  const index = memory.readDecisionsIndex(root, contract);
  const decisions = memory.listDecisions(root, contract);
  const byId = new Map(decisions.map((d) => [d.id, d]));
  for (const entry of index.entries) {
    const rec = byId.get(entry.id);
    if (rec && rec.superseded) {
      push({
        code: 'STALE_INDEX',
        class: 'stale-index',
        severity: 'warning',
        auto_repairable: true,
        path: relProject(root, index.path),
        artifact: entry.id,
        message: `In-force index lists ${entry.id}, which is superseded.`,
        remediation: `Remove ${entry.id} from ${relProject(root, index.path)}. Agents consult the index; it must list only in-force decisions.`,
        decision: entry.id,
      });
    }
  }

  function considerEpisodic(filePath, typeName, data, id) {
    if (memory.isArchivedPath(root, filePath, contract)) return;
    const status = data && data.status;
    const memoryClass = lib.memoryClassFor(typeName, status, contract);
    if (memoryClass !== 'episodic') return;
    const rel = relProject(root, filePath);
    let body = '';
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      const parsed = lib.parseFrontmatter(text);
      body = parsed ? parsed.body : text;
    } catch {
      body = '';
    }
    const header = memory.parseHistoricalHeader(body);
    if (!header) {
      push({
        code: 'MISSING_POINTER',
        class: 'missing-pointer',
        severity: 'warning',
        auto_repairable: true,
        path: rel,
        artifact: id,
        message: `Episodic artifact ${id || rel} has no historical-record header.`,
        remediation: `Add "${memory.formatHeader((data && data.completed) || lib.nowStamp(), cfg.defaultCurrentTruth)}" at the top of ${rel}.`,
        expected_pointer: cfg.defaultCurrentTruth,
      });
    } else {
      const info = memory.inspectPointer(root, header.current_truth, contract);
      if (!info.ok) {
        push({
          code: 'MISSING_POINTER',
          class: 'missing-pointer',
          severity: 'warning',
          auto_repairable: true,
          path: rel,
          artifact: id,
          message: `Episodic artifact ${id || rel} points at "${header.current_truth}" which is not current semantic truth (${info.reason}).`,
          remediation: `Point ${rel} up one hop to a semantic document such as ${cfg.defaultCurrentTruth}, never sideways to another episodic record.`,
          expected_pointer: cfg.defaultCurrentTruth,
        });
      }
    }

    const when = memory.episodicWhenMs(header, data);
    if (Number.isFinite(when) && now - when > horizonMs) {
      push({
        code: 'PAST_HORIZON',
        class: 'past-horizon',
        severity: 'warning',
        auto_repairable: false,
        path: rel,
        artifact: id,
        message: `Episodic artifact ${id || rel} is past the retention horizon (${cfg.retentionHorizon}) and still in the hot path.`,
        remediation: `Archive ${rel} with archive-artifact.cjs after confirming its truth is captured in system/ or the decisions index.`,
      });
    }
  }

  for (const intent of lib.listIntents(root, contract)) {
    considerEpisodic(intent.path, 'intent', intent, intent.id);
    for (const item of lib.listWorkItems(root, intent.id, contract)) {
      considerEpisodic(item.path, 'work_item', item, item.id);
    }
  }
  for (const bolt of lib.listBolts(root, contract)) {
    considerEpisodic(bolt.path, 'bolt', bolt, bolt.id);
    if (lib.memoryClassFor('bolt', bolt.status, contract) === 'episodic') {
      for (const file of memory.listStageArtifactFiles(lib.boltDir(root, bolt.id, contract))) {
        considerEpisodic(file, 'stage_artifact', bolt, path.basename(file));
      }
    }
  }
  for (const decision of decisions) {
    considerEpisodic(decision.path, 'decision', decision, decision.id);
  }

  findings.sort((a, b) => {
    const rank = { error: 0, warning: 1, advisory: 2 };
    const da = rank[a.severity] != null ? rank[a.severity] : 9;
    const db = rank[b.severity] != null ? rank[b.severity] : 9;
    if (da !== db) return da - db;
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    return String(a.code).localeCompare(String(b.code));
  });
  findings.forEach((finding, index) => {
    finding.index = index + 1;
    finding.id = `G${index + 1}`;
  });
  return findings;
}

function parseConsent(opts) {
  const flags = opts || {};
  if (flags.fix === true || flags.fix === 'true') return { all: true, ids: new Set() };
  const ids = new Set();
  for (const part of lib.splitList(flags.finding)) ids.add(part);
  return { all: false, ids };
}

function isConsented(finding, consent) {
  if (!finding.auto_repairable) return false;
  if (consent.all) return true;
  return consent.ids.has(finding.id) || consent.ids.has(finding.code) || consent.ids.has(String(finding.index));
}

function applyGardenRepair(rootPath, contract, finding) {
  if (finding.code === 'STALE_INDEX') {
    const index = memory.readDecisionsIndex(rootPath, contract);
    const next = index.entries.filter((e) => e.id !== finding.decision);
    memory.writeDecisionsIndex(rootPath, contract, index.data, next);
    return { id: finding.id, code: finding.code, path: finding.path, change: `removed ${finding.decision}`, why: finding.message };
  }
  if (finding.code === 'MISSING_POINTER') {
    const abs = path.join(rootPath, finding.path);
    if (!fs.existsSync(abs)) return null;
    const pointer = memory.chooseCurrentTruth(rootPath, finding.expected_pointer, contract);
    memory.stampMarkdownFile(rootPath, abs, lib.nowStamp(), pointer, contract);
    return {
      id: finding.id,
      code: finding.code,
      path: finding.path,
      change: `header → ${pointer}`,
      why: finding.message,
    };
  }
  return null;
}

function garden(rootPath, opts) {
  const options = opts || {};
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const consent = parseConsent(options);
  const before = collectGardenFindings(root, options);
  const repaired = [];
  if (consent.all || consent.ids.size) {
    for (const finding of before) {
      if (!isConsented(finding, consent)) continue;
      const result = applyGardenRepair(root, contract, finding);
      if (result) repaired.push(result);
    }
  }
  const logPath = repaired.length ? memory.appendMaintenanceLog(root, contract, repaired) : null;
  const findings = collectGardenFindings(root, options);
  return {
    findings,
    repaired,
    maintenance_log: logPath,
    detected: before.length,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return garden(positional[0] || process.cwd(), {
      fix: flags.fix,
      finding: flags.finding,
      horizon: flags.horizon,
    });
  });
}

module.exports = { garden, collectGardenFindings };
