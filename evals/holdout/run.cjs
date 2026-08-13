#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { parseArgs, posix } = require('../lib/common.cjs');

const EVALS_PREFIXES = ['evals', '.github/workflows/evals-holdout.yml', 'src/__tests__/evals'];
const FLOW_IMPL_PREFIXES = ['plugins/specsmd'];
const ZERO_SHA = /^0+$/;

function git(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

function gitLines(cwd, args) {
  const result = git(cwd, args);
  if (result.status !== 0) return [];
  return String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(posix);
}

function parseNameStatusLines(stdout) {
  const files = [];
  for (const line of String(stdout || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split('\t').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    for (let i = 1; i < parts.length; i += 1) {
      files.push(posix(parts[i]));
    }
  }
  return files;
}

function isUsableRev(cwd, rev) {
  if (!rev || ZERO_SHA.test(String(rev))) return false;
  return git(cwd, ['rev-parse', '--verify', `${rev}^{commit}`]).status === 0;
}

function matchesPrefix(file, prefix) {
  const normalized = posix(file).replace(/^\.\//, '');
  return normalized === prefix || normalized.startsWith(`${prefix}/`);
}

function classifyPath(file) {
  const normalized = posix(file).replace(/^\.\//, '');
  const evals = EVALS_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
  const impl = FLOW_IMPL_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
  return { file: normalized, evals, impl };
}

function classifyChanges(files) {
  const classified = files.map(classifyPath);
  return {
    files: classified,
    evalsFiles: classified.filter((row) => row.evals).map((row) => row.file),
    implFiles: classified.filter((row) => row.impl).map((row) => row.file),
  };
}

function resolveBase(cwd, explicit) {
  if (isUsableRev(cwd, explicit)) return explicit;
  if (isUsableRev(cwd, process.env.EVALS_HOLDOUT_BASE)) return process.env.EVALS_HOLDOUT_BASE;
  if (process.env.GITHUB_BASE_REF) {
    const ref = process.env.GITHUB_BASE_REF;
    const remote = ref.startsWith('origin/') ? ref : `origin/${ref}`;
    const fetched = git(cwd, ['rev-parse', '--verify', remote]);
    if (fetched.status === 0) {
      const mergeBase = git(cwd, ['merge-base', 'HEAD', remote]);
      if (mergeBase.status === 0) return mergeBase.stdout.trim();
      return remote;
    }
  }
  for (const candidate of ['origin/main-v2', 'main-v2', 'origin/main', 'main']) {
    const exists = git(cwd, ['rev-parse', '--verify', candidate]);
    if (exists.status !== 0) continue;
    const mergeBase = git(cwd, ['merge-base', 'HEAD', candidate]);
    if (mergeBase.status === 0) return mergeBase.stdout.trim();
  }
  const parent = git(cwd, ['rev-parse', 'HEAD^']);
  if (parent.status === 0) return parent.stdout.trim();
  return null;
}

function collectChangedFiles(cwd, base) {
  const files = new Set();
  const addStatus = (args) => {
    const result = git(cwd, args);
    if (result.status !== 0) return;
    for (const file of parseNameStatusLines(result.stdout)) files.add(file);
  };
  // --no-renames so a move evals/ → plugins/specsmd/ is a delete + add, not dest-only.
  const nameStatus = ['diff', '--name-status', '--no-renames', '--diff-filter=ACDMR'];
  if (base) {
    addStatus([...nameStatus, base, 'HEAD']);
    addStatus([...nameStatus, base]);
    addStatus([...nameStatus, '--cached', base]);
  } else {
    addStatus([...nameStatus, 'HEAD']);
    addStatus([...nameStatus, '--cached']);
  }
  addStatus([...nameStatus]);
  for (const file of gitLines(cwd, ['ls-files', '--others', '--exclude-standard'])) {
    files.add(file);
  }
  return [...files];
}

function evaluateHoldout({ files, cwd, base } = {}) {
  const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd();
  const resolvedBase = files ? base || null : resolveBase(resolvedCwd, base);
  const changed = files || collectChangedFiles(resolvedCwd, resolvedBase);
  const classified = classifyChanges(changed);
  const mixed = classified.evalsFiles.length > 0 && classified.implFiles.length > 0;
  const message = mixed
    ? [
        'Holdout isolation failed.',
        '',
        'This contribution changes both the evals area and unified-flow implementation.',
        'Implementing agents must not write evals/. Split the work:',
        '  1. Land flow implementation without evals/ changes, or',
        '  2. Land evals/ changes without plugins/specsmd/ changes.',
        '',
        `evals-side files (${classified.evalsFiles.length}):`,
        ...classified.evalsFiles.map((file) => `  - ${file}`),
        '',
        `plugins/specsmd/ files (${classified.implFiles.length}):`,
        ...classified.implFiles.map((file) => `  - ${file}`),
        '',
        'Work item: docs/specsmd/intents/001-unified-bolt-flow/work-items/000-flow-evals.md',
      ].join('\n')
    : classified.evalsFiles.length > 0
      ? 'Holdout isolation passed (evals-only change).'
      : classified.implFiles.length > 0
        ? 'Holdout isolation passed (implementation-only change).'
        : 'Holdout isolation passed (neither side changed).';
  return {
    ok: !mixed,
    base: resolvedBase,
    evalsFiles: classified.evalsFiles,
    implFiles: classified.implFiles,
    files: classified.files,
    message,
  };
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/holdout/run.cjs [--root <dir>] [--base <git-rev>] [--json]',
    '',
    'Fails when the same contribution changes evals-side paths (evals/,',
    'src/__tests__/evals/, or .github/workflows/evals-holdout.yml) and plugins/specsmd/.',
    'Changing only one side passes. Working tree + commits since the base are included.',
    'On a push, pass --base / EVALS_HOLDOUT_BASE as the previous SHA (zero SHA = no parent).',
  ].join('\n');
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) {
    console.log(printUsage());
    return 0;
  }
  const result = evaluateHoldout({ cwd: args.root || process.cwd(), base: args.base });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.message);
  }
  return result.ok ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv);
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

module.exports = {
  EVALS_PREFIXES,
  FLOW_IMPL_PREFIXES,
  classifyChanges,
  classifyPath,
  collectChangedFiles,
  evaluateHoldout,
  isUsableRev,
  matchesPrefix,
  parseNameStatusLines,
  resolveBase,
};
