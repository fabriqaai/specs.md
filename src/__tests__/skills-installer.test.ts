import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const { installSkills, FLOW_PLUGINS } = require('../lib/skills-installer');

let tmp: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'specsmd-skills-'));
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('installSkills', () => {
  it('installs core + requested flow skills into .agents/skills', () => {
    const result = installSkills({ flows: ['aidlc'], cwd: tmp });

    expect(result.skills).toContain('using-specsmd');
    expect(result.skills).toContain('specsmd-status');
    expect(result.skills).toContain('inception');
    expect(result.skills).toContain('bolt-start');
    expect(fs.existsSync(path.join(tmp, '.agents', 'skills', 'inception', 'SKILL.md'))).toBe(true);
    expect(
      fs.existsSync(path.join(tmp, '.agents', 'skills', 'bolt-start', 'scripts', 'bolt-complete.cjs'))
    ).toBe(true);
  });

  it('creates a .claude/skills symlink resolving to the .agents tree', () => {
    const result = installSkills({ flows: ['ideation'], cwd: tmp });

    expect(result.claudeSymlink).toBe('created');
    const link = path.join(tmp, '.claude', 'skills');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(path.join(link, 'spark', 'SKILL.md'))).toBe(true);
  });

  it('creates AGENTS.md from the fragment, appends to an existing one, and is idempotent', () => {
    const first = installSkills({ flows: ['simple'], cwd: tmp });
    expect(first.agentsMd).toBe('created');
    const content = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf8');
    expect(content).toContain('## specsmd — spec-driven development');

    const again = installSkills({ flows: ['simple'], cwd: tmp });
    expect(again.agentsMd).toBe('exists');

    fs.writeFileSync(path.join(tmp, 'AGENTS.md'), '# My project\n\nCustom instructions.\n');
    const appended = installSkills({ flows: ['simple'], cwd: tmp });
    expect(appended.agentsMd).toBe('appended');
    const merged = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf8');
    expect(merged.startsWith('# My project')).toBe(true);
    expect(merged).toContain('## specsmd — spec-driven development');
  });

  it('installs all flows without skill-name collisions', () => {
    const result = installSkills({ flows: Object.keys(FLOW_PLUGINS), cwd: tmp });
    expect(result.skills.length).toBeGreaterThanOrEqual(46);
  });

  it('rejects unknown flows and empty selections', () => {
    expect(() => installSkills({ flows: ['nope'], cwd: tmp })).toThrow(/Unknown flow/);
    expect(() => installSkills({ flows: [], cwd: tmp })).toThrow(/at least one flow/);
  });

  it('leaves an existing real .claude/skills directory untouched', () => {
    fs.mkdirSync(path.join(tmp, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.claude', 'skills', 'keep.txt'), 'user data');
    const result = installSkills({ flows: ['fire'], cwd: tmp });
    expect(result.claudeSymlink).toBe('skipped-existing-dir');
    expect(fs.readFileSync(path.join(tmp, '.claude', 'skills', 'keep.txt'), 'utf8')).toBe('user data');
  });
});
