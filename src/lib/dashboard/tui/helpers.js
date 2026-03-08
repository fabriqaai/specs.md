const fs = require('fs');
const stringWidthModule = require('string-width');
const sliceAnsiModule = require('slice-ansi');

const stringWidth = typeof stringWidthModule === 'function'
  ? stringWidthModule
  : stringWidthModule.default;
const sliceAnsi = typeof sliceAnsiModule === 'function'
  ? sliceAnsiModule
  : sliceAnsiModule.default;

function toDashboardError(error, defaultCode = 'DASHBOARD_ERROR') {
  if (!error) {
    return {
      code: defaultCode,
      message: 'Unknown dashboard error.'
    };
  }

  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error
    };
  }

  if (typeof error === 'object') {
    return {
      code: error.code || defaultCode,
      message: error.message || 'Unknown dashboard error.',
      details: error.details,
      path: error.path,
      hint: error.hint
    };
  }

  return {
    code: defaultCode,
    message: String(error)
  };
}

function safeJsonHash(value) {
  try {
    return JSON.stringify(value, (key, nestedValue) => {
      if (key === 'generatedAt') {
        return undefined;
      }
      return nestedValue;
    });
  } catch {
    return String(value);
  }
}

function resolveIconSet() {
  const mode = (process.env.SPECSMD_ICON_SET || 'auto').toLowerCase();

  const ascii = {
    runs: '[R]',
    overview: '[O]',
    health: '[H]',
    git: '[G]',
    runFile: '*',
    activeFile: '>',
    groupCollapsed: '>',
    groupExpanded: 'v'
  };

  const nerd = {
    runs: '󰑮',
    overview: '󰍉',
    health: '󰓦',
    git: '󰊢',
    runFile: '󰈔',
    activeFile: '󰜴',
    groupCollapsed: '󰐕',
    groupExpanded: '󰐗'
  };

  if (mode === 'ascii') {
    return ascii;
  }
  if (mode === 'nerd') {
    return nerd;
  }

  const locale = `${process.env.LC_ALL || ''}${process.env.LC_CTYPE || ''}${process.env.LANG || ''}`;
  const isUtf8 = /utf-?8/i.test(locale);
  const looksLikeVsCodeTerminal = (process.env.TERM_PROGRAM || '').toLowerCase().includes('vscode');

  return isUtf8 && looksLikeVsCodeTerminal ? nerd : ascii;
}

function truncate(value, width) {
  const text = String(value ?? '');
  if (!Number.isFinite(width)) {
    return text;
  }

  const safeWidth = Math.max(0, Math.floor(width));
  if (safeWidth === 0) {
    return '';
  }

  if (stringWidth(text) <= safeWidth) {
    return text;
  }

  if (safeWidth <= 3) {
    return sliceAnsi(text, 0, safeWidth);
  }

  const ellipsis = '...';
  const bodyWidth = Math.max(0, safeWidth - stringWidth(ellipsis));
  return `${sliceAnsi(text, 0, bodyWidth)}${ellipsis}`;
}

function resolveFrameWidth(columns) {
  const safeColumns = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 120;
  return safeColumns > 24 ? safeColumns - 1 : safeColumns;
}

function normalizePanelLine(line) {
  if (line && typeof line === 'object' && !Array.isArray(line)) {
    return {
      text: typeof line.text === 'string' ? line.text : String(line.text ?? ''),
      color: line.color,
      bold: Boolean(line.bold),
      selected: Boolean(line.selected),
      loading: Boolean(line.loading)
    };
  }

  return {
    text: String(line ?? ''),
    color: undefined,
    bold: false,
    selected: false,
    loading: false
  };
}

function fitLines(lines, maxLines, width) {
  const safeLines = (Array.isArray(lines) ? lines : []).map((line) => {
    const normalized = normalizePanelLine(line);
    return {
      ...normalized,
      text: truncate(normalized.text, width)
    };
  });

  if (safeLines.length <= maxLines) {
    return safeLines;
  }

  const selectedIndex = safeLines.findIndex((line) => line.selected);
  if (selectedIndex >= 0) {
    const windowSize = Math.max(1, maxLines);
    let start = selectedIndex - Math.floor(windowSize / 2);
    start = Math.max(0, start);
    start = Math.min(start, Math.max(0, safeLines.length - windowSize));
    return safeLines.slice(start, start + windowSize);
  }

  const visible = safeLines.slice(0, Math.max(1, maxLines - 1));
  visible.push({
    text: truncate(`... +${safeLines.length - visible.length} more`, width),
    color: 'gray',
    bold: false
  });
  return visible;
}

function formatTime(value) {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString();
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function readFileTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function normalizeToken(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function clampIndex(value, length) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (!Number.isFinite(length) || length <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(length - 1, Math.floor(value)));
}

module.exports = {
  stringWidth,
  sliceAnsi,
  toDashboardError,
  safeJsonHash,
  resolveIconSet,
  truncate,
  resolveFrameWidth,
  normalizePanelLine,
  fitLines,
  formatTime,
  fileExists,
  readFileTextSafe,
  normalizeToken,
  clampIndex
};
