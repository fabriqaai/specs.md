#!/usr/bin/env node
/**
 * Record a stage complete and advance. State wins over leftover artifact files.
 * Usage: node update-stage.cjs <rootPath> <boltId> <stageId>
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');

function updateStage(rootPath, boltId, stageId) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!boltId) throw lib.terminal('BOLT_REQUIRED', 'A bolt id is required.', 'Pass the bolt id as the second argument.');
  if (!stageId) throw lib.terminal('STAGE_REQUIRED', 'A stage id is required.', 'Pass the stage to record complete as the third argument.');

  const bolt = lib.readBolt(root, boltId, contract);
  if (bolt.data.status !== 'active') {
    throw lib.terminal(
      'BOLT_NOT_ACTIVE',
      `Bolt "${boltId}" is ${bolt.data.status}, not active.`,
      'Only an active bolt can advance stages.'
    );
  }

  const recipe = lib.loadRecipe(root, bolt.data.recipe, contract);
  const stages = recipe.stages.map((s) => s.id);
  if (!stages.includes(stageId)) {
    throw lib.terminal(
      'STAGE_UNKNOWN',
      `Stage "${stageId}" is not in recipe "${recipe.id}".`,
      `Use one of: ${stages.join(', ')}.`
    );
  }
  if (bolt.data.current_stage !== stageId) {
    throw lib.terminal(
      'STAGE_NOT_CURRENT',
      `Bolt "${boltId}" is on stage "${bolt.data.current_stage}", not "${stageId}".`,
      `Resume from the recorded stage (${bolt.data.current_stage}). Do not infer the stage from which files exist.`
    );
  }

  if (bolt.data.checkpoint_state === 'awaiting') {
    throw lib.terminal(
      'GATE_AWAITING',
      `Stage "${stageId}" is waiting for approval.`,
      `Present the stage artifacts and run update-checkpoint with an approval phrase (yes, approved, go ahead, …).`
    );
  }

  const stage = recipe.stages.find((s) => s.id === stageId);
  const missing = (stage.produces || []).filter((name) => !fs.existsSync(path.join(lib.boltDir(root, boltId, contract), name)));
  if (missing.length) {
    throw lib.terminal(
      'STAGE_EVIDENCE_MISSING',
      `Stage "${stageId}" cannot complete; missing ${missing.join(', ')}.`,
      `Write ${missing.map((m) => path.join(lib.boltDir(root, boltId, contract), m)).join(' and ')} then retry update-stage.`
    );
  }

  const completed = Array.isArray(bolt.data.stages_completed) ? bolt.data.stages_completed.slice() : [];
  if (!completed.includes(stageId)) completed.push(stageId);

  const idx = stages.indexOf(stageId);
  const next = stages[idx + 1] || null;
  bolt.data.stages_completed = completed;
  bolt.data.current_stage = next;
  bolt.data.checkpoint_state = next
    ? lib.initialCheckpoint(recipe, next, bolt.data.ceremony, contract)
    : 'not-required';

  lib.writeMarkdown(bolt.path, bolt.data, bolt.body);

  return {
    id: boltId,
    completed_stage: stageId,
    current_stage: bolt.data.current_stage,
    stages_completed: bolt.data.stages_completed,
    checkpoint_state: bolt.data.checkpoint_state,
    recipe_complete: next == null,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional } = lib.parseArgs(process.argv);
    return updateStage(positional[0], positional[1], positional[2]);
  });
}

module.exports = { updateStage };
