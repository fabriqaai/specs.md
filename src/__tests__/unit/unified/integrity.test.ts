/**
 * Integrity validator — drift classes, consent, maintenance log, clean tree.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, unlinkSync, utimesSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const SCRIPTS = join(__dirname, '../../../../plugins/specsmd/skills/flow-runtime/scripts');
const VALIDATOR = join(SCRIPTS, 'validate-integrity.cjs');

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
const { validateIntegrity, collectFindings } = require(join(SCRIPTS, 'validate-integrity.cjs'));

describe('integrity validator', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-integrity-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  function seed() {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title: 'Ship notifications' });
    const item = initWorkItem(root, {
      intent: intent.id,
      title: 'User sees a toast',
      complexity: 'medium',
      body: '# A\n\n## Definition of Done\n\n- [x] (gating) A toast appears after save\n',
    });
    return { intent, item };
  }

  function writeStageFiles(boltId: string, names: string[]) {
    const dir = join(root, 'docs/specsmd/bolts', boltId);
    for (const name of names) {
      const extra = name === 'walkthrough.md' ? '## Deviations from plan\n\nnone\n' : '';
      writeFileSync(join(dir, name), `# ${name}\n\n${extra}`, 'utf8');
    }
  }

  function finishBolt(itemId: string) {
    const bolt = initBolt(root, { workItems: itemId, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    completeBolt(root, bolt.id, false);
    return bolt;
  }

  function runCli(args: string[]) {
    return spawnSync(process.execPath, [VALIDATOR, ...args], { encoding: 'utf8' });
  }

  function parseOut(proc: ReturnType<typeof spawnSync>) {
    return JSON.parse(String(proc.stdout));
  }

  function readArt(rel: string) {
    return lib.readMarkdown(join(root, rel));
  }

  function daysAgo(days: number) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
  }

  function setBoltUpdated(boltId: string, stamp: string) {
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', boltId, 'bolt.md'));
    parsed.data.updated = stamp;
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
  }

  it('reports zero findings and exit 0 on a clean tree', () => {
    const { item } = seed();
    initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    const result = validateIntegrity(root);
    expect(result.findings).toEqual([]);
    expect(result.repaired).toEqual([]);

    const cli = runCli([root]);
    expect(cli.status).toBe(0);
    const payload = parseOut(cli);
    expect(payload.ok).toBe(true);
    expect(payload.data.findings).toEqual([]);
  });

  it('detects a completed bolt whose work items are still pending', () => {
    const { intent, item } = seed();
    const bolt = finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    const cascade = result.findings.filter((f: { class: string }) => f.class === 'status-cascade');
    expect(cascade.length).toBeGreaterThan(0);
    const itemFinding = cascade.find((f: { artifact: string }) => f.artifact === item.id);
    expect(itemFinding).toMatchObject({
      code: 'CASCADE_DRIFT',
      severity: 'error',
      auto_repairable: true,
    });
    expect(itemFinding.remediation).toMatch(new RegExp(item.id));
    expect(itemFinding.remediation).toMatch(/complete/);
    expect(itemFinding.remediation).toContain(itemRel);
    expect(itemFinding.message).toMatch(new RegExp(bolt.id));
  });

  it('detects a bolt naming a work item that does not exist', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.work_items = [item.id, '999-missing-slice'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    const orphan = result.findings.find(
      (f: { class: string; reference?: string }) =>
        f.class === 'orphaned-reference' && f.reference === '999-missing-slice'
    );
    expect(orphan).toMatchObject({
      code: 'ORPHAN_REF',
      severity: 'error',
      auto_repairable: false,
    });
    expect(orphan.remediation).toMatch(/999-missing-slice/);
    expect(orphan.remediation).toContain(`docs/specsmd/bolts/${bolt.id}/bolt.md`);
  });

  it('detects a dependency naming a missing work item', () => {
    const { intent, item } = seed();
    const parsed = readArt(`docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`);
    parsed.data.depends_on = ['888-ghost'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    const orphan = result.findings.find(
      (f: { class: string; reference?: string }) => f.class === 'orphaned-reference' && f.reference === '888-ghost'
    );
    expect(orphan).toMatchObject({
      code: 'ORPHAN_REF',
      severity: 'error',
      auto_repairable: false,
    });
    expect(orphan.remediation).toMatch(/888-ghost/);
    expect(orphan.remediation).toContain(`docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`);
  });

  it('detects a stale active bolt using the contract default threshold', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    setBoltUpdated(bolt.id, daysAgo(10));

    const result = validateIntegrity(root);
    const stale = result.findings.find((f: { class: string }) => f.class === 'stale-active');
    expect(stale).toMatchObject({
      code: 'STALE_ACTIVE',
      severity: 'warning',
      auto_repairable: false,
      artifact: bolt.id,
    });
    expect(stale.remediation).toContain(`docs/specsmd/bolts/${bolt.id}/bolt.md`);
    expect(stale.remediation).toMatch(/update-stage\.cjs/);
    expect(stale.remediation).toContain(bolt.id);
    expect(stale.remediation).toMatch(/current_stage/);
    expect(stale.stale_after).toBe('P7D');
  });

  it('remediates a last-stage stale bolt with complete-bolt, not update-stage (none)', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    expect(readArt(`docs/specsmd/bolts/${bolt.id}/bolt.md`).data.current_stage).toBeNull();
    setBoltUpdated(bolt.id, daysAgo(10));

    const stale = validateIntegrity(root).findings.find((f: { class: string }) => f.class === 'stale-active');
    expect(stale.remediation).toMatch(/complete-bolt\.cjs/);
    expect(stale.remediation).toContain(bolt.id);
    expect(stale.remediation).not.toMatch(/update-stage\.cjs/);
    expect(stale.remediation).not.toMatch(/\(none\)/);
    expect(stale.remediation).toContain(`docs/specsmd/bolts/${bolt.id}/bolt.md`);
  });

  it('honors a configured stale threshold', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    setBoltUpdated(bolt.id, daysAgo(10));

    const wide = validateIntegrity(root, { staleAfter: 'P30D' });
    expect(wide.findings.filter((f: { class: string }) => f.class === 'stale-active')).toEqual([]);

    const cli = runCli([root, '--stale-after', 'P30D']);
    expect(cli.status).toBe(0);
    expect(parseOut(cli).data.findings.filter((f: { class: string }) => f.class === 'stale-active')).toEqual([]);
  });

  it('uses bolt.updated, not filesystem mtime, for staleness', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    const boltPath = join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md');
    const age = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    utimesSync(boltPath, age, age);
    expect(validateIntegrity(root).findings.filter((f: { class: string }) => f.class === 'stale-active')).toEqual([]);

    setBoltUpdated(bolt.id, daysAgo(10));
    utimesSync(boltPath, new Date(), new Date());
    expect(validateIntegrity(root).findings.some((f: { class: string }) => f.class === 'stale-active')).toBe(true);
  });

  it('detects a status token outside the contract vocabulary', () => {
    const { intent, item } = seed();
    const rel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(rel);
    parsed.data.status = 'in-progress';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    const illegal = result.findings.find((f: { class: string }) => f.class === 'illegal-status');
    expect(illegal).toMatchObject({
      code: 'ILLEGAL_STATUS',
      severity: 'error',
      auto_repairable: true,
      expected_status: 'active',
    });
    expect(illegal.remediation).toContain(rel);
    expect(illegal.message).toMatch(/in-progress/);
  });

  it('detects an identifier that does not match its location', () => {
    const { intent, item } = seed();
    const rel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(rel);
    parsed.data.id = '099-wrong-place';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    const mismatch = result.findings.find((f: { class: string }) => f.class === 'id-location');
    expect(mismatch).toMatchObject({
      code: 'ID_LOCATION',
      severity: 'error',
      auto_repairable: true,
      expected_id: item.id,
    });
    expect(mismatch.remediation).toContain(rel);
    expect(mismatch.remediation).toContain(item.id);
  });

  it('does not repair without consent and writes no maintenance log', () => {
    const { intent, item } = seed();
    finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    const before = readFileSync(join(root, itemRel), 'utf8');

    const result = validateIntegrity(root);
    expect(result.findings.some((f: { auto_repairable: boolean }) => f.auto_repairable)).toBe(true);
    expect(result.repaired).toEqual([]);
    expect(readFileSync(join(root, itemRel), 'utf8')).toBe(before);
    expect(existsSync(join(root, 'docs/specsmd/maintenance-log.md'))).toBe(false);
    expect(readArt(itemRel).data.status).toBe('pending');
  });

  it('repairs all auto-repairable findings with --fix and appends the maintenance log', () => {
    const { intent, item } = seed();
    finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root, { fix: true });
    expect(result.repaired.length).toBeGreaterThan(0);
    expect(result.repaired.every((r: { code: string }) => r.code === 'CASCADE_DRIFT')).toBe(true);
    expect(readArt(itemRel).data.status).toBe('complete');
    expect(readArt(`docs/specsmd/intents/${intent.id}/brief.md`).data.status).toBe('complete');
    expect(result.findings.filter((f: { auto_repairable: boolean }) => f.auto_repairable)).toEqual([]);

    const logPath = join(root, 'docs/specsmd/maintenance-log.md');
    expect(existsSync(logPath)).toBe(true);
    const log = readFileSync(logPath, 'utf8');
    expect(log).toMatch(/CASCADE_DRIFT/);
    expect(log).toContain(itemRel);
    expect(log).toMatch(/status → complete/);
    expect(result.maintenance_log).toBe('docs/specsmd/maintenance-log.md');
  });

  it('repairs only the consented finding', () => {
    const { intent, item } = seed();
    const extra = initWorkItem(root, {
      intent: intent.id,
      title: 'Second slice',
      complexity: 'low',
      body: '# B\n\n- [x] (gating) done\n',
    });
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const extraRel = `docs/specsmd/intents/${intent.id}/work-items/${extra.id}.md`;
    const first = readArt(itemRel);
    first.data.status = 'in-progress';
    lib.writeMarkdown(first.path, first.data, first.body, root);
    const second = readArt(extraRel);
    second.data.id = '099-misfiled';
    lib.writeMarkdown(second.path, second.data, second.body, root);

    const detected = collectFindings(root, lib.loadContract());
    const illegal = detected.find((f: { class: string }) => f.class === 'illegal-status');
    expect(illegal).toBeTruthy();

    const result = validateIntegrity(root, { finding: illegal.id });
    expect(result.repaired).toHaveLength(1);
    expect(result.repaired[0].code).toBe('ILLEGAL_STATUS');
    expect(readArt(itemRel).data.status).toBe('active');
    expect(readArt(extraRel).data.id).toBe('099-misfiled');
    expect(result.findings.some((f: { class: string }) => f.class === 'id-location')).toBe(true);

    const log = readFileSync(join(root, 'docs/specsmd/maintenance-log.md'), 'utf8');
    expect(log).toMatch(/ILLEGAL_STATUS/);
    expect(log).not.toMatch(/ID_LOCATION/);
  });

  it('--fix does not repair findings that require a human decision', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.work_items = [item.id, '777-absent'];
    parsed.data.updated = daysAgo(10);
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root, { fix: true });
    expect(result.repaired).toEqual([]);
    expect(existsSync(join(root, 'docs/specsmd/maintenance-log.md'))).toBe(false);
    expect(result.findings.some((f: { class: string }) => f.class === 'orphaned-reference')).toBe(true);
    expect(result.findings.some((f: { class: string }) => f.class === 'stale-active')).toBe(true);
  });

  it('status health is the validator output and never writes', () => {
    const { intent, item } = seed();
    const bolt = finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    const beforeItem = readFileSync(join(root, itemRel), 'utf8');
    const beforeBolt = readFileSync(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'), 'utf8');

    const report = projectStatus(root);
    expect(report.health.length).toBeGreaterThan(0);
    expect(report.health.some((f: { class: string }) => f.class === 'status-cascade')).toBe(true);
    expect(report.health[0].severity).toBeTruthy();
    expect(report.health[0].remediation).toBeTruthy();
    expect(typeof report.health[0].auto_repairable).toBe('boolean');
    expect(existsSync(join(root, 'docs/specsmd/maintenance-log.md'))).toBe(false);
    expect(readFileSync(join(root, itemRel), 'utf8')).toBe(beforeItem);
    expect(readFileSync(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'), 'utf8')).toBe(beforeBolt);
  });

  it('CLI --fix repairs and still prints JSON', () => {
    const { intent, item } = seed();
    finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const cli = runCli([root, '--fix']);
    expect(cli.status).toBe(0);
    const payload = parseOut(cli);
    expect(payload.ok).toBe(true);
    expect(payload.data.repaired.length).toBeGreaterThan(0);
    expect(payload.data.findings).toEqual([]);
    expect(readArt(itemRel).data.status).toBe('complete');
  });

  it('does not treat a location-matched work item as an orphan, and still reports cascade', () => {
    const { intent, item } = seed();
    const bolt = finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.id = '099-wrong-place';
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const result = validateIntegrity(root);
    expect(
      result.findings.some(
        (f: { class: string; reference?: string }) =>
          f.class === 'orphaned-reference' && (f.reference === item.id || f.reference === '099-wrong-place')
      )
    ).toBe(false);
    expect(result.findings.some((f: { class: string }) => f.class === 'id-location')).toBe(true);
    const itemFinding = result.findings.find(
      (f: { class: string; path: string }) => f.class === 'status-cascade' && f.path === itemRel
    );
    expect(itemFinding).toMatchObject({
      code: 'CASCADE_DRIFT',
      auto_repairable: true,
    });
    expect(itemFinding.message).toMatch(new RegExp(bolt.id));
  });

  it('settles consented cascade repairs across passes without --fix', () => {
    const { intent, item } = seed();
    finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'pending';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const detected = collectFindings(root, lib.loadContract());
    const ids = detected
      .filter((f: { auto_repairable: boolean }) => f.auto_repairable)
      .map((f: { id: string }) => f.id)
      .join(',');
    const result = validateIntegrity(root, { finding: ids });
    expect(readArt(itemRel).data.status).toBe('complete');
    expect(readArt(`docs/specsmd/intents/${intent.id}/brief.md`).data.status).toBe('complete');
    expect(result.findings.filter((f: { class: string }) => f.class === 'status-cascade')).toEqual([]);
  });

  it('gives cascade expected_status precedence over a synonym repair on the same file', () => {
    const { intent, item } = seed();
    finishBolt(item.id);
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'in-progress';
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const detected = collectFindings(root, lib.loadContract());
    const ids = detected
      .filter((f: { auto_repairable: boolean; path: string }) => f.auto_repairable && f.path === itemRel)
      .map((f: { id: string }) => f.id)
      .join(',');
    expect(ids).toMatch(/F/);
    const result = validateIntegrity(root, { finding: ids });
    expect(readArt(itemRel).data.status).toBe('complete');
    expect(result.repaired.some((r: { code: string }) => r.code === 'CASCADE_DRIFT')).toBe(true);
  });

  it('still scans work items when brief.md is missing', () => {
    const { intent, item } = seed();
    const itemRel = `docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`;
    const parsed = readArt(itemRel);
    parsed.data.status = 'in-progress';
    parsed.data.depends_on = ['888-ghost'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);
    unlinkSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'));

    const result = validateIntegrity(root);
    expect(result.scanned.work_items).toBe(1);
    expect(result.findings.some((f: { code: string }) => f.code === 'UNREADABLE')).toBe(true);
    expect(result.findings.some((f: { class: string }) => f.class === 'illegal-status')).toBe(true);
    expect(result.findings.some((f: { class: string }) => f.class === 'orphaned-reference')).toBe(true);
    expect(result.findings.some((f: { class: string; reference?: string }) => f.reference === item.id)).toBe(false);
  });

  it('status reports UNREADABLE health instead of aborting when brief.md is empty', () => {
    const { intent, item } = seed();
    writeFileSync(join(root, 'docs/specsmd/intents', intent.id, 'brief.md'), '', 'utf8');
    const report = projectStatus(root);
    expect(report.health.some((f: { code: string }) => f.code === 'UNREADABLE')).toBe(true);
    expect(report.lenses.shaping.some((s: { id: string }) => s.id === item.id || s.id === intent.id)).toBe(true);
  });

  it('CLI exits 1 when findings remain', () => {
    const { item } = seed();
    const bolt = initBolt(root, { workItems: item.id, ceremony: 'autopilot' });
    const parsed = lib.readMarkdown(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'));
    parsed.data.work_items = [item.id, '000-nope'];
    lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

    const cli = runCli([root]);
    expect(cli.status).toBe(1);
    const payload = parseOut(cli);
    expect(payload.ok).toBe(true);
    expect(payload.data.findings.length).toBeGreaterThan(0);
  });
});
