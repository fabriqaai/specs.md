#!/usr/bin/env node
/**
 * Create a bolt. Recipe and ceremony are recorded at creation and do not change.
 * Usage: node init-bolt.cjs <rootPath> --work-items a,b [--recipe default] [--ceremony confirm] [--adopt-draft ID]
 */
const path = require('path');
const lib = require('./lib.cjs');

function resolveWorkItems(rootPath, ids, contract) {
  return ids.map((id) => {
    const item = lib.findWorkItem(rootPath, id, contract);
    if (item.status === 'complete' || item.status === 'abandoned') {
      throw lib.terminal(
        'WORK_ITEM_TERMINAL',
        `Work item "${id}" is ${item.status} and cannot join a new bolt.`,
        'Pick pending or active work items, or abandon this bolt idea.'
      );
    }
    return item;
  });
}

function initBolt(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  let workItemIds = lib.splitList(opts.workItems);
  let recipeId = opts.recipe;
  let ceremony = opts.ceremony;
  let adoptedDraft = null;

  if (opts.adoptDraft) {
    const draft = lib.readBolt(root, opts.adoptDraft, contract);
    if (draft.data.status !== 'draft') {
      throw lib.terminal(
        'NOT_A_DRAFT',
        `Bolt "${opts.adoptDraft}" is ${draft.data.status}, not a draft.`,
        'Pass --adopt-draft with a bolt whose status is draft, or start a new bolt without that flag.'
      );
    }
    adoptedDraft = draft.data.id;
    if (!workItemIds.length) workItemIds = lib.splitList(draft.data.work_items);
    if (!recipeId) recipeId = draft.data.recipe;
    if (!ceremony) ceremony = draft.data.ceremony;
  }

  if (!workItemIds.length) {
    throw lib.terminal(
      'WORK_ITEMS_REQUIRED',
      'A bolt needs at least one work item.',
      'Pass --work-items id1,id2 or --adopt-draft <draft-id>.'
    );
  }

  const items = resolveWorkItems(root, workItemIds, contract);
  const cycle = lib.detectCycle(items.map((w) => ({ id: w.id, depends_on: lib.splitList(w.depends_on) })));
  if (cycle) {
    throw lib.terminal(
      'DEPENDENCY_CYCLE',
      `Dependency cycle refused: ${cycle.join(' → ')}.`,
      'Remove one item from the cycle or fix --depends-on before starting the bolt.'
    );
  }
  const project = lib.readProject(root, contract);
  const maxComplexity = pickHighestComplexity(items.map((i) => i.complexity), contract);

  if (!recipeId) recipeId = lib.recommendRecipe(maxComplexity, contract);
  let recipe;
  if (opts.adoptDraft && !opts.recipe) {
    const draft = lib.readBolt(root, opts.adoptDraft, contract);
    if (draft.data.recipe_snapshot) {
      recipe = lib.normalizeRecipe(draft.data.recipe_snapshot, recipeId, contract);
    }
  }
  if (!recipe) recipe = lib.loadRecipe(root, recipeId, contract);

  if (!ceremony) {
    ceremony = pickMostControlledCeremony(items, project.data.autonomy_bias, contract);
  }
  if (!contract.ceremony.values.includes(ceremony)) {
    throw lib.terminal(
      'CEREMONY_INVALID',
      `Ceremony "${ceremony}" is not in the contract.`,
      `Use one of: ${contract.ceremony.values.join(', ')}.`
    );
  }

  const boltsDir = path.join(lib.artifactRoot(root, contract), 'bolts');
  const token = lib.worktreeToken(root);
  const prefix = `${contract.identifiers.bolt_prefix}-${token}`;
  const existing = lib.listDirNames(boltsDir);
  const seq = lib.nextPrefixedId(existing, contract.identifiers.bolt_width, prefix);
  const id = `${prefix}-${seq}`;

  const firstStage = recipe.stages[0].id;
  const checkpoint = lib.initialCheckpoint(recipe, firstStage, ceremony, contract);
  const file = lib.boltPath(root, id, contract);
  lib.assertInsideRoot(root, file, contract);

  const created = lib.nowStamp();
  const data = {
    id,
    status: 'active',
    recipe: recipe.id,
    recipe_snapshot: lib.snapshotRecipe(recipe),
    ceremony,
    current_stage: firstStage,
    stages_completed: [],
    checkpoint_state: checkpoint,
    work_items: workItemIds,
    override: false,
    activated_at: created,
    created,
    completed: null,
  };
  if (adoptedDraft) data.adopted_draft = adoptedDraft;

  const body = `# Bolt: ${id}\n\nRecipe: ${recipe.id}. Ceremony: ${ceremony}. Work items: ${workItemIds.join(', ')}.\n`;
  lib.writeMarkdown(file, data, body, root, contract);

  if (adoptedDraft) {
    const draftFile = lib.boltPath(root, adoptedDraft, contract);
    const draft = lib.readMarkdown(draftFile);
    draft.data.status = 'abandoned';
    lib.writeMarkdown(draftFile, draft.data, draft.body, root, contract);
  }

  for (const item of items) {
    if (item.status === 'pending') {
      item.status = 'active';
      const parsed = lib.readMarkdown(item.path);
      parsed.data.status = 'active';
      lib.writeMarkdown(item.path, parsed.data, parsed.body, root, contract);
    }
    const intent = lib.readMarkdown(lib.intentPath(root, item.intent, contract));
    if (intent.data.status !== 'active') {
      intent.data.status = 'active';
      lib.writeMarkdown(intent.path, intent.data, intent.body, root, contract);
    }
  }

  return {
    id,
    path: file,
    recipe: recipe.id,
    recipe_snapshot: data.recipe_snapshot,
    ceremony,
    current_stage: firstStage,
    checkpoint_state: checkpoint,
    work_items: workItemIds,
    activated_at: created,
    adopted_draft: adoptedDraft,
  };
}

