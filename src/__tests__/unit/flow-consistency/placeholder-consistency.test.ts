/**
 * Placeholder Consistency Tests
 *
 * Tests that templates use placeholder notation like {NNN}, {UUU}, {SSS}
 * instead of hardcoded values like 001, 002, etc.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import { ValidationIssues, readFlowFile } from './helpers';

const FLOWS_PATH = path.resolve(__dirname, '../../../../../flows/aidlc');

let templateFiles: string[] = [];

beforeAll(async () => {
  templateFiles = await glob(path.join(FLOWS_PATH, 'templates/**/*.md'));
});

describe('Flow Files - Placeholder Consistency', () => {

  describe('Templates should use placeholder notation', () => {
    const patterns = [
      { name: 'intent', regex: /intent:\s*['"]?00\d-/g, placeholder: '{NNN}-' },
      { name: 'unit', regex: /unit:\s*['"]?00\d-/g, placeholder: '{UUU}-' },
    ];

    for (const { name, regex, placeholder } of patterns) {
      it(`should use ${placeholder} not hardcoded 001- for ${name} in examples`, async () => {
        const issues = new ValidationIssues('Placeholder issues');

        for (const file of templateFiles) {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              // Skip if in Example section (concrete numbers are OK there)
              const beforeLines = lines.slice(Math.max(0, i - 20), i).join('\n');
              if (!beforeLines.includes('## Example')) {
                issues.addWithLine(file, i, `found hardcoded ${name} pattern, expected ${placeholder}`);
              }
            }
          }
        }

        issues.log();
        issues.assertNone(expect);
      });
    }

    it('should use {SSS} for story IDs in templates', async () => {
      const content = await readFlowFile('templates/inception/story-template.md');
      expect(content).toMatch(/\{SSS\}-\{title-slug\}/);
    });

    it('should use {bolt-id} for bolt IDs in templates', async () => {
      const content = await readFlowFile('templates/construction/bolt-template.md');
      expect(content).toMatch(/\{bolt-id\}/);
    });
  });

  describe('Skills should use consistent placeholder names', () => {
    it('should use {bolt-id} consistently', async () => {
      const content = await readFlowFile('skills/construction/bolt-start.md');
      expect(content).toMatch(/\{bolt-id\}/g);
    });

    it('should use {intent} not {intent-name} in path references', async () => {
      const content = await readFlowFile('skills/inception/units.md');
      expect(content).toMatch(/\{intent\}/);
    });
  });
});
