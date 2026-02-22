import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  parseGitWorktreePorcelain,
  markCurrentWorktree,
  pickWorktree
} = require('../../../lib/dashboard/git/worktrees');

describe('dashboard git worktrees', () => {
  it('parses git worktree porcelain output', () => {
    const raw = `
worktree /repo/main
HEAD 1111111111111111111111111111111111111111
branch refs/heads/main

worktree /repo/feature-a
HEAD 2222222222222222222222222222222222222222
branch refs/heads/feature-a

worktree /repo/detached
HEAD 3333333333333333333333333333333333333333
detached
`;

    const parsed = parseGitWorktreePorcelain(raw, '/repo/main');
    expect(parsed).toHaveLength(3);
    expect(parsed[0].path).toBe('/repo/main');
    expect(parsed[0].branch).toBe('main');
    expect(parsed[0].isMainBranch).toBe(true);
    expect(parsed[2].detached).toBe(true);
    expect(parsed[2].displayBranch).toContain('[detached');
  });

  it('marks and picks selected worktree by branch and path', () => {
    const raw = `
worktree /repo/main
HEAD 1111111111111111111111111111111111111111
branch refs/heads/main

worktree /repo/feature-a
HEAD 2222222222222222222222222222222222222222
branch refs/heads/feature-a
`;

    const parsed = parseGitWorktreePorcelain(raw, '/repo/main');
    const marked = markCurrentWorktree(parsed, '/repo/main');
    const byBranch = pickWorktree(marked, 'feature-a', '/repo/main');
    const byPath = pickWorktree(marked, '/repo/main', '/repo/main');

    expect(marked.some((item: any) => item.isCurrentPath)).toBe(true);
    expect(byBranch?.path).toBe('/repo/feature-a');
    expect(byPath?.branch).toBe('main');
  });
});

