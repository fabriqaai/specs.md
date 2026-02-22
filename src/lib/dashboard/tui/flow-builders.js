const path = require('path');
const { truncate, formatTime, fileExists, readFileTextSafe, normalizeToken } = require('./helpers');

function buildShortStats(snapshot, flow) {
  if (!snapshot?.initialized) {
    if (flow === 'aidlc') {
      return 'init: waiting for memory-bank scan';
    }
    if (flow === 'simple') {
      return 'init: waiting for specs scan';
    }
    return 'init: waiting for state.yaml';
  }

  const stats = snapshot?.stats || {};

  if (flow === 'aidlc') {
    return `bolts ${stats.activeBoltsCount || 0}/${stats.completedBolts || 0} | intents ${stats.completedIntents || 0}/${stats.totalIntents || 0} | stories ${stats.completedStories || 0}/${stats.totalStories || 0}`;
  }

  if (flow === 'simple') {
    return `specs ${stats.completedSpecs || 0}/${stats.totalSpecs || 0} | tasks ${stats.completedTasks || 0}/${stats.totalTasks || 0} | active ${stats.activeSpecsCount || 0}`;
  }

  return `runs ${stats.activeRunsCount || 0}/${stats.completedRuns || 0} | intents ${stats.completedIntents || 0}/${stats.totalIntents || 0} | work ${stats.completedWorkItems || 0}/${stats.totalWorkItems || 0}`;
}

