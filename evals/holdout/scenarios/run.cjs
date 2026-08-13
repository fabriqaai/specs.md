#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadYaml, parseArgs, resolveRoot } = require('../../lib/common.cjs');
const { flowAvailable, loadFlow } = require('../../lib/flow.cjs');

const SCENARIOS_DIR = __dirname;

function loadScenarioFiles(yaml) {
  return fs
    .readdirSync(SCENARIOS_DIR)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .sort()
    .map((name) => {
      const file = path.join(SCENARIOS_DIR, name);
      return { file: name, ...(yaml.load(fs.readFileSync(file, 'utf8')) || {}) };
    });
}

function writeStageFiles(root, boltId, names) {
  const dir = path.join(root, 'docs', 'specsmd', 'bolts', boltId);
  for (const name of names) {
    const extra = name === 'walkthrough.md' ? '## Deviations from plan\n\nnone\n' : '';
    fs.writeFileSync(path.join(dir, name), `# ${name}\n\n${extra}`, 'utf8');
  }
}

function caught(fn) {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function runScenario(scenario, repoRoot) {
  const flow = loadFlow(repoRoot);
  if (!flow) {
    return {
      id: scenario.id,
      title: scenario.title || scenario.id,
      judges: scenario.judges || [],
      satisfied: false,
      skipped: true,
      detail: 'plugins/specsmd is not present; scenario not run.',
    };
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), `evals-scenario-${scenario.id}-`));
  const notes = [];
  try {
    const kind = scenario.kind || scenario.id;

    if (kind === 'complete-refuses-missing-evidence') {
      flow.initProject(root, 'balanced');
      const intent = flow.initIntent(root, { title: 'Notify users' });
      const item = flow.initWorkItem(root, {
        intent: intent.id,
        title: 'A toast appears after save',
        complexity: 'medium',
        body: '# Item\n\n## Definition of Done\n\n- [x] (gating) A toast appears after save\n',
      });
      const bolt = flow.initBolt(root, { workItems: item.id, recipe: 'default' });
      const result = caught(() => flow.completeBolt(root, bolt.id, false));
      const message = result.ok ? '' : `${result.error.message} ${result.error.remediation || ''}`;
      const named = /test-report\.md/.test(message) && /walkthrough\.md/.test(message);
      const satisfied = !result.ok && result.error.code === 'COMPLETE_BLOCKED' && named;
      notes.push(satisfied ? `Refused with named evidence: ${message}` : `Unexpected: ${message || 'completed'}`);
      return pack(scenario, satisfied, notes);
    }

    if (kind === 'complete-cascade') {
      flow.initProject(root, 'balanced');
      const intent = flow.initIntent(root, { title: 'Notify users' });
      const a = flow.initWorkItem(root, {
        intent: intent.id,
        title: 'A toast appears after save',
        complexity: 'medium',
        body: '# A\n\n## Definition of Done\n\n- [x] (gating) A toast appears after save\n',
      });
      const b = flow.initWorkItem(root, {
        intent: intent.id,
        title: 'Dismiss hides the toast',
        complexity: 'medium',
        dependsOn: a.id,
        body: '# B\n\n## Definition of Done\n\n- [x] (gating) Dismiss hides the toast\n',
      });
      const bolt = flow.initBolt(root, { workItems: `${a.id},${b.id}`, recipe: 'default' });
      writeStageFiles(root, bolt.id, ['plan.md', 'test-report.md', 'walkthrough.md', 'review-report.md']);
      flow.completeBolt(root, bolt.id, false);
      const boltAfter = flow.lib.readBolt(root, bolt.id, flow.lib.loadContract());
      const itemA = flow.lib.findWorkItem(root, a.id, flow.lib.loadContract());
      const itemB = flow.lib.findWorkItem(root, b.id, flow.lib.loadContract());
      const intentAfter = flow.lib.readMarkdown(flow.lib.intentPath(root, intent.id, flow.lib.loadContract()));
      const satisfied =
        boltAfter.data.status === 'complete' &&
        itemA.status === 'complete' &&
        itemB.status === 'complete' &&
        intentAfter.data.status === 'complete';
      notes.push(
        `bolt=${boltAfter.data.status} items=${itemA.status},${itemB.status} intent=${intentAfter.data.status}`
      );
      return pack(scenario, satisfied, notes);
    }

    if (kind === 'init-without-package') {
      const before = fs.readdirSync(root);
      flow.initProject(root, 'controlled');
      const after = fs.readdirSync(root);
      const leaked = after.filter((name) => name !== 'docs' && !before.includes(name));
      const satisfied =
        fs.existsSync(path.join(root, 'docs', 'specsmd', 'project.md')) &&
        !fs.existsSync(path.join(root, 'package.json')) &&
        leaked.length === 0;
      notes.push(satisfied ? 'Only docs/specsmd was created.' : `Leaked: ${leaked.join(', ') || 'missing project.md'}`);
      return pack(scenario, satisfied, notes);
    }

    if (kind === 'recipe-snapshot-immutable') {
      flow.initProject(root, 'balanced');
      const intent = flow.initIntent(root, { title: 'Snapshot' });
      const item = flow.initWorkItem(root, {
        intent: intent.id,
        title: 'Observable slice',
        complexity: 'medium',
      });
      const bolt = flow.initBolt(root, { workItems: item.id, recipe: 'default', ceremony: 'autopilot' });
      const contract = flow.lib.loadContract();
      const before = flow.lib.readBolt(root, bolt.id, contract);
      const snapshot = JSON.stringify(before.data.recipe_snapshot);
      const recipe = before.data.recipe;
      writeStageFiles(root, bolt.id, ['plan.md']);
      flow.updateStage(root, bolt.id, 'plan');
      const after = flow.lib.readBolt(root, bolt.id, contract);
      const satisfied =
        after.data.recipe === recipe && JSON.stringify(after.data.recipe_snapshot) === snapshot;
      notes.push(`recipe=${after.data.recipe} snapshot_unchanged=${satisfied}`);
      return pack(scenario, satisfied, notes);
    }

    if (kind === 'clean-integrity') {
      flow.initProject(root, 'balanced');
      const intent = flow.initIntent(root, { title: 'Clean tree' });
      flow.initWorkItem(root, { intent: intent.id, title: 'A slice', complexity: 'low' });
      const report = flow.validateIntegrity(root, {});
      const count = (report.findings || report.data && report.data.findings || []).length;
      const findings = report.findings || (report.data && report.data.findings) || [];
      const satisfied = findings.length === 0 || count === 0;
      notes.push(`findings=${findings.length}`);
      return pack(scenario, satisfied, notes);
    }

    if (kind === 'status-lenses') {
      flow.initProject(root, 'balanced');
      const shaping = flow.initIntent(root, { title: 'Unstarted intent' });
      flow.initWorkItem(root, { intent: shaping.id, title: 'Waiting slice', complexity: 'low' });
      const buildingIntent = flow.initIntent(root, { title: 'Building intent' });
      const buildingItem = flow.initWorkItem(root, {
        intent: buildingIntent.id,
        title: 'Active slice',
        complexity: 'medium',
        body: '# A\n\n## Definition of Done\n\n- [x] (gating) Visible\n',
      });
      const active = flow.initBolt(root, { workItems: buildingItem.id, recipe: 'simple' });
      const doneIntent = flow.initIntent(root, { title: 'Done intent' });
      const doneItem = flow.initWorkItem(root, {
        intent: doneIntent.id,
        title: 'Finished slice',
        complexity: 'low',
        body: '# D\n\n## Definition of Done\n\n- [x] (gating) Visible\n',
      });
      const done = flow.initBolt(root, { workItems: doneItem.id, recipe: 'simple' });
      writeStageFiles(root, done.id, ['plan.md', 'walkthrough.md']);
      flow.completeBolt(root, done.id, false);
      const status = flow.projectStatus(root);
      const data = status.data || status;
      const shapingIds = ((data.lenses && data.lenses.shaping) || data.shaping || []).map(idOf);
      const buildingIds = ((data.lenses && data.lenses.building) || data.building || []).map(idOf);
      const shippingIds = ((data.lenses && data.lenses.shipping) || data.shipping || []).map(idOf);
      const suggestion = data.suggestion || {};
      const satisfied =
        shapingIds.some((id) => String(id).includes(shaping.id) || id === shaping.id) &&
        buildingIds.some((id) => String(id).includes(active.id)) &&
        shippingIds.some((id) => String(id).includes(done.id)) &&
        suggestion &&
        (suggestion.best || (suggestion.options || [])[0]);
      notes.push(
        `shaping=${shapingIds.join(',')} building=${buildingIds.join(',')} shipping=${shippingIds.join(',')} best=${suggestion.best || ''}`
      );
      return pack(scenario, Boolean(satisfied), notes);
    }

    if (kind === 'project-local-recipe') {
      flow.initProject(root, 'balanced');
      const recipesDir = path.join(root, 'docs', 'specsmd', 'recipes');
      fs.writeFileSync(
        path.join(recipesDir, 'local.yaml'),
        [
          'id: local',
          'title: Local',
          'stages:',
          '  - id: only',
          '    produces: []',
          '    gateable: false',
          'completion_requires: []',
          'constraints: []',
          '',
        ].join('\n'),
        'utf8'
      );
      const intent = flow.initIntent(root, { title: 'Local recipe' });
      const item = flow.initWorkItem(root, { intent: intent.id, title: 'Slice', complexity: 'low' });
      const bolt = flow.initBolt(root, { workItems: item.id, recipe: 'local' });
      const satisfied = bolt.recipe === 'local' && bolt.recipe_snapshot && bolt.recipe_snapshot.id === 'local';
      notes.push(`recipe=${bolt.recipe}`);
      return pack(scenario, Boolean(satisfied), notes);
    }

    return pack(scenario, false, [`Unknown scenario kind: ${kind}`]);
  } catch (err) {
    return pack(scenario, false, [err.message || String(err)]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function idOf(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry.id || entry.bolt || entry.intent || '';
}

function pack(scenario, satisfied, notes) {
  return {
    id: scenario.id,
    title: scenario.title || scenario.id,
    judges: scenario.judges || [],
    satisfied: Boolean(satisfied),
    skipped: false,
    detail: notes.join(' | '),
  };
}

function runScenarios(options = {}) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const available = flowAvailable(repoRoot);
  const listed = loadScenarioFiles(yaml);
  const results = listed.map((scenario) =>
    available
      ? runScenario(scenario, repoRoot)
      : {
          id: scenario.id,
          title: scenario.title || scenario.id,
          judges: scenario.judges || [],
          satisfied: false,
          skipped: true,
          detail: 'plugins/specsmd is not present; scenario not run.',
        }
  );
  return {
    available,
    results,
    summary: {
      total: results.length,
      satisfied: results.filter((row) => row.satisfied).length,
      failed: results.filter((row) => !row.satisfied && !row.skipped).length,
      skipped: results.filter((row) => row.skipped).length,
    },
  };
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/holdout/scenarios/run.cjs [--root <dir>] [--json]',
    '',
    'Judges holdout scenarios on satisfaction of observed behavior.',
    'Scenarios call the shipped flow scripts in a throwaway tree.',
  ].join('\n');
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) {
    console.log(printUsage());
    return 0;
  }
  const report = runScenarios({ root: args.root });
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `Holdout scenarios: total=${report.summary.total} satisfied=${report.summary.satisfied} failed=${report.summary.failed} skipped=${report.summary.skipped}`
    );
    for (const row of report.results) {
      const mark = row.skipped ? 'skipped' : row.satisfied ? 'satisfied' : 'unsatisfied';
      console.log(`${mark}\t${row.id}\t${row.detail}`);
    }
  }
  return report.summary.failed > 0 ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv);
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

module.exports = {
  loadScenarioFiles,
  runScenario,
  runScenarios,
};
