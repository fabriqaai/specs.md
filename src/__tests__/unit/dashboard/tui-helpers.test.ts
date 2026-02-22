import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  toDashboardError,
  safeJsonHash,
  truncate,
  fitLines,
  resolveFrameWidth,
  formatTime,
  fileExists,
  readFileTextSafe,
  normalizeToken,
  clampIndex,
  normalizePanelLine
} = require('../../../lib/dashboard/tui/helpers');

describe('toDashboardError', () => {
  it('returns default error for falsy input', () => {
    const result = toDashboardError(null);
    expect(result.code).toBe('DASHBOARD_ERROR');
    expect(result.message).toBe('Unknown dashboard error.');
  });

  it('wraps a string into an error object', () => {
    const result = toDashboardError('something broke');
    expect(result.code).toBe('DASHBOARD_ERROR');
    expect(result.message).toBe('something broke');
  });

  it('uses custom default code', () => {
    const result = toDashboardError('oops', 'CUSTOM_CODE');
    expect(result.code).toBe('CUSTOM_CODE');
  });

  it('preserves error object fields', () => {
    const result = toDashboardError({
      code: 'FILE_ERROR',
      message: 'not found',
      details: 'extra info',
      path: '/some/path',
      hint: 'check the path'
    });
    expect(result.code).toBe('FILE_ERROR');
    expect(result.message).toBe('not found');
    expect(result.details).toBe('extra info');
    expect(result.path).toBe('/some/path');
    expect(result.hint).toBe('check the path');
  });

  it('stringifies non-string non-object values', () => {
    const result = toDashboardError(42);
    expect(result.message).toBe('42');
  });
});

describe('safeJsonHash', () => {
  it('serializes a plain object', () => {
    const hash = safeJsonHash({ a: 1, b: 'two' });
    expect(hash).toBe(JSON.stringify({ a: 1, b: 'two' }));
  });

  it('strips generatedAt keys', () => {
    const hash = safeJsonHash({ generatedAt: '2025-01-01', name: 'test' });
    expect(hash).toBe(JSON.stringify({ name: 'test' }));
  });

  it('handles circular references gracefully', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = safeJsonHash(obj);
    expect(typeof result).toBe('string');
  });
});

describe('truncate', () => {
  it('returns text unchanged when it fits', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when text exceeds width', () => {
    const result = truncate('hello world this is long', 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).toContain('...');
  });

  it('returns empty string for width 0', () => {
    expect(truncate('hello', 0)).toBe('');
  });

  it('handles non-finite width by returning full text', () => {
    expect(truncate('hello', NaN)).toBe('hello');
    expect(truncate('hello', Infinity)).toBe('hello');
  });

  it('handles null/undefined values', () => {
    expect(truncate(null, 10)).toBe('');
    expect(truncate(undefined, 10)).toBe('');
  });
});

describe('resolveFrameWidth', () => {
  it('subtracts 1 from column count above 24', () => {
    expect(resolveFrameWidth(80)).toBe(79);
    expect(resolveFrameWidth(120)).toBe(119);
  });

  it('returns column count at or below 24', () => {
    expect(resolveFrameWidth(24)).toBe(24);
    expect(resolveFrameWidth(10)).toBe(10);
  });

  it('defaults to 120 for non-finite input', () => {
    expect(resolveFrameWidth(NaN)).toBe(119);
    expect(resolveFrameWidth(undefined as unknown as number)).toBe(119);
  });
});

