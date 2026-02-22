import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseFireDashboard } = require('../../../lib/dashboard/fire/parser');

describe('fire dashboard parser', () => {
  let workspacePath: string;
  let fireRootPath: string;

  beforeEach(() => {
    workspacePath = join(tmpdir(), `dashboard-parser-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fireRootPath = join(workspacePath, '.specs-fire');

    mkdirSync(join(fireRootPath, 'intents', 'INT-001', 'work-items'), { recursive: true });
    mkdirSync(join(fireRootPath, 'runs', 'run-001'), { recursive: true });
    mkdirSync(join(fireRootPath, 'standards'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('parses snapshot and computes stats from state + filesystem', () => {
    writeFileSync(join(fireRootPath, 'state.yaml'), `project:\n  name: demo\n  fire_version: 0.1.9\nworkspace:\n  type: brownfield\n  structure: monolith\n  autonomy_bias: balanced\n  run_scope_preference: batch\nintents:\n  - id: INT-001\n    title: Auth\n    status: in_progress\n    work_items:\n      - id: WI-001\n        status: completed\n        mode: confirm\n      - id: WI-002\n        status: pending\n        mode: validate\nruns:\n  active:\n    - id: run-001\n      scope: single\n      current_item: WI-002\n      started: 2026-01-19T10:00:00Z\n      work_items:\n        - id: WI-002\n          intent: INT-001\n          mode: validate\n          status: in_progress\n  completed:\n    - id: run-000\n      completed: 2026-01-19T09:00:00Z\n      work_items:\n        - id: WI-001\n          intent: INT-001\n          mode: confirm\n`, 'utf8');

    writeFileSync(join(fireRootPath, 'intents', 'INT-001', 'brief.md'), `---\ntitle: Authentication\ndescription: Auth intent\n---\n\n# Brief\n`, 'utf8');
    writeFileSync(join(fireRootPath, 'intents', 'INT-001', 'work-items', 'WI-001.md'), `---\ntitle: Create schema\nstatus: completed\nmode: confirm\ncomplexity: low\n---\n`, 'utf8');
    writeFileSync(join(fireRootPath, 'intents', 'INT-001', 'work-items', 'WI-002.md'), `---\ntitle: Login endpoint\nstatus: pending\nmode: validate\ncomplexity: high\ndepends_on:\n  - WI-001\n---\n`, 'utf8');
    writeFileSync(join(fireRootPath, 'runs', 'run-001', 'run.md'), `---\nid: run-001\nscope: single\nstatus: in_progress\nstarted: 2026-01-19T10:00:00Z\n---\n`, 'utf8');
    writeFileSync(join(fireRootPath, 'standards', 'constitution.md'), '# Constitution\n', 'utf8');

    const result = parseFireDashboard(workspacePath);

    expect(result.ok).toBe(true);
    expect(result.snapshot.project.name).toBe('demo');
    expect(result.snapshot.workspace.type).toBe('brownfield');
    expect(result.snapshot.intents).toHaveLength(1);
    expect(result.snapshot.activeRuns).toHaveLength(1);
    expect(result.snapshot.pendingItems).toHaveLength(1);
    expect(result.snapshot.pendingItems[0].id).toBe('WI-002');

    expect(result.snapshot.stats.totalIntents).toBe(1);
    expect(result.snapshot.stats.totalWorkItems).toBe(2);
    expect(result.snapshot.stats.completedWorkItems).toBe(1);
    expect(result.snapshot.stats.pendingWorkItems).toBe(1);
    expect(result.snapshot.stats.activeRunsCount).toBe(1);
  });

  it('returns uninitialized snapshot when state.yaml is missing', () => {
    const result = parseFireDashboard(workspacePath);

    expect(result.ok).toBe(true);
    expect(result.snapshot.initialized).toBe(false);
    expect(result.snapshot.warnings[0]).toContain('state.yaml');
  });

  it('returns parse error on invalid state.yaml', () => {
    writeFileSync(join(fireRootPath, 'state.yaml'), 'invalid: [yaml', 'utf8');

    const result = parseFireDashboard(workspacePath);

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('STATE_PARSE_ERROR');
  });

  it('hydrates active run checkpoint state from run.md when state.yaml lacks it', () => {
    writeFileSync(join(fireRootPath, 'state.yaml'), `project:\n  name: demo\nruns:\n  active:\n    - id: run-001\n      scope: single\n      current_item: WI-002\n      started: 2026-01-19T10:00:00Z\n      work_items:\n        - id: WI-002\n          intent: INT-001\n          mode: validate\n          status: in_progress\n`, 'utf8');
    writeFileSync(join(fireRootPath, 'intents', 'INT-001', 'brief.md'), '# Intent\n', 'utf8');
    writeFileSync(join(fireRootPath, 'intents', 'INT-001', 'work-items', 'WI-002.md'), '# Work item\n', 'utf8');
    writeFileSync(join(fireRootPath, 'runs', 'run-001', 'run.md'), `---\nid: run-001\nscope: single\ncurrent_item: WI-002\ncheckpoint_state: awaiting_approval\ncurrent_checkpoint: plan\nwork_items:\n  - id: WI-002\n    intent: INT-001\n    mode: validate\n    status: in_progress\n    current_phase: plan\n    checkpoint_state: awaiting_approval\n    current_checkpoint: plan\n---\n`, 'utf8');

    const result = parseFireDashboard(workspacePath);
    expect(result.ok).toBe(true);
    expect(result.snapshot.activeRuns).toHaveLength(1);
    expect(result.snapshot.activeRuns[0].checkpointState).toBe('awaiting_approval');
    expect(result.snapshot.activeRuns[0].currentCheckpoint).toBe('plan');
    expect(result.snapshot.activeRuns[0].workItems[0].checkpointState).toBe('awaiting_approval');
    expect(result.snapshot.activeRuns[0].workItems[0].currentCheckpoint).toBe('plan');
  });
});
