/**
 * Planning, execution, and navigator skills — full contracts, no required-next.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const PLUGIN = join(__dirname, '../../../../plugins/specsmd');
const SKILLS = join(PLUGIN, 'skills');
const SCRIPTS = join(SKILLS, 'flow-runtime/scripts');

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
const { completeBolt } = require(join(SCRIPTS, 'complete-bolt.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { projectStatus } = require(join(SCRIPTS, 'status.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { relinkWorkItems } = require(join(SCRIPTS, 'relink-work-item.cjs'));

const VERB_SKILLS = [
  'intent-create',
  'work-item-decompose',
  'bolt-plan',
  'bolt-start',
  'bolt-execute',
  'walkthrough-generate',
  'release-checklist',
  'release-verify',
];
const MODEL_INVOCABLE = ['using-specsmd', 'specsmd-status'];
const KNOWN_SKILLS = new Set([
  ...VERB_SKILLS,
  ...MODEL_INVOCABLE,
  'specsmd-init',
  'flow-runtime',
]);

function skillBody(name: string): string {
  const raw = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function skillFrontmatter(name: string): string {
  const raw = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  return match ? match[1] : '';
}

function closeSkillNames(body: string): string[] {
  const close = body.split(/^## Close\s*$/m)[1] || '';
  const names: string[] = [];
  for (const line of close.split('\n')) {
    const match = line.match(/^\s*-\s+`([a-z0-9-]+)`/);
    if (match && KNOWN_SKILLS.has(match[1])) names.push(match[1]);
  }
  return names;
}

function writeStageFiles(root: string, boltId: string, names: string[]) {
  const dir = join(root, 'docs/specsmd/bolts', boltId);
  for (const name of names) {
    const extra = name === 'walkthrough.md' ? '## Deviations from plan\n\nnone\n' : '';
    writeFileSync(join(dir, name), `# ${name}\n\n${extra}`, 'utf8');
  }
}

function suggestionKeys(options: { skill: string; why: string }[]): string[] {
  return options.map((option) => {
    if (/awaiting approval/.test(option.why)) return 'G';
    if (/time box|Resume it/.test(option.why)) return 'I';
    if (option.skill === 'work-item-decompose') return 'C';
    if (/not in a bolt/.test(option.why)) return 'P';
    if (/Draft /.test(option.why)) return 'D';
    if (option.skill === 'release-checklist' || /not yet released/.test(option.why)) return 'S';
    if (/no intents yet/.test(option.why)) return 'E';
    return option.skill;
  });
}

describe('unified skills', () => {
  it('keeps verbs by-name-only and bootstrap plus navigator model-invocable', () => {
    for (const name of VERB_SKILLS) {
      expect(skillFrontmatter(name), name).toMatch(/disable-model-invocation:\s*true/);
    }
    for (const name of MODEL_INVOCABLE) {
      expect(skillFrontmatter(name), name).not.toMatch(/disable-model-invocation:\s*true/);
    }
  });

  it('contains no required-next language', () => {
    for (const name of readdirSync(SKILLS)) {
      const file = join(SKILLS, name, 'SKILL.md');
      if (!existsSync(file)) continue;
      const text = readFileSync(file, 'utf8');
      expect(text, name).not.toMatch(/REQUIRED NEXT SKILL/);
      expect(text, name).not.toMatch(/required-next/i);
      expect(text, name).not.toMatch(/invoke the next skill immediately/i);
    }
  });

  it('close messages list at most three declinable skill names', () => {
    for (const name of [...VERB_SKILLS, ...MODEL_INVOCABLE]) {
      const names = closeSkillNames(skillBody(name));
      expect(names.length, `${name}: ${names.join(', ')}`).toBeLessThanOrEqual(3);
    }
  });

  it('intent brief requires problem, outcome, scope, and non-goals', () => {
    const brief = readFileSync(join(SKILLS, 'intent-create/references/brief.md'), 'utf8');
    for (const heading of ['## Problem', '## Outcome', '## Scope', '## Non-goals']) {
      expect(brief).toContain(heading);
    }
    expect(skillBody('intent-create')).toMatch(/problem/i);
    expect(skillBody('intent-create')).toMatch(/outcome/i);
    expect(skillBody('intent-create')).toMatch(/scope/i);
    expect(skillBody('intent-create')).toMatch(/non-goals/i);
  });

  it('walkthrough template always has deviations and no language-tagged fence', () => {
    const walkthrough = readFileSync(join(SKILLS, 'bolt-execute/references/walkthrough.md'), 'utf8');
    expect(walkthrough).toMatch(/## Deviations from plan/);
    expect(walkthrough).not.toMatch(/```[a-zA-Z]/);
    expect(skillBody('walkthrough-generate')).toMatch(/deviations/i);
    expect(skillBody('walkthrough-generate')).toMatch(/language-tagged/);
  });

  it('leaves the ceremony matrix in the contract', () => {
    const contract = readFileSync(join(SKILLS, 'flow-runtime/references/flow-contract.yaml'), 'utf8');
    expect(contract).toMatch(/matrix:/);
    expect(contract).toMatch(/first_gateable/);
    expect(contract).toMatch(/all_gateable/);
    for (const name of VERB_SKILLS) {
      expect(skillBody(name), name).not.toMatch(/\| low\s+\|/);
    }
  });

  it('records confirm as first gateable and validate as all gateable', () => {
    const start = skillBody('bolt-start');
    const execute = skillBody('bolt-execute');
    expect(start + execute).toMatch(/first gateable/);
    expect(start + execute).toMatch(/every gateable/);
  });

  it('treats dismiss as ignore and names adopt / modify / ignore', () => {
    const start = skillBody('bolt-start');
    expect(start).toMatch(/adopt/i);
    expect(start).toMatch(/modify/i);
    expect(start).toMatch(/ignore/i);
    expect(start).toMatch(/Dismissing the prompt is \*\*ignore\*\*/);
  });

  it('requires genuine review of the full plan text', () => {
    const execute = skillBody('bolt-execute');
    expect(execute).toMatch(/full current text/i);
    expect(execute).toMatch(/not a summary/i);
    expect(execute).toMatch(/this section does not apply/);
    expect(execute).toMatch(/Do not advance the stage/);
  });

  it('keeps the navigator read-only', () => {
    const body = skillBody('specsmd-status');
    expect(body).toMatch(/Never write artifacts/);
    expect(body).toMatch(/Never invoke another skill/);
    expect(body).toMatch(
      /awaiting gate → active bolt → empty intent → unbolted items → drafts → completed-unreleased → empty tree/
    );
    expect(body).toMatch(/Never suggest `flow-runtime`/);
  });

  it('recommends a recipe from complexity when the user omits one', () => {
    const plan = skillBody('bolt-plan');
    const start = skillBody('bolt-start');
    expect(plan).toMatch(/recommend from complexity/);
    expect(start).toMatch(/omit a recipe pick to take the complexity recommendation/);
  });
});

