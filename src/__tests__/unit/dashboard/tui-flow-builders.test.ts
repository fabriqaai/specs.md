import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  buildShortStats,
  buildHeaderLine,
  buildErrorLines,
  getEffectiveFlow,
  getPanelTitles,
  getCurrentRun,
  getCurrentFireWorkItem,
  getCurrentBolt,
  getCurrentSpec,
  isFireRunAwaitingApproval,
  isAidlcBoltAwaitingApproval
} = require('../../../lib/dashboard/tui/flow-builders');

describe('buildShortStats', () => {
  it('shows init message when not initialized (fire)', () => {
    expect(buildShortStats({}, 'fire')).toContain('init');
    expect(buildShortStats({}, 'fire')).toContain('state.yaml');
  });

  it('shows init message for aidlc when not initialized', () => {
    expect(buildShortStats({}, 'aidlc')).toContain('memory-bank');
  });

  it('shows init message for simple when not initialized', () => {
    expect(buildShortStats({}, 'simple')).toContain('specs scan');
  });

  it('shows fire stats when initialized', () => {
    const snapshot = {
      initialized: true,
      stats: { activeRunsCount: 1, completedRuns: 2, completedIntents: 3, totalIntents: 5, completedWorkItems: 8, totalWorkItems: 10 }
    };
    const result = buildShortStats(snapshot, 'fire');
    expect(result).toContain('runs 1/2');
    expect(result).toContain('intents 3/5');
    expect(result).toContain('work 8/10');
  });

  it('shows aidlc stats when initialized', () => {
    const snapshot = {
      initialized: true,
      stats: { activeBoltsCount: 1, completedBolts: 3, completedIntents: 2, totalIntents: 4, completedStories: 5, totalStories: 10 }
    };
    const result = buildShortStats(snapshot, 'aidlc');
    expect(result).toContain('bolts 1/3');
    expect(result).toContain('stories 5/10');
  });

  it('shows simple stats when initialized', () => {
    const snapshot = {
      initialized: true,
      stats: { completedSpecs: 2, totalSpecs: 5, completedTasks: 10, totalTasks: 20, activeSpecsCount: 1 }
    };
    const result = buildShortStats(snapshot, 'simple');
    expect(result).toContain('specs 2/5');
    expect(result).toContain('tasks 10/20');
  });
});

describe('buildHeaderLine', () => {
  it('includes project name and flow', () => {
    const snapshot = {
      initialized: true,
      project: { name: 'My Project' },
      stats: {}
    };
    const result = buildHeaderLine(snapshot, 'fire', true, 'watching', null, 'runs', 200);
    expect(result).toContain('FIRE');
    expect(result).toContain('My Project');
    expect(result).toContain('runs');
  });

  it('includes worktree label when provided', () => {
    const snapshot = { initialized: true, project: { name: 'P' }, stats: {} };
    const result = buildHeaderLine(snapshot, 'fire', true, 'watching', null, 'runs', 200, 'feat-branch');
    expect(result).toContain('wt:feat-branch');
  });
});

describe('buildErrorLines', () => {
  it('returns empty array for no error', () => {
    expect(buildErrorLines(null, 100)).toEqual([]);
  });

  it('includes error code and message', () => {
    const lines = buildErrorLines({ code: 'ERR', message: 'broke' }, 100);
    expect(lines[0]).toContain('[ERR]');
    expect(lines[0]).toContain('broke');
  });

  it('includes optional details, path, and hint', () => {
    const lines = buildErrorLines({
      code: 'ERR',
      message: 'broke',
      details: 'extra',
      path: '/p',
      hint: 'try this'
    }, 200);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('extra');
    expect(lines[2]).toContain('/p');
    expect(lines[3]).toContain('try this');
  });
});

describe('getEffectiveFlow', () => {
  it('returns the given flow when no snapshot override', () => {
    expect(getEffectiveFlow('fire', {})).toBe('fire');
    expect(getEffectiveFlow('aidlc', {})).toBe('aidlc');
  });

  it('returns snapshot flow when it overrides', () => {
    expect(getEffectiveFlow('fire', { flow: 'aidlc' })).toBe('aidlc');
  });

  it('passes through unknown flows as-is', () => {
    expect(getEffectiveFlow('unknown', {})).toBe('unknown');
  });

  it('defaults to fire when flow is empty', () => {
    expect(getEffectiveFlow('', {})).toBe('fire');
  });
});

