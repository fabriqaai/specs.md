#!/usr/bin/env node

/**
 * FIRE Run Initialization Script
 *
 * Creates run record in state.yaml and run folder structure.
 * Supports both single work item and batch/wide runs with multiple items.
 *
 * Ensures deterministic run ID generation by checking BOTH:
 * - runs.completed history in state.yaml
 * - existing run folders in .specs-fire/runs/
 *
 * Usage:
 *   Single item: node init-run.js <rootPath> <workItemId> <intentId> <mode>
 *   Batch/Wide:  node init-run.js <rootPath> --batch '<workItemsJson>'
 *
 * Examples:
 *   node init-run.js /project login-endpoint user-auth confirm
 *   node init-run.js /project --batch '[{"id":"wi-1","intent":"int-1","mode":"autopilot"}]'
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

const VALID_MODES = ['autopilot', 'confirm', 'validate'];
const VALID_SCOPES = ['single', 'batch', 'wide'];

function validateRootPath(rootPath) {
  if (!rootPath || typeof rootPath !== 'string' || rootPath.trim() === '') {
    throw fireError('rootPath is required.', 'INIT_001', 'Provide a valid project root path.');
  }

  if (!fs.existsSync(rootPath)) {
    throw fireError(
      `Project root not found: "${rootPath}".`,
      'INIT_040',
      'Ensure the path exists and is accessible.'
    );
  }
}

function validateWorkItem(item, index) {
  if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
    throw fireError(
      `Work item at index ${index} missing 'id'.`,
      'INIT_010',
      'Each work item must have an id.'
    );
  }

  if (!item.intent || typeof item.intent !== 'string' || item.intent.trim() === '') {
    throw fireError(
      `Work item "${item.id}" missing 'intent'.`,
      'INIT_020',
      'Each work item must have an intent.'
    );
  }

  if (!item.mode || !VALID_MODES.includes(item.mode)) {
    throw fireError(
      `Work item "${item.id}" has invalid mode: "${item.mode}".`,
      'INIT_030',
      `Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }
}

function validateWorkItems(workItems) {
  if (!Array.isArray(workItems) || workItems.length === 0) {
    throw fireError(
      'Work items array is empty or invalid.',
      'INIT_011',
      'Provide at least one work item.'
    );
  }

  workItems.forEach((item, index) => validateWorkItem(item, index));
}

function validateFireProject(rootPath) {
  const fireDir = path.join(rootPath, '.specs-fire');
  const statePath = path.join(fireDir, 'state.yaml');
  const runsPath = path.join(fireDir, 'runs');

  if (!fs.existsSync(fireDir)) {
    throw fireError(
      `FIRE project not initialized at: "${rootPath}".`,
      'INIT_041',
      'Run fire-init first to initialize the project.'
    );
  }

  if (!fs.existsSync(statePath)) {
    throw fireError(
      `State file not found at: "${statePath}".`,
      'INIT_042',
      'The project may be corrupted. Try re-initializing.'
    );
  }

  return { fireDir, statePath, runsPath };
}

// =============================================================================
// State Operations
// =============================================================================

function readState(statePath) {
  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const state = yaml.parse(content);
    if (!state || typeof state !== 'object') {
      throw fireError('State file is empty or invalid.', 'INIT_050', 'Check state.yaml format.');
    }
    return state;
  } catch (err) {
    if (err.code && err.code.startsWith('INIT_')) throw err;
    throw fireError(
      `Failed to read state file: ${err.message}`,
      'INIT_051',
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
      'INIT_052',
      'Check file permissions and disk space.'
    );
  }
}

// =============================================================================
// Run ID Generation (CRITICAL - checks both history and file system)
// =============================================================================

function generateRunId(runsPath, state) {
  // Ensure runs directory exists
  if (!fs.existsSync(runsPath)) {
    fs.mkdirSync(runsPath, { recursive: true });
  }

  // Source 1: Get max from state.yaml runs.completed history
  let maxFromHistory = 0;
  if (state.runs && Array.isArray(state.runs.completed)) {
    for (const run of state.runs.completed) {
      if (run.id) {
        const match = run.id.match(/^run-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxFromHistory) maxFromHistory = num;
        }
      }
    }
  }

  // Source 2: Get max from file system (defensive)
  let maxFromFileSystem = 0;
  try {
    const entries = fs.readdirSync(runsPath);
    for (const entry of entries) {
      if (/^run-\d{3,}$/.test(entry)) {
        const num = parseInt(entry.replace('run-', ''), 10);
        if (num > maxFromFileSystem) maxFromFileSystem = num;
      }
    }
  } catch (err) {
    throw fireError(
      `Failed to read runs directory: ${err.message}`,
      'INIT_060',
      'Check directory permissions.'
    );
  }

  // Use MAX of both to ensure no duplicates
  const maxNum = Math.max(maxFromHistory, maxFromFileSystem);
  const nextNum = maxNum + 1;

  return `run-${String(nextNum).padStart(3, '0')}`;
}

// =============================================================================
// Scope Detection
// =============================================================================

function detectScope(workItems) {
  if (workItems.length === 1) {
    return 'single';
  }
  // For multiple items, default to batch
  // (wide would be explicitly set by the caller if all compatible items are included)
  return 'batch';
}

// =============================================================================
// Run Folder Creation
// =============================================================================

function createRunFolder(runPath) {
  try {
    fs.mkdirSync(runPath, { recursive: true });
  } catch (err) {
    throw fireError(
      `Failed to create run folder: ${err.message}`,
      'INIT_070',
      'Check directory permissions and disk space.'
    );
  }
}

function createRunLog(runPath, runId, workItems, scope, startTime) {
  // Format work items for run.md
  const workItemsList = workItems.map((item, index) => {
    const status = index === 0 ? 'in_progress' : 'pending';
    return `  - id: ${item.id}\n    intent: ${item.intent}\n    mode: ${item.mode}\n    status: ${status}`;
  }).join('\n');

  const currentItem = workItems[0];

  const runLog = `---
id: ${runId}
scope: ${scope}
work_items:
${workItemsList}
current_item: ${currentItem.id}
status: in_progress
started: ${startTime}
completed: null
---

# Run: ${runId}

## Scope
${scope} (${workItems.length} work item${workItems.length > 1 ? 's' : ''})

## Work Items
${workItems.map((item, i) => `${i + 1}. **${item.id}** (${item.mode}) — ${i === 0 ? 'in_progress' : 'pending'}`).join('\n')}

## Current Item
${currentItem.id} (${currentItem.mode})

## Files Created
(none yet)

## Files Modified
(none yet)

## Decisions
(none yet)
`;

  const runLogPath = path.join(runPath, 'run.md');
  try {
    fs.writeFileSync(runLogPath, runLog);
  } catch (err) {
    throw fireError(
      `Failed to create run log: ${err.message}`,
      'INIT_071',
      'Check file permissions.'
    );
  }
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Initialize a run with one or more work items.
 *
 * @param {string} rootPath - Project root directory
 * @param {Array<{id: string, intent: string, mode: string}>} workItems - Work items to include in run
 * @param {string} [scope] - Optional scope override ('single', 'batch', 'wide')
 * @returns {object} Result with runId, runPath, workItems, scope, started
 */
