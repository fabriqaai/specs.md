#!/usr/bin/env node
/**
 * Record an immutable decision event and add it to the in-force index.
 * Usage: node init-decision.cjs <rootPath> --title "..." --consult-when "..."
 */
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');

function initDecision(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  const title = opts.title;
  if (!title || !String(title).trim()) {
    throw lib.terminal('TITLE_REQUIRED', 'A decision title is required.', 'Pass --title "the decision that was made".');
  }

  const existing = memory.listDecisions(root, contract).map((d) => d.id).filter(Boolean);
  const width = contract.identifiers.intent_width;
  let id = lib.normalizePrefixedSlug(opts.id, existing, width);
  if (!id) id = `${lib.nextPrefixedId(existing, width)}-${lib.kebab(title)}`;
  if (existing.includes(id)) {
    throw lib.terminal('DECISION_EXISTS', `Decision "${id}" already exists.`, 'Choose a different --id.');
  }

  const consultWhen = opts.consultWhen ? String(opts.consultWhen).trim() : '';
  const created = lib.nowStamp();
  const pointer = memory.chooseCurrentTruth(root, 'decisions/index.md', contract);
  const file = memory.decisionPath(root, id, contract);
  const data = {
    id,
    title: String(title).trim(),
    created,
    consult_when: consultWhen || null,
    superseded: false,
  };
  const body = memory.applyHistoricalHeader(
    `# ${data.title}\n\n${opts.body || 'Immutable record that this decision was made.'}\n`,
    created,
    pointer
  );
  lib.writeMarkdown(file, data, body, root, contract);

  const index = memory.readDecisionsIndex(root, contract);
  if (!memory.indexHasDecision(index, id)) {
    index.entries.push({
      id,
      href: `${id}.md`,
      consult_when: consultWhen,
    });
    memory.writeDecisionsIndex(root, contract, index.data, index.entries);
  }

  return {
    id,
    path: memory.projectRel(root, file),
    title: data.title,
    consult_when: consultWhen || null,
    memory_class: lib.memoryClassFor('decision', data.status, contract),
    current_truth: pointer,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initDecision(positional[0], {
      title: flags.title,
      id: flags.id,
      consultWhen: flags['consult-when'],
    });
  });
}

module.exports = { initDecision };
