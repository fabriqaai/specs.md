/**
 * Flow contract is the single source for locations, identifiers, status, and ceremony.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SCRIPTS = join(__dirname, '../../../../plugins/specsmd/skills/flow-runtime/scripts');
const REFERENCES = join(SCRIPTS, '../references');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));

describe('flow contract', () => {
  const contract = lib.loadContract();

  it('answers location, identifier pattern, state fields, allowed values, and memory class from the contract alone', () => {
    expect(contract.artifact_root).toBe('docs/specsmd');
    expect(contract.state.central_file).toBe(false);
    expect(contract.state.writers).toBe('scripts_only');
    expect(contract.memory_class.stored).toBe(false);

    for (const [name, type] of Object.entries(contract.artifact_types) as [
      string,
      { path: string; identifier_pattern?: string; memory_class: string; fields?: string[] },
    ][]) {
      expect(type.path, `${name} path`).toBeTruthy();
      expect(type.memory_class, `${name} memory class`).toBeTruthy();
      if (name === 'intent' || name === 'work_item' || name === 'bolt') {
        expect(type.memory_class).toBe('change_record');
        expect(type.identifier_pattern).toBeTruthy();
        expect(type.fields).toContain('status');
      }
    }
    expect(contract.artifact_types.bolt.fields).toContain('adopted_draft');
    expect(contract.artifact_types.bolt.fields).toContain('override_reason');

    expect(contract.identifiers.patterns.bolt).toBe('bolt-{worktree}-{nnn}');
    expect(contract.identifiers.patterns.worktree).toContain('sha1(absPath)[:6]');
    expect(contract.identifiers.patterns.intent).toBe('{nnn}-{slug}');
    expect(contract.status.values).toEqual(['draft', 'pending', 'active', 'complete', 'abandoned']);
    expect(contract.status.terminal).toEqual(['complete', 'abandoned']);
    expect(contract.system_document_types.registration_fields).toEqual([
      'name',
      'purpose',
      'claimed_scope',
    ]);
  });

  it('does not treat in-progress as a status value', () => {
    expect(contract.status.values).not.toContain('in-progress');
    expect(contract.status.rejected_synonyms).toContain('in-progress');
    expect(() => lib.assertStatus('in-progress', contract)).toThrow(/not in the contract vocabulary/);
    expect(() => lib.assertStatus('completed', contract)).toThrow(/not in the contract vocabulary/);
  });

  it('derives memory class from status for change records', () => {
    expect(lib.memoryClassFor('intent', 'active', contract)).toBe('semantic');
    expect(lib.memoryClassFor('work_item', 'pending', contract)).toBe('semantic');
    expect(lib.memoryClassFor('bolt', 'complete', contract)).toBe('episodic');
    expect(lib.memoryClassFor('bolt', 'abandoned', contract)).toBe('episodic');
    expect(lib.memoryClassFor('standard', 'active', contract)).toBe('semantic');
    expect(lib.memoryClassFor('decision', 'complete', contract)).toBe('episodic');
  });

  it('keeps the ceremony matrix and gate policy in the contract', () => {
    expect(contract.ceremony.gates).toEqual({
      autopilot: 'none',
      confirm: 'first_gateable',
      validate: 'all_gateable',
    });
    expect(lib.suggestCeremony('low', 'balanced', contract)).toBe('autopilot');
    expect(lib.suggestCeremony('low', 'controlled', contract)).toBe('confirm');
    expect(lib.suggestCeremony('medium', 'autonomous', contract)).toBe('autopilot');
    expect(lib.suggestCeremony('medium', 'balanced', contract)).toBe('confirm');
    expect(lib.suggestCeremony('medium', 'controlled', contract)).toBe('validate');
    expect(lib.suggestCeremony('high', 'autonomous', contract)).toBe('confirm');
    expect(lib.suggestCeremony('high', 'balanced', contract)).toBe('validate');
    expect(lib.suggestCeremony('high', 'controlled', contract)).toBe('validate');
  });

  it('maps complexity to recipe in the contract', () => {
    expect(contract.recipe.recommend_from_complexity).toEqual({
      low: 'simple',
      medium: 'default',
      high: 'ddd',
    });
    expect(lib.recommendRecipe('low', contract)).toBe('simple');
    expect(lib.recommendRecipe('medium', contract)).toBe('default');
    expect(lib.recommendRecipe('high', contract)).toBe('ddd');
    expect(lib.recommendRecipe(undefined, contract)).toBe('default');
  });

  it('declares typed error exit codes once', () => {
    expect(contract.errors).toEqual({ retryable: 1, terminal: 2, structural: 3 });
  });

  it('declares the integrity stale threshold and maintenance log once', () => {
    expect(contract.integrity.stale_active_after).toBe('P7D');
    expect(contract.integrity.maintenance_log).toBe('maintenance-log.md');
  });

  it('does not list status values in another references file', () => {
    const others = readdirSync(REFERENCES)
      .filter((name) => name.endsWith('.yaml') && name !== 'flow-contract.yaml')
      .map((name) => readFileSync(join(REFERENCES, name), 'utf8'));
    for (const text of others) {
      expect(text).not.toMatch(/^\s+values:\s*$/m);
      expect(text).not.toContain('in-progress');
    }
  });
});
