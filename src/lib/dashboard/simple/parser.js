const fs = require('fs');
const path = require('path');

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

function parseTaskChecklist(content) {
  const lines = String(content || '').split(/\r?\n/);
  const tasks = [];

  lines.forEach((line, index) => {
    const match = line.match(/^\s*[-*]\s*\[( |x|X)\](\*)?\s+(.+)$/);
    if (!match) {
      return;
    }

    tasks.push({
      line: index + 1,
      done: match[1].toLowerCase() === 'x',
      optional: match[2] === '*',
      text: match[3].trim()
    });
  });

  return tasks;
}

function getLatestTimestamp(paths) {
  let latest = 0;

  for (const filePath of paths) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs > latest) {
        latest = stats.mtimeMs;
      }
    } catch {
      // Ignore missing files.
    }
  }

  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

function deriveSpecState(hasRequirements, hasDesign, hasTasks, taskStats) {
  if (!hasRequirements) {
    return 'requirements_pending';
  }

  if (!hasDesign) {
    return 'design_pending';
  }

  if (!hasTasks) {
    return 'tasks_pending';
  }

  if (taskStats.total === 0) {
    return 'tasks_pending';
  }

  if (taskStats.completed >= taskStats.total) {
    return 'completed';
  }

  if (taskStats.completed > 0) {
    return 'in_progress';
  }

  return 'ready';
}

function statePriority(state) {
  switch (state) {
    case 'in_progress':
      return 0;
    case 'ready':
      return 1;
    case 'tasks_pending':
      return 2;
    case 'design_pending':
      return 3;
    case 'requirements_pending':
      return 4;
    case 'completed':
      return 5;
    default:
      return 6;
  }
}

function phaseForState(state) {
  if (state === 'requirements_pending') {
    return 'requirements';
  }

  if (state === 'design_pending') {
    return 'design';
  }

  return 'tasks';
}

function parseSpec(specsPath, specName, warnings) {
  const specPath = path.join(specsPath, specName);

  const requirementsPath = path.join(specPath, 'requirements.md');
  const designPath = path.join(specPath, 'design.md');
  const tasksPath = path.join(specPath, 'tasks.md');

  const hasRequirements = fs.existsSync(requirementsPath);
  const hasDesign = fs.existsSync(designPath);
  const hasTasks = fs.existsSync(tasksPath);

  if (!hasRequirements) {
    warnings.push(`Spec ${specName} is missing requirements.md.`);
  }

  const tasksContent = hasTasks ? readFileSafe(tasksPath) : null;
  const tasks = tasksContent ? parseTaskChecklist(tasksContent) : [];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.done).length,
    optional: tasks.filter((task) => task.optional).length
  };

  const state = deriveSpecState(hasRequirements, hasDesign, hasTasks, taskStats);
  const updatedAt = getLatestTimestamp([requirementsPath, designPath, tasksPath]);

  return {
    id: specName,
    name: specName,
    path: specPath,
    state,
    phase: phaseForState(state),
    hasRequirements,
    hasDesign,
    hasTasks,
    tasks,
    tasksTotal: taskStats.total,
    tasksCompleted: taskStats.completed,
    tasksPending: Math.max(taskStats.total - taskStats.completed, 0),
    optionalTasks: taskStats.optional,
    updatedAt
  };
}

function buildProjectMetadata(workspacePath) {
  const packageJsonPath = path.join(workspacePath, 'package.json');
  const fallbackName = path.basename(workspacePath);

  try {
    const parsed = JSON.parse(readFileSafe(packageJsonPath) || '{}');
    return {
      name: typeof parsed.name === 'string' ? parsed.name : fallbackName,
      description: typeof parsed.description === 'string' ? parsed.description : undefined
    };
  } catch {
    return { name: fallbackName };
  }
}

function buildStats(specs) {
  const totalSpecs = specs.length;
  const completedSpecs = specs.filter((spec) => spec.state === 'completed').length;
  const inProgressSpecs = specs.filter((spec) => spec.state === 'in_progress').length;
  const readySpecs = specs.filter((spec) => spec.state === 'ready').length;
  const designPendingSpecs = specs.filter((spec) => spec.state === 'design_pending').length;
  const tasksPendingSpecs = specs.filter((spec) => spec.state === 'tasks_pending').length;
  const requirementsPendingSpecs = specs.filter((spec) => spec.state === 'requirements_pending').length;
  const pendingSpecs = totalSpecs - completedSpecs;

  const totalTasks = specs.reduce((sum, spec) => sum + spec.tasksTotal, 0);
  const completedTasks = specs.reduce((sum, spec) => sum + spec.tasksCompleted, 0);
  const optionalTasks = specs.reduce((sum, spec) => sum + spec.optionalTasks, 0);
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  const progressPercent = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    totalSpecs,
    completedSpecs,
    inProgressSpecs,
    readySpecs,
    pendingSpecs,
    designPendingSpecs,
    tasksPendingSpecs,
    requirementsPendingSpecs,
    totalTasks,
    completedTasks,
    pendingTasks,
    optionalTasks,
    activeSpecsCount: inProgressSpecs + readySpecs,
    progressPercent
  };
}

function parseSimpleDashboard(workspacePath) {
  const rootPath = path.join(workspacePath, 'specs');

  if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
    return {
      ok: false,
      error: {
        code: 'SIMPLE_NOT_FOUND',
        message: `No Simple flow workspace found at ${rootPath}`,
        hint: 'Run this command from a workspace containing specs/ or choose --flow fire/aidlc.'
      }
    };
  }

  const warnings = [];
  const specFolders = listSubdirectories(rootPath);
  const specs = specFolders
    .map((specFolder) => parseSpec(rootPath, specFolder, warnings))
    .sort((a, b) => {
      const priorityDiff = statePriority(a.state) - statePriority(b.state);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }

      return a.name.localeCompare(b.name);
    });

  if (specs.length === 0) {
    warnings.push('No specs found under specs/.');
  }

  const activeSpecs = specs.filter((spec) => spec.state !== 'completed');
  const completedSpecs = specs
    .filter((spec) => spec.state === 'completed')
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (bTime !== aTime) {
        return bTime - aTime;
      }
      return b.name.localeCompare(a.name);
    });

  const stats = buildStats(specs);

  return {
    ok: true,
    snapshot: {
      flow: 'simple',
      isProject: true,
      initialized: true,
      workspacePath,
      rootPath,
      version: '1.0.0',
      project: buildProjectMetadata(workspacePath),
      specs,
      activeSpecs,
      completedSpecs,
      pendingSpecs: activeSpecs,
      standards: [],
      stats,
      warnings,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  parseTaskChecklist,
  parseSimpleDashboard
};
