/**
 * Flow contract is the single source for locations, identifiers, status, and ceremony.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const REFERENCES = join(
  __dirname,
  '../../../../plugins/specsmd/skills/flow-runtime/references'
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require(join(__dirname, '../../../node_modules/js-yaml'));

describe('flow contract', () => {
  const contract = yaml.load(readFileSync(join(REFERENCES, 'flow-contract.yaml'), 'utf8'));

  it('answers location, identifier pattern, state fields, allowed values, and memory class from the contract alone', () => {
    expect(contract.artifact_root).toBe('docs/specsmd');
    expect(contract.memory_bank).toBe('docs/specsmd');
    expect(contract.state.central_file).toBe(false);
    expect(contract.state.writers).toBe('skills');
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
    expect(contract.artifact_types.bolt.fields).toContain('updated');

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
  });

  it('keeps the ceremony matrix and gate policy in the contract', () => {
    expect(contract.ceremony.gates).toEqual({
      autopilot: 'none',
      confirm: 'first_gateable',
      validate: 'all_gateable',
    });
    expect(contract.ceremony.matrix.low.balanced).toBe('autopilot');
    expect(contract.ceremony.matrix.medium.balanced).toBe('confirm');
    expect(contract.ceremony.matrix.high.balanced).toBe('validate');
  });

  it('maps complexity to recipe in the contract', () => {
    expect(contract.recipe.recommend_from_complexity).toEqual({
      low: 'simple',
      medium: 'default',
      high: 'ddd',
    });
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
