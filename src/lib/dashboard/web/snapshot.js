const path = require('path');
const { detectFlow } = require('../flow-detect');
const { parseFireDashboard } = require('../fire/parser');
const { parseAidlcDashboard } = require('../aidlc/parser');
const { parseSimpleDashboard } = require('../simple/parser');
const { listGitChanges } = require('../git/changes');
const { createSetDataMessage } = require('./extension-adapter');

const FLOW_PARSERS = {
  fire: parseFireDashboard,
  aidlc: parseAidlcDashboard,
  simple: parseSimpleDashboard
};

function normalizeFlow(flow) {
  return String(flow || '').trim().toLowerCase();
}

function compactError(error) {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown dashboard error.'
    };
  }

  return {
    code: error.code || 'DASHBOARD_ERROR',
    message: error.message || String(error),
    hint: error.hint,
    details: error.details,
    path: error.path
  };
}

function createCard(label, value, detail) {
  return {
    label,
    value: String(value ?? 0),
    detail: detail || ''
  };
}

function summarizeAidlc(snapshot) {
  const stats = snapshot?.stats || {};
  const activeBolts = Array.isArray(snapshot?.activeBolts) ? snapshot.activeBolts : [];
  const pendingBolts = Array.isArray(snapshot?.pendingBolts) ? snapshot.pendingBolts : [];
  const completedBolts = Array.isArray(snapshot?.completedBolts) ? snapshot.completedBolts : [];
  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];

  return {
    cards: [
      createCard('Intents', stats.totalIntents, `${stats.completedIntents || 0} complete`),
      createCard('Stories', stats.totalStories, `${stats.completedStories || 0} complete`),
      createCard('Bolts', stats.totalBolts, `${stats.activeBoltsCount || 0} active`),
      createCard('Progress', `${stats.progressPercent || 0}%`, 'story completion')
    ],
    sections: [
      {
        title: 'Active Bolts',
        empty: 'No active bolts.',
        items: activeBolts.map((bolt) => ({
          title: bolt.id,
          meta: `${bolt.intent || 'unknown intent'} / ${bolt.unit || 'unknown unit'}`,
          status: bolt.currentStage || bolt.status,
          path: bolt.filePath
        }))
      },
      {
        title: 'Queued Bolts',
        empty: 'No queued bolts.',
        items: pendingBolts.slice(0, 12).map((bolt) => ({
          title: bolt.id,
          meta: `${bolt.intent || 'unknown intent'} / ${bolt.unit || 'unknown unit'}`,
          status: bolt.isBlocked ? 'blocked' : bolt.status,
          path: bolt.filePath
        }))
      },
      {
        title: 'Recent Completed Bolts',
        empty: 'No completed bolts.',
        items: completedBolts.slice(0, 12).map((bolt) => ({
          title: bolt.id,
          meta: `${bolt.intent || 'unknown intent'} / ${bolt.unit || 'unknown unit'}`,
          status: bolt.completedAt || 'completed',
          path: bolt.filePath
        }))
      },
      {
        title: 'Intents',
        empty: 'No intents found.',
        items: intents.map((intent) => ({
          title: intent.title || intent.id,
          meta: `${intent.unitCount || 0} units / ${intent.storyCount || 0} stories`,
          status: intent.status,
          path: intent.path
        }))
      }
    ],
    primaryItems: intents.map((intent) => ({
      title: intent.title || intent.id,
      status: intent.status,
      path: intent.path
    }))
  };
}

function summarizeFire(snapshot) {
  const stats = snapshot?.stats || {};
  const activeRuns = Array.isArray(snapshot?.activeRuns) ? snapshot.activeRuns : [];
  const pendingItems = Array.isArray(snapshot?.pendingItems) ? snapshot.pendingItems : [];
  const completedRuns = Array.isArray(snapshot?.completedRuns) ? snapshot.completedRuns : [];
  const intents = Array.isArray(snapshot?.intents) ? snapshot.intents : [];

  return {
    cards: [
      createCard('Intents', stats.totalIntents, `${stats.completedIntents || 0} complete`),
      createCard('Work Items', stats.totalWorkItems, `${stats.completedWorkItems || 0} complete`),
      createCard('Runs', stats.totalRuns, `${stats.activeRunsCount || 0} active`),
      createCard('Standards', Array.isArray(snapshot?.standards) ? snapshot.standards.length : 0, 'configured')
    ],
    sections: [
      {
        title: 'Active Runs',
        empty: 'No active runs.',
        items: activeRuns.map((run) => ({
          title: run.id,
          meta: `${run.scope || 'single'} / ${run.workItems?.length || 0} work items`,
          status: run.currentItem || 'active',
          path: run.folderPath
        }))
      },
      {
        title: 'Pending Work Items',
        empty: 'No pending work items.',
        items: pendingItems.slice(0, 12).map((item) => ({
          title: item.title || item.id,
          meta: item.intentTitle || item.intentId || '',
          status: `${item.mode || 'confirm'} / ${item.complexity || 'medium'}`,
          path: item.filePath
        }))
      },
      {
        title: 'Completed Runs',
        empty: 'No completed runs.',
        items: completedRuns.slice(0, 12).map((run) => ({
          title: run.id,
          meta: `${run.scope || 'single'} / ${run.workItems?.length || 0} work items`,
          status: run.completedAt || 'completed',
          path: run.folderPath
        }))
      },
      {
        title: 'Intents',
        empty: 'No intents found.',
        items: intents.map((intent) => ({
          title: intent.title || intent.id,
          meta: `${intent.workItems?.length || 0} work items`,
          status: intent.status,
          path: intent.filePath
        }))
      }
    ],
    primaryItems: intents.map((intent) => ({
      title: intent.title || intent.id,
      status: intent.status,
      path: intent.filePath
    }))
  };
}

