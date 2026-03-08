function truncate(value, width) {
  const text = String(value);
  if (!Number.isFinite(width) || width <= 0 || text.length <= width) {
    return text;
  }

  if (width <= 3) {
    return text.slice(0, width);
  }

  return `${text.slice(0, width - 3)}...`;
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

function renderHeaderLines(params) {
  const {
    snapshot,
    flow,
    workspacePath,
    view,
    watchEnabled,
    watchStatus,
    lastRefreshAt,
    width
  } = params;

  const projectName = snapshot?.project?.name || 'Unnamed FIRE project';
  const topLine = `specsmd dashboard | ${flow.toUpperCase()} | ${projectName}`;
  const subLine = [
    `path: ${workspacePath}`,
    `updated: ${formatTime(lastRefreshAt)}`,
    `watch: ${watchEnabled ? watchStatus : 'off'}`,
    `view: ${view}`
  ].join(' | ');

  const horizontal = '-'.repeat(Math.max(20, Math.min(width || 120, 120)));

  return [
    truncate(topLine, width),
    truncate(subLine, width),
    truncate(horizontal, width)
  ];
}

module.exports = {
  renderHeaderLines,
  truncate
};
