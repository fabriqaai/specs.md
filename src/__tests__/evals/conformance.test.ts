import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { spawnSync } from 'child_process';

const { evaluateIntent } = require('../../../evals/conformance/run.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');
const RUNNER = join(REPO_ROOT, 'evals', 'conformance', 'run.cjs');
const ALLOWED = new Set(['verified', 'failed', 'needs-human', 'spec-defect']);

describe('DoD conformance checker', () => {
  const report = evaluateIntent({ root: REPO_ROOT, intent: '001-unified-bolt-flow' });

  it('walks every work item and labels each criterion honestly', () => {
    expect(report.work_items.map((item: { id: string }) => item.id)).toEqual(
      expect.arrayContaining([
        '000-flow-evals',
        '001-flow-schema',
        '012-slim-ops',
      ])
    );
    expect(report.work_items.length).toBeGreaterThanOrEqual(13);
    expect(report.coverage.total).toBeGreaterThan(0);
    for (const item of report.work_items) {
      expect(item.criteria.length, `${item.id} has no criteria`).toBeGreaterThan(0);
      for (const criterion of item.criteria) {
        expect(ALLOWED.has(criterion.result), `${item.id} #${criterion.index} ${criterion.result}`).toBe(
          true
        );
      }
    }
  });

  it('does not pretend unimplemented criteria are machine-verified', () => {
    expect(report.coverage.needs_human).toBeGreaterThan(0);
    expect(report.coverage.machine_checkable).toBeLessThan(report.coverage.total);
    expect(report.coverage.verified + report.coverage.failed + report.coverage.needs_human + report.coverage.spec_defect).toBe(
      report.coverage.total
    );
  });

  it('machine-checks the evals work item gating criteria that the harness can evaluate', () => {
    const evalsItem = report.work_items.find((item: { id: string }) => item.id === '000-flow-evals');
    expect(evalsItem).toBeTruthy();
    const machine = evalsItem.criteria.filter((criterion: { evaluable: string }) => criterion.evaluable === 'machine');
    expect(machine.length).toBeGreaterThanOrEqual(5);
    for (const criterion of machine) {
      if (criterion.tier === 'advisory') continue;
      expect(criterion.result, criterion.detail).toBe('verified');
    }
    const later = report.work_items.find((item: { id: string }) => item.id === '001-flow-schema');
    const machineLater = later.criteria.filter((criterion: { evaluable: string }) => criterion.evaluable === 'machine');
    expect(machineLater.length).toBeGreaterThan(0);
    for (const criterion of machineLater) {
      expect(criterion.result, criterion.detail).not.toBe('needs-human');
    }
  });

  it('prints a coverage summary from the CLI', () => {
    const result = spawnSync(process.execPath, [RUNNER, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.coverage.total).toBeGreaterThan(0);
    expect(payload.coverage.needs_human).toBeGreaterThan(0);
  });
});
