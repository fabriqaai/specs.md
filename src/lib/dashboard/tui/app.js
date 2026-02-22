const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const stringWidthModule = require('string-width');
const sliceAnsiModule = require('slice-ansi');
const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState } = require('./store');

const stringWidth = typeof stringWidthModule === 'function'
  ? stringWidthModule
  : stringWidthModule.default;
const sliceAnsi = typeof sliceAnsiModule === 'function'
  ? sliceAnsiModule
  : sliceAnsiModule.default;

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
    runFile: '*',
    activeFile: '>',
    groupCollapsed: '>',
    groupExpanded: 'v'
  };

  const nerd = {
    runs: '󰑮',
    overview: '󰍉',
    health: '󰓦',
    runFile: '󰈔',
    activeFile: '󰜴',
    groupCollapsed: '󰐕',
    groupExpanded: '󰐗'
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
  if (!Number.isFinite(width)) {
    return text;
  }

  const safeWidth = Math.max(0, Math.floor(width));
  if (safeWidth === 0) {
    return '';
  }

  if (stringWidth(text) <= safeWidth) {
    return text;
  }

  if (safeWidth <= 3) {
    return sliceAnsi(text, 0, safeWidth);
  }

  const ellipsis = '...';
  const bodyWidth = Math.max(0, safeWidth - stringWidth(ellipsis));
  return `${sliceAnsi(text, 0, bodyWidth)}${ellipsis}`;
}

function normalizePanelLine(line) {
  if (line && typeof line === 'object' && !Array.isArray(line)) {
    return {
      text: typeof line.text === 'string' ? line.text : String(line.text ?? ''),
      color: line.color,
      bold: Boolean(line.bold),
      selected: Boolean(line.selected),
      loading: Boolean(line.loading)
    };
  }

  return {
    text: String(line ?? ''),
    color: undefined,
    bold: false,
    selected: false,
    loading: false
  };
}

function fitLines(lines, maxLines, width) {
  const safeLines = (Array.isArray(lines) ? lines : []).map((line) => {
    const normalized = normalizePanelLine(line);
    return {
      ...normalized,
      text: truncate(normalized.text, width)
    };
  });

  if (safeLines.length <= maxLines) {
    return safeLines;
  }

  const selectedIndex = safeLines.findIndex((line) => line.selected);
  if (selectedIndex >= 0) {
    const windowSize = Math.max(1, maxLines);
    let start = selectedIndex - Math.floor(windowSize / 2);
    start = Math.max(0, start);
    start = Math.min(start, Math.max(0, safeLines.length - windowSize));
    return safeLines.slice(start, start + windowSize);
  }

  const visible = safeLines.slice(0, Math.max(1, maxLines - 1));
  visible.push({
    text: truncate(`... +${safeLines.length - visible.length} more`, width),
    color: 'gray',
    bold: false
  });
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

function normalizeToken(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.toLowerCase().trim().replace(/[\s-]+/g, '_');
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

function readFileTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
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
  const checkpoint = currentWorkItem?.currentCheckpoint
    || currentWorkItem?.current_checkpoint
    || run?.currentCheckpoint
    || run?.current_checkpoint
    || planState.checkpoint
    || null;

  return {
    state,
    checkpoint,
    source: itemState
      ? 'item-state'
      : (runState
        ? 'run-state'
        : (planState.checkpointState ? 'plan-frontmatter' : null))
  };
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

function getEffectiveFlow(flow, snapshot) {
  const explicitFlow = typeof flow === 'string' && flow !== '' ? flow : null;
  const snapshotFlow = typeof snapshot?.flow === 'string' && snapshot.flow !== '' ? snapshot.flow : null;
  return (snapshotFlow || explicitFlow || 'fire').toLowerCase();
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
    otherWorktrees: 'Other Worktrees: Active Runs'
  };
}

function getDashboardWorktreeMeta(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const meta = snapshot.dashboardWorktrees;
  if (!meta || typeof meta !== 'object') {
    return null;
  }
  const items = Array.isArray(meta.items) ? meta.items : [];
  if (items.length === 0) {
    return null;
  }
  return {
    ...meta,
    items
  };
}

function getWorktreeItems(snapshot) {
  return getDashboardWorktreeMeta(snapshot)?.items || [];
}

function getSelectedWorktree(snapshot) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return null;
  }
  return meta.items.find((item) => item.id === meta.selectedWorktreeId) || null;
}

function hasMultipleWorktrees(snapshot) {
  return getWorktreeItems(snapshot).length > 1;
}

function isSelectedWorktreeMain(snapshot) {
  const selected = getSelectedWorktree(snapshot);
  return Boolean(selected?.isMainBranch);
}

function getWorktreeDisplayName(worktree) {
  if (!worktree || typeof worktree !== 'object') {
    return 'unknown';
  }
  if (typeof worktree.displayBranch === 'string' && worktree.displayBranch.trim() !== '') {
    return worktree.displayBranch;
  }
  if (typeof worktree.branch === 'string' && worktree.branch.trim() !== '') {
    return worktree.branch;
  }
  if (typeof worktree.name === 'string' && worktree.name.trim() !== '') {
    return worktree.name;
  }
  return path.basename(worktree.path || '') || 'unknown';
}

function buildWorktreeRows(snapshot, flow) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [{
      kind: 'info',
      key: 'worktrees:none',
      label: 'No git worktrees detected',
      selectable: false
    }];
  }

  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const entityLabel = effectiveFlow === 'aidlc'
    ? 'active bolts'
    : (effectiveFlow === 'simple' ? 'active specs' : 'active runs');

  const rows = [];
  for (const item of meta.items) {
    const currentLabel = item.isSelected ? '[CURRENT] ' : '';
    const mainLabel = item.isMainBranch && !item.detached ? '[MAIN] ' : '';
    const availabilityLabel = item.flowAvailable ? '' : ' (flow unavailable)';
    const statusLabel = item.status === 'loading'
      ? ' loading...'
      : (item.status === 'error' ? ' error' : ` ${item.activeCount || 0} ${entityLabel}`);
    const scopeLabel = item.name ? ` (${item.name})` : '';

    rows.push({
      kind: 'info',
      key: `worktree:item:${item.id}`,
      label: `${currentLabel}${mainLabel}${getWorktreeDisplayName(item)}${scopeLabel}${availabilityLabel}${statusLabel}`,
      color: item.isSelected ? 'green' : (item.flowAvailable ? 'gray' : 'red'),
      bold: item.isSelected,
      selectable: true
    });
  }

  return rows;
}

function buildOtherWorktreeActiveGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'simple') {
    return [];
  }

  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [];
  }

  const selectedWorktree = getSelectedWorktree(snapshot);
  if (!selectedWorktree || !selectedWorktree.isMainBranch) {
    return [];
  }

  const groups = [];
  const otherItems = meta.items.filter((item) => item.id !== meta.selectedWorktreeId);
  for (const item of otherItems) {
    if (!item.flowAvailable || item.status === 'unavailable' || item.status === 'error') {
      continue;
    }

    if (effectiveFlow === 'aidlc') {
      const activeBolts = Array.isArray(item.activity?.activeBolts) ? item.activity.activeBolts : [];
      for (const bolt of activeBolts) {
        const stages = Array.isArray(bolt?.stages) ? bolt.stages : [];
        const completedStages = stages.filter((stage) => stage?.status === 'completed').length;
        groups.push({
          key: `other:wt:${item.id}:bolt:${bolt.id}`,
          label: `[WT ${getWorktreeDisplayName(item)}] ${bolt.id} [${bolt.type || 'bolt'}] ${completedStages}/${stages.length || 0} stages`,
          files: collectAidlcBoltFiles(bolt).map((file) => ({ ...file, scope: 'active' }))
        });
      }
      continue;
    }

    const activeRuns = Array.isArray(item.activity?.activeRuns) ? item.activity.activeRuns : [];
    for (const run of activeRuns) {
      const workItems = Array.isArray(run?.workItems) ? run.workItems : [];
      const completed = workItems.filter((workItem) => workItem?.status === 'completed').length;
      groups.push({
        key: `other:wt:${item.id}:run:${run.id}`,
        label: `[WT ${getWorktreeDisplayName(item)}] ${run.id} [${run.scope || 'single'}] ${completed}/${workItems.length} items`,
        files: collectFireRunFiles(run).map((file) => ({ ...file, scope: 'active' }))
      });
    }
  }

  return groups;
}

