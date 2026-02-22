const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function normalizePath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  try {
    return path.resolve(value.trim());
  } catch {
    return null;
  }
}

function parseBranchName(refLine) {
  if (typeof refLine !== 'string' || refLine.trim() === '') {
    return '';
  }
  const prefix = 'refs/heads/';
  if (refLine.startsWith(prefix)) {
    return refLine.slice(prefix.length);
  }
  return refLine.trim();
}

function buildWorktreeId(worktreePath) {
  return String(worktreePath || '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-');
}

function parseGitWorktreePorcelain(rawOutput, fallbackWorkspacePath = process.cwd()) {
  const text = String(rawOutput || '');
  const blocks = text
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const worktrees = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      continue;
    }

    const pathLine = lines.find((line) => line.startsWith('worktree '));
    if (!pathLine) {
      continue;
    }

    const worktreePath = normalizePath(pathLine.slice('worktree '.length));
    if (!worktreePath) {
      continue;
    }

    const branchRef = (lines.find((line) => line.startsWith('branch ')) || '').slice('branch '.length);
    const head = (lines.find((line) => line.startsWith('HEAD ')) || '').slice('HEAD '.length);
    const detached = lines.includes('detached');
    const prunable = lines.some((line) => line.startsWith('prunable'));
    const locked = lines.some((line) => line.startsWith('locked'));
    const branch = parseBranchName(branchRef);
    const name = path.basename(worktreePath);
    const displayBranch = detached ? `[detached:${head.slice(0, 7) || 'unknown'}]` : (branch || '[unknown]');

    worktrees.push({
      id: buildWorktreeId(worktreePath),
      path: worktreePath,
      name,
      branch,
      displayBranch,
      head: head || '',
      detached,
      prunable,
      locked,
      isMainBranch: branch === 'main' || branch === 'master',
      isCurrentPath: false
    });
  }

  if (worktrees.length === 0) {
    const fallbackPath = normalizePath(fallbackWorkspacePath) || normalizePath(process.cwd()) || process.cwd();
    return [{
      id: buildWorktreeId(fallbackPath),
      path: fallbackPath,
      name: path.basename(fallbackPath),
      branch: '',
      displayBranch: '[non-git]',
      head: '',
      detached: false,
      prunable: false,
      locked: false,
      isMainBranch: false,
      isCurrentPath: true
    }];
  }

  return worktrees;
}

function markCurrentWorktree(worktrees, workspacePath) {
  const currentPath = normalizePath(workspacePath);
  const safeWorktrees = Array.isArray(worktrees) ? worktrees : [];
  const marked = safeWorktrees.map((worktree) => ({
    ...worktree,
    isCurrentPath: currentPath != null && normalizePath(worktree.path) === currentPath
  }));

  if (marked.some((worktree) => worktree.isCurrentPath)) {
    return marked;
  }

  if (currentPath) {
    return marked.map((worktree, index) => ({
      ...worktree,
      isCurrentPath: index === 0
    }));
  }

  return marked;
}

function sortWorktrees(worktrees) {
  const safeWorktrees = Array.isArray(worktrees) ? [...worktrees] : [];
  return safeWorktrees.sort((a, b) => {
    if (a.isCurrentPath !== b.isCurrentPath) {
      return a.isCurrentPath ? -1 : 1;
    }
    if (a.isMainBranch !== b.isMainBranch) {
      return a.isMainBranch ? -1 : 1;
    }
    return String(a.displayBranch || a.name || '').localeCompare(String(b.displayBranch || b.name || ''));
  });
}

function isGitWorkspace(workspacePath) {
  const cwd = normalizePath(workspacePath) || process.cwd();
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd,
    encoding: 'utf8'
  });
  if (result.error || result.status !== 0) {
    return false;
  }
  return String(result.stdout || '').trim() === 'true';
}

function discoverGitWorktrees(workspacePath) {
  const cwd = normalizePath(workspacePath) || process.cwd();
  if (!isGitWorkspace(cwd)) {
    return {
      worktrees: markCurrentWorktree(parseGitWorktreePorcelain('', cwd), cwd),
      source: 'fallback',
      isGitRepo: false
    };
  }

  const result = spawnSync('git', ['worktree', 'list', '--porcelain'], {
    cwd,
    encoding: 'utf8'
  });

  if (result.error || result.status !== 0) {
    return {
      worktrees: markCurrentWorktree(parseGitWorktreePorcelain('', cwd), cwd),
      source: 'fallback',
      isGitRepo: true,
      error: result.error ? result.error.message : String(result.stderr || '').trim()
    };
  }

  const parsed = parseGitWorktreePorcelain(result.stdout, cwd);
  const marked = markCurrentWorktree(parsed, cwd);
  return {
    worktrees: sortWorktrees(marked),
    source: 'git',
    isGitRepo: true
  };
}

function pickWorktree(worktrees, selector, workspacePath) {
  const safeWorktrees = Array.isArray(worktrees) ? worktrees : [];
  if (safeWorktrees.length === 0) {
    return null;
  }

  const normalizedSelector = String(selector || '').trim();
  const selectorPath = normalizePath(normalizedSelector);
  const currentPath = normalizePath(workspacePath);

  if (normalizedSelector !== '') {
    const byId = safeWorktrees.find((item) => item.id === normalizedSelector);
    if (byId) {
      return byId;
    }

    if (selectorPath) {
      const byPath = safeWorktrees.find((item) => normalizePath(item.path) === selectorPath);
      if (byPath) {
        return byPath;
      }
    }

    const byBranch = safeWorktrees.find((item) => item.branch === normalizedSelector || item.displayBranch === normalizedSelector);
    if (byBranch) {
      return byBranch;
    }

    const byName = safeWorktrees.find((item) => item.name === normalizedSelector);
    if (byName) {
      return byName;
    }
  }

  if (currentPath) {
    const byCurrentPath = safeWorktrees.find((item) => normalizePath(item.path) === currentPath);
    if (byCurrentPath) {
      return byCurrentPath;
    }
  }

  const markedCurrent = safeWorktrees.find((item) => item.isCurrentPath);
  if (markedCurrent) {
    return markedCurrent;
  }

  return safeWorktrees[0];
}

function pathExistsAsDirectory(targetPath) {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

module.exports = {
  normalizePath,
  parseBranchName,
  parseGitWorktreePorcelain,
  markCurrentWorktree,
  sortWorktrees,
  isGitWorkspace,
  discoverGitWorktrees,
  pickWorktree,
  pathExistsAsDirectory
};
