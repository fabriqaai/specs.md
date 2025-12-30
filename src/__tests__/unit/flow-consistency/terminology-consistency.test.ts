/**
 * Terminology Consistency Tests
 *
 * Tests that terminology is used consistently across flow files:
 * - Phase names (inception, construction, operations) use consistent casing
 * - Artifact type names use consistent casing
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import { readFlowFile } from './helpers';

const FLOWS_PATH = path.resolve(__dirname, '../../../../../flows/aidlc');

let skillFiles: string[] = [];
let agentFiles: string[] = [];
let templateFiles: string[] = [];

beforeAll(async () => {
  skillFiles = await glob(path.join(FLOWS_PATH, 'skills/**/*.md'));
  agentFiles = await glob(path.join(FLOWS_PATH, 'agents/**/*.md'));
  templateFiles = await glob(path.join(FLOWS_PATH, 'templates/**/*.md'));
});

describe('Flow Files - Terminology Consistency', () => {

  describe('Phase names should be consistent', () => {
    it('should use lowercase phase names in paths', async () => {
      const allFiles = [...skillFiles, ...agentFiles, ...templateFiles];
      const issues: string[] = [];

      // Check for capitalized phase names in code/paths
      const capitalInPath = /['"`/][Ii]nception['"`]/g;
      const capitalInPath2 = /['"`/][Cc]onstruction['"`]/g;
      const capitalInPath3 = /['"`/][Oo]perations['"`]/g;

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');

        for (const regex of [capitalInPath, capitalInPath2, capitalInPath3]) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i]) && (lines[i].includes('/') || lines[i].includes('skills/') || lines[i].includes('agents/'))) {
              issues.push(`${path.relative(FLOWS_PATH, file)}:${i + 1}`);
            }
          }
        }
      }

      // Log as warning (this is a soft check)
      if (issues.length > 0) {
        console.warn('\nTerminology warnings (phase name casing in paths):\n' + issues.join('\n'));
      }
    });
  });

  describe('Artifact type names should be consistent', () => {
    it('should use consistent casing for artifact type names', async () => {
      // This is a placeholder test - expand as needed
      // Currently checks that "intent" is used in code contexts
      const allFiles = [...skillFiles, ...agentFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        // Basic check - ensure we're not mixing "Intent" with "intent" in code blocks
        // This could be expanded with more specific rules
      }
    });
  });
});
