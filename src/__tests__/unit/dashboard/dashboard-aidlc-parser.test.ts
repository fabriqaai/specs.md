import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseAidlcDashboard } = require('../../../lib/dashboard/aidlc/parser');

describe('aidlc dashboard parser', () => {
  let workspacePath: string;
  let memoryBankPath: string;

  beforeEach(() => {
    workspacePath = join(tmpdir(), `dashboard-aidlc-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    memoryBankPath = join(workspacePath, 'memory-bank');

    mkdirSync(join(memoryBankPath, 'intents', '001-auth', 'units', 'api', 'stories'), { recursive: true });
    mkdirSync(join(memoryBankPath, 'bolts', 'bolt-auth-1'), { recursive: true });
    mkdirSync(join(memoryBankPath, 'bolts', 'bolt-core-1'), { recursive: true });
    mkdirSync(join(memoryBankPath, 'bolts', 'bolt-ui-1'), { recursive: true });
    mkdirSync(join(memoryBankPath, 'standards'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('parses intents, stories, bolts, and dependency-aware stats', () => {
    writeFileSync(join(memoryBankPath, 'project.yaml'), 'name: demo-aidlc\nproject_type: service\n', 'utf8');

    writeFileSync(join(memoryBankPath, 'intents', '001-auth', 'requirements.md'), `---\nstatus: in-progress\n---\n`, 'utf8');
    writeFileSync(join(memoryBankPath, 'intents', '001-auth', 'units', 'api', 'unit-brief.md'), `---\nstatus: in-progress\n---\n`, 'utf8');
    writeFileSync(join(memoryBankPath, 'intents', '001-auth', 'units', 'api', 'stories', '001-login.md'), `---\nstatus: complete\n---\n`, 'utf8');
    writeFileSync(join(memoryBankPath, 'intents', '001-auth', 'units', 'api', 'stories', '002-mfa.md'), `---\nstatus: ready\n---\n`, 'utf8');

    writeFileSync(join(memoryBankPath, 'bolts', 'bolt-auth-1', 'bolt.md'), `---\nintent: 001-auth\nunit: api\ntype: simple-construction-bolt\nstatus: in-progress\ncurrent_stage: implement\nstages_completed:\n  - plan\nrequires_bolts:\n  - bolt-core-1\nstarted: 2026-02-21T12:00:00Z\n---\n`, 'utf8');
    writeFileSync(join(memoryBankPath, 'bolts', 'bolt-auth-1', 'implementation-plan.md'), '# plan\n', 'utf8');

    writeFileSync(join(memoryBankPath, 'bolts', 'bolt-core-1', 'bolt.md'), `---\nintent: 001-auth\nunit: api\ntype: simple-construction-bolt\nstatus: complete\nstages_completed:\n  - plan\n  - implement\n  - test\ncompleted: 2026-02-21T11:30:00Z\n---\n`, 'utf8');

    writeFileSync(join(memoryBankPath, 'bolts', 'bolt-ui-1', 'bolt.md'), `---\nintent: 001-auth\nunit: api\ntype: simple-construction-bolt\nstatus: draft\nrequires_bolts:\n  - bolt-auth-1\n---\n`, 'utf8');

    writeFileSync(join(memoryBankPath, 'standards', 'tech-stack.md'), '# Tech\n', 'utf8');

    const result = parseAidlcDashboard(workspacePath);

    expect(result.ok).toBe(true);
    expect(result.snapshot.flow).toBe('aidlc');
    expect(result.snapshot.project.name).toBe('demo-aidlc');

    expect(result.snapshot.stats.totalIntents).toBe(1);
    expect(result.snapshot.stats.totalUnits).toBe(1);
    expect(result.snapshot.stats.totalStories).toBe(2);
    expect(result.snapshot.stats.completedStories).toBe(1);
    expect(result.snapshot.stats.inProgressStories).toBe(1);

    expect(result.snapshot.stats.activeBoltsCount).toBe(1);
    expect(result.snapshot.stats.completedBolts).toBe(1);
    expect(result.snapshot.stats.blockedBolts).toBe(1);

    expect(result.snapshot.activeBolts[0].id).toBe('bolt-auth-1');
    expect(result.snapshot.pendingBolts[0].id).toBe('bolt-ui-1');
    expect(result.snapshot.pendingBolts[0].isBlocked).toBe(true);

    expect(result.snapshot.standards).toHaveLength(1);
    expect(result.snapshot.warnings).toHaveLength(0);
  });

  it('returns a not-found error when memory-bank folder is missing', () => {
    rmSync(memoryBankPath, { recursive: true, force: true });
    const result = parseAidlcDashboard(workspacePath);

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('AIDLC_NOT_FOUND');
  });
});
