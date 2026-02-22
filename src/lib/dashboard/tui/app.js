const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState } = require('./store');

const {
  stringWidth,
  toDashboardError,
  safeJsonHash,
  resolveIconSet,
  truncate,
  resolveFrameWidth,
  fitLines,
  clampIndex
} = require('./helpers');

const {
  getEffectiveFlow,
  detectDashboardApprovalGate,
  detectFireRunApprovalGate,
  detectAidlcBoltApprovalGate,
  buildHeaderLine,
  buildErrorLines,
  buildStatsLines,
  buildWarningsLines,
  getPanelTitles
} = require('./flow-builders');

const {
  getGitChangesSnapshot,
  buildGitStatusPanelLines,
  buildGitCommitRows,
  buildGitChangeGroups
} = require('./git-builders');

const {
  hasMultipleWorktrees,
  getWorktreeItems,
  getSelectedWorktree,
  getWorktreeDisplayName,
  buildWorktreeRows,
  buildOtherWorktreeActiveGroups,
  getOtherWorktreeEmptyMessage,
  buildWorktreeOverlayLines
} = require('./worktree-builders');

const { getSectionOrderForView, cycleSection } = require('./sections');

const {
  getNoCurrentMessage,
  getNoFileMessage,
  getNoCompletedMessage
} = require('./file-entries');

const {
  buildCurrentGroups,
  toExpandableRows,
  buildRunFileEntityGroups,
  buildOverviewIntentGroups,
  buildCompletedGroups,
  buildStandardsRows,
  toInfoRows,
  toLoadingRows,
  buildInteractiveRowsLines,
  getSelectedRow,
  rowToFileEntry,
  firstFileEntryFromRows,
  rowToWorktreeId,
  moveRowSelection,
  openFileWithDefaultApp
} = require('./row-builders');

const {
  buildQuickHelpText,
  buildGitCommandStrip,
  buildGitCommandLogLine,
  buildHelpOverlayLines
} = require('./overlays');

const {
  buildPreviewLines,
  allocateSingleColumnPanels
} = require('./preview');

