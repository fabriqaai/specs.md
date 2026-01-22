/**
 * Unit tests for init-run.js
 *
 * Tests for initializing FIRE runs including:
 * - Input validation (rootPath, work items)
 * - State file operations
 * - Run folder creation
 * - Active run detection
 * - Batch run support
 * - Error handling with clear messages
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as yaml from 'yaml';

// Import the module under test (CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initRun } = require('../../../flows/fire/agents/builder/skills/run-execute/scripts/init-run.js');

// Helper types
interface WorkItem {
  id: string;
  intent: string;
  mode: string;
  status?: string;
}

interface InitRunResult {
  success: boolean;
  runId: string;
  runPath: string;
  scope: string;
  workItems: WorkItem[];
  currentItem: string;
  started: string;
}

// Helper type for errors with code
interface FireError extends Error {
  code: string;
  suggestion: string;
}

describe('init-run', () => {
  let testRoot: string;
  let specsFireDir: string;
  let statePath: string;
  let runsPath: string;

  // Setup a fresh test directory before each test
  beforeEach(() => {
    testRoot = join(tmpdir(), `fire-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    specsFireDir = join(testRoot, '.specs-fire');
    statePath = join(specsFireDir, 'state.yaml');
    runsPath = join(specsFireDir, 'runs');

    // Create the directory structure
    mkdirSync(runsPath, { recursive: true });
  });

  // Cleanup after each test
  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  /**
   * Helper to create a valid state.yaml file
   */
  function createStateFile(content: object): void {
    writeFileSync(statePath, yaml.stringify(content), 'utf8');
  }

  /**
   * Helper to read state.yaml and parse it
   */
  function readStateFile(): object {
    return yaml.parse(readFileSync(statePath, 'utf8'));
  }

  /**
   * Helper to create a single work item array
   */
  function singleWorkItem(id = 'WI-001', intent = 'INT-001', mode = 'autopilot'): WorkItem[] {
    return [{ id, intent, mode }];
  }

  // ===========================================================================
  // Input Validation Tests
  // ===========================================================================

  describe('rootPath validation', () => {
    it('should throw when rootPath is null', () => {
      expect(() => initRun(null, singleWorkItem())).toThrow();
    });

    it('should throw when rootPath is undefined', () => {
      expect(() => initRun(undefined, singleWorkItem())).toThrow();
    });

    it('should throw when rootPath is not a string', () => {
      expect(() => initRun(123, singleWorkItem())).toThrow();
    });

    it('should throw when rootPath is empty string', () => {
      expect(() => initRun('', singleWorkItem())).toThrow();
    });

    it('should throw when rootPath is whitespace only', () => {
      expect(() => initRun('   ', singleWorkItem())).toThrow();
    });

    it('should throw when rootPath does not exist', () => {
      expect(() => initRun('/nonexistent/path/abc123', singleWorkItem())).toThrow();
    });

    it('should include error code in error message', () => {
      try {
        initRun(null, singleWorkItem());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as FireError).code).toBeDefined();
        expect((error as FireError).message).toContain('INIT_');
      }
    });
  });

  describe('work items validation', () => {
    beforeEach(() => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
      });
    });

    it('should throw when work items is empty array', () => {
      expect(() => initRun(testRoot, [])).toThrow();
    });

    it('should throw when work item missing id', () => {
      expect(() => initRun(testRoot, [{ intent: 'INT-001', mode: 'autopilot' }])).toThrow();
    });

    it('should throw when work item id is empty', () => {
      expect(() => initRun(testRoot, [{ id: '', intent: 'INT-001', mode: 'autopilot' }])).toThrow();
    });

    it('should throw when work item missing intent', () => {
      expect(() => initRun(testRoot, [{ id: 'WI-001', mode: 'autopilot' }])).toThrow();
    });

    it('should throw when work item intent is empty', () => {
      expect(() => initRun(testRoot, [{ id: 'WI-001', intent: '', mode: 'autopilot' }])).toThrow();
    });

    it('should throw when mode is invalid', () => {
      expect(() => initRun(testRoot, [{ id: 'WI-001', intent: 'INT-001', mode: 'invalid' }])).toThrow();
    });

    it('should accept valid mode: autopilot', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem('WI-001', 'INT-001', 'autopilot'));
      expect(result.runId).toBe('run-001');
    });

    it('should accept valid mode: confirm', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem('WI-001', 'INT-001', 'confirm'));
      expect(result.runId).toBe('run-001');
    });

    it('should accept valid mode: validate', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem('WI-001', 'INT-001', 'validate'));
      expect(result.runId).toBe('run-001');
    });
  });

  // ===========================================================================
  // State File Tests
  // ===========================================================================

  describe('state file operations', () => {
    it('should throw when .specs-fire directory does not exist', () => {
      rmSync(specsFireDir, { recursive: true, force: true });
      expect(() => initRun(testRoot, singleWorkItem())).toThrow();
    });

    it('should throw when state.yaml does not exist', () => {
      expect(() => initRun(testRoot, singleWorkItem())).toThrow();
    });

    it('should throw when state.yaml contains invalid YAML', () => {
      writeFileSync(statePath, 'invalid: yaml: content: [', 'utf8');
      expect(() => initRun(testRoot, singleWorkItem())).toThrow();
    });

    it('should throw when state.yaml is empty', () => {
      writeFileSync(statePath, '', 'utf8');
      expect(() => initRun(testRoot, singleWorkItem())).toThrow();
    });
  });

  // ===========================================================================
  // Active Run Tests
  // ===========================================================================

  describe('active run detection', () => {
    it('should throw when active run already exists', () => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: {
          id: 'run-001',
          work_items: [{ id: 'existing-wi', intent: 'existing-intent', mode: 'autopilot', status: 'in_progress' }],
          current_item: 'existing-wi',
          started: '2024-01-01T00:00:00Z',
        },
      });

      expect(() => initRun(testRoot, singleWorkItem())).toThrow();
    });

    it('should include existing run ID in error message', () => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: {
          id: 'run-existing',
          work_items: [{ id: 'existing-wi', intent: 'existing-intent', mode: 'autopilot', status: 'in_progress' }],
          current_item: 'existing-wi',
          started: '2024-01-01T00:00:00Z',
        },
      });

      try {
        initRun(testRoot, singleWorkItem());
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as FireError).message).toContain('run-existing');
      }
    });

    it('should allow init when active_run is null', () => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
      });

      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      expect(result.runId).toBeDefined();
    });
  });

  // ===========================================================================
  // Run Creation Tests (Single Work Item)
  // ===========================================================================

  describe('run creation (single work item)', () => {
    beforeEach(() => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
      });
    });

    it('should create run-001 for first run', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      expect(result.runId).toBe('run-001');
    });

    it('should increment run number based on existing runs', () => {
      // Create existing run folders
      mkdirSync(join(runsPath, 'run-001'));
      mkdirSync(join(runsPath, 'run-002'));

      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      expect(result.runId).toBe('run-003');
    });

    it('should handle gaps in run numbers (use max + 1)', () => {
      // Create non-consecutive run folders
      mkdirSync(join(runsPath, 'run-001'));
      mkdirSync(join(runsPath, 'run-005'));

      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      expect(result.runId).toBe('run-006');
    });

    it('should create run folder', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      const runPath = join(runsPath, result.runId);
      expect(existsSync(runPath)).toBe(true);
    });

    it('should create run.md in run folder', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      const runLogPath = join(runsPath, result.runId, 'run.md');
      expect(existsSync(runLogPath)).toBe(true);
    });

    it('should include correct metadata in run.md', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem('WI-001', 'INT-001', 'confirm'));
      const runLogPath = join(runsPath, result.runId, 'run.md');
      const content = readFileSync(runLogPath, 'utf8');

      expect(content).toContain('id: run-001');
      expect(content).toContain('scope: single');
      expect(content).toContain('id: WI-001');
      expect(content).toContain('intent: INT-001');
      expect(content).toContain('mode: confirm');
      expect(content).toContain('status: in_progress');
    });

    it('should update state.yaml with active_run', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem());

      const state = readStateFile() as {
        active_run: {
          id: string;
          scope: string;
          work_items: WorkItem[];
          current_item: string;
        };
      };

      expect(state.active_run).toBeDefined();
      expect(state.active_run.id).toBe(result.runId);
      expect(state.active_run.scope).toBe('single');
      expect(state.active_run.work_items).toHaveLength(1);
      expect(state.active_run.work_items[0].id).toBe('WI-001');
      expect(state.active_run.current_item).toBe('WI-001');
    });

    it('should set started timestamp in ISO format', () => {
      const before = new Date().toISOString();

      initRun(testRoot, singleWorkItem());

      const after = new Date().toISOString();
      const state = readStateFile() as { active_run: { started: string } };

      expect(state.active_run.started).toBeDefined();
      expect(state.active_run.started >= before).toBe(true);
      expect(state.active_run.started <= after).toBe(true);
    });

    it('should return success result with all fields', () => {
      const result: InitRunResult = initRun(testRoot, singleWorkItem());

      expect(result.success).toBe(true);
      expect(result.runId).toBe('run-001');
      expect(result.runPath).toBe(join(runsPath, 'run-001'));
      expect(result.scope).toBe('single');
      expect(result.workItems).toHaveLength(1);
      expect(result.currentItem).toBe('WI-001');
      expect(result.started).toBeDefined();
    });
  });

  // ===========================================================================
  // Run Creation Tests (Batch/Wide)
  // ===========================================================================

  describe('run creation (batch/wide)', () => {
    beforeEach(() => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
      });
    });

    it('should detect batch scope for multiple items', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'autopilot' },
      ];

      const result: InitRunResult = initRun(testRoot, workItems);
      expect(result.scope).toBe('batch');
    });

    it('should allow scope override', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'autopilot' },
      ];

      const result: InitRunResult = initRun(testRoot, workItems, 'wide');
      expect(result.scope).toBe('wide');
    });

    it('should set first item as in_progress and others as pending', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'confirm' },
        { id: 'WI-003', intent: 'INT-002', mode: 'validate' },
      ];

      const result: InitRunResult = initRun(testRoot, workItems);

      expect(result.workItems[0].status).toBe('in_progress');
      expect(result.workItems[1].status).toBe('pending');
      expect(result.workItems[2].status).toBe('pending');
    });

    it('should set currentItem to first work item', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'autopilot' },
      ];

      const result: InitRunResult = initRun(testRoot, workItems);
      expect(result.currentItem).toBe('WI-001');
    });

    it('should include all work items in run.md', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'confirm' },
      ];

      const result: InitRunResult = initRun(testRoot, workItems);
      const runLogPath = join(runsPath, result.runId, 'run.md');
      const content = readFileSync(runLogPath, 'utf8');

      expect(content).toContain('WI-001');
      expect(content).toContain('WI-002');
      expect(content).toContain('batch (2 work items)');
    });

    it('should store all work items in state.yaml', () => {
      const workItems: WorkItem[] = [
        { id: 'WI-001', intent: 'INT-001', mode: 'autopilot' },
        { id: 'WI-002', intent: 'INT-001', mode: 'confirm' },
        { id: 'WI-003', intent: 'INT-002', mode: 'validate' },
      ];

      initRun(testRoot, workItems);

      const state = readStateFile() as {
        active_run: {
          work_items: WorkItem[];
        };
      };

      expect(state.active_run.work_items).toHaveLength(3);
      expect(state.active_run.work_items[0].id).toBe('WI-001');
      expect(state.active_run.work_items[1].id).toBe('WI-002');
      expect(state.active_run.work_items[2].id).toBe('WI-003');
    });
  });

  // ===========================================================================
  // Run History Tests
  // ===========================================================================

  describe('run history integration', () => {
    it('should use max from runs.completed when higher than file system', () => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
        runs: {
          completed: [
            { id: 'run-001', work_items: [{ id: 'wi-1', intent: 'int-1', mode: 'autopilot' }], completed: '2024-01-01T00:00:00Z' },
            { id: 'run-010', work_items: [{ id: 'wi-2', intent: 'int-1', mode: 'autopilot' }], completed: '2024-01-02T00:00:00Z' },
          ],
        },
      });

      // Only run-001 exists in file system
      mkdirSync(join(runsPath, 'run-001'));

      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      // Should be run-011 (max from history is 10)
      expect(result.runId).toBe('run-011');
    });

    it('should use max from file system when higher than history', () => {
      createStateFile({
        project: { name: 'test-project' },
        intents: [],
        active_run: null,
        runs: {
          completed: [
            { id: 'run-001', work_items: [{ id: 'wi-1', intent: 'int-1', mode: 'autopilot' }], completed: '2024-01-01T00:00:00Z' },
          ],
        },
      });

      // run-005 exists in file system
      mkdirSync(join(runsPath, 'run-001'));
      mkdirSync(join(runsPath, 'run-005'));

      const result: InitRunResult = initRun(testRoot, singleWorkItem());
      // Should be run-006 (max from file system is 5)
      expect(result.runId).toBe('run-006');
    });
  });

  // ===========================================================================
  // Error Code Tests
  // ===========================================================================

  describe('error codes', () => {
    it('should use INIT_001 for null rootPath', () => {
      try {
        initRun(null, singleWorkItem());
      } catch (error) {
        expect((error as FireError).code).toBe('INIT_001');
      }
    });

    it('should use INIT_010 for missing work item id', () => {
      createStateFile({ active_run: null, intents: [] });

      try {
        initRun(testRoot, [{ intent: 'INT-001', mode: 'autopilot' }]);
      } catch (error) {
        expect((error as FireError).code).toBe('INIT_010');
      }
    });

    it('should include suggestion in error message', () => {
      try {
        initRun(null, singleWorkItem());
      } catch (error) {
        expect((error as FireError).suggestion).toBeDefined();
        expect((error as FireError).suggestion.length).toBeGreaterThan(0);
      }
    });
  });
});
