import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, test } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { startDashboardWeb } = require('../../../lib/dashboard/web/server');

let workspacePath: string | null = null;

function createAidlcWorkspace(): string {
  workspacePath = join(tmpdir(), `dashboard-web-server-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(workspacePath, 'memory-bank', 'intents', '001-demo'), { recursive: true });
  mkdirSync(join(workspacePath, 'memory-bank', 'bolts'), { recursive: true });
  mkdirSync(join(workspacePath, 'memory-bank', 'standards'), { recursive: true });
  writeFileSync(join(workspacePath, 'memory-bank', 'project.yaml'), 'name: demo\nproject_type: cli-tool\n');
  writeFileSync(join(workspacePath, 'memory-bank', 'intents', '001-demo', 'requirements.md'), [
    '---',
    'intent: 001-demo',
    'status: draft',
    '---',
    '',
    '# Requirements: Demo'
  ].join('\n'));
  return workspacePath;
}

afterEach(() => {
  if (workspacePath) {
    rmSync(workspacePath, { recursive: true, force: true });
    workspacePath = null;
  }
});

describe('dashboard web server', () => {
  test('serves snapshot data from a local server', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const response = await fetch(`${handle.url}api/snapshot`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.flow).toBe('aidlc');
      expect(data.snapshot.project.name).toBe('demo');
    } finally {
      await handle.close();
    }
  });
});
