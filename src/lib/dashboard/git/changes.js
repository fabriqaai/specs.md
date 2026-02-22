const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function runGit(args, cwd, options = {}) {
  const acceptedStatuses = Array.isArray(options.acceptedStatuses) && options.acceptedStatuses.length > 0
    ? options.acceptedStatuses
    : [0];
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    return {
      ok: false,
      error: result.error.message || String(result.error),
      stdout: '',
      stderr: ''
    };
  }

  if (typeof result.status === 'number' && !acceptedStatuses.includes(result.status)) {
    return {
      ok: false,
      error: String(result.stderr || '').trim() || `git exited with code ${result.status}`,
      stdout: String(result.stdout || ''),
      stderr: String(result.stderr || '')
    };
  }

  return {
    ok: true,
    error: null,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || '')
  };
}

function findGitRoot(worktreePath) {
  if (typeof worktreePath !== 'string' || worktreePath.trim() === '') {
    return null;
  }

  const probe = runGit(['rev-parse', '--show-toplevel'], worktreePath);
  if (!probe.ok) {
    return null;
  }

  const root = probe.stdout.trim();
  return root === '' ? null : root;
}

function parseBranchSummary(line) {
  const raw = String(line || '').replace(/^##\s*/, '').trim();
  if (raw === '') {
    return {
      branch: '(unknown)',
      upstream: null,
      ahead: 0,
      behind: 0,
      detached: false
    };
  }

  if (raw.startsWith('HEAD ')) {
    return {
      branch: '(detached)',
      upstream: null,
      ahead: 0,
      behind: 0,
      detached: true
    };
  }

  const [branchPart, trackingPartRaw] = raw.split(/\s+/, 2);
  let branch = branchPart;
  let upstream = null;
  if (branch.includes('...')) {
    const [name, remote] = branch.split('...', 2);
    branch = name || '(unknown)';
    upstream = remote || null;
  }

  const trackingPart = typeof trackingPartRaw === 'string' ? trackingPartRaw : '';
  const aheadMatch = trackingPart.match(/ahead\s+(\d+)/);
  const behindMatch = trackingPart.match(/behind\s+(\d+)/);
  const ahead = aheadMatch ? Number.parseInt(aheadMatch[1], 10) : 0;
  const behind = behindMatch ? Number.parseInt(behindMatch[1], 10) : 0;

  return {
    branch: branch || '(unknown)',
    upstream,
    ahead: Number.isFinite(ahead) ? ahead : 0,
    behind: Number.isFinite(behind) ? behind : 0,
    detached: false
  };
}

function parseStatusEntry(line, repoRoot) {
  const raw = String(line || '');
  if (raw.trim() === '' || raw.startsWith('## ')) {
    return null;
  }

  const code = raw.slice(0, 2);
  const statusX = code.charAt(0);
  const statusY = code.charAt(1);
  const remainder = raw.length > 3 ? raw.slice(3) : '';

  let relativePath = remainder.trim();
  if (relativePath.includes(' -> ')) {
    const parts = relativePath.split(' -> ');
    relativePath = parts[parts.length - 1].trim();
  }

  const absolutePath = relativePath === ''
    ? ''
    : path.join(repoRoot, relativePath);
  const isUntracked = code === '??';
  const isConflicted = statusX === 'U'
    || statusY === 'U'
    || code === 'AA'
    || code === 'DD';
  const isStaged = !isUntracked && statusX !== ' ';
  const isUnstaged = !isUntracked && statusY !== ' ';

  return {
    code,
    statusX,
    statusY,
    relativePath,
    absolutePath,
    staged: isStaged,
    unstaged: isUnstaged,
    untracked: isUntracked,
    conflicted: isConflicted
  };
}

function buildBucketItem(entry, bucket) {
  return {
    key: `${bucket}:${entry.relativePath}`,
    bucket,
    code: entry.code,
    path: entry.absolutePath,
    relativePath: entry.relativePath,
    label: entry.relativePath
  };
}

function listGitChanges(worktreePath) {
  const gitRoot = findGitRoot(worktreePath);
  if (!gitRoot) {
    return {
      available: false,
      rootPath: null,
      branch: '(not a git repo)',
      upstream: null,
      ahead: 0,
      behind: 0,
      detached: false,
      clean: true,
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
      generatedAt: new Date().toISOString()
    };
  }

  const statusResult = runGit(
    ['-c', 'color.ui=false', '-c', 'core.quotepath=false', 'status', '--porcelain', '--branch', '--untracked-files=all'],
    gitRoot
  );

  if (!statusResult.ok) {
    return {
      available: false,
      rootPath: gitRoot,
      branch: '(status unavailable)',
      upstream: null,
      ahead: 0,
      behind: 0,
      detached: false,
      clean: true,
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
      error: statusResult.error,
      generatedAt: new Date().toISOString()
    };
  }

  const lines = statusResult.stdout.split(/\r?\n/).filter(Boolean);
  const branchInfo = parseBranchSummary(lines[0] || '');

  const staged = [];
  const unstaged = [];
  const untracked = [];
  const conflicted = [];

  for (const line of lines.slice(1)) {
    const entry = parseStatusEntry(line, gitRoot);
    if (!entry || entry.relativePath === '') {
      continue;
    }
    if (entry.conflicted) {
      conflicted.push(buildBucketItem(entry, 'conflicted'));
    }
    if (entry.staged) {
      staged.push(buildBucketItem(entry, 'staged'));
    }
    if (entry.unstaged) {
      unstaged.push(buildBucketItem(entry, 'unstaged'));
    }
    if (entry.untracked) {
      untracked.push(buildBucketItem(entry, 'untracked'));
    }
  }

  const uniqueCount = new Set([
    ...staged.map((item) => item.relativePath),
    ...unstaged.map((item) => item.relativePath),
    ...untracked.map((item) => item.relativePath),
    ...conflicted.map((item) => item.relativePath)
  ]).size;

  return {
    available: true,
    rootPath: gitRoot,
    branch: branchInfo.branch,
    upstream: branchInfo.upstream,
    ahead: branchInfo.ahead,
    behind: branchInfo.behind,
    detached: branchInfo.detached,
    clean: uniqueCount === 0,
    counts: {
      total: uniqueCount,
      staged: staged.length,
      unstaged: unstaged.length,
      untracked: untracked.length,
      conflicted: conflicted.length
    },
    staged,
    unstaged,
    untracked,
    conflicted,
    generatedAt: new Date().toISOString()
  };
}

function readUntrackedFileDiff(repoRoot, absolutePath) {
  const exists = typeof absolutePath === 'string' && absolutePath !== '' && fs.existsSync(absolutePath);
  if (!exists) {
    return '';
  }

  const result = runGit(
    ['-c', 'color.ui=false', '--no-pager', 'diff', '--no-index', '--', '/dev/null', absolutePath],
    repoRoot,
    { acceptedStatuses: [0, 1] }
  );
  if (!result.ok) {
    return '';
  }
  return result.stdout;
}

function loadGitDiffPreview(changeEntry) {
  const bucket = typeof changeEntry?.bucket === 'string' ? changeEntry.bucket : 'unstaged';
  const repoRoot = typeof changeEntry?.repoRoot === 'string'
    ? changeEntry.repoRoot
    : (typeof changeEntry?.workspacePath === 'string' ? findGitRoot(changeEntry.workspacePath) : null);
  const relativePath = typeof changeEntry?.relativePath === 'string' ? changeEntry.relativePath : '';
  const absolutePath = typeof changeEntry?.path === 'string' ? changeEntry.path : '';

  if (!repoRoot) {
    return '[git] repository is unavailable for preview.';
  }
  if (relativePath === '') {
    return '[git] no file selected.';
  }

  if (bucket === 'untracked') {
    const rawDiff = readUntrackedFileDiff(repoRoot, absolutePath);
    if (rawDiff.trim() !== '') {
      return rawDiff;
    }
  }

  const args = ['-c', 'color.ui=false', '--no-pager', 'diff'];
  if (bucket === 'staged') {
    args.push('--cached');
  }
  args.push('--', relativePath);

  const result = runGit(args, repoRoot);
  if (!result.ok) {
    return `[git] unable to load diff: ${result.error}`;
  }

  const output = result.stdout.trim();
  if (output === '') {
    return '[git] no diff output for this file.';
  }

  return result.stdout;
}

function loadGitCommitPreview(changeEntry) {
  const repoRoot = typeof changeEntry?.repoRoot === 'string'
    ? changeEntry.repoRoot
    : (typeof changeEntry?.workspacePath === 'string' ? findGitRoot(changeEntry.workspacePath) : null);
  const commitHash = typeof changeEntry?.commitHash === 'string'
    ? changeEntry.commitHash.trim()
    : '';

  if (!repoRoot) {
    return '[git] repository is unavailable for commit preview.';
  }
  if (commitHash === '') {
    return '[git] no commit selected.';
  }

  const result = runGit(
    ['-c', 'color.ui=false', '--no-pager', 'show', '--patch', '--stat', '--no-ext-diff', commitHash],
    repoRoot
  );
  if (!result.ok) {
    return `[git] unable to load commit diff: ${result.error}`;
  }

  const output = result.stdout.trim();
  if (output === '') {
    return '[git] no commit output for this selection.';
  }

  return result.stdout;
}

module.exports = {
  listGitChanges,
  loadGitDiffPreview,
  loadGitCommitPreview
};
