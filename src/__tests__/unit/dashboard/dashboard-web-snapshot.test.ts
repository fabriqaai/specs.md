import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, test } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadWebDashboardData } = require('../../../lib/dashboard/web/snapshot');

let workspacePath: string | null = null;

function createWorkspace(): string {
  workspacePath = join(tmpdir(), `dashboard-web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(workspacePath, { recursive: true });
  return workspacePath;
}

afterEach(() => {
  if (workspacePath) {
    rmSync(workspacePath, { recursive: true, force: true });
    workspacePath = null;
  }
});

describe('dashboard web snapshot adapter', () => {
  test('loads AI-DLC dashboard data from a memory-bank workspace', async () => {
    const workspace = createWorkspace();
    mkdirSync(join(workspace, 'memory-bank', 'intents', '001-demo'), { recursive: true });
    mkdirSync(join(workspace, 'memory-bank', 'bolts'), { recursive: true });
    mkdirSync(join(workspace, 'memory-bank', 'standards'), { recursive: true });
    writeFileSync(join(workspace, 'memory-bank', 'project.yaml'), 'name: demo\nproject_type: cli-tool\n');
    writeFileSync(join(workspace, 'memory-bank', 'intents', '001-demo', 'requirements.md'), [
      '---',
      'intent: 001-demo',
      'status: draft',
      '---',
      '',
      '# Requirements: Demo'
    ].join('\n'));

    const data = await loadWebDashboardData({ workspacePath: workspace });

    expect(data.ok).toBe(true);
    expect(data.flow).toBe('aidlc');
    expect(data.snapshot.project.name).toBe('demo');
    expect(data.summary.cards.some((card: { label: string }) => card.label === 'Intents')).toBe(true);
    expect(data.summary.primaryItems[0].title).toBe('001-demo');
  });

  test('returns a helpful error for unsupported workspaces', async () => {
    const workspace = createWorkspace();

    const data = await loadWebDashboardData({ workspacePath: workspace });

    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('NO_SUPPORTED_FLOW');
    expect(data.error.message).toContain('No supported flow detected');
  });
});