function getOtherWorktreeEmptyMessage(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (!hasMultipleWorktrees(snapshot)) {
    return 'No additional worktrees';
  }
  if (!isSelectedWorktreeMain(snapshot)) {
    return 'Switch to main worktree to view active items from other worktrees';
  }
  if (effectiveFlow === 'aidlc') {
    return 'No active bolts in other worktrees';
  }
  if (effectiveFlow === 'simple') {
    return 'No active specs in other worktrees';
  }
  return 'No active runs in other worktrees';
}

function getSectionOrderForView(view, options = {}) {
  const includeWorktrees = options.includeWorktrees === true;
  const includeOtherWorktrees = options.includeOtherWorktrees === true;

  if (view === 'intents') {
    return ['intent-status'];
  }
  if (view === 'completed') {
    return ['completed-runs'];
  }
  if (view === 'health') {
    return ['standards', 'stats', 'warnings', 'error-details'];
  }
  const sections = [];
  if (includeWorktrees) {
    sections.push('worktrees');
  }
  sections.push('current-run', 'run-files');
  if (includeOtherWorktrees) {
    sections.push('other-worktrees-active');
  }
  return sections;
}

function cycleSection(view, currentSectionKey, direction = 1, availableSections = null) {
  const order = Array.isArray(availableSections) && availableSections.length > 0
    ? availableSections
    : getSectionOrderForView(view);
  if (order.length === 0) {
    return currentSectionKey;
  }

  const currentIndex = order.indexOf(currentSectionKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + order.length) % order.length;
  return order[nextIndex];
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
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

function pushFileEntry(entries, seenPaths, candidate) {
  if (!candidate || typeof candidate.path !== 'string' || typeof candidate.label !== 'string') {
    return;
  }

  if (!fileExists(candidate.path)) {
    return;
  }

  if (seenPaths.has(candidate.path)) {
    return;
  }

  seenPaths.add(candidate.path);
  entries.push({
    path: candidate.path,
    label: candidate.label,
    scope: candidate.scope || 'other'
  });
}

function buildIntentScopedLabel(snapshot, intentId, filePath, fallbackName = 'file.md') {
  const safeIntentId = typeof intentId === 'string' && intentId.trim() !== ''
    ? intentId
    : '';
  const safeFallback = typeof fallbackName === 'string' && fallbackName.trim() !== ''
    ? fallbackName
    : 'file.md';

  if (typeof filePath === 'string' && filePath.trim() !== '') {
    if (safeIntentId && typeof snapshot?.rootPath === 'string' && snapshot.rootPath.trim() !== '') {
      const intentPath = path.join(snapshot.rootPath, 'intents', safeIntentId);
      const relativePath = path.relative(intentPath, filePath);
      if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        return `${safeIntentId}/${relativePath.split(path.sep).join('/')}`;
      }
    }

    const basename = path.basename(filePath);
    return safeIntentId ? `${safeIntentId}/${basename}` : basename;
  }

  return safeIntentId ? `${safeIntentId}/${safeFallback}` : safeFallback;
}

function findIntentIdForWorkItem(snapshot, workItemId) {
  if (typeof workItemId !== 'string' || workItemId.trim() === '') {
    return '';
  }

  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
  for (const intent of intents) {
    const items = Array.isArray(intent?.workItems) ? intent.workItems : [];
    if (items.some((item) => item?.id === workItemId)) {
      return intent?.id || '';
    }
  }

  return '';
}

function resolveFireWorkItemPath(snapshot, intentId, workItemId, explicitPath) {
  if (typeof explicitPath === 'string' && explicitPath.trim() !== '') {
    return explicitPath;
  }

  if (typeof snapshot?.rootPath !== 'string' || snapshot.rootPath.trim() === '') {
    return null;
  }

  if (typeof workItemId !== 'string' || workItemId.trim() === '') {
    return null;
  }

  const safeIntentId = typeof intentId === 'string' && intentId.trim() !== ''
    ? intentId
    : findIntentIdForWorkItem(snapshot, workItemId);

  if (!safeIntentId) {
    return null;
  }

  return path.join(snapshot.rootPath, 'intents', safeIntentId, 'work-items', `${workItemId}.md`);
}

function collectFireRunFiles(run) {
  if (!run || typeof run.folderPath !== 'string') {
    return [];
  }

  const names = ['run.md'];
  if (run.hasPlan) names.push('plan.md');
  if (run.hasTestReport) names.push('test-report.md');
  if (run.hasWalkthrough) names.push('walkthrough.md');

  return names.map((fileName) => ({
    label: `${run.id}/${fileName}`,
    path: path.join(run.folderPath, fileName)
  }));
}

function collectAidlcBoltFiles(bolt) {
  if (!bolt || typeof bolt.path !== 'string') {
    return [];
  }

  const fileNames = Array.isArray(bolt.files) && bolt.files.length > 0
    ? bolt.files
    : listMarkdownFiles(bolt.path);

  return fileNames.map((fileName) => ({
    label: `${bolt.id}/${fileName}`,
    path: path.join(bolt.path, fileName)
  }));
}

function collectSimpleSpecFiles(spec) {
  if (!spec || typeof spec.path !== 'string') {
    return [];
  }

  const names = [];
  if (spec.hasRequirements) names.push('requirements.md');
  if (spec.hasDesign) names.push('design.md');
  if (spec.hasTasks) names.push('tasks.md');

  return names.map((fileName) => ({
    label: `${spec.name}/${fileName}`,
    path: path.join(spec.path, fileName)
  }));
}

