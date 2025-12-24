import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const FLOWS_PATH = path.resolve(__dirname, '../../../flows/aidlc');

/**
 * Bolt-Type Agnostic Architecture Test
 *
 * Purpose: Ensure that bolt-start.md, construction-agent.md, and other generic
 * construction skills do NOT contain bolt-type-specific terminology.
 *
 * The Construction Agent should be bolt-type agnostic - it reads stages from
 * the bolt type definition file and executes them without hardcoded knowledge
 * of specific bolt types like DDD, BDD, or TDD.
 *
 * Violations:
 * - construction-agent.md knowing about "domain model" or "technical design"
 * - bolt-start.md referencing DDD-specific stages or artifacts
 * - Any generic construction skill mentioning bolt-type-specific concepts
 */

// Terms that indicate DDD-specific knowledge (should NOT appear in generic files)
const DDD_SPECIFIC_TERMS = [
  // DDD Stages and Artifacts (specific names)
  /domain\s+model/i,
  /technical\s+design/i,
  /ddd-01/i,
  /ddd-02/i,
  /ddd-03/i,

  // DDD-specific stage references (numbered stages with DDD names)
  /stage\s*[12].*domain/i,
  /stage\s*[12].*model/i,
  /stage\s*2.*design/i,
  /after.*domain.*model/i,
  /after.*technical.*design/i,
  /completing.*domain.*model/i,
  /completing.*technical.*design/i,

  // DDD-specific artifact patterns in generic context
  /entity:\s*\{.*name.*\}/i,
  /value\s+objects:\s*\{.*list.*\}/i,
];

// Terms that indicate BDD-specific knowledge
const BDD_SPECIFIC_TERMS = [
  /feature\s+file/i,
  /gherkin/i,
  /cucumber/i,
  /step\s+definition/i,
];

// Terms that indicate TDD-specific knowledge
const TDD_SPECIFIC_TERMS = [
  /red.*green.*refactor/i,
  /test.*first/i,
];

// Terms that assume a specific workflow (e.g., design→code→tests)
// These should NOT appear in generic construction skills
const WORKFLOW_SPECIFIC_TERMS = [
  // Hardcoded checkpoint names
  /design\s+review/i,
  /code\s+review/i,

  // Hardcoded stage workflow
  /code\s*\+\s*tests/i,
  /generate.*code/i,
  /generate.*tests/i,
  /implementation\s+code/i,

  // Test-specific outcomes (not all bolts produce tests)
  /unit\s+tests?\s+(pass|fail)/i,
  /tests?\s+pass/i,
  /test\s+results/i,
  /test\s+validation/i,
  /all\s+tests/i,

  // Auto-validation assumptions
  /auto-validation/i,
  /skip.*code\s+review/i,
];

// Files that MUST be bolt-type agnostic
const AGNOSTIC_FILES = [
  'skills/construction/bolt-start.md',
  'skills/construction/bolt-list.md',
  'skills/construction/bolt-status.md',
  'skills/construction/bolt-replan.md',
  'agents/construction-agent.md',
];