describe('getPanelTitles', () => {
  it('returns titles for fire flow', () => {
    const titles = getPanelTitles('fire');
    expect(titles).toHaveProperty('current');
    expect(titles).toHaveProperty('pending');
    expect(titles).toHaveProperty('completed');
  });

  it('returns bolt-specific titles for aidlc', () => {
    const titles = getPanelTitles('aidlc');
    expect(titles.current.toLowerCase()).toContain('bolt');
  });

  it('returns spec-specific titles for simple', () => {
    const titles = getPanelTitles('simple');
    expect(titles.current.toLowerCase()).toContain('spec');
  });
});

describe('getCurrentRun', () => {
  it('returns null for empty snapshot', () => {
    expect(getCurrentRun({})).toBeNull();
    expect(getCurrentRun(null)).toBeNull();
  });

  it('returns the most recent active run', () => {
    const snapshot = {
      activeRuns: [
        { id: 'run-1', startedAt: '2025-01-01T00:00:00Z' },
        { id: 'run-2', startedAt: '2025-06-01T00:00:00Z' }
      ]
    };
    const result = getCurrentRun(snapshot);
    expect(result.id).toBe('run-2');
  });
});

describe('getCurrentFireWorkItem', () => {
  it('returns null for no work items', () => {
    expect(getCurrentFireWorkItem({})).toBeNull();
    expect(getCurrentFireWorkItem({ workItems: [] })).toBeNull();
  });

  it('returns item matching currentItem', () => {
    const run = {
      currentItem: 'wi-2',
      workItems: [
        { id: 'wi-1', status: 'completed' },
        { id: 'wi-2', status: 'in_progress' }
      ]
    };
    expect(getCurrentFireWorkItem(run).id).toBe('wi-2');
  });

  it('falls back to first in_progress item', () => {
    const run = {
      currentItem: 'missing',
      workItems: [
        { id: 'wi-1', status: 'completed' },
        { id: 'wi-2', status: 'in_progress' }
      ]
    };
    expect(getCurrentFireWorkItem(run).id).toBe('wi-2');
  });
});

describe('getCurrentBolt', () => {
  it('returns null when no active bolts', () => {
    expect(getCurrentBolt({})).toBeNull();
  });

  it('returns the first active bolt', () => {
    const snapshot = {
      activeBolts: [{ id: 'bolt-1' }, { id: 'bolt-2' }]
    };
    expect(getCurrentBolt(snapshot).id).toBe('bolt-1');
  });
});

describe('getCurrentSpec', () => {
  it('returns null when no active specs', () => {
    expect(getCurrentSpec({})).toBeNull();
  });

  it('returns the first active spec', () => {
    const snapshot = {
      activeSpecs: [{ name: 'spec-a' }]
    };
    expect(getCurrentSpec(snapshot).name).toBe('spec-a');
  });
});

describe('isFireRunAwaitingApproval', () => {
  it('returns false when no checkpoint state', () => {
    const run = { workItems: [] };
    const item = { id: 'wi-1', status: 'in_progress' };
    expect(isFireRunAwaitingApproval(run, item)).toBe(false);
  });

  it('returns true when work item is in confirm mode at plan phase with awaiting_approval', () => {
    const run = {
      currentItem: 'wi-1',
      workItems: [{ id: 'wi-1', mode: 'confirm', status: 'in_progress', currentPhase: 'plan' }]
    };
    const item = {
      id: 'wi-1',
      mode: 'confirm',
      status: 'in_progress',
      currentPhase: 'plan',
      checkpointState: 'awaiting_approval'
    };
    expect(isFireRunAwaitingApproval(run, item)).toBe(true);
  });
});

describe('isAidlcBoltAwaitingApproval', () => {
  it('returns false for null bolt', () => {
    expect(isAidlcBoltAwaitingApproval(null)).toBe(false);
  });
});
