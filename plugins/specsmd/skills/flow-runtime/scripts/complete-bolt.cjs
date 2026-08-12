#!/usr/bin/env node
/**
 * Complete a bolt. Goal-gated: refuses while recipe evidence or gating criteria are missing.
 * Usage: node complete-bolt.cjs <rootPath> <boltId> [--force]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

function completeBolt(rootPath, boltId, force) {
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

  const recipe = lib.loadRecipe(root, bolt.data.recipe, contract);
  const dir = lib.boltDir(root, boltId, contract);
  const missingFiles = (recipe.completion_requires || []).filter((name) => !fs.existsSync(path.join(dir, name)));

  const missingCriteria = [];
  for (const workItemId of lib.splitList(bolt.data.work_items)) {
    const item = lib.findWorkItem(root, workItemId, contract);
    for (const criterion of lib.uncheckedGatingCriteria(item.body)) {
      missingCriteria.push(`${workItemId}: ${criterion}`);
    }
  }

  const walkthroughFile = path.join(dir, 'walkthrough.md');
  if (fs.existsSync(walkthroughFile)) {
    const wt = fs.readFileSync(walkthroughFile, 'utf8');
    const parsed = lib.parseFrontmatter(wt);
    const body = parsed ? parsed.body : wt;
    if (lib.walkthroughHasCode(body)) {
      if (!force) {
        throw lib.terminal(
          'WALKTHROUGH_HAS_CODE',
          'The walkthrough contains a fenced code block.',
          `Remove language-tagged code fences from ${walkthroughFile}. Describe what changed and how to verify, without code.`
        );
      }
    }
  }

  if ((missingFiles.length || missingCriteria.length) && !force) {
    const parts = [];
    if (missingFiles.length) {
      parts.push(`missing evidence: ${missingFiles.map((f) => path.join(dir, f)).join(', ')}`);
    }
    if (missingCriteria.length) {
      parts.push(`unchecked gating criteria: ${missingCriteria.join('; ')}`);
    }
    throw lib.terminal(
      'COMPLETE_BLOCKED',
      `Completing bolt "${boltId}" is refused — ${parts.join(' | ')}.`,
      `${missingFiles.length ? 'Write the missing evidence files. ' : ''}${missingCriteria.length ? 'Mark each gating criterion [x] only when the behavior is true. ' : ''}Then retry complete-bolt. To override, pass --force (the override is recorded on the bolt).`
    );
  }

  bolt.data.status = 'complete';
  bolt.data.completed = lib.nowStamp();
  bolt.data.current_stage = null;
  if (force && (missingFiles.length || missingCriteria.length || lib.walkthroughHasCode(fs.existsSync(walkthroughFile) ? fs.readFileSync(walkthroughFile, 'utf8') : ''))) {
    bolt.data.override = true;
    bolt.data.override_reason = [
      missingFiles.length ? `missing:${missingFiles.join(',')}` : null,
      missingCriteria.length ? `criteria:${missingCriteria.length}` : null,
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
  lib.writeMarkdown(bolt.path, bolt.data, bolt.body);

  const touchedIntents = new Set();
  for (const workItemId of lib.splitList(bolt.data.work_items)) {
    const item = lib.findWorkItem(root, workItemId, contract);
    const parsed = lib.readMarkdown(item.path);
    parsed.data.status = 'complete';
    lib.writeMarkdown(item.path, parsed.data, parsed.body);
    touchedIntents.add(item.intent);
  }

  const intentStatuses = {};
  for (const intentId of touchedIntents) {
    const items = lib.listWorkItems(root, intentId, contract);
    const allTerminal = items.every((w) => contract.status.terminal.includes(w.status) || w.status === 'complete');
    const anyActive = items.some((w) => w.status === 'active' || w.status === 'pending');
    const intent = lib.readMarkdown(lib.intentPath(root, intentId, contract));
    if (allTerminal && items.length) {
      intent.data.status = items.every((w) => w.status === 'abandoned') ? 'abandoned' : 'complete';
    } else if (anyActive) {
      intent.data.status = 'active';
    }
    lib.writeMarkdown(intent.path, intent.data, intent.body);
    intentStatuses[intentId] = intent.data.status;
  }

  return {
    id: boltId,
    status: 'complete',
    override: !!bolt.data.override,
    work_items: bolt.data.work_items,
    intents: intentStatuses,
    completed: bolt.data.completed,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return completeBolt(positional[0], positional[1], flags.force === true || flags.force === 'true');
  });
}

module.exports = { completeBolt };