function buildHeaderLine(snapshot, flow, watchEnabled, watchStatus, lastRefreshAt, view, width, worktreeLabel = null) {
  const projectName = snapshot?.project?.name || 'Unnamed project';
  const shortStats = buildShortStats(snapshot, flow);
  const worktreeSegment = worktreeLabel ? ` | wt:${worktreeLabel}` : '';
  const line = `${flow.toUpperCase()} | ${projectName} | ${shortStats} | watch:${watchEnabled ? watchStatus : 'off'}${worktreeSegment} | ${view} | ${formatTime(lastRefreshAt)}`;

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

function getCurrentFireWorkItem(run) {
  const workItems = Array.isArray(run?.workItems) ? run.workItems : [];
  if (workItems.length === 0) {
    return null;
  }
  return workItems.find((item) => item.id === run.currentItem)
    || workItems.find((item) => normalizeToken(item?.status) === 'in_progress')
    || workItems[0]
    || null;
}

function extractFrontmatterBlock(content) {
  if (typeof content !== 'string') {
    return null;
  }
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function extractFrontmatterValue(frontmatterBlock, key) {
  if (typeof frontmatterBlock !== 'string' || typeof key !== 'string' || key === '') {
    return null;
  }

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`^${escapedKey}\\s*:\\s*(.+)$`, 'mi');
  const match = frontmatterBlock.match(expression);
  if (!match) {
    return null;
  }

  const raw = String(match[1] || '').trim();
  if (raw === '') {
    return '';
  }

  return raw
    .replace(/^["']/, '')
    .replace(/["']$/, '')
    .trim();
}

const FIRE_AWAITING_APPROVAL_STATES = new Set([
  'awaiting_approval',
  'waiting',
  'pending_approval',
  'approval_needed',
  'approval_required',
  'checkpoint_pending'
]);

const FIRE_APPROVED_STATES = new Set([
  'approved',
  'confirmed',
  'accepted',
  'resumed',
  'done',
  'completed',
  'cleared',
  'none',
  'not_required',
  'skipped'
]);

function parseFirePlanCheckpointMetadata(run) {
  if (!run || typeof run.folderPath !== 'string' || run.folderPath.trim() === '') {
    return { hasPlan: false, checkpointState: null, checkpoint: null };
  }

  const planPath = path.join(run.folderPath, 'plan.md');
  if (!fileExists(planPath)) {
    return { hasPlan: false, checkpointState: null, checkpoint: null };
  }

  const content = readFileTextSafe(planPath);
  const frontmatter = extractFrontmatterBlock(content);
  if (!frontmatter) {
    return { hasPlan: true, checkpointState: null, checkpoint: null };
  }

  const checkpointState = normalizeToken(
    extractFrontmatterValue(frontmatter, 'checkpoint_state')
    || extractFrontmatterValue(frontmatter, 'checkpointState')
    || extractFrontmatterValue(frontmatter, 'approval_state')
    || extractFrontmatterValue(frontmatter, 'approvalState')
    || ''
  ) || null;
  const checkpoint = extractFrontmatterValue(frontmatter, 'current_checkpoint')
    || extractFrontmatterValue(frontmatter, 'currentCheckpoint')
    || extractFrontmatterValue(frontmatter, 'checkpoint')
    || null;

  return {
    hasPlan: true,
    checkpointState,
    checkpoint
  };
}

function resolveFireApprovalState(run, currentWorkItem) {
  const itemState = normalizeToken(
    currentWorkItem?.checkpointState
    || currentWorkItem?.checkpoint_state
    || currentWorkItem?.approvalState
    || currentWorkItem?.approval_state
    || ''
  );
  const runState = normalizeToken(
    run?.checkpointState
    || run?.checkpoint_state
    || run?.approvalState
    || run?.approval_state
    || ''
  );
  const planState = parseFirePlanCheckpointMetadata(run);
  const state = itemState || runState || planState.checkpointState || null;
  const checkpointValue = currentWorkItem?.currentCheckpoint
    || currentWorkItem?.current_checkpoint
    || run?.currentCheckpoint
    || run?.current_checkpoint
    || planState.checkpoint
    || null;

  return {
    state,
    checkpoint: checkpointValue,
    source: itemState
      ? 'item-state'
      : (runState
        ? 'run-state'
        : (planState.checkpointState ? 'plan-frontmatter' : null))
  };
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

function getFireRunApprovalGate(run, currentWorkItem) {
  const mode = normalizeToken(currentWorkItem?.mode);
  const status = normalizeToken(currentWorkItem?.status);
  if (!['confirm', 'validate'].includes(mode) || status !== 'in_progress') {
    return null;
  }

  const phase = normalizeToken(getCurrentPhaseLabel(run, currentWorkItem));
  if (phase !== 'plan') {
    return null;
  }

  const resolvedApproval = resolveFireApprovalState(run, currentWorkItem);
  if (!resolvedApproval.state) {
    return null;
  }

  if (FIRE_APPROVED_STATES.has(resolvedApproval.state)) {
    return null;
  }

  if (!FIRE_AWAITING_APPROVAL_STATES.has(resolvedApproval.state)) {
    return null;
  }

  const modeLabel = String(currentWorkItem?.mode || 'confirm').toUpperCase();
  const itemId = String(currentWorkItem?.id || run.currentItem || 'unknown-item');
  const checkpointLabel = String(resolvedApproval.checkpoint || 'plan').replace(/[_\s]+/g, '-');

  return {
    flow: 'fire',
    title: 'Approval Needed',
    message: `${run.id}: ${itemId} (${modeLabel}) is waiting at ${checkpointLabel} checkpoint`,
    checkpoint: checkpointLabel,
    source: resolvedApproval.source
  };
}

function isFireRunAwaitingApproval(run, currentWorkItem) {
  return Boolean(getFireRunApprovalGate(run, currentWorkItem));
}

function detectFireRunApprovalGate(snapshot) {
  const run = getCurrentRun(snapshot);
  if (!run) {
    return null;
  }

  const currentWorkItem = getCurrentFireWorkItem(run);
  if (!currentWorkItem) {
    return null;
  }

  return getFireRunApprovalGate(run, currentWorkItem);
}

function normalizeStageName(stage) {
  return normalizeToken(stage).replace(/_/g, '-');
}

function getAidlcCheckpointSignalFiles(boltType, stageName) {
  const normalizedType = normalizeToken(boltType).replace(/_/g, '-');
  const normalizedStage = normalizeStageName(stageName);

  if (normalizedType === 'simple-construction-bolt') {
    if (normalizedStage === 'plan') return ['implementation-plan.md'];
    if (normalizedStage === 'implement') return ['implementation-walkthrough.md'];
    if (normalizedStage === 'test') return ['test-walkthrough.md'];
    return [];
  }

  if (normalizedType === 'ddd-construction-bolt') {
    if (normalizedStage === 'model') return ['ddd-01-domain-model.md'];
    if (normalizedStage === 'design') return ['ddd-02-technical-design.md'];
    if (normalizedStage === 'implement') return ['implementation-walkthrough.md'];
    if (normalizedStage === 'test') return ['ddd-03-test-report.md'];
    return [];
  }

  if (normalizedType === 'spike-bolt') {
    if (normalizedStage === 'explore') return ['spike-exploration.md'];
    if (normalizedStage === 'document') return ['spike-report.md'];
    return [];
  }

  return [];
}

function hasAidlcCheckpointSignal(bolt, stageName) {
  const fileNames = Array.isArray(bolt?.files) ? bolt.files : [];
  const lowerNames = new Set(fileNames.map((name) => String(name || '').toLowerCase()));
  const expectedFiles = getAidlcCheckpointSignalFiles(bolt?.type, stageName)
    .map((name) => String(name).toLowerCase());

  for (const expectedFile of expectedFiles) {
    if (lowerNames.has(expectedFile)) {
      return true;
    }
  }

  if (normalizeStageName(stageName) === 'adr') {
    for (const name of lowerNames) {
      if (/^adr-[\w-]+\.md$/.test(name)) {
        return true;
      }
    }
  }

  return false;
}

function isAidlcBoltAwaitingApproval(bolt) {
  if (!bolt || normalizeToken(bolt.status) !== 'in_progress') {
    return false;
  }

  const currentStage = normalizeStageName(bolt.currentStage);
  if (!currentStage) {
    return false;
  }

  const stages = Array.isArray(bolt.stages) ? bolt.stages : [];
  const stageMeta = stages.find((stage) => normalizeStageName(stage?.name) === currentStage);
  if (normalizeToken(stageMeta?.status) === 'completed') {
    return false;
  }

  return hasAidlcCheckpointSignal(bolt, currentStage);
}

function getCurrentBolt(snapshot) {
  const activeBolts = Array.isArray(snapshot?.activeBolts) ? [...snapshot.activeBolts] : [];
  if (activeBolts.length === 0) {
    return null;
  }

  activeBolts.sort((a, b) => {
    const aTime = a?.startedAt ? Date.parse(a.startedAt) : 0;
    const bTime = b?.startedAt ? Date.parse(b.startedAt) : 0;
    if (bTime !== aTime) {
      return bTime - aTime;
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });

  return activeBolts[0] || null;
}

function detectAidlcBoltApprovalGate(snapshot) {
  const bolt = getCurrentBolt(snapshot);
  if (!bolt) {
    return null;
  }

  if (!isAidlcBoltAwaitingApproval(bolt)) {
    return null;
  }

  return {
    flow: 'aidlc',
    title: 'Approval Needed',
    message: `${bolt.id}: ${bolt.currentStage || 'current'} stage is waiting for confirmation`
  };
}

function getEffectiveFlow(flow, snapshot) {
  const explicitFlow = typeof flow === 'string' && flow !== '' ? flow : null;
  const snapshotFlow = typeof snapshot?.flow === 'string' && snapshot.flow !== '' ? snapshot.flow : null;
  return (snapshotFlow || explicitFlow || 'fire').toLowerCase();
}

function detectDashboardApprovalGate(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'fire') {
    return detectFireRunApprovalGate(snapshot);
  }
  if (effectiveFlow === 'aidlc') {
    return detectAidlcBoltApprovalGate(snapshot);
  }
  return null;
}

function buildPhaseTrack(currentPhase) {
  const order = ['plan', 'execute', 'test', 'review'];
  const labels = ['P', 'E', 'T', 'R'];
  const currentIndex = Math.max(0, order.indexOf(currentPhase));
  return labels.map((label, index) => (index === currentIndex ? `[${label}]` : ` ${label} `)).join(' - ');
}

function buildFireCurrentRunLines(snapshot, width) {
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

function buildFirePendingLines(snapshot, width) {
  const pending = snapshot?.pendingItems || [];
  if (pending.length === 0) {
    return [truncate('No pending work items', width)];
  }

  return pending.map((item) => {
    const deps = item.dependencies && item.dependencies.length > 0 ? ` deps:${item.dependencies.join(',')}` : '';
    return truncate(`${item.id} (${item.mode}/${item.complexity}) in ${item.intentTitle}${deps}`, width);
  });
}

function buildFireCompletedLines(snapshot, width) {
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

function buildFireStatsLines(snapshot, width) {
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

function buildFireOverviewProjectLines(snapshot, width) {
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

function buildFireOverviewIntentLines(snapshot, width) {
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

function buildFireOverviewStandardsLines(snapshot, width) {
  const expected = ['constitution', 'tech-stack', 'coding-standards', 'testing-standards', 'system-architecture'];
  const actual = new Set((snapshot?.standards || []).map((item) => item.type));

  return expected.map((name) => {
    const marker = actual.has(name) ? '[x]' : '[ ]';
    return truncate(`${marker} ${name}.md`, width);
  });
}

function buildAidlcStageTrack(bolt) {
  const stages = Array.isArray(bolt?.stages) ? bolt.stages : [];
  if (stages.length === 0) {
    return 'n/a';
  }

  return stages.map((stage) => {
    const label = String(stage?.name || '?').charAt(0).toUpperCase();
    if (stage?.status === 'completed') {
      return `[${label}]`;
    }
    if (stage?.status === 'in_progress') {
      return `<${label}>`;
    }
    return ` ${label} `;
  }).join('-');
}

function buildAidlcCurrentRunLines(snapshot, width) {
  const bolt = getCurrentBolt(snapshot);
  if (!bolt) {
    return [truncate('No active bolt', width)];
  }

  const stages = Array.isArray(bolt.stages) ? bolt.stages : [];
  const completedStages = stages.filter((stage) => stage.status === 'completed').length;
  const phaseTrack = buildAidlcStageTrack(bolt);
  const location = `${bolt.intent || 'unknown-intent'} / ${bolt.unit || 'unknown-unit'}`;

  const lines = [
    `${bolt.id}  [${bolt.type}]  ${completedStages}/${stages.length} stages done`,
    `scope: ${location}`,
    `stage: ${bolt.currentStage || 'n/a'}  |  status: ${bolt.status}`,
    `phase: ${phaseTrack}`
  ];

  return lines.map((line) => truncate(line, width));
}

function buildAidlcPendingLines(snapshot, width) {
  const pendingBolts = Array.isArray(snapshot?.pendingBolts) ? snapshot.pendingBolts : [];
  if (pendingBolts.length === 0) {
    return [truncate('No queued bolts', width)];
  }

  return pendingBolts.map((bolt) => {
    const deps = Array.isArray(bolt.blockedBy) && bolt.blockedBy.length > 0
      ? ` blocked_by:${bolt.blockedBy.join(',')}`
      : '';
    const location = `${bolt.intent || 'unknown'}/${bolt.unit || 'unknown'}`;
    return truncate(`${bolt.id} (${bolt.status}) in ${location}${deps}`, width);
  });
}

function buildAidlcCompletedLines(snapshot, width) {
  const completedBolts = Array.isArray(snapshot?.completedBolts) ? snapshot.completedBolts : [];
  if (completedBolts.length === 0) {
    return [truncate('No completed bolts yet', width)];
  }

  return completedBolts.map((bolt) =>
    truncate(`${bolt.id} [${bolt.type}] done at ${bolt.completedAt || 'unknown'}`, width)
  );
}

function buildAidlcStatsLines(snapshot, width) {
  const stats = snapshot?.stats || {};

  return [
    `intents: ${stats.completedIntents || 0}/${stats.totalIntents || 0} done | in_progress: ${stats.inProgressIntents || 0} | blocked: ${stats.blockedIntents || 0}`,
    `stories: ${stats.completedStories || 0}/${stats.totalStories || 0} done | in_progress: ${stats.inProgressStories || 0} | pending: ${stats.pendingStories || 0} | blocked: ${stats.blockedStories || 0}`,
    `bolts: ${stats.activeBoltsCount || 0} active | ${stats.queuedBolts || 0} queued | ${stats.blockedBolts || 0} blocked | ${stats.completedBolts || 0} done`
  ].map((line) => truncate(line, width));
}

function buildAidlcOverviewProjectLines(snapshot, width) {
  const project = snapshot?.project || {};
  const stats = snapshot?.stats || {};

  return [
    `project: ${project.name || 'unknown'} | project_type: ${project.projectType || 'unknown'}`,
    `memory-bank: intents ${stats.totalIntents || 0} | units ${stats.totalUnits || 0} | stories ${stats.totalStories || 0}`,
    `progress: ${stats.progressPercent || 0}% stories complete | standards: ${(snapshot?.standards || []).length}`
  ].map((line) => truncate(line, width));
}

function buildAidlcOverviewIntentLines(snapshot, width) {
  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
  if (intents.length === 0) {
    return [truncate('No intents found', width)];
  }

  return intents.map((intent) => {
    return truncate(
      `${intent.id}: ${intent.status} (${intent.completedStories || 0}/${intent.storyCount || 0} stories, ${intent.completedUnits || 0}/${intent.unitCount || 0} units)`,
      width
    );
  });
}

function buildAidlcOverviewStandardsLines(snapshot, width) {
  const standards = Array.isArray(snapshot?.standards) ? snapshot.standards : [];
  if (standards.length === 0) {
    return [truncate('No standards found under memory-bank/standards', width)];
  }

  return standards.map((standard) =>
    truncate(`[x] ${standard.name || standard.type || 'unknown'}.md`, width)
  );
}

function getCurrentSpec(snapshot) {
  const specs = Array.isArray(snapshot?.activeSpecs) ? snapshot.activeSpecs : [];
  if (specs.length === 0) {
    return null;
  }
  return specs[0] || null;
}

function simplePhaseIndex(state) {
  if (state === 'requirements_pending') {
    return 0;
  }
  if (state === 'design_pending') {
    return 1;
  }
  return 2;
}

function buildSimplePhaseTrack(spec) {
  if (spec?.state === 'completed') {
    return '[R] - [D] - [T]';
  }

  const labels = ['R', 'D', 'T'];
  const current = simplePhaseIndex(spec?.state);
  return labels.map((label, index) => (index === current ? `[${label}]` : ` ${label} `)).join(' - ');
}

function buildSimpleCurrentRunLines(snapshot, width) {
  const spec = getCurrentSpec(snapshot);
  if (!spec) {
    return [truncate('No active spec', width)];
  }

  const files = [
    spec.hasRequirements ? 'req' : '-',
    spec.hasDesign ? 'design' : '-',
    spec.hasTasks ? 'tasks' : '-'
  ].join('/');

  const lines = [
    `${spec.name}  [${spec.state}]  ${spec.tasksCompleted}/${spec.tasksTotal} tasks done`,
    `phase: ${spec.phase}`,
    `files: ${files}`,
    `track: ${buildSimplePhaseTrack(spec)}`
  ];

  return lines.map((line) => truncate(line, width));
}

function buildSimplePendingLines(snapshot, width) {
  const pendingSpecs = Array.isArray(snapshot?.pendingSpecs) ? snapshot.pendingSpecs : [];
  if (pendingSpecs.length === 0) {
    return [truncate('No pending specs', width)];
  }

  return pendingSpecs.map((spec) =>
    truncate(`${spec.name} (${spec.state}) ${spec.tasksCompleted}/${spec.tasksTotal} tasks`, width)
  );
}

function buildSimpleCompletedLines(snapshot, width) {
  const completedSpecs = Array.isArray(snapshot?.completedSpecs) ? snapshot.completedSpecs : [];
  if (completedSpecs.length === 0) {
    return [truncate('No completed specs yet', width)];
  }

  return completedSpecs.map((spec) =>
    truncate(`${spec.name} done at ${spec.updatedAt || 'unknown'} (${spec.tasksCompleted}/${spec.tasksTotal})`, width)
  );
}

function buildSimpleStatsLines(snapshot, width) {
  const stats = snapshot?.stats || {};

  return [
    `specs: ${stats.completedSpecs || 0}/${stats.totalSpecs || 0} complete | in_progress: ${stats.inProgressSpecs || 0} | pending: ${stats.pendingSpecs || 0}`,
    `pipeline: ready ${stats.readySpecs || 0} | design_pending ${stats.designPendingSpecs || 0} | tasks_pending ${stats.tasksPendingSpecs || 0}`,
    `tasks: ${stats.completedTasks || 0}/${stats.totalTasks || 0} complete | pending: ${stats.pendingTasks || 0} | optional: ${stats.optionalTasks || 0}`
  ].map((line) => truncate(line, width));
}

function buildSimpleOverviewProjectLines(snapshot, width) {
  const project = snapshot?.project || {};
  const stats = snapshot?.stats || {};

  return [
    `project: ${project.name || 'unknown'} | simple flow`,
    `specs: ${stats.totalSpecs || 0} total | active: ${stats.activeSpecsCount || 0} | completed: ${stats.completedSpecs || 0}`,
    `tasks: ${stats.completedTasks || 0}/${stats.totalTasks || 0} complete (${stats.progressPercent || 0}%)`
  ].map((line) => truncate(line, width));
}

function buildSimpleOverviewIntentLines(snapshot, width) {
  const specs = Array.isArray(snapshot?.specs) ? snapshot.specs : [];
  if (specs.length === 0) {
    return [truncate('No specs found', width)];
  }

  return specs.map((spec) =>
    truncate(`${spec.name}: ${spec.state} (${spec.tasksCompleted}/${spec.tasksTotal} tasks)`, width)
  );
}

function buildSimpleOverviewStandardsLines(snapshot, width) {
  const specs = Array.isArray(snapshot?.specs) ? snapshot.specs : [];
  if (specs.length === 0) {
    return [truncate('No spec artifacts found', width)];
  }

  const reqCount = specs.filter((spec) => spec.hasRequirements).length;
  const designCount = specs.filter((spec) => spec.hasDesign).length;
  const tasksCount = specs.filter((spec) => spec.hasTasks).length;
  const total = specs.length;

  return [
    `[x] requirements.md coverage ${reqCount}/${total}`,
    `[x] design.md coverage ${designCount}/${total}`,
    `[x] tasks.md coverage ${tasksCount}/${total}`
  ].map((line) => truncate(line, width));
}

function buildCurrentRunLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcCurrentRunLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleCurrentRunLines(snapshot, width);
  }
  return buildFireCurrentRunLines(snapshot, width);
}

function buildPendingLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcPendingLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimplePendingLines(snapshot, width);
  }
  return buildFirePendingLines(snapshot, width);
}

function buildCompletedLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcCompletedLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleCompletedLines(snapshot, width);
  }
  return buildFireCompletedLines(snapshot, width);
}

function buildStatsLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (!snapshot?.initialized) {
    if (effectiveFlow === 'aidlc') {
      return [truncate('Waiting for memory-bank initialization.', width)];
    }
    if (effectiveFlow === 'simple') {
      return [truncate('Waiting for specs/ initialization.', width)];
    }
    return [truncate('Waiting for .specs-fire/state.yaml initialization.', width)];
  }

  if (effectiveFlow === 'aidlc') {
    return buildAidlcStatsLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleStatsLines(snapshot, width);
  }
  return buildFireStatsLines(snapshot, width);
}

function buildOverviewProjectLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcOverviewProjectLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleOverviewProjectLines(snapshot, width);
  }
  return buildFireOverviewProjectLines(snapshot, width);
}

function listOverviewIntentEntries(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
    return intents.map((intent) => ({
      id: intent?.id || 'unknown',
      status: intent?.status || 'pending',
      line: `${intent?.id || 'unknown'}: ${intent?.status || 'pending'} (${intent?.completedStories || 0}/${intent?.storyCount || 0} stories, ${intent?.completedUnits || 0}/${intent?.unitCount || 0} units)`
    }));
  }
  if (effectiveFlow === 'simple') {
    const specs = Array.isArray(snapshot?.specs) ? snapshot.specs : [];
    return specs.map((spec) => ({
      id: spec?.name || 'unknown',
      status: spec?.state || 'pending',
      line: `${spec?.name || 'unknown'}: ${spec?.state || 'pending'} (${spec?.tasksCompleted || 0}/${spec?.tasksTotal || 0} tasks)`
    }));
  }
  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
  return intents.map((intent) => {
    const workItems = Array.isArray(intent?.workItems) ? intent.workItems : [];
    const done = workItems.filter((item) => item.status === 'completed').length;
    return {
      id: intent?.id || 'unknown',
      status: intent?.status || 'pending',
      line: `${intent?.id || 'unknown'}: ${intent?.status || 'pending'} (${done}/${workItems.length} work items)`
    };
  });
}

function buildOverviewIntentLines(snapshot, width, flow, filter = 'next') {
  const entries = listOverviewIntentEntries(snapshot, flow);
  const normalizedFilter = filter === 'completed' ? 'completed' : 'next';
  const isNextFilter = normalizedFilter === 'next';
  const nextLabel = isNextFilter ? '[NEXT]' : ' next ';
  const completedLabel = !isNextFilter ? '[COMPLETED]' : ' completed ';

  const filtered = entries.filter((entry) => {
    if (normalizedFilter === 'completed') {
      return entry.status === 'completed';
    }
    return entry.status !== 'completed';
  });

  const lines = [{
    text: truncate(`filter ${nextLabel} | ${completedLabel}  (←/→ or n/x)`, width),
    color: 'cyan',
    bold: true
  }];

  if (filtered.length === 0) {
    lines.push({
      text: truncate(
        normalizedFilter === 'completed' ? 'No completed intents yet' : 'No upcoming intents',
        width
      ),
      color: 'gray',
      bold: false
    });
    return lines;
  }

  lines.push(...filtered.map((entry) => truncate(entry.line, width)));
  return lines;
}

function buildOverviewStandardsLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcOverviewStandardsLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleOverviewStandardsLines(snapshot, width);
  }
  return buildFireOverviewStandardsLines(snapshot, width);
}

