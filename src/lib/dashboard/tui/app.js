const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState, cycleView, cycleViewBackward, cycleRunFilter } = require('./store');

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

function safeJsonHash(value) {
  try {
    return JSON.stringify(value, (key, nestedValue) => {
      if (key === 'generatedAt') {
        return undefined;
      }
      return nestedValue;
    });
  } catch {
    return String(value);
  }
}

function resolveIconSet() {
  const mode = (process.env.SPECSMD_ICON_SET || 'auto').toLowerCase();

  const ascii = {
    runs: '[R]',
    overview: '[O]',
    health: '[H]',
    runFile: '*'
  };

  const nerd = {
    runs: '󰑮',
    overview: '󰍉',
    health: '󰓦',
    runFile: '󰈔'
  };

  if (mode === 'ascii') {
    return ascii;
  }
  if (mode === 'nerd') {
    return nerd;
  }

  const locale = `${process.env.LC_ALL || ''}${process.env.LC_CTYPE || ''}${process.env.LANG || ''}`;
  const isUtf8 = /utf-?8/i.test(locale);
  const looksLikeVsCodeTerminal = (process.env.TERM_PROGRAM || '').toLowerCase().includes('vscode');

  return isUtf8 && looksLikeVsCodeTerminal ? nerd : ascii;
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
  const safeLines = (Array.isArray(lines) ? lines : []).map((line) => truncate(line, width));

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

function buildShortStats(snapshot) {
  if (!snapshot?.initialized) {
    return 'init: waiting for state.yaml';
  }

  const stats = snapshot.stats;
  return `runs ${stats.activeRunsCount}/${stats.completedRuns} | intents ${stats.completedIntents}/${stats.totalIntents} | work ${stats.completedWorkItems}/${stats.totalWorkItems}`;
}

function buildHeaderLine(snapshot, flow, watchEnabled, watchStatus, lastRefreshAt, view, runFilter, width) {
  const projectName = snapshot?.project?.name || 'Unnamed FIRE project';
  const shortStats = buildShortStats(snapshot);

  const line = `${flow.toUpperCase()} | ${projectName} | ${shortStats} | watch:${watchEnabled ? watchStatus : 'off'} | ${view}/${runFilter} | ${formatTime(lastRefreshAt)}`;

  return truncate(line, width);
}

function buildErrorLines(error, width) {
  if (!error) {
    return [];
  }

  const lines = [`[${error.code || 'ERROR'}] ${error.message || 'Unknown error'}`];

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

function getCurrentRun(snapshot) {
  const activeRuns = Array.isArray(snapshot?.activeRuns) ? [...snapshot.activeRuns] : [];
  if (activeRuns.length === 0) {
    return null;
  }

  activeRuns.sort((a, b) => {
    const aTime = a?.startedAt ? Date.parse(a.startedAt) : 0;
    const bTime = b?.startedAt ? Date.parse(b.startedAt) : 0;
    if (bTime !== aTime) {
      return bTime - aTime;
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });

  return activeRuns[0] || null;
}

function getCurrentPhaseLabel(run, currentWorkItem) {
  const phase = currentWorkItem?.currentPhase || '';
  if (typeof phase === 'string' && phase !== '') {
    return phase.toLowerCase();
  }

  if (run?.hasTestReport) {
    return 'review';
  }
  if (run?.hasPlan) {
    return 'execute';
  }
  return 'plan';
}

function buildPhaseTrack(currentPhase) {
  const order = ['plan', 'execute', 'test', 'review'];
  const labels = ['P', 'E', 'T', 'R'];
  const currentIndex = Math.max(0, order.indexOf(currentPhase));
  return labels.map((label, index) => (index === currentIndex ? `[${label}]` : ` ${label} `)).join(' - ');
}

function buildCurrentRunLines(snapshot, width) {
  const run = getCurrentRun(snapshot);
  if (!run) {
    return [truncate('No active run', width)];
  }

  const workItems = Array.isArray(run.workItems) ? run.workItems : [];
  const completed = workItems.filter((item) => item.status === 'completed').length;
  const currentWorkItem = workItems.find((item) => item.id === run.currentItem) || workItems.find((item) => item.status === 'in_progress') || workItems[0];

  const itemId = currentWorkItem?.id || run.currentItem || 'n/a';
  const mode = String(currentWorkItem?.mode || 'confirm').toUpperCase();
  const status = currentWorkItem?.status || 'pending';
  const currentPhase = getCurrentPhaseLabel(run, currentWorkItem);
  const phaseTrack = buildPhaseTrack(currentPhase);

  const lines = [
    `${run.id}  [${run.scope}]  ${completed}/${workItems.length} items done`,
    `work item: ${itemId}`,
    `mode: ${mode}  |  status: ${status}`,
    `phase: ${phaseTrack}`
  ];

  return lines.map((line) => truncate(line, width));
}

function buildRunFilesLines(snapshot, width, icons) {
  const run = getCurrentRun(snapshot);
  if (!run) {
    return [truncate('No run files (no active run)', width)];
  }

  const files = ['run.md'];
  if (run.hasPlan) files.push('plan.md');
  if (run.hasTestReport) files.push('test-report.md');
  if (run.hasWalkthrough) files.push('walkthrough.md');

  return files.map((file) => truncate(`${icons.runFile} ${file}`, width));
}

function buildPendingLines(snapshot, runFilter, width) {
  if (runFilter === 'completed') {
    return [truncate('Hidden by run filter: completed', width)];
  }

  const pending = snapshot?.pendingItems || [];
  if (pending.length === 0) {
    return [truncate('No pending work items', width)];
  }

  return pending.map((item) => {
    const deps = item.dependencies && item.dependencies.length > 0 ? ` deps:${item.dependencies.join(',')}` : '';
    return truncate(`${item.id} (${item.mode}/${item.complexity}) in ${item.intentTitle}${deps}`, width);
  });
}

function buildCompletedLines(snapshot, runFilter, width) {
  if (runFilter === 'active') {
    return [truncate('Hidden by run filter: active', width)];
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

function buildWarningsLines(snapshot, width) {
  const warnings = snapshot?.warnings || [];
  if (warnings.length === 0) {
    return [truncate('No warnings', width)];
  }

  return warnings.map((warning) => truncate(warning, width));
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

function allocateSingleColumnPanels(candidates, rowsBudget) {
  const filtered = (candidates || []).filter(Boolean);
  if (filtered.length === 0) {
    return [];
  }

  const selected = [];
  let remaining = Math.max(4, rowsBudget);

  for (const panel of filtered) {
    const margin = selected.length > 0 ? 1 : 0;
    const minimumRows = 4 + margin;

    if (remaining >= minimumRows || selected.length === 0) {
      selected.push({
        ...panel,
        maxLines: 1
      });
      remaining -= minimumRows;
    }
  }

  let index = 0;
  while (remaining > 0 && selected.length > 0) {
    const panelIndex = index % selected.length;
    selected[panelIndex].maxLines += 1;
    remaining -= 1;
    index += 1;
  }

  return selected;
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
  const { useState, useEffect, useCallback, useRef } = React;

  function SectionPanel(props) {
    const {
      title,
      lines,
      width,
      maxLines,
      borderColor,
      marginBottom,
      dense
    } = props;

    const contentWidth = Math.max(18, width - 4);
    const visibleLines = fitLines(lines, maxLines, contentWidth);

    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: dense ? 'single' : 'round',
        borderColor: borderColor || 'gray',
        paddingX: dense ? 0 : 1,
        width,
        marginBottom: marginBottom || 0
      },
      React.createElement(Text, { bold: true, color: 'cyan' }, truncate(title, contentWidth)),
      ...visibleLines.map((line, index) => React.createElement(Text, { key: `${title}-${index}` }, line))
    );
  }

  function TabsBar(props) {
    const { view, width, icons } = props;
    const tabs = [
      { id: 'runs', label: ` 1 ${icons.runs} RUNS ` },
      { id: 'overview', label: ` 2 ${icons.overview} OVERVIEW ` },
      { id: 'health', label: ` 3 ${icons.health} HEALTH ` }
    ];

    return React.createElement(
      Box,
      { width, flexWrap: 'nowrap' },
      ...tabs.map((tab) => {
        const isActive = tab.id === view;
        return React.createElement(
          Text,
          {
            key: tab.id,
            bold: isActive,
            color: isActive ? 'black' : 'gray',
            backgroundColor: isActive ? 'cyan' : undefined
          },
          tab.label
        );
      })
    );
  }

  function DashboardApp() {
    const { exit } = useApp();
    const { stdout } = useStdout();

    const initialNormalizedError = initialError ? toDashboardError(initialError) : null;
    const snapshotHashRef = useRef(safeJsonHash(initialSnapshot || null));
    const errorHashRef = useRef(initialNormalizedError ? safeJsonHash(initialNormalizedError) : null);

    const [snapshot, setSnapshot] = useState(initialSnapshot || null);
    const [error, setError] = useState(initialNormalizedError);
    const [ui, setUi] = useState(createInitialUIState());
    const [lastRefreshAt, setLastRefreshAt] = useState(new Date().toISOString());
    const [watchStatus, setWatchStatus] = useState(watchEnabled ? 'watching' : 'off');
    const [terminalSize, setTerminalSize] = useState(() => ({
      columns: stdout?.columns || process.stdout.columns || 120,
      rows: stdout?.rows || process.stdout.rows || 40
    }));
    const icons = resolveIconSet();

    const refresh = useCallback(async () => {
      const now = new Date().toISOString();

      try {
        const result = await parseSnapshot();

        if (result?.ok) {
          const nextSnapshot = result.snapshot || null;
          const nextSnapshotHash = safeJsonHash(nextSnapshot);

          if (nextSnapshotHash !== snapshotHashRef.current) {
            snapshotHashRef.current = nextSnapshotHash;
            setSnapshot(nextSnapshot);
            setLastRefreshAt(now);
          }

          if (errorHashRef.current !== null) {
            errorHashRef.current = null;
            setError(null);
            setLastRefreshAt(now);
          }

          if (watchEnabled) {
            setWatchStatus((previous) => (previous === 'watching' ? previous : 'watching'));
          }
        } else {
          const nextError = toDashboardError(result?.error, 'PARSE_ERROR');
          const nextErrorHash = safeJsonHash(nextError);

          if (nextErrorHash !== errorHashRef.current) {
            errorHashRef.current = nextErrorHash;
            setError(nextError);
            setLastRefreshAt(now);
          }
        }
      } catch (refreshError) {
        const nextError = toDashboardError(refreshError, 'REFRESH_FAILED');
        const nextErrorHash = safeJsonHash(nextError);

        if (nextErrorHash !== errorHashRef.current) {
          errorHashRef.current = nextErrorHash;
          setError(nextError);
          setLastRefreshAt(now);
        }
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

      if (input === '3') {
        setUi((previous) => ({ ...previous, view: 'health' }));
        return;
      }

      if (key.tab) {
        setUi((previous) => ({ ...previous, view: cycleView(previous.view) }));
        return;
      }

      if (key.rightArrow) {
        setUi((previous) => ({ ...previous, view: cycleView(previous.view) }));
        return;
      }

      if (key.leftArrow) {
        setUi((previous) => ({ ...previous, view: cycleViewBackward(previous.view) }));
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
        debounceMs: 200,
        onRefresh: () => {
          void refresh();
        },
        onError: (watchError) => {
          const now = new Date().toISOString();
          setWatchStatus((previous) => (previous === 'reconnecting' ? previous : 'reconnecting'));

          const nextError = toDashboardError(watchError, 'WATCH_ERROR');
          const nextErrorHash = safeJsonHash(nextError);
          if (nextErrorHash !== errorHashRef.current) {
            errorHashRef.current = nextErrorHash;
            setError(nextError);
            setLastRefreshAt(now);
          }
        }
      });

      runtime.start();
      const fallbackIntervalMs = Math.max(refreshMs, 5000);
      const interval = setInterval(() => {
        void refresh();
      }, fallbackIntervalMs);

      return () => {
        clearInterval(interval);
        void runtime.close();
      };
    }, [watchEnabled, refreshMs, refresh, rootPath, workspacePath]);

    const cols = Number.isFinite(terminalSize.columns) ? terminalSize.columns : (process.stdout.columns || 120);
    const rows = Number.isFinite(terminalSize.rows) ? terminalSize.rows : (process.stdout.rows || 40);

    const fullWidth = Math.max(40, cols - 1);
    const compactWidth = Math.max(18, fullWidth - 4);

    const showHelpLine = ui.showHelp && rows >= 14;
    const showErrorPanel = Boolean(error) && rows >= 18;
    const showErrorInline = Boolean(error) && !showErrorPanel;
    const densePanels = rows <= 28 || cols <= 120;

    const reservedRows = 2 + (showHelpLine ? 1 : 0) + (showErrorPanel ? 5 : 0) + (showErrorInline ? 1 : 0);
    const contentRowsBudget = Math.max(4, rows - reservedRows);
    const ultraCompact = rows <= 14;

    let panelCandidates;
    if (ui.view === 'overview') {
      panelCandidates = [
        {
          key: 'project',
          title: 'Project + Workspace',
          lines: buildOverviewProjectLines(snapshot, compactWidth),
          borderColor: 'green'
        },
        {
          key: 'intent-status',
          title: 'Intent Status',
          lines: buildOverviewIntentLines(snapshot, compactWidth),
          borderColor: 'yellow'
        },
        {
          key: 'standards',
          title: 'Standards',
          lines: buildOverviewStandardsLines(snapshot, compactWidth),
          borderColor: 'blue'
        }
      ];
    } else if (ui.view === 'health') {
      panelCandidates = [
        {
          key: 'stats',
          title: 'Stats',
          lines: buildStatsLines(snapshot, compactWidth),
          borderColor: 'magenta'
        },
        {
          key: 'warnings',
          title: 'Warnings',
          lines: buildWarningsLines(snapshot, compactWidth),
          borderColor: 'red'
        }
      ];

      if (error && showErrorPanel) {
        panelCandidates.push({
          key: 'error-details',
          title: 'Error Details',
          lines: buildErrorLines(error, compactWidth),
          borderColor: 'red'
        });
      }
    } else {
      panelCandidates = [
        {
          key: 'current-run',
          title: 'Current Run',
          lines: buildCurrentRunLines(snapshot, compactWidth),
          borderColor: 'green'
        },
        {
          key: 'run-files',
          title: 'Run Files',
          lines: buildRunFilesLines(snapshot, compactWidth, icons),
          borderColor: 'yellow'
        },
        {
          key: 'pending',
          title: 'Pending Queue',
          lines: buildPendingLines(snapshot, ui.runFilter, compactWidth),
          borderColor: 'yellow'
        },
        {
          key: 'completed',
          title: 'Recent Completed Runs',
          lines: buildCompletedLines(snapshot, ui.runFilter, compactWidth),
          borderColor: 'blue'
        }
      ];
    }

    if (ultraCompact) {
      panelCandidates = [panelCandidates[0]];
    }

    const panels = allocateSingleColumnPanels(panelCandidates, contentRowsBudget);

    const helpText = 'q quit | r refresh | h/? help | ←/→ or tab switch views | 1 runs | 2 overview | 3 health | f run filter';

    return React.createElement(
      Box,
      { flexDirection: 'column', width: fullWidth },
      React.createElement(Text, { color: 'cyan' }, buildHeaderLine(snapshot, flow, watchEnabled, watchStatus, lastRefreshAt, ui.view, ui.runFilter, fullWidth)),
      React.createElement(TabsBar, { view: ui.view, width: fullWidth, icons }),
      showErrorInline
        ? React.createElement(Text, { color: 'red' }, truncate(buildErrorLines(error, fullWidth)[0] || 'Error', fullWidth))
        : null,
      showErrorPanel
        ? React.createElement(SectionPanel, {
          title: 'Errors',
          lines: buildErrorLines(error, compactWidth),
          width: fullWidth,
          maxLines: 2,
          borderColor: 'red',
          marginBottom: densePanels ? 0 : 1,
          dense: densePanels
        })
        : null,
      ...panels.map((panel, index) => React.createElement(SectionPanel, {
        key: panel.key,
        title: panel.title,
        lines: panel.lines,
        width: fullWidth,
        maxLines: panel.maxLines,
        borderColor: panel.borderColor,
        marginBottom: densePanels ? 0 : (index === panels.length - 1 ? 0 : 1),
        dense: densePanels
      })),
      showHelpLine
        ? React.createElement(Text, { color: 'gray' }, truncate(helpText, fullWidth))
        : null
    );
  }

  return DashboardApp;
}

module.exports = {
  createDashboardApp,
  toDashboardError,
  truncate,
  fitLines,
  safeJsonHash,
  allocateSingleColumnPanels
};
