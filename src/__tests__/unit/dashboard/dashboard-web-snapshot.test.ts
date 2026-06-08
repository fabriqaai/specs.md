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
    expect(data.webviewMessage.type).toBe('setData');
    expect(data.webviewMessage.availableFlows[0].icon).toBe('📘');
    expect(data.webviewMessage.boltsData.stats).toEqual({
      active: 0,
      queued: 0,
      done: 0,
      blocked: 0
    });
    expect(data.webviewMessage.specsHtml).toContain('001-demo - intent');
  });

  test('returns a helpful error for unsupported workspaces', async () => {
    const workspace = createWorkspace();

    const data = await loadWebDashboardData({ workspacePath: workspace });

    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('NO_SUPPORTED_FLOW');
    expect(data.error.message).toContain('No supported flow detected');
  });

  test('builds FIRE webview data for the shared VS Code FIRE components', async () => {
    const workspace = createWorkspace();
    mkdirSync(join(workspace, '.specs-fire', 'intents', 'intent-demo', 'work-items'), { recursive: true });
    mkdirSync(join(workspace, '.specs-fire', 'runs', 'run-demo'), { recursive: true });
    mkdirSync(join(workspace, '.specs-fire', 'standards'), { recursive: true });
    writeFileSync(join(workspace, '.specs-fire', 'state.yaml'), [
      'project:',
      '  name: fire-demo',
      'workspace:',
      '  type: greenfield',
      '  structure: monolith',
      'intents:',
      '  - id: intent-demo',
      '    title: Demo intent',
      '    status: pending',
      '    work_items:',
      '      - id: item-demo',
      '        status: pending',
      '        mode: confirm',
      'runs:',
      '  active: []',
      '  completed: []'
    ].join('\n'));
    writeFileSync(join(workspace, '.specs-fire', 'intents', 'intent-demo', 'work-items', 'item-demo.md'), [
      '---',
      'title: Demo item',
      'status: pending',
      'mode: confirm',
      '---',
      '',
      '# Demo item'
    ].join('\n'));

    const data = await loadWebDashboardData({ workspacePath: workspace });

    expect(data.ok).toBe(true);
    expect(data.flow).toBe('fire');
    expect(data.webviewMessage.activeFlowId).toBe('fire');
    expect(data.webviewMessage.fireData.activeTab).toBe('runs');
    expect(data.webviewMessage.fireData.runsData.pendingItems[0].id).toBe('item-demo');
  });

  test('includes every detected flow in the webview switcher payload', async () => {
    const workspace = createWorkspace();
    mkdirSync(join(workspace, '.specs-fire'), { recursive: true });
    mkdirSync(join(workspace, 'memory-bank', 'intents', '001-demo'), { recursive: true });
    mkdirSync(join(workspace, 'memory-bank', 'bolts'), { recursive: true });
    mkdirSync(join(workspace, 'memory-bank', 'standards'), { recursive: true });
    writeFileSync(join(workspace, '.specs-fire', 'state.yaml'), 'project:\n  name: fire-demo\n');
    writeFileSync(join(workspace, 'memory-bank', 'intents', '001-demo', 'requirements.md'), [
      '---',
      'status: draft',
      '---',
      '',
      '# Requirements'
    ].join('\n'));

    const data = await loadWebDashboardData({ workspacePath: workspace });

    expect(data.ok).toBe(true);
    expect(data.flow).toBe('fire');
    expect(data.webviewMessage.availableFlows.map((flow: { id: string }) => flow.id)).toEqual(['fire', 'aidlc']);
    expect(data.webviewMessage.activeFlowId).toBe('fire');
  });
});