function getPanelTitles(flow, snapshot) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return {
      current: 'Current Bolt',
      files: 'Bolt Files',
      pending: 'Queued Bolts',
      completed: 'Recent Completed Bolts',
      otherWorktrees: 'Other Worktrees: Active Bolts'
    };
  }
  if (effectiveFlow === 'simple') {
    return {
      current: 'Current Spec',
      files: 'Spec Files',
      pending: 'Pending Specs',
      completed: 'Recent Completed Specs',
      otherWorktrees: 'Other Worktrees: Active Specs'
    };
  }
  return {
    current: 'Current Run',
    files: 'Run Files',
    pending: 'Pending Queue',
    completed: 'Recent Completed Runs',
    otherWorktrees: 'Other Worktrees: Active Runs',
    git: 'Git Changes'
  };
}

module.exports = {
  buildShortStats,
  buildHeaderLine,
  buildErrorLines,
  getCurrentRun,
  getCurrentFireWorkItem,
  extractFrontmatterBlock,
  extractFrontmatterValue,
  FIRE_AWAITING_APPROVAL_STATES,
  FIRE_APPROVED_STATES,
  parseFirePlanCheckpointMetadata,
  resolveFireApprovalState,
  getCurrentPhaseLabel,
  getFireRunApprovalGate,
  isFireRunAwaitingApproval,
  detectFireRunApprovalGate,
  normalizeStageName,
  getAidlcCheckpointSignalFiles,
  hasAidlcCheckpointSignal,
  isAidlcBoltAwaitingApproval,
  getCurrentBolt,
  detectAidlcBoltApprovalGate,
  getEffectiveFlow,
  detectDashboardApprovalGate,
  buildPhaseTrack,
  buildFireCurrentRunLines,
  buildFirePendingLines,
  buildFireCompletedLines,
  buildFireStatsLines,
  buildWarningsLines,
  buildFireOverviewProjectLines,
  buildFireOverviewIntentLines,
  buildFireOverviewStandardsLines,
  buildAidlcStageTrack,
  buildAidlcCurrentRunLines,
  buildAidlcPendingLines,
  buildAidlcCompletedLines,
  buildAidlcStatsLines,
  buildAidlcOverviewProjectLines,
  buildAidlcOverviewIntentLines,
  buildAidlcOverviewStandardsLines,
  getCurrentSpec,
  buildSimplePhaseTrack,
  buildSimpleCurrentRunLines,
  buildSimplePendingLines,
  buildSimpleCompletedLines,
  buildSimpleStatsLines,
  buildSimpleOverviewProjectLines,
  buildSimpleOverviewIntentLines,
  buildSimpleOverviewStandardsLines,
  buildCurrentRunLines,
  buildPendingLines,
  buildCompletedLines,
  buildStatsLines,
  buildOverviewProjectLines,
  listOverviewIntentEntries,
  buildOverviewIntentLines,
  buildOverviewStandardsLines,
  getPanelTitles
};
