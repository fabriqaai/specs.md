import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as yaml from 'yaml';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateCheckpoint } = require('../../../flows/fire/agents/builder/skills/run-execute/scripts/update-checkpoint.cjs');

describe('update-checkpoint', () => {
  let testRoot: string;
  let statePath: string;

  beforeEach(() => {
    testRoot = join(tmpdir(), `fire-checkpoint-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    statePath = join(testRoot, '.specs-fire', 'state.yaml');
    mkdirSync(join(testRoot, '.specs-fire', 'runs', 'run-001'), { recursive: true });

    writeFileSync(statePath, yaml.stringify({
      intents: [],
      runs: {
        active: [
          {
            id: 'run-001',
            scope: 'single',
            current_item: 'WI-001',
            work_items: [
              {
                id: 'WI-001',
                intent: 'INT-001',
                mode: 'confirm',
                status: 'in_progress',
                current_phase: 'plan',
                checkpoint_state: 'none'
              },
              {
                id: 'WI-002',
                intent: 'INT-001',
                mode: 'autopilot',
                status: 'pending'
              }
            ]
          }
        ],
        completed: []
      }
    }), 'utf8');
  });

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  function readState() {
    return yaml.parse(readFileSync(statePath, 'utf8'));
  }

  it('updates current work item checkpoint state', () => {
    const result = updateCheckpoint(testRoot, 'run-001', 'awaiting_approval', { checkpoint: 'plan' });

    expect(result.success).toBe(true);
    expect(result.workItemId).toBe('WI-001');
    expect(result.checkpointState).toBe('awaiting_approval');

    const state = readState();
    expect(state.runs.active[0].work_items[0].checkpoint_state).toBe('awaiting_approval');
    expect(state.runs.active[0].work_items[0].current_checkpoint).toBe('plan');
  });

  it('supports explicit --item override', () => {
    const result = updateCheckpoint(testRoot, 'run-001', 'approved', { itemId: 'WI-002', checkpoint: 'plan' });

    expect(result.success).toBe(true);
    expect(result.workItemId).toBe('WI-002');

    const state = readState();
    expect(state.runs.active[0].work_items[1].checkpoint_state).toBe('approved');
    expect(state.runs.active[0].work_items[1].current_checkpoint).toBe('plan');
  });

  it('throws on invalid checkpoint state', () => {
    expect(() => updateCheckpoint(testRoot, 'run-001', 'invalid-state')).toThrow();
  });
});

