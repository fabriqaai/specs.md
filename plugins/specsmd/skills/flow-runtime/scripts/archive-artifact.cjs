#!/usr/bin/env node
/**
 * Move an episodic record to archive/. Refused while uncaptured truth remains.
 * Semantic current truth cannot be archived, even with --force.
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
    let abs = path.isAbsolute(raw)
      ? raw
      : fs.existsSync(path.join(lib.artifactRoot(rootPath, contract), raw))
        ? path.join(lib.artifactRoot(rootPath, contract), raw)
        : path.join(rootPath, raw);
    if (!fs.existsSync(abs)) {
      throw lib.terminal('ARTIFACT_MISSING', `Nothing to archive at ${raw}.`, 'Pass a path under the artifact root.');
    }
    const inferred = kind || inferKind(rootPath, abs, contract);
    abs = expandContainer(abs, inferred);
    return { abs, kind: inferred, id: id || containerId(abs, inferred) };
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
  if (kind === 'intent' && id) {
    const dir = path.join(lib.artifactRoot(rootPath, contract), 'intents', id);
    if (!fs.existsSync(dir)) {
      throw lib.terminal('INTENT_MISSING', `Intent "${id}" was not found.`, 'Pass an existing intent id.');
    }
    return { abs: dir, kind: 'intent', id };
  }
  if (kind === 'work_item' && id) {
    const item = lib.findWorkItem(rootPath, id, contract);
    return { abs: item.path, kind, id };
  }
  throw lib.terminal(
    'TARGET_REQUIRED',
    'Archive needs a target.',
    'Pass --kind decision|bolt|intent|work_item --id <id>, or --path <artifact-relative-path>.'
  );
}

function expandContainer(abs, kind) {
  if (!fs.existsSync(abs)) return abs;
  if (kind === 'intent' && fs.statSync(abs).isFile()) return path.dirname(abs);
  if (kind === 'bolt' && fs.statSync(abs).isFile() && path.basename(abs) === 'bolt.md') {
    return path.dirname(abs);
  }
  return abs;
}

function containerId(abs, kind) {
  if (kind === 'intent' || kind === 'bolt') {
    return fs.statSync(abs).isDirectory() ? path.basename(abs) : path.basename(path.dirname(abs));
  }
  return path.basename(abs, '.md');
}

function inferKind(rootPath, abs, contract) {
  const rel = memory.artifactRel(rootPath, abs, contract);
  if (rel === 'project.md') return 'project';
  if (rel === 'decisions/index.md') return 'decisions_index';
  if (rel === 'bolts/index.md') return 'bolts_index';
  if (rel.startsWith('system/')) return 'system';
  if (rel.startsWith('standards/')) return 'standard';
  if (rel.startsWith('recipes/')) return 'recipe';
  if (rel.startsWith('decisions/') && !rel.endsWith('index.md')) return 'decision';
  if (rel.startsWith('bolts/')) {
    if (/^bolts\/[^/]+\/bolt\.md$/.test(rel) || /^bolts\/[^/]+$/.test(rel)) return 'bolt';
    return 'stage_artifact';
  }
  if (/^intents\/[^/]+(\/brief\.md)?$/.test(rel)) return 'intent';
  if (/work-items\//.test(rel)) return 'work_item';
  return 'artifact';
}

function loadArtifact(source, contract) {
  const stat = fs.statSync(source.abs);
  if (stat.isDirectory()) {
    const boltFile = path.join(source.abs, 'bolt.md');
    const briefFile = path.join(source.abs, 'brief.md');
    if (fs.existsSync(boltFile)) {
      const md = lib.readMarkdown(boltFile);
      return { data: md.data, body: md.body, file: boltFile, dir: source.abs };
    }
    if (fs.existsSync(briefFile)) {
      const md = lib.readMarkdown(briefFile);
      return { data: md.data, body: md.body, file: briefFile, dir: source.abs };
    }
    return { data: { id: source.id }, body: '', file: null, dir: source.abs };
  }
  const md = lib.readMarkdown(source.abs);
  return { data: md.data, body: md.body, file: source.abs, dir: null };
}

function parentBoltStatus(rootPath, filePath, contract) {
  const rel = memory.artifactRel(rootPath, filePath, contract);
  const m = rel.match(/^bolts\/([^/]+)\//);
  if (!m) return null;
  const boltFile = lib.boltPath(rootPath, m[1], contract);
  if (!fs.existsSync(boltFile)) return null;
  return lib.readMarkdown(boltFile).data.status;
}

function assertEpisodic(rootPath, source, loaded, contract) {
  const rel = memory.artifactRel(rootPath, source.abs, contract);
  if (memory.alwaysSemanticRel(rel)) {
    throw lib.terminal(
      'NOT_EPISODIC',
      `Archiving ${rel} is refused — it is semantic current truth.`,
      'system/, standards/, project.md, decisions/index.md, and bolts/index.md stay in the hot path. --force does not archive semantic documents.'
    );
  }
  const typeName = source.kind === 'artifact' ? 'decision' : source.kind;
  let status = loaded.data && loaded.data.status;
  if (typeName === 'stage_artifact') {
    status = parentBoltStatus(rootPath, source.abs, contract);
  }
  let memoryClass;
  try {
    memoryClass = lib.memoryClassFor(typeName, status, contract);
  } catch {
    memoryClass = 'semantic';
  }
  if (memoryClass !== 'episodic') {
    throw lib.terminal(
      'NOT_EPISODIC',
      `Archiving ${source.id || rel} is refused — it is ${memoryClass} (${status || 'no status'}).`,
      'Only episodic records may move to archive/. Complete or abandon a change record first. --force does not archive semantic documents.'
    );
  }
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
  assertEpisodic(root, source, loaded, contract);

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
