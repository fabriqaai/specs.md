#!/usr/bin/env node
/**
 * Read-only status through the three lenses. Never writes.
 * Usage: node status.cjs <rootPath>
 */
const lib = require('./lib.cjs');

function collectHealth(rootPath, contract, intents, workItems, bolts) {
  const findings = [];
  const knownStatus = new Set(contract.status.values);
  for (const art of [...intents, ...workItems, ...bolts]) {
    if (art.status && !knownStatus.has(art.status)) {
      findings.push({
        severity: 'error',
        code: 'STATUS_DRIFT',
        message: `${art.id} has status "${art.status}" which is not in the contract.`,
        remediation: `Set status to one of: ${contract.status.values.join(', ')}.`,
      });
    }
  }
  for (const bolt of bolts) {
    for (const wi of lib.splitList(bolt.work_items)) {
      if (!workItems.some((w) => w.id === wi)) {
        findings.push({
          severity: 'error',
          code: 'ORPHAN_WORK_ITEM',
          message: `Bolt ${bolt.id} names work item "${wi}" which does not exist.`,
          remediation: `Create the work item or remove it from ${bolt.id}'s work_items.`,
        });
      }
    }
    if (bolt.status === 'complete') {
      for (const wi of lib.splitList(bolt.work_items)) {
        const item = workItems.find((w) => w.id === wi);
        if (item && item.status !== 'complete' && item.status !== 'abandoned') {
          findings.push({
            severity: 'error',
            code: 'CASCADE_DRIFT',
            message: `Bolt ${bolt.id} is complete but work item ${wi} is ${item.status}.`,
            remediation: `Set ${wi} to complete, or re-run complete-bolt.`,
          });
        }
      }
    }
  }
  return findings;
}

function suggestNext(lenses, initialized, drafts) {
  const options = [];
  if (!initialized) {
    options.push({ skill: 'specsmd-init', why: 'No artifact root yet — initialize the project.' });
    return { best: options[0], options };
  }

  const expired = (lenses.building || []).filter((b) => b.time_box_expired);
  const awaiting = (lenses.building || []).filter((b) => b.checkpoint_state === 'awaiting' && !b.time_box_expired);
  const active = (lenses.building || []).filter((b) => b.checkpoint_state !== 'awaiting' && !b.time_box_expired);
  const emptyIntent = (lenses.shaping || []).find((s) => s.kind === 'intent' && s.work_item_count === 0);
  const unbolted = (lenses.shaping || []).some((s) => s.kind === 'work-item');
  const draftList = drafts || [];
  const noIntents =
    !(lenses.shaping || []).some((s) => s.kind === 'intent') &&
    !(lenses.building || []).length &&
    !(lenses.shipping || []).length;

  // Locked order: expired time box > awaiting > active bolt > empty intent > unbolted items > drafts > shipping > empty tree
  if (expired.length) {
    options.push({
      skill: 'bolt-execute',
      why: `Bolt ${expired[0].id} exceeded its time box. The next update-stage, update-checkpoint, or complete-bolt will complete it with findings.`,
    });
  }
  if (awaiting.length) {
    options.push({
      skill: 'bolt-execute',
      why: `Bolt ${awaiting[0].id} is awaiting approval on ${awaiting[0].current_stage}.`,
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
  if (draftList.length && !(lenses.building || []).length) {
    options.push({
      skill: 'bolt-start',
      why: `Draft ${draftList[0].id} can be adopted, modified, or ignored.`,
    });
  }
  if ((lenses.shipping || []).length) {
    options.push({
      skill: 'specsmd-status',
      why: `${lenses.shipping.length} completed bolt(s) are in the shipping lens. Release is optional.`,
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
      health: [],
      suggestion: suggestNext({ shaping: [], building: [], shipping: [] }, false, []),
    };
  }

  const intents = lib.listIntents(root, contract);
  const workItems = lib.listAllWorkItems(root, contract);
  const bolts = lib.listBolts(root, contract);
  const assigned = new Set();
  for (const bolt of bolts) {
    if (bolt.status === 'abandoned' || bolt.status === 'draft') continue;
    for (const wi of lib.splitList(bolt.work_items)) assigned.add(wi);
  }

  const shaping = [];
  for (const intent of intents) {
    const items = workItems.filter((w) => w.intent === intent.id);
    const unbolted = items.filter((w) => !assigned.has(w.id) && w.status !== 'complete' && w.status !== 'abandoned');
    if (intent.status !== 'complete' && intent.status !== 'abandoned' && (unbolted.length || !items.length)) {
      shaping.push({
        kind: 'intent',
        id: intent.id,
        title: intent.title,
        status: intent.status,
        work_item_count: items.length,
        unbolted_count: unbolted.length,
      });
    }
    for (const w of unbolted) {
      shaping.push({
        kind: 'work-item',
        id: w.id,
        title: w.title,
        status: w.status,
        intent: w.intent,
        complexity: w.complexity,
        ceremony_suggested: w.ceremony_suggested,
      });
    }
  }

  const building = bolts
    .filter((b) => b.status === 'active')
    .map((b) => {
      const recipe = lib.recipeForBolt(root, b, contract);
      const expired = lib.isTimeBoxExpired(b, recipe);
      return {
        kind: 'bolt',
        id: b.id,
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

  const shipping = bolts
    .filter((b) => b.status === 'complete')
    .map((b) => ({
      kind: 'bolt',
      id: b.id,
      status: b.status,
      completed: b.completed,
      work_items: b.work_items,
    }));

  const drafts = bolts
    .filter((b) => b.status === 'draft')
    .map((b) => ({ id: b.id, work_items: b.work_items, recipe: b.recipe }));

  const lenses = { shaping, building, shipping };
  return {
    initialized: true,
    artifactRoot: lib.artifactRoot(root, contract),
    autonomy_bias: lib.projectExists(root, contract) ? lib.readProject(root, contract).data.autonomy_bias : null,
    lenses,
    drafts,
    health: collectHealth(root, contract, intents, workItems, bolts),
    suggestion: suggestNext(lenses, true, drafts),
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional } = lib.parseArgs(process.argv);
    return projectStatus(positional[0] || process.cwd());
  });
}

module.exports = { projectStatus };
