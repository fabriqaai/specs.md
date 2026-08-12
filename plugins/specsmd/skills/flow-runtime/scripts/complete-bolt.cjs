#!/usr/bin/env node
/**
 * Complete a bolt. Goal-gated: refuses while recipe evidence or gating criteria are missing.
 * Usage: node complete-bolt.cjs <rootPath> <boltId> [--force]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

function completeBolt(rootPath, boltId, force, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!boltId) throw lib.terminal('BOLT_REQUIRED', 'A bolt id is required.', 'Pass the bolt id as the second argument.');

  const bolt = lib.readBolt(root, boltId, contract);
  if (bolt.data.status === 'complete') {
    throw lib.terminal('BOLT_ALREADY_COMPLETE', `Bolt "${boltId}" is already complete.`, 'Nothing to do.');
  }
  if (bolt.data.status === 'abandoned' || bolt.data.status === 'draft') {
    throw lib.terminal(
      'BOLT_NOT_ACTIVE',
      `Bolt "${boltId}" is ${bolt.data.status} and cannot be completed.`,
      'Start or resume an active bolt.'
    );
  }

  const recipe = lib.recipeForBolt(root, bolt.data, contract);
  const fromTimeBox = !!(opts && opts.fromTimeBox) || lib.isTimeBoxExpired(bolt.data, recipe);
  const dir = lib.boltDir(root, boltId, contract);
  if (fromTimeBox) {
    lib.ensureFindingsArtifact(root, boltId, contract);
  }
  const missingFiles = (recipe.completion_requires || []).filter((name) => !fs.existsSync(path.join(dir, name)));

  const missingCriteria = [];
  for (const workItemId of lib.splitList(bolt.data.work_items)) {
    const item = lib.findWorkItem(root, workItemId, contract);
    for (const criterion of lib.uncheckedGatingCriteria(item.body)) {
      missingCriteria.push(`${workItemId}: ${criterion}`);
    }
  }

  const walkthroughFile = path.join(dir, 'walkthrough.md');
  const walkthroughText = fs.existsSync(walkthroughFile) ? fs.readFileSync(walkthroughFile, 'utf8') : '';
  const walkthroughBody = (() => {
    const parsed = walkthroughText ? lib.parseFrontmatter(walkthroughText) : null;
    return parsed ? parsed.body : walkthroughText;
  })();
  if (walkthroughText && lib.walkthroughHasCode(walkthroughBody) && !force && !fromTimeBox) {
    throw lib.terminal(
      'WALKTHROUGH_HAS_CODE',
      'The walkthrough contains a fenced code block.',
      `Remove language-tagged code fences from ${walkthroughFile}. Describe what changed and how to verify, without code.`
    );
  }

  const blockedByFiles = missingFiles.length > 0;
  const blockedByCriteria = missingCriteria.length > 0;
  if ((blockedByFiles || blockedByCriteria) && !force) {
    if (!(fromTimeBox && !blockedByFiles)) {
      const parts = [];
      if (blockedByFiles) {
        parts.push(`missing evidence: ${missingFiles.map((f) => path.join(dir, f)).join(', ')}`);
      }
      if (blockedByCriteria) {
        parts.push(`unchecked gating criteria: ${missingCriteria.join('; ')}`);
      }
      throw lib.terminal(
        'COMPLETE_BLOCKED',
        `Completing bolt "${boltId}" is refused — ${parts.join(' | ')}.`,
        `${blockedByFiles ? `Write ${missingFiles.map((f) => path.join(dir, f)).join(' and ')}. ` : ''}${blockedByCriteria ? 'Mark each gating criterion [x] only when the behavior is true. ' : ''}Then retry complete-bolt. To override, pass --force (the override is recorded on the bolt).`
      );
    }
  }

  bolt.data.status = 'complete';
  bolt.data.completed = lib.nowStamp();
  bolt.data.current_stage = null;
  if (force && (blockedByFiles || blockedByCriteria || lib.walkthroughHasCode(walkthroughBody))) {
    bolt.data.override = true;
    bolt.data.override_reason = [
      blockedByFiles ? `missing:${missingFiles.join(',')}` : null,
      blockedByCriteria ? `criteria:${missingCriteria.length}` : null,
    ]
      .filter(Boolean)
      .join('; ');
  }

  const allStages = recipe.stages.map((s) => s.id);
  const completed = Array.isArray(bolt.data.stages_completed) ? bolt.data.stages_completed.slice() : [];
  for (const s of allStages) {
    if (!completed.includes(s)) completed.push(s);
  }
  bolt.data.stages_completed = completed;
  lib.writeMarkdown(bolt.path, bolt.data, bolt.body, root, contract);

  const touchedIntents = new Set();
  for (const workItemId of lib.splitList(bolt.data.work_items)) {
    const item = lib.findWorkItem(root, workItemId, contract);
    const parsed = lib.readMarkdown(item.path);
    parsed.data.status = 'complete';
    lib.writeMarkdown(item.path, parsed.data, parsed.body, root, contract);
    touchedIntents.add(item.intent);
  }

  const intentStatuses = {};
  for (const intentId of touchedIntents) {
    const items = lib.listWorkItems(root, intentId, contract);
    const intent = lib.readMarkdown(lib.intentPath(root, intentId, contract));
    intent.data.status = lib.deriveIntentStatus(items, contract);
    lib.writeMarkdown(intent.path, intent.data, intent.body, root, contract);
    intentStatuses[intentId] = intent.data.status;
  }

  return {
    id: boltId,
    status: 'complete',
    override: !!bolt.data.override,
    work_items: bolt.data.work_items,
    intents: intentStatuses,
    completed: bolt.data.completed,
    time_box_expired: fromTimeBox,
  };
}

function applyTimeBoxIfExpired(rootPath, boltId) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  const bolt = lib.readBolt(root, boltId, contract);
  const recipe = lib.recipeForBolt(root, bolt.data, contract);
  if (!lib.isTimeBoxExpired(bolt.data, recipe)) return null;
  return completeBolt(root, boltId, false, { fromTimeBox: true });
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return completeBolt(positional[0], positional[1], flags.force === true || flags.force === 'true');
  });
}

module.exports = { completeBolt, applyTimeBoxIfExpired };
