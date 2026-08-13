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
const SCRIPTS = join(__dirname, '../../../../plugins/specsmd/skills/flow-runtime/scripts');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));

function loadShipped(id: string) {
  return lib.normalizeRecipe(
    lib.parseYaml(readFileSync(join(RECIPES, `${id}.yaml`), 'utf8')),
    id,
    lib.loadContract()
  );
}

describe('shipped recipes', () => {
  it('ships exactly the four catalog recipes', () => {
    const ids = readdirSync(RECIPES)
      .filter((name) => name.endsWith('.yaml'))
      .map((name) => name.replace(/\.yaml$/, ''))
      .sort();
    expect(ids).toEqual(['ddd', 'default', 'simple', 'spike']);
    expect(lib.loadContract().recipe.shipped.sort()).toEqual(ids);
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
      ['test-report.md'],
      ['review-report.md', 'walkthrough.md'],
    ]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([
      true,
      false,
      true,
      true,
    ]);
    expect(recipe.completion_requires).toEqual(['test-report.md', 'walkthrough.md']);
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
      ['test-report.md'],
    ]);
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([
      true,
      true,
      true,
      false,
      true,
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
    expect(lib.parseIsoDuration('PT8H')).toBe(8 * 60 * 60 * 1000);
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
    expect(recipe.stages.map((s: { gateable: boolean }) => s.gateable)).toEqual([true, false, true]);
    expect(recipe.completion_requires).toEqual(['walkthrough.md']);
    expect(recipe.constraints).toEqual([]);
  });

  it('refuses unknown constraint kinds at load', () => {
    expect(() =>
      lib.normalizeRecipe(
        {
          id: 'weird',
          stages: [{ id: 'only', produces: [], gateable: false }],
          constraints: [{ kind: 'must_use_haskell' }],
        },
        'weird',
        lib.loadContract()
      )
    ).toThrow(/CONSTRAINT_UNKNOWN|unknown constraint/i);
  });
});
