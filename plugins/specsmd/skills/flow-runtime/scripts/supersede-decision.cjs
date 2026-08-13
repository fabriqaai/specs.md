#!/usr/bin/env node
/**
 * Supersede an in-force decision: new record + index update + old upward pointer, one operation.
 * Usage: node supersede-decision.cjs <rootPath> --replaces ID --title "..." --consult-when "..."
 */
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');
const { initDecision } = require('./init-decision.cjs');

function supersedeDecision(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const replaces = opts.replaces;
  if (!replaces) {
    throw lib.terminal(
      'REPLACES_REQUIRED',
      'Supersede needs the id of the decision being replaced.',
      'Pass --replaces <decision-id>.'
    );
  }

  const oldFile = memory.findDecisionFile(root, replaces, contract);
  if (!oldFile) {
    throw lib.terminal(
      'DECISION_MISSING',
      `Decision "${replaces}" was not found.`,
      `Pass an existing id from ${memory.projectRel(root, memory.decisionPath(root, replaces, contract))}.`
    );
  }

  const created = initDecision(root, {
    title: opts.title,
    id: opts.id,
    consultWhen: opts.consultWhen,
    body: opts.body,
  });

  const pointer = memory.chooseCurrentTruth(root, 'decisions/index.md', contract);
  const old = lib.readMarkdown(oldFile);
  old.data.superseded = true;
  old.data.superseded_by = created.id;
  const stamped = memory.applyHistoricalHeader(old.body, old.data.created || lib.nowStamp(), pointer);
  lib.writeMarkdown(oldFile, old.data, stamped, root, contract);

  const index = memory.readDecisionsIndex(root, contract);
  const kept = index.entries.filter((e) => e.id !== replaces);
  if (!kept.some((e) => e.id === created.id)) {
    kept.push({
      id: created.id,
      href: `${created.id}.md`,
      consult_when: created.consult_when || '',
    });
  }
  memory.writeDecisionsIndex(root, contract, index.data, kept);

  return {
    replaced: replaces,
    id: created.id,
    path: created.path,
    index: memory.projectRel(root, memory.decisionsIndexPath(root, contract)),
    old_current_truth: pointer,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return supersedeDecision(positional[0], {
      replaces: flags.replaces,
      title: flags.title,
      id: flags.id,
      consultWhen: flags['consult-when'],
    });
  });
}

module.exports = { supersedeDecision };
