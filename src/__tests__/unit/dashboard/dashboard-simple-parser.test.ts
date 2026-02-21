import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseSimpleDashboard, parseTaskChecklist } = require('../../../lib/dashboard/simple/parser');

describe('simple dashboard parser', () => {
  let workspacePath: string;
  let specsPath: string;

  beforeEach(() => {
    workspacePath = join(tmpdir(), `dashboard-simple-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    specsPath = join(workspacePath, 'specs');

    mkdirSync(join(specsPath, 'user-auth'), { recursive: true });
    mkdirSync(join(specsPath, 'billing'), { recursive: true });
    mkdirSync(join(specsPath, 'archive-cleanup'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('parses spec states and task progress', () => {
    writeFileSync(join(workspacePath, 'package.json'), JSON.stringify({ name: 'simple-demo' }), 'utf8');

    writeFileSync(join(specsPath, 'user-auth', 'requirements.md'), '# req\n', 'utf8');
    writeFileSync(join(specsPath, 'user-auth', 'design.md'), '# design\n', 'utf8');
    writeFileSync(join(specsPath, 'user-auth', 'tasks.md'), `# Tasks\n\n- [x] 1. set up auth core\n- [ ] 2. add mfa path\n- [ ]* 3. optional smoke test\n`, 'utf8');

    writeFileSync(join(specsPath, 'billing', 'requirements.md'), '# req\n', 'utf8');

    writeFileSync(join(specsPath, 'archive-cleanup', 'requirements.md'), '# req\n', 'utf8');
    writeFileSync(join(specsPath, 'archive-cleanup', 'design.md'), '# design\n', 'utf8');
    writeFileSync(join(specsPath, 'archive-cleanup', 'tasks.md'), `# Tasks\n\n- [x] 1. remove stale code\n- [x] 2. verify tests\n`, 'utf8');

    const result = parseSimpleDashboard(workspacePath);

    expect(result.ok).toBe(true);
    expect(result.snapshot.flow).toBe('simple');
    expect(result.snapshot.project.name).toBe('simple-demo');

    expect(result.snapshot.stats.totalSpecs).toBe(3);
    expect(result.snapshot.stats.completedSpecs).toBe(1);
    expect(result.snapshot.stats.inProgressSpecs).toBe(1);
    expect(result.snapshot.stats.pendingSpecs).toBe(2);

    expect(result.snapshot.stats.totalTasks).toBe(5);
    expect(result.snapshot.stats.completedTasks).toBe(3);
    expect(result.snapshot.stats.pendingTasks).toBe(2);
    expect(result.snapshot.stats.optionalTasks).toBe(1);

    expect(result.snapshot.activeSpecs[0].name).toBe('user-auth');
    expect(result.snapshot.activeSpecs[0].state).toBe('in_progress');
    expect(result.snapshot.completedSpecs[0].name).toBe('archive-cleanup');

    expect(result.snapshot.warnings).toHaveLength(0);
  });

  it('extracts task checkboxes with optional markers', () => {
    const parsed = parseTaskChecklist(`- [ ] 1. pending\n- [x] 2. done\n- [ ]* 3. optional\n`);

    expect(parsed).toHaveLength(3);
    expect(parsed[1].done).toBe(true);
    expect(parsed[2].optional).toBe(true);
  });

  it('returns a not-found error when specs folder is missing', () => {
    rmSync(specsPath, { recursive: true, force: true });
    const result = parseSimpleDashboard(workspacePath);

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('SIMPLE_NOT_FOUND');
  });
});
