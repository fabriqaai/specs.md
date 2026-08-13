#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_INTENT,
  listWorkItemFiles,
  loadWorkItemFile,
  loadYaml,
  parseArgs,
  protocolForComplexity,
  resolveRoot,
} = require('../lib/common.cjs');
const { recordSufficiency, listSufficiency } = require('../sufficiency/run.cjs');
const { runTriggerEvals } = require('../triggers/run.cjs');
const { evaluateHoldout } = require('../holdout/run.cjs');
const { runScenarios } = require('../holdout/scenarios/run.cjs');
const { flowAvailable } = require('../lib/flow.cjs');

const RESULTS = new Set(['verified', 'failed', 'needs-human', 'spec-defect']);

function matchesCriterion(criterion, pattern) {
  return pattern.test(criterion.text);
}

function tempRoot(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeSampleWorkItem(root, { id, complexity, criteria }) {
  const dir = path.join(root, 'docs', 'specsmd', 'intents', DEFAULT_INTENT, 'work-items');
  fs.mkdirSync(dir, { recursive: true });
  const lines = [
    '---',
    `id: ${id}`,
    `title: sample ${id}`,
    `intent: ${DEFAULT_INTENT}`,
    `complexity: ${complexity}`,
    'status: pending',
    '---',
    '',
    `# ${id}`,
    '',
    '## Definition of Done',
    '',
    ...criteria.map((text) => `- [ ] (gating) ${text}`),
    '',
  ];
  const file = path.join(dir, `${id}.md`);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}

function checkSufficiencyProducesReport() {
  const root = tempRoot('evals-sufficiency-');
  try {
    writeSampleWorkItem(root, {
      id: '090-sample',
      complexity: 'high',
      criteria: ['sample observable behavior holds'],
    });
    const high = recordSufficiency({
      root,
      workItem: '090-sample',
      findings: [],
      notes: 'machine check',
      meta: {
        probes: [
          { id: 'P1', isolated: true, observable: 'Caller sees a recorded report.' },
          { id: 'P2', isolated: true, observable: 'Caller sees the same recorded report.' },
        ],
        judge: 'P1 and P2 are interchangeable to a caller.',
      },
    });
    if (high.sufficiency !== 'cleared' || !fs.existsSync(high.reportPath)) {
      return { result: 'failed', detail: 'High-complexity record did not write a cleared report.' };
    }
    writeSampleWorkItem(root, {
      id: '091-sample',
      complexity: 'medium',
      criteria: ['sample observable behavior holds'],
    });
    const medium = recordSufficiency({
      root,
      workItem: '091-sample',
      findings: [
        {
          id: 'F1',
          class: 'divergence',
          status: 'open',
          summary: 'two readings',
        },
      ],
    });
    if (medium.protocol !== 'adversarial-review' || medium.sufficiency !== 'not-cleared') {
      return {
        result: 'failed',
        detail: `Medium item used ${medium.protocol} and recorded ${medium.sufficiency}.`,
      };
    }
    const listed = listSufficiency({ root, intent: DEFAULT_INTENT });
    if (listed.length < 2) {
      return { result: 'failed', detail: 'Sufficiency list did not include the sample items.' };
    }
    const probes = checkHighRequiresTwoProbes();
    if (probes.result !== 'verified') return probes;
    return {
      result: 'verified',
      detail: 'Sufficiency runner records a report at high (triangulation) and medium (adversarial) rigor, and refuses a one-probe clear.',
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function checkClearedFlip() {
  const root = tempRoot('evals-cleared-');
  try {
    writeSampleWorkItem(root, {
      id: '092-sample',
      complexity: 'low',
      criteria: ['sample observable behavior holds'],
    });
    const blocked = recordSufficiency({
      root,
      workItem: '092-sample',
      findings: [
        {
          id: 'F1',
          class: 'contradiction',
          status: 'open',
          summary: 'spec disagrees with itself',
        },
      ],
    });
    if (blocked.sufficiency !== 'not-cleared') {
      return { result: 'failed', detail: 'Open contradiction did not record as not-cleared.' };
    }
    let refused = false;
    try {
      recordSufficiency({
        root,
        workItem: '092-sample',
        outcome: 'cleared',
        findings: [
          {
            id: 'F1',
            class: 'contradiction',
            status: 'open',
            summary: 'still open',
          },
        ],
      });
    } catch (err) {
      refused = /Cannot record sufficiency: cleared/.test(err.message);
    }
    if (!refused) {
      return { result: 'failed', detail: 'Runner allowed cleared while a blocking finding was open.' };
    }
    const cleared = recordSufficiency({
      root,
      workItem: '092-sample',
      meta: { reviewer: 'conformance-machine-check' },
      findings: [
        {
          id: 'F1',
          class: 'named-freedom',
          status: 'resolved',
          summary: 'named as intentional freedom',
          resolution: 'The spec now names the freedom.',
        },
      ],
    });
    if (cleared.sufficiency !== 'cleared') {
      return { result: 'failed', detail: 'Resolving the blocking finding did not flip the spec to cleared.' };
    }
    const content = fs.readFileSync(
      path.join(root, 'docs', 'specsmd', 'intents', DEFAULT_INTENT, 'work-items', '092-sample.md'),
      'utf8'
    );
    if (!/^sufficiency: cleared$/m.test(content) || !/sufficiency_report:/.test(content)) {
      return { result: 'failed', detail: 'Work-item frontmatter was not updated with sufficiency state.' };
    }
    return {
      result: 'verified',
      detail: 'Unresolved blocking findings record not-cleared; resolving or naming freedom flips to cleared.',
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function checkConformanceShape(report) {
  const allowed = [...RESULTS];
  for (const item of report.work_items) {
    for (const criterion of item.criteria) {
      if (!allowed.includes(criterion.result)) {
        return {
          result: 'failed',
          detail: `${item.id} #${criterion.index} has illegal result ${criterion.result}.`,
        };
      }
    }
  }
  const coverage = report.coverage || {};
  const required = ['total', 'verified', 'failed', 'needs_human'];
  const missing = required.filter((key) => typeof coverage[key] !== 'number');
  if (missing.length > 0) {
    return { result: 'failed', detail: `Coverage summary missing ${missing.join(', ')}.` };
  }
  if (coverage.total !== coverage.verified + coverage.failed + coverage.needs_human + coverage.spec_defect) {
    return { result: 'failed', detail: 'Coverage counts do not sum to total.' };
  }
  return {
    result: 'verified',
    detail: 'Conformance report labels each criterion verified / failed / needs-human and includes coverage.',
  };
}

function checkTriggerOutcomes(repoRoot) {
  const report = runTriggerEvals({ root: repoRoot });
  if (!report.results || report.results.length === 0) {
    return { result: 'failed', detail: 'Trigger evals produced no per-prompt results.' };
  }
  const allowed = new Set(['pass', 'fail', 'skipped']);
  const expectedSkills = new Set(['using-specsmd', 'specsmd-status']);
  const seen = new Set();
  for (const row of report.results) {
    if (!allowed.has(row.outcome)) {
      return { result: 'failed', detail: `Prompt ${row.id} has illegal outcome ${row.outcome}.` };
    }
    seen.add(row.expected);
  }
  const missing = [...expectedSkills].filter((skill) => !seen.has(skill));
  if (missing.length > 0) {
    return { result: 'failed', detail: `Trigger fixtures missing expected skills: ${missing.join(', ')}.` };
  }
  const skillsMissing = report.summary.skills_found.length === 0;
  if (skillsMissing && report.summary.skipped !== report.summary.total) {
    return {
      result: 'failed',
      detail: 'Skill files are missing but some prompts were not reported as skipped.',
    };
  }
  if (!skillsMissing && report.summary.fail > 0) {
    return {
      result: 'failed',
      detail: `Trigger evals failed ${report.summary.fail} prompt(s) against shipped descriptions.`,
    };
  }
  return {
    result: 'verified',
    detail: skillsMissing
      ? 'Trigger evals report per-prompt outcomes; skill files are absent so prompts are skipped.'
      : 'Trigger evals report per-prompt routing outcomes against shipped skill descriptions.',
  };
}

function checkHighRequiresTwoProbes() {
  const root = tempRoot('evals-two-probes-');
  try {
    writeSampleWorkItem(root, {
      id: '093-sample',
      complexity: 'high',
      criteria: ['sample observable behavior holds'],
    });
    let refused = false;
    try {
      recordSufficiency({
        root,
        workItem: '093-sample',
        outcome: 'cleared',
        findings: [],
      });
    } catch (err) {
      refused = /without required triangulation evidence/.test(err.message);
    }
    if (!refused) {
      return {
        result: 'failed',
        detail: 'High-complexity spec was allowed to clear without two isolated probes.',
      };
    }
    return {
      result: 'verified',
      detail: 'Triangulation refuses cleared unless two isolated probes and a judge note are recorded.',
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function scenarioById(scenarioReport, id) {
  const row = (scenarioReport && scenarioReport.results || []).find((item) => item.id === id);
  const unavailable = !scenarioReport || scenarioReport.available === false;
  if (!row) {
    if (unavailable) {
      return {
        result: 'needs-human',
        detail: 'Holdout scenario not run because flow state scripts are not shipped.',
      };
    }
    return { result: 'failed', detail: `Holdout scenario ${id} is not defined.` };
  }
  if (row.skipped || unavailable) {
    return { result: 'needs-human', evaluable: 'scenario', detail: row.detail };
  }
  return {
    result: row.satisfied ? 'verified' : 'failed',
    evaluable: 'scenario',
    detail: row.detail,
  };
}

function loadContractFile(repoRoot) {
  const file = path.join(
    repoRoot,
    'plugins',
    'specsmd',
    'skills',
    'flow-runtime',
    'references',
    'flow-contract.yaml'
  );
  if (!fs.existsSync(file)) return null;
  const yaml = loadYaml(repoRoot);
  return yaml.load(fs.readFileSync(file, 'utf8'));
}

function checkContractSchema(repoRoot) {
  const contract = loadContractFile(repoRoot);
  if (!contract) {
    return { result: 'needs-human', detail: 'Flow contract is not present in this tree.' };
  }
  const required = ['project', 'intent', 'work_item', 'bolt'];
  for (const key of required) {
    const type = contract.artifact_types && contract.artifact_types[key];
    if (!type || !type.path || !type.fields) {
      return { result: 'failed', detail: `Contract artifact type ${key} is missing path or fields.` };
    }
    if (!type.identifier_pattern || !type.memory_class) {
      return {
        result: 'failed',
        detail: `Contract artifact type ${key} is missing identifier_pattern or memory_class.`,
      };
    }
  }
  if (!contract.status.values.includes('active') || contract.status.values.includes('in-progress')) {
    return { result: 'failed', detail: 'Contract status vocabulary is not the locked set.' };
  }
  const statusSources = JSON.stringify(contract).split('"in-progress"').length - 1;
  if (statusSources !== 1) {
    return {
      result: 'failed',
      detail: `Rejected synonym in-progress should appear once (in rejected_synonyms); found ${statusSources}.`,
    };
  }
  return {
    result: 'verified',
    detail: 'Contract answers location, identifier pattern, fields, and memory class per artifact type.',
  };
}

function checkFourRecipes(repoRoot) {
  const yaml = loadYaml(repoRoot);
  const expected = {
    default: ['plan', 'execute', 'test', 'review'],
    ddd: ['domain-model', 'design', 'decisions', 'implement', 'test'],
    spike: ['explore', 'findings'],
    simple: ['plan', 'implement', 'walkthrough'],
  };
  for (const [id, stages] of Object.entries(expected)) {
    const file = path.join(
      repoRoot,
      'plugins',
      'specsmd',
      'skills',
      'flow-runtime',
      'references',
      'recipes',
      `${id}.yaml`
    );
    if (!fs.existsSync(file)) {
      return { result: 'failed', detail: `Recipe file missing: ${id}.yaml` };
    }
    const recipe = yaml.load(fs.readFileSync(file, 'utf8')) || {};
    const got = recipe.stages.map((stage) => stage.id);
    if (JSON.stringify(got) !== JSON.stringify(stages)) {
      return { result: 'failed', detail: `Recipe ${id} stages ${got.join(',')} !== ${stages.join(',')}.` };
    }
    if (!Array.isArray(recipe.completion_requires)) {
      return { result: 'failed', detail: `Recipe ${id} has no completion_requires.` };
    }
  }
  return {
    result: 'verified',
    detail: 'Each shipped recipe yields its declared stage order and completion artifacts.',
  };
}

function checkMemoryClassInContract(repoRoot) {
  const contract = loadContractFile(repoRoot);
  if (!contract) {
    return { result: 'needs-human', detail: 'Flow contract is not present in this tree.' };
  }
  const derivation = contract.memory_class && contract.memory_class.derivation;
  if (!derivation || !derivation.change_record) {
    return { result: 'failed', detail: 'Contract does not derive memory class for change records.' };
  }
  if (derivation.change_record.non_terminal !== 'semantic' || derivation.change_record.terminal !== 'episodic') {
    return { result: 'failed', detail: 'Change-record class transition is not semantic→episodic.' };
  }
  return {
    result: 'verified',
    detail: 'Contract answers memory class including the active→terminal transition for change records.',
  };
}

function checkHoldoutIsolation() {
  const mixed = evaluateHoldout({
    files: ['evals/README.md', 'plugins/specsmd/skills/using-specsmd/SKILL.md'],
  });
  const evalsOnly = evaluateHoldout({ files: ['evals/README.md'] });
  const implOnly = evaluateHoldout({ files: ['plugins/specsmd/skills/using-specsmd/SKILL.md'] });
  const sibling = evaluateHoldout({ files: ['plugins/specsmd-aidlc/plugin.json', 'evals/README.md'] });
  const gate = evaluateHoldout({
    files: ['.github/workflows/evals-holdout.yml', 'plugins/specsmd/plugin.json'],
  });
  const tests = evaluateHoldout({
    files: ['src/__tests__/evals/holdout-isolation.test.ts', 'plugins/specsmd/plugin.json'],
  });
  if (mixed.ok || gate.ok || tests.ok) {
    return { result: 'failed', detail: 'Mixed evals-side + plugins/specsmd change was not rejected.' };
  }
  if (!evalsOnly.ok || !implOnly.ok) {
    return { result: 'failed', detail: 'A one-sided change was rejected.' };
  }
  if (!sibling.ok) {
    return {
      result: 'failed',
      detail: 'A legacy plugins/specsmd-* path was treated as unified-flow implementation.',
    };
  }
  return {
    result: 'verified',
    detail: 'Mixed evals-side + plugins/specsmd contributions are rejected; one-sided changes pass.',
  };
}

const MACHINE_CHECKS = [
  {
    workItem: '000-flow-evals',
    pattern: /produces a recorded report of gaps, ambiguities, and proposed corrections/,
    check: ({ repoRoot }) => {
      void repoRoot;
      return checkSufficiencyProducesReport();
    },
  },
  {
    workItem: '000-flow-evals',
    pattern: /unresolved divergence-causing finding reports as not-cleared/,
    check: () => checkClearedFlip(),
  },
  {
    workItem: '000-flow-evals',
    pattern: /verified \/ failed \/ needs-human/,
    deferred: true,
    check: ({ report }) => checkConformanceShape(report),
  },
  {
    workItem: '000-flow-evals',
    pattern: /Trigger evals run against the flow's model-invocable skill descriptions/,
    check: ({ repoRoot }) => checkTriggerOutcomes(repoRoot),
  },
  {
    workItem: '000-flow-evals',
    pattern: /changes flow implementation and the evals area together is rejected/,
    check: () => checkHoldoutIsolation(),
  },
  {
    workItem: '000-flow-evals',
    pattern: /Work items 001–012 have each been through their sufficiency pass/,
    check: ({ repoRoot }) => {
      const listed = listSufficiency({ root: repoRoot });
      const later = listed.filter((row) => row.id !== '000-flow-evals');
      const missing = later.filter(
        (row) => row.sufficiency !== 'cleared' && row.sufficiency !== 'not-cleared'
      );
      if (missing.length === 0) {
        return { result: 'verified', detail: '001–012 have a recorded sufficiency outcome.' };
      }
      return {
        result: 'needs-human',
        detail: `These items have no real sufficiency record: ${missing.map((row) => `${row.id}=${row.sufficiency}`).join(', ')}.`,
      };
    },
  },
  {
    workItem: '001-flow-schema',
    pattern: /location, identifier pattern, state fields, allowed values, and memory class/,
    check: ({ repoRoot }) => checkContractSchema(repoRoot),
  },
  {
    workItem: '001-flow-schema',
    pattern: /No status value or artifact path pattern appears in more than one authoritative place/,
    check: ({ repoRoot }) => checkContractSchema(repoRoot),
  },
  {
    workItem: '002-recipe-catalog',
    pattern: /Each of the four shipped recipes/,
    check: ({ repoRoot }) => checkFourRecipes(repoRoot),
  },
  {
    workItem: '002-recipe-catalog',
    pattern: /project-local recipe file/,
    check: ({ scenarios }) => scenarioById(scenarios, 'project-local-recipe'),
  },
  {
    workItem: '002-recipe-catalog',
    pattern: /recorded recipe never changes after creation/,
    check: ({ scenarios }) => scenarioById(scenarios, 'recipe-snapshot-immutable'),
  },
  {
    workItem: '003-state-scripts',
    pattern: /bolt completed through the tooling cascades/,
    check: ({ scenarios }) => scenarioById(scenarios, 'complete-cascade'),
  },
  {
    workItem: '003-state-scripts',
    pattern: /Completing a bolt with missing required evidence is refused/,
    check: ({ scenarios }) => scenarioById(scenarios, 'complete-refuses-missing-evidence'),
  },
  {
    workItem: '003-state-scripts',
    pattern: /project with no package manifest/,
    check: ({ scenarios }) => scenarioById(scenarios, 'init-without-package'),
  },
  {
    workItem: '004-integrity-validator',
    pattern: /Non-interactive validation of a clean tree/,
    check: ({ scenarios }) => scenarioById(scenarios, 'clean-integrity'),
  },
  {
    workItem: '006-execution-skills',
    pattern: /batch of two work items/,
    check: ({ scenarios }) => scenarioById(scenarios, 'complete-cascade'),
  },
  {
    workItem: '006-execution-skills',
    pattern: /Completion without the recipe's required test evidence/,
    check: ({ scenarios }) => scenarioById(scenarios, 'complete-refuses-missing-evidence'),
  },
  {
    workItem: '007-navigator-status',
    pattern: /one unstarted intent, one active bolt, and one completed bolt/,
    check: ({ scenarios }) => scenarioById(scenarios, 'status-lenses'),
  },
  {
    workItem: '011-memory-lifecycle',
    pattern: /The contract answers, for every artifact type, its memory class/,
    check: ({ repoRoot }) => checkMemoryClassInContract(repoRoot),
  },
];

function classifyUntestable(criterion) {
  if (!criterion.text) {
    return {
      result: 'spec-defect',
      evaluable: 'none',
      detail: 'Definition of Done item has no assertion text.',
    };
  }
  return null;
}

function evaluateCriterion(item, criterion, context) {
  const defect = classifyUntestable(criterion);
  if (defect) return defect;

  const machine = MACHINE_CHECKS.find(
    (entry) => entry.workItem === item.id && matchesCriterion(criterion, entry.pattern)
  );
  if (machine) {
    try {
      const outcome = machine.check(context);
      return {
        result: outcome.result,
        evaluable: 'machine',
        detail: outcome.detail,
      };
    } catch (err) {
      return {
        result: 'failed',
        evaluable: 'machine',
        detail: err.message || String(err),
      };
    }
  }

  return {
    result: 'needs-human',
    evaluable: 'human',
    detail:
      'No machine check is registered. Honest coverage: this criterion needs a human or a scenario, not a pretended pass.',
  };
}

function evaluateIntent(options = {}) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const intentId = options.intent || DEFAULT_INTENT;
  const files = listWorkItemFiles(repoRoot, intentId);
  const scenarios = flowAvailable(repoRoot)
    ? runScenarios({ root: repoRoot })
    : {
        available: false,
        results: [],
        summary: { total: 0, satisfied: 0, failed: 0, skipped: 0 },
      };
  const report = {
    intent: intentId,
    work_items: [],
    coverage: {
      total: 0,
      verified: 0,
      failed: 0,
      needs_human: 0,
      spec_defect: 0,
      machine_checkable: 0,
    },
  };

  for (const file of files) {
    const loaded = loadWorkItemFile(file, yaml);
    const id = String(loaded.data.id || path.basename(file, '.md'));
    const item = {
      id,
      file,
      complexity: loaded.data.complexity || null,
      protocol: (protocolForComplexity(loaded.data.complexity) || {}).id || null,
      sufficiency: loaded.data.sufficiency || 'unchecked',
      criteria: [],
    };

    if (loaded.criteria.length === 0) {
      item.criteria.push({
        index: 0,
        tier: 'gating',
        text: '(missing Definition of Done checkboxes)',
        result: 'spec-defect',
        evaluable: 'none',
        detail: 'Work item has no Definition of Done checkboxes to evaluate.',
      });
    } else {
      for (const criterion of loaded.criteria) {
        const machine = MACHINE_CHECKS.find(
          (entry) => entry.workItem === id && matchesCriterion(criterion, entry.pattern)
        );
        if (machine && machine.deferred) {
          item.criteria.push({
            index: criterion.index,
            tier: criterion.tier,
            text: criterion.text,
            result: 'needs-human',
            evaluable: 'machine',
            detail: 'Deferred until coverage is computed.',
            deferred: true,
          });
          continue;
        }
        const outcome = evaluateCriterion({ id }, criterion, {
          repoRoot,
          yaml,
          report,
          item,
          scenarios,
        });
        item.criteria.push({
          index: criterion.index,
          tier: criterion.tier,
          text: criterion.text,
          result: outcome.result,
          evaluable: outcome.evaluable,
          detail: outcome.detail,
        });
      }
    }
    report.work_items.push(item);
  }

  function recount() {
    report.coverage = {
      total: 0,
      verified: 0,
      failed: 0,
      needs_human: 0,
      spec_defect: 0,
      machine_checkable: 0,
      machine_checkable_ratio: 0,
    };
    for (const item of report.work_items) {
      for (const criterion of item.criteria) {
        report.coverage.total += 1;
        if (criterion.result === 'verified') report.coverage.verified += 1;
        else if (criterion.result === 'failed') report.coverage.failed += 1;
        else if (criterion.result === 'needs-human') report.coverage.needs_human += 1;
        else if (criterion.result === 'spec-defect') report.coverage.spec_defect += 1;
        if (criterion.evaluable === 'machine') report.coverage.machine_checkable += 1;
      }
    }
    report.coverage.machine_checkable_ratio =
      report.coverage.total === 0
        ? 0
        : Number((report.coverage.machine_checkable / report.coverage.total).toFixed(3));
  }

  recount();

  for (const item of report.work_items) {
    for (const criterion of item.criteria) {
      if (!criterion.deferred) continue;
      const outcome = checkConformanceShape(report);
      criterion.result = outcome.result;
      criterion.detail = outcome.detail;
      delete criterion.deferred;
    }
  }
  recount();

  report.scenarios = scenarios.summary;
  return report;
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/conformance/run.cjs [--intent <id>] [--root <dir>] [--json]',
    '',
    'Walks Definition of Done checkboxes and reports verified / failed / needs-human.',
    'Criteria without a machine check are needs-human — they are not silently marked verified.',
  ].join('\n');
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) {
    console.log(printUsage());
    return 0;
  }
  const report = evaluateIntent({ root: args.root, intent: args.intent });
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const c = report.coverage;
    console.log(`Conformance: ${report.intent}`);
    console.log(
      `total=${c.total} verified=${c.verified} failed=${c.failed} needs-human=${c.needs_human} spec-defect=${c.spec_defect} machine=${c.machine_checkable}`
    );
    for (const item of report.work_items) {
      console.log(`\n${item.id} (${item.complexity || 'no-complexity'}, ${item.sufficiency})`);
      for (const criterion of item.criteria) {
        console.log(`  [${criterion.result}] (${criterion.tier}) ${criterion.text}`);
      }
    }
  }
  let gatingFailed = false;
  for (const item of report.work_items) {
    for (const criterion of item.criteria) {
      if (criterion.result === 'spec-defect') gatingFailed = true;
      if (criterion.result === 'failed' && criterion.tier === 'gating') gatingFailed = true;
    }
  }
  return gatingFailed ? 1 : 0;
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
  MACHINE_CHECKS,
  evaluateIntent,
  main,
};
