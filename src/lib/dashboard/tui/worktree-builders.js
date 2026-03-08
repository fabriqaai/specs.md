const path = require('path');
const { clampIndex } = require('./helpers');
const { truncate } = require('./helpers');
const { getEffectiveFlow, getCurrentBolt } = require('./flow-builders');
const { collectAidlcBoltFiles } = require('./file-entries');
const { collectFireRunFiles } = require('./file-entries');

function getDashboardWorktreeMeta(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const meta = snapshot.dashboardWorktrees;
  if (!meta || typeof meta !== 'object') {
    return null;
  }
  const items = Array.isArray(meta.items) ? meta.items : [];
  if (items.length === 0) {
    return null;
  }
  return {
    ...meta,
    items
  };
}

function getWorktreeItems(snapshot) {
  return getDashboardWorktreeMeta(snapshot)?.items || [];
}

function getSelectedWorktree(snapshot) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return null;
  }
  return meta.items.find((item) => item.id === meta.selectedWorktreeId) || null;
}

function hasMultipleWorktrees(snapshot) {
  return getWorktreeItems(snapshot).length > 1;
}

function isSelectedWorktreeMain(snapshot) {
  const selected = getSelectedWorktree(snapshot);
  return Boolean(selected?.isMainBranch);
}

function getWorktreeDisplayName(worktree) {
  if (!worktree || typeof worktree !== 'object') {
    return 'unknown';
  }
  if (typeof worktree.displayBranch === 'string' && worktree.displayBranch.trim() !== '') {
    return worktree.displayBranch;
  }
  if (typeof worktree.branch === 'string' && worktree.branch.trim() !== '') {
    return worktree.branch;
  }
  if (typeof worktree.name === 'string' && worktree.name.trim() !== '') {
    return worktree.name;
  }
  return path.basename(worktree.path || '') || 'unknown';
}

function buildWorktreeRows(snapshot, flow) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [{
      kind: 'info',
      key: 'worktrees:none',
      label: 'No git worktrees detected',
      selectable: false
    }];
  }

  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const entityLabel = effectiveFlow === 'aidlc'
    ? 'active bolts'
    : (effectiveFlow === 'simple' ? 'active specs' : 'active runs');

  const rows = [];
  for (const item of meta.items) {
    const currentLabel = item.isSelected ? '[CURRENT] ' : '';
    const mainLabel = item.isMainBranch && !item.detached ? '[MAIN] ' : '';
    const availabilityLabel = item.flowAvailable ? '' : ' (flow unavailable)';
    const statusLabel = item.status === 'loading'
      ? ' loading...'
      : (item.status === 'error' ? ' error' : ` ${item.activeCount || 0} ${entityLabel}`);
    const scopeLabel = item.name ? ` (${item.name})` : '';

    rows.push({
      kind: 'info',
      key: `worktree:item:${item.id}`,
      label: `${currentLabel}${mainLabel}${getWorktreeDisplayName(item)}${scopeLabel}${availabilityLabel}${statusLabel}`,
      color: item.isSelected ? 'green' : (item.flowAvailable ? 'gray' : 'red'),
      bold: item.isSelected,
      selectable: true
    });
  }

  return rows;
}

function buildOtherWorktreeActiveGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'simple') {
    return [];
  }

  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [];
  }

  const selectedWorktree = getSelectedWorktree(snapshot);
  if (!selectedWorktree || !selectedWorktree.isMainBranch) {
    return [];
  }

  const groups = [];
  const otherItems = meta.items.filter((item) => item.id !== meta.selectedWorktreeId);
  for (const item of otherItems) {
    if (!item.flowAvailable || item.status === 'unavailable' || item.status === 'error') {
      continue;
    }

    if (effectiveFlow === 'aidlc') {
      const activeBolts = Array.isArray(item.activity?.activeBolts) ? item.activity.activeBolts : [];
      for (const bolt of activeBolts) {
        const stages = Array.isArray(bolt?.stages) ? bolt.stages : [];
        const completedStages = stages.filter((stage) => stage?.status === 'completed').length;
        groups.push({
          key: `other:wt:${item.id}:bolt:${bolt.id}`,
          label: `[WT ${getWorktreeDisplayName(item)}] ${bolt.id} [${bolt.type || 'bolt'}] ${completedStages}/${stages.length || 0} stages`,
          files: collectAidlcBoltFiles(bolt).map((file) => ({ ...file, scope: 'active' }))
        });
      }
      continue;
    }

    const activeRuns = Array.isArray(item.activity?.activeRuns) ? item.activity.activeRuns : [];
    for (const run of activeRuns) {
      const workItems = Array.isArray(run?.workItems) ? run.workItems : [];
      const completed = workItems.filter((workItem) => workItem?.status === 'completed').length;
      groups.push({
        key: `other:wt:${item.id}:run:${run.id}`,
        label: `[WT ${getWorktreeDisplayName(item)}] ${run.id} [${run.scope || 'single'}] ${completed}/${workItems.length} items`,
        files: collectFireRunFiles(run).map((file) => ({ ...file, scope: 'active' }))
      });
    }
  }

  return groups;
}

function getOtherWorktreeEmptyMessage(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (!hasMultipleWorktrees(snapshot)) {
    return 'No additional worktrees';
  }
  if (!isSelectedWorktreeMain(snapshot)) {
    return 'Switch to main worktree to view active items from other worktrees';
  }
  if (effectiveFlow === 'aidlc') {
    return 'No active bolts in other worktrees';
  }
  if (effectiveFlow === 'simple') {
    return 'No active specs in other worktrees';
  }
  return 'No active runs in other worktrees';
}

function buildWorktreeOverlayLines(snapshot, selectedIndex, width) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [{
      text: truncate('No worktrees available', width),
      color: 'gray',
      bold: false
    }];
  }

  const items = Array.isArray(meta.items) ? meta.items : [];
  const clampedIndex = clampIndex(selectedIndex, items.length || 1);
  const lines = [{
    text: truncate('Use ↑/↓ and Enter to switch. Esc closes.', width),
    color: 'gray',
    bold: false
  }];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const marker = index === clampedIndex ? '>' : ' ';
    const current = item.isSelected ? '[CURRENT] ' : '';
    const main = item.isMainBranch && !item.detached ? '[MAIN] ' : '';
    const status = item.status === 'loading'
      ? 'loading'
      : (item.status === 'error'
        ? 'error'
        : (item.flowAvailable ? `${item.activeCount || 0} active` : 'flow unavailable'));
    const pathLabel = item.path ? path.basename(item.path) : 'unknown';
    lines.push({
      text: truncate(`${marker} ${current}${main}${getWorktreeDisplayName(item)} (${pathLabel}) | ${status}`, width),
      color: index === clampedIndex ? 'green' : (item.isSelected ? 'cyan' : 'gray'),
      bold: index === clampedIndex || item.isSelected
    });
  }

  if (meta.hasPendingScans) {
    lines.push({
      text: truncate('Background scan in progress for additional worktrees...', width),
      color: 'yellow',
      bold: false
    });
  }

  return lines;
}

module.exports = {
  getDashboardWorktreeMeta,
  getWorktreeItems,
  getSelectedWorktree,
  hasMultipleWorktrees,
  isSelectedWorktreeMain,
  getWorktreeDisplayName,
  buildWorktreeRows,
  buildOtherWorktreeActiveGroups,
  getOtherWorktreeEmptyMessage,
  buildWorktreeOverlayLines
};
