/**
 * Shipped recipes are data: stage order, produces, gateable, constraints.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const RECIPES = join(
  __dirname,
  '../../../../plugins/specsmd/skills/flow-runtime/references/recipes'
);
const CONTRACT = join(
  __dirname,
  '../../../../plugins/specsmd/skills/flow-runtime/references/flow-contract.yaml'
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require(join(__dirname, '../../../node_modules/js-yaml'));

function loadShipped(id: string) {
  return yaml.load(readFileSync(join(RECIPES, `${id}.yaml`), 'utf8'));
}

describe('shipped recipes', () => {
  it('ships exactly the four catalog recipes', () => {
    const ids = readdirSync(RECIPES)
      .filter((name) => name.endsWith('.yaml'))
      .map((name) => name.replace(/\.yaml$/, ''))
      .sort();
    expect(ids).toEqual(['ddd', 'default', 'simple', 'spike']);
    const contract = yaml.load(readFileSync(CONTRACT, 'utf8'));
    expect(contract.recipe.shipped.sort()).toEqual(ids);
  });

  it('reads default as plan → execute → test → review with declared artifacts', () => {
    const recipe = loadShipped('default');
    expect(recipe.stages.map((s: { id: string }) => s.id)).toEqual([
      'plan',
      'execute',
      'test',
      'review',
    ]);
    expect(recipe.stages.map((s: { produces: string[] }) => s.produces)).toEqual([
      ['plan.md'],
      [],
      ['walkthrough.md'],
      ['review-report.md', 'walkthrough.md'],
    ]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(recipe.completion_requires).toEqual(['walkthrough.md']);
    expect(recipe.constraints).toEqual([]);
  });

  it('reads ddd as domain-model → design → decisions → implement → test', () => {
    const recipe = loadShipped('ddd');
    expect(recipe.stages.map((s: { id: string }) => s.id)).toEqual([
      'domain-model',
      'design',
      'decisions',
      'implement',
      'test',
    ]);
    expect(recipe.stages.map((s: { produces: string[] }) => s.produces)).toEqual([
      ['domain-model.md'],
      ['design.md'],
      ['decisions.md'],
      [],
      ['walkthrough.md'],
    ]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(recipe.constraints).toEqual([
      { kind: 'no_source_code', stages: ['domain-model', 'design', 'decisions'] },
    ]);
  });

  it('reads spike as explore → findings with an 8-hour time box', () => {
    const recipe = loadShipped('spike');
    expect(recipe.stages.map((s: { id: string }) => s.id)).toEqual(['explore', 'findings']);
    expect(recipe.stages.map((s: { produces: string[] }) => s.produces)).toEqual([[], ['findings.md']]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([false, true]);
    expect(recipe.completion_requires).toEqual(['findings.md']);
    expect(recipe.constraints).toEqual([
      { kind: 'time_box', duration: 'PT8H', on_expiry: 'complete_with_findings' },
    ]);
  });

  it('reads simple as plan → implement → walkthrough', () => {
    const recipe = loadShipped('simple');
    expect(recipe.stages.map((s: { id: string }) => s.id)).toEqual([
      'plan',
      'implement',
      'walkthrough',
    ]);
    expect(recipe.stages.map((s: { produces: string[] }) => s.produces)).toEqual([
      ['plan.md'],
      [],
      ['walkthrough.md'],
    ]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([true, false, false]);
    expect(recipe.completion_requires).toEqual(['walkthrough.md']);
    expect(recipe.constraints).toEqual([]);
  });

  it('marks only design-class stages gateable', () => {
    const contract = yaml.load(readFileSync(CONTRACT, 'utf8')) as {
      ceremony: { design_artifacts: string[] };
      recipe: { shipped: string[] };
    };
    const designArtifacts = new Set(contract.ceremony.design_artifacts);
    for (const id of contract.recipe.shipped) {
      const recipe = loadShipped(id) as {
        stages: { id: string; produces: string[]; gateable: boolean }[];
      };
      for (const stage of recipe.stages) {
        const isDesign = (stage.produces ?? []).some((file) => designArtifacts.has(file));
        expect(stage.gateable, `${id}.${stage.id}`).toBe(isDesign);
      }
    }
  });
});
