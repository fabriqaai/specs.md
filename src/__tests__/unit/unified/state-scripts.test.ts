/**
 * Unified bolt flow state scripts — goal-gated writes, no state.yaml.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

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
    expect(contract.status.rejected_synonyms).toContain('in-progress');
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
    expect(existsSync(join(root, 'docs/specsmd/recipes/ddd.yaml'))).toBe(true);
    expect(existsSync(join(root, 'docs/specsmd/recipes/spike.yaml'))).toBe(true);
    expect(existsSync(join(root, 'docs/specsmd/recipes/simple.yaml'))).toBe(true);
    expect(existsSync(join(root, 'package.json'))).toBe(false);
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
    expect(result.recipes.sort()).toEqual(['ddd', 'default', 'simple', 'spike']);
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

  it('assigns distinct bolt ids when two working copies share a basename', () => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const leftRoot = join(tmpdir(), `specsmd-same-${stamp}`, 'app');
    const rightRoot = join(tmpdir(), `specsmd-other-${stamp}`, 'app');
    mkdirSync(leftRoot, { recursive: true });
    mkdirSync(rightRoot, { recursive: true });
    try {
      initProject(leftRoot, 'balanced');
      initProject(rightRoot, 'balanced');
      const leftIntent = initIntent(leftRoot, { title: 'Same name' });
      const rightIntent = initIntent(rightRoot, { title: 'Same name' });
      const leftItem = initWorkItem(leftRoot, { intent: leftIntent.id, title: 'Slice' });
      const rightItem = initWorkItem(rightRoot, { intent: rightIntent.id, title: 'Slice' });
      const leftBolt = initBolt(leftRoot, { workItems: leftItem.id, ceremony: 'autopilot' });
      const rightBolt = initBolt(rightRoot, { workItems: rightItem.id, ceremony: 'autopilot' });
      expect(lib.worktreeToken(leftRoot)).not.toBe(lib.worktreeToken(rightRoot));
      expect(leftBolt.id).not.toBe(rightBolt.id);
    } finally {
      rmSync(join(tmpdir(), `specsmd-same-${stamp}`), { recursive: true, force: true });
      rmSync(join(tmpdir(), `specsmd-other-${stamp}`), { recursive: true, force: true });
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
    expect(md.data.recipe_snapshot.stages.map((s: { id: string }) => s.id)).toEqual([
      'plan',
      'execute',
      'test',
      'review',
    ]);
    expect(md.data.activated_at).toBeTruthy();
  });

  it('selects a project-local recipe with no other change', () => {
    const { a } = seedTwoItems();
    writeFileSync(
      join(root, 'docs/specsmd/recipes/local-only.yaml'),
      [
        'id: local-only',
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
    const bolt = initBolt(root, { workItems: a.id, recipe: 'local-only', ceremony: 'autopilot' });
    expect(bolt.recipe).toBe('local-only');
    expect(bolt.current_stage).toBe('explore');
  });

  it('keeps the recorded recipe and snapshot after the project recipe file changes', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'autopilot' });
    writeFileSync(
      join(root, 'docs/specsmd/recipes/default.yaml'),
      [
        'id: default',
        'stages:',
        '  - id: only-stage',
        '    produces: []',
        '    gateable: false',
        'completion_requires: []',
      ].join('\n'),
      'utf8'
    );
    writeStageFiles(bolt.id, ['plan.md']);
    const advanced = updateStage(root, bolt.id, 'plan');
    expect(advanced.current_stage).toBe('execute');
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(md.data.recipe).toBe('default');
    expect(md.data.recipe_snapshot.stages.map((s: { id: string }) => s.id)).toEqual([
      'plan',
      'execute',
      'test',
      'review',
    ]);
  });

  it('recommends simple/default/ddd from complexity and lets the user win', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Mapping' });
    const low = initWorkItem(root, { intent: intent.id, title: 'Low slice', complexity: 'low', body: '# L\n' });
    const mid = initWorkItem(root, { intent: intent.id, title: 'Mid slice', complexity: 'medium', body: '# M\n' });
    const high = initWorkItem(root, { intent: intent.id, title: 'High slice', complexity: 'high', body: '# H\n' });
    expect(initBolt(root, { workItems: low.id }).recipe).toBe('simple');
    expect(initBolt(root, { workItems: mid.id }).recipe).toBe('default');
    expect(initBolt(root, { workItems: high.id }).recipe).toBe('ddd');
    expect(initBolt(root, { workItems: high.id, recipe: 'simple' }).recipe).toBe('simple');
  });

  it('refuses an unknown constraint kind at recipe load', () => {
    const { a } = seedTwoItems();
    writeFileSync(
      join(root, 'docs/specsmd/recipes/bad-constraint.yaml'),
      [
        'id: bad-constraint',
        'stages:',
        '  - id: only',
        '    produces: []',
        '    gateable: false',
        'constraints:',
        '  - kind: ban_network',
      ].join('\n'),
      'utf8'
    );
    expect(() => initBolt(root, { workItems: a.id, recipe: 'bad-constraint' })).toThrow(
      /CONSTRAINT_UNKNOWN|unknown constraint/i
    );
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
    const auto = initBolt(root, { workItems: autoSeed.id, recipe: 'default', ceremony: 'autopilot' });
    expect(auto.checkpoint_state).toBe('not-required');
    writeStageFiles(auto.id, ['plan.md']);
    const advanced = updateStage(root, auto.id, 'plan');
    expect(advanced.current_stage).toBe('execute');
    expect(advanced.checkpoint_state).toBe('not-required');
  });

  it('validate ceremony awaits every gateable stage', () => {
    const { a } = seedTwoItems({ complexity: 'high' });
    const bolt = initBolt(root, { workItems: a.id, recipe: 'default', ceremony: 'validate' });
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
    try {
      completeBolt(root, bolt.id, false);
      throw new Error('expected completion to be refused');
    } catch (err) {
      const message = String((err as Error).message);
      const remediation = String((err as { remediation?: string }).remediation || '');
      expect(message).toMatch(/COMPLETE_BLOCKED|missing evidence/i);
      expect(message + remediation).toMatch(/test-report\.md/);
      expect(message + remediation).toMatch(/walkthrough\.md/);
      expect(remediation).toMatch(/Write /);
    }
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
    expect(bolt.recipe).toBe('simple');
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

  it('completing one bolt leaves the intent active when another item is still pending', () => {
    const { intent, a, b } = seedTwoItems();
    const leftover = initWorkItem(root, {
      intent: intent.id,
      title: 'Still pending',
      complexity: 'low',
      body: '# leftover\n\n- [x] (gating) leftover\n',
    });
    const bolt = initBolt(root, { workItems: `${a.id},${b.id}`, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    const done = completeBolt(root, bolt.id, false);
    expect(done.intents[intent.id]).toBe('active');
    const leftoverMd = lib.readMarkdown(
      join(root, 'docs/specsmd/intents', intent.id, 'work-items', `${leftover.id}.md`)
    );
    expect(leftoverMd.data.status).toBe('pending');
  });

  it('derives abandoned when every work item is abandoned', () => {
    const contract = lib.loadContract();
    expect(
      lib.deriveIntentStatus(
        [
          { status: 'abandoned' },
          { status: 'abandoned' },
        ],
        contract
      )
    ).toBe('abandoned');
    expect(
      lib.deriveIntentStatus(
        [
          { status: 'complete' },
          { status: 'abandoned' },
        ],
        contract
      )
    ).toBe('complete');
    expect(
      lib.deriveIntentStatus(
        [
          { status: 'complete' },
          { status: 'pending' },
        ],
        contract
      )
    ).toBe('active');
  });

  it('expires a spike through the complete path and keeps partial findings', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, recipe: 'spike', ceremony: 'autopilot' });
    const findings = join(root, 'docs/specsmd/bolts', bolt.id, 'findings.md');
    writeFileSync(findings, '# Partial notes\n\nWe learned the cache is sticky.\n', 'utf8');
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.activated_at = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    expect(() => updateStage(root, bolt.id, 'explore')).toThrow(/TIME_BOX_EXPIRED|time box/i);
    const after = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(after.data.status).toBe('complete');
    expect(after.data.override).toBe(false);
    expect(readFileSync(findings, 'utf8')).toContain('Partial notes');
    const workItem = lib.findWorkItem(root, a.id, lib.loadContract());
    expect(workItem.status).toBe('complete');
  });

  it('writes findings.md on expiry when it is missing and completes without an override', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, recipe: 'spike', ceremony: 'autopilot' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.activated_at = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    const done = completeBolt(root, bolt.id, false);
    expect(done.status).toBe('complete');
    expect(done.override).toBe(false);
    expect(done.time_box_expired).toBe(true);
    expect(existsSync(join(root, 'docs/specsmd/bolts', bolt.id, 'findings.md'))).toBe(true);
  });

  it('does not start the spike clock on a draft', () => {
    const { a } = seedTwoItems();
    const draft = initDraft(root, { workItems: a.id, recipe: 'spike' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', draft.id, 'bolt.md'));
    expect(parsed.data.activated_at).toBeNull();
    parsed.data.created = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    expect(parsed.data.status).toBe('draft');
    expect(
      lib.isTimeBoxExpired(parsed.data, lib.recipeForBolt(root, parsed.data, lib.loadContract()))
    ).toBe(false);
  });

  it('normalizes every grant phrase in the contract and leaves deny as awaiting', () => {
    const { a } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'confirm' });
    const contract = lib.loadContract();
    for (const phrase of contract.approval.grant) {
      expect(updateCheckpoint(root, bolt.id, phrase).checkpoint_state).toBe('granted');
    }
    expect(updateCheckpoint(root, bolt.id, 'no').checkpoint_state).toBe('awaiting');
    expect(updateCheckpoint(root, bolt.id, 'hold').checkpoint_state).toBe('awaiting');
  });

  it('types errors as retryable 1, terminal 2, structural 3 with remediation', () => {
    const contract = lib.loadContract();
    expect(lib.exitCodeFor(lib.retryable('X', 'retry', 'try again'), contract)).toBe(1);
    expect(lib.exitCodeFor(lib.terminal('Y', 'stop', 'pass a different input'), contract)).toBe(2);
    expect(lib.exitCodeFor(lib.structural('Z', 'broken', 'repair the tree'), contract)).toBe(3);
    expect(lib.terminal('Y', 'stop', 'pass a different input').remediation).toMatch(/different input/);

    writeFileSync(join(root, 'empty.md'), '', 'utf8');
    try {
      lib.readMarkdown(join(root, 'empty.md'));
      throw new Error('expected empty artifact to be retryable');
    } catch (err) {
      expect((err as { kind: string }).kind).toBe('retryable');
      expect(lib.exitCodeFor(err, contract)).toBe(1);
    }

    writeFileSync(join(root, 'docs-only.md'), '# no frontmatter\n', 'utf8');
    try {
      lib.readMarkdown(join(root, 'docs-only.md'));
      throw new Error('expected missing frontmatter to be structural');
    } catch (err) {
      expect((err as { kind: string }).kind).toBe('structural');
      expect(lib.exitCodeFor(err, contract)).toBe(3);
    }

    expect(() => lib.assertStatus('in-progress', contract)).toThrow(/STATUS_INVALID|in-progress/);

    const missingRoot = spawnSync(process.execPath, [join(SCRIPTS, 'init-bolt.cjs')], {
      encoding: 'utf8',
    });
    expect(missingRoot.status).toBe(2);
    expect(missingRoot.stdout).toMatch(/"kind": "terminal"/);

    const missingBolt = spawnSync(
      process.execPath,
      [join(SCRIPTS, 'update-stage.cjs'), root, 'bolt-missing-000', 'plan'],
      { encoding: 'utf8' }
    );
    expect(missingBolt.status).toBe(2);
    expect(missingBolt.stdout).toMatch(/remediation/);
  });

  it('writes nothing outside the artifact root across a full bolt lifecycle', () => {
    const { intent, a } = seedTwoItems();
    const before = new Set(require('fs').readdirSync(root));
    const bolt = initBolt(root, { workItems: a.id, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    completeBolt(root, bolt.id, false);
    const after = require('fs').readdirSync(root);
    for (const name of after) {
      if (!before.has(name)) expect(name).toBe('docs');
    }
    expect(existsSync(join(root, 'package.json'))).toBe(false);
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
    expect(existsSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'))).toBe(true);
  });

  it('runs the ddd and simple recipes from their snapshots', () => {
    const { a } = seedTwoItems({ complexity: 'high' });
    const ddd = initBolt(root, { workItems: a.id, recipe: 'ddd', ceremony: 'autopilot' });
    expect(ddd.current_stage).toBe('domain-model');
    writeStageFiles(ddd.id, ['domain-model.md']);
    expect(updateStage(root, ddd.id, 'domain-model').current_stage).toBe('design');
    writeStageFiles(ddd.id, ['design.md']);
    expect(updateStage(root, ddd.id, 'design').current_stage).toBe('decisions');
    writeStageFiles(ddd.id, ['decisions.md']);
    expect(updateStage(root, ddd.id, 'decisions').current_stage).toBe('implement');
    expect(updateStage(root, ddd.id, 'implement').current_stage).toBe('test');
    writeStageFiles(ddd.id, ['test-report.md']);
    updateStage(root, ddd.id, 'test');
    const dddDone = completeBolt(root, ddd.id, false);
    expect(dddDone.status).toBe('complete');

    const simpleItem = initWorkItem(root, {
      intent: a.intent,
      title: 'Simple slice',
      complexity: 'low',
      body: '# S\n\n- [x] (gating) the label reads Save\n',
    });
    const simple = initBolt(root, { workItems: simpleItem.id, recipe: 'simple', ceremony: 'autopilot' });
    expect(simple.current_stage).toBe('plan');
    writeStageFiles(simple.id, ['plan.md']);
    expect(updateStage(root, simple.id, 'plan').current_stage).toBe('implement');
    expect(updateStage(root, simple.id, 'implement').current_stage).toBe('walkthrough');
    writeStageFiles(simple.id, ['walkthrough.md']);
    updateStage(root, simple.id, 'walkthrough');
    expect(completeBolt(root, simple.id, false).status).toBe('complete');
  });

  it('refuses checkpoint phrases that are not a grant or deny, and refuses checkpoints on ungated stages', () => {
    const { a } = seedTwoItems();
    const confirm = initBolt(root, { workItems: a.id, ceremony: 'confirm' });
    expect(() => updateCheckpoint(root, confirm.id, 'not-required')).toThrow(/APPROVAL_UNRECOGNIZED|not-required/);
    expect(() => updateCheckpoint(root, confirm.id, 'none')).toThrow(/APPROVAL_UNRECOGNIZED|none/);
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', confirm.id, 'bolt.md'));
    expect(md.data.checkpoint_state).toBe('awaiting');

    const auto = initBolt(root, { workItems: a.id, recipe: 'default', ceremony: 'autopilot' });
    expect(() => updateCheckpoint(root, auto.id, 'no')).toThrow(/GATE_NOT_REQUIRED|no checkpoint/i);
    writeStageFiles(auto.id, ['plan.md']);
    updateStage(root, auto.id, 'plan');
    expect(() => updateCheckpoint(root, auto.id, 'yes')).toThrow(/GATE_NOT_REQUIRED|no checkpoint/i);
  });

  it('refuses an unknown ceremony on a draft', () => {
    const { a } = seedTwoItems();
    expect(() => initDraft(root, { workItems: a.id, ceremony: 'banana' })).toThrow(/CEREMONY_INVALID|banana/);
  });

  it('refuses path-like ids and writes only under the artifact root', () => {
    initProject(root);
    expect(() => initIntent(root, { title: 'Escape', id: '001-../../../tmp/pwned' })).not.toThrow();
    const intent = initIntent(root, { title: 'Safe intent' });
    expect(intent.id).toMatch(/^\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(existsSync(join(root, 'docs/specsmd/intents', '001-tmp-pwned', 'brief.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/specsmd/tmp/pwned/brief.md'))).toBe(false);

    expect(() =>
      initWorkItem(root, { intent: intent.id, title: 'Escape item', id: '009-../../../tmp/wi-pwned' })
    ).not.toThrow();
    expect(existsSync(join(root, 'docs/specsmd/intents', intent.id, 'work-items', '009-tmp-wi-pwned.md'))).toBe(true);

    expect(() => lib.readBolt(root, '../../../outside-bolt', lib.loadContract())).toThrow(
      /not a safe identifier|ID_INVALID/
    );
  });

  it('omits an empty gating checkbox from the work-item stub', () => {
    initProject(root);
    const intent = initIntent(root, { title: 'Stub' });
    const item = initWorkItem(root, { intent: intent.id, title: 'No checkbox yet' });
    const md = readFileSync(item.path, 'utf8');
    expect(md).not.toMatch(/- \[ \] \(gating\)\s*$/m);
    expect(lib.uncheckedGatingCriteria(lib.readMarkdown(item.path).body)).toEqual([]);
  });

  it('status notes an expired spike without writing', () => {
    const { a, intent } = seedTwoItems();
    const bolt = initBolt(root, { workItems: a.id, recipe: 'spike', ceremony: 'autopilot' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.activated_at = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString();
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    const before = readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8');
    const report = projectStatus(root);
    const listed = report.lenses.building.find((b: { id: string }) => b.id === bolt.id);
    expect(listed.time_box_expired).toBe(true);
    expect(listed.note).toMatch(/Time box expired/);
    expect(report.suggestion.best.why).toMatch(/time box/i);
    const afterBolt = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(afterBolt.data.status).toBe('active');
    expect(readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8')).toBe(before);
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
