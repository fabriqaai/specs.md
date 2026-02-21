const { truncate } = require('../components/header');

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatRunProgress(run) {
  const workItems = safeArray(run.workItems);
  const total = workItems.length;
  const completed = workItems.filter((item) => item.status === 'completed').length;
  const inProgress = workItems.filter((item) => item.status === 'in_progress').length;
  return `${completed}/${total} completed${inProgress > 0 ? `, ${inProgress} in_progress` : ''}`;
}

function renderActiveRunLines(activeRuns, width) {
  const lines = ['Active Runs'];
  if (!activeRuns || activeRuns.length === 0) {
    lines.push('  - none');
    return lines.map((line) => truncate(line, width));
  }

  for (const run of activeRuns) {
    const currentItem = run.currentItem || 'n/a';
    const artifacts = [
      run.hasPlan ? 'plan' : null,
      run.hasWalkthrough ? 'walkthrough' : null,
      run.hasTestReport ? 'test-report' : null
    ].filter(Boolean).join(', ') || 'no artifacts yet';

    lines.push(`  - ${run.id} [${run.scope}] current: ${currentItem}`);
    lines.push(`    progress: ${formatRunProgress(run)} | artifacts: ${artifacts}`);
  }

  return lines.map((line) => truncate(line, width));
}

function renderPendingQueueLines(pendingItems, width) {
  const lines = ['Pending Queue'];
  if (!pendingItems || pendingItems.length === 0) {
    lines.push('  - none');
    return lines.map((line) => truncate(line, width));
  }

  for (const item of pendingItems.slice(0, 12)) {
    const deps = item.dependencies && item.dependencies.length > 0
      ? ` deps:${item.dependencies.join(',')}`
      : '';
    lines.push(`  - ${item.id} (${item.mode}/${item.complexity}) in ${item.intentTitle}${deps}`);
  }

  if (pendingItems.length > 12) {
    lines.push(`  ... ${pendingItems.length - 12} more pending items`);
  }

  return lines.map((line) => truncate(line, width));
}

function renderCompletedRunLines(completedRuns, width) {
  const lines = ['Recent Completed Runs'];
  if (!completedRuns || completedRuns.length === 0) {
    lines.push('  - none');
    return lines.map((line) => truncate(line, width));
  }

  for (const run of completedRuns.slice(0, 5)) {
    const completedAt = run.completedAt || 'unknown';
    lines.push(`  - ${run.id} [${run.scope}] completed: ${completedAt} | ${formatRunProgress(run)}`);
  }

  return lines.map((line) => truncate(line, width));
}

function renderRunsViewLines(snapshot, width) {
  const lines = [];

  if (!snapshot?.initialized) {
    lines.push('FIRE detected, but state.yaml is not initialized yet.');
    lines.push('Initialize FIRE project context, then the dashboard will auto-populate.');
    return lines.map((line) => truncate(line, width));
  }

  lines.push(...renderActiveRunLines(snapshot.activeRuns, width));
  lines.push('');
  lines.push(...renderPendingQueueLines(snapshot.pendingItems, width));
  lines.push('');
  lines.push(...renderCompletedRunLines(snapshot.completedRuns, width));

  return lines.map((line) => truncate(line, width));
}

module.exports = {
  renderRunsViewLines
};
