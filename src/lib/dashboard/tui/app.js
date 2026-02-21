const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState, cycleView, cycleRunFilter } = require('./store');

function toDashboardError(error, defaultCode = 'DASHBOARD_ERROR') {
  if (!error) {
    return {
      code: defaultCode,
      message: 'Unknown dashboard error.'
    };
  }

  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error
    };
  }

  if (typeof error === 'object') {
    return {
      code: error.code || defaultCode,
      message: error.message || 'Unknown dashboard error.',
      details: error.details,
      path: error.path,
      hint: error.hint
    };
  }

  return {
    code: defaultCode,
    message: String(error)
  };
}

function truncate(value, width) {
  const text = String(value ?? '');
  if (!Number.isFinite(width) || width <= 0 || text.length <= width) {
    return text;
  }

  if (width <= 3) {
    return text.slice(0, width);
  }

  return `${text.slice(0, width - 3)}...`;
}

function fitLines(lines, maxLines, width) {
  const safeLines = (Array.isArray(lines) ? lines : [])
    .map((line) => truncate(line, width));

  if (safeLines.length <= maxLines) {
    return safeLines;
  }

  const visible = safeLines.slice(0, Math.max(1, maxLines - 1));
  visible.push(truncate(`... +${safeLines.length - visible.length} more`, width));
  return visible;
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

function buildHeaderLines(snapshot, flow, workspacePath, watchEnabled, watchStatus, lastRefreshAt, view, runFilter, width) {
  const projectName = snapshot?.project?.name || 'Unnamed FIRE project';

  return [
    `specsmd dashboard | ${flow.toUpperCase()} | ${projectName}`,
    `path: ${workspacePath}`,
    `updated: ${formatTime(lastRefreshAt)} | watch: ${watchEnabled ? watchStatus : 'off'} | view: ${view} | filter: ${runFilter}`
  ].map((line) => truncate(line, width));
}

function buildErrorLines(error, width) {
  if (!error) {
    return [];
  }

  const lines = [
    `[${error.code || 'ERROR'}] ${error.message || 'Unknown error'}`
  ];

  if (error.details) {
    lines.push(`details: ${error.details}`);
  }
  if (error.path) {
    lines.push(`path: ${error.path}`);
  }
  if (error.hint) {
    lines.push(`hint: ${error.hint}`);
  }

  return lines.map((line) => truncate(line, width));
}

function buildActiveRunLines(snapshot, runFilter, width) {
  if (runFilter === 'completed') {
    return [truncate('Hidden by active filter: completed', width)];
  }

  const activeRuns = snapshot?.activeRuns || [];
  if (activeRuns.length === 0) {
    return [truncate('No active runs', width)];
  }

  const lines = [];
  for (const run of activeRuns) {
    const currentItem = run.currentItem || 'n/a';
    const workItems = Array.isArray(run.workItems) ? run.workItems : [];
    const completed = workItems.filter((item) => item.status === 'completed').length;
    const inProgress = workItems.filter((item) => item.status === 'in_progress').length;
    const artifacts = [
      run.hasPlan ? 'plan' : null,
      run.hasWalkthrough ? 'walkthrough' : null,
      run.hasTestReport ? 'test-report' : null
    ].filter(Boolean).join(', ') || 'none';

    lines.push(`${run.id} [${run.scope}] current: ${currentItem}`);
    lines.push(`progress ${completed}/${workItems.length} done, ${inProgress} active | artifacts: ${artifacts}`);
  }

  return lines.map((line) => truncate(line, width));
}

function buildPendingLines(snapshot, runFilter, width) {
  if (runFilter === 'completed') {
    return [truncate('Hidden by active filter: completed', width)];
  }

  const pending = snapshot?.pendingItems || [];
  if (pending.length === 0) {
    return [truncate('No pending work items', width)];
  }

  return pending.map((item) => {
    const deps = item.dependencies && item.dependencies.length > 0
      ? ` deps:${item.dependencies.join(',')}`
      : '';
    return truncate(`${item.id} (${item.mode}/${item.complexity}) in ${item.intentTitle}${deps}`, width);
  });
}

function buildCompletedLines(snapshot, runFilter, width) {
  if (runFilter === 'active') {
    return [truncate('Hidden by active filter: active', width)];
  }

  const completedRuns = snapshot?.completedRuns || [];
  if (completedRuns.length === 0) {
    return [truncate('No completed runs yet', width)];
  }

  return completedRuns.map((run) => {
    const workItems = Array.isArray(run.workItems) ? run.workItems : [];
    const completed = workItems.filter((item) => item.status === 'completed').length;
    return truncate(`${run.id} [${run.scope}] ${completed}/${workItems.length} done at ${run.completedAt || 'unknown'}`, width);
  });
}

function buildStatsLines(snapshot, width) {
  if (!snapshot?.initialized) {
    return [truncate('Waiting for .specs-fire/state.yaml initialization.', width)];
  }

  const stats = snapshot.stats;
  return [
    `intents: ${stats.completedIntents}/${stats.totalIntents} done | in_progress: ${stats.inProgressIntents} | blocked: ${stats.blockedIntents}`,
    `work items: ${stats.completedWorkItems}/${stats.totalWorkItems} done | in_progress: ${stats.inProgressWorkItems} | pending: ${stats.pendingWorkItems} | blocked: ${stats.blockedWorkItems}`,
    `runs: ${stats.activeRunsCount} active | ${stats.completedRuns} completed | ${stats.totalRuns} total`
  ].map((line) => truncate(line, width));
}

function buildOverviewProjectLines(snapshot, width) {
  if (!snapshot?.initialized) {
    return [
      truncate('FIRE folder detected, but state.yaml is missing.', width),
      truncate('Initialize project context and this view will populate.', width)
    ];
  }

  const project = snapshot.project || {};
  const workspace = snapshot.workspace || {};

  return [
    `project: ${project.name || 'unknown'} | fire_version: ${project.fireVersion || snapshot.version || '0.0.0'}`,
    `workspace: ${workspace.type || 'unknown'} / ${workspace.structure || 'unknown'}`,
    `autonomy: ${workspace.autonomyBias || 'unknown'} | run scope pref: ${workspace.runScopePreference || 'unknown'}`
  ].map((line) => truncate(line, width));
}

function buildOverviewIntentLines(snapshot, width) {
  const intents = snapshot?.intents || [];
  if (intents.length === 0) {
    return [truncate('No intents found', width)];
  }

  return intents.map((intent) => {
    const workItems = Array.isArray(intent.workItems) ? intent.workItems : [];
    const done = workItems.filter((item) => item.status === 'completed').length;
    return truncate(`${intent.id}: ${intent.status} (${done}/${workItems.length} work items)`, width);
  });
}

function buildOverviewStandardsLines(snapshot, width) {
  const expected = ['constitution', 'tech-stack', 'coding-standards', 'testing-standards', 'system-architecture'];
  const actual = new Set((snapshot?.standards || []).map((item) => item.type));

  return expected.map((name) => {
    const marker = actual.has(name) ? '[x]' : '[ ]';
    return truncate(`${marker} ${name}.md`, width);
  });
}

function buildWarningsLines(snapshot, width) {
  const warnings = snapshot?.warnings || [];
  if (warnings.length === 0) {
    return [truncate('No warnings', width)];
  }

  return warnings.map((warning) => truncate(warning, width));
}

function createDashboardApp(deps) {
  const {
    React,
    ink,
    parseSnapshot,
    workspacePath,
    rootPath,
    flow,
    refreshMs,
    watchEnabled,
    initialSnapshot,
    initialError
  } = deps;

  const { Box, Text, useApp, useInput, useStdout } = ink;
  const { useState, useEffect, useCallback } = React;

  function SectionPanel(props) {
    const {
      title,
      lines,
      width,
      maxLines,
      borderColor,
      marginRight,
      marginBottom
    } = props;

    const contentWidth = Math.max(18, width - 4);
    const visibleLines = fitLines(lines, maxLines, contentWidth);

    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: 'round',
        borderColor: borderColor || 'gray',
        paddingX: 1,
        width,
        marginRight: marginRight || 0,
        marginBottom: marginBottom || 0
      },
      React.createElement(Text, { bold: true, color: 'cyan' }, truncate(title, contentWidth)),
      ...visibleLines.map((line, index) => React.createElement(Text, { key: `${title}-${index}` }, line))
    );
  }

  function DashboardApp() {
    const { exit } = useApp();
    const { stdout } = useStdout();

    const [snapshot, setSnapshot] = useState(initialSnapshot || null);
    const [error, setError] = useState(initialError ? toDashboardError(initialError) : null);
    const [ui, setUi] = useState(createInitialUIState());
    const [lastRefreshAt, setLastRefreshAt] = useState(new Date().toISOString());
    const [watchStatus, setWatchStatus] = useState(watchEnabled ? 'watching' : 'off');
    const [terminalSize, setTerminalSize] = useState(() => ({
      columns: stdout?.columns || process.stdout.columns || 120,
      rows: stdout?.rows || process.stdout.rows || 40
    }));

    const refresh = useCallback(async () => {
      try {
        const result = await parseSnapshot();

        if (result?.ok) {
          setSnapshot(result.snapshot || null);
          setError(null);
          setWatchStatus(watchEnabled ? 'watching' : 'off');
        } else {
          setError(toDashboardError(result?.error, 'PARSE_ERROR'));
        }
      } catch (refreshError) {
        setError(toDashboardError(refreshError, 'REFRESH_FAILED'));
      } finally {
        setLastRefreshAt(new Date().toISOString());
      }
    }, [parseSnapshot, watchEnabled]);

    useInput((input, key) => {
      if ((key.ctrl && input === 'c') || input === 'q') {
        exit();
        return;
      }

      if (input === 'r') {
        void refresh();
        return;
      }

      if (input === 'h' || input === '?') {
        setUi((previous) => ({ ...previous, showHelp: !previous.showHelp }));
        return;
      }

      if (input === '1') {
        setUi((previous) => ({ ...previous, view: 'runs' }));
        return;
      }

      if (input === '2') {
        setUi((previous) => ({ ...previous, view: 'overview' }));
        return;
      }

      if (key.tab) {
        setUi((previous) => ({ ...previous, view: cycleView(previous.view) }));
        return;
      }

      if (input === 'f') {
        setUi((previous) => ({ ...previous, runFilter: cycleRunFilter(previous.runFilter) }));
      }
    });

    useEffect(() => {
      void refresh();
    }, [refresh]);

    useEffect(() => {
      if (!stdout || typeof stdout.on !== 'function') {
        setTerminalSize({
          columns: process.stdout.columns || 120,
          rows: process.stdout.rows || 40
        });
        return undefined;
      }

      const updateSize = () => {
        setTerminalSize({
          columns: stdout.columns || process.stdout.columns || 120,
          rows: stdout.rows || process.stdout.rows || 40
        });
      };

      updateSize();
      stdout.on('resize', updateSize);

      return () => {
        if (typeof stdout.off === 'function') {
          stdout.off('resize', updateSize);
        } else if (typeof stdout.removeListener === 'function') {
          stdout.removeListener('resize', updateSize);
        }
      };
    }, [stdout]);

    useEffect(() => {
      if (!watchEnabled) {
        return undefined;
      }

      const runtime = createWatchRuntime({
        rootPath: rootPath || `${workspacePath}/.specs-fire`,
        debounceMs: 250,
        onRefresh: () => {
          void refresh();
        },
        onError: (watchError) => {
          setWatchStatus('reconnecting');
          setError(toDashboardError(watchError, 'WATCH_ERROR'));
        }
      });

      runtime.start();
      const interval = setInterval(() => {
        void refresh();
      }, refreshMs);

      return () => {
        clearInterval(interval);
        void runtime.close();
      };
    }, [watchEnabled, refreshMs, refresh, rootPath, workspacePath]);

    const cols = Number.isFinite(terminalSize.columns) ? terminalSize.columns : (process.stdout.columns || 120);
    const rows = Number.isFinite(terminalSize.rows) ? terminalSize.rows : (process.stdout.rows || 40);

    const compact = cols < 110;
    const veryCompact = cols < 80 || rows < 22;
    const contentAreaHeight = Math.max(12, rows - (ui.showHelp ? 7 : 5));
    const sectionLineLimit = compact
      ? Math.max(2, Math.floor(contentAreaHeight / 5))
      : Math.max(3, Math.floor(contentAreaHeight / 4));

    const fullWidth = Math.max(40, cols - 1);
    const leftWidth = compact ? fullWidth : Math.max(28, Math.floor((fullWidth - 1) / 2));
    const rightWidth = compact ? fullWidth : Math.max(28, fullWidth - leftWidth - 1);

    const headerLines = buildHeaderLines(
      snapshot,
      flow,
      workspacePath,
      watchEnabled,
      watchStatus,
      lastRefreshAt,
      ui.view,
      ui.runFilter,
      fullWidth - 4
    );

    const helpLines = ui.showHelp
      ? ['q quit | r refresh | h/? help | tab switch view | 1 runs | 2 overview | f run filter']
      : ['press h to show shortcuts'];

    const errorLines = buildErrorLines(error, fullWidth - 4);

    const leftPanels = [];
    const rightPanels = [];

    if (ui.view === 'overview') {
      leftPanels.push({
        title: 'Project + Workspace',
        lines: buildOverviewProjectLines(snapshot, leftWidth - 4),
        borderColor: 'green'
      });
      leftPanels.push({
        title: 'Intent Status',
        lines: buildOverviewIntentLines(snapshot, leftWidth - 4),
        borderColor: 'yellow'
      });

      rightPanels.push({
        title: 'Stats',
        lines: buildStatsLines(snapshot, rightWidth - 4),
        borderColor: 'magenta'
      });
      rightPanels.push({
        title: 'Standards',
        lines: buildOverviewStandardsLines(snapshot, rightWidth - 4),
        borderColor: 'blue'
      });
      rightPanels.push({
        title: 'Warnings',
        lines: buildWarningsLines(snapshot, rightWidth - 4),
        borderColor: 'red'
      });
    } else {
      leftPanels.push({
        title: 'Active Runs',
        lines: buildActiveRunLines(snapshot, ui.runFilter, leftWidth - 4),
        borderColor: 'green'
      });
      leftPanels.push({
        title: 'Pending Queue',
        lines: buildPendingLines(snapshot, ui.runFilter, leftWidth - 4),
        borderColor: 'yellow'
      });

      rightPanels.push({
        title: 'Recent Completed Runs',
        lines: buildCompletedLines(snapshot, ui.runFilter, rightWidth - 4),
        borderColor: 'blue'
      });
      rightPanels.push({
        title: 'Stats',
        lines: buildStatsLines(snapshot, rightWidth - 4),
        borderColor: 'magenta'
      });
      rightPanels.push({
        title: 'Warnings',
        lines: buildWarningsLines(snapshot, rightWidth - 4),
        borderColor: 'red'
      });
    }

    return React.createElement(
      Box,
      { flexDirection: 'column', width: fullWidth },
      React.createElement(SectionPanel, {
        title: veryCompact ? 'specsmd dashboard' : 'specsmd dashboard / FIRE',
        lines: headerLines,
        width: fullWidth,
        maxLines: veryCompact ? 2 : 3,
        borderColor: 'cyan',
        marginBottom: 1
      }),
      error ? React.createElement(SectionPanel, {
        title: 'Errors',
        lines: errorLines,
        width: fullWidth,
        maxLines: Math.max(2, sectionLineLimit),
        borderColor: 'red',
        marginBottom: 1
      }) : null,
      React.createElement(
        Box,
        { flexDirection: compact ? 'column' : 'row', width: fullWidth },
        React.createElement(
          Box,
          { flexDirection: 'column', width: leftWidth, marginRight: compact ? 0 : 1 },
          ...leftPanels.map((panel, index) => React.createElement(SectionPanel, {
            key: `left-${panel.title}`,
            title: panel.title,
            lines: panel.lines,
            width: leftWidth,
            maxLines: sectionLineLimit,
            borderColor: panel.borderColor,
            marginBottom: index === leftPanels.length - 1 ? 0 : 1
          }))
        ),
        React.createElement(
          Box,
          { flexDirection: 'column', width: rightWidth },
          ...rightPanels.map((panel, index) => React.createElement(SectionPanel, {
            key: `right-${panel.title}`,
            title: panel.title,
            lines: panel.lines,
            width: rightWidth,
            maxLines: sectionLineLimit,
            borderColor: panel.borderColor,
            marginBottom: index === rightPanels.length - 1 ? 0 : 1
          }))
        )
      ),
      React.createElement(SectionPanel, {
        title: 'Help',
        lines: helpLines,
        width: fullWidth,
        maxLines: 2,
        borderColor: 'gray',
        marginTop: 1
      })
    );
  }

  return DashboardApp;
}

module.exports = {
  createDashboardApp,
  toDashboardError,
  truncate,
  fitLines
};
