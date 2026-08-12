#!/usr/bin/env node
/**
 * Create the docs/specsmd/ artifact tree.
 * Usage: node init-project.cjs <rootPath> [--autonomy-bias=balanced] [--confirm-standards] [--standards-json '...']
 *
 * Autonomy bias is the only required input. Workspace shape is detected.
 * Inferred standards for an existing codebase are returned as
 * pending_confirmation and are not written until --confirm-standards
 * or a --standards-json confirmation payload.
 */
const lib = require('./lib.cjs');
const standards = require('./standards.cjs');

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

  const inferred =
    workspace.kind === 'existing'
      ? standards.inferStandards(root, workspace, contract)
      : standards.defaultProposals(workspace, contract);

  const recorded = foundation.slice();
  let pending_confirmation = [];

  if (workspace.kind === 'greenfield' || confirm || edited) {
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
    const opts = {
      confirmStandards: flags['confirm-standards'] === true || flags['confirm-standards'] === 'true',
    };
    if (Object.prototype.hasOwnProperty.call(flags, 'standards-json')) {
      opts.standards = flags['standards-json'];
    }
    return initProject(positional[0], flags['autonomy-bias'], opts);
  });
}

module.exports = { initProject };