function getRunFileEntries(snapshot, flow, options = {}) {
  const includeBacklog = options.includeBacklog !== false;
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const entries = [];
  const seenPaths = new Set();

  if (effectiveFlow === 'aidlc') {
    const bolt = getCurrentBolt(snapshot);
    for (const file of collectAidlcBoltFiles(bolt)) {
      pushFileEntry(entries, seenPaths, { ...file, scope: 'active' });
    }

    if (!includeBacklog) {
      return entries;
    }

    const pendingBolts = Array.isArray(snapshot?.pendingBolts) ? snapshot.pendingBolts : [];
    for (const pendingBolt of pendingBolts) {
      for (const file of collectAidlcBoltFiles(pendingBolt)) {
        pushFileEntry(entries, seenPaths, { ...file, scope: 'upcoming' });
      }
    }

    const completedBolts = Array.isArray(snapshot?.completedBolts) ? snapshot.completedBolts : [];
    for (const completedBolt of completedBolts) {
      for (const file of collectAidlcBoltFiles(completedBolt)) {
        pushFileEntry(entries, seenPaths, { ...file, scope: 'completed' });
      }
    }

    const intentIds = new Set([
      ...pendingBolts.map((item) => item?.intent).filter(Boolean),
      ...completedBolts.map((item) => item?.intent).filter(Boolean)
    ]);

    for (const intentId of intentIds) {
      const intentPath = path.join(snapshot?.rootPath || '', 'intents', intentId);
      pushFileEntry(entries, seenPaths, {
        label: `${intentId}/requirements.md`,
        path: path.join(intentPath, 'requirements.md'),
        scope: 'intent'
      });
      pushFileEntry(entries, seenPaths, {
        label: `${intentId}/system-context.md`,
        path: path.join(intentPath, 'system-context.md'),
        scope: 'intent'
      });
      pushFileEntry(entries, seenPaths, {
        label: `${intentId}/units.md`,
        path: path.join(intentPath, 'units.md'),
        scope: 'intent'
      });
    }
    return entries;
  }

  if (effectiveFlow === 'simple') {
    const spec = getCurrentSpec(snapshot);
    for (const file of collectSimpleSpecFiles(spec)) {
      pushFileEntry(entries, seenPaths, { ...file, scope: 'active' });
    }

    if (!includeBacklog) {
      return entries;
    }

    const pendingSpecs = Array.isArray(snapshot?.pendingSpecs) ? snapshot.pendingSpecs : [];
    for (const pendingSpec of pendingSpecs) {
      for (const file of collectSimpleSpecFiles(pendingSpec)) {
        pushFileEntry(entries, seenPaths, { ...file, scope: 'upcoming' });
      }
    }

    const completedSpecs = Array.isArray(snapshot?.completedSpecs) ? snapshot.completedSpecs : [];
    for (const completedSpec of completedSpecs) {
      for (const file of collectSimpleSpecFiles(completedSpec)) {
        pushFileEntry(entries, seenPaths, { ...file, scope: 'completed' });
      }
    }

    return entries;
  }

  const run = getCurrentRun(snapshot);
  for (const file of collectFireRunFiles(run)) {
    pushFileEntry(entries, seenPaths, { ...file, scope: 'active' });
  }

  if (!includeBacklog) {
    return entries;
  }

  const pendingItems = Array.isArray(snapshot?.pendingItems) ? snapshot.pendingItems : [];
  for (const pendingItem of pendingItems) {
    pushFileEntry(entries, seenPaths, {
      label: buildIntentScopedLabel(
        snapshot,
        pendingItem?.intentId,
        pendingItem?.filePath,
        `${pendingItem?.id || 'work-item'}.md`
      ),
      path: pendingItem?.filePath,
      scope: 'upcoming'
    });

    if (pendingItem?.intentId) {
      pushFileEntry(entries, seenPaths, {
        label: buildIntentScopedLabel(
          snapshot,
          pendingItem.intentId,
          path.join(snapshot?.rootPath || '', 'intents', pendingItem.intentId, 'brief.md'),
          'brief.md'
        ),
        path: path.join(snapshot?.rootPath || '', 'intents', pendingItem.intentId, 'brief.md'),
        scope: 'intent'
      });
    }
  }

  const completedRuns = Array.isArray(snapshot?.completedRuns) ? snapshot.completedRuns : [];
  for (const completedRun of completedRuns) {
    for (const file of collectFireRunFiles(completedRun)) {
      pushFileEntry(entries, seenPaths, { ...file, scope: 'completed' });
    }
  }

  const completedIntents = Array.isArray(snapshot?.intents)
    ? snapshot.intents.filter((intent) => intent?.status === 'completed')
    : [];
  for (const intent of completedIntents) {
    pushFileEntry(entries, seenPaths, {
      label: buildIntentScopedLabel(
        snapshot,
        intent?.id,
        path.join(snapshot?.rootPath || '', 'intents', intent?.id || '', 'brief.md'),
        'brief.md'
      ),
      path: path.join(snapshot?.rootPath || '', 'intents', intent.id, 'brief.md'),
      scope: 'intent'
    });
  }

  return entries;
}

function clampIndex(value, length) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (!Number.isFinite(length) || length <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(length - 1, Math.floor(value)));
}

function getNoFileMessage(flow) {
  return `No selectable files for ${String(flow || 'flow').toUpperCase()}`;
}

function formatScope(scope) {
  if (scope === 'active') return 'ACTIVE';
  if (scope === 'upcoming') return 'UPNEXT';
  if (scope === 'completed') return 'DONE';
  if (scope === 'intent') return 'INTENT';
  return 'FILE';
}

function getNoPendingMessage(flow) {
  if (flow === 'aidlc') return 'No queued bolts';
  if (flow === 'simple') return 'No pending specs';
  return 'No pending work items';
}

function getNoCompletedMessage(flow) {
  if (flow === 'aidlc') return 'No completed bolts yet';
  if (flow === 'simple') return 'No completed specs yet';
  return 'No completed runs yet';
}

function getNoCurrentMessage(flow) {
  if (flow === 'aidlc') return 'No active bolt';
  if (flow === 'simple') return 'No active spec';
  return 'No active run';
}

function buildFireCurrentRunGroups(snapshot) {
  const run = getCurrentRun(snapshot);
  if (!run) {
    return [];
  }

  const workItems = Array.isArray(run.workItems) ? run.workItems : [];
  const completed = workItems.filter((item) => item.status === 'completed').length;
  const currentWorkItem = getCurrentFireWorkItem(run);
  const awaitingApproval = isFireRunAwaitingApproval(run, currentWorkItem);

  const currentPhase = getCurrentPhaseLabel(run, currentWorkItem);
  const phaseTrack = buildPhaseTrack(currentPhase);
  const mode = String(currentWorkItem?.mode || 'confirm').toUpperCase();
  const status = currentWorkItem?.status || 'pending';
  const statusTag = status === 'in_progress' ? 'current' : status;

  const runIntentId = typeof run?.intent === 'string' ? run.intent : '';
  const currentWorkItemFiles = workItems.map((item, index) => {
    const itemId = typeof item?.id === 'string' && item.id !== '' ? item.id : `work-item-${index + 1}`;
    const intentId = typeof item?.intent === 'string' && item.intent !== ''
      ? item.intent
      : (runIntentId || findIntentIdForWorkItem(snapshot, itemId));
    const filePath = resolveFireWorkItemPath(snapshot, intentId, itemId, item?.filePath);
    if (!filePath) {
      return null;
    }

    const itemMode = String(item?.mode || 'confirm').toUpperCase();
    const itemStatus = item?.status || 'pending';
    const isCurrent = Boolean(currentWorkItem?.id) && itemId === currentWorkItem.id;
    const itemScope = isCurrent
      ? 'active'
      : (itemStatus === 'completed' ? 'completed' : 'upcoming');
    const itemStatusTag = isCurrent ? 'current' : itemStatus;
    const labelPath = buildIntentScopedLabel(snapshot, intentId, filePath, `${itemId}.md`);

    return {
      label: `${labelPath} [${itemMode}] [${itemStatusTag}]`,
      path: filePath,
      scope: itemScope
    };
  }).filter(Boolean);

  const currentRunFiles = collectFireRunFiles(run).map((fileEntry) => ({
    ...fileEntry,
    label: path.basename(fileEntry.path || fileEntry.label || ''),
    scope: 'active'
  }));

  return [
    {
      key: `current:run:${run.id}:summary`,
      label: `${run.id} [${run.scope}] ${completed}/${workItems.length} items${awaitingApproval ? ' [APPROVAL]' : ''}`,
      files: []
    },
    {
      key: `current:run:${run.id}:work-items`,
      label: `WORK ITEMS (${currentWorkItemFiles.length})`,
      files: filterExistingFiles(currentWorkItemFiles)
    },
    {
      key: `current:run:${run.id}:run-files`,
      label: 'RUN FILES',
      files: filterExistingFiles(currentRunFiles)
    }
  ];
}

function buildCurrentGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);

  if (effectiveFlow === 'aidlc') {
    const bolt = getCurrentBolt(snapshot);
    if (!bolt) {
      return [];
    }
    const stages = Array.isArray(bolt.stages) ? bolt.stages : [];
    const completedStages = stages.filter((stage) => stage.status === 'completed').length;
    const awaitingApproval = isAidlcBoltAwaitingApproval(bolt);
    return [{
      key: `current:bolt:${bolt.id}`,
      label: `${bolt.id} [${bolt.type}] ${completedStages}/${stages.length} stages${awaitingApproval ? ' [APPROVAL]' : ''}`,
      files: filterExistingFiles([
        ...collectAidlcBoltFiles(bolt),
        ...collectAidlcIntentContextFiles(snapshot, bolt.intent)
      ])
    }];
  }

  if (effectiveFlow === 'simple') {
    const spec = getCurrentSpec(snapshot);
    if (!spec) {
      return [];
    }
    return [{
      key: `current:spec:${spec.name}`,
      label: `${spec.name} [${spec.state}] ${spec.tasksCompleted}/${spec.tasksTotal} tasks`,
      files: filterExistingFiles(collectSimpleSpecFiles(spec))
    }];
  }

  return buildFireCurrentRunGroups(snapshot);
}

function buildRunFileGroups(fileEntries) {
  const order = ['active', 'upcoming', 'completed', 'intent', 'other'];
  const buckets = new Map(order.map((scope) => [scope, []]));

  for (const fileEntry of Array.isArray(fileEntries) ? fileEntries : []) {
    const scope = order.includes(fileEntry?.scope) ? fileEntry.scope : 'other';
    buckets.get(scope).push(fileEntry);
  }

  const groups = [];
  for (const scope of order) {
    const files = buckets.get(scope) || [];
    if (files.length === 0) {
      continue;
    }
    groups.push({
      key: `run-files:scope:${scope}`,
      label: `${formatScope(scope)} files (${files.length})`,
      files: filterExistingFiles(files)
    });
  }
  return groups;
}

function getFileEntityLabel(fileEntry, fallbackIndex = 0) {
  const rawLabel = typeof fileEntry?.label === 'string' ? fileEntry.label : '';
  if (rawLabel.includes('/')) {
    return rawLabel.split('/')[0] || `item-${fallbackIndex + 1}`;
  }

  const filePath = typeof fileEntry?.path === 'string' ? fileEntry.path : '';
  if (filePath !== '') {
    const parentDir = path.basename(path.dirname(filePath));
    if (parentDir && parentDir !== '.' && parentDir !== path.sep) {
      return parentDir;
    }

    const baseName = path.basename(filePath);
    if (baseName) {
      return baseName;
    }
  }

  return `item-${fallbackIndex + 1}`;
}

function buildRunFileEntityGroups(snapshot, flow, options = {}) {
  const order = ['active', 'upcoming', 'completed', 'intent', 'other'];
  const rankByScope = new Map(order.map((scope, index) => [scope, index]));
  const entries = filterExistingFiles(getRunFileEntries(snapshot, flow, options));
  const groupsByEntity = new Map();

  for (let index = 0; index < entries.length; index += 1) {
    const fileEntry = entries[index];
    const entity = getFileEntityLabel(fileEntry, index);
    const scope = order.includes(fileEntry?.scope) ? fileEntry.scope : 'other';
    const scopeRank = rankByScope.get(scope) ?? rankByScope.get('other');

    if (!groupsByEntity.has(entity)) {
      groupsByEntity.set(entity, {
        entity,
        files: [],
        scope,
        scopeRank
      });
    }

    const group = groupsByEntity.get(entity);
    group.files.push(fileEntry);

    if (scopeRank < group.scopeRank) {
      group.scopeRank = scopeRank;
      group.scope = scope;
    }
  }

  return Array.from(groupsByEntity.values())
    .sort((a, b) => {
      if (a.scopeRank !== b.scopeRank) {
        return a.scopeRank - b.scopeRank;
      }
      return String(a.entity).localeCompare(String(b.entity));
    })
    .map((group) => ({
      key: `run-files:entity:${group.entity}`,
      label: `${group.entity} [${formatScope(group.scope)}] (${group.files.length})`,
      files: filterExistingFiles(group.files)
    }))
    .filter((group) => group.files.length > 0);
}

function normalizeInfoLine(line) {
  const normalized = normalizePanelLine(line);
  return {
    label: normalized.text,
    color: normalized.color,
    bold: normalized.bold
  };
}

function toInfoRows(lines, keyPrefix, emptyLabel = 'No data') {
  const safe = Array.isArray(lines) ? lines : [];
  if (safe.length === 0) {
    return [{
      kind: 'info',
      key: `${keyPrefix}:empty`,
      label: emptyLabel,
      selectable: false
    }];
  }

  return safe.map((line, index) => {
    const normalized = normalizeInfoLine(line);
    return {
      kind: 'info',
      key: `${keyPrefix}:${index}`,
      label: normalized.label,
      color: normalized.color,
      bold: normalized.bold,
      selectable: true
    };
  });
}

function toLoadingRows(label, keyPrefix = 'loading') {
  return [{
    kind: 'loading',
    key: `${keyPrefix}:row`,
    label: typeof label === 'string' && label !== '' ? label : 'Loading...',
    selectable: false
  }];
}

function buildOverviewIntentGroups(snapshot, flow, filter = 'next') {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const normalizedFilter = filter === 'completed' ? 'completed' : 'next';
  const isIncluded = (status) => {
    if (normalizedFilter === 'completed') {
      return status === 'completed';
    }
    return status !== 'completed';
  };

  if (effectiveFlow === 'aidlc') {
    const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
    return intents
      .filter((intent) => isIncluded(intent?.status || 'pending'))
      .map((intent, index) => ({
        key: `overview:intent:${intent?.id || index}`,
        label: `${intent?.id || 'unknown'}: ${intent?.status || 'pending'} (${intent?.completedStories || 0}/${intent?.storyCount || 0} stories, ${intent?.completedUnits || 0}/${intent?.unitCount || 0} units)`,
        files: filterExistingFiles(collectAidlcIntentContextFiles(snapshot, intent?.id))
      }));
  }

  if (effectiveFlow === 'simple') {
    const specs = Array.isArray(snapshot?.specs) ? snapshot.specs : [];
    return specs
      .filter((spec) => isIncluded(spec?.state || 'pending'))
      .map((spec, index) => ({
        key: `overview:spec:${spec?.name || index}`,
        label: `${spec?.name || 'unknown'}: ${spec?.state || 'pending'} (${spec?.tasksCompleted || 0}/${spec?.tasksTotal || 0} tasks)`,
        files: filterExistingFiles(collectSimpleSpecFiles(spec))
      }));
  }

  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];
  return intents
    .filter((intent) => isIncluded(intent?.status || 'pending'))
    .map((intent, index) => {
      const workItems = Array.isArray(intent?.workItems) ? intent.workItems : [];
      const done = workItems.filter((item) => item.status === 'completed').length;
      const files = [{
        label: buildIntentScopedLabel(snapshot, intent?.id, intent?.filePath, 'brief.md'),
        path: intent?.filePath,
        scope: 'intent'
      }, ...workItems.map((item) => ({
        label: buildIntentScopedLabel(
          snapshot,
          intent?.id,
          item?.filePath,
          `${item?.id || 'work-item'}.md`
        ),
        path: item?.filePath,
        scope: item?.status === 'completed' ? 'completed' : 'upcoming'
      }))];
      return {
        key: `overview:intent:${intent?.id || index}`,
        label: `${intent?.id || 'unknown'}: ${intent?.status || 'pending'} (${done}/${workItems.length} work items)`,
        files: filterExistingFiles(files)
      };
    });
}

