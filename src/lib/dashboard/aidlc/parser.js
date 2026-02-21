const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULT_BOLT_STAGE_MAP = {
  'simple-construction-bolt': ['plan', 'implement', 'test'],
  'ddd-construction-bolt': ['model', 'design', 'adr', 'implement', 'test'],
  'spike-bolt': ['explore', 'document']
};

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

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function parseYamlFile(filePath) {
  const content = readFileSafe(filePath);
  if (content == null) {
    return null;
  }

  try {
    const parsed = yaml.load(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
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
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function normalizeStatus(rawStatus) {
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

  if ([
    'in-progress',
    'inprogress',
    'active',
    'started',
    'wip',
    'working',
    'ready',
    'construction'
  ].includes(normalized)) {
    return 'in_progress';
  }

  if (['draft', 'pending', 'planned', 'todo', 'new', 'queued'].includes(normalized)) {
    return 'pending';
  }

  return 'unknown';
}

function normalizeTimestamp(value) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function parseIntentFolderName(folderName) {
  const match = String(folderName).match(/^(\d{3})-(.+)$/);
  if (!match) {
    return null;
  }

  return {
    number: match[1],
    name: match[2]
  };
}

function parseStoryFilename(filename) {
  const match = String(filename).match(/^(\d{3})-(.+)\.md$/);
  if (!match) {
    return {
      id: path.basename(filename, '.md'),
      title: path.basename(filename, '.md')
    };
  }

  return {
    id: match[1],
    title: match[2]
  };
}

function deriveAggregateStatus(statuses) {
  const safeStatuses = Array.isArray(statuses)
    ? statuses.filter((status) => status && status !== 'unknown')
    : [];

  if (safeStatuses.length === 0) {
    return 'pending';
  }

  if (safeStatuses.some((status) => status === 'in_progress')) {
    return 'in_progress';
  }

  if (safeStatuses.every((status) => status === 'completed')) {
    return 'completed';
  }

  if (safeStatuses.some((status) => status === 'blocked')) {
    return 'blocked';
  }

  return 'pending';
}

function countByStatus(items) {
  return (items || []).reduce((acc, item) => {
    const status = item?.status || 'unknown';
    if (status === 'completed') acc.completed += 1;
    else if (status === 'in_progress') acc.inProgress += 1;
    else if (status === 'blocked') acc.blocked += 1;
    else if (status === 'pending') acc.pending += 1;
    else acc.unknown += 1;
    return acc;
  }, {
    completed: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    unknown: 0
  });
}

function parseStory(storyPath, unitId, intentId) {
  const fileName = path.basename(storyPath);
  const parsedName = parseStoryFilename(fileName);
  const frontmatter = parseFrontmatter(readFileSafe(storyPath) || '');

  return {
    id: parsedName.id,
    title: typeof frontmatter.title === 'string' ? frontmatter.title : parsedName.title,
    unitId,
    intentId,
    path: storyPath,
    status: normalizeStatus(frontmatter.status)
  };
}

function parseUnit(unitPath, intentId) {
  const unitId = path.basename(unitPath);
  const unitBriefPath = path.join(unitPath, 'unit-brief.md');
  const unitBriefFrontmatter = parseFrontmatter(readFileSafe(unitBriefPath) || '');

  const storiesPath = path.join(unitPath, 'stories');
  const storyFiles = listMarkdownFiles(storiesPath);
  const stories = storyFiles
    .map((storyFile) => parseStory(path.join(storiesPath, storyFile), unitId, intentId))
    .sort((a, b) => a.id.localeCompare(b.id));

  const derivedStatus = deriveAggregateStatus(stories.map((story) => story.status));
  const statusFromFrontmatter = normalizeStatus(unitBriefFrontmatter.status);
  const status = statusFromFrontmatter !== 'unknown' ? statusFromFrontmatter : derivedStatus;

  const storyStats = countByStatus(stories);

  return {
    id: unitId,
    intentId,
    path: unitPath,
    status,
    stories,
    storyCount: stories.length,
    completedStories: storyStats.completed,
    inProgressStories: storyStats.inProgress,
    pendingStories: storyStats.pending,
    blockedStories: storyStats.blocked
  };
}

function parseIntent(intentPath, warnings) {
  const folderName = path.basename(intentPath);
  const parsedName = parseIntentFolderName(folderName);

  if (!parsedName) {
    warnings.push(`Intent folder ${folderName} does not match expected format NNN-name.`);
    return null;
  }

  const requirementsPath = path.join(intentPath, 'requirements.md');
  const requirementsFrontmatter = parseFrontmatter(readFileSafe(requirementsPath) || '');

  const unitsPath = path.join(intentPath, 'units');
  const unitFolders = listSubdirectories(unitsPath);
  const units = unitFolders
    .map((unitFolder) => parseUnit(path.join(unitsPath, unitFolder), folderName))
    .sort((a, b) => a.id.localeCompare(b.id));

  const derivedStatus = deriveAggregateStatus(units.map((unit) => unit.status));
  const statusFromFrontmatter = normalizeStatus(requirementsFrontmatter.status);
  const status = statusFromFrontmatter !== 'unknown' ? statusFromFrontmatter : derivedStatus;

  const unitStats = countByStatus(units);
  const stories = units.flatMap((unit) => unit.stories);
  const storyStats = countByStatus(stories);

  return {
    id: folderName,
    number: parsedName.number,
    name: parsedName.name,
    title: `${parsedName.number}-${parsedName.name}`,
    path: intentPath,
    status,
    units,
    unitCount: units.length,
    storyCount: stories.length,
    completedUnits: unitStats.completed,
    inProgressUnits: unitStats.inProgress,
    pendingUnits: unitStats.pending,
    blockedUnits: unitStats.blocked,
    completedStories: storyStats.completed,
    inProgressStories: storyStats.inProgress,
    pendingStories: storyStats.pending,
    blockedStories: storyStats.blocked
  };
}

function parseStageNames(type) {
  return DEFAULT_BOLT_STAGE_MAP[type] || DEFAULT_BOLT_STAGE_MAP['simple-construction-bolt'];
}

function extractStageNamesFromFrontmatter(rawStagesCompleted) {
  if (!Array.isArray(rawStagesCompleted)) {
    return [];
  }

  return rawStagesCompleted
    .map((stage) => {
      if (typeof stage === 'string') {
        return stage;
      }
      if (stage && typeof stage === 'object' && typeof stage.name === 'string') {
        return stage.name;
      }
      return null;
    })
    .filter(Boolean)
    .map((stage) => String(stage).toLowerCase());
}

function parseBolt(boltPath, warnings) {
  const boltId = path.basename(boltPath);
  const boltFilePath = path.join(boltPath, 'bolt.md');

  const content = readFileSafe(boltFilePath);
  if (!content) {
    warnings.push(`Bolt ${boltId} is missing bolt.md.`);
    return null;
  }

  const frontmatter = parseFrontmatter(content);
  const type = typeof frontmatter.type === 'string' ? frontmatter.type : 'simple-construction-bolt';
  const currentStage = typeof frontmatter.current_stage === 'string'
    ? frontmatter.current_stage
    : (typeof frontmatter.currentStage === 'string' ? frontmatter.currentStage : null);

  const stageNames = parseStageNames(type);
  const completedStageNames = extractStageNamesFromFrontmatter(frontmatter.stages_completed);
  const normalizedCurrentStage = currentStage ? currentStage.toLowerCase() : null;

  const stages = stageNames.map((stageName, index) => {
    const normalizedStageName = stageName.toLowerCase();
    const status = completedStageNames.includes(normalizedStageName)
      ? 'completed'
      : (normalizedCurrentStage === normalizedStageName ? 'in_progress' : 'pending');

    return {
      name: stageName,
      order: index + 1,
      status
    };
  });

  let status = normalizeStatus(frontmatter.status);
  if (status === 'unknown') {
    if (stages.length > 0 && stages.every((stage) => stage.status === 'completed')) {
      status = 'completed';
    } else if (normalizedCurrentStage) {
      status = 'in_progress';
    } else {
      status = 'pending';
    }
  }

  const markdownFiles = listMarkdownFiles(boltPath);

  return {
    id: boltId,
    intent: typeof frontmatter.intent === 'string' ? frontmatter.intent : '',
    unit: typeof frontmatter.unit === 'string' ? frontmatter.unit : '',
    type,
    status,
    currentStage,
    stages,
    stagesCompleted: completedStageNames,
    stories: Array.isArray(frontmatter.stories) ? frontmatter.stories.filter((value) => typeof value === 'string') : [],
    path: boltPath,
    filePath: boltFilePath,
    files: markdownFiles,
    requiresBolts: Array.isArray(frontmatter.requires_bolts)
      ? frontmatter.requires_bolts.filter((value) => typeof value === 'string')
      : [],
    enablesBolts: Array.isArray(frontmatter.enables_bolts)
      ? frontmatter.enables_bolts.filter((value) => typeof value === 'string')
      : [],
    isBlocked: false,
    blockedBy: [],
    unblocksCount: 0,
    createdAt: normalizeTimestamp(frontmatter.created),
    startedAt: normalizeTimestamp(frontmatter.started),
    completedAt: normalizeTimestamp(frontmatter.completed)
  };
}

function computeBoltDependencyState(bolts, warnings) {
  const byId = new Map((bolts || []).map((bolt) => [bolt.id, bolt]));

  for (const bolt of bolts || []) {
    const blockedBy = [];

    for (const requiredBoltId of bolt.requiresBolts || []) {
      const requiredBolt = byId.get(requiredBoltId);
      if (!requiredBolt) {
        blockedBy.push(requiredBoltId);
        warnings.push(`Bolt ${bolt.id} depends on missing bolt ${requiredBoltId}.`);
        continue;
      }

      if (requiredBolt.status !== 'completed') {
        blockedBy.push(requiredBoltId);
      }
    }

    bolt.blockedBy = blockedBy;
    bolt.isBlocked = blockedBy.length > 0;

    if (bolt.status === 'pending' && bolt.isBlocked) {
      bolt.status = 'blocked';
    }
  }

  for (const bolt of bolts || []) {
    bolt.unblocksCount = (bolts || []).filter((candidate) =>
      candidate.id !== bolt.id && (candidate.requiresBolts || []).includes(bolt.id) && candidate.status !== 'completed'
    ).length;
  }
}

function buildProjectMetadata(workspacePath, rootPath) {
  const fallbackName = path.basename(workspacePath);
  const config = parseYamlFile(path.join(rootPath, 'project.yaml')) || {};

  return {
    name: typeof config.name === 'string' && config.name.trim() !== ''
      ? config.name
      : fallbackName,
    description: typeof config.description === 'string' ? config.description : undefined,
    projectType: typeof config.project_type === 'string'
      ? config.project_type
      : (typeof config.projectType === 'string' ? config.projectType : undefined)
  };
}

function buildStats(intents, units, stories, bolts) {
  const intentStats = countByStatus(intents);
  const unitStats = countByStatus(units);
  const storyStats = countByStatus(stories);

  const activeBolts = bolts.filter((bolt) => bolt.status === 'in_progress');
  const completedBolts = bolts.filter((bolt) => bolt.status === 'completed');
  const blockedBolts = bolts.filter((bolt) => bolt.status === 'blocked' || bolt.isBlocked);
  const queuedBolts = bolts.filter((bolt) => bolt.status === 'pending' && !bolt.isBlocked);

  const totalStories = stories.length;
  const completedStories = storyStats.completed;
  const progressPercent = totalStories > 0
    ? Math.round((completedStories / totalStories) * 100)
    : 0;

  return {
    totalIntents: intents.length,
    completedIntents: intentStats.completed,
    inProgressIntents: intentStats.inProgress,
    pendingIntents: intentStats.pending,
    blockedIntents: intentStats.blocked,
    totalUnits: units.length,
    completedUnits: unitStats.completed,
    inProgressUnits: unitStats.inProgress,
    pendingUnits: unitStats.pending,
    blockedUnits: unitStats.blocked,
    totalStories: stories.length,
    completedStories: storyStats.completed,
    inProgressStories: storyStats.inProgress,
    pendingStories: storyStats.pending,
    blockedStories: storyStats.blocked,
    totalBolts: bolts.length,
    activeBoltsCount: activeBolts.length,
    queuedBolts: queuedBolts.length,
    blockedBolts: blockedBolts.length,
    completedBolts: completedBolts.length,
    progressPercent
  };
}

function parseAidlcDashboard(workspacePath) {
  const rootPath = path.join(workspacePath, 'memory-bank');

  if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
    return {
      ok: false,
      error: {
        code: 'AIDLC_NOT_FOUND',
        message: `No AI-DLC workspace found at ${rootPath}`,
        hint: 'Run this command from a workspace containing memory-bank/ or choose --flow fire/simple.'
      }
    };
  }

  const warnings = [];
  const intentsPath = path.join(rootPath, 'intents');
  const boltsPath = path.join(rootPath, 'bolts');
  const standardsPath = path.join(rootPath, 'standards');

  const intentFolders = listSubdirectories(intentsPath);
  const intents = intentFolders
    .map((intentFolder) => parseIntent(path.join(intentsPath, intentFolder), warnings))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (intentFolders.length === 0) {
    warnings.push('No intents found under memory-bank/intents.');
  }

  const units = intents.flatMap((intent) => intent.units || []);
  const stories = units.flatMap((unit) => unit.stories || []);

  const boltFolders = listSubdirectories(boltsPath);
  const bolts = boltFolders
    .map((boltFolder) => parseBolt(path.join(boltsPath, boltFolder), warnings))
    .filter(Boolean);

  computeBoltDependencyState(bolts, warnings);

  const activeBolts = bolts
    .filter((bolt) => bolt.status === 'in_progress')
    .sort((a, b) => {
      const aTime = a.startedAt ? Date.parse(a.startedAt) : 0;
      const bTime = b.startedAt ? Date.parse(b.startedAt) : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      return a.id.localeCompare(b.id);
    });

  const pendingBolts = bolts
    .filter((bolt) => bolt.status === 'pending' || bolt.status === 'blocked' || bolt.isBlocked)
    .sort((a, b) => {
      const aScore = a.isBlocked ? 1 : 0;
      const bScore = b.isBlocked ? 1 : 0;
      if (aScore !== bScore) {
        return aScore - bScore;
      }
      if (b.unblocksCount !== a.unblocksCount) {
        return b.unblocksCount - a.unblocksCount;
      }
      return a.id.localeCompare(b.id);
    });

  const completedBolts = bolts
    .filter((bolt) => bolt.status === 'completed')
    .sort((a, b) => {
      const aTime = a.completedAt ? Date.parse(a.completedAt) : 0;
      const bTime = b.completedAt ? Date.parse(b.completedAt) : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      return b.id.localeCompare(a.id);
    });

  const standards = listMarkdownFiles(standardsPath)
    .map((fileName) => ({
      name: path.basename(fileName, '.md'),
      type: path.basename(fileName, '.md'),
      filePath: path.join(standardsPath, fileName)
    }));

  const project = buildProjectMetadata(workspacePath, rootPath);
  const stats = buildStats(intents, units, stories, bolts);

  return {
    ok: true,
    snapshot: {
      flow: 'aidlc',
      isProject: true,
      initialized: true,
      workspacePath,
      rootPath,
      version: '1.0.0',
      project,
      intents,
      units,
      stories,
      bolts,
      activeBolts,
      pendingBolts,
      completedBolts,
      standards,
      stats,
      warnings,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  DEFAULT_BOLT_STAGE_MAP,
  parseFrontmatter,
  normalizeStatus,
  parseAidlcDashboard
};