function pickHighestComplexity(values, contract) {
  const order = contract.ceremony.complexity.values;
  const valid = values.filter((v) => order.includes(v));
  if (!valid.length) return contract.ceremony.complexity.default;
  return valid.reduce((best, v) => (order.indexOf(v) > order.indexOf(best) ? v : best));
}

function pickMostControlledCeremony(items, autonomyBias, contract) {
  const order = contract.ceremony.values;
  let best = null;
  for (const item of items) {
    const value =
      item.ceremony_suggested && order.includes(item.ceremony_suggested)
        ? item.ceremony_suggested
        : lib.suggestCeremony(item.complexity, autonomyBias, contract);
    if (best == null || order.indexOf(value) > order.indexOf(best)) best = value;
  }
  return best || lib.suggestCeremony(contract.ceremony.complexity.default, autonomyBias, contract);
}

function initDraft(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);
  const workItemIds = lib.splitList(opts.workItems);
  if (!workItemIds.length) {
    throw lib.terminal('WORK_ITEMS_REQUIRED', 'A draft bolt needs at least one work item.', 'Pass --work-items id1,id2.');
  }
  resolveWorkItems(root, workItemIds, contract);
  const items = workItemIds.map((id) => lib.findWorkItem(root, id, contract));
  const cycle = lib.detectCycle(items.map((w) => ({ id: w.id, depends_on: lib.splitList(w.depends_on) })));
  if (cycle) {
    throw lib.terminal(
      'DEPENDENCY_CYCLE',
      `Dependency cycle refused: ${cycle.join(' → ')}.`,
      'Remove one item from the cycle or fix --depends-on before drafting the bolt.'
    );
  }
  const maxComplexity = pickHighestComplexity(items.map((i) => i.complexity), contract);
  const recipeId = opts.recipe || lib.recommendRecipe(maxComplexity, contract);
  const recipe = lib.loadRecipe(root, recipeId, contract);
  const project = lib.readProject(root, contract);
  const ceremony = opts.ceremony || pickMostControlledCeremony(items, project.data.autonomy_bias, contract);
  if (!contract.ceremony.values.includes(ceremony)) {
    throw lib.terminal(
      'CEREMONY_INVALID',
      `Ceremony "${ceremony}" is not in the contract.`,
      `Use one of: ${contract.ceremony.values.join(', ')}.`
    );
  }

  const boltsDir = path.join(lib.artifactRoot(root, contract), 'bolts');
  const token = lib.worktreeToken(root);
  const prefix = `${contract.identifiers.bolt_prefix}-${token}`;
  const seq = lib.nextPrefixedId(lib.listDirNames(boltsDir), contract.identifiers.bolt_width, prefix);
  const id = `${prefix}-${seq}`;
  const file = lib.boltPath(root, id, contract);
  lib.writeMarkdown(
    file,
    {
      id,
      status: 'draft',
      recipe: recipe.id,
      recipe_snapshot: lib.snapshotRecipe(recipe),
      ceremony,
      current_stage: null,
      stages_completed: [],
      checkpoint_state: 'none',
      work_items: workItemIds,
      override: false,
      activated_at: null,
      created: lib.nowStamp(),
      completed: null,
    },
    `# Draft bolt: ${id}\n\nProposal only. Starting a bolt may adopt, modify, or ignore this draft.\n`,
    root,
    contract
  );
  return { id, path: file, status: 'draft', recipe: recipe.id, ceremony, work_items: workItemIds };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    const opts = {
      workItems: flags['work-items'],
      recipe: flags.recipe,
      ceremony: flags.ceremony,
      adoptDraft: flags['adopt-draft'],
    };
    if (flags.draft === true || flags.draft === 'true') return initDraft(positional[0], opts);
    return initBolt(positional[0], opts);
  });
}

module.exports = { initBolt, initDraft };
