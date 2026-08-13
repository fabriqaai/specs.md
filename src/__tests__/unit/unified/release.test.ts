/**
 * Slim release step — checklist over completed bolts, verify record, shipping lens.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const PLUGIN = join(__dirname, '../../../../plugins/specsmd');
const SKILLS = join(PLUGIN, 'skills');
const SCRIPTS = join(SKILLS, 'flow-runtime/scripts');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initProject } = require(join(SCRIPTS, 'init-project.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initIntent } = require(join(SCRIPTS, 'init-intent.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initWorkItem } = require(join(SCRIPTS, 'init-work-item.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initBolt } = require(join(SCRIPTS, 'init-bolt.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateStage } = require(join(SCRIPTS, 'update-stage.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { completeBolt } = require(join(SCRIPTS, 'complete-bolt.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { projectStatus } = require(join(SCRIPTS, 'status.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initRelease } = require(join(SCRIPTS, 'init-release.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { recordVerify } = require(join(SCRIPTS, 'record-verify.cjs'));

function skillFrontmatter(name: string): string {
  const raw = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  return match ? match[1] : '';
}

function skillBody(name: string): string {
  const raw = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8');
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '');
}

describe('slim release step', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-release-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  function writeStageFiles(boltId: string, names: string[]) {
    const dir = join(root, 'docs/specsmd/bolts', boltId);
    for (const name of names) {
      const extra = name === 'walkthrough.md' ? '## Deviations from plan\n\nnone\n' : '';
      writeFileSync(join(dir, name), `# ${name}\n\n${extra}`, 'utf8');
    }
  }

  function writeWalkthrough(
    boltId: string,
    opts: { changed: string; verify: string; deviations?: string }
  ) {
    writeFileSync(
      join(root, 'docs/specsmd/bolts', boltId, 'walkthrough.md'),
      [
        '# Walkthrough',
        '',
        '## What changed',
        '',
        opts.changed,
        '',
        '## Why',
        '',
        'The caller asked for this behavior.',
        '',
        '## Deviations from plan',
        '',
        opts.deviations || 'none',
        '',
        '## How to verify',
        '',
        opts.verify,
        '',
      ].join('\n'),
      'utf8'
    );
  }

  function completeDefaultBolt(itemId: string, walkthrough: { changed: string; verify: string }) {
    const bolt = initBolt(root, { workItems: itemId, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    writeWalkthrough(bolt.id, walkthrough);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    completeBolt(root, bolt.id, false);
    return bolt;
  }

  function seedCompletedPair() {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Ship notifications' });
    const a = initWorkItem(root, {
      intent: intent.id,
      title: 'User sees a toast',
      complexity: 'medium',
      body: '# A\n\n## Definition of Done\n\n- [x] (gating) A toast appears after save\n',
    });
    const b = initWorkItem(root, {
      intent: intent.id,
      title: 'User dismisses a toast',
      complexity: 'medium',
      dependsOn: a.id,
      body: '# B\n\n## Definition of Done\n\n- [x] (gating) Dismiss hides the toast\n',
    });
    const boltA = completeDefaultBolt(a.id, {
      changed: 'A toast appears after save.',
      verify: 'Save a record and look for a toast.',
    });
    const boltB = completeDefaultBolt(b.id, {
      changed: 'Dismiss hides the toast.',
      verify: 'Press dismiss and confirm the toast is gone.',
    });
    writeFileSync(
      join(root, 'docs/specsmd/bolts', boltA.id, 'review-report.md'),
      [
        '# Review report',
        '',
        '## Load-bearing',
        '',
        'none',
        '',
        '## Advisory',
        '',
        '- Contrast on the dismiss control is low',
        '',
        '## Outcome',
        '',
        'May complete',
        '',
      ].join('\n'),
      'utf8'
    );
    return { intent, a, b, boltA, boltB };
  }

  it('keeps release skills by-name-only and names no required next skill', () => {
    for (const name of ['release-checklist', 'release-verify']) {
      expect(skillFrontmatter(name)).toMatch(/disable-model-invocation:\s*true/);
      const body = skillBody(name);
      expect(body).not.toMatch(/REQUIRED NEXT SKILL/);
      expect(body).not.toMatch(/required-next/i);
    }
  });

  it('declares release and verification in the contract', () => {
    const contract = lib.loadContract();
    expect(contract.artifact_types.release.path).toBe('releases/{id}/release.md');
    expect(contract.artifact_types.release.fields).toEqual(
      expect.arrayContaining(['id', 'title', 'status', 'bolts', 'created'])
    );
    expect(contract.artifact_types.verification.path).toBe('releases/{release}/verifications/{id}.md');
    expect(contract.artifact_types.verification.fields).toEqual(
      expect.arrayContaining(['change', 'confirmed_by', 'confirmed_at', 'environment', 'observation'])
    );
    expect(contract.identifiers.patterns.release).toBe('{nnn}-{slug}');
  });

  it('produces a checklist over two completed bolts with changes, evidence, and findings', () => {
    const { boltA, boltB } = seedCompletedPair();
    const release = initRelease(root, { title: 'Notifications' });

    expect(release.bolts.sort()).toEqual([boltA.id, boltB.id].sort());
    const byBolt = Object.fromEntries(release.changes.map((row: { bolt: string }) => [row.bolt, row]));
    expect(byBolt[boltA.id].what_changed).toMatch(/toast appears after save/i);
    expect(byBolt[boltB.id].what_changed).toMatch(/Dismiss hides the toast/);
    expect(byBolt[boltA.id].evidence.walkthrough).toBe(true);
    expect(byBolt[boltA.id].evidence.test_report).toBe(true);
    expect(byBolt[boltA.id].evidence.how_to_verify).toMatch(/look for a toast/);
    expect(byBolt[boltB.id].evidence.how_to_verify).toMatch(/dismiss/i);
    expect(
      byBolt[boltA.id].outstanding_findings.some((finding: { summary: string }) =>
        /Contrast on the dismiss control/.test(finding.summary)
      )
    ).toBe(true);

    const artifact = readFileSync(release.path, 'utf8');
    expect(artifact).toContain(boltA.id);
    expect(artifact).toContain(boltB.id);
    expect(artifact).toMatch(/toast appears after save/i);
    expect(artifact).toMatch(/Dismiss hides the toast/);
    expect(artifact).toMatch(/walkthrough\.md: present/);
    expect(artifact).toMatch(/test-report\.md: present/);
    expect(artifact).toMatch(/Contrast on the dismiss control/);
    expect(existsSync(join(root, 'docs/specsmd/releases', release.id, 'release.md'))).toBe(true);
    expect(
      projectStatus(root).suggestion.options.some((row: { skill: string }) => row.skill === 'release-checklist')
    ).toBe(false);
  });

  it('records a verification that is answerable later from the artifact tree', () => {
    const { boltA } = seedCompletedPair();
    const release = initRelease(root, { bolts: boltA.id, title: 'Toast appear' });
    const recorded = recordVerify(root, {
      change: boltA.id,
      by: 'Ada (human)',
      when: '2026-08-13T12:00:00Z',
      environment: 'staging',
      observation: 'A toast appears after save.',
    });

    expect(recorded.confirmed_by).toBe('Ada (human)');
    expect(recorded.confirmed_at).toBe('2026-08-13T12:00:00Z');
    expect(recorded.change).toBe(boltA.id);
    expect(recorded.environment).toBe('staging');

    const listed = lib.listVerifications(root, release.id, lib.loadContract());
    expect(listed).toHaveLength(1);
    const fromTree = lib.readMarkdown(listed[0].path);
    expect(fromTree.data.confirmed_by).toBe('Ada (human)');
    expect(fromTree.data.confirmed_at).toBe('2026-08-13T12:00:00Z');
    expect(fromTree.data.change).toBe(boltA.id);
    expect(fromTree.data.environment).toBe('staging');
    expect(fromTree.data.observation).toMatch(/toast appears after save/i);
    expect(fromTree.data.release).toBe(release.id);
    expect(fromTree.body).toMatch(/Ada \(human\)/);
    expect(fromTree.body).toMatch(/2026-08-13T12:00:00Z/);
    expect(fromTree.body).toContain(boltA.id);
  });

  it('distinguishes completed-unreleased from released work in the shipping lens', () => {
    const { boltA, boltB } = seedCompletedPair();
    const before = projectStatus(root);
    expect(before.lenses.shipping).toHaveLength(2);
    expect(before.lenses.shipping.every((row: { release_state: string }) => row.release_state === 'unreleased')).toBe(
      true
    );

    const release = initRelease(root, { bolts: boltA.id, title: 'First slice' });
    const after = projectStatus(root);
    const shippedA = after.lenses.shipping.find((row: { id: string }) => row.id === boltA.id);
    const shippedB = after.lenses.shipping.find((row: { id: string }) => row.id === boltB.id);
    expect(shippedA.release_state).toBe('released');
    expect(shippedA.release).toBe(release.id);
    expect(shippedB.release_state).toBe('unreleased');
    expect(shippedB.release).toBeNull();
    expect(after.suggestion.options.some((row: { skill: string }) => row.skill === 'release-checklist')).toBe(true);
  });

  it('offers the checklist as a suggestion and never takes it', () => {
    const seeded = seedCompletedPair();
    const releasesBefore = readdirSync(join(root, 'docs/specsmd/releases'));
    const report = projectStatus(root);
    expect(report.suggestion.best.skill).toBe('release-checklist');
    expect(report.suggestion.best.why).toMatch(/not yet released/);
    expect(readdirSync(join(root, 'docs/specsmd/releases'))).toEqual(releasesBefore);
    expect(report.lenses.shipping.map((row: { id: string }) => row.id).sort()).toEqual(
      [seeded.boltA.id, seeded.boltB.id].sort()
    );
  });

  it('reports no release findings when a project never releases', () => {
    seedCompletedPair();
    const report = projectStatus(root);
    expect(report.health).toEqual([]);
    expect(JSON.stringify(report.health)).not.toMatch(/release/i);
    const codes = (report.health || []).map((row: { code?: string; message?: string }) => `${row.code} ${row.message}`);
    expect(codes.join(' ')).not.toMatch(/release/i);
  });

  it('does not gate bolt completion on release', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'No ship' });
    const item = initWorkItem(root, {
      intent: intent.id,
      title: 'Rename a label',
      complexity: 'low',
      body: '# A\n\n- [x] (gating) the label reads Save\n',
    });
    const bolt = initBolt(root, { workItems: item.id, recipe: 'simple', ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'walkthrough.md']);
    writeWalkthrough(bolt.id, { changed: 'The label reads Save.', verify: 'Open the form and read the label.' });
    updateStage(root, bolt.id, 'plan');
    updateStage(root, bolt.id, 'implement');
    updateStage(root, bolt.id, 'walkthrough');
    const done = completeBolt(root, bolt.id, false);
    expect(done.status).toBe('complete');
    const md = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    expect(md.data.status).toBe('complete');
    expect(md.data.release).toBeUndefined();
    expect(projectStatus(root).health).toEqual([]);
  });

  it('includes release-relevant decisions created since the last checklist', () => {
    const { boltA, boltB } = seedCompletedPair();
    const first = initRelease(root, { bolts: boltA.id, title: 'First' });
    writeFileSync(
      join(root, 'docs/specsmd/decisions', '001-toast-copy.md'),
      [
        '---',
        'id: 001-toast-copy',
        'title: Toast copy is a sentence',
        'status: active',
        'created: 2099-01-01T00:00:00Z',
        'consult_when: changing user-visible toast wording',
        '---',
        '',
        '# Toast copy is a sentence',
        '',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(root, 'docs/specsmd/decisions', 'index.md'),
      '---\nid: decisions-index\nstatus: active\n---\n\n# Decisions in force\n\n- [001-toast-copy](001-toast-copy.md) — consult when changing user-visible toast wording.\n',
      'utf8'
    );
    const second = initRelease(root, { bolts: boltB.id, title: 'Second' });
    expect(second.previous_release).toBe(first.id);
    expect(second.decisions_since_last.map((row: { id: string }) => row.id)).toContain('001-toast-copy');
    expect(readFileSync(second.path, 'utf8')).toMatch(/001-toast-copy/);
    expect(readFileSync(second.path, 'utf8')).toMatch(/changing user-visible toast wording/);
  });

  it('refuses a checklist that names an incomplete bolt', () => {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Open' });
    const item = initWorkItem(root, { intent: intent.id, title: 'Still open', complexity: 'low' });
    const bolt = initBolt(root, { workItems: item.id, recipe: 'simple', ceremony: 'autopilot' });
    expect(() => initRelease(root, { bolts: bolt.id })).toThrow(
      /BOLT_NOT_COMPLETE|cannot join a release checklist|is active/i
    );
    expect(lib.listReleases(root, lib.loadContract())).toEqual([]);
  });

  it('refuses verify until the change is on a checklist, then records it', () => {
    const { boltA } = seedCompletedPair();
    expect(() =>
      recordVerify(root, {
        change: boltA.id,
        by: 'Ada',
        environment: 'staging',
        observation: 'visible',
      })
    ).toThrow(/CHANGE_NOT_RELEASED|not on a release/i);
    initRelease(root, { bolts: boltA.id });
    const recorded = recordVerify(root, {
      change: boltA.id,
      by: 'Ada',
      environment: 'staging',
      observation: 'visible',
    });
    expect(recorded.change).toBe(boltA.id);
  });

  it('types missing verify fields as terminal with remediation', () => {
    const { boltA } = seedCompletedPair();
    initRelease(root, { bolts: boltA.id });
    const missingBy = spawnSync(
      process.execPath,
      [join(SCRIPTS, 'record-verify.cjs'), root, '--change', boltA.id, '--environment', 'staging', '--observation', 'ok'],
      { encoding: 'utf8' }
    );
    expect(missingBy.status).toBe(2);
    expect(missingBy.stdout).toMatch(/CONFIRMED_BY_REQUIRED|"kind": "terminal"/);
    expect(missingBy.stdout).toMatch(/remediation/);
  });

  it('creates the releases directory on init and leaves it unused without findings', () => {
    initProject(root, 'balanced');
    expect(existsSync(join(root, 'docs/specsmd/releases'))).toBe(true);
    expect(projectStatus(root).health).toEqual([]);
    expect(projectStatus(root).suggestion.best.skill).not.toBe('release-checklist');
  });
});
