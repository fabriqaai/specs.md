import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  buildPreviewLines,
  allocateSingleColumnPanels
} = require('../../../lib/dashboard/tui/preview');

describe('buildPreviewLines', () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = join(tmpdir(), `preview-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpPath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpPath)) {
      rmSync(tmpPath, { recursive: true, force: true });
    }
  });

  it('returns no-file message for null entry', () => {
    const lines = buildPreviewLines(null, 80, 0);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toContain('No file selected');
    expect(lines[0].color).toBe('gray');
  });

  it('returns error message for unreadable file', () => {
    const lines = buildPreviewLines({ path: join(tmpPath, 'nonexistent.md') }, 80, 0);
    expect(lines).toHaveLength(1);
    expect(lines[0].color).toBe('red');
    expect(lines[0].text).toContain('Unable to read');
  });

  it('renders file content with header and line numbers', () => {
    const filePath = join(tmpPath, 'test.md');
    writeFileSync(filePath, '# Title\n\nBody text here\n');
    const lines = buildPreviewLines({ path: filePath, label: 'test.md' }, 120, 0);

    // First line is header
    expect(lines[0].text).toContain('file:');
    expect(lines[0].color).toBe('cyan');
    expect(lines[0].bold).toBe(true);

    // Second line is separator
    expect(lines[1].text).toBe('');

    // Content lines have line numbers
    expect(lines[2].text).toMatch(/^\s*1\s*\|/);
  });

  it('applies markdown coloring to headings', () => {
    const filePath = join(tmpPath, 'heading.md');
    writeFileSync(filePath, '## My Heading\nPlain text\n');
    const lines = buildPreviewLines({ path: filePath, label: 'heading.md' }, 120, 0);

    // Skip header + separator
    const headingLine = lines[2];
    expect(headingLine.color).toBe('cyan');
    expect(headingLine.bold).toBe(true);
  });

  it('respects scroll offset', () => {
    const filePath = join(tmpPath, 'scroll.md');
    writeFileSync(filePath, 'line1\nline2\nline3\nline4\nline5\n');
    const noScroll = buildPreviewLines({ path: filePath }, 120, 0);
    const scrolled = buildPreviewLines({ path: filePath }, 120, 2);

    // scrolled should have fewer body lines since offset skips some
    expect(scrolled.length).toBeLessThan(noScroll.length);
  });

  it('caps lines at 300 unless fullDocument', () => {
    const filePath = join(tmpPath, 'big.md');
    const content = Array.from({ length: 400 }, (_, i) => `line ${i + 1}`).join('\n');
    writeFileSync(filePath, content);

    const capped = buildPreviewLines({ path: filePath }, 120, 0);
    const full = buildPreviewLines({ path: filePath }, 120, 0, { fullDocument: true });

    // Capped should have 300 content lines + header + separator + hidden message
    // Full should have all 400 content lines + header + separator
    expect(full.length).toBeGreaterThan(capped.length);
  });

  it('shows hidden line count when capped', () => {
    const filePath = join(tmpPath, 'capped.md');
    const content = Array.from({ length: 350 }, (_, i) => `line ${i}`).join('\n');
    writeFileSync(filePath, content);

    const lines = buildPreviewLines({ path: filePath }, 120, 0);
    const lastContent = lines[lines.length - 1];
    expect(lastContent.text).toContain('additional lines hidden');
  });
});

describe('allocateSingleColumnPanels', () => {
  it('returns empty array for empty candidates', () => {
    expect(allocateSingleColumnPanels([], 20)).toEqual([]);
    expect(allocateSingleColumnPanels(null, 20)).toEqual([]);
  });

  it('allocates a single panel with all remaining rows', () => {
    const panels = allocateSingleColumnPanels([{ id: 'a' }], 20);
    expect(panels).toHaveLength(1);
    expect(panels[0].maxLines).toBeGreaterThanOrEqual(1);
  });

  it('allocates multiple panels distributing rows', () => {
    const panels = allocateSingleColumnPanels(
      [{ id: 'a' }, { id: 'b' }],
      30
    );
    expect(panels).toHaveLength(2);
    expect(panels[0].maxLines + panels[1].maxLines).toBeGreaterThan(2);
  });

  it('filters out falsy candidates', () => {
    const panels = allocateSingleColumnPanels([null, { id: 'a' }, undefined], 20);
    expect(panels).toHaveLength(1);
  });

  it('always includes at least one panel even if budget is tiny', () => {
    const panels = allocateSingleColumnPanels([{ id: 'a' }], 1);
    expect(panels).toHaveLength(1);
  });
});