describe('navigator and shaping behavior', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-skills-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  it('writes an intent stub with the four required sections', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'One line outcome' });
    const body = readFileSync(intent.path, 'utf8');
    expect(body).toContain('## Problem');
    expect(body).toContain('## Outcome');
    expect(body).toContain('## Scope');
    expect(body).toContain('## Non-goals');
  });

  it('records ceremony_suggested and names a refused cycle without writing', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Cycle check' });
    const first = initWorkItem(root, {
      intent: intent.id,
      title: 'First',
      complexity: 'high',
      dependsOn: '002-second',
    });
    expect(first.ceremony_suggested).toBe('validate');
    expect(() =>
      initWorkItem(root, {
        intent: intent.id,
        title: 'Second',
        id: '002-second',
        dependsOn: first.id,
      })
    ).toThrow(new RegExp(`${first.id} → 002-second → ${first.id}`));
    expect(existsSync(join(root, 'docs/specsmd/intents', intent.id, 'work-items', '002-second.md'))).toBe(
      false
    );
  });

  it('leaves drafts unchanged when a bolt starts without adopting them', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Drafts' });
    const item = initWorkItem(root, { intent: intent.id, title: 'Drafted slice', complexity: 'low' });
    const other = initWorkItem(root, { intent: intent.id, title: 'Other slice', complexity: 'low' });
    const draft = initDraft(root, { workItems: item.id, recipe: 'simple' });
    initBolt(root, { workItems: other.id, recipe: 'simple', ceremony: 'autopilot' });
    const draftMd = lib.readMarkdown(join(root, 'docs/specsmd/bolts', draft.id, 'bolt.md'));
    expect(draftMd.data.status).toBe('draft');
    expect(draftMd.data.work_items).toEqual([item.id]);
  });

  it('reports unstarted, active, and completed work under the correct lenses', () => {
    initProject(root, 'balanced');
    const empty = initIntent(root, { title: 'Unstarted' });
    const build = initIntent(root, { title: 'Build' });
    const activeItem = initWorkItem(root, {
      intent: build.id,
      title: 'Active slice',
      complexity: 'medium',
      body: '# A\n\n- [x] (gating) visible\n',
    });
    const doneItem = initWorkItem(root, {
      intent: build.id,
      title: 'Done slice',
      complexity: 'low',
      body: '# D\n\n- [x] (gating) visible\n',
    });
    const activeBolt = initBolt(root, { workItems: activeItem.id, ceremony: 'confirm' });
    const doneBolt = initBolt(root, { workItems: doneItem.id, recipe: 'simple', ceremony: 'autopilot' });
    writeStageFiles(root, doneBolt.id, ['plan.md', 'walkthrough.md']);
    updateStage(root, doneBolt.id, 'plan');
    updateStage(root, doneBolt.id, 'implement');
    updateStage(root, doneBolt.id, 'walkthrough');
    completeBolt(root, doneBolt.id, false);

    const report = projectStatus(root);
    expect(report.lenses.shaping.some((row: { id: string }) => row.id === empty.id)).toBe(true);
    expect(report.lenses.building.some((row: { id: string }) => row.id === activeBolt.id)).toBe(true);
    expect(report.lenses.shipping.some((row: { id: string }) => row.id === doneBolt.id)).toBe(true);
  });

  it('computes the four isolated next moves without taking them', () => {
    expect(projectStatus(root).suggestion.best.skill).toBe('specsmd-init');

    initProject(root, 'balanced');
    expect(projectStatus(root).suggestion.best.skill).toBe('intent-create');

    const intent = initIntent(root, { title: 'Ready' });
    const item = initWorkItem(root, { intent: intent.id, title: 'Slice', complexity: 'low' });
    expect(projectStatus(root).suggestion.best.skill).toBe('bolt-start');

    const awaiting = initBolt(root, { workItems: item.id, ceremony: 'confirm' });
    const gated = projectStatus(root);
    expect(gated.suggestion.best.skill).toBe('bolt-execute');
    expect(gated.suggestion.best.why).toMatch(/awaiting approval/);
    expect(gated.suggestion.options.every((row: { skill: string }) => row.skill)).toBe(true);

    const otherIntent = initIntent(root, { title: 'Second' });
    const other = initWorkItem(root, { intent: otherIntent.id, title: 'Resume slice', complexity: 'low' });
    initBolt(root, { workItems: other.id, recipe: 'simple', ceremony: 'autopilot' });
    const resumed = projectStatus(root);
    expect(resumed.suggestion.best.skill).toBe('bolt-execute');
    expect(resumed.suggestion.best.why).toContain(awaiting.id);
  });

  it('surfaces integrity findings in health and ranks next skills as 007 specifies', () => {
    initProject(root, 'balanced');
    const empty = initIntent(root, { title: 'Empty capture' });
    const shape = initIntent(root, { title: 'Shaped' });
    const unbolted = initWorkItem(root, { intent: shape.id, title: 'Unbolted slice', complexity: 'low' });
    initDraft(root, { workItems: unbolted.id, recipe: 'simple' });

    const build = initIntent(root, { title: 'Building' });
    const awaitingItem = initWorkItem(root, {
      intent: build.id,
      title: 'Awaiting slice',
      complexity: 'medium',
      body: '# A\n\n- [x] (gating) visible\n',
    });
    const activeItem = initWorkItem(root, {
      intent: build.id,
      title: 'Active slice',
      complexity: 'low',
      body: '# B\n\n- [x] (gating) visible\n',
    });
    const doneItem = initWorkItem(root, {
      intent: build.id,
      title: 'Done slice',
      complexity: 'low',
      body: '# C\n\n- [x] (gating) visible\n',
    });

    initBolt(root, { workItems: awaitingItem.id, ceremony: 'confirm' });
    initBolt(root, { workItems: activeItem.id, recipe: 'simple', ceremony: 'autopilot' });
    const doneBolt = initBolt(root, { workItems: doneItem.id, recipe: 'simple', ceremony: 'autopilot' });
    writeStageFiles(root, doneBolt.id, ['plan.md', 'walkthrough.md']);
    updateStage(root, doneBolt.id, 'plan');
    updateStage(root, doneBolt.id, 'implement');
    updateStage(root, doneBolt.id, 'walkthrough');
    completeBolt(root, doneBolt.id, false);

    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', doneBolt.id, 'bolt.md'));
    parsed.data.work_items = [doneItem.id, '999-missing'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const report = projectStatus(root);
    expect(report.health.some((finding: { code: string }) => finding.code === 'ORPHAN_REF')).toBe(
      true
    );
    expect(report.lenses.shaping.some((row: { id: string }) => row.id === empty.id)).toBe(true);
    expect(suggestionKeys(report.suggestion.options)).toEqual(['G', 'I', 'C', 'P', 'D', 'S']);
    expect(report.suggestion.options.some((row: { skill: string }) => row.skill === 'flow-runtime')).toBe(
      false
    );
    expect(report.suggestion.best.why).toMatch(/awaiting approval/);
  });

  it('does not write when reporting status with integrity findings', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Health' });
    const item = initWorkItem(root, {
      intent: intent.id,
      title: 'Done',
      complexity: 'low',
      body: '# D\n\n- [x] (gating) visible\n',
    });
    const bolt = initBolt(root, { workItems: item.id, recipe: 'simple', ceremony: 'autopilot' });
    writeStageFiles(root, bolt.id, ['plan.md', 'walkthrough.md']);
    updateStage(root, bolt.id, 'plan');
    updateStage(root, bolt.id, 'implement');
    updateStage(root, bolt.id, 'walkthrough');
    completeBolt(root, bolt.id, false);
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.work_items = [item.id, '999-missing'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    const intentBefore = readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8');
    const boltBefore = readFileSync(parsed.path, 'utf8');
    const report = projectStatus(root);
    expect(report.health.length).toBeGreaterThan(0);
    expect(report.suggestion.best.skill).not.toBe('flow-runtime');
    expect(report.suggestion.options.some((row: { skill: string }) => row.skill === 'flow-runtime')).toBe(
      false
    );
    expect(readFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), 'utf8')).toBe(intentBefore);
    expect(readFileSync(parsed.path, 'utf8')).toBe(boltBefore);
  });

  it('ranks empty-intent ahead of unbolted items when integrity findings exist', () => {
    initProject(root, 'balanced');
    const empty = initIntent(root, { title: 'Empty' });
    const shaped = initIntent(root, { title: 'Shaped' });
    initWorkItem(root, { intent: shaped.id, title: 'Unbolted', complexity: 'low' });
    const doneIntent = initIntent(root, { title: 'Done' });
    const doneItem = initWorkItem(root, {
      intent: doneIntent.id,
      title: 'Done slice',
      complexity: 'low',
      body: '# D\n\n- [x] (gating) visible\n',
    });
    const bolt = initBolt(root, { workItems: doneItem.id, recipe: 'simple', ceremony: 'autopilot' });
    writeStageFiles(root, bolt.id, ['plan.md', 'walkthrough.md']);
    updateStage(root, bolt.id, 'plan');
    updateStage(root, bolt.id, 'implement');
    updateStage(root, bolt.id, 'walkthrough');
    completeBolt(root, bolt.id, false);
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.work_items = [doneItem.id, '999-missing'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const report = projectStatus(root);
    expect(report.health.length).toBeGreaterThan(0);
    expect(report.suggestion.best.skill).toBe('work-item-decompose');
    expect(report.suggestion.best.why).toContain(empty.id);
    expect(report.suggestion.options.some((row: { skill: string }) => row.skill === 'flow-runtime')).toBe(
      false
    );
  });

  it('relinks confirmed pending items onto a new intent', () => {
    initProject(root, 'balanced');
    const source = initIntent(root, { title: 'Source' });
    const target = initIntent(root, { title: 'Target' });
    const item = initWorkItem(root, { intent: source.id, title: 'Move me', complexity: 'low' });
    const result = relinkWorkItems(root, { intent: target.id, workItems: item.id });
    expect(result.work_items[0].intent).toBe(target.id);
    expect(existsSync(join(root, 'docs/specsmd/intents', source.id, 'work-items', `${item.id}.md`))).toBe(
      false
    );
    const moved = lib.readMarkdown(join(root, 'docs/specsmd/intents', target.id, 'work-items', `${item.id}.md`));
    expect(moved.data.intent).toBe(target.id);
    expect(moved.data.status).toBe('pending');
  });

  it('refuses to relink an item that is not pending', () => {
    initProject(root, 'balanced');
    const source = initIntent(root, { title: 'Source' });
    const target = initIntent(root, { title: 'Target' });
    const item = initWorkItem(root, {
      intent: source.id,
      title: 'Bolted',
      complexity: 'low',
      body: '# B\n\n- [x] (gating) visible\n',
    });
    initBolt(root, { workItems: item.id, recipe: 'simple', ceremony: 'autopilot' });
    expect(() => relinkWorkItems(root, { intent: target.id, workItems: item.id })).toThrow(
      /cannot be relinked|named on an active/
    );
  });

  it('writes nothing when a mixed pending,active batch fails preflight', () => {
    initProject(root, 'balanced');
    const source = initIntent(root, { title: 'Source' });
    const target = initIntent(root, { title: 'Target' });
    const pending = initWorkItem(root, { intent: source.id, title: 'Keep me', complexity: 'low' });
    const active = initWorkItem(root, {
      intent: source.id,
      title: 'Already active',
      complexity: 'low',
      body: '# A\n\n- [x] (gating) visible\n',
    });
    initBolt(root, { workItems: active.id, recipe: 'simple', ceremony: 'autopilot' });
    const sourceBefore = readFileSync(
      join(root, 'docs/specsmd/intents', source.id, 'work-items', `${pending.id}.md`),
      'utf8'
    );
    expect(() =>
      relinkWorkItems(root, { intent: target.id, workItems: `${pending.id},${active.id}` })
    ).toThrow(/cannot be relinked|named on an active/);
    expect(existsSync(join(root, 'docs/specsmd/intents', source.id, 'work-items', `${pending.id}.md`))).toBe(
      true
    );
    expect(existsSync(join(root, 'docs/specsmd/intents', target.id, 'work-items', `${pending.id}.md`))).toBe(
      false
    );
    expect(
      readFileSync(join(root, 'docs/specsmd/intents', source.id, 'work-items', `${pending.id}.md`), 'utf8')
    ).toBe(sourceBefore);
    expect(lib.readMarkdown(join(root, 'docs/specsmd/intents', source.id, 'brief.md')).data.status).toBe(
      'active'
    );
  });
});
