const fs = require('fs');
const { truncate, clampIndex } = require('./helpers');
const { colorizeMarkdownLine, sanitizeRenderLine } = require('./overlays');
const {
  loadGitDiffPreview,
  loadGitCommitPreview
} = require('../git/changes');

const MAX_PREVIEW_CACHE_ENTRIES = 64;
const previewContentCache = new Map();

function getFilePreviewCacheKey(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    return null;
  }

  try {
    const stat = fs.statSync(filePath);
    return `file:${filePath}:${stat.size}:${Math.floor(stat.mtimeMs)}`;
  } catch {
    return `file:${filePath}:missing`;
  }
}

function getGitPreviewCacheKey(fileEntry, isGitCommitPreview) {
  if (!fileEntry || typeof fileEntry !== 'object') {
    return null;
  }

  const repoRoot = typeof fileEntry.repoRoot === 'string' ? fileEntry.repoRoot : '';
  if (isGitCommitPreview) {
    const commitHash = typeof fileEntry.commitHash === 'string' ? fileEntry.commitHash : '';
    return `git-commit:${repoRoot}:${commitHash}`;
  }

  const bucket = typeof fileEntry.bucket === 'string' ? fileEntry.bucket : '';
  const relativePath = typeof fileEntry.relativePath === 'string' ? fileEntry.relativePath : '';
  const pathValue = typeof fileEntry.path === 'string' ? fileEntry.path : '';
  return `git-diff:${repoRoot}:${bucket}:${relativePath}:${pathValue}`;
}

function getCachedPreviewContent(cacheKey) {
  if (!cacheKey || !previewContentCache.has(cacheKey)) {
    return null;
  }

  const cached = previewContentCache.get(cacheKey);
  previewContentCache.delete(cacheKey);
  previewContentCache.set(cacheKey, cached);
  return Array.isArray(cached) ? cached : null;
}

function setCachedPreviewContent(cacheKey, lines) {
  if (!cacheKey || !Array.isArray(lines)) {
    return;
  }

  if (previewContentCache.has(cacheKey)) {
    previewContentCache.delete(cacheKey);
  }
  previewContentCache.set(cacheKey, lines);

  while (previewContentCache.size > MAX_PREVIEW_CACHE_ENTRIES) {
    const oldest = previewContentCache.keys().next().value;
    if (!oldest) {
      break;
    }
    previewContentCache.delete(oldest);
  }
}

function clearPreviewContentCache() {
  previewContentCache.clear();
}

function buildPreviewLines(fileEntry, width, scrollOffset, options = {}) {
  const fullDocument = options?.fullDocument === true;

  if (!fileEntry || typeof fileEntry.path !== 'string') {
    return [{ text: truncate('No file selected', width), color: 'gray', bold: false }];
  }

  const isGitFilePreview = fileEntry.previewType === 'git-diff';
  const isGitCommitPreview = fileEntry.previewType === 'git-commit-diff';
  const isGitPreview = isGitFilePreview || isGitCommitPreview;
  const cacheKey = isGitPreview
    ? getGitPreviewCacheKey(fileEntry, isGitCommitPreview)
    : getFilePreviewCacheKey(fileEntry.path);
  let rawLines = getCachedPreviewContent(cacheKey);
  if (!rawLines) {
    if (isGitPreview) {
      const diffText = isGitCommitPreview
        ? loadGitCommitPreview(fileEntry)
        : loadGitDiffPreview(fileEntry);
      rawLines = String(diffText || '').split(/\r?\n/);
    } else {
      let content;
      try {
        content = fs.readFileSync(fileEntry.path, 'utf8');
      } catch (error) {
        return [{
          text: truncate(`Unable to read ${fileEntry.label || fileEntry.path}: ${error.message}`, width),
          color: 'red',
          bold: false
        }];
      }
      rawLines = String(content).split(/\r?\n/);
    }

    setCachedPreviewContent(cacheKey, rawLines);
  }

  const headLine = {
    text: truncate(
      isGitCommitPreview
        ? `commit: ${fileEntry.commitHash || fileEntry.path}`
        : `${isGitPreview ? 'diff' : 'file'}: ${fileEntry.path}`,
      width
    ),
    color: 'cyan',
    bold: true
  };

  const normalizedLines = rawLines.map((line) => sanitizeRenderLine(line));
  const cappedLines = fullDocument ? normalizedLines : normalizedLines.slice(0, 300);
  const hiddenLineCount = fullDocument ? 0 : Math.max(0, rawLines.length - cappedLines.length);
  let inCodeBlock = false;

  const highlighted = cappedLines.map((rawLine, index) => {
    const prefixedLine = `${String(index + 1).padStart(4, ' ')} | ${rawLine}`;
    let color;
    let bold;
    let togglesCodeBlock = false;

    if (isGitPreview) {
      if (rawLine.startsWith('+++ ') || rawLine.startsWith('--- ') || rawLine.startsWith('diff --git')) {
        color = 'cyan';
        bold = true;
      } else if (rawLine.startsWith('@@')) {
        color = 'magenta';
        bold = true;
      } else if (rawLine.startsWith('+')) {
        color = 'green';
        bold = false;
      } else if (rawLine.startsWith('-')) {
        color = 'red';
        bold = false;
      } else {
        color = undefined;
        bold = false;
      }
    } else {
      const markdownStyle = colorizeMarkdownLine(rawLine, inCodeBlock);
      color = markdownStyle.color;
      bold = markdownStyle.bold;
      togglesCodeBlock = markdownStyle.togglesCodeBlock;
    }

    if (togglesCodeBlock) {
      inCodeBlock = !inCodeBlock;
    }
    return {
      text: truncate(prefixedLine, width),
      color,
      bold
    };
  });

  if (hiddenLineCount > 0) {
    highlighted.push({
      text: truncate(`... ${hiddenLineCount} additional lines hidden`, width),
      color: 'gray',
      bold: false
    });
  }

  const clampedOffset = clampIndex(scrollOffset, highlighted.length);
  const body = highlighted.slice(clampedOffset);

  return [headLine, { text: '', color: undefined, bold: false }, ...body];
}

function allocateSingleColumnPanels(candidates, rowsBudget) {
  const filtered = (candidates || []).filter(Boolean);
  if (filtered.length === 0) {
    return [];
  }

  const selected = [];
  let remaining = Math.max(4, rowsBudget);

  for (const panel of filtered) {
    const margin = selected.length > 0 ? 1 : 0;
    const minimumRows = 4 + margin;

    if (remaining >= minimumRows || selected.length === 0) {
      selected.push({
        ...panel,
        maxLines: 1
      });
      remaining -= minimumRows;
    }
  }

  let index = 0;
  while (remaining > 0 && selected.length > 0) {
    const panelIndex = index % selected.length;
    selected[panelIndex].maxLines += 1;
    remaining -= 1;
    index += 1;
  }

  return selected;
}

module.exports = {
  buildPreviewLines,
  allocateSingleColumnPanels,
  clearPreviewContentCache
};
