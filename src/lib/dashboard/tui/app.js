const fs = require('fs');
const path = require('path');
const { createWatchRuntime } = require('../runtime/watch-runtime');
const { createInitialUIState, cycleView, cycleViewBackward } = require('./store');

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

function normalizePanelLine(line) {
  if (line && typeof line === 'object' && !Array.isArray(line)) {
    return {
      text: typeof line.text === 'string' ? line.text : String(line.text ?? ''),
      color: line.color,
      bold: Boolean(line.bold),
      selected: Boolean(line.selected)
    };
  }

  return {
    text: String(line ?? ''),
    color: undefined,
    bold: false,
    selected: false
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

function buildHeaderLine(snapshot, flow, watchEnabled, watchStatus, lastRefreshAt, view, width) {
  const projectName = snapshot?.project?.name || 'Unnamed project';
  const shortStats = buildShortStats(snapshot, flow);

  const line = `${flow.toUpperCase()} | ${projectName} | ${shortStats} | watch:${watchEnabled ? watchStatus : 'off'} | ${view} | ${formatTime(lastRefreshAt)}`;

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

function buildOverviewIntentLines(snapshot, width, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  if (effectiveFlow === 'aidlc') {
    return buildAidlcOverviewIntentLines(snapshot, width);
  }
  if (effectiveFlow === 'simple') {
    return buildSimpleOverviewIntentLines(snapshot, width);
  }
  return buildFireOverviewIntentLines(snapshot, width);
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
      completed: 'Recent Completed Bolts'
    };
  }
  if (effectiveFlow === 'simple') {
    return {
      current: 'Current Spec',
      files: 'Spec Files',
      pending: 'Pending Specs',
      completed: 'Recent Completed Specs'
    };
  }
  return {
    current: 'Current Run',
    files: 'Run Files',
    pending: 'Pending Queue',
    completed: 'Recent Completed Runs'
  };
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

function getRunFileEntries(snapshot, flow) {
  const effectiveFlow = getEffectiveFlow(flow, snapshot);
  const entries = [];
  const seenPaths = new Set();

  if (effectiveFlow === 'aidlc') {
    const bolt = getCurrentBolt(snapshot);
    for (const file of collectAidlcBoltFiles(bolt)) {
      pushFileEntry(entries, seenPaths, { ...file, scope: 'active' });
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

  const pendingItems = Array.isArray(snapshot?.pendingItems) ? snapshot.pendingItems : [];
  for (const pendingItem of pendingItems) {
    pushFileEntry(entries, seenPaths, {
      label: `${pendingItem?.intentId || 'intent'}/${pendingItem?.id || 'work-item'}.md`,
      path: pendingItem?.filePath,
      scope: 'upcoming'
    });

    if (pendingItem?.intentId) {
      pushFileEntry(entries, seenPaths, {
        label: `${pendingItem.intentId}/brief.md`,
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
      label: `${intent.id}/brief.md`,
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

function buildSelectableRunFileLines(fileEntries, selectedIndex, icons, width, flow) {
  if (!Array.isArray(fileEntries) || fileEntries.length === 0) {
    return [truncate(getNoFileMessage(flow), width)];
  }

  const clampedIndex = clampIndex(selectedIndex, fileEntries.length);
  return fileEntries.map((file, index) => {
    const isSelected = index === clampedIndex;
    const prefix = isSelected ? '>' : ' ';
    const scope = formatScope(file.scope);
    return {
      text: truncate(`${prefix} ${icons.runFile} [${scope}] ${file.label}`, width),
      color: isSelected ? 'cyan' : undefined,
      bold: isSelected,
      selected: isSelected
    };
  });
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

function buildPreviewLines(fileEntry, width, scrollOffset) {
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

  const cappedLines = rawLines.slice(0, 300);
  const hiddenLineCount = Math.max(0, rawLines.length - cappedLines.length);
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
    parseSnapshot,
    parseSnapshotForFlow,
    workspacePath,
    rootPath,
    flow,
    availableFlows,
    resolveRootPathForFlow,
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
      ...visibleLines.map((line, index) => React.createElement(
        Text,
        {
          key: `${title}-${index}`,
          color: line.color,
          bold: line.bold
        },
        line.text
      ))
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

  function FlowBar(props) {
    const { activeFlow, width, flowIds } = props;
    if (!Array.isArray(flowIds) || flowIds.length <= 1) {
      return null;
    }

    return React.createElement(
      Box,
      { width, flexWrap: 'nowrap' },
      ...flowIds.map((flowId) => {
        const isActive = flowId === activeFlow;
        return React.createElement(
          Text,
          {
            key: flowId,
            bold: isActive,
            color: isActive ? 'black' : 'gray',
            backgroundColor: isActive ? 'green' : undefined
          },
          ` ${flowId.toUpperCase()} `
        );
      })
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

    const [activeFlow, setActiveFlow] = useState(fallbackFlow);
    const [snapshot, setSnapshot] = useState(initialSnapshot || null);
    const [error, setError] = useState(initialNormalizedError);
    const [ui, setUi] = useState(createInitialUIState());
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewScroll, setPreviewScroll] = useState(0);
    const [lastRefreshAt, setLastRefreshAt] = useState(new Date().toISOString());
    const [watchStatus, setWatchStatus] = useState(watchEnabled ? 'watching' : 'off');
    const [terminalSize, setTerminalSize] = useState(() => ({
      columns: stdout?.columns || process.stdout.columns || 120,
      rows: stdout?.rows || process.stdout.rows || 40
    }));
    const icons = resolveIconSet();
    const parseSnapshotForActiveFlow = useCallback(async (flowId) => {
      if (typeof parseSnapshotForFlow === 'function') {
        return parseSnapshotForFlow(flowId);
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
    const runFileEntries = getRunFileEntries(snapshot, activeFlow);
    const clampedSelectedFileIndex = clampIndex(selectedFileIndex, runFileEntries.length);
    const selectedFile = runFileEntries[clampedSelectedFileIndex] || null;

    const refresh = useCallback(async () => {
      const now = new Date().toISOString();

      try {
        const result = await parseSnapshotForActiveFlow(activeFlow);

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
    }, [activeFlow, parseSnapshotForActiveFlow, watchEnabled]);

    useInput((input, key) => {
      if ((key.ctrl && input === 'c') || input === 'q') {
        exit();
        return;
      }

      if (input === 'r') {
        void refresh();
        return;
      }

      if (input === 'v' && ui.view === 'runs') {
        if (selectedFile) {
          setPreviewOpen((previous) => !previous);
          setPreviewScroll(0);
        }
        return;
      }

      if (key.escape && previewOpen) {
        setPreviewOpen(false);
        setPreviewScroll(0);
        return;
      }

      if (ui.view === 'runs' && (key.upArrow || key.downArrow || input === 'j' || input === 'k')) {
        const moveDown = key.downArrow || input === 'j';
        const moveUp = key.upArrow || input === 'k';

        if (previewOpen) {
          if (moveDown) {
            setPreviewScroll((previous) => previous + 1);
          } else if (moveUp) {
            setPreviewScroll((previous) => Math.max(0, previous - 1));
          }
          return;
        }

        if (moveDown) {
          setSelectedFileIndex((previous) => clampIndex(previous + 1, runFileEntries.length));
        } else if (moveUp) {
          setSelectedFileIndex((previous) => clampIndex(previous - 1, runFileEntries.length));
        }
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
        setPreviewOpen(false);
        setPreviewScroll(0);
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
        setPreviewOpen(false);
        setPreviewScroll(0);
      }
    });

    useEffect(() => {
      void refresh();
    }, [refresh]);

    useEffect(() => {
      setSelectedFileIndex((previous) => clampIndex(previous, runFileEntries.length));
      if (runFileEntries.length === 0) {
        setPreviewOpen(false);
        setPreviewScroll(0);
      }
    }, [activeFlow, runFileEntries.length, snapshot?.generatedAt]);

    useEffect(() => {
      if (ui.view !== 'runs') {
        setPreviewOpen(false);
        setPreviewScroll(0);
      }
    }, [ui.view]);

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

      const watchRootPath = resolveRootPathForFlow
        ? resolveRootPathForFlow(activeFlow)
        : (rootPath || `${workspacePath}/.specs-fire`);

      const runtime = createWatchRuntime({
        rootPath: watchRootPath,
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
    }, [watchEnabled, refreshMs, refresh, rootPath, workspacePath, resolveRootPathForFlow, activeFlow]);

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
    const panelTitles = getPanelTitles(activeFlow, snapshot);
    const runFileLines = buildSelectableRunFileLines(runFileEntries, clampedSelectedFileIndex, icons, compactWidth, activeFlow);
    const previewLines = previewOpen ? buildPreviewLines(selectedFile, compactWidth, previewScroll) : [];

    let panelCandidates;
    if (ui.view === 'overview') {
      panelCandidates = [
        {
          key: 'project',
          title: 'Project + Workspace',
          lines: buildOverviewProjectLines(snapshot, compactWidth, activeFlow),
          borderColor: 'green'
        },
        {
          key: 'intent-status',
          title: 'Intent Status',
          lines: buildOverviewIntentLines(snapshot, compactWidth, activeFlow),
          borderColor: 'yellow'
        },
        {
          key: 'standards',
          title: 'Standards',
          lines: buildOverviewStandardsLines(snapshot, compactWidth, activeFlow),
          borderColor: 'blue'
        }
      ];
    } else if (ui.view === 'health') {
      panelCandidates = [
        {
          key: 'stats',
          title: 'Stats',
          lines: buildStatsLines(snapshot, compactWidth, activeFlow),
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
          title: panelTitles.current,
          lines: buildCurrentRunLines(snapshot, compactWidth, activeFlow),
          borderColor: 'green'
        },
        {
          key: 'run-files',
          title: panelTitles.files,
          lines: runFileLines,
          borderColor: 'yellow'
        },
        previewOpen
          ? {
            key: 'preview',
            title: `Preview: ${selectedFile?.label || 'unknown'}`,
            lines: previewLines,
            borderColor: 'magenta'
          }
          : null,
        {
          key: 'pending',
          title: panelTitles.pending,
          lines: buildPendingLines(snapshot, compactWidth, activeFlow),
          borderColor: 'yellow'
        },
        {
          key: 'completed',
          title: panelTitles.completed,
          lines: buildCompletedLines(snapshot, compactWidth, activeFlow),
          borderColor: 'blue'
        }
      ];
    }

    if (ultraCompact) {
      if (previewOpen) {
        panelCandidates = panelCandidates.filter((panel) => panel && (panel.key === 'current-run' || panel.key === 'preview'));
      } else {
        panelCandidates = [panelCandidates[0]];
      }
    }

    const panels = allocateSingleColumnPanels(panelCandidates, contentRowsBudget);
    const flowSwitchHint = availableFlowIds.length > 1 ? ' | [ or ] switch flow' : '';
    const previewHint = previewOpen ? ' | ↑/↓ scroll preview' : ' | ↑/↓ select file | v preview';
    const helpText = `q quit | r refresh | h/? help | ←/→ or tab switch views | 1 runs | 2 overview | 3 health${previewHint}${flowSwitchHint}`;

    return React.createElement(
      Box,
      { flexDirection: 'column', width: fullWidth },
      React.createElement(Text, { color: 'cyan' }, buildHeaderLine(snapshot, activeFlow, watchEnabled, watchStatus, lastRefreshAt, ui.view, fullWidth)),
      React.createElement(FlowBar, { activeFlow, width: fullWidth, flowIds: availableFlowIds }),
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