describe('Bolt-Type Agnostic Architecture', () => {
  describe('Generic Construction Files', () => {
    AGNOSTIC_FILES.forEach((relativePath) => {
      const filePath = path.join(FLOWS_PATH, relativePath);

      describe(relativePath, () => {
        let content: string;
        let fileExists: boolean;

        beforeAll(() => {
          fileExists = fs.existsSync(filePath);
          if (fileExists) {
            content = fs.readFileSync(filePath, 'utf-8');
          }
        });

        it('should exist', () => {
          expect(fileExists).toBe(true);
        });

        it('should NOT contain DDD-specific terminology', () => {
          if (!fileExists) return;

          const violations: string[] = [];

          DDD_SPECIFIC_TERMS.forEach((pattern) => {
            const matches = content.match(new RegExp(pattern, 'gi'));
            if (matches) {
              matches.forEach((match) => {
                // Find line number for better error messages
                const lines = content.split('\n');
                const lineNum = lines.findIndex((line) =>
                  new RegExp(pattern, 'i').test(line)
                );
                violations.push(
                  `Line ${lineNum + 1}: Found DDD-specific term "${match}" (pattern: ${pattern})`
                );
              });
            }
          });

          if (violations.length > 0) {
            throw new Error(
              `${relativePath} contains DDD-specific terminology:\n${violations.join('\n')}\n\n` +
                'Construction skills must be bolt-type agnostic. ' +
                'Move bolt-type-specific logic to the bolt type definition file.'
            );
          }
        });

        it('should NOT contain BDD-specific terminology', () => {
          if (!fileExists) return;

          const violations: string[] = [];

          BDD_SPECIFIC_TERMS.forEach((pattern) => {
            const matches = content.match(new RegExp(pattern, 'gi'));
            if (matches) {
              violations.push(`Found BDD-specific term: ${matches.join(', ')}`);
            }
          });

          expect(violations).toEqual([]);
        });

        it('should NOT contain TDD-specific terminology', () => {
          if (!fileExists) return;

          const violations: string[] = [];

          TDD_SPECIFIC_TERMS.forEach((pattern) => {
            const matches = content.match(new RegExp(pattern, 'gi'));
            if (matches) {
              violations.push(`Found TDD-specific term: ${matches.join(', ')}`);
            }
          });

          expect(violations).toEqual([]);
        });

        it('should NOT contain hardcoded workflow assumptions', () => {
          if (!fileExists) return;

          const violations: string[] = [];

          WORKFLOW_SPECIFIC_TERMS.forEach((pattern) => {
            const matches = content.match(new RegExp(pattern, 'gi'));
            if (matches) {
              matches.forEach((match) => {
                const lines = content.split('\n');
                const lineNum = lines.findIndex((line) =>
                  new RegExp(pattern, 'i').test(line)
                );
                violations.push(
                  `Line ${lineNum + 1}: Found workflow assumption "${match}" (pattern: ${pattern})`
                );
              });
            }
          });

          if (violations.length > 0) {
            throw new Error(
              `${relativePath} contains hardcoded workflow assumptions:\n${violations.join('\n')}\n\n` +
                'Generic construction skills must not assume a specific workflow. ' +
                'A marketing research bolt has no "design review" or "code + tests" stages.'
            );
          }
        });

        it('should reference bolt type definition for stages', () => {
          if (!fileExists) return;

          // Generic construction files should reference loading bolt type
          const referencessBoltType =
            content.includes('bolt_type') ||
            content.includes('bolt type') ||
            content.includes('bolt-type');

          expect(referencessBoltType).toBe(true);
        });
      });
    });
  });

  describe('Bolt Type Definition Files', () => {
    describe('DDD Construction Bolt', () => {
      const filePath = path.join(
        FLOWS_PATH,
        'templates/construction/bolt-types/ddd-construction-bolt.md'
      );
      let content: string;
      let fileExists: boolean;

      beforeAll(() => {
        fileExists = fs.existsSync(filePath);
        if (fileExists) {
          content = fs.readFileSync(filePath, 'utf-8');
        }
      });

      it('should exist', () => {
        expect(fileExists).toBe(true);
      });

      it('SHOULD contain DDD-specific terminology (it defines them)', () => {
        if (!fileExists) return;

        // DDD bolt type definition SHOULD contain these terms
        expect(content).toMatch(/domain\s+model/i);
        expect(content).toMatch(/technical\s+design/i);
        expect(content).toMatch(/ddd-01/i);
        expect(content).toMatch(/ddd-02/i);
      });

      it('should define stages that construction-agent will read', () => {
        if (!fileExists) return;

        expect(content).toMatch(/stages/i);
        expect(content).toMatch(/stage\s*1/i);
        expect(content).toMatch(/stage\s*2/i);
      });
    });
  });

  describe('Architecture Principle', () => {
    it('documents the bolt-type agnostic principle', () => {
      // This test documents the architectural principle
      const principle = `
        ARCHITECTURAL PRINCIPLE: Bolt-Type Agnosticism

        The Construction Agent and its skills (bolt-start, bolt-list, etc.)
        MUST NOT contain hardcoded knowledge of specific bolt types.

        Flow:
        1. bolt-start reads bolt.md to get bolt_type field
        2. bolt-start loads the bolt type definition from templates/construction/bolt-types/
        3. The bolt type definition specifies stages, artifacts, and constraints
        4. bolt-start executes stages as defined, without knowing their names

        This allows:
        - Adding new bolt types (BDD, TDD) without modifying construction skills
        - Each bolt type to define its own workflow
        - Clean separation of concerns
      `;

      expect(principle).toBeTruthy();
    });
  });
});
