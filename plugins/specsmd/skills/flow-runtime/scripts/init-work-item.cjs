#!/usr/bin/env node
/**
 * Create a work item under an intent. Refuses dependency cycles.
 * Usage: node init-work-item.cjs <rootPath> --intent ID --title "..." [--complexity medium] [--depends-on a,b] [--id slug] [--body-file path]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

function initWorkItem(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  const intentId = opts.intent;
  if (!intentId) {
    throw lib.terminal('INTENT_REQUIRED', 'An intent id is required.', 'Pass --intent <intent-id>.');
  }
  lib.assertSafeId(intentId, 'intent id');
  const intentFile = lib.intentPath(root, intentId, contract);
  if (!fs.existsSync(intentFile)) {
    throw lib.terminal(
      'INTENT_MISSING',
      `Intent "${intentId}" was not found.`,
      `Create it with init-intent, or pass an existing id from ${path.join(lib.artifactRoot(root, contract), 'intents')}.`
    );
  }

  const title = opts.title;
  if (!title || !String(title).trim()) {
    throw lib.terminal('TITLE_REQUIRED', 'A work item title is required.', 'Pass --title "observable outcome".');
  }

  const complexity = opts.complexity || contract.ceremony.complexity.default;
  if (!contract.ceremony.complexity.values.includes(complexity)) {
    throw lib.terminal(
      'COMPLEXITY_INVALID',
      `Complexity "${complexity}" is not in the contract.`,
      `Use one of: ${contract.ceremony.complexity.values.join(', ')}.`
    );
  }

  const itemsDir = path.join(lib.artifactRoot(root, contract), 'intents', intentId, 'work-items');
  const existingOnIntent = fs.existsSync(itemsDir)
    ? fs.readdirSync(itemsDir).filter((n) => n.endsWith('.md')).map((n) => n.replace(/\.md$/, ''))
    : [];
  const existingGlobal = lib.listAllWorkItems(root, contract).map((w) => w.id);
  const width = contract.identifiers.work_item_width;
  let id = lib.normalizePrefixedSlug(opts.id, existingGlobal, width);
  if (!id) id = `${lib.nextPrefixedId(existingGlobal, width)}-${lib.kebab(title)}`;
  if (existingOnIntent.includes(id) || existingGlobal.includes(id)) {
    throw lib.terminal(
      'WORK_ITEM_EXISTS',
      `Work item "${id}" already exists.`,
      'Choose a different --id or omit it to allocate the next number.'
    );
  }

  const dependsOn = lib.splitList(opts.dependsOn);
  const current = lib.listAllWorkItems(root, contract).map((w) => ({
    id: w.id,
    depends_on: lib.splitList(w.depends_on),
  }));
  current.push({ id, depends_on: dependsOn });
  const cycle = lib.detectCycle(current);
  if (cycle) {
    throw lib.terminal(
      'DEPENDENCY_CYCLE',
      `Dependency cycle refused: ${cycle.join(' → ')}.`,
      'Remove one edge of the cycle from --depends-on and retry.'
    );
  }

  const project = lib.readProject(root, contract);
  const ceremonySuggested = lib.suggestCeremony(complexity, project.data.autonomy_bias, contract);

  let body = opts.body || '';
  if (opts.bodyFile) body = fs.readFileSync(opts.bodyFile, 'utf8');
  if (!body.trim()) {
    body = `# ${title}\n\n## Behavior\n\n## Definition of Done\n\n`;
  }

  const file = lib.workItemPath(root, intentId, id, contract);
  lib.assertInsideRoot(root, file, contract);
  const data = {
    id,
    title: String(title).trim(),
    intent: intentId,
    complexity,
    ceremony_suggested: ceremonySuggested,
    status: 'pending',
    depends_on: dependsOn,
    created: lib.nowStamp(),
  };
  lib.writeMarkdown(file, data, body.endsWith('\n') ? body : body + '\n', root, contract);

  const intent = lib.readMarkdown(lib.intentPath(root, intentId, contract));
  if (intent.data.status === 'complete' || intent.data.status === 'abandoned') {
    intent.data.status = 'active';
    lib.writeMarkdown(intent.path, intent.data, intent.body, root, contract);
  }

  return {
    id,
    path: file,
    intent: intentId,
    complexity,
    ceremony_suggested: ceremonySuggested,
    depends_on: dependsOn,
    status: data.status,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initWorkItem(positional[0], {
      intent: flags.intent,
      title: flags.title,
      complexity: flags.complexity,
      dependsOn: flags['depends-on'],
      id: flags.id,
      bodyFile: flags['body-file'],
    });
  });
}

module.exports = { initWorkItem };
