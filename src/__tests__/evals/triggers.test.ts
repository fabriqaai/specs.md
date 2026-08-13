import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
const { tmpdir } = require('os');

const {
  runTriggerEvals,
  predictSkill,
  UNIFIED_PLUGIN,
} = require('../../../evals/triggers/run.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');

describe('trigger evals', () => {
  it('has fixtures for using-specsmd and specsmd-status and reports per-prompt outcomes', () => {
    const report = runTriggerEvals({ root: REPO_ROOT });
    expect(report.fixtures).toEqual(expect.arrayContaining(['using-specsmd', 'specsmd-status']));
    expect(report.results.length).toBeGreaterThanOrEqual(2);
    const expected = new Set(report.results.map((row: { expected: string }) => row.expected));
    expect(expected.has('using-specsmd')).toBe(true);
    expect(expected.has('specsmd-status')).toBe(true);
    for (const row of report.results) {
      expect(['pass', 'fail', 'skipped']).toContain(row.outcome);
      expect(row.id).toBeTruthy();
      expect(row.prompt).toBeTruthy();
    }
  });

  it('passes every fixture prompt against shipped plugins/specsmd descriptions', () => {
    const report = runTriggerEvals({ root: REPO_ROOT });
    expect(report.summary.skills_found).toEqual(expect.arrayContaining(['using-specsmd', 'specsmd-status']));
    const failed = report.results.filter((row: { outcome: string }) => row.outcome !== 'pass');
    expect(failed, JSON.stringify(failed)).toEqual([]);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.skipped).toBe(0);
    expect(report.summary.pass).toBe(report.summary.total);
    expect(report.summary.total).toBeGreaterThanOrEqual(9);
  });

  it('skips honestly when plugins/specsmd skill files are missing', () => {
    const report = runTriggerEvals({ root: REPO_ROOT });
    const skillDir = join(REPO_ROOT, 'plugins', UNIFIED_PLUGIN, 'skills');
    const { existsSync } = require('fs');
    if (existsSync(skillDir)) {
      expect(report.summary.skipped + report.summary.pass + report.summary.fail).toBe(report.summary.total);
    } else {
      expect(report.summary.skills_found).toEqual([]);
      expect(report.summary.skipped).toBe(report.summary.total);
      expect(report.summary.fail).toBe(0);
      for (const row of report.results) {
        expect(row.outcome).toBe('skipped');
        expect(row.reason).toMatch(/Skill file missing/);
      }
    }
  });

  it('scores a prompt against skill descriptions when those files exist', () => {
    const root = join(tmpdir(), `evals-triggers-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try {
      const statusDir = join(root, 'plugins', 'specsmd', 'skills', 'specsmd-status');
      const bootstrapDir = join(root, 'plugins', 'specsmd', 'skills', 'using-specsmd');
      mkdirSync(statusDir, { recursive: true });
      mkdirSync(bootstrapDir, { recursive: true });
      writeFileSync(join(root, 'package.json'), '{}\n', 'utf8');
      mkdirSync(join(root, 'docs', 'specsmd'), { recursive: true });
      writeFileSync(
        join(bootstrapDir, 'SKILL.md'),
        [
          '---',
          'name: using-specsmd',
          'description: Use at the start of every session in a specsmd project, before any other response or action. Establishes how and when to engage specsmd flow skills.',
          '---',
          '',
          '# Using specsmd',
          '',
        ].join('\n'),
        'utf8'
      );
      writeFileSync(
        join(statusDir, 'SKILL.md'),
        [
          '---',
          'name: specsmd-status',
          'description: Use when the user asks where the project stands, what to do next, or which specsmd flow is active — or when you need to route to the right flow skill and the project state is unclear.',
          '---',
          '',
          '# specsmd Status',
          '',
        ].join('\n'),
        'utf8'
      );

      const report = runTriggerEvals({ root });
      expect(report.summary.skipped).toBe(0);
      expect(report.summary.total).toBeGreaterThan(0);
      const statusPrompt = report.results.find((row: { id: string }) => row.id === 'where-stands');
      expect(statusPrompt.outcome).toBe('pass');
      expect(statusPrompt.predicted).toBe('specsmd-status');
      const bootPrompt = report.results.find((row: { id: string }) => row.id === 'new-session');
      expect(bootPrompt.outcome).toBe('pass');
      expect(bootPrompt.predicted).toBe('using-specsmd');

      const fixtures = [
        { skill: 'using-specsmd', signatures: ['start of every session', 'how and when to engage'] },
        { skill: 'specsmd-status', signatures: ['where the project stands', 'what to do next'] },
      ];
      const predicted = predictSkill(
        'Where does this project stand?',
        [
          { name: 'using-specsmd', description: 'start of every session how and when to engage', disableModelInvocation: false },
          { name: 'specsmd-status', description: 'where the project stands what to do next', disableModelInvocation: false },
        ],
        { fixtures }
      );
      expect(predicted.skill).toBe('specsmd-status');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
