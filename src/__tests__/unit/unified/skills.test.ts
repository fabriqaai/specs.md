/**
 * specsmd flow skills — contracts, no required-next, no state scripts.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PLUGIN = join(__dirname, '../../../../plugins/specsmd');
const SKILLS = join(PLUGIN, 'skills');

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

describe('specsmd flow skills', () => {
  it('does not ship state scripts', () => {
    expect(existsSync(join(SKILLS, 'flow-runtime/scripts'))).toBe(false);
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