function buildStandardsRows(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'simple') {
    return [{
      kind: 'info',
      key: 'standards:empty:simple',
      label: 'No standards for SIMPLE flow',
      selectable: false
    }];
  }

  const standards = Array.isArray(snapshot?.standards) ? snapshot.standards : [];
  const files = filterExistingFiles(standards.map((standard, index) => ({
    label: `${standard?.name || standard?.type || `standard-${index}`}.md`,
    path: standard?.filePath,
    scope: 'file'
  })));

  if (files.length === 0) {
    return [{
      kind: 'info',
      key: 'standards:empty',
      label: 'No standards found',
      selectable: false
    }];
  }

  return files.map((file, index) => ({
    kind: 'file',
    key: `standards:file:${file.path}:${index}`,
    label: file.label,
    path: file.path,
    scope: 'file',
    selectable: true
  }));
}

function buildProjectGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const files = [];

  if (effectiveFlow === 'aidlc') {
    files.push({
      label: 'memory-bank/project.yaml',
      path: path.join(snapshot?.rootPath || '', 'project.yaml'),
      scope: 'file'
    });
  } else if (effectiveFlow === 'simple') {
    files.push({
      label: 'package.json',
      path: path.join(snapshot?.workspacePath || '', 'package.json'),
      scope: 'file'
    });
  } else {
    files.push({
      label: '.specs-fire/state.yaml',
      path: path.join(snapshot?.rootPath || '', 'state.yaml'),
      scope: 'file'
    });
  }

  const projectName = snapshot?.project?.name || 'unknown-project';
  return [{
    key: `project:${projectName}`,
    label: `project ${projectName}`,
    files: filterExistingFiles(files)
  }];
}

function collectAidlcIntentContextFiles(snapshot, intentId) {
  if (!snapshot || typeof intentId !== 'string' || intentId.trim() === '') {
    return [];
  }

  const intentPath = path.join(snapshot.rootPath || '', 'intents', intentId);
  return [
    {
      label: `${intentId}/requirements.md`,
      path: path.join(intentPath, 'requirements.md'),
      scope: 'intent'
    },
    {
      label: `${intentId}/system-context.md`,
      path: path.join(intentPath, 'system-context.md'),
      scope: 'intent'
    },
    {
      label: `${intentId}/units.md`,
      path: path.join(intentPath, 'units.md'),
      scope: 'intent'
    }
  ];
}

function filterExistingFiles(files) {
  return (Array.isArray(files) ? files : []).filter((file) =>
    file && typeof file.path === 'string' && typeof file.label === 'string' && fileExists(file.path)
  );
}

function buildPendingGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);

  if (effectiveFlow === 'aidlc') {
    const pendingBolts = Array.isArray(snapshot?.pendingBolts) ? snapshot.pendingBolts : [];
    return pendingBolts.map((bolt, index) => {
      const deps = Array.isArray(bolt?.blockedBy) && bolt.blockedBy.length > 0
        ? ` blocked_by:${bolt.blockedBy.join(',')}`
        : '';
      const location = `${bolt?.intent || 'unknown'}/${bolt?.unit || 'unknown'}`;
      const boltFiles = collectAidlcBoltFiles(bolt);
      const intentFiles = collectAidlcIntentContextFiles(snapshot, bolt?.intent);
      return {
        key: `pending:bolt:${bolt?.id || index}`,
        label: `${bolt?.id || 'unknown'} (${bolt?.status || 'pending'}) in ${location}${deps}`,
        files: filterExistingFiles([...boltFiles, ...intentFiles])
      };
    });
  }

  if (effectiveFlow === 'simple') {
    const pendingSpecs = Array.isArray(snapshot?.pendingSpecs) ? snapshot.pendingSpecs : [];
    return pendingSpecs.map((spec, index) => ({
      key: `pending:spec:${spec?.name || index}`,
      label: `${spec?.name || 'unknown'} (${spec?.state || 'pending'}) ${spec?.tasksCompleted || 0}/${spec?.tasksTotal || 0} tasks`,
      files: filterExistingFiles(collectSimpleSpecFiles(spec))
    }));
  }

  const pendingItems = Array.isArray(snapshot?.pendingItems) ? snapshot.pendingItems : [];
  return pendingItems.map((item, index) => {
    const deps = Array.isArray(item?.dependencies) && item.dependencies.length > 0
      ? ` deps:${item.dependencies.join(',')}`
      : '';
    const intentTitle = item?.intentTitle || item?.intentId || 'unknown-intent';
    const files = [];

    if (item?.filePath) {
      files.push({
        label: buildIntentScopedLabel(
          snapshot,
          item?.intentId,
          item?.filePath,
          `${item?.id || 'work-item'}.md`
        ),
        path: item.filePath,
        scope: 'upcoming'
      });
    }
    if (item?.intentId) {
      files.push({
        label: buildIntentScopedLabel(
          snapshot,
          item.intentId,
          path.join(snapshot?.rootPath || '', 'intents', item.intentId, 'brief.md'),
          'brief.md'
        ),
        path: path.join(snapshot?.rootPath || '', 'intents', item.intentId, 'brief.md'),
        scope: 'intent'
      });
    }

    return {
      key: `pending:item:${item?.intentId || 'intent'}:${item?.id || index}`,
      label: `${item?.id || 'work-item'} (${item?.mode || 'confirm'}/${item?.complexity || 'medium'}) in ${intentTitle}${deps}`,
      files: filterExistingFiles(files)
    };
  });
}

function buildCompletedGroups(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);

  if (effectiveFlow === 'aidlc') {
    const completedBolts = Array.isArray(snapshot?.completedBolts) ? snapshot.completedBolts : [];
    return completedBolts.map((bolt, index) => {
      const boltFiles = collectAidlcBoltFiles(bolt);
      const intentFiles = collectAidlcIntentContextFiles(snapshot, bolt?.intent);
      return {
        key: `completed:bolt:${bolt?.id || index}`,
        label: `${bolt?.id || 'unknown'} [${bolt?.type || 'bolt'}] done at ${bolt?.completedAt || 'unknown'}`,
        files: filterExistingFiles([...boltFiles, ...intentFiles])
      };
    });
  }

  if (effectiveFlow === 'simple') {
    const completedSpecs = Array.isArray(snapshot?.completedSpecs) ? snapshot.completedSpecs : [];
    return completedSpecs.map((spec, index) => ({
      key: `completed:spec:${spec?.name || index}`,
      label: `${spec?.name || 'unknown'} done at ${spec?.updatedAt || 'unknown'} (${spec?.tasksCompleted || 0}/${spec?.tasksTotal || 0})`,
      files: filterExistingFiles(collectSimpleSpecFiles(spec))
    }));
  }

  const groups = [];
  const completedRuns = Array.isArray(snapshot?.completedRuns) ? snapshot.completedRuns : [];
  for (let index = 0; index < completedRuns.length; index += 1) {
    const run = completedRuns[index];
    const workItems = Array.isArray(run?.workItems) ? run.workItems : [];
    const completed = workItems.filter((item) => item.status === 'completed').length;
    groups.push({
      key: `completed:run:${run?.id || index}`,
      label: `${run?.id || 'run'} [${run?.scope || 'single'}] ${completed}/${workItems.length} done at ${run?.completedAt || 'unknown'}`,
      files: filterExistingFiles(collectFireRunFiles(run).map((file) => ({ ...file, scope: 'completed' })))
    });
  }

  const completedIntents = Array.isArray(snapshot?.intents)
    ? snapshot.intents.filter((intent) => intent?.status === 'completed')
    : [];
  for (let index = 0; index < completedIntents.length; index += 1) {
    const intent = completedIntents[index];
    groups.push({
      key: `completed:intent:${intent?.id || index}`,
      label: `intent ${intent?.id || 'unknown'} [completed]`,
      files: filterExistingFiles([{
        label: buildIntentScopedLabel(
          snapshot,
          intent?.id,
          path.join(snapshot?.rootPath || '', 'intents', intent?.id || '', 'brief.md'),
          'brief.md'
        ),
        path: path.join(snapshot?.rootPath || '', 'intents', intent?.id || '', 'brief.md'),
        scope: 'intent'
      }])
    });
  }

  return groups;
}

