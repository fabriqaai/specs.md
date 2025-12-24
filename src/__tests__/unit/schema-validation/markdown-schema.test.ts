import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import { loadSchema, validateFiles } from '../../../lib/markdown-validator';

const FLOWS_PATH = path.resolve(__dirname, '../../../flows/aidlc');
const SCHEMAS_PATH = path.resolve(__dirname, '../../schemas');

describe('Flow Files Schema Validation', () => {
  describe('Skill Files', () => {
    let files: string[] = [];
    const schema = loadSchema(path.join(SCHEMAS_PATH, 'skill.schema.yaml'));

    beforeAll(async () => {
      files = await glob(path.join(FLOWS_PATH, 'skills/**/*.md'));
    });

    it('should find skill files', () => {
      expect(files.length).toBeGreaterThan(0);
    });

    it('should validate against schema', () => {
      const { summary } = validateFiles(files, schema);

      if (!summary.valid) {
        console.error('Skill file errors:\n' + summary.errors.join('\n'));
      }

      expect(summary.valid).toBe(true);
    });
  });

  describe('Agent Files', () => {
    let files: string[] = [];
    const schema = loadSchema(path.join(SCHEMAS_PATH, 'agent.schema.yaml'));

    beforeAll(async () => {
      files = await glob(path.join(FLOWS_PATH, 'agents/*.md'));
    });

    it('should find agent files', () => {
      expect(files.length).toBeGreaterThan(0);
    });

    it('should validate against schema', () => {
      const { summary } = validateFiles(files, schema);

      if (!summary.valid) {
        console.error('Agent file errors:\n' + summary.errors.join('\n'));
      }

      expect(summary.valid).toBe(true);
    });
  });
});
