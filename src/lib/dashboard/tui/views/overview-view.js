const { truncate } = require('../components/header');

const STANDARD_TYPES = [
  'constitution',
  'tech-stack',
  'coding-standards',
  'testing-standards',
  'system-architecture'
];

function renderOverviewViewLines(snapshot, width) {
  const lines = ['Overview'];

  if (!snapshot?.initialized) {
    lines.push('FIRE project folder exists but state.yaml is missing.');
    lines.push('Run initialization and the overview will appear automatically.');
    return lines.map((line) => truncate(line, width));
  }

  const project = snapshot.project || {};
  const workspace = snapshot.workspace || {};

  lines.push(`Project: ${project.name || 'Unknown'} | FIRE version: ${project.fireVersion || snapshot.version || '0.0.0'}`);
  lines.push(`Workspace: ${workspace.type || 'unknown'} / ${workspace.structure || 'unknown'} | autonomy: ${workspace.autonomyBias || 'unknown'} | run scope pref: ${workspace.runScopePreference || 'unknown'}`);
  lines.push('');

  lines.push('Intent Summary');
  lines.push(`  total: ${snapshot.stats.totalIntents} | completed: ${snapshot.stats.completedIntents} | in_progress: ${snapshot.stats.inProgressIntents} | pending: ${snapshot.stats.pendingIntents} | blocked: ${snapshot.stats.blockedIntents}`);
  lines.push('');

  lines.push('Work Item Summary');
  lines.push(`  total: ${snapshot.stats.totalWorkItems} | completed: ${snapshot.stats.completedWorkItems} | in_progress: ${snapshot.stats.inProgressWorkItems} | pending: ${snapshot.stats.pendingWorkItems} | blocked: ${snapshot.stats.blockedWorkItems}`);
  lines.push('');

  const standardSet = new Set((snapshot.standards || []).map((item) => item.type));
  lines.push('Standards');
  for (const type of STANDARD_TYPES) {
    const marker = standardSet.has(type) ? '[x]' : '[ ]';
    lines.push(`  ${marker} ${type}.md`);
  }

  lines.push('');
  lines.push('Top Intents');

  const intents = (snapshot.intents || []).slice(0, 6);
  if (intents.length === 0) {
    lines.push('  - none');
  } else {
    for (const intent of intents) {
      const totalWorkItems = (intent.workItems || []).length;
      const completedWorkItems = (intent.workItems || []).filter((item) => item.status === 'completed').length;
      lines.push(`  - ${intent.id}: ${intent.status} (${completedWorkItems}/${totalWorkItems} work items completed)`);
    }
  }

  return lines.map((line) => truncate(line, width));
}

module.exports = {
  renderOverviewViewLines
};
