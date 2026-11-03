/**
 * Claude Code installer
 *
 * Flow commands are installed as slash commands in .claude/commands/. Older
 * versions also copied them into .claude/agents/, where Claude Code skips
 * them (no `name:` frontmatter); those copies are removed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';

/* eslint-disable @typescript-eslint/no-require-imports */
const prompts = require('prompts');
const ClaudeInstaller = require('../../../lib/installers/ClaudeInstaller');
const { uninstall } = require('../../../lib/installer');
/* eslint-enable @typescript-eslint/no-require-imports */

const AIDLC_FLOW_PATH = path.resolve(__dirname, '../../../flows/aidlc');

describe('ClaudeInstaller', () => {
  let originalCwd: string;
  let projectDir: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'specsmd-claude-'));
    process.chdir(projectDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.chdir(originalCwd);
    await fs.remove(projectDir);
  });

  it('should install flow commands as slash commands only', async () => {
    await new ClaudeInstaller().installCommands(AIDLC_FLOW_PATH, {});

    expect((await fs.readdir('.claude/commands')).sort()).toEqual([
      'specsmd-construction-agent.md',
      'specsmd-inception-agent.md',
      'specsmd-master-agent.md',
      'specsmd-operations-agent.md',
    ]);
    expect(await fs.pathExists('.claude/agents')).toBe(false);
  });

  it('should remove agent copies left by older versions on install', async () => {
    await fs.outputFile('.claude/agents/specsmd-master-agent.md', 'copy from aidlc');
    await fs.outputFile('.claude/agents/specsmd-fire.md', 'copy from another flow');
    await fs.outputFile('.claude/agents/code-reviewer.md', '---\nname: code-reviewer\n---\n');

    await new ClaudeInstaller().installCommands(AIDLC_FLOW_PATH, {});

    expect(await fs.readdir('.claude/agents')).toEqual(['code-reviewer.md']);
  });

  it('should only remove names that a flow command produces', async () => {
    await fs.outputFile('.claude/agents/specsmd-agent.md', 'copy from simple');
    await fs.outputFile('.claude/agents/specsmd-reviewer.md', 'written by the user');

    expect(await new ClaudeInstaller().removeLegacyFiles()).toEqual(['specsmd-agent.md']);
    expect(await fs.readdir('.claude/agents')).toEqual(['specsmd-reviewer.md']);
  });

  it('should remove agent copies left by older versions on uninstall', async () => {
    await fs.outputFile('.specsmd/manifest.yaml', yaml.dump({ flow: 'aidlc', tools: ['claude'] }));
    await fs.outputFile('.claude/commands/specsmd-master-agent.md', 'command');
    await fs.outputFile('.claude/agents/specsmd-master-agent.md', 'copy from aidlc');

    prompts.inject([true, true]); // confirm uninstall, keep memory-bank
    await uninstall();

    expect(await fs.readdir('.claude/commands')).toEqual([]);
    expect(await fs.readdir('.claude/agents')).toEqual([]);
    expect(await fs.pathExists('.specsmd')).toBe(false);
  });
});
