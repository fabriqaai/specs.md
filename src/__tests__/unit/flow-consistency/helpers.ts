/**
 * Shared utilities for flow consistency tests
 */

import * as path from 'path';
import * as fs from 'fs-extra';

export const ROOT_DIR = path.resolve(__dirname, '../../..');
export const FLOWS_PATH = path.join(ROOT_DIR, 'flows/aidlc');

/**
 * Find all lines matching a pattern in a file, excluding certain sections
 */
export function findLinesExcluding(
  content: string,
  pattern: RegExp,
  excludeSectionHeading: string
): number[] {
  const lines = content.split('\n');
  const matches: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      // Check if we're in an excluded section
      const beforeLines = lines.slice(Math.max(0, i - 20), i).join('\n');
      if (!beforeLines.includes(excludeSectionHeading)) {
        matches.push(i);
      }
    }
  }

  return matches;
}

/**
 * Check if YAML content contains placeholders (not meant to be parsed)
 */
export function hasPlaceholders(yamlContent: string): boolean {
  return /\{[A-Z]+\}|must|should|could|null|\*{2}/.test(yamlContent);
}

/**
 * Collect validation issues across multiple files
 */
export class ValidationIssues {
  private issues: string[] = [];
  private _type: string;

  constructor(type: string) {
    this._type = type;
  }

  add(file: string, message: string): void {
    const relPath = path.relative(ROOT_DIR, file);
    this.issues.push(`${relPath}: ${message}`);
  }

  addWithLine(file: string, lineNumber: number, message: string): void {
    const relPath = path.relative(ROOT_DIR, file);
    this.issues.push(`${relPath}:${lineNumber + 1}: ${message}`);
  }

  log(): void {
    if (this.issues.length > 0) {
      console.error(`\n${this._type}:\n${this.issues.join('\n')}`);
    }
  }

  assertNone(expect: jest.Expect): void {
    expect(this.issues).toHaveLength(0);
  }
}

/**
 * Read file content relative to FLOWS_PATH
 */
export async function readFlowFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(FLOWS_PATH, relativePath), 'utf8');
}
