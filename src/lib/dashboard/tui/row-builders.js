const path = require('path');
const { spawnSync } = require('child_process');
const { truncate, normalizePanelLine, clampIndex, fileExists } = require('./helpers');
const { sanitizeRenderLine } = require('./overlays');
const {
  getEffectiveFlow,
  getCurrentRun,
  getCurrentFireWorkItem,
  getCurrentBolt,
  getCurrentSpec,
  getCurrentPhaseLabel,
  buildPhaseTrack,
  isFireRunAwaitingApproval,
  isAidlcBoltAwaitingApproval
} = require('./flow-builders');
const {
  collectFireRunFiles,
  collectAidlcBoltFiles,
  collectSimpleSpecFiles,
  collectAidlcIntentContextFiles,
  filterExistingFiles,
  getRunFileEntries,
  buildIntentScopedLabel,
  findIntentIdForWorkItem,
  resolveFireWorkItemPath,
  formatScope,
  getNoFileMessage,
  getNoPendingMessage,
  getNoCompletedMessage,
  getNoCurrentMessage
} = require('./file-entries');

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
          kind: file.previewType === 'git-diff' ? 'git-file' : 'file',
          key: `${group.key}:file:${file.path}:${index}`,
          label: file.label,
          path: file.path,
          scope: file.scope || 'file',
          selectable: true,
          previewType: file.previewType,
          repoRoot: file.repoRoot,
          relativePath: file.relativePath,
          bucket: file.bucket
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
      const safeLabel = sanitizeRenderLine(row.label || '');
      return {
        text: truncate(`${cursor} ${marker} ${safeLabel}`, width),
        color: isSelected ? (isFocusedSection ? 'green' : 'cyan') : undefined,
        bold: isSelected,
        selected: isSelected
      };
    }

    if (row.kind === 'file' || row.kind === 'git-file' || row.kind === 'git-commit') {
      const scope = row.scope ? `[${formatScope(row.scope)}] ` : '';
      const safeLabel = sanitizeRenderLine(row.label || '');
      return {
        text: truncate(`${cursor}   ${icons.runFile} ${scope}${safeLabel}`, width),
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
      text: truncate(`${isSelected ? `${cursor} ` : '  '}${sanitizeRenderLine(row.label || '')}`, width),
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
  if (!row) {
    return null;
  }

  if (row.kind === 'git-commit') {
    const commitHash = typeof row.commitHash === 'string' ? row.commitHash : '';
    if (commitHash === '') {
      return null;
    }
    return {
      label: row.label || commitHash,
      path: commitHash,
      scope: 'commit',
      previewType: row.previewType || 'git-commit-diff',
      repoRoot: row.repoRoot,
      commitHash
    };
  }

  if ((row.kind !== 'file' && row.kind !== 'git-file') || typeof row.path !== 'string') {
    return null;
  }
  return {
    label: row.label || path.basename(row.path),
    path: row.path,
    scope: row.scope || 'file',
    previewType: row.previewType,
    repoRoot: row.repoRoot,
    relativePath: row.relativePath,
    bucket: row.bucket
  };
}

function firstFileEntryFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  for (const row of rows) {
    const entry = rowToFileEntry(row);
    if (entry) {
      return entry;
    }
  }

  return null;
}

function rowToWorktreeId(row) {
  if (!row || typeof row.key !== 'string') {
    return null;
  }

  const prefix = 'worktree:item:';
  if (!row.key.startsWith(prefix)) {
    return null;
  }

  const worktreeId = row.key.slice(prefix.length).trim();
  return worktreeId === '' ? null : worktreeId;
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

module.exports = {
  buildFireCurrentRunGroups,
  buildCurrentGroups,
  buildRunFileGroups,
  getFileEntityLabel,
  buildRunFileEntityGroups,
  normalizeInfoLine,
  toInfoRows,
  toLoadingRows,
  buildOverviewIntentGroups,
  buildStandardsRows,
  buildProjectGroups,
  buildPendingGroups,
  buildCompletedGroups,
  toExpandableRows,
  buildInteractiveRowsLines,
  getSelectedRow,
  rowToFileEntry,
  firstFileEntryFromRows,
  rowToWorktreeId,
  moveRowSelection,
  openFileWithDefaultApp
};
