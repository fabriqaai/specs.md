import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { loadYamlSchema, validateYamlFile } from '../../../lib/yaml-validator';

const SCHEMAS_PATH = path.resolve(__dirname, '../../schemas');
const FLOWS_PATH = path.resolve(__dirname, '../../../flows/aidlc');

describe('YAML Config Schema Validation', () => {
  describe('memory-bank.yaml', () => {
    const schema = loadYamlSchema(path.join(SCHEMAS_PATH, 'memory-bank.schema.yaml'));
    const configPath = path.join(FLOWS_PATH, 'memory-bank.yaml');

    it('should validate successfully', () => {
      const result = validateYamlFile(configPath, schema);

      if (!result.valid) {
        console.error('memory-bank.yaml errors:', result.errors);
      }

      expect(result.valid).toBe(true);
    });
  });

  describe('context-config.yaml', () => {
    const schema = loadYamlSchema(path.join(SCHEMAS_PATH, 'context-config.schema.yaml'));
    const configPath = path.join(FLOWS_PATH, 'context-config.yaml');

    it('should validate successfully', () => {
      const result = validateYamlFile(configPath, schema);

      if (!result.valid) {
        console.error('context-config.yaml errors:', result.errors);
      }

      expect(result.valid).toBe(true);
    });
  });

  describe('catalog.yaml', () => {
    const schema = loadYamlSchema(path.join(SCHEMAS_PATH, 'catalog.schema.yaml'));
    const configPath = path.join(FLOWS_PATH, 'templates/standards/catalog.yaml');

    it('should validate successfully', () => {
      const result = validateYamlFile(configPath, schema);

      if (!result.valid) {
        console.error('catalog.yaml errors:', result.errors);
      }

      expect(result.valid).toBe(true);
    });
  });
});
