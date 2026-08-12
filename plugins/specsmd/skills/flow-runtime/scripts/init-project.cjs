#!/usr/bin/env node
/**
 * Create the docs/specsmd/ artifact tree.
 * Usage: node init-project.cjs <rootPath> [--autonomy-bias=balanced] [--confirm-standards]
 *
 * Autonomy bias is the only required input. Workspace shape is detected.
 * Inferred standards for an existing codebase are returned as
 * pending_confirmation and are not written until --confirm-standards.
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

function parseStandardsJson(raw) {
  if (raw == null || raw === true || raw === '') return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') return raw.standards || raw.proposals || null;
  try {
    const parsed = JSON.parse(String(raw));
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

function hydrateProposals(list, contract) {
  if (!list) return null;
  return list.map((item) => {
    if (item && item.body && item.data) return item;
    const id = item.id;
    if (!id) {
      throw lib.terminal(
        'STANDARD_ID_REQUIRED',
        'A proposed standard is missing id.',
        'Each proposal needs an id from the shipped or overridable set.'
      );
    }
    const vars = Object.assign({}, item.values || {}, {
      invariant: item.invariant,
      created: item.created,
    });
    const proposal = standards.proposalFromTemplate(id, vars, contract, item.scope || 'root');
    if (item.invariant) proposal.invariant = item.invariant;
    if (item.enforcement_tier) proposal.enforcement_tier = item.enforcement_tier;
    if (item.remediation) proposal.remediation = item.remediation;
    if (item.title) proposal.title = item.title;
    proposal.inferred_from = item.inferred_from || [];
    return proposal;
  });
}

function initProject(rootPath, autonomyBias, opts) {
  const options = opts || {};
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const workspace = standards.detectWorkspace(root);
  const project = lib.initProjectTree(root, contract, autonomyBias);
  const foundation = standards.ensureFoundationStandards(root, contract);

  const confirm =
    options.confirmStandards === true ||
    options['confirm-standards'] === true ||
    options.confirmStandards === 'true';
  const edited = hydrateProposals(parseStandardsJson(options.standards || options['standards-json']), contract);

  const inferred =
    workspace.kind === 'existing'
      ? standards.inferStandards(root, workspace, contract)
      : standards.defaultProposals(workspace, contract);

  const recorded = foundation.slice();
  let pending_confirmation = [];

  if (workspace.kind === 'greenfield' || confirm) {
    const toWrite = edited || inferred;
    recorded.push(...standards.recordProposals(root, toWrite, contract));
  } else {
    pending_confirmation = inferred.map((p) => standards.publicProposal(p));
  }

  const seen = new Set();
  const recordedUnique = [];
  for (const item of recorded) {
    const key = `${item.scope || 'root'}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recordedUnique.push(item);
  }

  return {
    artifactRoot: lib.artifactRoot(root, contract),
    autonomy_bias: project.data.autonomy_bias,
    created: project.data.created,
    recipes: lib.listRecipes(root, contract),
    workspace,
    required_questions: ['autonomy_bias'],
    standards: {
      recorded: recordedUnique,
      pending_confirmation,
    },
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initProject(positional[0], flags['autonomy-bias'], {
      confirmStandards: flags['confirm-standards'] === true || flags['confirm-standards'] === 'true',
      standards: flags['standards-json'],
    });
  });
}

module.exports = { initProject };
