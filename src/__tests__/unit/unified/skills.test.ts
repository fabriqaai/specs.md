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
  'task-decompose',
  'bolt-design',
  'bolt-execute',
  'bolt-review',
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
        'bolt-review',
        'flow-runtime',
        'plan-intent',
        'specsmd-init',
        'specsmd-status',
        'using-specsmd',
        'task-decompose',
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
    expect(body).toMatch(/references\/brief-writing\.md/);
    const writing = readFileSync(join(SKILLS, 'plan-intent/references/brief-writing.md'), 'utf8');
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

  it('holds every document-writing skill to one writing standard', () => {
    const writing = readFileSync(join(SKILLS, 'flow-runtime/references/writing.md'), 'utf8');
    expect(writing).toMatch(/## Write for a reader with no history/);
    expect(writing).toMatch(/does this stand alone/i);
    expect(writing).toMatch(/## Say what to do/);
    expect(writing).toMatch(/## Give the reason with the rule/);
    expect(writing).toMatch(/## Use few examples, and balance them/);
    expect(writing).toMatch(/## Name where each claim comes from/);
    expect(writing).toMatch(/Mark inference as inference/);
    // Records stay append-only: the delete rule must never reach the review ledger.
    expect(writing).toMatch(/## Remove by deleting/);
    expect(writing).toMatch(/prescriptive/i);
    expect(writing).toMatch(/append-only/);
    expect(writing).toMatch(/review-findings\.md/);
    // Every artifact named in the scope line lands in one of the two classes.
    const prescriptive = writing.split(/\*\*prescriptive\*\*/i)[1]?.split('## Voice')[0] ?? '';
    for (const artifact of ['standards', 'domain models', 'review briefs']) {
      expect(prescriptive, `unclassified: ${artifact}`).toContain(artifact);
    }
    expect(prescriptive).toMatch(/walkthroughs, decisions, and finding ledgers/);

    expect(skillBody('plan-intent')).toMatch(/references\/writing\.md/);
    expect(skillBody('task-decompose')).toMatch(/references\/writing\.md/);
    expect(skillBody('bolt-review')).toMatch(/references\/writing\.md/);
    expect(skillBody('specsmd-init')).toMatch(/references\/writing\.md/);
    const designing = readFileSync(join(SKILLS, 'bolt-design/references/designing.md'), 'utf8');
    expect(designing).toMatch(/references\/writing\.md/);
    const implementing = readFileSync(join(SKILLS, 'bolt-execute/references/implementing.md'), 'utf8');
    expect(implementing).toMatch(/references\/writing\.md/);
    expect(skillBody('flow-runtime')).toMatch(/references\/writing\.md/);
  });

  it('names the source of a claim instead of asserting it flat', () => {
    const body = skillBody('using-specsmd');
    expect(body).toMatch(/## Say where it comes from/);
    expect(body).toMatch(/skill definitions/i);
    expect(body).toMatch(/MCP tool definitions/);
    expect(body).toMatch(/semantic and episodic/);
    expect(body).toMatch(/read from what you remember/);
    expect(body).toMatch(/Mark inference as inference/);
    expect(body).toMatch(/citation apparatus is not the goal/);
    expect(body).toMatch(/## Precedence/);
  });

  it('keeps every work item as a section in one tasks.md', () => {
    const template = readFileSync(join(SKILLS, 'task-decompose/references/task.md'), 'utf8');
    expect(template).toMatch(/- \[ \] \[\{id\}\]\(#\{id\}\)/);
    expect(template).toMatch(/^## \{id\}/m);
    expect(template).toMatch(/### Definition of Done/);
    expect(skillBody('task-decompose')).toMatch(/tasks\.md/);
    expect(skillBody('task-decompose')).toMatch(/Do not create a file per slice/);
    expect(skillBody('task-decompose')).toMatch(/- \[x\]/);
    expect(skillBody('task-decompose')).toMatch(/when the brief states the outcome clearly enough to slice/);
    expect(skillBody('plan-intent')).toMatch(/once the outcome is captured, write this intent's `tasks\.md`/);
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
    expect(execute).toMatch(/No confirmation/);
    expect(execute).toMatch(/every remaining non-design stage/i);
    expect(execute).not.toMatch(/Ceremony while running/);
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
    expect(implementing).toMatch(/engineering/);
    expect(implementing).not.toMatch(/testing standard/);
  });

  it('keeps a coverage floor with test-first gating criteria', () => {
    const execute = skillBody('bolt-execute');
    expect(execute).toMatch(/covering check/);
    expect(execute).toMatch(/recorded decision/);
    expect(execute).toMatch(/vendored or generated/);
    const implementing = readFileSync(join(SKILLS, 'bolt-execute/references/implementing.md'), 'utf8');
    expect(implementing).toMatch(/covering check/);
    expect(implementing).toMatch(/fail for the right reason/);
    expect(implementing).toMatch(/failing-first observation/);
    expect(implementing).toMatch(/order is free; coverage is not/);
    expect(implementing).toMatch(/empty, zero, one, many/);
    expect(implementing).toMatch(/absent or null input/);
    expect(implementing).toMatch(/dismissed in one Evidence line/);
    expect(implementing).toMatch(/unfilled placeholder/);
    expect(implementing).toMatch(/Do not proceed testless/);
    const walkthrough = readFileSync(join(SKILLS, 'bolt-execute/references/walkthrough.md'), 'utf8');
    expect(walkthrough).toMatch(/Coverage:/);
    expect(walkthrough).toMatch(/failing-first/);
    const engineering = readFileSync(
      join(SKILLS, 'flow-runtime/references/standards/engineering.md'),
      'utf8'
    );
    expect(engineering).toMatch(/failing check first/);
    expect(engineering).toMatch(/empty, zero, one, many/);
    expect(engineering).toMatch(/dismissed in one Evidence line/);
  });

  it('keeps bolt-review a read-only lead generator', () => {
    const review = skillBody('bolt-review');
    expect(review).toMatch(/read-only/i);
    expect(review).toMatch(/never writes a fix/i);
    expect(review).toMatch(/Verify before reporting/);
    expect(review).toMatch(/Do not re-report/);
    expect(review).toMatch(/correctness or the stated requirements/);
    expect(review).toMatch(/load-bearing/);
    expect(review).toMatch(/advisory/i);
    expect(review).toMatch(/Severity \/ Where \/ Defect \/ Failure scenario \/ Evidence \/ Fix direction/);
    const brief = readFileSync(join(SKILLS, 'bolt-review/references/brief.md'), 'utf8');
    expect(brief).toMatch(/Read first/);
    expect(brief).toMatch(/Known-open/);
    expect(brief).toMatch(/Verification commands/);
    expect(brief).toMatch(/Change surface/);
    const ledger = readFileSync(join(SKILLS, 'bolt-review/references/review-findings.md'), 'utf8');
    expect(ledger).toMatch(/OPEN/);
    expect(ledger).toMatch(/FIXED/);
    expect(ledger).toMatch(/REFUTED/);
    expect(ledger).toMatch(/ACCEPTED/);
    expect(ledger).toMatch(/## Round/);
    expect(ledger).toMatch(/forward only/);
  });

  it('closes the review loop on gates, never on reviewer silence', () => {
    const implementing = readFileSync(join(SKILLS, 'bolt-execute/references/implementing.md'), 'utf8');
    expect(implementing).toMatch(/## \d+\. Review loop/);
    expect(implementing).toMatch(/fresh context/i);
    expect(implementing).toMatch(/never on reviewer silence/);
    expect(implementing).toMatch(/Regression gate/);
    expect(implementing).toMatch(/external anchor/i);
    expect(implementing).toMatch(/forward only/);
    expect(implementing).toMatch(/max_rounds/);
    expect(implementing).toMatch(/never scrub/i);
    const execute = skillBody('bolt-execute');
    expect(execute).toMatch(/review-findings\.md/);
    expect(execute).toMatch(/bolt-review/);
    const transitions = readFileSync(
      join(SKILLS, 'flow-runtime/references/transitions.md'),
      'utf8'
    );
    expect(transitions).toMatch(/review_rounds_completed/);
    expect(transitions).toMatch(/last_round_verdict/);
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
    expect(body).toMatch(/first gateable design/);
    expect(body).toMatch(/every gateable design/);
    expect(body).toMatch(/Implement stages never wait/);
  });

  it('treats dismiss as ignore and names adopt / modify / ignore', () => {
    const body = skillBody('bolt-design');
    expect(body).toMatch(/adopt/i);
    expect(body).toMatch(/modify/i);
    expect(body).toMatch(/ignore/i);
    expect(body).toMatch(/Dismissing the prompt is \*\*ignore\*\*/);
  });

  it('requires genuine review of the full plan text', () => {
    const body = skillBody('bolt-design');
    expect(body).toMatch(/full current text/i);
    expect(body).toMatch(/not a summary/i);
    expect(body).toMatch(/this section does not apply/);
    expect(body).toMatch(/Do not advance the stage/);
  });

  it('init writes constitution plus one engineering standard and copies nlspec', () => {
    const body = skillBody('specsmd-init');
    expect(body).toMatch(/standards\.shipped/);
    expect(body).toMatch(/lasting/i);
    expect(body).toMatch(/constitution and engineering/);
    expect(body).toMatch(/nlspec\.md/);
    expect(body).toMatch(/Do not invent additional standard files/);
    expect(body).toMatch(/leave them/);
    expect(body).not.toMatch(/tech-stack/);
    expect(body).not.toMatch(/architecture\.md/);
    expect(existsSync(join(SKILLS, 'flow-runtime/references/standards/engineering.md'))).toBe(true);
    expect(existsSync(join(SKILLS, 'flow-runtime/references/standards/tech-stack.md'))).toBe(false);
    expect(existsSync(join(SKILLS, 'flow-runtime/references/standards/architecture.md'))).toBe(false);
    expect(existsSync(join(SKILLS, 'flow-runtime/references/standards/coding.md'))).toBe(false);
    expect(existsSync(join(SKILLS, 'flow-runtime/references/standards/testing.md'))).toBe(false);
  });

  it('states the target-state lifecycle in using-specsmd', () => {
    const body = skillBody('using-specsmd');
    expect(body).toMatch(/## Lifecycle/);
    expect(body).toMatch(/`plan-intent`/);
    expect(body).toMatch(/`task-decompose`/);
    expect(body).toMatch(/`bolt-design`/);
    expect(body).toMatch(/`bolt-execute`/);
    expect(body).toMatch(/Stay here while the outcome is thin/);
    expect(body).toMatch(/after the outcome is clear/);
  });

  it('keeps the navigator read-only', () => {
    const body = skillBody('specsmd-status');
    expect(body).toMatch(/Never write artifacts/);
    expect(body).toMatch(/Never invoke another skill/);
    expect(body).toMatch(
      /awaiting gate → active bolt → unfinished brief → captured outcome without tasks → unbolted tasks → drafts → empty tree/
    );
    expect(body).toMatch(/Never suggest `flow-runtime`/);
    expect(body).toMatch(/unfinished brief.*`plan-intent`/s);
    expect(body).toMatch(/Outcome captured.*`task-decompose`/);
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
