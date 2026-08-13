#!/usr/bin/env node
/**
 * Record confirmed standard proposals. Does not invent a second question —
 * the caller already confirmed the inferred set (or supplied edits).
 * Usage: node record-standards.cjs <rootPath> [--confirm] [--standards-json '...']
 *
 * --confirm with no JSON accepts the inferred set.
 * --standards-json must be an array (or {standards|proposals|pending_confirmation})
 * and is the only set written; it overwrites existing files.
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

function recordStandards(rootPath, opts) {
  const options = opts || {};
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!lib.projectExists(root, contract)) {
    throw lib.terminal(
      'PROJECT_MISSING',
      'No artifact root yet.',
      'Run init-project first with --autonomy-bias, then confirm inferred standards here.'
    );
  }
  standards.ensureFoundationStandards(root, contract);
  const workspace = standards.detectWorkspace(root);
  const confirm = options.confirm === true || options.confirm === 'true';
  const rawJson =
    Object.prototype.hasOwnProperty.call(options, 'standards')
      ? options.standards
      : Object.prototype.hasOwnProperty.call(options, 'standards-json')
        ? options['standards-json']
        : undefined;
  const edited =
    rawJson === undefined
      ? null
      : standards.hydrateProposals(standards.parseStandardsJson(rawJson), contract, { overwrite: true });

  if (!confirm && !edited) {
    throw lib.terminal(
      'CONFIRM_REQUIRED',
      'Refusing to record inferred standards without confirmation.',
      'Pass --confirm after the user accepts the inferred set, or --standards-json with an array of edits.'
    );
  }

  const inferred =
    workspace.kind === 'existing'
      ? standards.inferStandards(root, workspace, contract)
      : standards.defaultProposals(workspace, contract);

  const toWrite = edited || inferred;
  const recorded = standards.recordProposals(root, toWrite, contract);
  return {
    workspace,
    recorded,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    const opts = {};
    if (flags.confirm === true || flags.confirm === 'true') opts.confirm = true;
    if (Object.prototype.hasOwnProperty.call(flags, 'standards-json')) {
      opts.standards = flags['standards-json'];
    }
    return recordStandards(positional[0], opts);
  });
}

module.exports = { recordStandards };
