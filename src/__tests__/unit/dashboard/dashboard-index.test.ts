import { describe, it, expect, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clearTerminalOutput, createInkStdout } = require('../../../lib/dashboard/index');

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

  it('clears output when tty status is unknown', () => {
    const write = vi.fn();
    clearTerminalOutput({ write });

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('\u001B[2J\u001B[3J\u001B[H');
  });

  it('wraps stdout to force tty mode for ink', () => {
    const source = {
      columns: 120,
      rows: 40,
      write: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      removeListener: vi.fn()
    };

    const wrapped = createInkStdout(source);

    expect(wrapped.isTTY).toBe(true);
    expect(wrapped.columns).toBe(120);
    expect(wrapped.rows).toBe(40);

    wrapped.write('hello');
    expect(source.write).toHaveBeenCalledWith('hello');
  });
});
