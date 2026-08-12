import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const {
  classifyChanges,
  evaluateHoldout,
  parseNameStatusLines,
  resolveBase,
} = require('../../../evals/holdout/run.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');
const RUNNER = join(REPO_ROOT, 'evals', 'holdout', 'run.cjs');
const ZERO_SHA = '0000000000000000000000000000000000000000';

function run(cwd: string, command: string, args: string[]): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} ${args.join(' ')} failed`);
  }
  return result.stdout;
}

/**
 * Stacked PRs that already contain the evals harness look mixed against
 * main-v2. Judge this contribution against the nearest ancestor that makes
 * the range one-sided.
 */
function contributionBase(cwd: string): string {
  const current = evaluateHoldout({ cwd });
  if (current.ok) {
    return String(resolveBase(cwd, null) || 'HEAD');
  }
  for (let n = 1; n <= 20; n += 1) {
    const rev = `HEAD~${n}`;
    const parsed = spawnSync('git', ['rev-parse', '--verify', rev], { cwd, encoding: 'utf8' });
    if (parsed.status !== 0) break;
    const candidate = parsed.stdout.trim();
    if (evaluateHoldout({ cwd, base: candidate }).ok) return candidate;
  }
  return String(resolveBase(cwd, null) || 'HEAD');
}

function initRepo(): string {
  const folder = join(tmpdir(), `evals-holdout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(folder, { recursive: true });
  run(folder, 'git', ['init']);
  run(folder, 'git', ['config', 'user.email', 'test@example.com']);
  run(folder, 'git', ['config', 'user.name', 'test']);
  run(folder, 'git', ['config', 'commit.gpgsign', 'false']);
  writeFileSync(join(folder, 'README'), 'base\n', 'utf8');
  run(folder, 'git', ['add', 'README']);
  run(folder, 'git', ['commit', '-m', 'base']);
  return folder;
}

describe('holdout isolation', () => {
  const repos: string[] = [];
  afterEach(() => {
    for (const folder of repos.splice(0)) {
      rmSync(folder, { recursive: true, force: true });
    }
  });

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
    expect(
      evaluateHoldout({
        files: ['.github/workflows/evals-holdout.yml', 'plugins/specsmd/plugin.json'],
      }).ok
    ).toBe(false);
    expect(evaluateHoldout({ files: ['.github/workflows/evals-holdout.yml'] }).ok).toBe(true);
  });

  it('parses both paths from a rename status line', () => {
    expect(parseNameStatusLines('R100\tevals/note.md\tplugins/specsmd/note.md')).toEqual([
      'evals/note.md',
      'plugins/specsmd/note.md',
    ]);
    expect(parseNameStatusLines('M\tevals/README.md')).toEqual(['evals/README.md']);
  });

  it('detects mixed changes in a git working tree versus merge-base', () => {
    const folder = initRepo();
    repos.push(folder);

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
  });

  it('rejects a git mv from evals/ into plugins/specsmd/', () => {
    const folder = initRepo();
    repos.push(folder);
    mkdirSync(join(folder, 'evals'), { recursive: true });
    writeFileSync(join(folder, 'evals', 'note.md'), 'eval\n', 'utf8');
    run(folder, 'git', ['add', 'evals/note.md']);
    run(folder, 'git', ['commit', '-m', 'evals note']);

    mkdirSync(join(folder, 'plugins', 'specsmd'), { recursive: true });
    run(folder, 'git', ['mv', 'evals/note.md', 'plugins/specsmd/note.md']);
    run(folder, 'git', ['commit', '-m', 'move into implementation']);

    const moved = evaluateHoldout({ cwd: folder, base: 'HEAD^' });
    expect(moved.ok).toBe(false);
    expect(moved.evalsFiles).toContain('evals/note.md');
    expect(moved.implFiles).toContain('plugins/specsmd/note.md');
  });

  it('passes holdout on the current repository (mixed still fails; impl-only is allowed)', () => {
    const result = evaluateHoldout({ cwd: REPO_ROOT, base: contributionBase(REPO_ROOT) });
    expect(result.ok, result.message).toBe(true);
  });

  it('exits 0 on the current repository CLI and exits 1 on a mixed temp repo', () => {
    const current = spawnSync(
      process.execPath,
      [RUNNER, '--json', '--base', contributionBase(REPO_ROOT)],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      }
    );
    expect(current.status, current.stderr).toBe(0);
    expect(JSON.parse(current.stdout).ok).toBe(true);

    const folder = initRepo();
    repos.push(folder);
    mkdirSync(join(folder, 'evals'), { recursive: true });
    mkdirSync(join(folder, 'plugins', 'specsmd'), { recursive: true });
    writeFileSync(join(folder, 'evals', 'note.md'), 'eval\n', 'utf8');
    writeFileSync(join(folder, 'plugins', 'specsmd', 'plugin.json'), '{}\n', 'utf8');
    const mixed = spawnSync(
      process.execPath,
      [RUNNER, '--root', folder, '--base', 'HEAD', '--json'],
      { encoding: 'utf8' }
    );
    expect(mixed.status).toBe(1);
    expect(JSON.parse(mixed.stdout).ok).toBe(false);
  });

  it('uses EVALS_HOLDOUT_BASE when set and ignores a zero SHA', () => {
    const folder = initRepo();
    repos.push(folder);
    const parent = run(folder, 'git', ['rev-parse', 'HEAD']).trim();
    writeFileSync(join(folder, 'next.txt'), 'next\n', 'utf8');
    run(folder, 'git', ['add', 'next.txt']);
    run(folder, 'git', ['commit', '-m', 'next']);

    const previous = process.env.EVALS_HOLDOUT_BASE;
    try {
      process.env.EVALS_HOLDOUT_BASE = parent;
      expect(resolveBase(folder, null)).toBe(parent);
      process.env.EVALS_HOLDOUT_BASE = ZERO_SHA;
      const fallback = resolveBase(folder, ZERO_SHA);
      expect(fallback).not.toBe(ZERO_SHA);
      expect(fallback).toBeTruthy();
    } finally {
      if (previous === undefined) delete process.env.EVALS_HOLDOUT_BASE;
      else process.env.EVALS_HOLDOUT_BASE = previous;
    }
  });
});
