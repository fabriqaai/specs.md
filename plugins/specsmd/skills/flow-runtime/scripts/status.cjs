#!/usr/bin/env node
/**
 * Read-only status through the three lenses. Never writes.
 * Usage: node status.cjs <rootPath>
 */
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');
const { collectFindings, scanTree } = require('./validate-integrity.cjs');

function collectHealth(rootPath, contract) {
  try {
    return collectFindings(rootPath, contract);
  } catch (err) {
    return [
      {
        id: 'F1',
        code: err.code || 'VALIDATOR_FAILED',
        class: 'unreadable',
        severity: 'error',
        auto_repairable: false,
        message: err.message,
        remediation: err.remediation || 'Run validate-integrity.cjs and read the remediation on each finding.',
      },
    ];
  }
}

function suggestNext(lenses, initialized, drafts) {
  const options = [];
  if (!initialized) {
    options.push({ skill: 'specsmd-init', why: 'No artifact root yet — initialize the project.' });
    return { best: options[0], options };
  }

  const awaiting = (lenses.building || []).filter((b) => b.checkpoint_state === 'awaiting' && !b.time_box_expired);
  const expired = (lenses.building || []).filter((b) => b.time_box_expired);
  const active = (lenses.building || []).filter((b) => b.checkpoint_state !== 'awaiting' && !b.time_box_expired);
  const emptyIntent = (lenses.shaping || []).find((s) => s.kind === 'intent' && s.work_item_count === 0);
  const unbolted = (lenses.shaping || []).some((s) => s.kind === 'work-item');
  const draftList = drafts || [];
  const noIntents =
    !(lenses.shaping || []).some((s) => s.kind === 'intent') &&
    !(lenses.building || []).length &&
    !(lenses.shipping || []).length;

  // Locked order (007): awaiting gate → active bolt → empty intent → unbolted → drafts → empty tree
  if (awaiting.length) {
    options.push({
      skill: 'bolt-execute',
      why: `Bolt ${awaiting[0].id} is awaiting approval on ${awaiting[0].current_stage}.`,
    });
  }
  if (expired.length) {
    options.push({
      skill: 'bolt-execute',
      why: `Bolt ${expired[0].id} exceeded its time box. The next update-stage, update-checkpoint, or complete-bolt will complete it with findings.`,
    });
  }
  if (active.length) {
    options.push({
      skill: 'bolt-execute',
      why: `Bolt ${active[0].id} is active at ${active[0].current_stage || 'completion'}. Resume it.`,
    });
  }
  if (emptyIntent) {
    options.push({
      skill: 'work-item-decompose',
      why: `Intent ${emptyIntent.id} has no work items yet.`,
    });
  }
  if (unbolted) {
    options.push({
      skill: 'bolt-start',
      why: 'Shaped work items are not in a bolt yet.',
    });
  }
  if (draftList.length) {
    options.push({
      skill: 'bolt-start',
      why: `Draft ${draftList[0].id} can be adopted, modified, or ignored.`,
    });
  }
  if (noIntents) {
    options.push({ skill: 'intent-create', why: 'The artifact tree has no intents yet.' });
  }
  if (!options.length) {
    options.push({ skill: 'intent-create', why: 'Nothing required; any skill may be invoked by name.' });
  }
  return { best: options[0], options };
}

