const path = require('path');
const { spawnSync } = require('child_process');
const { fileExists } = require('./helpers');

function getGitChangesSnapshot(snapshot) {
  const gitChanges = snapshot?.gitChanges;
  if (!gitChanges || typeof gitChanges !== 'object') {
    return {
      available: false,
      branch: '(unavailable)',
      upstream: null,
      ahead: 0,
      behind: 0,
      counts: {
        total: 0,
        staged: 0,
        unstaged: 0,
        untracked: 0,
        conflicted: 0
      },
      staged: [],
      unstaged: [],
      untracked: [],
      conflicted: [],
      clean: true
    };
  }
  return {
    ...gitChanges,
    counts: gitChanges.counts || {
      total: 0,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      conflicted: 0
    },
    staged: Array.isArray(gitChanges.staged) ? gitChanges.staged : [],
    unstaged: Array.isArray(gitChanges.unstaged) ? gitChanges.unstaged : [],
    untracked: Array.isArray(gitChanges.untracked) ? gitChanges.untracked : [],
    conflicted: Array.isArray(gitChanges.conflicted) ? gitChanges.conflicted : []
  };
}

function readGitCommandLines(repoRoot, args, options = {}) {
  if (typeof repoRoot !== 'string' || repoRoot.trim() === '' || !Array.isArray(args) || args.length === 0) {
    return [];
  }

  const acceptedStatuses = Array.isArray(options.acceptedStatuses) && options.acceptedStatuses.length > 0
    ? options.acceptedStatuses
    : [0];

  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024
  });

  if (result.error) {
    return [];
  }

  if (typeof result.status === 'number' && !acceptedStatuses.includes(result.status)) {
    return [];
  }

  const lines = String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.floor(options.limit)) : null;
  if (limit == null || lines.length <= limit) {
    return lines;
  }
  return lines.slice(0, limit);
}

function buildGitStatusPanelLines(snapshot) {
  const git = getGitChangesSnapshot(snapshot);
  if (!git.available) {
    return [{
      text: 'Repository unavailable in selected worktree',
      color: 'red',
      bold: true
    }];
  }

  const tracking = git.upstream
    ? `${git.upstream} (${git.ahead > 0 ? `ahead ${git.ahead}` : 'ahead 0'}, ${git.behind > 0 ? `behind ${git.behind}` : 'behind 0'})`
    : 'no upstream';

  return [
    {
      text: `branch: ${git.branch}${git.detached ? ' [detached]' : ''}`,
      color: 'green',
      bold: true
    },
    {
      text: `tracking: ${tracking}`,
      color: 'gray',
      bold: false
    },
    {
      text: `changes: ${git.counts.total || 0} total`,
      color: 'gray',
      bold: false
    },
    {
      text: `staged ${git.counts.staged || 0} | unstaged ${git.counts.unstaged || 0}`,
      color: 'yellow',
      bold: false
    },
    {
      text: `untracked ${git.counts.untracked || 0} | conflicts ${git.counts.conflicted || 0}`,
      color: 'yellow',
      bold: false
    }
  ];
}

function buildGitCommitRows(snapshot) {
  const git = getGitChangesSnapshot(snapshot);
  if (!git.available) {
    return [{
      kind: 'info',
      key: 'git:commits:unavailable',
      label: 'No commit history (git unavailable)',
      selectable: false
    }];
  }

  const commitLines = readGitCommandLines(git.rootPath, [
    '-c',
    'color.ui=false',
    'log',
    '--date=relative',
    '--pretty=format:%h %s',
    '--max-count=30'
  ], { limit: 30 });

  if (commitLines.length === 0) {
    return [{
      kind: 'info',
      key: 'git:commits:empty',
      label: 'No commits found',
      selectable: false
    }];
  }

  return commitLines.map((line, index) => {
    const firstSpace = line.indexOf(' ');
    const commitHash = firstSpace > 0 ? line.slice(0, firstSpace) : '';
    const message = firstSpace > 0 ? line.slice(firstSpace + 1) : line;
    const label = commitHash ? `${commitHash} ${message}` : message;

    return {
      kind: 'git-commit',
      key: `git:commit:${commitHash || index}:${index}`,
      label,
      commitHash,
      repoRoot: git.rootPath,
      previewType: 'git-commit-diff',
      selectable: true
    };
  });
}

function buildGitChangeGroups(snapshot) {
  const git = getGitChangesSnapshot(snapshot);

  if (!git.available) {
    return [];
  }

  const makeFiles = (items, scope) => items.map((item) => ({
    label: item.relativePath,
    path: item.path || path.join(git.rootPath || snapshot?.workspacePath || '', item.relativePath || ''),
    scope,
    allowMissing: true,
    previewType: 'git-diff',
    repoRoot: git.rootPath || snapshot?.workspacePath || '',
    relativePath: item.relativePath || '',
    bucket: item.bucket || scope
  }));

  const groups = [];
  groups.push({
    key: 'git:staged',
    label: `staged (${git.counts.staged || 0})`,
    files: makeFiles(git.staged, 'staged')
  });
  groups.push({
    key: 'git:unstaged',
    label: `unstaged (${git.counts.unstaged || 0})`,
    files: makeFiles(git.unstaged, 'unstaged')
  });
  groups.push({
    key: 'git:untracked',
    label: `untracked (${git.counts.untracked || 0})`,
    files: makeFiles(git.untracked, 'untracked')
  });
  groups.push({
    key: 'git:conflicted',
    label: `conflicts (${git.counts.conflicted || 0})`,
    files: makeFiles(git.conflicted, 'conflicted')
  });

  return groups;
}

module.exports = {
  getGitChangesSnapshot,
  readGitCommandLines,
  buildGitStatusPanelLines,
  buildGitCommitRows,
  buildGitChangeGroups
};
