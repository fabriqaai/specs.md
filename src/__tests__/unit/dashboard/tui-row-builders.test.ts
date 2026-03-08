import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  toExpandableRows,
  buildInteractiveRowsLines,
  getSelectedRow,
  rowToFileEntry,
  firstFileEntryFromRows,
  moveRowSelection,
  toInfoRows,
  toLoadingRows
} = require('../../../lib/dashboard/tui/row-builders');

describe('toInfoRows', () => {
  it('returns empty label row when given empty array', () => {
    const rows = toInfoRows([], 'test', 'Nothing here');
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('info');
    expect(rows[0].label).toBe('Nothing here');
    expect(rows[0].selectable).toBe(false);
  });

  it('converts string lines to info rows', () => {
    const rows = toInfoRows(['line 1', 'line 2'], 'test');
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe('info');
    expect(rows[0].label).toBe('line 1');
    expect(rows[0].selectable).toBe(true);
  });

  it('converts object lines with color', () => {
    const rows = toInfoRows([{ text: 'colored', color: 'red', bold: true }], 'test');
    expect(rows[0].label).toBe('colored');
    expect(rows[0].color).toBe('red');
    expect(rows[0].bold).toBe(true);
  });
});

describe('toLoadingRows', () => {
  it('returns a single loading row', () => {
    const rows = toLoadingRows('Scanning...');
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('loading');
    expect(rows[0].label).toBe('Scanning...');
    expect(rows[0].selectable).toBe(false);
  });

  it('uses default label when empty', () => {
    const rows = toLoadingRows('');
    expect(rows[0].label).toBe('Loading...');
  });
});

describe('toExpandableRows', () => {
  it('returns empty label row for empty groups', () => {
    const rows = toExpandableRows([], 'No items');
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('info');
    expect(rows[0].label).toBe('No items');
  });

  it('creates group rows for non-empty groups', () => {
    const groups = [
      { key: 'grp1', label: 'Group 1', files: [] },
      { key: 'grp2', label: 'Group 2', files: [] }
    ];
    const rows = toExpandableRows(groups, 'No items');
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe('group');
    expect(rows[0].label).toBe('Group 1');
    expect(rows[0].expandable).toBe(false);
    expect(rows[0].expanded).toBe(false);
  });

  it('shows files when group is expanded and files exist', () => {
    const groups = [{
      key: 'grp1',
      label: 'Group 1',
      files: [
        { label: 'file.md', path: __filename, scope: 'active' }
      ]
    }];
    const rows = toExpandableRows(groups, 'No items', { grp1: true });
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe('group');
    expect(rows[0].expanded).toBe(true);
    expect(rows[1].kind).toBe('file');
    expect(rows[1].label).toBe('file.md');
  });
});

describe('buildInteractiveRowsLines', () => {
  const icons = {
    activeFile: '>',
    groupCollapsed: '>',
    groupExpanded: 'v',
    runFile: '*'
  };

  it('returns empty line for empty rows', () => {
    const lines = buildInteractiveRowsLines([], 0, icons, 80, true);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('');
  });

  it('renders group rows with markers', () => {
    const rows = [
      { kind: 'group', key: 'g1', label: 'Group', expandable: true, expanded: false, selectable: true }
    ];
    const lines = buildInteractiveRowsLines(rows, 0, icons, 80, true);
    expect(lines[0].text).toContain('>');
    expect(lines[0].text).toContain('Group');
    expect(lines[0].selected).toBe(true);
  });

  it('renders file rows with scope', () => {
    const rows = [
      { kind: 'file', key: 'f1', label: 'test.md', path: '/test.md', scope: 'active', selectable: true }
    ];
    const lines = buildInteractiveRowsLines(rows, 0, icons, 80, true);
    expect(lines[0].text).toContain('ACTIVE');
    expect(lines[0].text).toContain('test.md');
  });

  it('renders loading rows', () => {
    const rows = [
      { kind: 'loading', key: 'l1', label: 'Loading...', selectable: false }
    ];
    const lines = buildInteractiveRowsLines(rows, 0, icons, 80, true);
    expect(lines[0].loading).toBe(true);
  });
});

