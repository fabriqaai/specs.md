import { execFileSync } from 'child_process';
import { join } from 'path';
import { describe, expect, test } from 'vitest';

const cliPath = join(__dirname, '../../../bin/cli.js');

function runCli(args: string[]): string {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: join(__dirname, '../../..'),
    encoding: 'utf8'
  });
}

describe('dashboard CLI command surface', () => {
  test('uses dashboard for web and dashboard-cli for terminal', () => {
    const output = runCli(['--help']);

    expect(output).toContain('dashboard');
    expect(output).toContain('Local web dashboard for flow state');
    expect(output).toContain('dashboard-cli');
    expect(output).toContain('Live terminal dashboard for flow state');
  });

  test('keeps terminal options under dashboard-cli', () => {
    const output = runCli(['dashboard-cli', '--help']);

    expect(output).toContain('--flow <flow>');
    expect(output).toContain('--path <dir>');
    expect(output).toContain('--worktree <nameOrPath>');
    expect(output).toContain('--refresh-ms <n>');
    expect(output).toContain('--no-watch');
  });

  test('exposes web dashboard options under dashboard', () => {
    const output = runCli(['dashboard', '--help']);

    expect(output).toContain('--flow <flow>');
    expect(output).toContain('--path <dir>');
    expect(output).toContain('--port <n>');
    expect(output).toContain('--host <host>');
    expect(output).toContain('--no-open');
  });
});
