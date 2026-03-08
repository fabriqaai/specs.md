const { renderHeaderLines, truncate } = require('./components/header');
const { renderStatsLines } = require('./components/stats-strip');
const { renderErrorLines } = require('./components/error-banner');
const { renderHelpLines } = require('./components/help-footer');
const { renderRunsViewLines } = require('./views/runs-view');
const { renderOverviewViewLines } = require('./views/overview-view');

function normalizeWidth(width) {
  if (!Number.isFinite(width)) {
    return 120;
  }

  return Math.max(40, Math.min(Math.floor(width), 180));
}

function buildDashboardLines(params) {
  const {
    snapshot,
    error,
    flow,
    workspacePath,
    view,
    watchEnabled,
    watchStatus,
    showHelp,
    lastRefreshAt,
    width
  } = params;

  const safeWidth = normalizeWidth(width);
  const lines = [];

  lines.push(...renderHeaderLines({
    snapshot,
    flow,
    workspacePath,
    view,
    watchEnabled,
    watchStatus,
    lastRefreshAt,
    width: safeWidth
  }));

  if (snapshot) {
    lines.push(...renderStatsLines(snapshot, safeWidth));
    lines.push('');
  }

  if (error) {
    lines.push(...renderErrorLines(error, safeWidth, watchEnabled));
    lines.push('');
  }

  if (!snapshot) {
    lines.push(truncate('No snapshot available yet. Waiting for refresh...', safeWidth));
  } else if (view === 'overview') {
    lines.push(...renderOverviewViewLines(snapshot, safeWidth));
  } else {
    lines.push(...renderRunsViewLines(snapshot, safeWidth));
  }

  lines.push('');
  lines.push(...renderHelpLines(showHelp, safeWidth));

  return lines;
}

function formatDashboardText(params) {
  return buildDashboardLines(params).join('\n');
}

module.exports = {
  buildDashboardLines,
  formatDashboardText,
  normalizeWidth
};
