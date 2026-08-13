#!/usr/bin/env node
/**
 * Move an episodic record to archive/. Refused while uncaptured truth remains.
 * Usage: node archive-artifact.cjs <rootPath> --kind decision --id 001-foo [--force]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');

function resolveSource(rootPath, opts, contract) {
  const kind = opts.kind;
  const id = opts.id;
  if (opts.path) {
    const raw = String(opts.path);
    const abs = path.isAbsolute(raw)
      ? raw
      : fs.existsSync(path.join(lib.artifactRoot(rootPath, contract), raw))
        ? path.join(lib.artifactRoot(rootPath, contract), raw)
        : path.join(rootPath, raw);
    if (!fs.existsSync(abs)) {
      throw lib.terminal('ARTIFACT_MISSING', `Nothing to archive at ${raw}.`, 'Pass a path under the artifact root.');
    }
    return { abs, kind: kind || inferKind(rootPath, abs, contract), id: id || path.basename(abs, '.md') };
  }
  if (kind === 'decision' && id) {
    const abs = memory.findDecisionFile(rootPath, id, contract);
    if (!abs) {
      throw lib.terminal('DECISION_MISSING', `Decision "${id}" was not found.`, 'Pass an existing decision id.');
    }
    return { abs, kind: 'decision', id };
  }
  if (kind === 'bolt' && id) {
    const dir = lib.boltDir(rootPath, id, contract);
    if (!fs.existsSync(dir)) {
      throw lib.terminal('BOLT_MISSING', `Bolt "${id}" was not found.`, 'Pass an existing bolt id.');
    }
    return { abs: dir, kind: 'bolt', id };
  }
  if ((kind === 'intent' || kind === 'work_item') && id) {
    if (kind === 'intent') {
      const file = lib.intentPath(rootPath, id, contract);
      if (!fs.existsSync(file)) {
        throw lib.terminal('INTENT_MISSING', `Intent "${id}" was not found.`, 'Pass an existing intent id.');
      }
      return { abs: file, kind, id };
    }
    const item = lib.findWorkItem(rootPath, id, contract);
    return { abs: item.path, kind, id };
  }
  throw lib.terminal(
    'TARGET_REQUIRED',
    'Archive needs a target.',
    'Pass --kind decision|bolt|intent|work_item --id <id>, or --path <artifact-relative-path>.'
  );
}

function inferKind(rootPath, abs, contract) {
  const rel = memory.artifactRel(rootPath, abs, contract);
  if (rel.startsWith('decisions/') && !rel.endsWith('index.md')) return 'decision';
  if (rel.startsWith('bolts/') && (rel.endsWith('/bolt.md') || !rel.includes('.', rel.lastIndexOf('/')))) return 'bolt';
  if (/intents\/[^/]+\/brief\.md$/.test(rel)) return 'intent';
  if (/work-items\//.test(rel)) return 'work_item';
  return 'artifact';
}

function loadArtifact(source, contract) {
  const stat = fs.statSync(source.abs);
  if (stat.isDirectory()) {
    const boltFile = path.join(source.abs, 'bolt.md');
    if (fs.existsSync(boltFile)) {
      const md = lib.readMarkdown(boltFile);
      return { data: md.data, body: md.body, file: boltFile, dir: source.abs };
    }
    return { data: { id: source.id }, body: '', file: null, dir: source.abs };
  }
  const md = lib.readMarkdown(source.abs);
  return { data: md.data, body: md.body, file: source.abs, dir: null };
}

function archiveArtifact(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const force = opts.force === true || opts.force === 'true';
  const source = resolveSource(root, opts, contract);
  if (memory.isArchivedPath(root, source.abs, contract)) {
    throw lib.terminal(
      'ALREADY_ARCHIVED',
      `${source.id} is already in the archive.`,
      'Nothing to do.'
    );
  }

  const loaded = loadArtifact(source, contract);
  const artifact = {
    kind: source.kind,
    id: (loaded.data && loaded.data.id) || source.id,
    discoveries: loaded.data && loaded.data.discoveries,
    reflected_in: loaded.data && loaded.data.reflected_in,
    data: loaded.data,
  };
  const blockers = memory.uncapturedTruth(root, artifact, contract);
  if (blockers.length && !force) {
    const first = blockers[0];
    throw lib.terminal(
      'UNCAPTURED_TRUTH',
      `Archiving ${artifact.id} is refused — ${first.message}`,
      `Capture it at ${first.destination} (add ${first.name} there), then retry. To override, pass --force (the override is recorded on the record).`
    );
  }

  if (loaded.file && loaded.data) {
    if (force && blockers.length) {
      loaded.data.archive_override = true;
      loaded.data.archive_override_reason = blockers
        .map((b) => `${b.kind}:${b.name} belongs in ${b.destination}`)
        .join('; ');
    }
    loaded.data.archived_at = lib.nowStamp();
    lib.writeMarkdown(loaded.file, loaded.data, loaded.body, root, contract);
  }

  const dest = memory.moveToArchive(root, source.abs, contract);

  if (source.kind === 'decision') {
    const index = memory.readDecisionsIndex(root, contract);
    const next = index.entries.map((e) => {
      if (e.id !== artifact.id) return e;
      return Object.assign({}, e, { href: `../archive/decisions/${artifact.id}.md` });
    });
    memory.writeDecisionsIndex(root, contract, index.data, next);
  }

  return {
    id: artifact.id,
    kind: source.kind,
    from: memory.projectRel(root, source.abs),
    to: memory.projectRel(root, dest),
    override: Boolean(force && blockers.length),
    uncaptured: blockers,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return archiveArtifact(positional[0], {
      kind: flags.kind,
      id: flags.id,
      path: flags.path || positional[1],
      force: flags.force,
    });
  });
}

module.exports = { archiveArtifact };