function initRun(rootPath, workItems, scope) {
  // Validate root path
  validateRootPath(rootPath);

  // Validate work items
  validateWorkItems(workItems);

  // Detect or validate scope
  const detectedScope = scope || detectScope(workItems);
  if (scope && !VALID_SCOPES.includes(scope)) {
    throw fireError(
      `Invalid scope: "${scope}".`,
      'INIT_035',
      `Valid scopes are: ${VALID_SCOPES.join(', ')}`
    );
  }

  // Validate FIRE project structure
  const { statePath, runsPath } = validateFireProject(rootPath);

  // Read state
  const state = readState(statePath);

  // Check for existing active run
  if (state.active_run) {
    throw fireError(
      `A run is already active: "${state.active_run.id}".`,
      'INIT_080',
      `Complete or cancel run "${state.active_run.id}" before starting a new one.`
    );
  }

  // Generate run ID (checks both history AND file system)
  const runId = generateRunId(runsPath, state);
  const runPath = path.join(runsPath, runId);

  // Create run folder
  createRunFolder(runPath);

  // Create run log
  const startTime = new Date().toISOString();
  createRunLog(runPath, runId, workItems, detectedScope, startTime);

  // Prepare work items for state with status tracking
  const stateWorkItems = workItems.map((item, index) => ({
    id: item.id,
    intent: item.intent,
    mode: item.mode,
    status: index === 0 ? 'in_progress' : 'pending',
  }));

  // Update state with active run
  state.active_run = {
    id: runId,
    scope: detectedScope,
    work_items: stateWorkItems,
    current_item: workItems[0].id,
    started: startTime,
  };

  // Save state
  writeState(statePath, state);

  // Return result
  return {
    success: true,
    runId: runId,
    runPath: runPath,
    scope: detectedScope,
    workItems: stateWorkItems,
    currentItem: workItems[0].id,
    started: startTime,
  };
}

// =============================================================================
// CLI Interface
// =============================================================================

function printUsage() {
  console.error('Usage:');
  console.error('  Single item: node init-run.js <rootPath> <workItemId> <intentId> <mode>');
  console.error('  Batch/Wide:  node init-run.js <rootPath> --batch \'<workItemsJson>\' [--scope=<scope>]');
  console.error('');
  console.error('Arguments:');
  console.error('  rootPath      - Project root directory');
  console.error('  workItemId    - Work item ID (single mode)');
  console.error('  intentId      - Intent ID (single mode)');
  console.error('  mode          - Execution mode: autopilot, confirm, validate');
  console.error('');
  console.error('Options:');
  console.error('  --batch       - JSON array of work items');
  console.error('  --scope       - Override scope: single, batch, wide');
  console.error('');
  console.error('Work item JSON format:');
  console.error('  [{"id": "wi-1", "intent": "int-1", "mode": "autopilot"}, ...]');
  console.error('');
  console.error('Examples:');
  console.error('  node init-run.js /project login-endpoint user-auth confirm');
  console.error('  node init-run.js /project --batch \'[{"id":"wi-1","intent":"int-1","mode":"autopilot"}]\'');
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const rootPath = args[0];
  let workItems = [];
  let scope = null;

  // Check if batch mode
  if (args[1] === '--batch') {
    if (args.length < 3) {
      console.error('Error: --batch requires a JSON array of work items');
      printUsage();
      process.exit(1);
    }

    try {
      workItems = JSON.parse(args[2]);
    } catch (err) {
      console.error(`Error: Failed to parse work items JSON: ${err.message}`);
      process.exit(1);
    }

    // Check for --scope option
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--scope=')) {
        scope = args[i].substring('--scope='.length);
      }
    }
  } else {
    // Single item mode (backwards compatible)
    if (args.length < 4) {
      printUsage();
      process.exit(1);
    }

    const [, workItemId, intentId, mode] = args;
    workItems = [{ id: workItemId, intent: intentId, mode: mode }];
    scope = 'single';
  }

  try {
    const result = initRun(rootPath, workItems, scope);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { initRun };
