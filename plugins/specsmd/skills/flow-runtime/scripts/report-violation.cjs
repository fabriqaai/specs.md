#!/usr/bin/env node
/**
 * Phrase a standards violation as a remediation instruction.
 * Usage: node report-violation.cjs <rootPath> --standard <id> --file <path> --change "<what to do>"
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

function reportViolation(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  return standards.reportViolation(root, opts || {}, contract);
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return reportViolation(positional[0], {
      standard: flags.standard,
      file: flags.file,
      change: flags.change,
    });
  });
}

module.exports = { reportViolation };
