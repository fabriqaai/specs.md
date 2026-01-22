/**
 * Unit tests for render-walkthrough.ts
 *
 * Tests for rendering walkthrough documents including:
 * - Input validation (rootPath, data)
 * - Required field validation
 * - Array field validation with warnings
 * - Numeric field validation with bounds
 * - Markdown generation
 * - Error handling with clear messages
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Import the module under test
import {
  renderWalkthrough,
  WalkthroughData,
} from '../../../flows/fire/agents/builder/skills/walkthrough-generate/scripts/render-walkthrough';

describe('render-walkthrough', () => {
  let testRoot: string;
  let specsFireDir: string;
  let runsPath: string;
  let runPath: string;

  // Setup a fresh test directory before each test
  beforeEach(() => {
    testRoot = join(tmpdir(), `fire-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    specsFireDir = join(testRoot, '.specs-fire');
    runsPath = join(specsFireDir, 'runs');
    runPath = join(runsPath, 'run-001');

    // Create the directory structure
    mkdirSync(runPath, { recursive: true });
  });

  // Cleanup after each test
  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  /**
   * Helper to create valid walkthrough data
   */
  function validData(): WalkthroughData {
    return {
      runId: 'run-001',
      workItemId: 'WI-001',
      workItemTitle: 'Add login feature',
      intentId: 'INT-001',
      mode: 'autopilot',
      summary: 'Implemented login functionality with JWT authentication.',
      filesCreated: [
        { path: 'src/auth/login.ts', purpose: 'Login handler' },
      ],
      filesModified: [
        { path: 'src/routes.ts', changes: 'Added login route' },
      ],
      implementationDetails: [
        { title: 'Authentication Flow', content: 'Uses JWT tokens for session management.' },
      ],
      decisions: [
        { decision: 'Token storage', choice: 'HTTP-only cookies', rationale: 'More secure than localStorage' },
      ],
      verificationSteps: [
        { title: 'Test login', command: 'npm test', description: 'Run the test suite', expected: 'All tests pass' },
      ],
      testsAdded: 3,
      coverage: 75,
      testStatus: 'passing',
    };
  }

  // ===========================================================================
  // Input Validation Tests
  // ===========================================================================

  describe('rootPath validation', () => {
    it('should throw FIREError when rootPath is null', () => {
      expect(() => renderWalkthrough(null as unknown as string, validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath is undefined', () => {
      expect(() => renderWalkthrough(undefined as unknown as string, validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath is not a string', () => {
      expect(() => renderWalkthrough(123 as unknown as string, validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath is empty string', () => {
      expect(() => renderWalkthrough('', validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath is whitespace only', () => {
      expect(() => renderWalkthrough('   ', validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath does not exist', () => {
      expect(() => renderWalkthrough('/nonexistent/path/xyz', validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when rootPath is a file, not directory', () => {
      const filePath = join(testRoot, 'file.txt');
      writeFileSync(filePath, 'content');

      expect(() => renderWalkthrough(filePath, validData()))
        .toThrow('FIRE Error');
    });
  });

  describe('data validation', () => {
    it('should throw FIREError when data is null', () => {
      expect(() => renderWalkthrough(testRoot, null as unknown as WalkthroughData))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when data is undefined', () => {
      expect(() => renderWalkthrough(testRoot, undefined as unknown as WalkthroughData))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when data is not an object', () => {
      expect(() => renderWalkthrough(testRoot, 'string' as unknown as WalkthroughData))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when data is an array', () => {
      expect(() => renderWalkthrough(testRoot, [] as unknown as WalkthroughData))
        .toThrow('FIRE Error');
    });
  });

  // ===========================================================================
  // Required String Field Validation Tests
  // ===========================================================================

  describe('required string field validation', () => {
    it('should throw FIREError when runId is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).runId;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when runId is empty', () => {
      const data = { ...validData(), runId: '' };

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when runId is not a string', () => {
      const data = { ...validData(), runId: 123 as unknown as string };

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when workItemId is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).workItemId;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when workItemTitle is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).workItemTitle;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when intentId is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).intentId;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when mode is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).mode;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when summary is missing', () => {
      const data = validData();
      delete (data as Record<string, unknown>).summary;

      expect(() => renderWalkthrough(testRoot, data))
        .toThrow('FIRE Error');
    });
  });

  // ===========================================================================
  // Project Structure Validation Tests
  // ===========================================================================

  describe('project structure validation', () => {
    it('should throw FIREError when .specs-fire directory does not exist', () => {
      rmSync(specsFireDir, { recursive: true, force: true });

      expect(() => renderWalkthrough(testRoot, validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when runs directory does not exist', () => {
      rmSync(runsPath, { recursive: true, force: true });

      expect(() => renderWalkthrough(testRoot, validData()))
        .toThrow('FIRE Error');
    });

    it('should throw FIREError when run folder does not exist', () => {
      rmSync(runPath, { recursive: true, force: true });

      expect(() => renderWalkthrough(testRoot, validData()))
        .toThrow('FIRE Error');
    });
  });

  // ===========================================================================
  // Success Case Tests
  // ===========================================================================

  describe('successful rendering', () => {
    it('should return success result', () => {
      const result = renderWalkthrough(testRoot, validData());

      expect(result.success).toBe(true);
    });

    it('should return correct walkthrough path', () => {
      const result = renderWalkthrough(testRoot, validData());

      expect(result.walkthroughPath).toBe(join(runPath, 'walkthrough.md'));
    });

    it('should create walkthrough.md file', () => {
      renderWalkthrough(testRoot, validData());

      expect(existsSync(join(runPath, 'walkthrough.md'))).toBe(true);
    });

    it('should include frontmatter in walkthrough', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('---');
      expect(content).toContain('run: run-001');
      expect(content).toContain('work_item: WI-001');
      expect(content).toContain('intent: INT-001');
      expect(content).toContain('mode: autopilot');
    });

    it('should include title in walkthrough', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('# Implementation Walkthrough: Add login feature');
    });

    it('should include summary in walkthrough', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('## Summary');
      expect(content).toContain('Implemented login functionality with JWT authentication.');
    });

    it('should include files created table', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('### Created');
      expect(content).toContain('| File | Purpose |');
      expect(content).toContain('`src/auth/login.ts`');
      expect(content).toContain('Login handler');
    });

    it('should include files modified table', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('### Modified');
      expect(content).toContain('| File | Changes |');
      expect(content).toContain('`src/routes.ts`');
      expect(content).toContain('Added login route');
    });

    it('should include implementation details', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('## Key Implementation Details');
      expect(content).toContain('### 1. Authentication Flow');
      expect(content).toContain('Uses JWT tokens for session management.');
    });

    it('should include decisions table', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('## Decisions Made');
      expect(content).toContain('| Decision | Choice | Rationale |');
      expect(content).toContain('Token storage');
      expect(content).toContain('HTTP-only cookies');
      expect(content).toContain('More secure than localStorage');
    });

    it('should include verification steps', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('## How to Verify');
      expect(content).toContain('**Test login**');
      expect(content).toContain('```bash');
      expect(content).toContain('npm test');
      expect(content).toContain('Run the test suite');
      expect(content).toContain('Expected: All tests pass');
    });

    it('should include test coverage section', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('## Test Coverage');
      expect(content).toContain('Tests added: 3');
      expect(content).toContain('Coverage: 75%');
      expect(content).toContain('Status: passing');
    });

    it('should include generated timestamp', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('generated:');
    });

    it('should include footer', () => {
      renderWalkthrough(testRoot, validData());

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('*Generated by specs.md - fabriqa.ai FIRE Flow Run run-001*');
    });
  });

  // ===========================================================================
  // Warning Generation Tests
  // ===========================================================================

  describe('warning generation', () => {
    it('should generate warning when filesCreated is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).filesCreated;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('filesCreated'))).toBe(true);
    });

    it('should generate warning when filesModified is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).filesModified;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('filesModified'))).toBe(true);
    });

    it('should generate warning when implementationDetails is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).implementationDetails;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('implementationDetails'))).toBe(true);
    });

    it('should generate warning when decisions is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).decisions;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('decisions'))).toBe(true);
    });

    it('should generate warning when verificationSteps is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).verificationSteps;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('verificationSteps'))).toBe(true);
    });

    it('should generate warning when testsAdded is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).testsAdded;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('testsAdded'))).toBe(true);
    });

    it('should generate warning when coverage is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).coverage;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('coverage'))).toBe(true);
    });

    it('should generate warning when testStatus is not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).testStatus;

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('testStatus'))).toBe(true);
    });

    it('should generate warning when coverage exceeds 100', () => {
      const data = { ...validData(), coverage: 150 };

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('coverage') && w.includes('exceeds maximum'))).toBe(true);
    });

    it('should clamp coverage to 100 when it exceeds', () => {
      const data = { ...validData(), coverage: 150 };

      renderWalkthrough(testRoot, data);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('Coverage: 100%');
    });

    it('should generate warning when coverage is negative', () => {
      const data = { ...validData(), coverage: -10 };

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('coverage') && w.includes('below minimum'))).toBe(true);
    });

    it('should clamp coverage to 0 when negative', () => {
      const data = { ...validData(), coverage: -10 };

      renderWalkthrough(testRoot, data);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('Coverage: 0%');
    });

    it('should generate warning when filesCreated entry is invalid', () => {
      const data = {
        ...validData(),
        filesCreated: [{ invalid: 'entry' } as unknown as { path: string; purpose: string }],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('filesCreated') && w.includes('path'))).toBe(true);
    });

    it('should generate warning when decision entry is invalid', () => {
      const data = {
        ...validData(),
        decisions: ['not an object' as unknown as { decision: string; choice: string; rationale: string }],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.warnings.some(w => w.includes('decision') && w.includes('expected object'))).toBe(true);
    });
  });

  // ===========================================================================
  // Edge Case Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle empty arrays gracefully', () => {
      const data: WalkthroughData = {
        runId: 'run-001',
        workItemId: 'WI-001',
        workItemTitle: 'Test',
        intentId: 'INT-001',
        mode: 'autopilot',
        summary: 'Test summary',
        filesCreated: [],
        filesModified: [],
        implementationDetails: [],
        decisions: [],
        verificationSteps: [],
        testsAdded: 0,
        coverage: 0,
        testStatus: 'none',
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('(none)');
      expect(content).toContain('(No implementation details provided)');
      expect(content).toContain('(No verification steps provided)');
    });

    it('should escape pipe characters in table cells', () => {
      const data = {
        ...validData(),
        decisions: [
          { decision: 'Choice | A or B', choice: 'A | B', rationale: 'Because | reasons' },
        ],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      // Pipes should be escaped
      expect(content).toContain('\\|');
    });

    it('should handle newlines in table cells', () => {
      const data = {
        ...validData(),
        filesCreated: [
          { path: 'src/file.ts', purpose: 'Line 1\nLine 2' },
        ],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      // Newlines should be replaced with spaces
      expect(content).toContain('Line 1 Line 2');
      expect(content).not.toContain('Line 1\nLine 2');
    });

    it('should handle verification step without command', () => {
      const data = {
        ...validData(),
        verificationSteps: [
          { title: 'Manual check', description: 'Verify manually', expected: 'Works' },
        ],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('**Manual check**');
      expect(content).toContain('Verify manually');
      expect(content).not.toContain('```bash');
    });

    it('should handle verification step without expected', () => {
      const data = {
        ...validData(),
        verificationSteps: [
          { title: 'Run test', command: 'npm test', description: 'Run tests' },
        ],
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('```bash');
      expect(content).toContain('npm test');
      expect(content).not.toContain('Expected:');
    });

    it('should handle non-number testsAdded with warning', () => {
      const data = {
        ...validData(),
        testsAdded: 'five' as unknown as number,
      };

      const result = renderWalkthrough(testRoot, data);

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.includes('testsAdded') && w.includes('not a valid number'))).toBe(true);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('Tests added: 0');
    });

    it('should trim whitespace from string fields', () => {
      const data = {
        ...validData(),
        workItemTitle: '  Trimmed Title  ',
      };

      renderWalkthrough(testRoot, data);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('# Implementation Walkthrough: Trimmed Title');
    });

    it('should default testStatus to unknown when not provided', () => {
      const data = validData();
      delete (data as Record<string, unknown>).testStatus;

      renderWalkthrough(testRoot, data);

      const content = readFileSync(join(runPath, 'walkthrough.md'), 'utf8');
      expect(content).toContain('Status: unknown');
    });
  });
});
