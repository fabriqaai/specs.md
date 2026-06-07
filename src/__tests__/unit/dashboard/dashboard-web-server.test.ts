import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'fs';
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
      expect(data.webviewMessage.type).toBe('setData');
      expect(data.webviewMessage.availableFlows[0].id).toBe('aidlc');
    } finally {
      await handle.close();
    }
  });

  test('serves the VS Code webview app host', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const response = await fetch(handle.url);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain('<specsmd-app>');
      expect(html).toContain('/webview-bundle.js');
    } finally {
      await handle.close();
    }
  });

  test('rejects cross-origin dashboard command posts', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const response = await fetch(`${handle.url}api/message`, {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
          origin: 'https://example.test'
        },
        body: JSON.stringify({ type: 'openExternal', url: 'https://specs.md' })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN_ORIGIN');
    } finally {
      await handle.close();
    }
  });

  test('rejects tokenless dashboard command posts without an origin header', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const response = await fetch(`${handle.url}api/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'ready' })
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN_ORIGIN');
    } finally {
      await handle.close();
    }
  });

  test('rejects tokenless dashboard event streams without an origin header', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const response = await fetch(`${handle.url}events`);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN_ORIGIN');
    } finally {
      await handle.close();
    }
  });

  test('accepts same-origin dashboard command posts with page token', async () => {
    const workspace = createAidlcWorkspace();
    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const pageResponse = await fetch(handle.url);
      const cookie = pageResponse.headers.get('set-cookie')?.split(';')[0];
      expect(cookie).toContain('specsmd_dashboard_token=');

      const response = await fetch(`${handle.url}api/message`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: handle.url.replace(/\/$/, ''),
          cookie: cookie || ''
        },
        body: JSON.stringify({ type: 'ready' })
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
    } finally {
      await handle.close();
    }
  });

  test('does not open symlinked artifacts outside the workspace', async () => {
    const workspace = createAidlcWorkspace();
    const outsideFile = join(tmpdir(), `dashboard-web-outside-${Date.now()}.md`);
    const linkPath = join(workspace, 'memory-bank', 'outside.md');
    writeFileSync(outsideFile, '# outside');
    symlinkSync(outsideFile, linkPath);

    const handle = await startDashboardWeb({
      path: workspace,
      host: '127.0.0.1',
      port: '0',
      watch: false
    });

    try {
      const pageResponse = await fetch(handle.url);
      const cookie = pageResponse.headers.get('set-cookie')?.split(';')[0];
      const response = await fetch(`${handle.url}api/message`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: handle.url.replace(/\/$/, ''),
          cookie: cookie || ''
        },
        body: JSON.stringify({ type: 'openArtifact', path: linkPath })
      });
      const body = await response.json();

      expect(response.status).toBe(202);
      expect(body.ignored).toBe(true);
    } finally {
      await handle.close();
      rmSync(outsideFile, { force: true });
    }
  });
});
