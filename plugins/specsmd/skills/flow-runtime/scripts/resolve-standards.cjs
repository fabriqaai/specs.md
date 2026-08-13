#!/usr/bin/env node
/**
 * Resolve the standard set for a file. Deterministic and explainable.
 * Usage: node resolve-standards.cjs <rootPath> --file <path>
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

function resolveStandards(rootPath, filePath) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!filePath) {
    throw lib.terminal(
      'FILE_REQUIRED',
      'A file path is required to resolve standards.',
      'Pass --file with a project-relative path.'
    );
  }
  return standards.resolveStandardsForFile(root, filePath, contract);
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return resolveStandards(positional[0], flags.file || positional[1]);
  });
}

module.exports = { resolveStandards };
