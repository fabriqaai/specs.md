import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const plugin = join(__dirname, '../../../../plugins/specsmd');
const hook = join(plugin, 'hooks/session-start.cjs');

describe('unified session routing', () => {
  it('provides a small resume-aware route to the installed flow', () => {
    const output = execFileSync(process.execPath, [hook], {
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin }, encoding: 'utf8',
    });
    const result = JSON.parse(output).hookSpecificOutput;
    expect(result.hookEventName).toBe('SessionStart');
    expect(result.additionalContext).toContain('using-specsmd');
    expect(result.additionalContext).toContain('prior answers');
    expect(result.additionalContext).toContain('compaction');
    expect(result.additionalContext).toContain('only when');
    expect(result.additionalContext.length).toBeLessThan(1200);
  });

  it('does not disrupt startup when the plugin is unavailable', () => {
    const empty = mkdtempSync(join(tmpdir(), 'specsmd-hook-'));
    try {
      expect(execFileSync(process.execPath, [hook], {
        env: { ...process.env, CLAUDE_PLUGIN_ROOT: empty }, encoding: 'utf8',
      })).toBe('');
    } finally { rmSync(empty, { recursive: true, force: true }); }
  });
});