function toExpandableRows(groups, emptyLabel, expandedGroups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return [{
      kind: 'info',
      key: 'section:empty',
      label: emptyLabel,
      selectable: false
    }];
  }

  const rows = [];

  for (const group of groups) {
    const files = filterExistingFiles(group?.files);
    const expandable = files.length > 0;
    const expanded = expandable && Boolean(expandedGroups?.[group.key]);

    rows.push({
      kind: 'group',
      key: group.key,
      label: group.label,
      expandable,
      expanded,
      selectable: true
    });

    if (expanded) {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        rows.push({
          kind: 'file',
          key: `${group.key}:file:${file.path}:${index}`,
          label: file.label,
          path: file.path,
          scope: file.scope || 'file',
          selectable: true
        });
      }
    }
  }

  return rows;
}

function buildInteractiveRowsLines(rows, selectedIndex, icons, width, isFocusedSection) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ text: '', color: undefined, bold: false, selected: false }];
  }

  const clampedIndex = clampIndex(selectedIndex, rows.length);

  return rows.map((row, index) => {
    const selectable = row?.selectable !== false;
    const isSelected = selectable && index === clampedIndex;
    const cursor = isSelected
      ? (isFocusedSection ? (icons.activeFile || '>') : '•')
      : ' ';

    if (row.kind === 'group') {
      const marker = row.expandable
        ? (row.expanded ? (icons.groupExpanded || 'v') : (icons.groupCollapsed || '>'))
        : '-';
      return {
        text: truncate(`${cursor} ${marker} ${row.label}`, width),
        color: isSelected ? (isFocusedSection ? 'green' : 'cyan') : undefined,
        bold: isSelected,
        selected: isSelected
      };
    }

    if (row.kind === 'file') {
      const scope = row.scope ? `[${formatScope(row.scope)}] ` : '';
      return {
        text: truncate(`${cursor}   ${icons.runFile} ${scope}${row.label}`, width),
        color: isSelected ? (isFocusedSection ? 'green' : 'cyan') : 'gray',
        bold: isSelected,
        selected: isSelected
      };
    }

    if (row.kind === 'loading') {
      return {
        text: truncate(row.label || 'Loading...', width),
        color: 'cyan',
        bold: false,
        selected: false,
        loading: true
      };
    }

    return {
      text: truncate(`${isSelected ? `${cursor} ` : '  '}${row.label || ''}`, width),
      color: isSelected ? (isFocusedSection ? 'green' : 'cyan') : (row.color || 'gray'),
      bold: isSelected || Boolean(row.bold),
      selected: isSelected
    };
  });
}

function getSelectedRow(rows, selectedIndex) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return rows[clampIndex(selectedIndex, rows.length)] || null;
}

function rowToFileEntry(row) {
  if (!row || row.kind !== 'file' || typeof row.path !== 'string') {
    return null;
  }
  return {
    label: row.label || path.basename(row.path),
    path: row.path,
    scope: row.scope || 'file'
  };
}

function moveRowSelection(rows, currentIndex, direction) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  const clamped = clampIndex(currentIndex, rows.length);
  const step = direction >= 0 ? 1 : -1;
  let next = clamped + step;

  while (next >= 0 && next < rows.length) {
    if (rows[next]?.selectable !== false) {
      return next;
    }
    next += step;
  }

  return clamped;
}

function openFileWithDefaultApp(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    return {
      ok: false,
      message: 'No file selected to open.'
    };
  }

  if (!fileExists(filePath)) {
    return {
      ok: false,
      message: `File not found: ${filePath}`
    };
  }

  let command = null;
  let args = [];

  if (process.platform === 'darwin') {
    command = 'open';
    args = [filePath];
  } else if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', filePath];
  } else {
    command = 'xdg-open';
    args = [filePath];
  }

  const result = spawnSync(command, args, { stdio: 'ignore' });
  if (result.error) {
    return {
      ok: false,
      message: `Unable to open file: ${result.error.message}`
    };
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    return {
      ok: false,
      message: `Open command failed with exit code ${result.status}.`
    };
  }

  return {
    ok: true,
    message: `Opened ${filePath}`
  };
}

function buildQuickHelpText(view, options = {}) {
  const {
    flow = 'fire',
    previewOpen = false,
    availableFlowCount = 1,
    hasWorktrees = false
  } = options;
  const isAidlc = String(flow || '').toLowerCase() === 'aidlc';
  const isSimple = String(flow || '').toLowerCase() === 'simple';
  const activeLabel = isAidlc ? 'active bolt' : (isSimple ? 'active spec' : 'active run');

  const parts = ['1/2/3/4 tabs', 'g/G sections'];

  if (view === 'runs' || view === 'intents' || view === 'completed' || view === 'health') {
    if (previewOpen) {
      parts.push('tab pane', '↑/↓ nav/scroll', 'v/space close');
    } else {
      parts.push('↑/↓ navigate', 'enter expand', 'v/space preview');
    }
  }
  if (view === 'runs') {
    if (hasWorktrees) {
      parts.push('b worktrees', 'u others');
    }
    parts.push('a current', 'f files');
    if (hasWorktrees) {
      parts.push('w worktree');
    }
  }
  parts.push(`tab1 ${activeLabel}`);

  if (availableFlowCount > 1) {
    parts.push('[/] flow');
  }

  parts.push('r refresh', '? shortcuts', 'q quit');
  return parts.join(' | ');
}

