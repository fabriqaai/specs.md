/**
 * Render walkthrough from run data
 *
 * Generates walkthrough.md from run log and implementation data
 * with comprehensive validation and human/LLM-readable error messages.
 */

import { writeFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface WalkthroughData {
  runId: string;
  workItemId: string;
  workItemTitle: string;
  intentId: string;
  mode: string;
  summary: string;
  filesCreated: Array<{ path: string; purpose: string }>;
  filesModified: Array<{ path: string; changes: string }>;
  implementationDetails: Array<{ title: string; content: string }>;
  decisions: Array<{ decision: string; choice: string; rationale: string }>;
  verificationSteps: Array<{
    title: string;
    command?: string;
    description: string;
    expected?: string;
  }>;
  testsAdded: number;
  coverage: number;
  testStatus: string;
}

export interface RenderWalkthroughResult {
  success: boolean;
  walkthroughPath: string;
  warnings: string[];
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Creates a standardized FIRE error with context, issue, and guidance.
 *
 * Format: "FIRE Error: {context} - {issue}. {guidance}"
 *
 * This format is designed to be:
 * - Human readable: Clear what went wrong
 * - LLM readable: Structured for AI agents to parse and act on
 * - Actionable: Includes guidance on how to fix the issue
 */
function createFIREError(context: string, issue: string, guidance: string): Error {
  const message = `FIRE Error: ${context} - ${issue}. ${guidance}`;
  const error = new Error(message);
  error.name = 'FIREError';
  return error;
}

/**
 * Maps Node.js filesystem error codes to human-readable messages.
 */
function mapNodeErrorToMessage(err: NodeJS.ErrnoException): string {
  const errorMap: Record<string, string> = {
    ENOENT: 'File or directory does not exist',
    EACCES: 'Permission denied - check file/folder permissions',
    ENOSPC: 'Disk is full - free up space and try again',
    EROFS: 'Read-only file system - cannot write to this location',
    ENAMETOOLONG: 'File path is too long - use a shorter path',
    EMFILE: 'Too many open files - close some files and try again',
    EEXIST: 'File already exists',
    EISDIR: 'Expected a file but found a directory',
    ENOTDIR: 'Expected a directory but found a file',
  };

  return errorMap[err.code ?? ''] ?? `System error: ${err.message}`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates that a value is a non-empty string.
 * Returns the trimmed string or throws a clear error.
 */
function validateRequiredString(
  value: unknown,
  fieldName: string,
  context: string
): string {
  if (value === undefined || value === null) {
    throw createFIREError(
      context,
      `required field '${fieldName}' is missing`,
      `Ensure '${fieldName}' is provided in the walkthrough data.`
    );
  }

  if (typeof value !== 'string') {
    throw createFIREError(
      context,
      `field '${fieldName}' must be a string, but got ${typeof value}`,
      `Ensure '${fieldName}' is a string value, not ${typeof value}.`
    );
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw createFIREError(
      context,
      `required field '${fieldName}' is empty`,
      `Ensure '${fieldName}' contains a non-empty value.`
    );
  }

  return trimmed;
}

/**
 * Validates that a value is an array.
 * Returns the array or an empty array if null/undefined, with a warning.
 */
function validateArray<T>(
  value: unknown,
  fieldName: string,
  context: string,
  warnings: string[]
): T[] {
  if (value === undefined || value === null) {
    warnings.push(
      `Warning: '${fieldName}' was not provided, defaulting to empty array.`
    );
    return [];
  }

  if (!Array.isArray(value)) {
    throw createFIREError(
      context,
      `field '${fieldName}' must be an array, but got ${typeof value}`,
      `Ensure '${fieldName}' is an array. Current value type: ${typeof value}.`
    );
  }

  return value as T[];
}

/**
 * Validates and coerces a number with bounds checking.
 * Returns the number or a default if invalid.
 */
function validateNumber(
  value: unknown,
  fieldName: string,
  defaultValue: number,
  warnings: string[],
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null) {
    warnings.push(
      `Warning: '${fieldName}' was not provided, defaulting to ${defaultValue}.`
    );
    return defaultValue;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(num)) {
    warnings.push(
      `Warning: '${fieldName}' value '${value}' is not a valid number, defaulting to ${defaultValue}.`
    );
    return defaultValue;
  }

  if (min !== undefined && num < min) {
    warnings.push(
      `Warning: '${fieldName}' value ${num} is below minimum ${min}, clamping to ${min}.`
    );
    return min;
  }

  if (max !== undefined && num > max) {
    warnings.push(
      `Warning: '${fieldName}' value ${num} exceeds maximum ${max}, clamping to ${max}.`
    );
    return max;
  }

  return num;
}

/**
 * Validates that a path exists and is a directory.
 */
function validateDirectoryExists(
  path: string,
  pathDescription: string,
  context: string,
  guidance: string
): void {
  if (!existsSync(path)) {
    throw createFIREError(
      context,
      `${pathDescription} not found at '${path}'`,
      guidance
    );
  }

  try {
    const stat = statSync(path);
    if (!stat.isDirectory()) {
      throw createFIREError(
        context,
        `${pathDescription} exists but is not a directory at '${path}'`,
        `Expected a directory but found a file. ${guidance}`
      );
    }
  } catch (err) {
    if ((err as Error).name === 'FIREError') {
      throw err;
    }
    const nodeErr = err as NodeJS.ErrnoException;
    throw createFIREError(
      context,
      `cannot access ${pathDescription} at '${path}'`,
      mapNodeErrorToMessage(nodeErr)
    );
  }
}

// ============================================================================
// Markdown Utilities
// ============================================================================

/**
 * Escapes special characters in markdown table cells.
 * Handles pipes, newlines, and ensures content doesn't break table formatting.
 */
function escapeTableCell(content: string | undefined | null): string {
  if (content === undefined || content === null) {
    return '';
  }

  return String(content)
    .replace(/\|/g, '\\|') // Escape pipe characters
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\r/g, '') // Remove carriage returns
    .trim();
}

/**
 * Escapes backticks in inline code spans.
 */
function escapeInlineCode(content: string | undefined | null): string {
  if (content === undefined || content === null) {
    return '';
  }

  // If content contains backticks, we need to use double backticks
  const str = String(content);
  if (str.includes('`')) {
    return str.replace(/`/g, '\\`');
  }
  return str;
}

// ============================================================================
// Array Item Validators
// ============================================================================

interface FileEntry {
  path: string;
  purpose?: string;
  changes?: string;
}

interface DecisionEntry {
  decision: string;
  choice: string;
  rationale: string;
}

interface ImplementationDetail {
  title: string;
  content: string;
}

interface VerificationStep {
  title: string;
  command?: string;
  description: string;
  expected?: string;
}

function validateFileEntry(
  entry: unknown,
  index: number,
  fieldName: string,
  warnings: string[]
): FileEntry {
  if (!entry || typeof entry !== 'object') {
    warnings.push(
      `Warning: Invalid entry at index ${index} in '${fieldName}' - expected object, got ${typeof entry}. Skipping.`
    );
    return { path: '(invalid entry)' };
  }

  const obj = entry as Record<string, unknown>;
  const path =
    typeof obj.path === 'string' && obj.path.trim()
      ? obj.path.trim()
      : '(missing path)';

  if (path === '(missing path)') {
    warnings.push(
      `Warning: Entry at index ${index} in '${fieldName}' is missing 'path' property.`
    );
  }

  return {
    path,
    purpose: typeof obj.purpose === 'string' ? obj.purpose : undefined,
    changes: typeof obj.changes === 'string' ? obj.changes : undefined,
  };
}

function validateDecisionEntry(
  entry: unknown,
  index: number,
  warnings: string[]
): DecisionEntry {
  if (!entry || typeof entry !== 'object') {
    warnings.push(
      `Warning: Invalid decision at index ${index} - expected object, got ${typeof entry}. Using placeholder.`
    );
    return {
      decision: '(invalid)',
      choice: '(invalid)',
      rationale: '(invalid)',
    };
  }

  const obj = entry as Record<string, unknown>;
  return {
    decision:
      typeof obj.decision === 'string' ? obj.decision : '(missing decision)',
    choice: typeof obj.choice === 'string' ? obj.choice : '(missing choice)',
    rationale:
      typeof obj.rationale === 'string' ? obj.rationale : '(missing rationale)',
  };
}

function validateImplementationDetail(
  entry: unknown,
  index: number,
  warnings: string[]
): ImplementationDetail {
  if (!entry || typeof entry !== 'object') {
    warnings.push(
      `Warning: Invalid implementation detail at index ${index} - expected object. Using placeholder.`
    );
    return { title: '(invalid)', content: '(invalid)' };
  }

  const obj = entry as Record<string, unknown>;
  return {
    title: typeof obj.title === 'string' ? obj.title : `Detail ${index + 1}`,
    content:
      typeof obj.content === 'string' ? obj.content : '(no content provided)',
  };
}

function validateVerificationStep(
  entry: unknown,
  index: number,
  warnings: string[]
): VerificationStep {
  if (!entry || typeof entry !== 'object') {
    warnings.push(
      `Warning: Invalid verification step at index ${index} - expected object. Using placeholder.`
    );
    return { title: '(invalid)', description: '(invalid)' };
  }

  const obj = entry as Record<string, unknown>;
  return {
    title: typeof obj.title === 'string' ? obj.title : `Step ${index + 1}`,
    command: typeof obj.command === 'string' ? obj.command : undefined,
    description:
      typeof obj.description === 'string'
        ? obj.description
        : '(no description)',
    expected: typeof obj.expected === 'string' ? obj.expected : undefined,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Renders a walkthrough document from run data.
 *
 * @param rootPath - The project root path containing .specs-fire directory
 * @param data - The walkthrough data to render
 * @returns Result object with success status, file path, and any warnings
 *
 * @throws {Error} FIREError with clear message if validation fails or write fails
 *
 * @example
 * ```typescript
 * const result = renderWalkthrough('/path/to/project', {
 *   runId: 'run-001',
 *   workItemId: 'WI-001',
 *   // ... other fields
 * });
 *
 * if (result.warnings.length > 0) {
 *   console.log('Warnings:', result.warnings);
 * }
 * console.log('Walkthrough written to:', result.walkthroughPath);
 * ```
 */
export function renderWalkthrough(
  rootPath: string,
  data: WalkthroughData
): RenderWalkthroughResult {
  const context = 'Cannot generate walkthrough';
  const warnings: string[] = [];

  // =========================================================================
  // Input Validation: rootPath
  // =========================================================================

  if (rootPath === undefined || rootPath === null) {
    throw createFIREError(
      context,
      "rootPath parameter is required but was not provided",
      "Call renderWalkthrough with a valid project root path as the first argument."
    );
  }

  if (typeof rootPath !== 'string') {
    throw createFIREError(
      context,
      `rootPath must be a string, but got ${typeof rootPath}`,
      "Ensure rootPath is a string containing the absolute path to the project root."
    );
  }

  const trimmedRootPath = rootPath.trim();
  if (trimmedRootPath.length === 0) {
    throw createFIREError(
      context,
      "rootPath is an empty string",
      "Provide a non-empty path to the project root directory."
    );
  }

  // Validate rootPath exists
  validateDirectoryExists(
    trimmedRootPath,
    'project root',
    context,
    "Ensure the project root path exists and is accessible."
  );

  // =========================================================================
  // Input Validation: data object
  // =========================================================================

  if (data === undefined || data === null) {
    throw createFIREError(
      context,
      "data parameter is required but was not provided",
      "Call renderWalkthrough with walkthrough data as the second argument."
    );
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    throw createFIREError(
      context,
      `data must be an object, but got ${Array.isArray(data) ? 'array' : typeof data}`,
      "Ensure data is a WalkthroughData object with required fields: runId, workItemId, workItemTitle, intentId, mode, summary."
    );
  }

  // =========================================================================
  // Validate Required String Fields
  // =========================================================================

  const runId = validateRequiredString(data.runId, 'runId', context);
  const workItemId = validateRequiredString(data.workItemId, 'workItemId', context);
  const workItemTitle = validateRequiredString(data.workItemTitle, 'workItemTitle', context);
  const intentId = validateRequiredString(data.intentId, 'intentId', context);
  const mode = validateRequiredString(data.mode, 'mode', context);
  const summary = validateRequiredString(data.summary, 'summary', context);

  // testStatus can have a default
  let testStatus: string;
  if (
    data.testStatus === undefined ||
    data.testStatus === null ||
    (typeof data.testStatus === 'string' && data.testStatus.trim() === '')
  ) {
    warnings.push("Warning: 'testStatus' was not provided, defaulting to 'unknown'.");
    testStatus = 'unknown';
  } else {
    testStatus = String(data.testStatus);
  }

  // =========================================================================
  // Validate Array Fields
  // =========================================================================

  const rawFilesCreated = validateArray<unknown>(
    data.filesCreated,
    'filesCreated',
    context,
    warnings
  );
  const rawFilesModified = validateArray<unknown>(
    data.filesModified,
    'filesModified',
    context,
    warnings
  );
  const rawImplementationDetails = validateArray<unknown>(
    data.implementationDetails,
    'implementationDetails',
    context,
    warnings
  );
  const rawDecisions = validateArray<unknown>(
    data.decisions,
    'decisions',
    context,
    warnings
  );
  const rawVerificationSteps = validateArray<unknown>(
    data.verificationSteps,
    'verificationSteps',
    context,
    warnings
  );

  // =========================================================================
  // Validate Numeric Fields
  // =========================================================================

  const testsAdded = validateNumber(data.testsAdded, 'testsAdded', 0, warnings, 0);
  const coverage = validateNumber(data.coverage, 'coverage', 0, warnings, 0, 100);

  // =========================================================================
  // Validate Run Folder Exists
  // =========================================================================

  const specsFirePath = join(trimmedRootPath, '.specs-fire');
  validateDirectoryExists(
    specsFirePath,
    '.specs-fire directory',
    context,
    "Initialize FIRE in this project first. The .specs-fire directory should exist at the project root."
  );

  const runsPath = join(specsFirePath, 'runs');
  validateDirectoryExists(
    runsPath,
    'runs directory',
    context,
    "The runs directory should exist within .specs-fire. This is created when FIRE is initialized."
  );

  const runPath = join(runsPath, runId);
  validateDirectoryExists(
    runPath,
    `run folder for '${runId}'`,
    context,
    `Ensure the run '${runId}' was initialized with 'run-start' before generating walkthrough. The run folder should exist at: ${runPath}`
  );

  const walkthroughPath = join(runPath, 'walkthrough.md');

  // =========================================================================
  // Process and Validate Array Items
  // =========================================================================

  const filesCreated = rawFilesCreated.map((entry, i) =>
    validateFileEntry(entry, i, 'filesCreated', warnings)
  );

  const filesModified = rawFilesModified.map((entry, i) =>
    validateFileEntry(entry, i, 'filesModified', warnings)
  );

  const implementationDetails = rawImplementationDetails.map((entry, i) =>
    validateImplementationDetail(entry, i, warnings)
  );

  const decisions = rawDecisions.map((entry, i) =>
    validateDecisionEntry(entry, i, warnings)
  );

  const verificationSteps = rawVerificationSteps.map((entry, i) =>
    validateVerificationStep(entry, i, warnings)
  );

  // =========================================================================
  // Build Markdown Content
  // =========================================================================

  const timestamp = new Date().toISOString();

  // Build files created table
  const filesCreatedTable =
    filesCreated.length > 0
      ? filesCreated
          .map(
            (f) =>
              `| \`${escapeInlineCode(f.path)}\` | ${escapeTableCell(f.purpose ?? '')} |`
          )
          .join('\n')
      : '| (none) | |';

  // Build files modified table
  const filesModifiedTable =
    filesModified.length > 0
      ? filesModified
          .map(
            (f) =>
              `| \`${escapeInlineCode(f.path)}\` | ${escapeTableCell(f.changes ?? '')} |`
          )
          .join('\n')
      : '| (none) | |';

  // Build implementation details sections
  const implementationDetailsSection =
    implementationDetails.length > 0
      ? implementationDetails
          .map((d, i) => `### ${i + 1}. ${escapeTableCell(d.title)}\n\n${d.content}`)
          .join('\n\n')
      : '(No implementation details provided)';

  // Build decisions table
  const decisionsTable =
    decisions.length > 0
      ? decisions
          .map(
            (d) =>
              `| ${escapeTableCell(d.decision)} | ${escapeTableCell(d.choice)} | ${escapeTableCell(d.rationale)} |`
          )
          .join('\n')
      : '| (none) | | |';

  // Build verification steps
  const verificationStepsSection =
    verificationSteps.length > 0
      ? verificationSteps
          .map((s, i) => {
            let step = `${i + 1}. **${escapeTableCell(s.title)}**\n`;
            if (s.command) {
              step += `   \`\`\`bash\n   ${s.command}\n   \`\`\`\n`;
            }
            step += `   ${s.description}\n`;
            if (s.expected) {
              step += `   Expected: ${s.expected}\n`;
            }
            return step;
          })
          .join('\n')
      : '(No verification steps provided)';

  // Assemble the full walkthrough document
  const walkthrough = `---
run: ${runId}
work_item: ${workItemId}
intent: ${intentId}
generated: ${timestamp}
mode: ${mode}
---

# Implementation Walkthrough: ${workItemTitle}

## Summary

${summary}

## Files Changed

### Created

| File | Purpose |
|------|---------|
${filesCreatedTable}

### Modified

| File | Changes |
|------|---------|
${filesModifiedTable}

## Key Implementation Details

${implementationDetailsSection}

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
${decisionsTable}

## How to Verify

${verificationStepsSection}

## Test Coverage

- Tests added: ${testsAdded}
- Coverage: ${coverage}%
- Status: ${testStatus}

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run ${runId}*
`;

  // =========================================================================
  // Write File with Error Handling
  // =========================================================================

  try {
    writeFileSync(walkthroughPath, walkthrough, 'utf8');
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    throw createFIREError(
      'Failed to write walkthrough',
      `could not write to '${walkthroughPath}'`,
      `${mapNodeErrorToMessage(nodeErr)} Verify you have write permissions and sufficient disk space.`
    );
  }

  // =========================================================================
  // Return Success Result
  // =========================================================================

  return {
    success: true,
    walkthroughPath,
    warnings,
  };
}
