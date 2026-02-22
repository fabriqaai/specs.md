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
    const runPath = join(workspacePath, '.specs-fire', 'runs', 'run-001');
    mkdirSync(runPath, { recursive: true });
    writeFileSync(join(runPath, 'plan.md'), `---
run: run-001
work_item: wi-01
mode: confirm
checkpoint: confirm-plan
approved_at: null
---
`, 'utf8');

    const snapshot = {
      flow: 'fire',
      activeRuns: [
        {
          id: 'run-001',
          scope: 'single',
          folderPath: runPath,
          hasPlan: true,
          hasWalkthrough: false,
          hasTestReport: false,
          currentItem: 'wi-01',
          workItems: [
            {
              id: 'wi-01',
              mode: 'confirm',
              status: 'in_progress',
              currentPhase: 'plan'
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

  it('clears FIRE approval gate after plan approval timestamp exists', () => {
    const runPath = join(workspacePath, '.specs-fire', 'runs', 'run-002');
    mkdirSync(runPath, { recursive: true });
    writeFileSync(join(runPath, 'plan.md'), `---
run: run-002
work_item: wi-02
mode: confirm
checkpoint: confirm-plan
approved_at: 2026-02-22T03:00:00Z
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