function summarizeSimple(snapshot) {
  const stats = snapshot?.stats || {};
  const activeSpecs = Array.isArray(snapshot?.activeSpecs) ? snapshot.activeSpecs : [];
  const completedSpecs = Array.isArray(snapshot?.completedSpecs) ? snapshot.completedSpecs : [];

  return {
    cards: [
      createCard('Specs', stats.totalSpecs, `${stats.completedSpecs || 0} complete`),
      createCard('Tasks', stats.totalTasks, `${stats.completedTasks || 0} complete`),
      createCard('Ready', stats.readySpecs, 'specs'),
      createCard('Progress', `${stats.progressPercent || 0}%`, 'task completion')
    ],
    sections: [
      {
        title: 'Active Specs',
        empty: 'No active specs.',
        items: activeSpecs.map((spec) => ({
          title: spec.name,
          meta: `${spec.tasksCompleted || 0}/${spec.tasksTotal || 0} tasks`,
          status: spec.state,
          path: spec.path
        }))
      },
      {
        title: 'Completed Specs',
        empty: 'No completed specs.',
        items: completedSpecs.slice(0, 12).map((spec) => ({
          title: spec.name,
          meta: `${spec.tasksCompleted || 0}/${spec.tasksTotal || 0} tasks`,
          status: spec.updatedAt || 'completed',
          path: spec.path
        }))
      }
    ],
    primaryItems: activeSpecs.map((spec) => ({
      title: spec.name,
      status: spec.state,
      path: spec.path
    }))
  };
}

function summarizeSnapshot(flow, snapshot) {
  if (flow === 'fire') {
    return summarizeFire(snapshot);
  }
  if (flow === 'simple') {
    return summarizeSimple(snapshot);
  }
  return summarizeAidlc(snapshot);
}

async function loadWebDashboardData(options = {}) {
  const workspacePath = path.resolve(options.workspacePath || options.path || process.cwd());
  let detection;

  try {
    detection = detectFlow(workspacePath, options.flow);
  } catch (error) {
    return {
      ok: false,
      flow: normalizeFlow(options.flow) || null,
      workspacePath,
      error: compactError(error)
    };
  }

  if (!detection.flow) {
    return {
      ok: false,
      flow: null,
      workspacePath,
      availableFlows: detection.availableFlows || [],
      error: {
        code: 'NO_SUPPORTED_FLOW',
        message: 'No supported flow detected. Expected one of: .specs-fire, memory-bank, specs'
      }
    };
  }

  const parser = FLOW_PARSERS[detection.flow];
  if (!parser) {
    return {
      ok: false,
      flow: detection.flow,
      workspacePath,
      availableFlows: detection.availableFlows || [],
      error: {
        code: 'UNSUPPORTED_FLOW',
        message: `Flow "${detection.flow}" is not supported by the web dashboard.`
      }
    };
  }

  const result = await parser(workspacePath);
  if (!result.ok) {
    return {
      ok: false,
      flow: detection.flow,
      workspacePath,
      availableFlows: detection.availableFlows || [],
      error: compactError(result.error)
    };
  }

  const snapshot = {
    ...result.snapshot,
    gitChanges: listGitChanges(workspacePath)
  };

  const data = {
    ok: true,
    flow: detection.flow,
    availableFlows: detection.availableFlows || [detection.flow],
    workspacePath,
    snapshot,
    summary: summarizeSnapshot(detection.flow, snapshot),
    warnings: Array.isArray(snapshot.warnings) ? snapshot.warnings : [],
    generatedAt: snapshot.generatedAt || new Date().toISOString()
  };
  data.webviewMessage = createSetDataMessage(data);
  return data;
}

module.exports = {
  loadWebDashboardData,
  summarizeSnapshot
};
