import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getGitChangesSnapshot,
  buildGitStatusPanelLines,
  buildGitChangeGroups,
  buildGitCommitRows
} = require('../../../lib/dashboard/tui/git-builders');

describe('getGitChangesSnapshot', () => {
  it('returns unavailable snapshot for missing gitChanges', () => {
    const result = getGitChangesSnapshot({});
    expect(result.available).toBe(false);
    expect(result.branch).toBe('(unavailable)');
    expect(result.counts.total).toBe(0);
    expect(result.staged).toEqual([]);
    expect(result.unstaged).toEqual([]);
    expect(result.untracked).toEqual([]);
    expect(result.conflicted).toEqual([]);
  });

  it('returns unavailable snapshot for null snapshot', () => {
    const result = getGitChangesSnapshot(null);
    expect(result.available).toBe(false);
  });

  it('normalizes a valid gitChanges object', () => {
    const snapshot = {
      gitChanges: {
        available: true,
        branch: 'main',
        upstream: 'origin/main',
        ahead: 2,
        behind: 1,
        counts: { total: 5, staged: 2, unstaged: 2, untracked: 1, conflicted: 0 },
        staged: [{ relativePath: 'a.ts' }],
        unstaged: [{ relativePath: 'b.ts' }],
        untracked: [{ relativePath: 'c.ts' }],
        conflicted: []
      }
    };
    const result = getGitChangesSnapshot(snapshot);
    expect(result.available).toBe(true);
    expect(result.branch).toBe('main');
    expect(result.staged).toHaveLength(1);
  });

  it('defaults arrays when missing from gitChanges', () => {
    const snapshot = {
      gitChanges: {
        available: true,
        branch: 'dev'
      }
    };
    const result = getGitChangesSnapshot(snapshot);
    expect(result.staged).toEqual([]);
    expect(result.unstaged).toEqual([]);
    expect(result.untracked).toEqual([]);
    expect(result.conflicted).toEqual([]);
  });
});

describe('buildGitStatusPanelLines', () => {
  it('shows unavailable message when git is not available', () => {
    const lines = buildGitStatusPanelLines({});
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toContain('unavailable');
    expect(lines[0].color).toBe('red');
  });

  it('shows branch, tracking, and change counts', () => {
    const snapshot = {
      gitChanges: {
        available: true,
        branch: 'feat/new',
        upstream: 'origin/feat/new',
        ahead: 1,
        behind: 0,
        counts: { total: 3, staged: 1, unstaged: 1, untracked: 1, conflicted: 0 },
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      }
    };
    const lines = buildGitStatusPanelLines(snapshot);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[0].text).toContain('feat/new');
    expect(lines[1].text).toContain('origin/feat/new');
    expect(lines[2].text).toContain('3 total');
  });

  it('shows no upstream when not tracking', () => {
    const snapshot = {
      gitChanges: {
        available: true,
        branch: 'main',
        upstream: null,
        ahead: 0,
        behind: 0,
        counts: { total: 0, staged: 0, unstaged: 0, untracked: 0, conflicted: 0 },
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      }
    };
    const lines = buildGitStatusPanelLines(snapshot);
    expect(lines[1].text).toContain('no upstream');
  });
});

describe('buildGitChangeGroups', () => {
  it('returns empty array when git is unavailable', () => {
    expect(buildGitChangeGroups({})).toEqual([]);
  });

  it('returns groups for staged, unstaged, untracked, conflicted', () => {
    const snapshot = {
      gitChanges: {
        available: true,
        branch: 'main',
        rootPath: '/repo',
        counts: { total: 3, staged: 1, unstaged: 1, untracked: 1, conflicted: 0 },
        staged: [{ relativePath: 'a.ts' }],
        unstaged: [{ relativePath: 'b.ts' }],
        untracked: [{ relativePath: 'c.ts' }],
        conflicted: []
      }
    };
    const groups = buildGitChangeGroups(snapshot);
    expect(groups).toHaveLength(4);
    expect(groups[0].key).toBe('git:staged');
    expect(groups[0].files).toHaveLength(1);
    expect(groups[0].files[0].previewType).toBe('git-diff');
    expect(groups[1].key).toBe('git:unstaged');
    expect(groups[2].key).toBe('git:untracked');
    expect(groups[3].key).toBe('git:conflicted');
  });
});

describe('buildGitCommitRows', () => {
  it('returns unavailable row when git is not available', () => {
    const rows = buildGitCommitRows({});
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('info');
    expect(rows[0].label).toContain('unavailable');
  });
});
