/**
 * Unified bolt flow state scripts — goal-gated writes, no state.yaml.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const SCRIPTS = join(
  __dirname,
  '../../../../plugins/specsmd/skills/flow-runtime/scripts'
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initProject } = require(join(SCRIPTS, 'init-project.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initIntent } = require(join(SCRIPTS, 'init-intent.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initWorkItem } = require(join(SCRIPTS, 'init-work-item.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initBolt, initDraft } = require(join(SCRIPTS, 'init-bolt.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateStage } = require(join(SCRIPTS, 'update-stage.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateCheckpoint } = require(join(SCRIPTS, 'update-checkpoint.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { completeBolt } = require(join(SCRIPTS, 'complete-bolt.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { projectStatus } = require(join(SCRIPTS, 'status.cjs'));

describe('unified state scripts', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-unified-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  function seedTwoItems(opts?: { complexity?: string }) {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Ship notifications' });
    const a = initWorkItem(root, {
      intent: intent.id,
      title: 'User sees a toast',
      complexity: opts?.complexity || 'medium',
      body: '# A\n\n## Definition of Done\n\n- [x] (gating) A toast appears after save\n',
    });
    const b = initWorkItem(root, {
      intent: intent.id,
      title: 'User dismisses a toast',
      complexity: opts?.complexity || 'medium',
      dependsOn: a.id,
      body: '# B\n\n## Definition of Done\n\n- [x] (gating) Dismiss hides the toast\n',
    });
    return { intent, a, b };
  }

  function writeStageFiles(boltId: string, names: string[]) {
    const dir = join(root, 'docs/specsmd/bolts', boltId);
    for (const name of names) {
      const extra = name === 'walkthrough.md' ? '## Deviations from plan\n\nnone\n' : '';
      writeFileSync(join(dir, name), `# ${name}\n\n${extra}`, 'utf8');
    }
  }

  it('parses the shipped contract and default recipe', () => {
    const contract = lib.loadContract();
    expect(contract.artifact_root).toBe('docs/specsmd');
    expect(contract.status.values).toContain('active');
    expect(contract.status.values).not.toContain('in-progress');
    const recipe = lib.parseYaml(
      readFileSync(join(SCRIPTS, '../references/recipes/default.yaml'), 'utf8')
    );
    expect(recipe.stages.map((s: { id: string }) => s.id)).toEqual([
      'plan',
      'execute',
      'test',
      'review',
    ]);
    expect(recipe.stages[0].produces).toEqual(['plan.md']);
    expect(recipe.stages[0].gateable).toBe(true);
  });

  it('creates the artifact root in a project with no package manifest', () => {
    const result = initProject(root, 'controlled');
    expect(result.autonomy_bias).toBe('controlled');
    expect(existsSync(join(root, 'docs/specsmd/project.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/specsmd/recipes/default.yaml'))).toBe(true);
    expect(existsSync(join(root, 'package.json'))).toBe(false);
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
  });

  it('refuses a dependency cycle and names it', () => {
    initProject(root);
    const intent = initIntent(root, { title: 'Cycle check' });
    const a = initWorkItem(root, {
      intent: intent.id,
      title: 'First',
      dependsOn: '002-second',
    });
    expect(() =>
      initWorkItem(root, {
        intent: intent.id,
        title: 'Second',
        id: '002-second',
        dependsOn: a.id,
      })
    ).toThrow(/cycle/i);
  });

  it('assigns distinct bolt ids across two working copies', () => {
    const other = join(tmpdir(), `specsmd-other-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(other, { recursive: true });
    try {
      const left = seedTwoItems();
      initProject(other, 'balanced');
      const intent = initIntent(other, { title: 'Ship notifications' });
      const a = initWorkItem(other, { intent: intent.id, title: 'User sees a toast' });
      const boltA = initBolt(root, { workItems: [left.a.id, left.b.id] });
      const boltB = initBolt(other, { workItems: [a.id] });
      expect(boltA.id).not.toBe(boltB.id);
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it('records recipe and ceremony at create and does not change the recipe', () => {
    const { a, b } = seedTwoItems();
    const bolt = initBolt(root, { workItems: `${a.id},${b.id}`, ceremony: 'confirm' });
    expect(bolt.recipe).toBe('default');
    expect(bolt.ceremony).toBe('confirm');
    expect(bolt.current_stage).toBe('plan');
    expect(bolt.checkpoint_state).toBe('awaiting');
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(md.data.recipe).toBe('default');
  });

  it('selects a project-local recipe with no other change', () => {
    const { a } = seedTwoItems();
    writeFileSync(
      join(root, 'docs/specsmd/recipes/spike.yaml'),
      [
        'id: spike',
        'stages:',
        '  - id: explore',
        '    produces: []',
        '    gateable: false',
        '  - id: findings',
        '    produces:',
        '      - findings.md',
        '    gateable: true',
        'completion_requires:',
        '  - findings.md',
      ].join('\n'),
      'utf8'
    );
    const bolt = initBolt(root, { workItems: a.id, recipe: 'spike', ceremony: 'autopilot' });
    expect(bolt.recipe).toBe('spike');
    expect(bolt.current_stage).toBe('explore');
  });

  it('confirm ceremony stops on the first gateable stage; autopilot does not', () => {
    const seeded = seedTwoItems();
    const confirm = initBolt(root, {
      workItems: seeded.a.id,
      ceremony: 'confirm',
    });
    expect(confirm.checkpoint_state).toBe('awaiting');
    expect(() => updateStage(root, confirm.id, 'plan')).toThrow(/waiting for approval/i);

    const autoSeed = initWorkItem(root, {
      intent: seeded.intent.id,
      title: 'Autopilot item',
      complexity: 'low',
      body: '# A\n\n- [x] (gating) done\n',
    });
    const auto = initBolt(root, { workItems: autoSeed.id, ceremony: 'autopilot' });
    expect(auto.checkpoint_state).toBe('not-required');
    writeStageFiles(auto.id, ['plan.md']);
    const advanced = updateStage(root, auto.id, 'plan');
    expect(advanced.current_stage).toBe('execute');
    expect(advanced.checkpoint_state).toBe('not-required');
  });

  it('validate ceremony awaits every gateable stage', () => {
    const { a } = seedTwoItems({ complexity: 'high' });
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'validate' });
    expect(bolt.checkpoint_state).toBe('awaiting');
    writeStageFiles(bolt.id, ['plan.md']);
    updateCheckpoint(root, bolt.id, 'approved');
    const afterPlan = updateStage(root, bolt.id, 'plan');
    expect(afterPlan.current_stage).toBe('execute');
    writeStageFiles(bolt.id, ['plan.md']);
    const afterExec = updateStage(root, bolt.id, 'execute');
    expect(afterExec.current_stage).toBe('test');
    expect(afterExec.checkpoint_state).toBe('awaiting');
    writeStageFiles(bolt.id, ['test-report.md']);
    updateCheckpoint(root, bolt.id, 'yes');
    const afterTest = updateStage(root, bolt.id, 'test');
    expect(afterTest.current_stage).toBe('review');
    expect(afterTest.checkpoint_state).toBe('awaiting');
  });

  it('normalizes common approval phrases to granted', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'confirm' });
    const granted = updateCheckpoint(root, bolt.id, 'go ahead');
    expect(granted.checkpoint_state).toBe('granted');
    expect(updateCheckpoint(root, bolt.id, 'yes').checkpoint_state).toBe('granted');
    expect(updateCheckpoint(root, bolt.id, 'lgtm').checkpoint_state).toBe('granted');
  });

  it('resumes from recorded stage even when later-stage files exist', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    expect(() => updateStage(root, bolt.id, 'test')).toThrow(/not "test"/i);
    const advanced = updateStage(root, bolt.id, 'plan');
    expect(advanced.current_stage).toBe('execute');
  });

  it('refuses completion without recipe evidence and names the files', () => {
    const { a, b } = seedTwoItems();
    const bolt = initBolt(root, { workItems: `${a.id},${b.id}`, ceremony: 'autopilot' });
    expect(() => completeBolt(root, bolt.id, false)).toThrow(/COMPLETE_BLOCKED|missing evidence/i);
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(md.data.status).toBe('active');
  });

  it('completes a two-item bolt once and cascades both items plus the intent', () => {
    const { intent, a, b } = seedTwoItems();
    const bolt = initBolt(root, { workItems: `${a.id},${b.id}`, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) {
      if (stage !== 'execute') {
        /* artifacts already written */
      }
      updateStage(root, bolt.id, stage);
    }
    const done = completeBolt(root, bolt.id, false);
    expect(done.status).toBe('complete');
    expect(done.work_items).toEqual([a.id, b.id]);
    expect(done.intents[intent.id]).toBe('complete');
    const itemA = lib.readMarkdown(join(root, 'docs/specsmd/intents', intent.id, 'work-items', `${a.id}.md`));
    const itemB = lib.readMarkdown(join(root, 'docs/specsmd/intents', intent.id, 'work-items', `${b.id}.md`));
    expect(itemA.data.status).toBe('complete');
    expect(itemB.data.status).toBe('complete');
  });

  it('records an override when force-completing a refused bolt', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'autopilot' });
    const done = completeBolt(root, bolt.id, true);
    expect(done.override).toBe(true);
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(md.data.override).toBe(true);
    expect(md.data.status).toBe('complete');
  });

  it('refuses a walkthrough that contains language-tagged code', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md']);
    writeFileSync(
      join(root, 'docs/specsmd/bolts', bolt.id, 'walkthrough.md'),
      '# Walkthrough\n\n```js\nconsole.log(1)\n```\n',
      'utf8'
    );
    expect(() => completeBolt(root, bolt.id, false)).toThrow(/WALKTHROUGH_HAS_CODE|code/i);
  });

  it('adopts a draft and leaves ignore as the no-op path', () => {
    const { a, b } = seedTwoItems();
    const draft = initDraft(root, { workItems: `${a.id},${b.id}`, recipe: 'default' });
    expect(draft.status).toBe('draft');
    const bolt = initBolt(root, { adoptDraft: draft.id });
    expect(bolt.adopted_draft).toBe(draft.id);
    expect(bolt.work_items).toEqual([a.id, b.id]);
    const draftMd = lib.readMarkdown(join(root, 'docs/specsmd/bolts', draft.id, 'bolt.md'));
    expect(draftMd.data.status).toBe('abandoned');
  });

  it('status reports the three lenses and does not write', () => {
    const { intent, a } = seedTwoItems();
    const before = readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8');
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'confirm' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    updateCheckpoint(root, bolt.id, 'yes');
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    completeBolt(root, bolt.id, false);

    const leftover = initWorkItem(root, {
      intent: intent.id,
      title: 'Unbolted leftover',
      complexity: 'low',
      body: '# leftover\n',
    });
    const report = projectStatus(root);
    expect(report.lenses.shipping.some((x: { id: string }) => x.id === bolt.id)).toBe(true);
    expect(report.lenses.shaping.some((x: { id: string }) => x.id === leftover.id)).toBe(true);
    expect(report.suggestion.best.skill).toBeTruthy();
    const after = readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8');
    expect(after).toBe(before);
  });

  it('empty tree suggests init', () => {
    const report = projectStatus(root);
    expect(report.initialized).toBe(false);
    expect(report.suggestion.best.skill).toBe('specsmd-init');
  });

  it('suggests decompose before bolt-start when an intent has zero items', () => {
    initProject(root, 'balanced');
    const empty = initIntent(root, { title: 'Empty intent' });
    const ready = initIntent(root, { title: 'Ready intent' });
    initWorkItem(root, { intent: ready.id, title: 'Ready slice', complexity: 'low', body: '# x\n' });
    const report = projectStatus(root);
    expect(report.suggestion.best.skill).toBe('work-item-decompose');
    expect(report.suggestion.best.why).toContain(empty.id);
    expect(report.suggestion.options.some((o: { skill: string }) => o.skill === 'bolt-start')).toBe(true);
  });

  it('all-low items under balanced bias default to autopilot, not confirm', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Tiny fix' });
    const item = initWorkItem(root, {
      intent: intent.id,
      title: 'Rename a label',
      complexity: 'low',
      body: '# A\n\n- [x] (gating) the label reads Save\n',
    });
    expect(item.ceremony_suggested).toBe('autopilot');
    const bolt = initBolt(root, { workItems: item.id });
    expect(bolt.ceremony).toBe('autopilot');
    expect(bolt.checkpoint_state).toBe('not-required');
  });

  it('revives a complete intent when a new work item is added', () => {
    const { intent, a, b } = seedTwoItems();
    const bolt = initBolt(root, { workItems: `${a.id},${b.id}`, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    completeBolt(root, bolt.id, false);
    const leftover = initWorkItem(root, {
      intent: intent.id,
      title: 'Follow-on slice',
      complexity: 'low',
      body: '# leftover\n',
    });
    const intentMd = lib.readMarkdown(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'));
    expect(intentMd.data.status).toBe('active');
    const again = initBolt(root, { workItems: leftover.id, ceremony: 'autopilot' });
    expect(again.id).toBeTruthy();
    const intentAfterBolt = lib.readMarkdown(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'));
    expect(intentAfterBolt.data.status).toBe('active');
  });

  it('refuses a dependency cycle that crosses intents', () => {
    initProject(root);
    const alpha = initIntent(root, { title: 'Alpha' });
    const beta = initIntent(root, { title: 'Beta' });
    const x = initWorkItem(root, {
      intent: alpha.id,
      title: 'X',
      id: '010-x',
      dependsOn: '011-y',
    });
    expect(() =>
      initWorkItem(root, {
        intent: beta.id,
        title: 'Y',
        id: '011-y',
        dependsOn: x.id,
      })
    ).toThrow(/cycle/i);
  });
});
