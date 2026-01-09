/**
 * Code Examples Validity Tests
 *
 * Tests that code examples in templates are syntactically valid:
 * - YAML code blocks parse correctly
 * - Bash command examples are syntactically plausible
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { ValidationIssues, hasPlaceholders, readFlowFile } from './helpers';

const FLOWS_PATH = path.resolve(__dirname, '../../../../../flows/aidlc');

let templateFiles: string[] = [];

beforeAll(async () => {
  templateFiles = await glob(path.join(FLOWS_PATH, 'templates/**/*.md'));
});

describe('Flow Files - Code Example Validity', () => {

  describe('YAML code blocks should be valid', () => {
    it('should parse all YAML blocks in templates', async () => {
      const issues = new ValidationIssues('YAML validation errors');
      const yamlRegex = /```yaml\n([\s\S]*?)```/g;

      for (const file of templateFiles) {
        const content = await fs.readFile(file, 'utf8');
        let match;

        while ((match = yamlRegex.exec(content)) !== null) {
          const yamlContent = match[1];

          // Skip teaching examples with placeholders
          if (hasPlaceholders(yamlContent)) continue;

          // Skip bolt-type files (valid multi-document YAML examples)
          if (file.includes('/bolt-types/')) continue;

          try {
            yaml.load(yamlContent);
          } catch (error) {
            issues.add(file, `invalid YAML - ${(error as Error).message}`);
          }
        }
      }

      issues.log();
      issues.assertNone(expect);
    });

    it('should parse YAML frontmatter examples in templates', async () => {
      const issues = new ValidationIssues('YAML frontmatter errors');

      for (const file of templateFiles) {
        // Skip teaching examples and special formatting files
        if (file.includes('-template.md') || file.includes('.guide.md') || file.includes('/bolt-types/')) {
          continue;
        }

        const content = await fs.readFile(file, 'utf8');
        const frontmatterRegex = /---\n([\s\S]*?)---/g;
        let match;

        while ((match = frontmatterRegex.exec(content)) !== null) {
          const yamlContent = match[1];

          if (hasPlaceholders(yamlContent)) continue;

          try {
            yaml.load(yamlContent);
          } catch (error) {
            issues.add(file, `invalid YAML frontmatter - ${(error as Error).message}`);
          }
        }
      }

      issues.log();
      issues.assertNone(expect);
    });
  });

  describe('Bash command examples should be syntactically plausible', () => {
    it('should have valid node command syntax', async () => {
      const content = await readFlowFile('skills/construction/bolt-start.md');
      expect(content).toMatch(/node\s+\.specsmd\/aidlc\/scripts\/bolt-complete\.js/);
    });
  });
});