function createDashboardApp(deps) {
  const {
    React,
    ink,
    inkUi,
    parseSnapshot,
    parseSnapshotForFlow,
    workspacePath,
    rootPath,
    flow,
    availableFlows,
    resolveRootPathForFlow,
    resolveRootPathsForFlow,
    refreshMs,
    watchEnabled,
    initialSnapshot,
    initialError
  } = deps;

  const { Box, Text, useApp, useInput, useStdout } = ink;
  const { useState, useEffect, useCallback, useRef } = React;
  const Spinner = inkUi && typeof inkUi.Spinner === 'function'
    ? inkUi.Spinner
    : null;

  function SectionPanel(props) {
    const {
      title,
      lines,
      width,
      maxLines,
      borderColor,
      marginBottom,
      dense,
      focused
    } = props;

    const contentWidth = Math.max(1, width - (dense ? 2 : 4));
    const visibleLines = fitLines(lines, maxLines, contentWidth);
    const panelBorderColor = focused ? 'cyan' : (borderColor || 'gray');
    const titleColor = focused ? 'black' : 'cyan';
    const titleBackground = focused ? 'cyan' : undefined;

    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: dense ? 'single' : 'round',
        borderColor: panelBorderColor,
        paddingX: dense ? 0 : 1,
        width,
        marginBottom: marginBottom || 0
      },
      React.createElement(
        Text,
        { bold: true, color: titleColor, backgroundColor: titleBackground },
        truncate(title, contentWidth)
      ),
      ...visibleLines.map((line, index) => {
        if (line.loading && Spinner) {
          return React.createElement(
            Box,
            { key: `${title}-${index}` },
            React.createElement(Spinner, { label: truncate(line.text, contentWidth) })
          );
        }

        return React.createElement(
          Text,
          {
            key: `${title}-${index}`,
            color: line.color,
            bold: line.bold
          },
          line.text
        );
      })
    );
  }

  function TabsBar(props) {
    const { view, width, icons, flow: activeFlow } = props;
    const effectiveFlow = String(activeFlow || '').toLowerCase();
    const primaryLabel = effectiveFlow === 'aidlc' ? 'BOLTS' : (effectiveFlow === 'simple' ? 'SPECS' : 'RUNS');
    const completedLabel = effectiveFlow === 'aidlc' ? 'COMPLETED BOLTS' : (effectiveFlow === 'simple' ? 'COMPLETED SPECS' : 'COMPLETED RUNS');
    const tabs = [
      { id: 'runs', label: `1 ${icons.runs} ${primaryLabel}` },
      { id: 'intents', label: `2 ${icons.overview} INTENTS` },
      { id: 'completed', label: `3 ${icons.runs} ${completedLabel}` },
      { id: 'health', label: `4 ${icons.health} STANDARDS/HEALTH` },
      { id: 'git', label: `5 ${icons.git} GIT CHANGES` }
    ];
    const maxWidth = Math.max(8, Math.floor(width));
    const segments = [];
    let consumed = 0;

    for (const tab of tabs) {
      const isActive = tab.id === view;
      const segmentText = isActive ? `[${tab.label}]` : tab.label;
      const separator = segments.length > 0 ? ' ' : '';
      const segmentWidth = stringWidth(separator) + stringWidth(segmentText);
      if (consumed + segmentWidth > maxWidth) {
        break;
      }

      if (separator !== '') {
        segments.push({
          key: `${tab.id}:sep`,
          text: separator,
          active: false
        });
      }
      segments.push({
        key: tab.id,
        text: segmentText,
        active: isActive
      });
      consumed += segmentWidth;
    }

    if (segments.length === 0) {
      const fallback = tabs.find((tab) => tab.id === view) || tabs[0];
      const fallbackText = truncate(`[${fallback.label}]`, maxWidth);
      return React.createElement(Text, { color: 'white', bold: true }, fallbackText);
    }

    return React.createElement(
      Box,
      { width: maxWidth, flexWrap: 'nowrap' },
      ...segments.map((segment) => React.createElement(
        Text,
        {
          key: segment.key,
          bold: segment.active,
          color: segment.active ? 'white' : 'gray',
          backgroundColor: segment.active ? 'blue' : undefined
        },
        segment.text
      ))
    );
  }

  function FlowBar(props) {
    const { activeFlow, width, flowIds } = props;
    if (!Array.isArray(flowIds) || flowIds.length <= 1) {
      return null;
    }
    const maxWidth = Math.max(8, Math.floor(width));
    const segments = [];
    let consumed = 0;

    for (const flowId of flowIds) {
      const isActive = flowId === activeFlow;
      const segmentText = isActive ? `[${flowId.toUpperCase()}]` : flowId.toUpperCase();
      const separator = segments.length > 0 ? ' ' : '';
      const segmentWidth = stringWidth(separator) + stringWidth(segmentText);
      if (consumed + segmentWidth > maxWidth) {
        break;
      }

      if (separator !== '') {
        segments.push({
          key: `${flowId}:sep`,
          text: separator,
          active: false
        });
      }
      segments.push({
        key: flowId,
        text: segmentText,
        active: isActive
      });
      consumed += segmentWidth;
    }

    if (segments.length === 0) {
      const fallback = (activeFlow || flowIds[0] || 'flow').toUpperCase();
      return React.createElement(Text, { color: 'black', backgroundColor: 'green', bold: true }, truncate(`[${fallback}]`, maxWidth));
    }

    return React.createElement(
      Box,
      { width: maxWidth, flexWrap: 'nowrap' },
      ...segments.map((segment) => React.createElement(
        Text,
        {
          key: segment.key,
          bold: segment.active,
          color: segment.active ? 'black' : 'gray',
          backgroundColor: segment.active ? 'green' : undefined
        },
        segment.text
      ))
    );
  }

  function DashboardApp() {
    const { exit } = useApp();
    const { stdout } = useStdout();

    const fallbackFlow = (initialSnapshot?.flow || flow || 'fire').toLowerCase();
    const availableFlowIds = Array.from(new Set(
      (Array.isArray(availableFlows) && availableFlows.length > 0 ? availableFlows : [fallbackFlow])
        .map((value) => String(value || '').toLowerCase().trim())
        .filter(Boolean)
    ));

    const initialNormalizedError = initialError ? toDashboardError(initialError) : null;
    const snapshotHashRef = useRef(safeJsonHash(initialSnapshot || null));
    const errorHashRef = useRef(initialNormalizedError ? safeJsonHash(initialNormalizedError) : null);
    const lastVPressRef = useRef(0);

    const [activeFlow, setActiveFlow] = useState(fallbackFlow);
    const [snapshot, setSnapshot] = useState(initialSnapshot || null);
    const [error, setError] = useState(initialNormalizedError);
    const [ui, setUi] = useState(createInitialUIState());
    const [sectionFocus, setSectionFocus] = useState({
      runs: 'current-run',
      intents: 'intent-status',
      completed: 'completed-runs',
      health: 'standards',
      git: 'git-status'
    });
    const [selectionBySection, setSelectionBySection] = useState({
      worktrees: 0,
      'current-run': 0,
      'run-files': 0,
      'other-worktrees-active': 0,
      'intent-status': 0,
      'completed-runs': 0,
      standards: 0,
      stats: 0,
      warnings: 0,
      'error-details': 0,
      'git-changes': 0,
      'git-commits': 0
    });
    const [expandedGroups, setExpandedGroups] = useState({});
    const [previewTarget, setPreviewTarget] = useState(null);
    const [overviewIntentFilter, setOverviewIntentFilter] = useState('next');
    const [deferredTabsReady, setDeferredTabsReady] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [paneFocus, setPaneFocus] = useState('main');
    const [overlayPreviewOpen, setOverlayPreviewOpen] = useState(false);
    const [worktreeOverlayOpen, setWorktreeOverlayOpen] = useState(false);
    const [worktreeOverlayIndex, setWorktreeOverlayIndex] = useState(0);
    const [selectedWorktreeId, setSelectedWorktreeId] = useState(
      initialSnapshot?.dashboardWorktrees?.selectedWorktreeId || null
    );
    const [previewScroll, setPreviewScroll] = useState(0);
    const [statusLine, setStatusLine] = useState('');
    const [lastRefreshAt, setLastRefreshAt] = useState(new Date().toISOString());
    const [watchStatus, setWatchStatus] = useState(watchEnabled ? 'watching' : 'off');
    const [terminalSize, setTerminalSize] = useState(() => ({
      columns: stdout?.columns || process.stdout.columns || 120,
      rows: stdout?.rows || process.stdout.rows || 40
    }));
    const icons = resolveIconSet();
    const parseSnapshotForActiveFlow = useCallback(async (flowId, context = {}) => {
      if (typeof parseSnapshotForFlow === 'function') {
        return parseSnapshotForFlow(flowId, context);
      }
      if (typeof parseSnapshot === 'function') {
        return parseSnapshot();
      }
      return {
        ok: false,
        error: {
          code: 'PARSE_CALLBACK_MISSING',
          message: 'Dashboard parser callback is not configured.'
        }
      };
    }, [parseSnapshotForFlow, parseSnapshot]);

    const previewVisibleRows = Number.isFinite(terminalSize.rows) ? terminalSize.rows : (process.stdout.rows || 40);
    const showErrorPanelForSections = Boolean(error) && previewVisibleRows >= 18;
    const worktreeSectionEnabled = hasMultipleWorktrees(snapshot);
    const otherWorktreesSectionEnabled = worktreeSectionEnabled;

    const getAvailableSections = useCallback((viewId) => {
      const base = getSectionOrderForView(viewId, {
        includeWorktrees: worktreeSectionEnabled,
        includeOtherWorktrees: otherWorktreesSectionEnabled
      });
      return base.filter((sectionKey) => sectionKey !== 'error-details' || showErrorPanelForSections);
    }, [showErrorPanelForSections, worktreeSectionEnabled, otherWorktreesSectionEnabled]);

    const effectiveFlow = getEffectiveFlow(activeFlow, snapshot);
    const approvalGate = detectDashboardApprovalGate(snapshot, activeFlow);
    const approvalGateLine = approvalGate
      ? `[APPROVAL NEEDED] ${approvalGate.message}`
      : '';
    const currentGroups = buildCurrentGroups(snapshot, activeFlow);
    const currentExpandedGroups = { ...expandedGroups };
    for (const group of currentGroups) {
      if (currentExpandedGroups[group.key] == null) {
        currentExpandedGroups[group.key] = true;
      }
    }

    const currentRunRowsBase = toExpandableRows(
      currentGroups,
      getNoCurrentMessage(effectiveFlow),
      currentExpandedGroups
    );
    const currentRunRows = approvalGate
      ? [
        {
          kind: 'info',
          key: 'approval-gate',
          label: approvalGateLine,
          color: 'yellow',
          bold: true,
          selectable: false
        },
        ...currentRunRowsBase
      ]
      : currentRunRowsBase;
    const worktreeRows = buildWorktreeRows(snapshot, activeFlow);

    const shouldHydrateSecondaryTabs = deferredTabsReady || ui.view !== 'runs';
    const runFileGroups = buildRunFileEntityGroups(snapshot, activeFlow, {
      includeBacklog: shouldHydrateSecondaryTabs
    });
    const runFileExpandedGroups = { ...expandedGroups };
    for (const group of runFileGroups) {
      if (runFileExpandedGroups[group.key] == null) {
        runFileExpandedGroups[group.key] = true;
      }
    }
    const runFileRows = toExpandableRows(
      runFileGroups,
      getNoFileMessage(effectiveFlow),
      runFileExpandedGroups
    );
    const otherWorktreeGroups = buildOtherWorktreeActiveGroups(snapshot, activeFlow);
    const otherWorktreeRows = toExpandableRows(
      otherWorktreeGroups,
      getOtherWorktreeEmptyMessage(snapshot, activeFlow),
      expandedGroups
    );
    const intentRows = shouldHydrateSecondaryTabs
      ? [
        {
          kind: 'info',
          key: 'intent-filter',
          label: `filter ${overviewIntentFilter === 'completed' ? 'next | [COMPLETED]' : '[NEXT] | completed'}  (n/x)`,
          color: 'cyan',
          bold: true,
          selectable: false
        },
        ...toExpandableRows(
          buildOverviewIntentGroups(snapshot, activeFlow, overviewIntentFilter),
          overviewIntentFilter === 'completed' ? 'No completed intents yet' : 'No upcoming intents',
          expandedGroups
        )
      ]
      : toLoadingRows('Loading intents...', 'intent-loading');
    const completedRows = shouldHydrateSecondaryTabs
      ? toExpandableRows(
        buildCompletedGroups(snapshot, activeFlow),
        getNoCompletedMessage(effectiveFlow),
        expandedGroups
      )
      : toLoadingRows('Loading completed items...', 'completed-loading');
    const standardsRows = shouldHydrateSecondaryTabs
      ? buildStandardsRows(snapshot, activeFlow)
      : toLoadingRows('Loading standards...', 'standards-loading');
    const statsRows = shouldHydrateSecondaryTabs
      ? toInfoRows(
        buildStatsLines(snapshot, 200, activeFlow),
        'stats',
        'No stats available'
      )
      : toLoadingRows('Loading stats...', 'stats-loading');
    const warningsRows = shouldHydrateSecondaryTabs
      ? toInfoRows(
        buildWarningsLines(snapshot, 200),
        'warnings',
        'No warnings'
      )
      : toLoadingRows('Loading warnings...', 'warnings-loading');
    const errorDetailsRows = shouldHydrateSecondaryTabs
      ? toInfoRows(
        buildErrorLines(error, 200),
        'error-details',
        'No error details'
      )
      : toLoadingRows('Loading error details...', 'error-loading');
    const gitRows = shouldHydrateSecondaryTabs
      ? (() => {
        const git = getGitChangesSnapshot(snapshot);
        return toExpandableRows(
          buildGitChangeGroups(snapshot),
          git.available ? 'Working tree clean' : 'No git changes',
          expandedGroups
        );
      })()
      : toLoadingRows('Loading git changes...', 'git-loading');
    const gitCommitRows = shouldHydrateSecondaryTabs
      ? buildGitCommitRows(snapshot)
      : toLoadingRows('Loading commit history...', 'git-commits-loading');

    const rowsBySection = {
      worktrees: worktreeRows,
      'current-run': currentRunRows,
      'run-files': runFileRows,
      'other-worktrees-active': otherWorktreeRows,
      'intent-status': intentRows,
      'completed-runs': completedRows,
      standards: standardsRows,
      stats: statsRows,
      warnings: warningsRows,
      'error-details': errorDetailsRows,
      'git-changes': gitRows,
      'git-commits': gitCommitRows
    };
    const worktreeItemsList = getWorktreeItems(snapshot);
    const selectedWorktree = getSelectedWorktree(snapshot);
    const selectedWorktreeLabel = selectedWorktree ? getWorktreeDisplayName(selectedWorktree) : null;
    const worktreeWatchSignature = `${snapshot?.dashboardWorktrees?.selectedWorktreeId || ''}|${worktreeItemsList
      .map((item) => `${item.id}:${item.status}:${item.activeCount}:${item.flowAvailable ? '1' : '0'}`)
      .join(',')}`;
    const rowLengthSignature = Object.entries(rowsBySection)
      .map(([key, rowsForSection]) => `${key}:${Array.isArray(rowsForSection) ? rowsForSection.length : 0}`)
      .join('|');

    const currentSectionOrder = getAvailableSections(ui.view);
    const focusedSection = currentSectionOrder.includes(sectionFocus[ui.view])
      ? sectionFocus[ui.view]
      : (currentSectionOrder[0] || 'current-run');

    const focusedRows = rowsBySection[focusedSection] || [];
    const focusedIndex = selectionBySection[focusedSection] || 0;
    const selectedFocusedRow = getSelectedRow(focusedRows, focusedIndex);
    const selectedFocusedFile = rowToFileEntry(selectedFocusedRow);
    const selectedGitRow = getSelectedRow(gitRows, selectionBySection['git-changes'] || 0);
    const selectedGitFile = rowToFileEntry(selectedGitRow);
    const selectedGitCommitRow = getSelectedRow(gitCommitRows, selectionBySection['git-commits'] || 0);
    const selectedGitCommit = rowToFileEntry(selectedGitCommitRow);
    const firstGitFile = firstFileEntryFromRows(gitRows);

    const refresh = useCallback(async (overrideSelectedWorktreeId = null) => {
      const now = new Date().toISOString();
      const requestedWorktreeId = typeof overrideSelectedWorktreeId === 'string' && overrideSelectedWorktreeId.trim() !== ''
        ? overrideSelectedWorktreeId.trim()
        : selectedWorktreeId;

      try {
        const result = await parseSnapshotForActiveFlow(activeFlow, {
          selectedWorktreeId: requestedWorktreeId
        });

        if (result?.ok) {
          const nextSnapshot = result.snapshot
            ? { ...result.snapshot, flow: getEffectiveFlow(activeFlow, result.snapshot) }
            : null;
          const nextSnapshotHash = safeJsonHash(nextSnapshot);

          if (nextSnapshotHash !== snapshotHashRef.current) {
            snapshotHashRef.current = nextSnapshotHash;
            setSnapshot(nextSnapshot);
            setLastRefreshAt(now);
          }

          const nextSelectedWorktreeId = nextSnapshot?.dashboardWorktrees?.selectedWorktreeId;
          if (typeof nextSelectedWorktreeId === 'string' && nextSelectedWorktreeId !== '' && nextSelectedWorktreeId !== selectedWorktreeId) {
            setSelectedWorktreeId(nextSelectedWorktreeId);
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
    }, [activeFlow, parseSnapshotForActiveFlow, selectedWorktreeId, watchEnabled]);

    const switchToWorktree = useCallback((nextWorktreeId, options = {}) => {
      const normalizedNextId = typeof nextWorktreeId === 'string' ? nextWorktreeId.trim() : '';
      if (normalizedNextId === '') {
        setStatusLine('No worktree selected.');
        return false;
      }

      const nextItem = worktreeItemsList.find((item) => item.id === normalizedNextId);
      if (!nextItem) {
        setStatusLine('Selected worktree is no longer available.');
        return false;
      }

      if (!nextItem.flowAvailable) {
        setStatusLine(`Flow is unavailable in worktree: ${getWorktreeDisplayName(nextItem)}`);
        return false;
      }

      const changed = normalizedNextId !== selectedWorktreeId;
      setSelectedWorktreeId(normalizedNextId);
      setPreviewTarget(null);
      setPreviewOpen(false);
      setOverlayPreviewOpen(false);
      setPreviewScroll(0);
      setPaneFocus('main');

      if (changed || options.forceRefresh) {
        setStatusLine(`Switched to worktree: ${getWorktreeDisplayName(nextItem)}`);
        void refresh(normalizedNextId);
      }

      return true;
    }, [refresh, selectedWorktreeId, worktreeItemsList]);

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

      if (key.escape && ui.showHelp) {
        setUi((previous) => ({ ...previous, showHelp: false }));
        return;
      }

      if (ui.showHelp) {
        return;
      }

      if (worktreeOverlayOpen) {
        if (key.escape) {
          setWorktreeOverlayOpen(false);
          return;
        }

        if (key.upArrow || input === 'k') {
          setWorktreeOverlayIndex((previous) => Math.max(0, previous - 1));
          return;
        }

        if (key.downArrow || input === 'j') {
          setWorktreeOverlayIndex((previous) => Math.min(Math.max(0, worktreeItemsList.length - 1), previous + 1));
          return;
        }

        if (key.return || key.enter) {
          const selectedOverlayItem = worktreeItemsList[clampIndex(worktreeOverlayIndex, worktreeItemsList.length || 1)];
          switchToWorktree(selectedOverlayItem?.id || '', { forceRefresh: true });
          setWorktreeOverlayOpen(false);
          return;
        }

        return;
      }

      if (input === '1') {
        setUi((previous) => ({ ...previous, view: 'runs' }));
        setPaneFocus('main');
        return;
      }

      if (input === '2') {
        setUi((previous) => ({ ...previous, view: 'intents' }));
        setPaneFocus('main');
        return;
      }

      if (input === '3') {
        setUi((previous) => ({ ...previous, view: 'completed' }));
        setPaneFocus('main');
        return;
      }

      if (input === '4') {
        setUi((previous) => ({ ...previous, view: 'health' }));
        setPaneFocus('main');
        return;
      }

      if (input === '5') {
        setUi((previous) => ({ ...previous, view: 'git' }));
        setPaneFocus('main');
        return;
      }

      if ((input === ']' || input === 'm') && availableFlowIds.length > 1) {
        snapshotHashRef.current = safeJsonHash(null);
        errorHashRef.current = null;
        setSnapshot(null);
        setError(null);
        setActiveFlow((previous) => {
          const index = availableFlowIds.indexOf(previous);
          const nextIndex = index >= 0
            ? ((index + 1) % availableFlowIds.length)
            : 0;
          return availableFlowIds[nextIndex];
        });
        setSelectionBySection({
          worktrees: 0,
          'current-run': 0,
          'run-files': 0,
          'other-worktrees-active': 0,
          'intent-status': 0,
          'completed-runs': 0,
          standards: 0,
          stats: 0,
          warnings: 0,
          'error-details': 0,
          'git-changes': 0,
          'git-commits': 0
        });
        setSectionFocus({
          runs: 'current-run',
          intents: 'intent-status',
          completed: 'completed-runs',
          health: 'standards',
          git: 'git-status'
        });
        setOverviewIntentFilter('next');
        setExpandedGroups({});
        setPreviewTarget(null);
        setPreviewOpen(false);
        setOverlayPreviewOpen(false);
        setWorktreeOverlayOpen(false);
        setPreviewScroll(0);
        setPaneFocus('main');
        return;
      }

      if (input === '[' && availableFlowIds.length > 1) {
        snapshotHashRef.current = safeJsonHash(null);
        errorHashRef.current = null;
        setSnapshot(null);
        setError(null);
        setActiveFlow((previous) => {
          const index = availableFlowIds.indexOf(previous);
          const nextIndex = index >= 0
            ? ((index - 1 + availableFlowIds.length) % availableFlowIds.length)
            : 0;
          return availableFlowIds[nextIndex];
        });
        setSelectionBySection({
          worktrees: 0,
          'current-run': 0,
          'run-files': 0,
          'other-worktrees-active': 0,
          'intent-status': 0,
          'completed-runs': 0,
          standards: 0,
          stats: 0,
          warnings: 0,
          'error-details': 0,
          'git-changes': 0,
          'git-commits': 0
        });
        setSectionFocus({
          runs: 'current-run',
          intents: 'intent-status',
          completed: 'completed-runs',
          health: 'standards',
          git: 'git-status'
        });
        setOverviewIntentFilter('next');
        setExpandedGroups({});
        setPreviewTarget(null);
        setPreviewOpen(false);
        setOverlayPreviewOpen(false);
        setWorktreeOverlayOpen(false);
        setPreviewScroll(0);
        setPaneFocus('main');
        return;
      }

      const availableSections = getAvailableSections(ui.view);
      const activeSection = availableSections.includes(sectionFocus[ui.view])
        ? sectionFocus[ui.view]
        : (availableSections[0] || 'current-run');

      if (key.tab && previewOpen) {
        setPaneFocus((previous) => (previous === 'main' ? 'preview' : 'main'));
        return;
      }

      if (ui.view === 'intents' && activeSection === 'intent-status') {
        if (input === 'n') {
          setOverviewIntentFilter('next');
          return;
        }
        if (input === 'x') {
          setOverviewIntentFilter('completed');
          return;
        }
        if (key.rightArrow || key.leftArrow) {
          setOverviewIntentFilter((previous) => (previous === 'completed' ? 'next' : 'completed'));
          return;
        }
      }

      if (input === 'g' || key.rightArrow) {
        setSectionFocus((previous) => ({
          ...previous,
          [ui.view]: cycleSection(ui.view, activeSection, 1, availableSections)
        }));
        setPaneFocus('main');
        return;
      }

      if (input === 'G' || key.leftArrow) {
        setSectionFocus((previous) => ({
          ...previous,
          [ui.view]: cycleSection(ui.view, activeSection, -1, availableSections)
        }));
        setPaneFocus('main');
        return;
      }

      if (ui.view === 'runs') {
        if (input === 'b' && worktreeSectionEnabled) {
          setSectionFocus((previous) => ({ ...previous, runs: 'worktrees' }));
          setPaneFocus('main');
          return;
        }
        if (input === 'a') {
          setSectionFocus((previous) => ({ ...previous, runs: 'current-run' }));
          setPaneFocus('main');
          return;
        }
        if (input === 'f') {
          setSectionFocus((previous) => ({ ...previous, runs: 'run-files' }));
          setPaneFocus('main');
          return;
        }
        if (input === 'u' && otherWorktreesSectionEnabled) {
          setSectionFocus((previous) => ({ ...previous, runs: 'other-worktrees-active' }));
          setPaneFocus('main');
          return;
        }
      } else if (ui.view === 'intents') {
        if (input === 'i') {
          setSectionFocus((previous) => ({ ...previous, intents: 'intent-status' }));
          return;
        }
      } else if (ui.view === 'completed') {
        if (input === 'c') {
          setSectionFocus((previous) => ({ ...previous, completed: 'completed-runs' }));
          return;
        }
      } else if (ui.view === 'health') {
        if (input === 's') {
          setSectionFocus((previous) => ({ ...previous, health: 'standards' }));
          return;
        }
        if (input === 't') {
          setSectionFocus((previous) => ({ ...previous, health: 'stats' }));
          return;
        }
        if (input === 'w') {
          setSectionFocus((previous) => ({ ...previous, health: 'warnings' }));
          return;
        }
        if (input === 'e' && showErrorPanelForSections) {
          setSectionFocus((previous) => ({ ...previous, health: 'error-details' }));
          return;
        }
      } else if (ui.view === 'git') {
        if (input === '6') {
          setSectionFocus((previous) => ({ ...previous, git: 'git-status' }));
          setPaneFocus('main');
          return;
        }
        if (input === '7') {
          setSectionFocus((previous) => ({ ...previous, git: 'git-changes' }));
          setPaneFocus('main');
          return;
        }
        if (input === '8') {
          setSectionFocus((previous) => ({ ...previous, git: 'git-commits' }));
          setPaneFocus('main');
          return;
        }
        if (input === '-') {
          setSectionFocus((previous) => ({ ...previous, git: 'git-diff' }));
          setPaneFocus('main');
          return;
        }
      }

      if (key.escape) {
        if (overlayPreviewOpen) {
          setOverlayPreviewOpen(false);
          setPaneFocus('preview');
          return;
        }
        if (previewOpen) {
          setPreviewOpen(false);
          setPreviewScroll(0);
          setPaneFocus('main');
          return;
        }
      }

      if (key.upArrow || key.downArrow || input === 'j' || input === 'k') {
        const moveDown = key.downArrow || input === 'j';
        const moveUp = key.upArrow || input === 'k';

        if (overlayPreviewOpen || (previewOpen && paneFocus === 'preview')) {
          if (moveDown) {
            setPreviewScroll((previous) => previous + 1);
          } else if (moveUp) {
            setPreviewScroll((previous) => Math.max(0, previous - 1));
          }
          return;
        }

        const targetSection = activeSection;
        const targetRows = rowsBySection[targetSection] || [];
        if (targetRows.length === 0) {
          return;
        }

        const currentIndex = selectionBySection[targetSection] || 0;
        const nextIndex = moveDown
          ? moveRowSelection(targetRows, currentIndex, 1)
          : moveRowSelection(targetRows, currentIndex, -1);

        setSelectionBySection((previous) => ({
          ...previous,
          [targetSection]: nextIndex
        }));

        if (targetSection === 'worktrees' && worktreeSectionEnabled) {
          const nextRow = getSelectedRow(targetRows, nextIndex);
          const nextWorktreeId = rowToWorktreeId(nextRow);
          if (nextWorktreeId && nextWorktreeId !== selectedWorktreeId) {
            switchToWorktree(nextWorktreeId);
          }
        }

        return;
      }

      if (key.return || key.enter) {
        const rowsForSection = rowsBySection[activeSection] || [];
        const selectedRow = getSelectedRow(rowsForSection, selectionBySection[activeSection] || 0);
        if (selectedRow?.kind === 'group' && selectedRow.expandable) {
          setExpandedGroups((previous) => ({
            ...previous,
            [selectedRow.key]: !previous[selectedRow.key]
          }));
        }
        return;
      }

      if (input === 'v' || input === ' ' || key.space) {
        const target = selectedFocusedFile || previewTarget;
        if (!target) {
          setStatusLine('Select a file row first.');
          return;
        }

        const now = Date.now();
        const isDoublePress = (now - lastVPressRef.current) <= 320;
        lastVPressRef.current = now;

        if (isDoublePress) {
          setPreviewTarget(target);
          setPreviewOpen(true);
          setOverlayPreviewOpen(true);
          setPreviewScroll(0);
          setPaneFocus('preview');
          return;
        }

        if (!previewOpen) {
          setPreviewTarget(target);
          setPreviewOpen(true);
          setOverlayPreviewOpen(false);
          setPreviewScroll(0);
          setPaneFocus('main');
          return;
        }

        if (overlayPreviewOpen) {
          setOverlayPreviewOpen(false);
          setPaneFocus('preview');
          return;
        }

        setPreviewOpen(false);
        setPreviewScroll(0);
        setPaneFocus('main');
        return;
      }

      if (input === 'o') {
        const target = selectedFocusedFile || previewTarget;
        if (target?.previewType === 'git-commit-diff') {
          setStatusLine('Commit entries cannot be opened as files.');
          return;
        }
        const result = openFileWithDefaultApp(target?.path);
        setStatusLine(result.message);
      }
    });

    useEffect(() => {
      void refresh();
    }, [refresh]);

    useEffect(() => {
      const snapshotSelected = snapshot?.dashboardWorktrees?.selectedWorktreeId;
      if (typeof snapshotSelected !== 'string' || snapshotSelected === '') {
        return;
      }
      if (snapshotSelected !== selectedWorktreeId) {
        setSelectedWorktreeId(snapshotSelected);
      }
    }, [snapshot?.dashboardWorktrees?.selectedWorktreeId, selectedWorktreeId]);

    useEffect(() => {
      if (!snapshot?.dashboardWorktrees?.hasPendingScans) {
        return undefined;
      }
      const timer = setTimeout(() => {
        void refresh();
      }, 350);
      return () => {
        clearTimeout(timer);
      };
    }, [snapshot?.dashboardWorktrees?.hasPendingScans, snapshot?.generatedAt, refresh]);

    useEffect(() => {
      setSelectionBySection((previous) => {
        let changed = false;
        const next = { ...previous };

        for (const [sectionKey, sectionRows] of Object.entries(rowsBySection)) {
          const previousValue = Number.isFinite(previous[sectionKey]) ? previous[sectionKey] : 0;
          const clampedValue = clampIndex(previousValue, sectionRows.length);
          if (previousValue !== clampedValue) {
            next[sectionKey] = clampedValue;
            changed = true;
          } else if (!(sectionKey in next)) {
            next[sectionKey] = clampedValue;
            changed = true;
          }
        }

        return changed ? next : previous;
      });
    }, [activeFlow, rowLengthSignature, snapshot?.generatedAt]);

    useEffect(() => {
      setDeferredTabsReady(false);
      const timer = setTimeout(() => {
        setDeferredTabsReady(true);
      }, 250);
      return () => {
        clearTimeout(timer);
      };
    }, [activeFlow]);

    useEffect(() => {
      setPaneFocus('main');
      setWorktreeOverlayOpen(false);
    }, [ui.view]);

    useEffect(() => {
      if (!previewOpen || overlayPreviewOpen || paneFocus !== 'main') {
        return;
      }
      if (!selectedFocusedFile?.path) {
        return;
      }
      if (previewTarget?.path === selectedFocusedFile.path) {
        return;
      }
      setPreviewTarget(selectedFocusedFile);
      setPreviewScroll(0);
    }, [previewOpen, overlayPreviewOpen, paneFocus, selectedFocusedFile?.path, previewTarget?.path]);

    useEffect(() => {
      if (ui.view !== 'git') {
        return;
      }
      setPreviewScroll(0);
    }, [ui.view, focusedSection, selectedGitFile?.path, selectedGitCommit?.commitHash]);

    useEffect(() => {
      if (statusLine === '') {
        return undefined;
      }

      const timeout = setTimeout(() => {
        setStatusLine('');
      }, 3500);

      return () => {
        clearTimeout(timeout);
      };
    }, [statusLine]);

    useEffect(() => {
      if (!stdout || typeof stdout.on !== 'function') {
        setTerminalSize({
          columns: Math.max(1, process.stdout.columns || 120),
          rows: Math.max(1, process.stdout.rows || 40)
        });
        return undefined;
      }

      const updateSize = () => {
        setTerminalSize({
          columns: Math.max(1, stdout.columns || process.stdout.columns || 120),
          rows: Math.max(1, stdout.rows || process.stdout.rows || 40)
        });

        // Resize in some terminals can leave stale frame rows behind.
        // Keep the clear operation minimal to avoid triggering scrollback churn.
        if (typeof stdout.write === 'function' && stdout.isTTY !== false) {
          stdout.write('\u001B[H\u001B[J');
        }
      };

      updateSize();
      stdout.on('resize', updateSize);
      if (process.stdout !== stdout && typeof process.stdout.on === 'function') {
        process.stdout.on('resize', updateSize);
      }

      return () => {
        if (typeof stdout.off === 'function') {
          stdout.off('resize', updateSize);
        } else if (typeof stdout.removeListener === 'function') {
          stdout.removeListener('resize', updateSize);
        }
        if (process.stdout !== stdout) {
          if (typeof process.stdout.off === 'function') {
            process.stdout.off('resize', updateSize);
          } else if (typeof process.stdout.removeListener === 'function') {
            process.stdout.removeListener('resize', updateSize);
          }
        }
      };
    }, [stdout]);

    useEffect(() => {
      if (!watchEnabled) {
        return undefined;
      }

      const resolvedRootCandidates = typeof resolveRootPathsForFlow === 'function'
        ? resolveRootPathsForFlow(activeFlow, snapshot?.dashboardWorktrees, selectedWorktreeId)
        : null;
      const candidateRoots = Array.isArray(resolvedRootCandidates) ? resolvedRootCandidates : [];
      const fallbackRoot = resolveRootPathForFlow
        ? resolveRootPathForFlow(activeFlow)
        : (rootPath || `${workspacePath}/.specs-fire`);
      const watchRoots = candidateRoots.length > 0 ? candidateRoots : [fallbackRoot];

      const runtime = createWatchRuntime({
        rootPaths: watchRoots,
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
      const fallbackIntervalMs = ui.view === 'git'
        ? Math.max(refreshMs, 1000)
        : Math.max(refreshMs, 5000);
      const interval = setInterval(() => {
        void refresh();
      }, fallbackIntervalMs);

      return () => {
        clearInterval(interval);
        void runtime.close();
      };
    }, [watchEnabled, refreshMs, refresh, rootPath, workspacePath, resolveRootPathForFlow, resolveRootPathsForFlow, activeFlow, ui.view, worktreeWatchSignature, selectedWorktreeId]);

    const cols = Number.isFinite(terminalSize.columns) ? terminalSize.columns : (process.stdout.columns || 120);
    const rows = Number.isFinite(terminalSize.rows) ? terminalSize.rows : (process.stdout.rows || 40);

    const fullWidth = resolveFrameWidth(cols);
    const showFlowBar = availableFlowIds.length > 1;
    const showCommandLogLine = rows >= 8;
    const showCommandStrip = rows >= 9;
    const showErrorPanel = Boolean(error) && rows >= 18;
    const showGlobalErrorPanel = showErrorPanel && ui.view !== 'health' && !ui.showHelp && !worktreeOverlayOpen;
    const showErrorInline = Boolean(error) && !showErrorPanel && !worktreeOverlayOpen;
    const showApprovalBanner = approvalGateLine !== '' && !ui.showHelp && !worktreeOverlayOpen;
    const showLegacyStatusLine = statusLine !== '' && !showCommandLogLine;
    const densePanels = rows <= 28 || cols <= 120;
    const panelFrameRows = 3;
    const resolvePanelBodyRows = (rowBudget) => Math.max(1, Math.floor(Math.max(1, rowBudget) - panelFrameRows));

    const reservedRows =
      2 +
      (showFlowBar ? 1 : 0) +
      (showApprovalBanner ? 1 : 0) +
      (showCommandLogLine ? 1 : 0) +
      (showCommandStrip ? 1 : 0) +
      (showGlobalErrorPanel ? 5 : 0) +
      (showErrorInline ? 1 : 0) +
      (showLegacyStatusLine ? 1 : 0);
    const frameSafetyRows = 2;
    const contentRowsBudget = Math.max(4, rows - reservedRows - frameSafetyRows);
    const ultraCompact = rows <= 14;
    const panelTitles = getPanelTitles(activeFlow, snapshot);
    const compactWidth = Math.max(18, fullWidth - 4);

    const sectionLines = Object.fromEntries(
      Object.entries(rowsBySection).map(([sectionKey, sectionRows]) => [
        sectionKey,
        buildInteractiveRowsLines(
          sectionRows,
          selectionBySection[sectionKey] || 0,
          icons,
          compactWidth,
          paneFocus === 'main' && focusedSection === sectionKey
        )
      ])
    );
    const effectivePreviewTarget = previewTarget || selectedFocusedFile;
    const useFullDocumentPreview = overlayPreviewOpen || (ui.view === 'runs' && previewOpen && !overlayPreviewOpen);
    const previewLines = previewOpen
      ? buildPreviewLines(effectivePreviewTarget, compactWidth, previewScroll, {
        fullDocument: useFullDocumentPreview
      })
      : [];
    const gitInlineDiffTarget = (
      focusedSection === 'git-commits'
        ? (selectedGitCommit || selectedGitFile || firstGitFile)
        : (selectedGitFile || firstGitFile)
    ) || null;
    const gitInlineDiffLines = ui.view === 'git'
      ? buildPreviewLines(gitInlineDiffTarget, compactWidth, previewOpen && paneFocus === 'preview' ? previewScroll : 0, {
        fullDocument: false
      })
      : [];
    const gitStatusPanelLines = ui.view === 'git' ? buildGitStatusPanelLines(snapshot) : [];

    const shortcutsOverlayLines = buildHelpOverlayLines({
      view: ui.view,
      flow: activeFlow,
      previewOpen,
      paneFocus,
      availableFlowCount: availableFlowIds.length,
      showErrorSection: showErrorPanel,
      hasWorktrees: worktreeSectionEnabled
    });
    const quickHelpText = buildQuickHelpText(ui.view, {
      flow: activeFlow,
      previewOpen,
      paneFocus,
      availableFlowCount: availableFlowIds.length,
      hasWorktrees: worktreeSectionEnabled
    });
    const commandStripText = buildGitCommandStrip(ui.view, {
      hasWorktrees: worktreeSectionEnabled,
      previewOpen
    });
    const commandLogLine = buildGitCommandLogLine({
      statusLine,
      activeFlow,
      watchEnabled,
      watchStatus,
      selectedWorktreeLabel
    });

    let panelCandidates;
    if (ui.showHelp) {
      panelCandidates = [
        {
          key: 'shortcuts-overlay',
          title: 'Keyboard Shortcuts',
          lines: shortcutsOverlayLines,
          borderColor: 'cyan'
        }
      ];
    } else if (worktreeOverlayOpen) {
      panelCandidates = [
        {
          key: 'worktree-overlay',
          title: 'Switch Worktree',
          lines: buildWorktreeOverlayLines(snapshot, worktreeOverlayIndex, Math.max(18, fullWidth - 4)),
          borderColor: 'yellow'
        }
      ];
    } else if (previewOpen && overlayPreviewOpen) {
      panelCandidates = [
        {
          key: 'preview-overlay',
          title: `Preview: ${effectivePreviewTarget?.label || 'unknown'}`,
          lines: previewLines,
          borderColor: 'magenta'
        }
      ];
    } else if (ui.view === 'intents') {
      panelCandidates = [
        {
          key: 'intent-status',
          title: 'Intents',
          lines: sectionLines['intent-status'],
          borderColor: 'yellow'
        }
      ];
    } else if (ui.view === 'completed') {
      panelCandidates = [
        {
          key: 'completed-runs',
          title: panelTitles.completed,
          lines: sectionLines['completed-runs'],
          borderColor: 'blue'
        }
      ];
    } else if (ui.view === 'health') {
      panelCandidates = [
        {
          key: 'standards',
          title: 'Standards',
          lines: sectionLines.standards,
          borderColor: 'blue'
        },
        {
          key: 'stats',
          title: 'Stats',
          lines: sectionLines.stats,
          borderColor: 'magenta'
        },
        {
          key: 'warnings',
          title: 'Warnings',
          lines: sectionLines.warnings,
          borderColor: 'red'
        }
      ];

      if (error && showErrorPanel) {
        panelCandidates.push({
          key: 'error-details',
          title: 'Error Details',
          lines: sectionLines['error-details'],
          borderColor: 'red'
        });
      }
    } else if (ui.view === 'git') {
      panelCandidates = [
        {
          key: 'git-status',
          title: '[6]-Status',
          lines: gitStatusPanelLines,
          borderColor: 'green'
        },
        {
          key: 'git-changes',
          title: '[7]-Files',
          lines: sectionLines['git-changes'],
          borderColor: 'yellow'
        },
        {
          key: 'git-commits',
          title: '[8]-Commits',
          lines: sectionLines['git-commits'],
          borderColor: 'cyan'
        },
        {
          key: 'git-diff',
          title: focusedSection === 'git-commits' ? '[-]-Selected commit diff' : '[-]-Unstaged changes',
          lines: gitInlineDiffLines,
          borderColor: 'yellow'
        }
      ];
    } else {
      panelCandidates = [];
      if (worktreeSectionEnabled) {
        panelCandidates.push({
          key: 'worktrees',
          title: 'Worktrees',
          lines: sectionLines.worktrees,
          borderColor: 'magenta'
        });
      }
      panelCandidates.push(
        {
          key: 'current-run',
          title: panelTitles.current,
          lines: sectionLines['current-run'],
          borderColor: 'green'
        },
        {
          key: 'run-files',
          title: panelTitles.files,
          lines: sectionLines['run-files'],
          borderColor: 'yellow'
        }
      );
      if (otherWorktreesSectionEnabled) {
        panelCandidates.push({
          key: 'other-worktrees-active',
          title: panelTitles.otherWorktrees,
          lines: sectionLines['other-worktrees-active'],
          borderColor: 'blue'
        });
      }
    }

    if (!ui.showHelp && previewOpen && !overlayPreviewOpen && ui.view !== 'git') {
      panelCandidates.push({
        key: 'preview',
        title: `Preview: ${effectivePreviewTarget?.label || 'unknown'}`,
        lines: previewLines,
        borderColor: 'magenta'
      });
    }

    if (ultraCompact) {
      if (previewOpen) {
        panelCandidates = panelCandidates.filter((panel) =>
          panel && (
            panel.key === focusedSection
            || panel.key === 'preview'
            || (ui.view === 'git' && panel.key === 'git-diff')
          )
        );
      } else {
        const focusedPanel = panelCandidates.find((panel) => panel?.key === focusedSection);
        panelCandidates = [focusedPanel || panelCandidates[0]];
      }
    }

    const panels = allocateSingleColumnPanels(panelCandidates, contentRowsBudget);
    const splitPreviewLayout = ui.view === 'runs'
      && !ui.showHelp
      && !worktreeOverlayOpen
      && previewOpen
      && !overlayPreviewOpen
      && !ultraCompact
      && fullWidth >= 110
      && panelCandidates.some((panel) => panel?.key === 'preview');
    const gitHierarchyLayout = ui.view === 'git'
      && !ui.showHelp
      && !worktreeOverlayOpen
      && !overlayPreviewOpen
      && !ultraCompact
      && fullWidth >= 96
      && panelCandidates.length > 1;

    const renderPanel = (panel, index, width, isFocused) => React.createElement(SectionPanel, {
      key: panel.key,
      title: panel.title,
      lines: panel.lines,
      width,
      maxLines: panel.maxLines,
      borderColor: panel.borderColor,
      marginBottom: densePanels ? 0 : (index === panels.length - 1 ? 0 : 1),
      dense: densePanels,
      focused: isFocused
    });

    let contentNode;
    if (gitHierarchyLayout) {
      const preferredRightPanel = panelCandidates.find((panel) => panel?.key === 'git-diff')
        || (previewOpen && !overlayPreviewOpen
          ? panelCandidates.find((panel) => panel?.key === 'preview')
          : null);
      const focusedPanel = panelCandidates.find((panel) => panel?.key === focusedSection);
      const rightPanelBase = preferredRightPanel
        || focusedPanel
        || panelCandidates[panelCandidates.length - 1];
      const leftCandidates = panelCandidates.filter((panel) => panel?.key !== rightPanelBase?.key);
      const leftWidth = Math.max(30, Math.min(Math.floor(fullWidth * 0.38), fullWidth - 36));
      const rightWidth = Math.max(34, fullWidth - leftWidth - 1);
      const leftPanels = allocateSingleColumnPanels(leftCandidates, contentRowsBudget);
      const rightPanel = {
        ...rightPanelBase,
        maxLines: resolvePanelBodyRows(contentRowsBudget)
      };

      contentNode = React.createElement(
        Box,
        { width: fullWidth, flexDirection: 'row' },
        React.createElement(
          Box,
          { width: leftWidth, flexDirection: 'column' },
          ...leftPanels.map((panel, index) => React.createElement(SectionPanel, {
            key: panel.key,
            title: panel.title,
            lines: panel.lines,
            width: leftWidth,
            maxLines: panel.maxLines,
            borderColor: panel.borderColor,
            marginBottom: densePanels ? 0 : (index === leftPanels.length - 1 ? 0 : 1),
            dense: densePanels,
            focused: paneFocus === 'main' && panel.key === focusedSection
          }))
        ),
        React.createElement(
          Box,
          { width: 1, justifyContent: 'center' },
          React.createElement(Text, { color: 'gray' }, '│')
        ),
        React.createElement(
          Box,
          { width: rightWidth, flexDirection: 'column' },
          React.createElement(SectionPanel, {
            key: rightPanel.key,
            title: rightPanel.title,
            lines: rightPanel.lines,
            width: rightWidth,
            maxLines: rightPanel.maxLines,
            borderColor: rightPanel.borderColor,
            marginBottom: 0,
            dense: densePanels,
            focused: rightPanel.key === 'preview'
              ? paneFocus === 'preview'
              : (rightPanel.key === 'git-diff'
                ? true
                : (paneFocus === 'main' && rightPanel.key === focusedSection))
          })
        )
      );
    } else if (splitPreviewLayout) {
      const previewPanelBase = panelCandidates.find((panel) => panel?.key === 'preview');
      const mainCandidates = panelCandidates.filter((panel) => panel?.key !== 'preview');
      const mainWidth = Math.max(34, Math.floor(fullWidth * 0.56));
      const previewWidth = Math.max(30, fullWidth - mainWidth - 1);
      const mainPanels = allocateSingleColumnPanels(mainCandidates, contentRowsBudget);
      const previewPanel = {
        ...previewPanelBase,
        maxLines: resolvePanelBodyRows(contentRowsBudget)
      };

      contentNode = React.createElement(
        Box,
        { width: fullWidth, flexDirection: 'row' },
        React.createElement(
          Box,
          { width: mainWidth, flexDirection: 'column' },
          ...mainPanels.map((panel, index) => React.createElement(SectionPanel, {
            key: panel.key,
            title: panel.title,
            lines: panel.lines,
            width: mainWidth,
            maxLines: panel.maxLines,
            borderColor: panel.borderColor,
            marginBottom: densePanels ? 0 : (index === mainPanels.length - 1 ? 0 : 1),
            dense: densePanels,
            focused: paneFocus === 'main' && panel.key === focusedSection
          }))
        ),
        React.createElement(
          Box,
          { width: 1, justifyContent: 'center' },
          React.createElement(Text, { color: 'gray' }, '│')
        ),
        React.createElement(
          Box,
          { width: previewWidth, flexDirection: 'column' },
          React.createElement(SectionPanel, {
            key: previewPanel.key,
            title: previewPanel.title,
            lines: previewPanel.lines,
            width: previewWidth,
            maxLines: previewPanel.maxLines,
            borderColor: previewPanel.borderColor,
            marginBottom: 0,
            dense: densePanels,
            focused: paneFocus === 'preview'
          })
        )
      );
    } else {
      contentNode = panels.map((panel, index) => renderPanel(
        panel,
        index,
        fullWidth,
        (ui.showHelp || worktreeOverlayOpen)
          ? true
          : ((panel.key === 'preview' || panel.key === 'preview-overlay')
          ? paneFocus === 'preview'
          : (paneFocus === 'main' && panel.key === focusedSection))
      ));
    }

    return React.createElement(
      Box,
      { flexDirection: 'column', width: fullWidth },
      React.createElement(
        Text,
        { color: 'cyan' },
        buildHeaderLine(snapshot, activeFlow, watchEnabled, watchStatus, lastRefreshAt, ui.view, fullWidth, selectedWorktreeLabel)
      ),
      React.createElement(FlowBar, { activeFlow, width: fullWidth, flowIds: availableFlowIds }),
      React.createElement(TabsBar, { view: ui.view, width: fullWidth, icons, flow: activeFlow }),
      showApprovalBanner
        ? React.createElement(
          Text,
          { color: 'black', backgroundColor: 'yellow', bold: true },
          truncate(approvalGateLine, fullWidth)
        )
        : null,
      showErrorInline
        ? React.createElement(Text, { color: 'red' }, truncate(buildErrorLines(error, fullWidth)[0] || 'Error', fullWidth))
        : null,
      showGlobalErrorPanel
        ? React.createElement(SectionPanel, {
          title: 'Errors',
          lines: buildErrorLines(error, Math.max(18, fullWidth - 4)),
          width: fullWidth,
          maxLines: 2,
          borderColor: 'red',
          marginBottom: densePanels ? 0 : 1,
          dense: densePanels,
          focused: paneFocus === 'main' && focusedSection === 'error-details'
        })
        : null,
      ...(Array.isArray(contentNode) ? contentNode : [contentNode]),
      showLegacyStatusLine
        ? React.createElement(Text, { color: 'yellow' }, truncate(statusLine, fullWidth))
        : null,
      showCommandLogLine
        ? React.createElement(
          Text,
          { color: 'white', backgroundColor: 'gray', bold: true },
          truncate(commandLogLine, fullWidth)
        )
        : null,
      showCommandStrip
        ? React.createElement(
          Text,
          { color: 'white', backgroundColor: 'blue', bold: true },
          truncate(commandStripText, fullWidth)
        )
        : (rows >= 10
          ? React.createElement(Text, { color: 'gray' }, truncate(quickHelpText, fullWidth))
          : null)
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
  allocateSingleColumnPanels,
  detectDashboardApprovalGate,
  detectFireRunApprovalGate,
  detectAidlcBoltApprovalGate
};
