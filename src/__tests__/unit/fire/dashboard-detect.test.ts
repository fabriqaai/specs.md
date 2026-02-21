import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { detectFlow, detectAvailableFlows } = require('../../../lib/dashboard/flow-detect');

describe('dashboard flow detection', () => {
  let workspacePath: string;

  beforeEach(() => {
    workspacePath = join(tmpdir(), `dashboard-detect-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workspacePath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(workspacePath)) {
      rmSync(workspacePath, { recursive: true, force: true });
    }
  });

  it('auto-detects FIRE first when multiple flow folders exist', () => {
    mkdirSync(join(workspacePath, '.specs-fire'), { recursive: true });
    mkdirSync(join(workspacePath, 'memory-bank'), { recursive: true });
    mkdirSync(join(workspacePath, 'specs'), { recursive: true });

    const result = detectFlow(workspacePath);

    expect(result.flow).toBe('fire');
    expect(result.detected).toBe(true);
    expect(result.source).toBe('auto');
    expect(result.availableFlows).toEqual(['fire', 'aidlc', 'simple']);
  });

  it('returns selected flow with warning when explicit flow marker is missing', () => {
    const result = detectFlow(workspacePath, 'fire');

    expect(result.flow).toBe('fire');
    expect(result.detected).toBe(false);
    expect(result.warning).toContain('selected explicitly');
  });

  it('throws for invalid explicit flow', () => {
    expect(() => detectFlow(workspacePath, 'unknown')).toThrow(/Invalid flow/);
  });

  it('detects available flow markers correctly', () => {
    mkdirSync(join(workspacePath, 'memory-bank'), { recursive: true });
    mkdirSync(join(workspacePath, 'specs'), { recursive: true });

    expect(detectAvailableFlows(workspacePath)).toEqual(['aidlc', 'simple']);
  });
});
