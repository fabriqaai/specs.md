#!/usr/bin/env node
/**
 * Record confirmed standard proposals. Does not invent a second question —
 * the caller already confirmed the inferred set (or supplied edits).
 * Usage: node record-standards.cjs <rootPath> [--confirm] [--standards-json '...']
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

function parseStandardsJson(raw) {
  if (raw == null || raw === true || raw === '') return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.standards)) return parsed.standards;
    if (parsed && Array.isArray(parsed.proposals)) return parsed.proposals;
    return null;
  } catch {
    throw lib.terminal(
      'STANDARDS_JSON_INVALID',
      'Could not parse --standards-json.',
      'Pass a JSON array of standard proposals (id, scope, invariant, enforcement_tier).'
    );
  }
}

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
  const edited = parseStandardsJson(options.standards || options['standards-json']);
  const inferred =
    workspace.kind === 'existing'
      ? standards.inferStandards(root, workspace, contract)
      : standards.defaultProposals(workspace, contract);

  let toWrite;
  if (edited) {
    toWrite = edited.map((item) => {
      const vars = Object.assign({}, item.values || {}, { invariant: item.invariant });
      const proposal = standards.proposalFromTemplate(item.id, vars, contract, item.scope || 'root');
      if (item.invariant) proposal.invariant = item.invariant;
      if (item.enforcement_tier) proposal.enforcement_tier = item.enforcement_tier;
      if (item.remediation) proposal.remediation = item.remediation;
      if (item.title) proposal.title = item.title;
      return proposal;
    });
  } else {
    toWrite = inferred;
  }

  const recorded = standards.recordProposals(root, toWrite, contract);
  return {
    workspace,
    recorded,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    if (flags.confirm !== true && flags.confirm !== 'true' && !flags['standards-json']) {
      throw lib.terminal(
        'CONFIRM_REQUIRED',
        'Refusing to record inferred standards without confirmation.',
        'Pass --confirm after the user accepts the inferred set, or --standards-json with edits.'
      );
    }
    return recordStandards(positional[0], {
      standards: flags['standards-json'],
    });
  });
}

module.exports = { recordStandards };