describe('fitLines', () => {
  it('returns all lines when count is within budget', () => {
    const lines = ['a', 'b', 'c'];
    const result = fitLines(lines, 5, 100);
    expect(result).toHaveLength(3);
  });

  it('truncates with more indicator when exceeding max', () => {
    const lines = ['a', 'b', 'c', 'd', 'e'];
    const result = fitLines(lines, 3, 100);
    expect(result).toHaveLength(3);
    expect(result[2].text).toContain('+');
    expect(result[2].color).toBe('gray');
  });

  it('centers window around selected line', () => {
    const lines = [
      { text: 'a', selected: false },
      { text: 'b', selected: false },
      { text: 'c', selected: true },
      { text: 'd', selected: false },
      { text: 'e', selected: false }
    ];
    const result = fitLines(lines, 3, 100);
    expect(result).toHaveLength(3);
    expect(result.some((l: { selected: boolean }) => l.selected)).toBe(true);
  });

  it('handles empty lines array', () => {
    const result = fitLines([], 5, 100);
    expect(result).toHaveLength(0);
  });
});

describe('formatTime', () => {
  it('returns n/a for falsy values', () => {
    expect(formatTime(null)).toBe('n/a');
    expect(formatTime('')).toBe('n/a');
    expect(formatTime(undefined)).toBe('n/a');
  });

  it('returns original value for unparseable dates', () => {
    expect(formatTime('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid ISO date string', () => {
    const result = formatTime('2025-06-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('n/a');
  });
});

describe('fileExists', () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = join(tmpdir(), `helpers-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpPath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpPath)) {
      rmSync(tmpPath, { recursive: true, force: true });
    }
  });

  it('returns true for an existing file', () => {
    const filePath = join(tmpPath, 'test.txt');
    writeFileSync(filePath, 'content');
    expect(fileExists(filePath)).toBe(true);
  });

  it('returns false for a directory', () => {
    expect(fileExists(tmpPath)).toBe(false);
  });

  it('returns false for non-existent path', () => {
    expect(fileExists(join(tmpPath, 'nope.txt'))).toBe(false);
  });
});

describe('readFileTextSafe', () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = join(tmpdir(), `helpers-read-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpPath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpPath)) {
      rmSync(tmpPath, { recursive: true, force: true });
    }
  });

  it('reads file content', () => {
    const filePath = join(tmpPath, 'data.txt');
    writeFileSync(filePath, 'hello world');
    expect(readFileTextSafe(filePath)).toBe('hello world');
  });

  it('returns null for missing file', () => {
    expect(readFileTextSafe(join(tmpPath, 'missing.txt'))).toBeNull();
  });
});

describe('normalizeToken', () => {
  it('lowercases and trims', () => {
    expect(normalizeToken('  HELLO  ')).toBe('hello');
  });

  it('replaces spaces and dashes with underscores', () => {
    expect(normalizeToken('in-progress status')).toBe('in_progress_status');
  });

  it('returns empty string for non-string input', () => {
    expect(normalizeToken(42)).toBe('');
    expect(normalizeToken(null)).toBe('');
  });
});

describe('clampIndex', () => {
  it('clamps within range', () => {
    expect(clampIndex(5, 10)).toBe(5);
    expect(clampIndex(0, 10)).toBe(0);
    expect(clampIndex(9, 10)).toBe(9);
  });

  it('clamps to max when exceeding length', () => {
    expect(clampIndex(15, 10)).toBe(9);
  });

  it('clamps negative to zero', () => {
    expect(clampIndex(-5, 10)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(clampIndex(NaN, 10)).toBe(0);
    expect(clampIndex(5, NaN)).toBe(0);
    expect(clampIndex(5, 0)).toBe(0);
  });
});

describe('normalizePanelLine', () => {
  it('converts a string to a line object', () => {
    const result = normalizePanelLine('hello');
    expect(result.text).toBe('hello');
    expect(result.bold).toBe(false);
    expect(result.selected).toBe(false);
  });

  it('preserves object properties', () => {
    const result = normalizePanelLine({ text: 'test', color: 'red', bold: true, selected: true });
    expect(result.text).toBe('test');
    expect(result.color).toBe('red');
    expect(result.bold).toBe(true);
    expect(result.selected).toBe(true);
  });

  it('handles null/undefined', () => {
    const result = normalizePanelLine(null);
    expect(result.text).toBe('');
  });
});
