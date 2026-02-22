import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listGitChanges, loadGitDiffPreview } = require('../../../lib/dashboard/git/changes');

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} ${args.join(' ')} failed`);
  }
}

describe('dashboard git changes', () => {
  it('returns unavailable snapshot outside git repo', () => {
    const folder = mkdtempSync(join(tmpdir(), 'git-changes-no-repo-'));
    try {
      const snapshot = listGitChanges(folder);
      expect(snapshot.available).toBe(false);
      expect(snapshot.clean).toBe(true);
      expect(snapshot.counts.total).toBe(0);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('parses staged/unstaged/untracked changes and returns diff preview', () => {
    const folder = mkdtempSync(join(tmpdir(), 'git-changes-repo-'));
    try {
      run('git', ['init'], folder);

      const stagedFile = join(folder, 'staged-and-unstaged.txt');
      writeFileSync(stagedFile, 'line-1\n', 'utf8');
      run('git', ['add', 'staged-and-unstaged.txt'], folder);
      writeFileSync(stagedFile, 'line-1\nline-2\n', 'utf8');

      const untrackedFile = join(folder, 'new-file.txt');
      writeFileSync(untrackedFile, 'new-line\n', 'utf8');

      const snapshot = listGitChanges(folder);
      expect(snapshot.available).toBe(true);
      expect(snapshot.counts.total).toBe(2);
      expect(snapshot.staged.some((item: { relativePath: string }) => item.relativePath === 'staged-and-unstaged.txt')).toBe(true);
      expect(snapshot.unstaged.some((item: { relativePath: string }) => item.relativePath === 'staged-and-unstaged.txt')).toBe(true);
      expect(snapshot.untracked.some((item: { relativePath: string }) => item.relativePath === 'new-file.txt')).toBe(true);

      const stagedItem = snapshot.staged.find((item: { relativePath: string }) => item.relativePath === 'staged-and-unstaged.txt');
      expect(stagedItem).toBeTruthy();
      const stagedDiff = loadGitDiffPreview({
        ...stagedItem,
        repoRoot: snapshot.rootPath,
        bucket: 'staged'
      });
      expect(stagedDiff).toContain('diff --git');

      const untrackedItem = snapshot.untracked.find((item: { relativePath: string }) => item.relativePath === 'new-file.txt');
      expect(untrackedItem).toBeTruthy();
      const untrackedDiff = loadGitDiffPreview({
        ...untrackedItem,
        repoRoot: snapshot.rootPath,
        bucket: 'untracked'
      });
      expect(untrackedDiff).toContain('new-file.txt');
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('supports nested worktree paths', () => {
    const folder = mkdtempSync(join(tmpdir(), 'git-changes-nested-'));
    try {
      run('git', ['init'], folder);
      const nested = join(folder, 'packages', 'api');
      mkdirSync(nested, { recursive: true });

      const changedPath = join(folder, 'packages', 'api', 'index.ts');
      writeFileSync(changedPath, 'export const n = 1;\n', 'utf8');

      const snapshot = listGitChanges(nested);
      expect(snapshot.available).toBe(true);
      expect(snapshot.untracked.some((item: { relativePath: string }) => item.relativePath === 'packages/api/index.ts')).toBe(true);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});