describe('getSelectedRow', () => {
  it('returns null for empty rows', () => {
    expect(getSelectedRow([], 0)).toBeNull();
    expect(getSelectedRow(null, 0)).toBeNull();
  });

  it('returns the row at the selected index', () => {
    const rows = [{ kind: 'group', key: 'a' }, { kind: 'file', key: 'b' }];
    expect(getSelectedRow(rows, 1)).toEqual(rows[1]);
  });

  it('clamps out-of-bounds index', () => {
    const rows = [{ kind: 'group', key: 'a' }, { kind: 'file', key: 'b' }];
    expect(getSelectedRow(rows, 100)).toEqual(rows[1]);
  });
});

describe('rowToFileEntry', () => {
  it('returns null for null/undefined', () => {
    expect(rowToFileEntry(null)).toBeNull();
    expect(rowToFileEntry(undefined)).toBeNull();
  });

  it('returns null for group rows', () => {
    expect(rowToFileEntry({ kind: 'group', key: 'g1' })).toBeNull();
  });

  it('converts file row to file entry', () => {
    const row = { kind: 'file', key: 'f1', label: 'test.md', path: '/path/test.md', scope: 'active' };
    const entry = rowToFileEntry(row);
    expect(entry.path).toBe('/path/test.md');
    expect(entry.label).toBe('test.md');
    expect(entry.scope).toBe('active');
  });

  it('converts git-file row', () => {
    const row = {
      kind: 'git-file',
      key: 'gf1',
      label: 'changed.ts',
      path: '/changed.ts',
      scope: 'staged',
      previewType: 'git-diff',
      repoRoot: '/repo'
    };
    const entry = rowToFileEntry(row);
    expect(entry.previewType).toBe('git-diff');
    expect(entry.repoRoot).toBe('/repo');
  });

  it('converts git-commit row', () => {
    const row = {
      kind: 'git-commit',
      key: 'gc1',
      label: 'abc123 fix bug',
      commitHash: 'abc123',
      repoRoot: '/repo',
      previewType: 'git-commit-diff'
    };
    const entry = rowToFileEntry(row);
    expect(entry.commitHash).toBe('abc123');
    expect(entry.previewType).toBe('git-commit-diff');
    expect(entry.scope).toBe('commit');
  });

  it('returns null for git-commit with empty hash', () => {
    expect(rowToFileEntry({ kind: 'git-commit', commitHash: '' })).toBeNull();
  });
});

describe('firstFileEntryFromRows', () => {
  it('returns null for empty rows', () => {
    expect(firstFileEntryFromRows([])).toBeNull();
  });

  it('finds the first file entry, skipping non-file rows', () => {
    const rows = [
      { kind: 'group', key: 'g1' },
      { kind: 'info', key: 'i1', label: 'info' },
      { kind: 'file', key: 'f1', label: 'test.md', path: '/test.md' }
    ];
    const entry = firstFileEntryFromRows(rows);
    expect(entry).not.toBeNull();
    expect(entry.path).toBe('/test.md');
  });
});

describe('moveRowSelection', () => {
  it('returns 0 for empty rows', () => {
    expect(moveRowSelection([], 0, 1)).toBe(0);
  });

  it('moves down to next selectable row', () => {
    const rows = [
      { kind: 'group', selectable: true },
      { kind: 'info', selectable: false },
      { kind: 'file', selectable: true }
    ];
    expect(moveRowSelection(rows, 0, 1)).toBe(2);
  });

  it('moves up to previous selectable row', () => {
    const rows = [
      { kind: 'file', selectable: true },
      { kind: 'info', selectable: false },
      { kind: 'file', selectable: true }
    ];
    expect(moveRowSelection(rows, 2, -1)).toBe(0);
  });

  it('stays in place when no selectable row in direction', () => {
    const rows = [
      { kind: 'file', selectable: true },
      { kind: 'info', selectable: false },
      { kind: 'info', selectable: false }
    ];
    expect(moveRowSelection(rows, 0, 1)).toBe(0);
  });
});
