import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const {
  recordSufficiency,
  protocolForWorkItem,
  listSufficiency,
} = require('../../../evals/sufficiency/run.cjs');
const { protocolForComplexity } = require('../../../evals/lib/common.cjs');

const REPO_ROOT = join(__dirname, '..', '..', '..');
const RUNNER = join(REPO_ROOT, 'evals', 'sufficiency', 'run.cjs');
const INTENT = '001-unified-bolt-flow';

function writeWorkItem(root: string, id: string, complexity: string): string {
  const dir = join(root, 'docs', 'specsmd', 'intents', INTENT, 'work-items');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id}.md`);
  writeFileSync(
    file,
    [
      '---',
      `id: ${id}`,
      'title: sample',
      `intent: ${INTENT}`,
      `complexity: ${complexity}`,
      'status: pending',
      '---',
      '',
      `# ${id}`,
      '',
      '## Definition of Done',
      '',
      '- [ ] (gating) sample observable behavior holds',
      '',
    ].join('\n'),
    'utf8'
  );
  return file;
}

describe('sufficiency protocol selection', () => {
  it('maps high complexity to triangulation and medium/low to adversarial review', () => {
    expect(protocolForComplexity('high')?.id).toBe('triangulation');
    expect(protocolForComplexity('medium')?.id).toBe('adversarial-review');
    expect(protocolForComplexity('low')?.id).toBe('adversarial-review');
    expect(protocolForComplexity('unknown')).toBeNull();
  });

  it('prints the triangulation protocol for every high-complexity work item in this intent', () => {
    const listed = listSufficiency({ root: REPO_ROOT, intent: INTENT });
    expect(listed.length).toBeGreaterThan(0);
    for (const row of listed.filter((item: { complexity: string }) => item.complexity === 'high')) {
      const printed = protocolForWorkItem({
        root: REPO_ROOT,
        intent: INTENT,
        workItem: row.id,
      });
      expect(printed.protocol.id).toBe('triangulation');
      expect(printed.body).toMatch(/Triangulation protocol/);
      expect(printed.body).toMatch(/Pass bar/);
    }
  });

  it('prints the adversarial-review protocol for medium and low work items', () => {
    const listed = listSufficiency({ root: REPO_ROOT, intent: INTENT });
    const reviewed = listed.filter(
      (item: { complexity: string }) => item.complexity === 'medium' || item.complexity === 'low'
    );
    expect(reviewed.length).toBeGreaterThan(0);
    for (const row of reviewed) {
      const printed = protocolForWorkItem({
        root: REPO_ROOT,
        intent: INTENT,
        workItem: row.id,
      });
      expect(printed.protocol.id).toBe('adversarial-review');
      expect(printed.body).toMatch(/Adversarial review protocol/);
    }
  });
});

describe('sufficiency recording', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `evals-sufficiency-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'package.json'), '{}\n', 'utf8');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('records a report and updates work-item frontmatter to not-cleared when a blocking finding is open', () => {
    writeWorkItem(root, '090-sample', 'high');
    const result = recordSufficiency({
      root,
      workItem: '090-sample',
      findings: [
        {
          id: 'F1',
          class: 'divergence',
          status: 'open',
          summary: 'two implementers would diverge',
        },
      ],
    });
    expect(result.sufficiency).toBe('not-cleared');
    expect(existsSync(result.reportPath)).toBe(true);
    const item = readFileSync(
      join(root, 'docs', 'specsmd', 'intents', INTENT, 'work-items', '090-sample.md'),
      'utf8'
    );
    expect(item).toMatch(/^sufficiency: not-cleared$/m);
    expect(item).toMatch(
      /^sufficiency_report: docs\/specsmd\/intents\/001-unified-bolt-flow\/sufficiency\/090-sample\.md$/m
    );
    const report = readFileSync(result.reportPath, 'utf8');
    expect(report).toMatch(/protocol: triangulation/);
    expect(report).toMatch(/two implementers would diverge/);
  });

  it('refuses cleared while a blocking finding is open, then flips after the finding is named freedom', () => {
    writeWorkItem(root, '091-sample', 'medium');
    expect(() =>
      recordSufficiency({
        root,
        workItem: '091-sample',
        outcome: 'cleared',
        findings: [{ id: 'F1', class: 'contradiction', status: 'open', summary: 'self-disagreement' }],
      })
    ).toThrow(/Cannot record sufficiency: cleared/);

    const cleared = recordSufficiency({
      root,
      workItem: '091-sample',
      meta: { reviewer: 'adversarial-reviewer' },
      findings: [
        {
          id: 'F1',
          class: 'named-freedom',
          status: 'resolved',
          summary: 'named as intentional freedom',
          resolution: 'The spec now names the freedom.',
        },
      ],
    });
    expect(cleared.sufficiency).toBe('cleared');
    expect(cleared.protocol).toBe('adversarial-review');
    const item = readFileSync(
      join(root, 'docs', 'specsmd', 'intents', INTENT, 'work-items', '091-sample.md'),
      'utf8'
    );
    expect(item).toMatch(/^sufficiency: cleared$/m);
  });

  it('exposes the protocol through the CLI for a real work item', () => {
    const result = spawnSync(process.execPath, [RUNNER, '--work-item', '000-flow-evals', '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.id).toBe('000-flow-evals');
    expect(payload.protocol).toBe('triangulation');
    expect(payload.body).toMatch(/Triangulation protocol/);
  });

  it('refuses to clear a high-complexity spec without two isolated probes', () => {
    writeWorkItem(root, '093-sample', 'high');
    expect(() =>
      recordSufficiency({
        root,
        workItem: '093-sample',
        outcome: 'cleared',
        findings: [],
      })
    ).toThrow(/two isolated probes/);

    const cleared = recordSufficiency({
      root,
      workItem: '093-sample',
      findings: [],
      meta: {
        probes: [
          { id: 'P1', isolated: true, observable: 'Caller sees report A.' },
          { id: 'P2', isolated: true, observable: 'Caller sees report A.' },
        ],
        judge: 'No caller-visible divergence.',
      },
    });
    expect(cleared.sufficiency).toBe('cleared');
  });
});
