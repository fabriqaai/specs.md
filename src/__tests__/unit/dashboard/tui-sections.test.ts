import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getSectionOrderForView, cycleSection } = require('../../../lib/dashboard/tui/sections');

describe('getSectionOrderForView', () => {
  it('returns intent-status for intents view', () => {
    expect(getSectionOrderForView('intents')).toEqual(['intent-status']);
  });

  it('returns completed-runs for completed view', () => {
    expect(getSectionOrderForView('completed')).toEqual(['completed-runs']);
  });

  it('returns health sections for health view', () => {
    expect(getSectionOrderForView('health')).toEqual([
      'standards', 'stats', 'warnings', 'error-details'
    ]);
  });

  it('returns git sections for git view', () => {
    expect(getSectionOrderForView('git')).toEqual([
      'git-status', 'git-changes', 'git-commits', 'git-diff'
    ]);
  });

  it('returns runs sections without worktrees by default', () => {
    const result = getSectionOrderForView('runs');
    expect(result).toContain('current-run');
    expect(result).toContain('run-files');
    expect(result).not.toContain('worktrees');
  });

  it('includes worktrees section when option set', () => {
    const result = getSectionOrderForView('runs', { includeWorktrees: true });
    expect(result[0]).toBe('worktrees');
    expect(result).toContain('current-run');
  });

  it('includes other-worktrees-active section when option set', () => {
    const result = getSectionOrderForView('runs', { includeOtherWorktrees: true });
    expect(result).toContain('other-worktrees-active');
  });
});

describe('cycleSection', () => {
  it('cycles forward through sections', () => {
    const next = cycleSection('health', 'standards', 1);
    expect(next).toBe('stats');
  });

  it('cycles backward through sections', () => {
    const prev = cycleSection('health', 'stats', -1);
    expect(prev).toBe('standards');
  });

  it('wraps around forward', () => {
    const next = cycleSection('health', 'error-details', 1);
    expect(next).toBe('standards');
  });

  it('wraps around backward', () => {
    const prev = cycleSection('health', 'standards', -1);
    expect(prev).toBe('error-details');
  });

  it('returns current key for unknown section', () => {
    const result = cycleSection('health', 'unknown-section', 1);
    // defaults to index 0 when not found, cycles to index 1
    expect(result).toBe('stats');
  });

  it('uses custom available sections when provided', () => {
    const result = cycleSection('runs', 'a', 1, ['a', 'b', 'c']);
    expect(result).toBe('b');
  });

  it('falls back to view sections when custom list is empty', () => {
    // empty array is falsy-length, so falls through to getSectionOrderForView('runs')
    const result = cycleSection('runs', 'current-run', 1, []);
    expect(result).toBe('run-files');
  });
});
