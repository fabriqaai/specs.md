/**
 * Simple YAML config validator
 * Validates required keys and structure without strict schema
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface YamlSchema {
  name: string;
  description?: string;
  required_keys: string[];
  nested_required?: Record<string, string[]>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  file?: string;
}

/**
 * Check if an object has a key (supports dot notation)
 */
function hasKey(obj: Record<string, unknown>, key: string): boolean {
  const parts = key.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    if (!(part in (current as Record<string, unknown>))) {
      return false;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return true;
}

/**
 * Validate YAML content against a schema
 */
export function validateYaml(
  content: Record<string, unknown>,
  schema: YamlSchema,
  fileName?: string
): ValidationResult {
  const errors: string[] = [];
  const prefix = fileName ? `${fileName}: ` : '';

  // Check required keys
  for (const key of schema.required_keys) {
    if (!hasKey(content, key)) {
      errors.push(`${prefix}Missing required key "${key}"`);
    }
  }

  // Check nested required keys
  if (schema.nested_required) {
    for (const [parent, children] of Object.entries(schema.nested_required)) {
      if (hasKey(content, parent)) {
        for (const child of children) {
          const fullKey = `${parent}.${child}`;
          if (!hasKey(content, fullKey)) {
            errors.push(`${prefix}Missing required key "${fullKey}"`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    file: fileName,
  };
}

/**
 * Validate a YAML file against a schema
 */
export function validateYamlFile(
  filePath: string,
  schema: YamlSchema
): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(content) as Record<string, unknown>;
  return validateYaml(parsed, schema, filePath);
}

/**
 * Load a schema from YAML file
 */
export function loadYamlSchema(schemaPath: string): YamlSchema {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  return yaml.load(content) as YamlSchema;
}
