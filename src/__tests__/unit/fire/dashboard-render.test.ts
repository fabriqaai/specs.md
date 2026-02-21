import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { formatDashboardText } = require('../../../lib/dashboard/tui/renderer');

const baseSnapshot = {
  initialized: true,
  project: { name: 'demo', fireVersion: '0.1.9' },
  workspace: {
    type: 'brownfield',
    structure: 'monolith',
    autonomyBias: 'balanced',
    runScopePreference: 'single'
  },
  stats: {
    totalIntents: 2,
    completedIntents: 1,
    inProgressIntents: 1,
    pendingIntents: 0,
    blockedIntents: 0,
    totalWorkItems: 5,
    completedWorkItems: 2,
    inProgressWorkItems: 1,
    pendingWorkItems: 2,
    blockedWorkItems: 0,
    totalRuns: 3,
    completedRuns: 2,
    activeRunsCount: 1
  },
  activeRuns: [
    {
      id: 'run-003',
      scope: 'batch',
      currentItem: 'WI-004',
      hasPlan: true,
      hasWalkthrough: false,
      hasTestReport: false,
      workItems: [
        { id: 'WI-003', status: 'completed' },
        { id: 'WI-004', status: 'in_progress' }
      ]
    }
  ],
  pendingItems: [
    {
      id: 'WI-005',
      mode: 'confirm',
      complexity: 'medium',
      intentTitle: 'Intent A',
      dependencies: ['WI-004']
    }
  ],
  completedRuns: [
    {
      id: 'run-002',
      scope: 'single',
      completedAt: '2026-01-19T11:00:00Z',
      workItems: [{ id: 'WI-002', status: 'completed' }]
    }
  ],
  standards: [{ type: 'constitution' }],
  intents: [
    { id: 'INT-001', status: 'completed', workItems: [{ status: 'completed' }] },
    { id: 'INT-002', status: 'in_progress', workItems: [{ status: 'in_progress' }] }
  ]
};

describe('dashboard renderer', () => {
  it('renders runs view with key sections', () => {
    const output = formatDashboardText({
      snapshot: baseSnapshot,
      error: null,
      flow: 'fire',
      workspacePath: '/tmp/demo',
      view: 'runs',
      runFilter: 'all',
      watchEnabled: true,
      watchStatus: 'watching',
      showHelp: true,
      lastRefreshAt: '2026-01-19T12:00:00Z',
      width: 140
    });

    expect(output).toContain('specsmd dashboard | FIRE | demo');
    expect(output).toContain('Active Runs');
    expect(output).toContain('Pending Queue');
    expect(output).toContain('Recent Completed Runs');
    expect(output).toContain('Keys: q quit');
  });

  it('renders overview view with standards and summaries', () => {
    const output = formatDashboardText({
      snapshot: baseSnapshot,
      error: null,
      flow: 'fire',
      workspacePath: '/tmp/demo',
      view: 'overview',
      runFilter: 'all',
      watchEnabled: true,
      watchStatus: 'watching',
      showHelp: false,
      lastRefreshAt: '2026-01-19T12:00:00Z',
      width: 140
    });

    expect(output).toContain('Overview');
    expect(output).toContain('Intent Summary');
    expect(output).toContain('Work Item Summary');
    expect(output).toContain('Standards');
    expect(output).toContain('[x] constitution.md');
    expect(output).toContain('Press h to show keyboard shortcuts.');
  });
});
