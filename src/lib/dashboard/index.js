const path = require('path');
const { detectFlow } = require('./flow-detect');
const { parseFireDashboard } = require('./fire/parser');
const { formatDashboardText } = require('./tui/renderer');
const { createDashboardApp } = require('./tui/app');

function parseRefreshMs(raw) {
  const parsed = Number.parseInt(String(raw || '1000'), 10);
  if (Number.isNaN(parsed)) {
    return 1000;
  }

  return Math.max(200, Math.min(parsed, 5000));
}

function getUnsupportedFlowMessage(flow) {
  if (flow === 'aidlc') {
    return 'AI-DLC dashboard is coming soon. FIRE dashboard is available now.';
  }

  if (flow === 'simple') {
    return 'Simple flow dashboard is coming soon. FIRE dashboard is available now.';
  }

  return `Flow \"${flow}\" dashboard is not available yet.`;
}

async function runFireDashboard(options) {
  const workspacePath = path.resolve(options.path || process.cwd());
  const rootPath = path.join(workspacePath, '.specs-fire');
  const watchEnabled = options.watch !== false;
  const refreshMs = parseRefreshMs(options.refreshMs);

  const parseSnapshot = async () => parseFireDashboard(workspacePath);

  const initialResult = await parseSnapshot();

  if (!watchEnabled) {
    if (!initialResult.ok) {
      const output = formatDashboardText({
        snapshot: null,
        error: initialResult.error,
        flow: 'fire',
        workspacePath,
        view: 'runs',
        runFilter: 'all',
        watchEnabled: false,
        watchStatus: 'off',
        showHelp: true,
        lastRefreshAt: new Date().toISOString(),
        width: process.stdout.columns || 120
      });
      console.log(output);
      process.exitCode = 1;
      return;
    }

    const output = formatDashboardText({
      snapshot: initialResult.snapshot,
      error: null,
      flow: 'fire',
      workspacePath,
      view: 'runs',
      runFilter: 'all',
      watchEnabled: false,
      watchStatus: 'off',
      showHelp: true,
      lastRefreshAt: new Date().toISOString(),
      width: process.stdout.columns || 120
    });
    console.log(output);
    return;
  }

  const ink = await import('ink');
  const reactNamespace = await import('react');
  const React = reactNamespace.default || reactNamespace;

  const App = createDashboardApp({
    React,
    ink,
    parseSnapshot,
    workspacePath,
    rootPath,
    flow: 'fire',
    refreshMs,
    watchEnabled,
    initialSnapshot: initialResult.ok ? initialResult.snapshot : null,
    initialError: initialResult.ok ? null : initialResult.error
  });

  const { waitUntilExit } = ink.render(React.createElement(App), {
    exitOnCtrlC: true
  });

  await waitUntilExit();
}

async function run(options = {}) {
  const workspacePath = path.resolve(options.path || process.cwd());

  let detection;
  try {
    detection = detectFlow(workspacePath, options.flow);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (!detection.flow) {
    console.error('No supported flow detected. Expected one of: .specs-fire, memory-bank, specs');
    process.exitCode = 1;
    return;
  }

  if (detection.warning) {
    console.warn(`Warning: ${detection.warning}`);
  }

  if (detection.flow !== 'fire') {
    console.log(getUnsupportedFlowMessage(detection.flow));
    return;
  }

  await runFireDashboard(options);
}

module.exports = {
  run,
  runFireDashboard,
  parseRefreshMs,
  getUnsupportedFlowMessage
};
