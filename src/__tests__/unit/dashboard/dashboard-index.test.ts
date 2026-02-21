import { describe, it, expect, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clearTerminalOutput } = require('../../../lib/dashboard/index');

describe('dashboard index helpers', () => {
  it('clears terminal output when stdout is a tty', () => {
    const write = vi.fn();
    clearTerminalOutput({ isTTY: true, write });

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('\u001B[2J\u001B[3J\u001B[H');
  });

  it('does not clear output for non-tty streams', () => {
    const write = vi.fn();
    clearTerminalOutput({ isTTY: false, write });

    expect(write).not.toHaveBeenCalled();
  });
});
