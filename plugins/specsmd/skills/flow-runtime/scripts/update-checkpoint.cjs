#!/usr/bin/env node
/**
 * Record a gate decision. Accepts natural approval phrases.
 * Usage: node update-checkpoint.cjs <rootPath> <boltId> <phrase>
 */
const path = require('path');
const lib = require('./lib.cjs');
const { applyTimeBoxIfExpired } = require('./complete-bolt.cjs');

function updateCheckpoint(rootPath, boltId, phrase) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!boltId) throw lib.terminal('BOLT_REQUIRED', 'A bolt id is required.', 'Pass the bolt id as the second argument.');
  if (phrase == null || phrase === '') {
    throw lib.terminal(
      'DECISION_REQUIRED',
      'A checkpoint decision is required.',
      `Pass an approval phrase (${contract.approval.grant.slice(0, 5).join(', ')}).`
    );
  }

  const expired = applyTimeBoxIfExpired(root, boltId);
  if (expired) {
    throw lib.terminal(
      'TIME_BOX_EXPIRED',
      `Bolt "${boltId}" exceeded its time box and was completed with findings.`,
      `Read ${path.join(lib.boltDir(root, boltId, contract), ((contract.recipe.time_box || {}).findings_artifact) || 'findings.md')}. The bolt is complete; start a new bolt if more work remains.`
    );
  }

  const bolt = lib.readBolt(root, boltId, contract);
  if (bolt.data.status !== 'active') {
    throw lib.terminal(
      'BOLT_NOT_ACTIVE',
      `Bolt "${boltId}" is ${bolt.data.status}, not active.`,
      'Only an active bolt can record a checkpoint.'
    );
  }

  const recipe = lib.recipeForBolt(root, bolt.data, contract);
  if (!lib.stageNeedsGate(recipe, bolt.data.current_stage, bolt.data.ceremony, contract)) {
    throw lib.terminal(
      'GATE_NOT_REQUIRED',
      `Bolt "${boltId}" has no checkpoint on stage "${bolt.data.current_stage}".`,
      `Ceremony ${bolt.data.ceremony} does not gate this stage. Continue with update-stage; do not record a checkpoint.`
    );
  }

  const normalized = lib.normalizeApproval(phrase, contract);
  if (normalized === 'denied') {
    bolt.data.checkpoint_state = 'awaiting';
    lib.touchUpdated(bolt.data);
    lib.writeMarkdown(bolt.path, bolt.data, bolt.body, root, contract);
    return {
      id: boltId,
      checkpoint_state: 'awaiting',
      accepted: false,
      note: 'Denial leaves the gate awaiting a later approval. Edit the artifacts and ask again.',
    };
  }

  bolt.data.checkpoint_state = normalized;
  lib.touchUpdated(bolt.data);
  lib.writeMarkdown(bolt.path, bolt.data, bolt.body, root, contract);
  return { id: boltId, checkpoint_state: normalized, accepted: normalized === 'granted' };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional } = lib.parseArgs(process.argv);
    return updateCheckpoint(positional[0], positional[1], positional.slice(2).join(' '));
  });
}

module.exports = { updateCheckpoint };
