import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { detectDashboardApprovalGate } = require('../../../lib/dashboard/tui/app');

describe('dashboard approval gate detection', () => {
  let workspacePath: string;

  beforeEach(() => {
    workspacePath = join(tmpdir(), `dashboard-approval-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workspacePath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('detects FIRE confirm-mode checkpoint waiting for approval', () => {
    const snapshot = {
      flow: 'fire',
      activeRuns: [
        {
          id: 'run-001',
          scope: 'single',
          folderPath: join(workspacePath, '.specs-fire', 'runs', 'run-001'),
          hasPlan: true,
          hasWalkthrough: false,
          hasTestReport: false,
          currentItem: 'wi-01',
          workItems: [
            {
              id: 'wi-01',
              mode: 'confirm',
              status: 'in_progress',
              currentPhase: 'plan',
              checkpointState: 'awaiting_approval',
              currentCheckpoint: 'plan'
            }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'fire');

    expect(gate).not.toBeNull();
    expect(gate.message).toContain('run-001');
    expect(gate.message).toContain('waiting at plan checkpoint');
  });

  it('clears FIRE approval gate after explicit checkpoint approval state exists', () => {
    const runPath = join(workspacePath, '.specs-fire', 'runs', 'run-002');
    mkdirSync(runPath, { recursive: true });
    writeFileSync(join(runPath, 'plan.md'), `---
run: run-002
work_item: wi-02
mode: confirm
checkpoint: confirm-plan
approved_at: null
---
`, 'utf8');

    const snapshot = {
      flow: 'fire',
      activeRuns: [
        {
          id: 'run-002',
          scope: 'single',
          folderPath: runPath,
          hasPlan: true,
          hasWalkthrough: false,
          hasTestReport: false,
          currentItem: 'wi-02',
          workItems: [
            {
              id: 'wi-02',
              mode: 'confirm',
              status: 'in_progress',
              currentPhase: 'plan',
              checkpointState: 'approved',
              currentCheckpoint: 'plan'
            }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'fire');
    expect(gate).toBeNull();
  });

  it('uses explicit plan checkpoint_state as compatibility fallback', () => {
    const runPath = join(workspacePath, '.specs-fire', 'runs', 'run-003');
    mkdirSync(runPath, { recursive: true });
    writeFileSync(join(runPath, 'plan.md'), `---
run: run-003
work_item: wi-03
mode: validate
checkpoint: plan
checkpoint_state: awaiting_approval
---
`, 'utf8');

    const snapshot = {
      flow: 'fire',
      activeRuns: [
        {
          id: 'run-003',
          scope: 'single',
          folderPath: runPath,
          hasPlan: true,
          hasWalkthrough: false,
          hasTestReport: false,
          currentItem: 'wi-03',
          workItems: [
            {
              id: 'wi-03',
              mode: 'validate',
              status: 'in_progress',
              currentPhase: 'plan'
            }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'fire');
    expect(gate).not.toBeNull();
    expect(gate.message).toContain('run-003');
  });

  it('does not infer waiting from approved_at=null without explicit checkpoint state', () => {
    const runPath = join(workspacePath, '.specs-fire', 'runs', 'run-004');
    mkdirSync(runPath, { recursive: true });
    writeFileSync(join(runPath, 'plan.md'), `---
run: run-004
work_item: wi-04
mode: confirm
checkpoint: plan
approved_at: null
---
`, 'utf8');

    const snapshot = {
      flow: 'fire',
      activeRuns: [
        {
          id: 'run-004',
          scope: 'single',
          folderPath: runPath,
          hasPlan: true,
          hasWalkthrough: false,
          hasTestReport: false,
          currentItem: 'wi-04',
          workItems: [
            {
              id: 'wi-04',
              mode: 'confirm',
              status: 'in_progress',
              currentPhase: 'plan'
            }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'fire');
    expect(gate).toBeNull();
  });

  it('detects AIDLC checkpoint wait for simple bolt when stage artifact exists', () => {
    const snapshot = {
      flow: 'aidlc',
      activeBolts: [
        {
          id: '001-auth-service',
          type: 'simple-construction-bolt',
          status: 'in_progress',
          currentStage: 'plan',
          files: ['bolt.md', 'implementation-plan.md'],
          stages: [
            { name: 'plan', status: 'in_progress' },
            { name: 'implement', status: 'pending' }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'aidlc');
    expect(gate).not.toBeNull();
    expect(gate.message).toContain('001-auth-service');
  });

  it('does not flag AIDLC bolt when checkpoint artifact is not present yet', () => {
    const snapshot = {
      flow: 'aidlc',
      activeBolts: [
        {
          id: '002-payments',
          type: 'simple-construction-bolt',
          status: 'in_progress',
          currentStage: 'plan',
          files: ['bolt.md'],
          stages: [
            { name: 'plan', status: 'in_progress' },
            { name: 'implement', status: 'pending' }
          ]
        }
      ]
    };

    const gate = detectDashboardApprovalGate(snapshot, 'aidlc');
    expect(gate).toBeNull();
  });
});