function projectStatus(rootPath) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const initialized = lib.projectExists(root, contract) || require('fs').existsSync(lib.artifactRoot(root, contract));
  if (!initialized) {
    return {
      initialized: false,
      artifactRoot: lib.artifactRoot(root, contract),
      lenses: { shaping: [], building: [], shipping: [] },
      read_path: {
        order: ['system', 'standards', 'decisions_index'],
        system: [],
        standards: [],
        decisions_index: { path: 'decisions/index.md', in_force: [] },
        guidance:
          'Read semantic memory first (system/, standards/, decisions/index.md). Open episodic artifacts only when a semantic document refers to them or the user asks for history.',
      },
      health: [],
      suggestion: suggestNext({ shaping: [], building: [], shipping: [] }, false, []),
    };
  }

  const arts = scanTree(root, contract);
  const intents = arts.intents;
  const workItems = arts.workItems;
  const bolts = arts.bolts;
  const assigned = new Set();
  for (const bolt of bolts) {
    if (bolt.status === 'abandoned' || bolt.status === 'draft') continue;
    for (const wi of lib.splitList(bolt.work_items)) assigned.add(wi);
  }

  function isAssigned(item) {
    return assigned.has(item.id) || assigned.has(item.locationId);
  }

  const shaping = [];
  for (const intent of intents) {
    const items = workItems.filter((w) => w.intent === intent.id || w.locationIntent === intent.locationId);
    const unbolted = items.filter((w) => !isAssigned(w) && w.status !== 'complete' && w.status !== 'abandoned');
    if (intent.status !== 'complete' && intent.status !== 'abandoned' && (unbolted.length || !items.length)) {
      shaping.push({
        kind: 'intent',
        id: intent.id || intent.locationId,
        title: intent.title,
        status: intent.status,
        work_item_count: items.length,
        unbolted_count: unbolted.length,
      });
    }
    for (const w of unbolted) {
      shaping.push({
        kind: 'work-item',
        id: w.id || w.locationId,
        title: w.title,
        status: w.status,
        intent: w.intent || w.locationIntent,
        complexity: w.complexity,
        ceremony_suggested: w.ceremony_suggested,
      });
    }
  }

  const intentKeys = new Set(intents.flatMap((i) => [i.id, i.locationId].filter(Boolean)));
  for (const w of workItems) {
    const parent = w.intent || w.locationIntent;
    if (intentKeys.has(parent)) continue;
    if (isAssigned(w) || w.status === 'complete' || w.status === 'abandoned') continue;
    shaping.push({
      kind: 'work-item',
      id: w.id || w.locationId,
      title: w.title,
      status: w.status,
      intent: parent,
      complexity: w.complexity,
      ceremony_suggested: w.ceremony_suggested,
    });
  }

  const building = bolts
    .filter((b) => b.status === 'active')
    .map((b) => {
      let expired = false;
      try {
        const recipe = lib.recipeForBolt(root, b, contract);
        expired = lib.isTimeBoxExpired(b, recipe);
      } catch {
        expired = false;
      }
      return {
        kind: 'bolt',
        id: b.id || b.locationId,
        status: b.status,
        recipe: b.recipe,
        ceremony: b.ceremony,
        current_stage: b.current_stage,
        checkpoint_state: b.checkpoint_state,
        work_items: b.work_items,
        time_box_expired: expired,
        note: expired
          ? 'Time box expired. The next update-stage, update-checkpoint, or complete-bolt will complete this bolt with findings.'
          : undefined,
      };
    });

  const shippingById = new Map();
  for (const b of bolts.filter((bolt) => bolt.status === 'complete')) {
    shippingById.set(b.id || b.locationId, {
      kind: 'bolt',
      id: b.id || b.locationId,
      status: b.status,
      completed: b.completed,
      work_items: b.work_items,
      archived: !!b.archived,
    });
  }
  for (const entry of memory.readCompactIndex(root, contract).entries) {
    if (shippingById.has(entry.id)) continue;
    shippingById.set(entry.id, {
      kind: 'bolt',
      id: entry.id,
      status: entry.status || 'complete',
      completed: entry.completed,
    });
  }
  const shipping = [...shippingById.values()];

  const drafts = bolts
    .filter((b) => b.status === 'draft')
    .map((b) => ({ id: b.id || b.locationId, work_items: b.work_items, recipe: b.recipe }));

  const lenses = { shaping, building, shipping };
  const health = collectHealth(root, contract);
  return {
    initialized: true,
    artifactRoot: lib.artifactRoot(root, contract),
    autonomy_bias: arts.project ? arts.project.autonomy_bias : null,
    lenses,
    drafts,
    read_path: memory.semanticReadPath(root, contract),
    health,
    suggestion: suggestNext(lenses, true, drafts, health),
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional } = lib.parseArgs(process.argv);
    return projectStatus(positional[0] || process.cwd());
  });
}

module.exports = { projectStatus };
