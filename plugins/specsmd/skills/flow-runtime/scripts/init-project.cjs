#!/usr/bin/env node
/**
 * Create the docs/specsmd/ artifact tree.
 * Usage: node init-project.cjs <rootPath> [--autonomy-bias=balanced]
 */
const lib = require('./lib.cjs');

function initProject(rootPath, autonomyBias) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const project = lib.initProjectTree(root, contract, autonomyBias);
  return {
    artifactRoot: lib.artifactRoot(root, contract),
    autonomy_bias: project.data.autonomy_bias,
    created: project.data.created,
    recipes: lib.listRecipes(root, contract),
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initProject(positional[0], flags['autonomy-bias']);
  });
}

module.exports = { initProject };
