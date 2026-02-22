const { truncate } = require('./helpers');

function buildQuickHelpText(view, options = {}) {
  const {
    flow = 'fire',
    previewOpen = false,
    availableFlowCount = 1,
    hasWorktrees = false
  } = options;
  const isAidlc = String(flow || '').toLowerCase() === 'aidlc';
  const isSimple = String(flow || '').toLowerCase() === 'simple';
  const activeLabel = isAidlc ? 'active bolt' : (isSimple ? 'active spec' : 'active run');

  const parts = ['1/2/3/4/5 tabs', 'g/G sections'];

  if (view === 'runs' || view === 'intents' || view === 'completed' || view === 'health' || view === 'git') {
    if (previewOpen) {
      parts.push('tab pane', '↑/↓ nav/scroll', 'v/space close');
    } else {
      parts.push('↑/↓ navigate', 'enter expand', 'v/space preview');
    }
  }
  if (view === 'runs') {
    if (hasWorktrees) {
      parts.push('b worktrees', 'u others');
    }
    parts.push('a current', 'f files');
  } else if (view === 'git') {
    parts.push('6 status', '7 files', '8 commits', '- diff');
  }
  parts.push(`tab1 ${activeLabel}`);

  if (availableFlowCount > 1) {
    parts.push('[/] flow');
  }

  parts.push('r refresh', '? shortcuts', 'q quit');
  return parts.join(' | ');
}

function buildGitCommandStrip(view, options = {}) {
  const {
    hasWorktrees = false,
    previewOpen = false
  } = options;

  const parts = [];

  if (view === 'runs') {
    if (hasWorktrees) {
      parts.push('b worktrees');
    }
    parts.push('a current', 'f files', 'enter expand');
  } else if (view === 'intents') {
    parts.push('n next', 'x completed', 'enter expand');
  } else if (view === 'completed') {
    parts.push('c completed', 'enter expand');
  } else if (view === 'health') {
    parts.push('s standards', 't stats', 'w warnings');
  } else if (view === 'git') {
    parts.push('6 status', '7 files', '8 commits', '- diff', 'space preview');
  }

  if (previewOpen) {
    parts.push('tab pane', 'j/k scroll');
  } else {
    parts.push('v preview');
  }

  parts.push('1-5 views', 'g/G panels', 'r refresh', '? help', 'q quit');
  return parts.join(' | ');
}

function buildGitCommandLogLine(options = {}) {
  const {
    statusLine = '',
    activeFlow = 'fire',
    watchEnabled = true,
    watchStatus = 'watching',
    selectedWorktreeLabel = null
  } = options;

  if (typeof statusLine === 'string' && statusLine.trim() !== '') {
    return `Command Log | ${statusLine}`;
  }

  const watchLabel = watchEnabled ? watchStatus : 'off';
  const worktreeSegment = selectedWorktreeLabel ? ` | wt:${selectedWorktreeLabel}` : '';
  return `Command Log | flow:${String(activeFlow || 'fire').toUpperCase()} | watch:${watchLabel}${worktreeSegment} | ready`;
}

function buildHelpOverlayLines(options = {}) {
  const {
    view = 'runs',
    flow = 'fire',
    previewOpen = false,
    paneFocus = 'main',
    availableFlowCount = 1,
    showErrorSection = false,
    hasWorktrees = false
  } = options;
  const isAidlc = String(flow || '').toLowerCase() === 'aidlc';
  const isSimple = String(flow || '').toLowerCase() === 'simple';
  const itemLabel = isAidlc ? 'bolt' : (isSimple ? 'spec' : 'run');
  const itemPlural = isAidlc ? 'bolts' : (isSimple ? 'specs' : 'runs');

  const lines = [
    { text: 'Global', color: 'cyan', bold: true },
    'q or Ctrl+C quit',
    'r refresh snapshot',
    `1 active ${itemLabel} | 2 intents | 3 completed ${itemPlural} | 4 standards/health | 5 git changes`,
    'g next section | G previous section',
    'h/? toggle this shortcuts overlay',
    'esc close overlays (help/preview/fullscreen)',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 1 Active', color: 'yellow', bold: true },
    ...(hasWorktrees ? ['b focus worktrees section', 'u focus other-worktrees section'] : []),
    `a focus active ${itemLabel}`,
    `f focus ${itemLabel} files`,
    'up/down or j/k move selection',
    'enter expand/collapse selected folder row',
    'v or space preview selected file',
    'v twice quickly opens fullscreen preview overlay',
    'tab switch focus between main and preview panes',
    'o open selected file in system default app'
  ];

  if (previewOpen) {
    lines.push(`preview is open (focus: ${paneFocus})`);
  }

  if (availableFlowCount > 1) {
    lines.push('[/] (and m) switch flow');
  }

  lines.push(
    { text: '', color: undefined, bold: false },
    { text: 'Tab 2 Intents', color: 'green', bold: true },
    'i focus intents',
    'n next intents | x completed intents',
    'left/right toggles next/completed when intents is focused',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 3 Completed', color: 'blue', bold: true },
    'c focus completed items',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 4 Standards/Health', color: 'magenta', bold: true },
    `s standards | t stats | w warnings${showErrorSection ? ' | e errors' : ''}`,
    { text: '', color: undefined, bold: false },
    { text: 'Tab 5 Git Changes', color: 'yellow', bold: true },
    '7 files: select changed files and preview per-file diffs',
    '8 commits: select a commit to preview the full commit diff',
    '6 status | 7 files | 8 commits | - diff',
    { text: '', color: undefined, bold: false },
    { text: `Current view: ${String(view || 'runs').toUpperCase()}`, color: 'gray', bold: false }
  );

  return lines;
}

function colorizeMarkdownLine(line, inCodeBlock) {
  const text = String(line ?? '');

  if (/^\s*```/.test(text)) {
    return {
      color: 'magenta',
      bold: true,
      togglesCodeBlock: true
    };
  }

  if (/^\s{0,3}#{1,6}\s+/.test(text)) {
    return {
      color: 'cyan',
      bold: true,
      togglesCodeBlock: false
    };
  }

  if (/^\s*[-*+]\s+\[[ xX]\]/.test(text) || /^\s*[-*+]\s+/.test(text) || /^\s*\d+\.\s+/.test(text)) {
    return {
      color: 'yellow',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (/^\s*>\s+/.test(text)) {
    return {
      color: 'gray',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (/^\s*---\s*$/.test(text)) {
    return {
      color: 'yellow',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (inCodeBlock) {
    return {
      color: 'green',
      bold: false,
      togglesCodeBlock: false
    };
  }

  return {
    color: undefined,
    bold: false,
    togglesCodeBlock: false
  };
}

function sanitizeRenderLine(value) {
  const raw = String(value ?? '');
  const withoutAnsi = raw
    // OSC sequences (e.g. hyperlinks / title set): ESC ] ... BEL or ESC \
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, '')
    // CSI sequences
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    // 7-bit C1 control sequences
    .replace(/\u001B[@-Z\\-_]/g, '')
    // Any remaining ESC bytes
    .replace(/\u001B/g, '')
    // Carriage return can reposition cursor to column 0 and corrupt frame painting
    .replace(/\r/g, '');

  return withoutAnsi.replace(/[\u0000-\u0008\u000B-\u001A\u001C-\u001F\u007F]/g, '');
}

module.exports = {
  buildQuickHelpText,
  buildGitCommandStrip,
  buildGitCommandLogLine,
  buildHelpOverlayLines,
  colorizeMarkdownLine,
  sanitizeRenderLine
};
