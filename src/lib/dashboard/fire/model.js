function normalizeStatus(status) {
  if (typeof status !== 'string') {
    return undefined;
  }

  const normalized = status.toLowerCase().trim().replace(/[-\s]+/g, '_');
  const map = {
    pending: 'pending',
    todo: 'pending',
    in_progress: 'in_progress',
    inprogress: 'in_progress',
    active: 'in_progress',
    completed: 'completed',
    complete: 'completed',
    done: 'completed',
    blocked: 'blocked'
  };

  return map[normalized];
}

function normalizeMode(mode) {
  if (typeof mode !== 'string') {
    return undefined;
  }

  const normalized = mode.toLowerCase().trim();
  if (normalized === 'autopilot' || normalized === 'confirm' || normalized === 'validate') {
    return normalized;
  }

  return undefined;
}

function normalizeScope(scope) {
  if (typeof scope !== 'string') {
    return undefined;
  }

  const normalized = scope.toLowerCase().trim();
  if (normalized === 'single' || normalized === 'batch' || normalized === 'wide') {
    return normalized;
  }

  return undefined;
}

function normalizeComplexity(complexity) {
  if (typeof complexity !== 'string') {
    return undefined;
  }

  const normalized = complexity.toLowerCase().trim();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high') {
    return normalized;
  }

  return undefined;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTimestamp(value) {
  if (value == null) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value.trim() === '' ? undefined : value;
  }

  return String(value);
}

function parseDependencies(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === 'string' && item.trim() !== '');
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    return [raw.trim()];
  }

  return [];
}

function normalizeRunWorkItem(raw, fallbackIntentId = '') {
  if (typeof raw === 'string') {
    return {
      id: raw,
      intentId: fallbackIntentId,
      mode: 'confirm',
      status: 'pending',
      currentPhase: undefined
    };
  }

  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      intentId: fallbackIntentId,
      mode: 'confirm',
      status: 'pending',
      currentPhase: undefined
    };
  }

  const id = typeof raw.id === 'string' ? raw.id : '';
  const intentId = typeof raw.intent === 'string'
    ? raw.intent
    : (typeof raw.intentId === 'string' ? raw.intentId : fallbackIntentId);

  const status = normalizeStatus(raw.status) || 'pending';
  const mode = normalizeMode(raw.mode) || 'confirm';
  const currentPhase = typeof raw.current_phase === 'string'
    ? raw.current_phase
    : (typeof raw.currentPhase === 'string' ? raw.currentPhase : undefined);

  return {
    id,
    intentId,
    mode,
    status,
    currentPhase
  };
}

function normalizeState(rawState) {
  const raw = rawState && typeof rawState === 'object' ? rawState : {};

  const project = raw.project && typeof raw.project === 'object'
    ? {
      name: typeof raw.project.name === 'string' ? raw.project.name : 'Unknown',
      description: typeof raw.project.description === 'string' ? raw.project.description : undefined,
      created: normalizeTimestamp(raw.project.created) || new Date().toISOString(),
      fireVersion: typeof raw.project.fire_version === 'string'
        ? raw.project.fire_version
        : (typeof raw.project.fireVersion === 'string'
          ? raw.project.fireVersion
          : '0.0.0')
    }
    : null;

  const workspace = raw.workspace && typeof raw.workspace === 'object'
    ? {
      type: typeof raw.workspace.type === 'string' ? raw.workspace.type : 'greenfield',
      structure: typeof raw.workspace.structure === 'string' ? raw.workspace.structure : 'monolith',
      autonomyBias: typeof raw.workspace.autonomy_bias === 'string'
        ? raw.workspace.autonomy_bias
        : (typeof raw.workspace.autonomyBias === 'string' ? raw.workspace.autonomyBias : 'balanced'),
      runScopePreference: normalizeScope(raw.workspace.run_scope_preference)
        || normalizeScope(raw.workspace.runScopePreference)
        || 'single',
      scannedAt: normalizeTimestamp(raw.workspace.scanned_at)
        || normalizeTimestamp(raw.workspace.scannedAt),
      parts: normalizeArray(raw.workspace.parts)
    }
    : null;

  const intents = normalizeArray(raw.intents).map((intent) => {
    if (!intent || typeof intent !== 'object') {
      return null;
    }

    const workItemsRaw = normalizeArray(intent.work_items).concat(normalizeArray(intent.workItems));

    return {
      id: typeof intent.id === 'string' ? intent.id : '',
      title: typeof intent.title === 'string' ? intent.title : '',
      status: normalizeStatus(intent.status),
      workItems: workItemsRaw
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          return {
            id: typeof item.id === 'string' ? item.id : '',
            status: normalizeStatus(item.status) || 'pending',
            mode: normalizeMode(item.mode)
          };
        })
        .filter(Boolean)
    };
  }).filter(Boolean);

  const rawRuns = raw.runs && typeof raw.runs === 'object' ? raw.runs : {};

  const activeRuns = normalizeArray(rawRuns.active).map((run) => {
    if (!run || typeof run !== 'object') {
      return null;
    }

    const workItemsRaw = normalizeArray(run.work_items).concat(normalizeArray(run.workItems));

    return {
      id: typeof run.id === 'string' ? run.id : '',
      scope: normalizeScope(run.scope) || 'single',
      workItems: workItemsRaw.map((item) => normalizeRunWorkItem(item)).filter((item) => item.id !== ''),
      currentItem: typeof run.current_item === 'string'
        ? run.current_item
        : (typeof run.currentItem === 'string' ? run.currentItem : ''),
      started: normalizeTimestamp(run.started) || ''
    };
  }).filter(Boolean);

  const completedRuns = normalizeArray(rawRuns.completed).map((run) => {
    if (!run || typeof run !== 'object') {
      return null;
    }

    const fallbackIntentId = typeof run.intent === 'string' ? run.intent : '';
    const workItemsRaw = normalizeArray(run.work_items).concat(normalizeArray(run.workItems));

    return {
      id: typeof run.id === 'string' ? run.id : '',
      workItems: workItemsRaw.map((item) => normalizeRunWorkItem(item, fallbackIntentId)).filter((item) => item.id !== ''),
      completed: normalizeTimestamp(run.completed) || ''
    };
  }).filter(Boolean);

  return {
    project,
    workspace,
    intents,
    runs: {
      active: activeRuns,
      completed: completedRuns
    }
  };
}

