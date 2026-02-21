const { truncate } = require('./header');

function safePercent(part, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function renderStatsLines(snapshot, width) {
  if (!snapshot?.initialized) {
    return [truncate('stats: waiting for .specs-fire/state.yaml initialization', width)];
  }

  const stats = snapshot.stats;
  const workItemProgress = `${stats.completedWorkItems}/${stats.totalWorkItems}`;
  const workItemPct = safePercent(stats.completedWorkItems, stats.totalWorkItems);

  const intentProgress = `${stats.completedIntents}/${stats.totalIntents}`;
  const intentPct = safePercent(stats.completedIntents, stats.totalIntents);

  const line = [
    `Intents ${intentProgress} (${intentPct}%)`,
    `Work items ${workItemProgress} (${workItemPct}%)`,
    `Runs ${stats.activeRunsCount} active / ${stats.completedRuns} completed`,
    `Blocked ${stats.blockedWorkItems}`
  ].join(' | ');

  return [truncate(line, width)];
}

module.exports = {
  renderStatsLines
};
