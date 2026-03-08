const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const {
  normalizeStatus,
  normalizeMode,
  normalizeScope,
  normalizeComplexity,
  normalizeState,
  deriveIntentStatus,
  calculateStats,
  parseDependencies,
  buildPendingItems,
  normalizeRunWorkItem
} = require('./model');

const STANDARD_TYPES = [
  'constitution',
  'tech-stack',
  'coding-standards',
  'testing-standards',
  'system-architecture'
];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }

  try {
    return yaml.load(match[1]) || {};
  } catch {
    return {};
  }
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
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
    return fs.readdirSync(dirPath)
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function getFirstStringValue(record, keys) {
  if (!record || typeof record !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

function parseRunLog(runLogPath) {
  const content = readFileSafe(runLogPath);
  if (!content) {
    return {
      scope: undefined,
      workItems: [],
      currentItem: null,
      startedAt: undefined,
      completedAt: undefined,
      checkpointState: undefined,
      currentCheckpoint: undefined
    };
  }

  const frontmatter = parseFrontmatter(content);
  const currentItem = getFirstStringValue(frontmatter, ['current_item', 'currentItem', 'work_item', 'workItem']);
  const itemMode = getFirstStringValue(frontmatter, ['mode']);
  const itemStatus = getFirstStringValue(frontmatter, ['status']);
  const itemPhase = getFirstStringValue(frontmatter, ['current_phase', 'currentPhase']);
  const itemCheckpointState = getFirstStringValue(frontmatter, [
    'checkpoint_state',
    'checkpointState',
    'approval_state',
    'approvalState'
  ]);
  const itemCheckpoint = getFirstStringValue(frontmatter, ['current_checkpoint', 'currentCheckpoint', 'checkpoint']);

  const workItemsRaw = Array.isArray(frontmatter.work_items)
    ? frontmatter.work_items
    : (Array.isArray(frontmatter.workItems) ? frontmatter.workItems : []);

  if (workItemsRaw.length === 0 && typeof currentItem === 'string' && currentItem !== '') {
    workItemsRaw.push({
      id: currentItem,
      mode: itemMode,
      status: itemStatus,
      current_phase: itemPhase,
      checkpoint_state: itemCheckpointState,
      current_checkpoint: itemCheckpoint
    });
  }

  const workItems = workItemsRaw
    .map((item) => normalizeRunWorkItem(item))
    .filter((item) => item.id !== '');

  return {
    scope: normalizeScope(frontmatter.scope),
    workItems,
    currentItem: currentItem || null,
    startedAt: typeof frontmatter.started === 'string' ? frontmatter.started : undefined,
    completedAt: typeof frontmatter.completed === 'string'
      ? frontmatter.completed
      : undefined,
    checkpointState: itemCheckpointState,
    currentCheckpoint: itemCheckpoint
  };
}

function mergeRunWorkItems(primaryItems, fallbackItems) {
  const primary = Array.isArray(primaryItems) ? primaryItems : [];
  const fallback = Array.isArray(fallbackItems) ? fallbackItems : [];

  if (primary.length === 0) {
    return fallback;
  }

  if (fallback.length === 0) {
    return primary;
  }

  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  const merged = primary.map((item) => {
    const fallbackItem = fallbackById.get(item.id);
    if (!fallbackItem) {
      return item;
    }

    return {
      ...fallbackItem,
      ...item,
      checkpointState: item.checkpointState || fallbackItem.checkpointState,
      currentCheckpoint: item.currentCheckpoint || fallbackItem.currentCheckpoint,
      currentPhase: item.currentPhase || fallbackItem.currentPhase
    };
  });

  const knownIds = new Set(merged.map((item) => item.id));
  for (const fallbackItem of fallback) {
    if (!knownIds.has(fallbackItem.id)) {
      merged.push(fallbackItem);
    }
  }

  return merged;
}

function scanWorkItems(intentPath, intentId, stateWorkItems, warnings) {
  const workItemsPath = path.join(intentPath, 'work-items');
  const fileWorkItemIds = listMarkdownFiles(workItemsPath)
    .map((file) => file.replace(/\.md$/, ''));

  const stateWorkItemIds = (stateWorkItems || []).map((item) => item.id).filter(Boolean);
  const uniqueIds = Array.from(new Set([...fileWorkItemIds, ...stateWorkItemIds])).sort((a, b) => a.localeCompare(b));

  const stateMap = new Map((stateWorkItems || []).map((item) => [item.id, item]));

  return uniqueIds.map((workItemId) => {
    const stateItem = stateMap.get(workItemId);
    const filePath = path.join(workItemsPath, `${workItemId}.md`);

    let frontmatter = {};
    if (fs.existsSync(filePath)) {
      frontmatter = parseFrontmatter(readFileSafe(filePath) || '');
    } else if (stateItem) {
      warnings.push(`Work item ${intentId}/${workItemId} exists in state.yaml but markdown file is missing.`);
    }

    const dependencies = parseDependencies(frontmatter.depends_on ?? frontmatter.dependencies);

    return {
      id: workItemId,
      intentId,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : workItemId,
      status: normalizeStatus(stateItem?.status || frontmatter.status) || 'pending',
      mode: normalizeMode(stateItem?.mode || frontmatter.mode) || 'confirm',
      complexity: normalizeComplexity(frontmatter.complexity) || 'medium',
      filePath,
      description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
      dependencies,
      createdAt: typeof frontmatter.created === 'string' ? frontmatter.created : undefined,
      completedAt: typeof frontmatter.completed_at === 'string' ? frontmatter.completed_at : undefined
    };
  });
}

function scanIntents(rootPath, normalizedState, warnings) {
  const intentsPath = path.join(rootPath, 'intents');
  const dirIntentIds = listSubdirectories(intentsPath);
  const stateIntentIds = (normalizedState.intents || []).map((intent) => intent.id).filter(Boolean);
  const uniqueIntentIds = Array.from(new Set([...dirIntentIds, ...stateIntentIds])).sort((a, b) => a.localeCompare(b));

  const stateIntentMap = new Map((normalizedState.intents || []).map((intent) => [intent.id, intent]));

  return uniqueIntentIds.map((intentId) => {
    const stateIntent = stateIntentMap.get(intentId);
    const intentPath = path.join(intentsPath, intentId);
    const briefPath = path.join(intentPath, 'brief.md');

    let frontmatter = {};
    if (fs.existsSync(briefPath)) {
      frontmatter = parseFrontmatter(readFileSafe(briefPath) || '');
    } else if (stateIntent) {
      warnings.push(`Intent ${intentId} exists in state.yaml but brief.md is missing.`);
    }

    const workItems = scanWorkItems(
      intentPath,
      intentId,
      stateIntent?.workItems || [],
      warnings
    );

    return {
      id: intentId,
      title: typeof frontmatter.title === 'string'
        ? frontmatter.title
        : (stateIntent?.title || intentId),
      status: deriveIntentStatus(stateIntent?.status, workItems),
      filePath: briefPath,
      description: typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
      workItems,
      createdAt: typeof frontmatter.created === 'string' ? frontmatter.created : undefined,
      completedAt: typeof frontmatter.completed_at === 'string' ? frontmatter.completed_at : undefined
    };
  });
}

function scanRuns(rootPath, normalizedState) {
  const runsPath = path.join(rootPath, 'runs');
  const runDirs = listSubdirectories(runsPath).filter((name) => name.startsWith('run-'));

  const stateActiveMap = new Map((normalizedState.runs?.active || []).map((run) => [run.id, run]));
  const stateCompletedMap = new Map((normalizedState.runs?.completed || []).map((run) => [run.id, run]));

  const runIds = Array.from(new Set([
    ...runDirs,
    ...Array.from(stateActiveMap.keys()),
    ...Array.from(stateCompletedMap.keys())
  ])).sort((a, b) => a.localeCompare(b));

  return runIds.map((runId) => {
    const folderPath = path.join(runsPath, runId);
    const runLogPath = path.join(folderPath, 'run.md');
    const parsedRunLog = parseRunLog(runLogPath);

    const stateActiveRun = stateActiveMap.get(runId);
    const stateCompletedRun = stateCompletedMap.get(runId);

    const stateRunWorkItems = (stateActiveRun?.workItems && stateActiveRun.workItems.length > 0)
      ? stateActiveRun.workItems
      : ((stateCompletedRun?.workItems && stateCompletedRun.workItems.length > 0)
        ? stateCompletedRun.workItems
        : []);
    const workItems = mergeRunWorkItems(
      stateRunWorkItems.length > 0 ? stateRunWorkItems : parsedRunLog.workItems,
      parsedRunLog.workItems
    );

    const completedAt = stateCompletedRun?.completed || parsedRunLog.completedAt || undefined;

    return {
      id: runId,
      scope: stateActiveRun?.scope || parsedRunLog.scope || 'single',
      workItems,
      currentItem: stateActiveRun?.currentItem || parsedRunLog.currentItem || null,
      checkpointState: stateActiveRun?.checkpointState || parsedRunLog.checkpointState,
      currentCheckpoint: stateActiveRun?.currentCheckpoint || parsedRunLog.currentCheckpoint,
      folderPath,
      startedAt: stateActiveRun?.started || parsedRunLog.startedAt || '',
      completedAt: completedAt === 'null' ? undefined : completedAt,
      hasPlan: fs.existsSync(path.join(folderPath, 'plan.md')),
      hasWalkthrough: fs.existsSync(path.join(folderPath, 'walkthrough.md')),
      hasTestReport: fs.existsSync(path.join(folderPath, 'test-report.md'))
    };
  });
}

function scanStandards(rootPath) {
  const standardsPath = path.join(rootPath, 'standards');

  return STANDARD_TYPES
    .filter((type) => fs.existsSync(path.join(standardsPath, `${type}.md`)))
    .map((type) => ({
      type,
      filePath: path.join(standardsPath, `${type}.md`),
      scope: 'root'
    }));
}

function buildActiveRuns(runs, normalizedState) {
  const byId = new Map((runs || []).map((run) => [run.id, run]));

  return (normalizedState.runs?.active || [])
    .map((active) => byId.get(active.id) || null)
    .filter(Boolean);
}

function buildCompletedRuns(runs) {
  return (runs || [])
    .filter((run) => run.completedAt != null)
    .sort((a, b) => {
      const aTime = a.completedAt ? Date.parse(a.completedAt) : 0;
      const bTime = b.completedAt ? Date.parse(b.completedAt) : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      return b.id.localeCompare(a.id);
    });
}

function createUninitializedSnapshot(workspacePath, rootPath) {
  return {
    flow: 'fire',
    isProject: true,
    initialized: false,
    workspacePath,
    rootPath,
    version: '0.0.0',
    project: null,
    workspace: null,
    intents: [],
    runs: [],
    activeRuns: [],
    completedRuns: [],
    pendingItems: [],
    standards: scanStandards(rootPath),
    stats: {
      totalIntents: 0,
      completedIntents: 0,
      inProgressIntents: 0,
      pendingIntents: 0,
      blockedIntents: 0,
      totalWorkItems: 0,
      completedWorkItems: 0,
      inProgressWorkItems: 0,
      pendingWorkItems: 0,
      blockedWorkItems: 0,
      totalRuns: 0,
      completedRuns: 0,
      activeRunsCount: 0
    },
    warnings: ['FIRE folder exists but state.yaml has not been created yet.'],
    generatedAt: new Date().toISOString()
  };
}

function parseStateFile(statePath) {
  const content = readFileSafe(statePath);
  if (content == null) {
    throw new Error('Unable to read state.yaml');
  }

  const parsed = yaml.load(content);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('state.yaml is empty or invalid.');
  }

  return parsed;
}

function parseFireDashboard(workspacePath) {
  const rootPath = path.join(workspacePath, '.specs-fire');

  if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
    return {
      ok: false,
      error: {
        code: 'FIRE_NOT_FOUND',
        message: `No FIRE workspace found at ${rootPath}`,
        hint: 'Install FIRE flow or run this command from a FIRE project root.'
      }
    };
  }

  const statePath = path.join(rootPath, 'state.yaml');
  if (!fs.existsSync(statePath)) {
    return {
      ok: true,
      snapshot: createUninitializedSnapshot(workspacePath, rootPath)
    };
  }

  let rawState;
  try {
    rawState = parseStateFile(statePath);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'STATE_PARSE_ERROR',
        message: `Failed to parse ${statePath}`,
        details: error.message,
        path: statePath
      }
    };
  }

  const warnings = [];
  const normalizedState = normalizeState(rawState);
  const intents = scanIntents(rootPath, normalizedState, warnings);
  const runs = scanRuns(rootPath, normalizedState);
  const activeRuns = buildActiveRuns(runs, normalizedState);
  const completedRuns = buildCompletedRuns(runs);
  const standards = scanStandards(rootPath);
  const pendingItems = buildPendingItems(intents);
  const stats = calculateStats(intents, runs, activeRuns);

  return {
    ok: true,
    snapshot: {
      flow: 'fire',
      isProject: true,
      initialized: true,
      workspacePath,
      rootPath,
      version: normalizedState.project?.fireVersion || '0.0.0',
      project: normalizedState.project,
      workspace: normalizedState.workspace,
      intents,
      runs,
      activeRuns,
      completedRuns,
      pendingItems,
      standards,
      stats,
      warnings,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  STANDARD_TYPES,
  parseFrontmatter,
  parseRunLog,
  parseFireDashboard
};