function buildHelpOverlayLines(options = {}) {
  const {
    view = 'runs',
    flow = 'fire',
    previewOpen = false,
    paneFocus = 'main',
    availableFlowCount = 1,
    showErrorSection = false,
    hasWorktrees = false
  } = options;
  const isAidlc = String(flow || '').toLowerCase() === 'aidlc';
  const isSimple = String(flow || '').toLowerCase() === 'simple';
  const itemLabel = isAidlc ? 'bolt' : (isSimple ? 'spec' : 'run');
  const itemPlural = isAidlc ? 'bolts' : (isSimple ? 'specs' : 'runs');

  const lines = [
    { text: 'Global', color: 'cyan', bold: true },
    'q or Ctrl+C quit',
    'r refresh snapshot',
    `1 active ${itemLabel} | 2 intents | 3 completed ${itemPlural} | 4 standards/health`,
    'g next section | G previous section',
    'h/? toggle this shortcuts overlay',
    'esc close overlays (help/preview/fullscreen)',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 1 Active', color: 'yellow', bold: true },
    ...(hasWorktrees ? ['b focus worktrees section', 'u focus other-worktrees section'] : []),
    `a focus active ${itemLabel}`,
    `f focus ${itemLabel} files`,
    ...(hasWorktrees ? ['w open worktree switcher'] : []),
    'up/down or j/k move selection',
    'enter expand/collapse selected folder row',
    'v or space preview selected file',
    'v twice quickly opens fullscreen preview overlay',
    'tab switch focus between main and preview panes',
    'o open selected file in system default app'
  ];

  if (previewOpen) {
    lines.push(`preview is open (focus: ${paneFocus})`);
  }

  if (availableFlowCount > 1) {
    lines.push('[/] (and m) switch flow');
  }

  lines.push(
    { text: '', color: undefined, bold: false },
    { text: 'Tab 2 Intents', color: 'green', bold: true },
    'i focus intents',
    'n next intents | x completed intents',
    'left/right toggles next/completed when intents is focused',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 3 Completed', color: 'blue', bold: true },
    'c focus completed items',
    { text: '', color: undefined, bold: false },
    { text: 'Tab 4 Standards/Health', color: 'magenta', bold: true },
    `s standards | t stats | w warnings${showErrorSection ? ' | e errors' : ''}`,
    { text: '', color: undefined, bold: false },
    { text: `Current view: ${String(view || 'runs').toUpperCase()}`, color: 'gray', bold: false }
  );

  return lines;
}

function buildWorktreeOverlayLines(snapshot, selectedIndex, width) {
  const meta = getDashboardWorktreeMeta(snapshot);
  if (!meta) {
    return [{
      text: truncate('No worktrees available', width),
      color: 'gray',
      bold: false
    }];
  }

  const items = Array.isArray(meta.items) ? meta.items : [];
  const clampedIndex = clampIndex(selectedIndex, items.length || 1);
  const lines = [{
    text: truncate('Use ↑/↓ and Enter to switch. Esc closes.', width),
    color: 'gray',
    bold: false
  }];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const marker = index === clampedIndex ? '>' : ' ';
    const current = item.isSelected ? '[CURRENT] ' : '';
    const main = item.isMainBranch && !item.detached ? '[MAIN] ' : '';
    const status = item.status === 'loading'
      ? 'loading'
      : (item.status === 'error'
        ? 'error'
        : (item.flowAvailable ? `${item.activeCount || 0} active` : 'flow unavailable'));
    const pathLabel = item.path ? path.basename(item.path) : 'unknown';
    lines.push({
      text: truncate(`${marker} ${current}${main}${getWorktreeDisplayName(item)} (${pathLabel}) | ${status}`, width),
      color: index === clampedIndex ? 'green' : (item.isSelected ? 'cyan' : 'gray'),
      bold: index === clampedIndex || item.isSelected
    });
  }

  if (meta.hasPendingScans) {
    lines.push({
      text: truncate('Background scan in progress for additional worktrees...', width),
      color: 'yellow',
      bold: false
    });
  }

  return lines;
}

