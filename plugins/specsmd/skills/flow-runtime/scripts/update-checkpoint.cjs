#!/usr/bin/env node
/**
 * Record a gate decision. Accepts natural approval phrases.
 * Usage: node update-checkpoint.cjs <rootPath> <boltId> <phrase>
 */
const lib = require('./lib.cjs');

function updateCheckpoint(rootPath, boltId, phrase) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  if (!boltId) throw lib.terminal('BOLT_REQUIRED', 'A bolt id is required.', 'Pass the bolt id as the second argument.');
  if (phrase == null || phrase === '') {
    throw lib.terminal(
      'DECISION_REQUIRED',
      'A checkpoint decision is required.',
      `Pass an approval phrase (${contract.approval.grant.slice(0, 5).join(', ')}) or a checkpoint state.`
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

  const normalized = lib.normalizeApproval(phrase, contract);
  if (normalized === 'denied') {
    bolt.data.checkpoint_state = 'awaiting';
    lib.writeMarkdown(bolt.path, bolt.data, bolt.body);
    return {
      id: boltId,
      checkpoint_state: 'awaiting',
      accepted: false,
      note: 'Denial leaves the gate awaiting a later approval. Edit the artifacts and ask again.',
    };
  }

  bolt.data.checkpoint_state = normalized;
  lib.writeMarkdown(bolt.path, bolt.data, bolt.body);
  return { id: boltId, checkpoint_state: normalized, accepted: normalized === 'granted' };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional } = lib.parseArgs(process.argv);
    return updateCheckpoint(positional[0], positional[1], positional.slice(2).join(' '));
  });
}

module.exports = { updateCheckpoint };
