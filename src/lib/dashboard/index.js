const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { detectFlow, detectAvailableFlows } = require('./flow-detect');
const { parseFireDashboard } = require('./fire/parser');
const { parseAidlcDashboard } = require('./aidlc/parser');
const { parseSimpleDashboard } = require('./simple/parser');
const { formatDashboardText } = require('./tui/renderer');
const { createDashboardApp } = require('./tui/app');
const { discoverGitWorktrees, pickWorktree, pathExistsAsDirectory } = require('./git/worktrees');
const { listGitChanges } = require('./git/changes');

function parseRefreshMs(raw) {
  const parsed = Number.parseInt(String(raw || '1000'), 10);
  if (Number.isNaN(parsed)) {
    return 1000;
  }

  return Math.max(200, Math.min(parsed, 5000));
}

function clearTerminalOutput(stream = process.stdout) {
  if (!stream || typeof stream.write !== 'function') {
    return;
  }

  if (stream.isTTY === false) {
    return;
  }

  if (typeof console.clear === 'function') {
    console.clear();
  }
  // Avoid wiping scrollback; just clear the current visible frame.
  stream.write('\u001B[H\u001B[J');
}

function createInkStdout(stream = process.stdout) {
  if (!stream || typeof stream.write !== 'function') {
    return stream;
  }

  return {
    isTTY: true,
    get columns() {
      return stream.columns;
    },
    get rows() {
      return stream.rows;
    },
    write: (...args) => stream.write(...args),
    on: (...args) => (typeof stream.on === 'function' ? stream.on(...args) : undefined),
    off: (...args) => (typeof stream.off === 'function' ? stream.off(...args) : undefined),
    once: (...args) => (typeof stream.once === 'function' ? stream.once(...args) : undefined),
    removeListener: (...args) => (typeof stream.removeListener === 'function' ? stream.removeListener(...args) : undefined)
  };
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

const MAX_WORKTREE_WATCH_ROOTS = 12;

function resolveRootPathForFlow(workspacePath, flow) {
  const config = FLOW_CONFIG[flow];
  if (!config) {
    return workspacePath;
  }
  return path.join(workspacePath, config.markerDir);
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function parseFrontmatter(content) {
  const match = String(content || '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }
  try {
    const parsed = yaml.load(match[1]);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function listSubdirectories(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listMarkdownFiles(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function normalizeAidlcStatus(rawStatus) {
  if (typeof rawStatus !== 'string') {
    return 'unknown';
  }

  const normalized = rawStatus.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (['complete', 'completed', 'done', 'finished', 'closed', 'resolved'].includes(normalized)) {
    return 'completed';
  }
  if (['blocked'].includes(normalized)) {
    return 'blocked';
  }
  if (['in-progress', 'inprogress', 'active', 'started', 'wip', 'working', 'ready', 'construction'].includes(normalized)) {
    return 'in_progress';
  }
  if (['draft', 'pending', 'planned', 'todo', 'new', 'queued'].includes(normalized)) {
    return 'pending';
  }
  return 'unknown';
}

function normalizeFlowId(flow) {
  return String(flow || '').toLowerCase().trim();
}

function normalizeFireRunWorkItem(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const id = typeof raw.id === 'string' ? raw.id : '';
  if (id === '') {
    return null;
  }
  return {
    id,
    intentId: typeof raw.intent === 'string' ? raw.intent : (typeof raw.intentId === 'string' ? raw.intentId : ''),
    mode: typeof raw.mode === 'string' ? raw.mode : 'confirm',
    status: typeof raw.status === 'string' ? raw.status : 'pending',
    currentPhase: typeof raw.current_phase === 'string' ? raw.current_phase : (typeof raw.currentPhase === 'string' ? raw.currentPhase : undefined),
    checkpointState: typeof raw.checkpoint_state === 'string'
      ? raw.checkpoint_state
      : (typeof raw.checkpointState === 'string'
        ? raw.checkpointState
        : undefined),
    currentCheckpoint: typeof raw.current_checkpoint === 'string'
      ? raw.current_checkpoint
      : (typeof raw.currentCheckpoint === 'string' ? raw.currentCheckpoint : undefined)
  };
}

function probeFireWorktreeActivity(worktreePath) {
  const rootPath = path.join(worktreePath, '.specs-fire');
  const statePath = path.join(rootPath, 'state.yaml');
  const stateContent = readFileSafe(statePath);
  if (stateContent == null) {
    return { activeRuns: [] };
  }

  let state;
  try {
    state = yaml.load(stateContent) || {};
  } catch {
    return { activeRuns: [] };
  }

  const activeRuns = Array.isArray(state?.runs?.active) ? state.runs.active : [];
  return {
    activeRuns: activeRuns.map((run) => {
      const runId = typeof run?.id === 'string' ? run.id : '';
      if (runId === '') {
        return null;
      }
      const folderPath = path.join(rootPath, 'runs', runId);
      const workItemsRaw = Array.isArray(run?.work_items)
        ? run.work_items
        : (Array.isArray(run?.workItems) ? run.workItems : []);
      const workItems = workItemsRaw.map((item) => normalizeFireRunWorkItem(item)).filter(Boolean);
      return {
        id: runId,
        scope: typeof run?.scope === 'string' ? run.scope : 'single',
        currentItem: typeof run?.current_item === 'string'
          ? run.current_item
          : (typeof run?.currentItem === 'string' ? run.currentItem : ''),
        workItems,
        startedAt: typeof run?.started === 'string' ? run.started : '',
        folderPath,
        hasPlan: fs.existsSync(path.join(folderPath, 'plan.md')),
        hasWalkthrough: fs.existsSync(path.join(folderPath, 'walkthrough.md')),
        hasTestReport: fs.existsSync(path.join(folderPath, 'test-report.md'))
      };
    }).filter(Boolean)
  };
}

function probeAidlcWorktreeActivity(worktreePath) {
  const rootPath = path.join(worktreePath, 'memory-bank');
  const boltsPath = path.join(rootPath, 'bolts');
  const boltIds = listSubdirectories(boltsPath);
  if (boltIds.length === 0) {
    return { activeBolts: [] };
  }

  const activeBolts = boltIds.map((boltId) => {
    const boltPath = path.join(boltsPath, boltId);
    const boltFilePath = path.join(boltPath, 'bolt.md');
    const content = readFileSafe(boltFilePath);
    if (content == null) {
      return null;
    }

    const frontmatter = parseFrontmatter(content);
    const status = normalizeAidlcStatus(frontmatter.status);
    if (status !== 'in_progress') {
      return null;
    }

    const currentStage = typeof frontmatter.current_stage === 'string'
      ? frontmatter.current_stage
      : (typeof frontmatter.currentStage === 'string' ? frontmatter.currentStage : null);

    return {
      id: boltId,
      intent: typeof frontmatter.intent === 'string' ? frontmatter.intent : '',
      unit: typeof frontmatter.unit === 'string' ? frontmatter.unit : '',
      type: typeof frontmatter.type === 'string' ? frontmatter.type : 'simple-construction-bolt',
      status,
      currentStage,
      path: boltPath,
      filePath: boltFilePath,
      files: listMarkdownFiles(boltPath),
      startedAt: typeof frontmatter.started === 'string' ? frontmatter.started : undefined
    };
  }).filter(Boolean);

  return { activeBolts };
}

function probeSimpleWorktreeActivity(worktreePath) {
  const rootPath = path.join(worktreePath, 'specs');
  if (!pathExistsAsDirectory(rootPath)) {
    return { activeSpecs: [] };
  }

  const specFolders = listSubdirectories(rootPath);
  const activeSpecs = specFolders.map((name) => {
    const specPath = path.join(rootPath, name);
    const tasksPath = path.join(specPath, 'tasks.md');
    if (!fs.existsSync(tasksPath)) {
      return null;
    }
    return {
      name,
      path: specPath
    };
  }).filter(Boolean);

  return { activeSpecs };
}

function probeWorktreeActivity(flow, worktreePath) {
  const normalizedFlow = normalizeFlowId(flow);
  if (normalizedFlow === 'aidlc') {
    return probeAidlcWorktreeActivity(worktreePath);
  }
  if (normalizedFlow === 'simple') {
    return probeSimpleWorktreeActivity(worktreePath);
  }
  return probeFireWorktreeActivity(worktreePath);
}

function extractActivityFromSnapshot(flow, snapshot) {
  const normalizedFlow = normalizeFlowId(flow);
  if (normalizedFlow === 'aidlc') {
    return {
      activeBolts: Array.isArray(snapshot?.activeBolts) ? snapshot.activeBolts : []
    };
  }
  if (normalizedFlow === 'simple') {
    return {
      activeSpecs: Array.isArray(snapshot?.activeSpecs) ? snapshot.activeSpecs : []
    };
  }
  return {
    activeRuns: Array.isArray(snapshot?.activeRuns) ? snapshot.activeRuns : []
  };
}

function getActivityCount(flow, activity) {
  const normalizedFlow = normalizeFlowId(flow);
  if (normalizedFlow === 'aidlc') {
    return Array.isArray(activity?.activeBolts) ? activity.activeBolts.length : 0;
  }
  if (normalizedFlow === 'simple') {
    return Array.isArray(activity?.activeSpecs) ? activity.activeSpecs.length : 0;
  }
  return Array.isArray(activity?.activeRuns) ? activity.activeRuns.length : 0;
}

function buildWorktreeEnvelope(flow, worktrees, selectedWorktreeId, cache, discovery) {
  const normalizedFlow = normalizeFlowId(flow);
  const items = (Array.isArray(worktrees) ? worktrees : []).map((worktree) => {
    const availableFlows = detectAvailableFlows(worktree.path);
    const flowAvailable = availableFlows.includes(normalizedFlow);
    const cacheKey = `${normalizedFlow}:${worktree.id}`;
    const cached = cache.get(cacheKey);
    const status = flowAvailable
      ? (cached?.status || 'loading')
      : 'unavailable';
    const activity = cached?.activity || null;
    const activeCount = getActivityCount(normalizedFlow, activity);

    return {
      ...worktree,
      isSelected: worktree.id === selectedWorktreeId,
      flowAvailable,
      status,
      activeCount,
      activity,
      error: cached?.error || null
    };
  });

  return {
    flow: normalizedFlow,
    source: discovery?.source || 'fallback',
    isGitRepo: Boolean(discovery?.isGitRepo),
    selectedWorktreeId,
    hasPendingScans: items.some((item) => item.status === 'loading'),
    error: discovery?.error,
    items
  };
}

function getWatchRootsForEnvelope(flow, envelope) {
  const normalizedFlow = normalizeFlowId(flow);
  const config = FLOW_CONFIG[normalizedFlow];
  if (!config) {
    return [];
  }

  const roots = [];
  const items = Array.isArray(envelope?.items) ? envelope.items : [];
  const selectedId = envelope?.selectedWorktreeId;
  const selectedItem = items.find((item) => item.id === selectedId);

  if (selectedItem) {
    roots.push(resolveRootPathForFlow(selectedItem.path, normalizedFlow));
  }

  for (const item of items) {
    if (item.id === selectedId) {
      continue;
    }
    if (!item.flowAvailable) {
      continue;
    }
    if (item.activeCount <= 0 && item.status !== 'loading') {
      continue;
    }
    roots.push(resolveRootPathForFlow(item.path, normalizedFlow));
  }

  return Array.from(new Set(roots))
    .filter((rootPath) => pathExistsAsDirectory(rootPath))
    .slice(0, MAX_WORKTREE_WATCH_ROOTS);
}

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

async function runFlowDashboard(options, flow, availableFlows = []) {
  const workspacePath = path.resolve(options.path || process.cwd());
  const config = FLOW_CONFIG[flow];

  if (!config) {
    console.error(`Flow \"${flow}\" dashboard is not available yet.`);
    process.exitCode = 1;
    return;
  }

  const flowIds = Array.from(new Set([
    String(flow || '').toLowerCase(),
    ...(Array.isArray(availableFlows) ? availableFlows.map((value) => String(value || '').toLowerCase()) : [])
  ].filter(Boolean)));

  const watchEnabled = options.watch !== false;
  const refreshMs = parseRefreshMs(options.refreshMs);
  const explicitWorktreeSelection = typeof options.worktree === 'string' ? options.worktree.trim() : '';
  let selectedWorktreeId = explicitWorktreeSelection || null;
  let lastWorktreeEnvelope = null;
  const activityCache = new Map();
  const pendingProbes = new Map();

  const parseSnapshotForFlow = async (flowId, context = {}) => {
    const normalizedFlow = normalizeFlowId(flowId);
    const flowConfig = FLOW_CONFIG[normalizedFlow];
    if (!flowConfig) {
      return {
        ok: false,
        error: {
          code: 'UNSUPPORTED_FLOW',
          message: `Flow \"${normalizedFlow}\" is not supported.`
        }
      };
    }

    const discovery = discoverGitWorktrees(workspacePath);
    const worktrees = Array.isArray(discovery?.worktrees) ? discovery.worktrees : [];
    const requestedWorktreeSelector = String(context.selectedWorktreeId || selectedWorktreeId || explicitWorktreeSelection || '').trim();
    const selectedWorktree = pickWorktree(worktrees, requestedWorktreeSelector, workspacePath)
      || pickWorktree(worktrees, workspacePath, workspacePath)
      || worktrees[0];

    selectedWorktreeId = selectedWorktree?.id || selectedWorktreeId;

    const selectedResult = selectedWorktree
      ? await flowConfig.parse(selectedWorktree.path)
      : {
        ok: false,
        error: {
          code: 'WORKTREE_NOT_FOUND',
          message: 'No selectable worktree was found for dashboard parsing.'
        }
      };

    if (selectedWorktree) {
      const cacheKey = `${normalizedFlow}:${selectedWorktree.id}`;
      if (selectedResult?.ok) {
        activityCache.set(cacheKey, {
          status: 'ready',
          activity: extractActivityFromSnapshot(normalizedFlow, selectedResult.snapshot),
          error: null,
          updatedAt: Date.now()
        });
      } else {
        activityCache.set(cacheKey, {
          status: 'error',
          activity: null,
          error: selectedResult?.error || null,
          updatedAt: Date.now()
        });
      }
    }

    for (const worktree of worktrees) {
      if (!worktree || worktree.id === selectedWorktreeId) {
        continue;
      }

      const availableFlowsForWorktree = detectAvailableFlows(worktree.path);
      const flowAvailable = availableFlowsForWorktree.includes(normalizedFlow);
      const cacheKey = `${normalizedFlow}:${worktree.id}`;

      if (!flowAvailable) {
        activityCache.set(cacheKey, {
          status: 'unavailable',
          activity: null,
          error: null,
          updatedAt: Date.now()
        });
        continue;
      }

      const cached = activityCache.get(cacheKey);
      const shouldRefreshProbe = !cached || (Date.now() - (cached.updatedAt || 0)) > 2000;
      if (!shouldRefreshProbe || pendingProbes.has(cacheKey)) {
        continue;
      }

      activityCache.set(cacheKey, {
        status: 'loading',
        activity: cached?.activity || null,
        error: null,
        updatedAt: Date.now()
      });

      const probePromise = Promise.resolve()
        .then(() => probeWorktreeActivity(normalizedFlow, worktree.path))
        .then((activity) => {
          activityCache.set(cacheKey, {
            status: 'ready',
            activity,
            error: null,
            updatedAt: Date.now()
          });
        })
        .catch((probeError) => {
          activityCache.set(cacheKey, {
            status: 'error',
            activity: null,
            error: {
              code: 'WORKTREE_PROBE_ERROR',
              message: probeError?.message || String(probeError)
            },
            updatedAt: Date.now()
          });
        })
        .finally(() => {
          pendingProbes.delete(cacheKey);
        });

      pendingProbes.set(cacheKey, probePromise);
    }

    const envelope = buildWorktreeEnvelope(
      normalizedFlow,
      worktrees,
      selectedWorktreeId,
      activityCache,
      discovery
    );
    lastWorktreeEnvelope = envelope;

    if (!selectedResult?.ok) {
      return {
        ok: false,
        error: {
          ...(selectedResult?.error || {
            code: 'PARSE_ERROR',
            message: 'Unable to parse selected worktree snapshot.'
          }),
          details: selectedWorktree
            ? `worktree: ${selectedWorktree.displayBranch} (${selectedWorktree.path})`
            : undefined
        }
      };
    }

    return {
      ok: true,
      snapshot: {
        ...selectedResult.snapshot,
        workspacePath: selectedWorktree?.path || selectedResult.snapshot?.workspacePath || workspacePath,
        dashboardWorktrees: envelope,
        gitChanges: listGitChanges(selectedWorktree?.path || workspacePath)
      }
    };
  };

  const initialResult = await parseSnapshotForFlow(flow, {
    selectedWorktreeId: selectedWorktreeId || explicitWorktreeSelection || workspacePath
  });
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
  let inkUi = null;
  try {
    inkUi = await import('@inkjs/ui');
  } catch {
    inkUi = null;
  }
  const reactNamespace = await import('react');
  const React = reactNamespace.default || reactNamespace;

  const App = createDashboardApp({
    React,
    ink,
    inkUi,
    parseSnapshotForFlow,
    workspacePath,
    flow,
    availableFlows: flowIds,
    resolveRootPathForFlow: (flowId) => resolveRootPathForFlow(workspacePath, flowId),
    resolveRootPathsForFlow: (flowId) => {
      if (!lastWorktreeEnvelope) {
        return [resolveRootPathForFlow(workspacePath, flowId)];
      }
      const roots = getWatchRootsForEnvelope(flowId, lastWorktreeEnvelope);
      if (roots.length > 0) {
        return roots;
      }
      return [resolveRootPathForFlow(workspacePath, flowId)];
    },
    refreshMs,
    watchEnabled,
    initialSnapshot: initialResult.ok ? initialResult.snapshot : null,
    initialError: initialResult.ok ? null : initialResult.error
  });

  const { waitUntilExit } = ink.render(React.createElement(App), {
    exitOnCtrlC: true,
    stdout: createInkStdout(process.stdout),
    stdin: process.stdin
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

  await runFlowDashboard(options, detection.flow, detection.availableFlows);
}

module.exports = {
  run,
  runFlowDashboard,
  parseRefreshMs,
  formatStaticFlowText,
  clearTerminalOutput,
  createInkStdout,
  probeWorktreeActivity,
  getWatchRootsForEnvelope
};
