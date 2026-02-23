#!/usr/bin/env node

/**
 * FIRE Checkpoint State Update Script
 *
 * Tracks explicit approval-gate state for the active work item in a run.
 *
 * Usage:
 *   node update-checkpoint.cjs <rootPath> <runId> <checkpointState> [--item=<workItemId>] [--checkpoint=<name>]
 *
 * Examples:
 *   node update-checkpoint.cjs /project run-fabriqa-2026-001 awaiting_approval --checkpoint=plan
 *   node update-checkpoint.cjs /project run-fabriqa-2026-001 approved
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const VALID_STATES = ['awaiting_approval', 'approved', 'none', 'not_required'];

function fireError(message, code, suggestion) {
  const err = new Error(`FIRE Error [${code}]: ${message} ${suggestion}`);
  err.code = code;
  err.suggestion = suggestion;
  return err;
}

function normalizeCheckpointState(value) {
  const normalized = String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const map = {
    waiting: 'awaiting_approval',
    awaiting: 'awaiting_approval',
    awaiting_approval: 'awaiting_approval',
    pending_approval: 'awaiting_approval',
    approval_needed: 'awaiting_approval',
    approval_required: 'awaiting_approval',
    approved: 'approved',
    confirmed: 'approved',
    accepted: 'approved',
    resumed: 'approved',
    none: 'none',
    clear: 'none',
    cleared: 'none',
    reset: 'none',
    not_required: 'not_required',
    n_a: 'not_required',
    na: 'not_required',
    skipped: 'not_required'
  };

  return map[normalized] || null;
}

function validateInputs(rootPath, runId, checkpointState) {
  if (!rootPath || typeof rootPath !== 'string' || rootPath.trim() === '') {
    throw fireError('rootPath is required.', 'CHECKPOINT_001', 'Provide a valid project root path.');
  }

  if (!runId || typeof runId !== 'string' || runId.trim() === '') {
    throw fireError('runId is required.', 'CHECKPOINT_002', 'Provide the run ID.');
  }

  const normalizedState = normalizeCheckpointState(checkpointState);
  if (!normalizedState || !VALID_STATES.includes(normalizedState)) {
    throw fireError(
      `Invalid checkpointState: "${checkpointState}".`,
      'CHECKPOINT_003',
      `Valid states are: ${VALID_STATES.join(', ')}`
    );
  }

  if (!fs.existsSync(rootPath)) {
    throw fireError(
      `Project root not found: "${rootPath}".`,
      'CHECKPOINT_004',
      'Ensure the path exists and is accessible.'
    );
  }

  return normalizedState;
}

function validateFireProject(rootPath) {
  const fireDir = path.join(rootPath, '.specs-fire');
  const statePath = path.join(fireDir, 'state.yaml');

  if (!fs.existsSync(fireDir)) {
    throw fireError(
      `FIRE project not initialized at: "${rootPath}".`,
      'CHECKPOINT_010',
      'Run fire-init first to initialize the project.'
    );
  }

  if (!fs.existsSync(statePath)) {
    throw fireError(
      `State file not found at: "${statePath}".`,
      'CHECKPOINT_011',
      'The project may be corrupted. Try re-initializing.'
    );
  }

  return { statePath };
}

function readState(statePath) {
  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const state = yaml.parse(content);
    if (!state || typeof state !== 'object') {
      throw fireError('State file is empty or invalid.', 'CHECKPOINT_020', 'Check state.yaml format.');
    }
    return state;
  } catch (err) {
    if (err.code && err.code.startsWith('CHECKPOINT_')) throw err;
    throw fireError(
      `Failed to read state file: ${err.message}`,
      'CHECKPOINT_021',
      'Check file permissions and YAML syntax.'
    );
  }
}

function writeState(statePath, state) {
  try {
    fs.writeFileSync(statePath, yaml.stringify(state));
  } catch (err) {
    throw fireError(
      `Failed to write state file: ${err.message}`,
      'CHECKPOINT_022',
      'Check file permissions and disk space.'
    );
  }
}

function updateCheckpoint(rootPath, runId, checkpointState, options = {}) {
  const normalizedState = validateInputs(rootPath, runId, checkpointState);
  const { statePath } = validateFireProject(rootPath);
  const state = readState(statePath);

  const activeRuns = state.runs?.active || [];
  const runIndex = activeRuns.findIndex((run) => run.id === runId);
  if (runIndex === -1) {
    throw fireError(
      `Run "${runId}" not found in active runs.`,
      'CHECKPOINT_030',
      'The run may have already been completed or was never started.'
    );
  }

  const activeRun = activeRuns[runIndex];
  const workItems = Array.isArray(activeRun.work_items) ? activeRun.work_items : [];
  const targetItemId = options.itemId || activeRun.current_item;
  if (!targetItemId) {
    throw fireError(
      `Run "${runId}" has no current item.`,
      'CHECKPOINT_031',
      'Specify --item=<workItemId> explicitly.'
    );
  }

  const itemIndex = workItems.findIndex((item) => item.id === targetItemId);
  if (itemIndex === -1) {
    throw fireError(
      `Work item "${targetItemId}" not found in run "${runId}".`,
      'CHECKPOINT_032',
      'Check the work item ID or run state.'
    );
  }

  const item = workItems[itemIndex];
  const previousState = item.checkpoint_state || null;
  item.checkpoint_state = normalizedState;

  if (typeof options.checkpoint === 'string' && options.checkpoint.trim() !== '') {
    item.current_checkpoint = options.checkpoint.trim();
  } else if (!item.current_checkpoint && (normalizedState === 'awaiting_approval' || normalizedState === 'approved')) {
    item.current_checkpoint = 'plan';
  }

  if (!item.current_phase && normalizedState === 'awaiting_approval') {
    item.current_phase = 'plan';
  }

  activeRun.work_items = workItems;
  state.runs.active[runIndex] = activeRun;
  writeState(statePath, state);

  return {
    success: true,
    runId,
    workItemId: targetItemId,
    checkpointState: normalizedState,
    previousCheckpointState: previousState,
    currentCheckpoint: item.current_checkpoint || null
  };
}

function parseOptions(argv) {
  const options = {};
  for (const arg of argv) {
    if (arg.startsWith('--item=')) {
      options.itemId = arg.slice('--item='.length);
    } else if (arg.startsWith('--checkpoint=')) {
      options.checkpoint = arg.slice('--checkpoint='.length);
    } else {
      throw fireError(
        `Unknown option: ${arg}`,
        'CHECKPOINT_033',
        'Use --item=<workItemId> or --checkpoint=<name>.'
      );
    }
  }
  return options;
}

function printUsage() {
  console.error('Usage:');
  console.error('  node update-checkpoint.cjs <rootPath> <runId> <checkpointState> [--item=<workItemId>] [--checkpoint=<name>]');
  console.error('');
  console.error('checkpointState:');
  console.error(`  ${VALID_STATES.join(', ')}`);
  console.error('');
  console.error('Examples:');
  console.error('  node update-checkpoint.cjs /project run-fabriqa-2026-001 awaiting_approval --checkpoint=plan');
  console.error('  node update-checkpoint.cjs /project run-fabriqa-2026-001 approved');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    printUsage();
    process.exit(1);
  }

  const [rootPath, runId, checkpointState, ...optionArgs] = args;

  try {
    const options = parseOptions(optionArgs);
    const result = updateCheckpoint(rootPath, runId, checkpointState, options);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = {
  VALID_STATES,
  normalizeCheckpointState,
  updateCheckpoint
};
