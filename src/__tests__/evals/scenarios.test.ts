import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { spawnSync } from 'child_process';

const { runScenarios } = require('../../../evals/holdout/scenarios/run.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');
const RUNNER = join(REPO_ROOT, 'evals', 'holdout', 'scenarios', 'run.cjs');

describe('holdout scenarios', () => {
  const report = runScenarios({ root: REPO_ROOT });

  it('defines satisfaction scenarios and judges them against the shipped flow', () => {
    expect(report.available).toBe(true);
    expect(report.summary.total).toBeGreaterThanOrEqual(6);
    expect(report.summary.skipped).toBe(0);
    const failed = report.results.filter((row: { satisfied: boolean }) => !row.satisfied);
    expect(failed, JSON.stringify(failed)).toEqual([]);
  });

  it('prints a satisfaction report from the CLI', () => {
    const result = spawnSync(process.execPath, [RUNNER, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr + result.stdout).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.summary.failed).toBe(0);
    expect(payload.summary.satisfied).toBe(payload.summary.total);
  });
});
