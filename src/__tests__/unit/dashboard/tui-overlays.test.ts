import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  buildQuickHelpText,
  buildGitCommandStrip,
  buildGitCommandLogLine,
  buildHelpOverlayLines,
  colorizeMarkdownLine,
  sanitizeRenderLine
} = require('../../../lib/dashboard/tui/overlays');

describe('buildQuickHelpText', () => {
  it('includes tab and section shortcuts for runs view', () => {
    const text = buildQuickHelpText('runs');
    expect(text).toContain('1/2/3/4/5');
    expect(text).toContain('g/G');
    expect(text).toContain('navigate');
  });

  it('includes git shortcuts for git view', () => {
    const text = buildQuickHelpText('git');
    expect(text).toContain('6 status');
    expect(text).toContain('7 files');
    expect(text).toContain('8 commits');
  });

  it('includes preview shortcuts when preview is open', () => {
    const text = buildQuickHelpText('runs', { previewOpen: true });
    expect(text).toContain('pane');
    expect(text).toContain('close');
  });

  it('includes flow switch when multiple flows available', () => {
    const text = buildQuickHelpText('runs', { availableFlowCount: 3 });
    expect(text).toContain('[/]');
  });

  it('uses bolt label for aidlc flow', () => {
    const text = buildQuickHelpText('runs', { flow: 'aidlc' });
    expect(text).toContain('bolt');
  });

  it('uses spec label for simple flow', () => {
    const text = buildQuickHelpText('runs', { flow: 'simple' });
    expect(text).toContain('spec');
  });

  it('includes worktree shortcuts when available', () => {
    const text = buildQuickHelpText('runs', { hasWorktrees: true });
    expect(text).toContain('b worktrees');
  });
});

describe('buildGitCommandStrip', () => {
  it('includes view-specific shortcuts for runs view', () => {
    const text = buildGitCommandStrip('runs');
    expect(text).toContain('enter expand');
    expect(text).toContain('v preview');
  });

  it('includes git-specific shortcuts', () => {
    const text = buildGitCommandStrip('git');
    expect(text).toContain('6 status');
    expect(text).toContain('space preview');
  });

  it('includes scroll shortcuts when preview open', () => {
    const text = buildGitCommandStrip('runs', { previewOpen: true });
    expect(text).toContain('j/k scroll');
  });
});

describe('buildGitCommandLogLine', () => {
  it('returns status line when provided', () => {
    const result = buildGitCommandLogLine({ statusLine: 'Running git diff...' });
    expect(result).toContain('Running git diff...');
  });

  it('shows flow and watch status when no status line', () => {
    const result = buildGitCommandLogLine({ activeFlow: 'fire', watchEnabled: true, watchStatus: 'watching' });
    expect(result).toContain('FIRE');
    expect(result).toContain('watching');
    expect(result).toContain('ready');
  });

  it('shows watch off when disabled', () => {
    const result = buildGitCommandLogLine({ watchEnabled: false });
    expect(result).toContain('watch:off');
  });

  it('includes worktree segment when provided', () => {
    const result = buildGitCommandLogLine({ selectedWorktreeLabel: 'feat-x' });
    expect(result).toContain('wt:feat-x');
  });
});

describe('buildHelpOverlayLines', () => {
  it('returns a non-empty array of help lines', () => {
    const lines = buildHelpOverlayLines();
    expect(lines.length).toBeGreaterThan(10);
  });

  it('includes global shortcuts section', () => {
    const lines = buildHelpOverlayLines();
    const textLines = lines.map((l: string | { text: string }) => typeof l === 'string' ? l : l.text);
    expect(textLines.some((t: string) => t.includes('quit'))).toBe(true);
    expect(textLines.some((t: string) => t.includes('refresh'))).toBe(true);
  });

  it('includes git tab section', () => {
    const lines = buildHelpOverlayLines();
    const hasGitSection = lines.some((l: string | { text: string }) => {
      const text = typeof l === 'string' ? l : l.text;
      return text.includes('Git Changes');
    });
    expect(hasGitSection).toBe(true);
  });

  it('shows current view', () => {
    const lines = buildHelpOverlayLines({ view: 'health' });
    const last = lines[lines.length - 1];
    const text = typeof last === 'string' ? last : last.text;
    expect(text).toContain('HEALTH');
  });
});

describe('colorizeMarkdownLine', () => {
  it('colors headings cyan and bold', () => {
    const result = colorizeMarkdownLine('## My heading', false);
    expect(result.color).toBe('cyan');
    expect(result.bold).toBe(true);
  });

  it('colors list items yellow', () => {
    const result = colorizeMarkdownLine('- item one', false);
    expect(result.color).toBe('yellow');
  });

  it('colors numbered lists yellow', () => {
    const result = colorizeMarkdownLine('1. first', false);
    expect(result.color).toBe('yellow');
  });

  it('colors blockquotes gray', () => {
    const result = colorizeMarkdownLine('> quoted text', false);
    expect(result.color).toBe('gray');
  });

  it('colors code fences magenta and toggles code block', () => {
    const result = colorizeMarkdownLine('```js', false);
    expect(result.color).toBe('magenta');
    expect(result.togglesCodeBlock).toBe(true);
  });

  it('colors lines inside code blocks green', () => {
    const result = colorizeMarkdownLine('const x = 1;', true);
    expect(result.color).toBe('green');
  });

  it('colors horizontal rules yellow', () => {
    const result = colorizeMarkdownLine('---', false);
    expect(result.color).toBe('yellow');
  });

  it('returns no color for plain text', () => {
    const result = colorizeMarkdownLine('just text', false);
    expect(result.color).toBeUndefined();
  });
});

describe('sanitizeRenderLine', () => {
  it('strips ANSI escape sequences', () => {
    const result = sanitizeRenderLine('\u001B[31mred\u001B[0m');
    expect(result).toBe('red');
  });

  it('strips control characters', () => {
    const result = sanitizeRenderLine('hello\x00world\x07');
    expect(result).toBe('helloworld');
  });

  it('handles null/undefined', () => {
    expect(sanitizeRenderLine(null)).toBe('');
    expect(sanitizeRenderLine(undefined)).toBe('');
  });
});
