#!/usr/bin/env node

/**
 * FIRE Run Completion Script
 *
 * Supports both single and batch/wide runs.
 *
 * For single runs: Completes the run and clears active_run.
 * For batch/wide runs:
 *   - --complete-item: Marks current work item done, moves to next
 *   - --complete-run: Marks all items done and finalizes entire run
 *
 * Usage:
 *   Complete current item:  node complete-run.js <rootPath> <runId> --complete-item [options]
 *   Complete entire run:    node complete-run.js <rootPath> <runId> --complete-run [options]
 *   Complete (single/auto): node complete-run.js <rootPath> <runId> [options]
 *
 * Options:
 *   --files-created=JSON   - JSON array of {path, purpose}
 *   --files-modified=JSON  - JSON array of {path, changes}
 *   --decisions=JSON       - JSON array of {decision, choice, rationale}
 *   --tests=N              - Number of tests added
 *   --coverage=N           - Coverage percentage
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

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

function validateInputs(rootPath, runId) {
  if (!rootPath || typeof rootPath !== 'string' || rootPath.trim() === '') {
    throw fireError('rootPath is required.', 'COMPLETE_001', 'Provide a valid project root path.');
  }

  if (!runId || typeof runId !== 'string' || runId.trim() === '') {
    throw fireError('runId is required.', 'COMPLETE_002', 'Provide the run ID to complete.');
  }

  if (!fs.existsSync(rootPath)) {
    throw fireError(
      `Project root not found: "${rootPath}".`,
      'COMPLETE_003',
      'Ensure the path exists and is accessible.'
    );
  }
}

function validateFireProject(rootPath, runId) {
  const fireDir = path.join(rootPath, '.specs-fire');
  const statePath = path.join(fireDir, 'state.yaml');
  const runsPath = path.join(fireDir, 'runs');
  const runPath = path.join(runsPath, runId);
  const runLogPath = path.join(runPath, 'run.md');

  if (!fs.existsSync(fireDir)) {
    throw fireError(
      `FIRE project not initialized at: "${rootPath}".`,
      'COMPLETE_010',
      'Run fire-init first to initialize the project.'
    );
  }

  if (!fs.existsSync(statePath)) {
    throw fireError(
      `State file not found at: "${statePath}".`,
      'COMPLETE_011',
      'The project may be corrupted. Try re-initializing.'
    );
  }

  if (!fs.existsSync(runPath)) {
    throw fireError(
      `Run folder not found: "${runPath}".`,
      'COMPLETE_012',
      `Ensure run "${runId}" was properly initialized.`
    );
  }

  if (!fs.existsSync(runLogPath)) {
    throw fireError(
      `Run log not found: "${runLogPath}".`,
      'COMPLETE_013',
      `The run may have been partially initialized.`
    );
  }

  return { statePath, runPath, runLogPath };
}

// =============================================================================
// State Operations
// =============================================================================

function readState(statePath) {
  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const state = yaml.parse(content);
    if (!state || typeof state !== 'object') {
      throw fireError('State file is empty or invalid.', 'COMPLETE_020', 'Check state.yaml format.');
    }
    return state;
  } catch (err) {
    if (err.code && err.code.startsWith('COMPLETE_')) throw err;
    throw fireError(
      `Failed to read state file: ${err.message}`,
      'COMPLETE_021',
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
      'COMPLETE_022',
      'Check file permissions and disk space.'
    );
  }
}

// =============================================================================
// Run Log Operations
// =============================================================================

function updateRunLog(runLogPath, activeRun, params, completedTime, isFullCompletion) {
  let content;
  try {
    content = fs.readFileSync(runLogPath, 'utf8');
  } catch (err) {
    throw fireError(
      `Failed to read run log: ${err.message}`,
      'COMPLETE_030',
      'Check file permissions.'
    );
  }

  // If full completion, update run status
  if (isFullCompletion) {
    content = content.replace(/status: in_progress/, 'status: completed');
    content = content.replace(/completed: null/, `completed: ${completedTime}`);
  }

  // Update work items status in frontmatter
  if (activeRun.work_items && Array.isArray(activeRun.work_items)) {
    for (const item of activeRun.work_items) {
      // Update status in YAML frontmatter
      const statusPattern = new RegExp(`(id: ${item.id}\\n\\s+intent: [^\\n]+\\n\\s+mode: [^\\n]+\\n\\s+status: )(\\w+)`);
      content = content.replace(statusPattern, `$1${item.status}`);

      // Update status in markdown body
      const bodyPattern = new RegExp(`(\\*\\*${item.id}\\*\\* \\([^)]+\\) — )(\\w+)`);
      content = content.replace(bodyPattern, `$1${item.status}`);
    }

    // Update current_item in frontmatter
    content = content.replace(/current_item: [^\n]+/, `current_item: ${activeRun.current_item || 'none'}`);

    // Update Current Item section
    if (activeRun.current_item) {
      const currentItem = activeRun.work_items.find(i => i.id === activeRun.current_item);
      if (currentItem) {
        content = content.replace(/## Current Item\n[^\n]+/, `## Current Item\n${currentItem.id} (${currentItem.mode})`);
      }
    } else {
      content = content.replace(/## Current Item\n[^\n]+/, `## Current Item\n(all completed)`);
    }
  }

  // Format file lists (only on full completion)
  if (isFullCompletion) {
    const filesCreatedText = params.filesCreated.length > 0
      ? params.filesCreated.map(f => `- \`${f.path}\`: ${f.purpose || '(no purpose)'}`).join('\n')
      : '(none)';

    const filesModifiedText = params.filesModified.length > 0
      ? params.filesModified.map(f => `- \`${f.path}\`: ${f.changes || '(no changes)'}`).join('\n')
      : '(none)';

    const decisionsText = params.decisions.length > 0
      ? params.decisions.map(d => `- **${d.decision}**: ${d.choice} (${d.rationale || 'no rationale'})`).join('\n')
      : '(none)';

    // Replace placeholder sections
    content = content.replace('## Files Created\n(none yet)', `## Files Created\n${filesCreatedText}`);
    content = content.replace('## Files Modified\n(none yet)', `## Files Modified\n${filesModifiedText}`);
    content = content.replace('## Decisions\n(none yet)', `## Decisions\n${decisionsText}`);

    // Add summary if not present
    if (!content.includes('## Summary')) {
      const itemCount = activeRun.work_items ? activeRun.work_items.length : 1;
      content += `

## Summary

- Work items completed: ${itemCount}
- Files created: ${params.filesCreated.length}
- Files modified: ${params.filesModified.length}
- Tests added: ${params.testsAdded}
- Coverage: ${params.coverage}%
- Completed: ${completedTime}
`;
    }
  }

  try {
    fs.writeFileSync(runLogPath, content);
  } catch (err) {
    throw fireError(
      `Failed to write run log: ${err.message}`,
      'COMPLETE_031',
      'Check file permissions.'
    );
  }
}

// =============================================================================
// Complete Current Item (for batch runs)
// =============================================================================

function completeCurrentItem(rootPath, runId, params = {}) {
  const completionParams = {
    filesCreated: params.filesCreated || [],
    filesModified: params.filesModified || [],
    decisions: params.decisions || [],
    testsAdded: params.testsAdded || 0,
    coverage: params.coverage || 0,
  };

  validateInputs(rootPath, runId);
  const { statePath, runLogPath } = validateFireProject(rootPath, runId);
  const state = readState(statePath);

  // Find run in active runs list
  const activeRuns = state.runs?.active || [];
  const runIndex = activeRuns.findIndex(r => r.id === runId);

  if (runIndex === -1) {
    throw fireError(
      `Run "${runId}" not found in active runs.`,
      'COMPLETE_040',
      'The run may have already been completed or was never started.'
    );
  }

  const activeRun = activeRuns[runIndex];
  const completedTime = new Date().toISOString();
  const workItems = activeRun.work_items || [];
  const currentItemId = activeRun.current_item;

  // Find and mark current item as completed
  let currentItemIndex = -1;
  for (let i = 0; i < workItems.length; i++) {
    if (workItems[i].id === currentItemId) {
      workItems[i].status = 'completed';
      workItems[i].completed_at = completedTime;
      currentItemIndex = i;
      break;
    }
  }

  if (currentItemIndex === -1) {
    throw fireError(
      `Current item "${currentItemId}" not found in work items.`,
      'COMPLETE_050',
      'The run state may be corrupted.'
    );
  }

  // Find next pending item
  let nextItem = null;
  for (let i = currentItemIndex + 1; i < workItems.length; i++) {
    if (workItems[i].status === 'pending') {
      workItems[i].status = 'in_progress';
      nextItem = workItems[i];
      break;
    }
  }

  // Update active run in list
  activeRun.work_items = workItems;
  activeRun.current_item = nextItem ? nextItem.id : null;
  state.runs.active[runIndex] = activeRun;

  // Update run log
  updateRunLog(runLogPath, activeRun, completionParams, completedTime, false);

  // Save state
  writeState(statePath, state);

  return {
    success: true,
    runId: runId,
    completedItem: currentItemId,
    nextItem: nextItem ? nextItem.id : null,
    remainingItems: workItems.filter(i => i.status === 'pending').length,
    allItemsCompleted: nextItem === null,
    completedAt: completedTime,
  };
}

// =============================================================================
// Complete Entire Run
// =============================================================================

function completeRun(rootPath, runId, params = {}) {
  const completionParams = {
    filesCreated: params.filesCreated || [],
    filesModified: params.filesModified || [],
    decisions: params.decisions || [],
    testsAdded: params.testsAdded || 0,
    coverage: params.coverage || 0,
  };

  validateInputs(rootPath, runId);
  const { statePath, runLogPath } = validateFireProject(rootPath, runId);
  const state = readState(statePath);

  // Initialize runs structure if needed
  if (!state.runs) {
    state.runs = { active: [], completed: [] };
  }
  if (!Array.isArray(state.runs.active)) {
    state.runs.active = [];
  }
  if (!Array.isArray(state.runs.completed)) {
    state.runs.completed = [];
  }

  // Find run in active runs list
  const runIndex = state.runs.active.findIndex(r => r.id === runId);

  if (runIndex === -1) {
    throw fireError(
      `Run "${runId}" not found in active runs.`,
      'COMPLETE_040',
      'The run may have already been completed or was never started.'
    );
  }

  const activeRun = state.runs.active[runIndex];
  const completedTime = new Date().toISOString();
  const workItems = activeRun.work_items || [];
  const scope = activeRun.scope || 'single';

  // Mark all items as completed
  for (const item of workItems) {
    if (item.status !== 'completed') {
      item.status = 'completed';
      item.completed_at = completedTime;
    }
  }

  activeRun.work_items = workItems;
  activeRun.current_item = null;

  // Update run log
  updateRunLog(runLogPath, activeRun, completionParams, completedTime, true);

  // Build completed run record
  const completedRun = {
    id: runId,
    scope: scope,
    work_items: workItems.map(i => ({
      id: i.id,
      intent: i.intent,
      mode: i.mode,
    })),
    started: activeRun.started,
    completed: completedTime,
  };

  // Check for duplicate (idempotency)
  const alreadyRecorded = state.runs.completed.some(r => r.id === runId);

  // Update work item status in intents
  if (Array.isArray(state.intents)) {
    for (const workItem of workItems) {
      for (const intent of state.intents) {
        if (intent.id === workItem.intent && Array.isArray(intent.work_items)) {
          for (const wi of intent.work_items) {
            if (wi.id === workItem.id) {
              wi.status = 'completed';
              wi.run_id = runId;
              break;
            }
          }
        }
      }
    }
  }

  // Remove from active runs and add to completed
  state.runs.active.splice(runIndex, 1);
  if (!alreadyRecorded) {
    state.runs.completed.push(completedRun);
  }

  // Save state
  writeState(statePath, state);

  return {
    success: true,
    runId: runId,
    scope: scope,
    workItemsCompleted: workItems.length,
    completedAt: completedTime,
    filesCreated: completionParams.filesCreated.length,
    filesModified: completionParams.filesModified.length,
    testsAdded: completionParams.testsAdded,
    coverage: completionParams.coverage,
  };
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(args) {
  const result = {
    rootPath: args[0],
    runId: args[1],
    completeItem: false,
    completeRunFlag: false,
    filesCreated: [],
    filesModified: [],
    decisions: [],
    testsAdded: 0,
    coverage: 0,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--complete-item') {
      result.completeItem = true;
    } else if (arg === '--complete-run') {
      result.completeRunFlag = true;
    } else if (arg.startsWith('--files-created=')) {
      try {
        result.filesCreated = JSON.parse(arg.substring('--files-created='.length));
      } catch (e) {
        console.error('Warning: Could not parse --files-created JSON');
      }
    } else if (arg.startsWith('--files-modified=')) {
      try {
        result.filesModified = JSON.parse(arg.substring('--files-modified='.length));
      } catch (e) {
        console.error('Warning: Could not parse --files-modified JSON');
      }
    } else if (arg.startsWith('--decisions=')) {
      try {
        result.decisions = JSON.parse(arg.substring('--decisions='.length));
      } catch (e) {
        console.error('Warning: Could not parse --decisions JSON');
      }
    } else if (arg.startsWith('--tests=')) {
      result.testsAdded = parseInt(arg.substring('--tests='.length), 10) || 0;
    } else if (arg.startsWith('--coverage=')) {
      result.coverage = parseFloat(arg.substring('--coverage='.length)) || 0;
    }
  }

  return result;
}

function printUsage() {
  console.error('Usage:');
  console.error('  Complete current item: node complete-run.js <rootPath> <runId> --complete-item [options]');
  console.error('  Complete entire run:   node complete-run.js <rootPath> <runId> --complete-run [options]');
  console.error('  Auto (single runs):    node complete-run.js <rootPath> <runId> [options]');
  console.error('');
  console.error('Arguments:');
  console.error('  rootPath  - Project root directory');
  console.error('  runId     - Run ID to complete (e.g., run-003)');
  console.error('');
  console.error('Flags:');
  console.error('  --complete-item  - Complete only the current work item (batch/wide runs)');
  console.error('  --complete-run   - Complete the entire run');
  console.error('');
  console.error('Options:');
  console.error('  --files-created=JSON   - JSON array of {path, purpose}');
  console.error('  --files-modified=JSON  - JSON array of {path, changes}');
  console.error('  --decisions=JSON       - JSON array of {decision, choice, rationale}');
  console.error('  --tests=N              - Number of tests added');
  console.error('  --coverage=N           - Coverage percentage');
  console.error('');
  console.error('Examples:');
  console.error('  node complete-run.js /project run-003 --complete-item');
  console.error('  node complete-run.js /project run-003 --complete-run --tests=5 --coverage=85');
}

// =============================================================================
// CLI Interface
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const params = parseArgs(args);

  try {
    let result;
    if (params.completeItem) {
      result = completeCurrentItem(params.rootPath, params.runId, {
        filesCreated: params.filesCreated,
        filesModified: params.filesModified,
        decisions: params.decisions,
        testsAdded: params.testsAdded,
        coverage: params.coverage,
      });
    } else {
      // Default: complete entire run
      result = completeRun(params.rootPath, params.runId, {
        filesCreated: params.filesCreated,
        filesModified: params.filesModified,
        decisions: params.decisions,
        testsAdded: params.testsAdded,
        coverage: params.coverage,
      });
    }
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { completeRun, completeCurrentItem };
