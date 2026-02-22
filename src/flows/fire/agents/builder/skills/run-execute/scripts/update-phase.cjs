#!/usr/bin/env node

/**
 * FIRE Phase Update Script
 *
 * Updates the current phase for a work item in an active run.
 * Phases: plan → execute → test → review
 *
 * Usage:
 *   node update-phase.cjs <rootPath> <runId> <phase>
 *
 * Examples:
 *   node update-phase.cjs /project run-001 execute
 *   node update-phase.cjs /project run-001 test
 *   node update-phase.cjs /project run-001 review
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// =============================================================================
// Constants
// =============================================================================

const VALID_PHASES = ['plan', 'execute', 'test', 'review'];

// =============================================================================
// Error Helper
// =============================================================================

function fireError(message, code, suggestion) {
  const err = new Error(`FIRE Error [${code}]: ${message} ${suggestion}`);
  err.code = code;
  err.suggestion = suggestion;
  return err;
}

// =============================================================================
// Validation
// =============================================================================

function validateInputs(rootPath, runId, phase) {
  if (!rootPath || typeof rootPath !== 'string' || rootPath.trim() === '') {
    throw fireError('rootPath is required.', 'PHASE_001', 'Provide a valid project root path.');
  }

  if (!runId || typeof runId !== 'string' || runId.trim() === '') {
    throw fireError('runId is required.', 'PHASE_002', 'Provide the run ID.');
  }

  if (!phase || !VALID_PHASES.includes(phase)) {
    throw fireError(
      `Invalid phase: "${phase}".`,
      'PHASE_003',
      `Valid phases are: ${VALID_PHASES.join(', ')}`
    );
  }

  if (!fs.existsSync(rootPath)) {
    throw fireError(
      `Project root not found: "${rootPath}".`,
      'PHASE_004',
      'Ensure the path exists and is accessible.'
    );
  }
}

function validateFireProject(rootPath, runId) {
  const fireDir = path.join(rootPath, '.specs-fire');
  const statePath = path.join(fireDir, 'state.yaml');

  if (!fs.existsSync(fireDir)) {
    throw fireError(
      `FIRE project not initialized at: "${rootPath}".`,
      'PHASE_010',
      'Run fire-init first to initialize the project.'
    );
  }

  if (!fs.existsSync(statePath)) {
    throw fireError(
      `State file not found at: "${statePath}".`,
      'PHASE_011',
      'The project may be corrupted. Try re-initializing.'
    );
  }

  return { statePath };
}

// =============================================================================
// State Operations
// =============================================================================

function readState(statePath) {
  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const state = yaml.parse(content);
    if (!state || typeof state !== 'object') {
      throw fireError('State file is empty or invalid.', 'PHASE_020', 'Check state.yaml format.');
    }
    return state;
  } catch (err) {
    if (err.code && err.code.startsWith('PHASE_')) throw err;
    throw fireError(
      `Failed to read state file: ${err.message}`,
      'PHASE_021',
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
      'PHASE_022',
      'Check file permissions and disk space.'
    );
  }
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Update the current phase for the active work item in a run.
 *
 * @param {string} rootPath - Project root directory
 * @param {string} runId - Run ID
 * @param {string} phase - New phase (plan, execute, test, review)
 * @returns {object} Result with updated phase info
 */
function updatePhase(rootPath, runId, phase) {
  validateInputs(rootPath, runId, phase);
  const { statePath } = validateFireProject(rootPath, runId);
  const state = readState(statePath);

  // Find run in active runs list
  const activeRuns = state.runs?.active || [];
  const runIndex = activeRuns.findIndex(r => r.id === runId);

  if (runIndex === -1) {
    throw fireError(
      `Run "${runId}" not found in active runs.`,
      'PHASE_030',
      'The run may have been completed or was never started.'
    );
  }

  const activeRun = activeRuns[runIndex];
  const workItems = activeRun.work_items || [];
  const currentItemId = activeRun.current_item;

  if (!currentItemId) {
    throw fireError(
      `No current item in run "${runId}".`,
      'PHASE_031',
      'The run may have completed all work items.'
    );
  }

  // Find and update current item's phase
  let updated = false;
  let previousPhase = null;
  for (const item of workItems) {
    if (item.id === currentItemId) {
      previousPhase = item.current_phase || 'plan';
      item.current_phase = phase;
      const mode = String(item.mode || '').toLowerCase();
      const isApprovalMode = mode === 'confirm' || mode === 'validate';

      if (isApprovalMode && phase !== 'plan') {
        item.checkpoint_state = 'approved';
        if (!item.current_checkpoint) {
          item.current_checkpoint = 'plan';
        }
      } else if (!item.checkpoint_state) {
        item.checkpoint_state = 'none';
      }
      updated = true;
      break;
    }
  }

  if (!updated) {
    throw fireError(
      `Current item "${currentItemId}" not found in work items.`,
      'PHASE_032',
      'The run state may be corrupted.'
    );
  }

  // Update state
  activeRun.work_items = workItems;
  state.runs.active[runIndex] = activeRun;
  writeState(statePath, state);

  return {
    success: true,
    runId: runId,
    workItemId: currentItemId,
    previousPhase: previousPhase,
    currentPhase: phase,
  };
}

// =============================================================================
// CLI Interface
// =============================================================================

function printUsage() {
  console.error('Usage:');
  console.error('  node update-phase.cjs <rootPath> <runId> <phase>');
  console.error('');
  console.error('Arguments:');
  console.error('  rootPath  - Project root directory');
  console.error('  runId     - Run ID (e.g., run-001)');
  console.error('  phase     - New phase: plan, execute, test, review');
  console.error('');
  console.error('Examples:');
  console.error('  node update-phase.cjs /project run-001 execute');
  console.error('  node update-phase.cjs /project run-001 test');
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    printUsage();
    process.exit(1);
  }

  const [rootPath, runId, phase] = args;

  try {
    const result = updatePhase(rootPath, runId, phase);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { updatePhase, VALID_PHASES };
