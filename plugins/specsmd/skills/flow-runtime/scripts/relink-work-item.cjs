#!/usr/bin/env node
/**
 * Move pending work items onto an intent. Cycle-checked. No hand edits.
 * Usage: node relink-work-item.cjs <rootPath> --intent ID --work-items a,b
 */
const fs = require('fs');
const lib = require('./lib.cjs');

function assignedWorkItemIds(root, contract) {
  const assigned = new Set();
  for (const bolt of lib.listBolts(root, contract)) {
    if (bolt.status === 'abandoned' || bolt.status === 'draft') continue;
    for (const wi of lib.splitList(bolt.work_items)) assigned.add(wi);
  }
  return assigned;
}

function relinkWorkItems(rootPath, opts) {
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
      'Create it with init-intent, then pass that id to --intent.'
    );
  }

  const ids = lib.splitList(opts.workItems);
  if (!ids.length) {
    throw lib.terminal(
      'WORK_ITEMS_REQUIRED',
      'At least one work item id is required.',
      'Pass --work-items id1,id2 after the user confirms which items belong to the intent.'
    );
  }

  const assigned = assignedWorkItemIds(root, contract);
  const current = lib.listAllWorkItems(root, contract).map((w) => ({
    id: w.id,
    depends_on: lib.splitList(w.depends_on),
  }));
  const cycle = lib.detectCycle(current);
  if (cycle) {
    throw lib.terminal(
      'DEPENDENCY_CYCLE',
      `Dependency cycle refused: ${cycle.join(' → ')}.`,
      'Fix --depends-on before relinking.'
    );
  }

  const moved = [];
  const touched = new Set([intentId]);

  for (const id of ids) {
    const item = lib.findWorkItem(root, id, contract);
    if (item.status !== 'pending') {
      throw lib.terminal(
        'WORK_ITEM_NOT_PENDING',
        `Work item "${id}" is ${item.status} and cannot be relinked.`,
        'Only pending work items can change intent.'
      );
    }
    if (assigned.has(id)) {
      throw lib.terminal(
        'WORK_ITEM_ASSIGNED',
        `Work item "${id}" is named on an active or complete bolt.`,
        'Only items not yet in a non-draft bolt can change intent.'
      );
    }
    if (item.intent === intentId) {
      moved.push({ id, path: item.path, intent: intentId, unchanged: true });
      continue;
    }

    const dest = lib.workItemPath(root, intentId, item.id, contract);
    lib.assertInsideRoot(root, dest, contract);
    lib.assertInsideRoot(root, item.path, contract);
    if (fs.existsSync(dest)) {
      throw lib.terminal(
        'WORK_ITEM_EXISTS',
        `Work item "${id}" already exists under ${intentId}.`,
        'Choose a different item or inspect the destination path.'
      );
    }

    touched.add(item.intent);
    const parsed = lib.readMarkdown(item.path);
    parsed.data.intent = intentId;
    lib.writeMarkdown(dest, parsed.data, parsed.body, root, contract);
    fs.unlinkSync(item.path);
    moved.push({ id, path: dest, from: item.intent, intent: intentId });
  }

  const intentStatuses = {};
  for (const iid of touched) {
    const items = lib.listWorkItems(root, iid, contract);
    const intent = lib.readMarkdown(lib.intentPath(root, iid, contract));
    if (iid === intentId && (intent.data.status === 'complete' || intent.data.status === 'abandoned')) {
      intent.data.status = 'active';
    } else {
      intent.data.status = lib.deriveIntentStatus(items, contract);
    }
    lib.writeMarkdown(intent.path, intent.data, intent.body, root, contract);
    intentStatuses[iid] = intent.data.status;
  }

  return { intent: intentId, work_items: moved, intents: intentStatuses };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return relinkWorkItems(positional[0], {
      intent: flags.intent,
      workItems: flags['work-items'],
    });
  });
}

module.exports = { relinkWorkItems };