function deriveIntentStatus(stateStatus, workItems) {
  const normalizedState = normalizeStatus(stateStatus);
  if (normalizedState) {
    return normalizedState;
  }

  if (!Array.isArray(workItems) || workItems.length === 0) {
    return 'pending';
  }

  if (workItems.every((item) => item.status === 'completed')) {
    return 'completed';
  }

  if (workItems.some((item) => item.status === 'in_progress')) {
    return 'in_progress';
  }

  if (workItems.some((item) => item.status === 'blocked')) {
    return 'blocked';
  }

  return 'pending';
}

function calculateStats(intents, runs, activeRuns) {
  const safeIntents = Array.isArray(intents) ? intents : [];
  const safeRuns = Array.isArray(runs) ? runs : [];
  const safeActiveRuns = Array.isArray(activeRuns) ? activeRuns : [];
  const workItems = safeIntents.flatMap((intent) => intent.workItems || []);

  return {
    totalIntents: safeIntents.length,
    completedIntents: safeIntents.filter((intent) => intent.status === 'completed').length,
    inProgressIntents: safeIntents.filter((intent) => intent.status === 'in_progress').length,
    pendingIntents: safeIntents.filter((intent) => intent.status === 'pending').length,
    blockedIntents: safeIntents.filter((intent) => intent.status === 'blocked').length,
    totalWorkItems: workItems.length,
    completedWorkItems: workItems.filter((item) => item.status === 'completed').length,
    inProgressWorkItems: workItems.filter((item) => item.status === 'in_progress').length,
    pendingWorkItems: workItems.filter((item) => item.status === 'pending').length,
    blockedWorkItems: workItems.filter((item) => item.status === 'blocked').length,
    totalRuns: safeRuns.length,
    completedRuns: safeRuns.filter((run) => run.completedAt != null).length,
    activeRunsCount: safeActiveRuns.length
  };
}

function buildPendingItems(intents) {
  const pendingItems = [];

  for (const intent of intents || []) {
    for (const item of intent.workItems || []) {
      if (item.status !== 'pending') {
        continue;
      }

      pendingItems.push({
        id: item.id,
        title: item.title,
        intentId: intent.id,
        intentTitle: intent.title,
        mode: item.mode,
        complexity: item.complexity,
        dependencies: item.dependencies || [],
        filePath: item.filePath
      });
    }
  }

  pendingItems.sort((a, b) => {
    const depDiff = (a.dependencies?.length || 0) - (b.dependencies?.length || 0);
    if (depDiff !== 0) {
      return depDiff;
    }
    return a.id.localeCompare(b.id);
  });

  return pendingItems;
}

module.exports = {
  normalizeStatus,
  normalizeMode,
  normalizeScope,
  normalizeComplexity,
  normalizeArray,
  normalizeTimestamp,
  parseDependencies,
  normalizeRunWorkItem,
  normalizeState,
  deriveIntentStatus,
  calculateStats,
  buildPendingItems
};
