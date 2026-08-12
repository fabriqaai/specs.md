#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { parseArgs, posix } = require('../lib/common.cjs');

const EVALS_PREFIXES = ['evals'];
const FLOW_IMPL_PREFIXES = ['plugins/specsmd'];

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
  if (explicit) return explicit;
  if (process.env.EVALS_HOLDOUT_BASE) return process.env.EVALS_HOLDOUT_BASE;
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
  const add = (args) => {
    for (const file of gitLines(cwd, args)) files.add(file);
  };
  if (base) {
    add(['diff', '--name-only', '--diff-filter=ACDMR', base, 'HEAD']);
    add(['diff', '--name-only', '--diff-filter=ACDMR', base]);
    add(['diff', '--name-only', '--cached', '--diff-filter=ACDMR', base]);
  } else {
    add(['diff', '--name-only', '--diff-filter=ACDMR', 'HEAD']);
    add(['diff', '--name-only', '--cached', '--diff-filter=ACDMR']);
  }
  add(['diff', '--name-only', '--diff-filter=ACDMR']);
  add(['ls-files', '--others', '--exclude-standard']);
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
        `evals/ files (${classified.evalsFiles.length}):`,
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
    'Fails when the same contribution changes evals/ and plugins/specsmd/.',
    'Changing only one side passes. Working tree + commits since merge-base are included.',
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
  matchesPrefix,
  resolveBase,
};