function colorizeMarkdownLine(line, inCodeBlock) {
  const text = String(line ?? '');

  if (/^\s*```/.test(text)) {
    return {
      color: 'magenta',
      bold: true,
      togglesCodeBlock: true
    };
  }

  if (/^\s{0,3}#{1,6}\s+/.test(text)) {
    return {
      color: 'cyan',
      bold: true,
      togglesCodeBlock: false
    };
  }

  if (/^\s*[-*+]\s+\[[ xX]\]/.test(text) || /^\s*[-*+]\s+/.test(text) || /^\s*\d+\.\s+/.test(text)) {
    return {
      color: 'yellow',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (/^\s*>\s+/.test(text)) {
    return {
      color: 'gray',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (/^\s*---\s*$/.test(text)) {
    return {
      color: 'yellow',
      bold: false,
      togglesCodeBlock: false
    };
  }

  if (inCodeBlock) {
    return {
      color: 'green',
      bold: false,
      togglesCodeBlock: false
    };
  }

  return {
    color: undefined,
    bold: false,
    togglesCodeBlock: false
  };
}

function buildPreviewLines(fileEntry, width, scrollOffset, options = {}) {
  const fullDocument = options?.fullDocument === true;

  if (!fileEntry || typeof fileEntry.path !== 'string') {
    return [{ text: truncate('No file selected', width), color: 'gray', bold: false }];
  }

  let content;
  try {
    content = fs.readFileSync(fileEntry.path, 'utf8');
  } catch (error) {
    return [{
      text: truncate(`Unable to read ${fileEntry.label || fileEntry.path}: ${error.message}`, width),
      color: 'red',
      bold: false
    }];
  }

  const rawLines = String(content).split(/\r?\n/);
  const headLine = {
    text: truncate(`file: ${fileEntry.path}`, width),
    color: 'cyan',
    bold: true
  };

  const cappedLines = fullDocument ? rawLines : rawLines.slice(0, 300);
  const hiddenLineCount = fullDocument ? 0 : Math.max(0, rawLines.length - cappedLines.length);
  let inCodeBlock = false;

  const highlighted = cappedLines.map((rawLine, index) => {
    const prefixedLine = `${String(index + 1).padStart(4, ' ')} | ${rawLine}`;
    const { color, bold, togglesCodeBlock } = colorizeMarkdownLine(rawLine, inCodeBlock);
    if (togglesCodeBlock) {
      inCodeBlock = !inCodeBlock;
    }
    return {
      text: truncate(prefixedLine, width),
      color,
      bold
    };
  });

  if (hiddenLineCount > 0) {
    highlighted.push({
      text: truncate(`... ${hiddenLineCount} additional lines hidden`, width),
      color: 'gray',
      bold: false
    });
  }

  const clampedOffset = clampIndex(scrollOffset, highlighted.length);
  const body = highlighted.slice(clampedOffset);

  return [headLine, { text: '', color: undefined, bold: false }, ...body];
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

    const contentWidth = Math.max(18, width - 4);
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
      { id: 'health', label: `4 ${icons.health} STANDARDS/HEALTH` }
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
      health: 'standards'
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
      'error-details': 0
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
    const otherWorktreesSectionEnabled = worktreeSectionEnabled
      && isSelectedWorktreeMain(snapshot)
      && getEffectiveFlow(activeFlow, snapshot) !== 'simple';

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
      'error-details': errorDetailsRows
    };
    const worktreeItems = getWorktreeItems(snapshot);
    const selectedWorktree = getSelectedWorktree(snapshot);
    const selectedWorktreeLabel = selectedWorktree ? getWorktreeDisplayName(selectedWorktree) : null;
    const worktreeWatchSignature = `${snapshot?.dashboardWorktrees?.selectedWorktreeId || ''}|${worktreeItems
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

    const refresh = useCallback(async () => {
      const now = new Date().toISOString();

      try {
        const result = await parseSnapshotForActiveFlow(activeFlow, {
          selectedWorktreeId
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
          setWorktreeOverlayIndex((previous) => Math.min(Math.max(0, worktreeItems.length - 1), previous + 1));
          return;
        }

        if (key.return || key.enter) {
          const selectedOverlayItem = worktreeItems[clampIndex(worktreeOverlayIndex, worktreeItems.length || 1)];
          if (!selectedOverlayItem) {
            setStatusLine('No worktree selected.');
            setWorktreeOverlayOpen(false);
            return;
          }
          setSelectedWorktreeId(selectedOverlayItem.id);
          setWorktreeOverlayOpen(false);
          setPreviewTarget(null);
          setPreviewOpen(false);
          setOverlayPreviewOpen(false);
          setPreviewScroll(0);
          setPaneFocus('main');
          setStatusLine(`Switched to worktree: ${getWorktreeDisplayName(selectedOverlayItem)}`);
          void refresh();
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

      if (ui.view === 'runs' && input === 'w' && worktreeSectionEnabled) {
        setWorktreeOverlayIndex(clampIndex(worktreeItems.findIndex((item) => item.id === selectedWorktreeId), worktreeItems.length || 1));
        setWorktreeOverlayOpen(true);
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
          'error-details': 0
        });
        setSectionFocus({
          runs: 'current-run',
          intents: 'intent-status',
          completed: 'completed-runs',
          health: 'standards'
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
          'error-details': 0
        });
        setSectionFocus({
          runs: 'current-run',
          intents: 'intent-status',
          completed: 'completed-runs',
          health: 'standards'
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

        // Resize in some terminals can leave stale frame rows behind.
        // Force clear so next render paints from a clean origin.
        if (typeof stdout.write === 'function' && stdout.isTTY !== false) {
          stdout.write('\u001B[2J\u001B[3J\u001B[H');
        }
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
      const fallbackIntervalMs = Math.max(refreshMs, 5000);
      const interval = setInterval(() => {
        void refresh();
      }, fallbackIntervalMs);

      return () => {
        clearInterval(interval);
        void runtime.close();
      };
    }, [watchEnabled, refreshMs, refresh, rootPath, workspacePath, resolveRootPathForFlow, resolveRootPathsForFlow, activeFlow, worktreeWatchSignature, selectedWorktreeId]);

    useEffect(() => {
      if (!stdout || typeof stdout.write !== 'function') {
        return;
      }
      if (stdout.isTTY === false) {
        return;
      }
      stdout.write('\u001B[2J\u001B[3J\u001B[H');
    }, [stdout]);

    const cols = Number.isFinite(terminalSize.columns) ? terminalSize.columns : (process.stdout.columns || 120);
    const rows = Number.isFinite(terminalSize.rows) ? terminalSize.rows : (process.stdout.rows || 40);

    const fullWidth = Math.max(40, cols - 1);
    const showFlowBar = availableFlowIds.length > 1;
    const showFooterHelpLine = rows >= 10;
    const showErrorPanel = Boolean(error) && rows >= 18;
    const showGlobalErrorPanel = showErrorPanel && ui.view !== 'health' && !ui.showHelp && !worktreeOverlayOpen;
    const showErrorInline = Boolean(error) && !showErrorPanel && !worktreeOverlayOpen;
    const showApprovalBanner = approvalGateLine !== '' && !ui.showHelp && !worktreeOverlayOpen;
    const showStatusLine = statusLine !== '';
    const densePanels = rows <= 28 || cols <= 120;

    const reservedRows =
      2 +
      (showFlowBar ? 1 : 0) +
      (showApprovalBanner ? 1 : 0) +
      (showFooterHelpLine ? 1 : 0) +
      (showGlobalErrorPanel ? 5 : 0) +
      (showErrorInline ? 1 : 0) +
      (showStatusLine ? 1 : 0);
    const frameSafetyRows = 2;
    const contentRowsBudget = Math.max(4, rows - reservedRows - frameSafetyRows);
    const ultraCompact = rows <= 14;
    const panelTitles = getPanelTitles(activeFlow, snapshot);
    const splitPreviewLayout = previewOpen && !overlayPreviewOpen && !ui.showHelp && !worktreeOverlayOpen && cols >= 110 && rows >= 16;
    const mainPaneWidth = splitPreviewLayout
      ? Math.max(34, Math.floor((fullWidth - 1) * 0.52))
      : fullWidth;
    const previewPaneWidth = splitPreviewLayout
      ? Math.max(30, fullWidth - mainPaneWidth - 1)
      : fullWidth;
    const mainCompactWidth = Math.max(18, mainPaneWidth - 4);
    const previewCompactWidth = Math.max(18, previewPaneWidth - 4);

    const sectionLines = Object.fromEntries(
      Object.entries(rowsBySection).map(([sectionKey, sectionRows]) => [
        sectionKey,
        buildInteractiveRowsLines(
          sectionRows,
          selectionBySection[sectionKey] || 0,
          icons,
          mainCompactWidth,
          paneFocus === 'main' && focusedSection === sectionKey
        )
      ])
    );
    const effectivePreviewTarget = previewTarget || selectedFocusedFile;
    const previewLines = previewOpen
      ? buildPreviewLines(effectivePreviewTarget, previewCompactWidth, previewScroll, {
        fullDocument: overlayPreviewOpen
      })
      : [];

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

    if (!ui.showHelp && previewOpen && !overlayPreviewOpen && !splitPreviewLayout) {
      panelCandidates.push({
        key: 'preview',
        title: `Preview: ${effectivePreviewTarget?.label || 'unknown'}`,
        lines: previewLines,
        borderColor: 'magenta'
      });
    }

    if (ultraCompact && !splitPreviewLayout) {
      if (previewOpen) {
        panelCandidates = panelCandidates.filter((panel) => panel && (panel.key === focusedSection || panel.key === 'preview'));
      } else {
        const focusedPanel = panelCandidates.find((panel) => panel?.key === focusedSection);
        panelCandidates = [focusedPanel || panelCandidates[0]];
      }
    }

    const panels = allocateSingleColumnPanels(panelCandidates, contentRowsBudget);

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
    if (splitPreviewLayout && !overlayPreviewOpen) {
      const previewBodyLines = Math.max(1, contentRowsBudget - 3);
      const previewPanel = {
        key: 'preview-split',
        title: `Preview: ${effectivePreviewTarget?.label || 'unknown'}`,
        lines: previewLines,
        borderColor: 'magenta',
        maxLines: previewBodyLines
      };

      contentNode = React.createElement(
        Box,
        { width: fullWidth, flexDirection: 'row' },
        React.createElement(
          Box,
          { width: mainPaneWidth, flexDirection: 'column' },
          ...panels.map((panel, index) => React.createElement(SectionPanel, {
            key: panel.key,
            title: panel.title,
            lines: panel.lines,
            width: mainPaneWidth,
            maxLines: panel.maxLines,
            borderColor: panel.borderColor,
            marginBottom: densePanels ? 0 : (index === panels.length - 1 ? 0 : 1),
            dense: densePanels,
            focused: paneFocus === 'main' && panel.key === focusedSection
          }))
        ),
        React.createElement(Box, { width: 1 }, React.createElement(Text, null, ' ')),
        React.createElement(
          Box,
          { width: previewPaneWidth, flexDirection: 'column' },
          React.createElement(SectionPanel, {
            key: previewPanel.key,
            title: previewPanel.title,
            lines: previewPanel.lines,
            width: previewPaneWidth,
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
      statusLine !== ''
        ? React.createElement(Text, { color: 'yellow' }, truncate(statusLine, fullWidth))
        : null,
      showFooterHelpLine
        ? React.createElement(Text, { color: 'gray' }, truncate(quickHelpText, fullWidth))
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
  allocateSingleColumnPanels,
  detectDashboardApprovalGate,
  detectFireRunApprovalGate,
  detectAidlcBoltApprovalGate
};
