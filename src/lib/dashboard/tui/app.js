const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState, cycleView, cycleRunFilter } = require('./store');
const { formatDashboardText } = require('./renderer');

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

  const { Box, Text, useApp, useInput } = ink;
  const { useState, useEffect, useCallback } = React;

  function DashboardApp() {
    const { exit } = useApp();

    const [snapshot, setSnapshot] = useState(initialSnapshot || null);
    const [error, setError] = useState(initialError ? toDashboardError(initialError) : null);
    const [ui, setUi] = useState(createInitialUIState());
    const [lastRefreshAt, setLastRefreshAt] = useState(new Date().toISOString());
    const [watchStatus, setWatchStatus] = useState(watchEnabled ? 'watching' : 'off');

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

    const dashboardOutput = formatDashboardText({
      snapshot,
      error,
      flow,
      workspacePath,
      view: ui.view,
      runFilter: ui.runFilter,
      watchEnabled,
      watchStatus,
      showHelp: ui.showHelp,
      lastRefreshAt,
      width: process.stdout.columns || 120
    });

    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, null, dashboardOutput)
    );
  }

  return DashboardApp;
}

module.exports = {
  createDashboardApp,
  toDashboardError
};
