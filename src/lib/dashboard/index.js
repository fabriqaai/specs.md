const path = require('path');
const { detectFlow } = require('./flow-detect');
const { parseFireDashboard } = require('./fire/parser');
const { parseAidlcDashboard } = require('./aidlc/parser');
const { parseSimpleDashboard } = require('./simple/parser');
const { formatDashboardText } = require('./tui/renderer');
const { createDashboardApp } = require('./tui/app');

function parseRefreshMs(raw) {
  const parsed = Number.parseInt(String(raw || '1000'), 10);
  if (Number.isNaN(parsed)) {
    return 1000;
  }

  return Math.max(200, Math.min(parsed, 5000));
}

function clearTerminalOutput(stream = process.stdout) {
  if (!stream || !stream.isTTY || typeof stream.write !== 'function') {
    return;
  }

  stream.write('\u001B[2J\u001B[3J\u001B[H');
}

const FLOW_CONFIG = {
  fire: {
    markerDir: '.specs-fire',
    parse: parseFireDashboard
  },
  aidlc: {
    markerDir: 'memory-bank',
    parse: parseAidlcDashboard
  },
  simple: {
    markerDir: 'specs',
    parse: parseSimpleDashboard
  }
};

function formatStaticFlowText(flow, snapshot, error) {
  if (flow === 'fire') {
    return formatDashboardText({
      snapshot,
      error,
      flow,
      workspacePath: snapshot?.workspacePath || process.cwd(),
      view: 'runs',
      runFilter: 'all',
      watchEnabled: false,
      watchStatus: 'off',
      showHelp: true,
      lastRefreshAt: new Date().toISOString(),
      width: process.stdout.columns || 120
    });
  }

  if (error) {
    return `[${error.code || 'ERROR'}] ${error.message || 'Dashboard error'}`;
  }

  if (flow === 'aidlc') {
    const stats = snapshot?.stats || {};
    const active = snapshot?.activeBolts?.[0] || null;
    const lines = [
      `specsmd dashboard | AIDLC | ${snapshot?.project?.name || 'unknown project'}`,
      `intents ${stats.completedIntents || 0}/${stats.totalIntents || 0} | stories ${stats.completedStories || 0}/${stats.totalStories || 0} | bolts ${stats.activeBoltsCount || 0} active / ${stats.completedBolts || 0} done`,
      active
        ? `current bolt: ${active.id} (${active.currentStage || 'unknown stage'}) in ${active.intent || 'unknown intent'}`
        : 'current bolt: none'
    ];
    return lines.join('\n');
  }

  if (flow === 'simple') {
    const stats = snapshot?.stats || {};
    const active = snapshot?.activeSpecs?.[0] || null;
    const lines = [
      `specsmd dashboard | SIMPLE | ${snapshot?.project?.name || 'unknown project'}`,
      `specs ${stats.completedSpecs || 0}/${stats.totalSpecs || 0} complete | tasks ${stats.completedTasks || 0}/${stats.totalTasks || 0} complete`,
      active
        ? `current spec: ${active.name} (${active.state}) ${active.tasksCompleted}/${active.tasksTotal} tasks`
        : 'current spec: none'
    ];
    return lines.join('\n');
  }

  return 'Unsupported flow.';
}

async function runFlowDashboard(options, flow) {
  const workspacePath = path.resolve(options.path || process.cwd());
  const config = FLOW_CONFIG[flow];

  if (!config) {
    console.error(`Flow \"${flow}\" dashboard is not available yet.`);
    process.exitCode = 1;
    return;
  }

  const rootPath = path.join(workspacePath, config.markerDir);
  const watchEnabled = options.watch !== false;
  const refreshMs = parseRefreshMs(options.refreshMs);

  const parseSnapshot = async () => config.parse(workspacePath);

  const initialResult = await parseSnapshot();
  clearTerminalOutput();

  if (!watchEnabled) {
    const output = formatStaticFlowText(
      flow,
      initialResult.ok ? initialResult.snapshot : null,
      initialResult.ok ? null : initialResult.error
    );
    console.log(output);
    if (!initialResult.ok) {
      process.exitCode = 1;
    }
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
    flow,
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

  await runFlowDashboard(options, detection.flow);
}

module.exports = {
  run,
  runFlowDashboard,
  parseRefreshMs,
  formatStaticFlowText,
  clearTerminalOutput
};
