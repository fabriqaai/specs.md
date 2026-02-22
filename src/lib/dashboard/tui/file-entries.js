const fs = require('fs');
const path = require('path');
const { fileExists, clampIndex } = require('./helpers');
const { getEffectiveFlow, getCurrentRun, getCurrentBolt, getCurrentSpec } = require('./flow-builders');

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
  return (Array.isArray(files) ? files : []).filter((file) => {
    if (!file || typeof file.path !== 'string' || typeof file.label !== 'string') {
      return false;
    }
    if (file.allowMissing === true) {
      return true;
    }
    return fileExists(file.path);
  });
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

function getNoFileMessage(flow) {
  return `No selectable files for ${String(flow || 'flow').toUpperCase()}`;
}

function formatScope(scope) {
  if (scope === 'active') return 'ACTIVE';
  if (scope === 'upcoming') return 'UPNEXT';
  if (scope === 'completed') return 'DONE';
  if (scope === 'intent') return 'INTENT';
  if (scope === 'staged') return 'STAGED';
  if (scope === 'unstaged') return 'UNSTAGED';
  if (scope === 'untracked') return 'UNTRACKED';
  if (scope === 'conflicted') return 'CONFLICT';
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

module.exports = {
  listMarkdownFiles,
  pushFileEntry,
  buildIntentScopedLabel,
  findIntentIdForWorkItem,
  resolveFireWorkItemPath,
  collectFireRunFiles,
  collectAidlcBoltFiles,
  collectSimpleSpecFiles,
  collectAidlcIntentContextFiles,
  filterExistingFiles,
  getRunFileEntries,
  getNoFileMessage,
  formatScope,
  getNoPendingMessage,
  getNoCompletedMessage,
  getNoCurrentMessage
};
