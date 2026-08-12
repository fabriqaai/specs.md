import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const {
  classifyChanges,
  evaluateHoldout,
  collectChangedFiles,
} = require('../../../evals/holdout/run.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');
const RUNNER = join(REPO_ROOT, 'evals', 'holdout', 'run.cjs');

function run(cwd: string, command: string, args: string[]): void {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} ${args.join(' ')} failed`);
  }
}

describe('holdout isolation', () => {
  it('rejects a contribution that touches evals/ and plugins/specsmd/, and passes one-sided changes', () => {
    const mixed = classifyChanges([
      'evals/README.md',
      'plugins/specsmd/skills/using-specsmd/SKILL.md',
    ]);
    expect(mixed.evalsFiles).toContain('evals/README.md');
    expect(mixed.implFiles).toContain('plugins/specsmd/skills/using-specsmd/SKILL.md');
    expect(evaluateHoldout({ files: mixed.files.map((row: { file: string }) => row.file) }).ok).toBe(false);

    expect(evaluateHoldout({ files: ['evals/sufficiency/run.cjs'] }).ok).toBe(true);
    expect(evaluateHoldout({ files: ['plugins/specsmd/plugin.json'] }).ok).toBe(true);
    expect(evaluateHoldout({ files: ['src/__tests__/evals/holdout-isolation.test.ts'] }).ok).toBe(true);
    expect(
      evaluateHoldout({ files: ['plugins/specsmd-aidlc/plugin.json', 'evals/README.md'] }).ok
    ).toBe(true);
  });

  it('detects mixed changes in a git working tree versus merge-base', () => {
    const folder = join(tmpdir(), `evals-holdout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(folder, { recursive: true });
    try {
      run(folder, 'git', ['init']);
      run(folder, 'git', ['config', 'user.email', 'test@example.com']);
      run(folder, 'git', ['config', 'user.name', 'test']);
      run(folder, 'git', ['config', 'commit.gpgsign', 'false']);
      writeFileSync(join(folder, 'README'), 'base\n', 'utf8');
      run(folder, 'git', ['add', 'README']);
      run(folder, 'git', ['commit', '-m', 'base']);

      mkdirSync(join(folder, 'evals'), { recursive: true });
      writeFileSync(join(folder, 'evals', 'note.md'), 'eval\n', 'utf8');
      const evalsOnly = evaluateHoldout({ cwd: folder, base: 'HEAD' });
      expect(evalsOnly.ok).toBe(true);
      expect(evalsOnly.evalsFiles.some((file: string) => file.startsWith('evals/'))).toBe(true);

      mkdirSync(join(folder, 'plugins', 'specsmd'), { recursive: true });
      writeFileSync(join(folder, 'plugins', 'specsmd', 'plugin.json'), '{}\n', 'utf8');
      const mixed = evaluateHoldout({ cwd: folder, base: 'HEAD' });
      expect(mixed.ok).toBe(false);
      expect(mixed.message).toMatch(/Implementing agents must not write evals/);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('passes the current repository against its merge-base (this contribution must not touch plugins/specsmd/)', () => {
    const result = evaluateHoldout({ cwd: REPO_ROOT });
    expect(result.ok, result.message).toBe(true);
    const changed = collectChangedFiles(REPO_ROOT, result.base);
    const impl = changed.filter(
      (file: string) => file === 'plugins/specsmd' || file.startsWith('plugins/specsmd/')
    );
    expect(impl).toEqual([]);
  });

  it('fails the CLI when both sides are present in the file list via a temp repo', () => {
    const result = spawnSync(process.execPath, [RUNNER, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
  });
});
