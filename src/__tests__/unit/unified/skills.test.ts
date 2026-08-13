/**
 * specsmd flow skills — contracts, no required-next, no state scripts.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PLUGIN = join(__dirname, '../../../../plugins/specsmd');
const SKILLS = join(PLUGIN, 'skills');

const VERB_SKILLS = [
  'plan-intent',
  'work-item-decompose',
  'bolt-design',
  'bolt-execute',
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

describe('specsmd flow skills', () => {
  it('does not ship state scripts', () => {
    expect(existsSync(join(SKILLS, 'flow-runtime/scripts'))).toBe(false);
  });

  it('ships the slim verb set and no ops skills', () => {
    const names = readdirSync(SKILLS).filter((name) =>
      existsSync(join(SKILLS, name, 'SKILL.md'))
    );
    expect(names.sort()).toEqual(
      [
        'bolt-design',
        'bolt-execute',
        'flow-runtime',
        'plan-intent',
        'specsmd-init',
        'specsmd-status',
        'using-specsmd',
        'work-item-decompose',
      ].sort()
    );
    expect(names).not.toContain('release-checklist');
    expect(names).not.toContain('release-verify');
  });

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

  it('intent brief is an nlspec at the outcome layer', () => {
    const brief = readFileSync(join(SKILLS, 'plan-intent/references/brief.md'), 'utf8');
    for (const heading of [
      '## Problem',
      '## Outcome',
      '## Scope',
      '## Non-goals',
      '## Named freedoms',
      '## Rationale',
      '## Definition of Done',
    ]) {
      expect(brief).toContain(heading);
    }
    expect(brief).toMatch(/\(gating\)/);
    const body = skillBody('plan-intent');
    expect(body).toMatch(/problem/i);
    expect(body).toMatch(/outcome/i);
    expect(body).toMatch(/scope/i);
    expect(body).toMatch(/non-goals/i);
    expect(body).toMatch(/dividing question/);
    expect(body).toMatch(/one question per turn/i);
    expect(body).toMatch(/Wait for an explicit yes/);
    expect(body).toMatch(/caller-contracts/);
    expect(body).toMatch(/return \/ surfaces \/ set rule \/ shape \/ credential/);
    expect(body).toMatch(/Self-review/);
    expect(body).toMatch(/two-implementer/i);
    expect(body).toMatch(/named freedoms/i);
    expect(body).toMatch(/extension point/);
    expect(body).toMatch(/references\/writing\.md/);
    const writing = readFileSync(join(SKILLS, 'plan-intent/references/writing.md'), 'utf8');
    expect(writing).toMatch(/status quo/);
    expect(writing).toMatch(/No placeholders/);
    expect(writing).toMatch(/four parts/);
    expect(writing).toMatch(/\*\*Good\*\*/);
    expect(writing).toMatch(/\*\*Bad\*\*/);
    const nlspec = readFileSync(join(SKILLS, 'flow-runtime/references/nlspec.md'), 'utf8');
    expect(nlspec).toMatch(/## Registers/);
    expect(nlspec).toMatch(/Intent brief/);
    expect(nlspec).toMatch(/Work item/);
    expect(nlspec).toMatch(/tasks\.md/);
  });

  it('keeps every work item as a section in one tasks.md', () => {
    const template = readFileSync(join(SKILLS, 'work-item-decompose/references/work-item.md'), 'utf8');
    expect(template).toMatch(/- \[ \] \[\{id\}\]\(#\{id\}\)/);
    expect(template).toMatch(/^## \{id\}/m);
    expect(template).toMatch(/### Definition of Done/);
    expect(skillBody('work-item-decompose')).toMatch(/tasks\.md/);
    expect(skillBody('work-item-decompose')).toMatch(/Do not create a file per slice/);
    expect(skillBody('work-item-decompose')).toMatch(/- \[x\]/);
  });

  it('walkthrough template always has deviations, evidence, and no language-tagged fence', () => {
    const walkthrough = readFileSync(join(SKILLS, 'bolt-execute/references/walkthrough.md'), 'utf8');
    expect(walkthrough).toMatch(/## Deviations from plan/);
    expect(walkthrough).toMatch(/## Evidence/);
    expect(walkthrough).not.toMatch(/```[a-zA-Z]/);
    expect(existsSync(join(SKILLS, 'bolt-execute/references/test-report.md'))).toBe(false);
    expect(skillBody('bolt-execute')).toMatch(/deviations/i);
    expect(skillBody('bolt-execute')).toMatch(/language-tagged/);
    expect(skillBody('bolt-execute')).toMatch(/no separate test-report/);
  });

  it('splits design from implement and blocks open caller contracts', () => {
    const design = skillBody('bolt-design');
    const execute = skillBody('bolt-execute');
    expect(design).toMatch(/Do not write product code/);
    expect(design).toMatch(/Two-implementer/);
    expect(design).toMatch(/caller-contracts/);
    expect(design).toMatch(/One open hunt per turn/);
    expect(design).toMatch(/recommend first/);
    expect(design).toMatch(/only after an explicit yes/);
    expect(design).toMatch(/bolts\/\{boltId\}\/decisions\//);
    expect(design).toMatch(/decisions\/index\.md/);
    expect(execute).toMatch(/test first/i);
    expect(execute).toMatch(/Refuses if caller-visible contracts are still open|Two-implementer/);
    expect(execute).toMatch(/starting `bolt-design` now|follow `bolt-design`/i);
    expect(execute).toMatch(/Tell the user/);
    const hunts = readFileSync(join(SKILLS, 'flow-runtime/references/caller-contracts.md'), 'utf8');
    expect(hunts).toMatch(/Return/);
    expect(hunts).toMatch(/Surfaces/);
    expect(hunts).toMatch(/Set rule/);
    expect(hunts).toMatch(/Shape/);
    expect(hunts).toMatch(/Credential/);
    const implementing = readFileSync(join(SKILLS, 'bolt-execute/references/implementing.md'), 'utf8');
    expect(implementing).toMatch(/test first/i);
    expect(implementing).toMatch(/longest matching/);
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
    const body = skillBody('bolt-design');
    expect(body).toMatch(/first gateable/);
    expect(body).toMatch(/every gateable/);
  });

  it('treats dismiss as ignore and names adopt / modify / ignore', () => {
    const body = skillBody('bolt-design');
    expect(body).toMatch(/adopt/i);
    expect(body).toMatch(/modify/i);
    expect(body).toMatch(/ignore/i);
    expect(body).toMatch(/Dismissing the prompt is \*\*ignore\*\*/);
  });

  it('requires genuine review of the full plan text', () => {
    const body = skillBody('bolt-design') + skillBody('bolt-execute');
    expect(body).toMatch(/full current text/i);
    expect(body).toMatch(/not a summary/i);
    expect(body).toMatch(/this section does not apply/);
    expect(body).toMatch(/Do not advance the stage/);
  });

  it('keeps the navigator read-only', () => {
    const body = skillBody('specsmd-status');
    expect(body).toMatch(/Never write artifacts/);
    expect(body).toMatch(/Never invoke another skill/);
    expect(body).toMatch(
      /awaiting gate → active bolt → empty intent → unbolted items → drafts → empty tree/
    );
    expect(body).toMatch(/Never suggest `flow-runtime`/);
  });

  it('recommends a recipe from complexity when the user omits one', () => {
    const body = skillBody('bolt-design');
    expect(body).toMatch(/recommend from complexity/);
    expect(body).toMatch(/omit a recipe pick to take the complexity recommendation/);
  });

  it('scopes a bolt to one intent and nests it under that intent', () => {
    const body = skillBody('bolt-design');
    expect(body).toMatch(/exactly one intent/);
    expect(body).toMatch(/intents\/\{intent\}\/bolts\//);
    expect(body).toMatch(/Refuse a grouping that names tasks from another intent/);
    const contract = readFileSync(join(SKILLS, 'flow-runtime/references/flow-contract.yaml'), 'utf8');
    expect(contract).toMatch(/intents\/\{intent\}\/bolts\/\{id\}\/bolt\.md/);
    expect(contract).not.toMatch(/^\s+path: bolts\/\{id\}\/bolt\.md$/m);
    expect(contract).not.toMatch(/^ {2}release:/m);
  });
});
