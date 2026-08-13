/**
 * Memory lifecycle — semantic current truth, episodic history, gated archive.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const SCRIPTS = join(__dirname, '../../../../plugins/specsmd/skills/flow-runtime/scripts');
const USING = join(__dirname, '../../../../plugins/specsmd/skills/using-specsmd/SKILL.md');
const STATUS_SKILL = join(__dirname, '../../../../plugins/specsmd/skills/specsmd-status/SKILL.md');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const memory = require(join(SCRIPTS, 'memory-lib.cjs'));
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
const { initSystemDoc } = require(join(SCRIPTS, 'init-system-doc.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initDecision } = require(join(SCRIPTS, 'init-decision.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { supersedeDecision } = require(join(SCRIPTS, 'supersede-decision.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { archiveArtifact } = require(join(SCRIPTS, 'archive-artifact.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { garden, collectGardenFindings } = require(join(SCRIPTS, 'garden.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateIntegrity } = require(join(SCRIPTS, 'validate-integrity.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { projectStatus } = require(join(SCRIPTS, 'status.cjs'));

describe('memory lifecycle', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-memory-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  function seed(title = 'Ship notifications') {
    initProject(root, 'balanced');
    const intent = initIntent(root, { title });
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

  function finishBolt(itemId: string, opts?: Record<string, unknown>) {
    const bolt = initBolt(root, { workItems: itemId, ceremony: 'autopilot', touchedScope: opts?.touchedScope });
    writeStageFiles(bolt.id, ['plan.md', 'test-report.md', 'review-report.md', 'walkthrough.md']);
    for (const stage of ['plan', 'execute', 'test', 'review']) updateStage(root, bolt.id, stage);
    const done = completeBolt(root, bolt.id, false, opts);
    return { bolt, done };
  }

  function read(rel: string) {
    return lib.readMarkdown(join(root, rel));
  }

  describe('contract', () => {
    it('answers memory class for every artifact type, including the change-record transition', () => {
      const contract = lib.loadContract();
      expect(contract.memory_class.values).toEqual(['semantic', 'episodic']);
      expect(contract.memory_class.stored).toBe(false);
      expect(contract.memory_class.derivation.change_record).toEqual({
        non_terminal: 'semantic',
        terminal: 'episodic',
      });

      const changeRecords = ['intent', 'work_item', 'bolt', 'stage_artifact'];
      for (const [name, type] of Object.entries(contract.artifact_types) as [
        string,
        { memory_class: string },
      ][]) {
        expect(type.memory_class, name).toBeTruthy();
        if (changeRecords.includes(name)) {
          expect(type.memory_class).toBe('change_record');
          expect(lib.memoryClassFor(name, 'draft', contract)).toBe('semantic');
          expect(lib.memoryClassFor(name, 'pending', contract)).toBe('semantic');
          expect(lib.memoryClassFor(name, 'active', contract)).toBe('semantic');
          expect(lib.memoryClassFor(name, 'complete', contract)).toBe('episodic');
          expect(lib.memoryClassFor(name, 'abandoned', contract)).toBe('episodic');
        } else {
          expect(['semantic', 'episodic']).toContain(type.memory_class);
          expect(lib.memoryClassFor(name, 'complete', contract)).toBe(type.memory_class);
        }
      }
      expect(lib.memoryClassFor('system', 'active', contract)).toBe('semantic');
      expect(lib.memoryClassFor('standard', 'active', contract)).toBe('semantic');
      expect(lib.memoryClassFor('decisions_index', 'active', contract)).toBe('semantic');
      expect(lib.memoryClassFor('decision', 'complete', contract)).toBe('episodic');
    });
  });

  describe('projection', () => {
    it('surfaces a scope-matched system document at completion and completes when review is declined', () => {
      const { item } = seed();
      initSystemDoc(root, {
        id: 'auth',
        name: 'Auth truth',
        purpose: 'How authentication works now',
        claimedScope: 'auth, identity',
      });
      const { bolt, done } = finishBolt(item.id, { touchedScope: 'auth', skipReview: true });
      expect(done.status).toBe('complete');
      expect(done.projection_review).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            document: 'auth',
            path: 'system/auth.md',
            status: 'declined',
          }),
        ])
      );
      expect(done.projection_review[0].verify).toMatch(/system\/auth\.md/);
      expect(done.projection_review[0].verify).toMatch(new RegExp(bolt.id));

      const health = validateIntegrity(root);
      const advisory = health.findings.find((f: { code: string }) => f.code === 'UNREVIEWED_PROJECTION');
      expect(advisory).toMatchObject({
        severity: 'advisory',
        auto_repairable: false,
        document: 'auth',
        artifact: bolt.id,
      });
      expect(advisory.message).toMatch(new RegExp(bolt.id));
      expect(advisory.message).toMatch(/auth/);
      expect(advisory.remediation).toMatch(/system\/auth\.md/);
    });

    it('records verification when the matching document is reviewed', () => {
      const { item } = seed();
      initSystemDoc(root, {
        id: 'auth',
        name: 'Auth truth',
        purpose: 'How authentication works now',
        claimedScope: 'auth',
      });
      const { bolt, done } = finishBolt(item.id, { touchedScope: 'auth', reviewed: 'auth' });
      expect(done.status).toBe('complete');
      expect(done.projection_review[0].status).toBe('reviewed');
      const sys = read('docs/specsmd/system/auth.md');
      expect(sys.data.last_verified).toBeTruthy();
      expect(sys.data.verified_by).toBe(bolt.id);
      expect(validateIntegrity(root).findings.filter((f: { code: string }) => f.code === 'UNREVIEWED_PROJECTION')).toEqual(
        []
      );
    });
  });

  describe('episodic headers', () => {
    it('stamps a historical header with a one-hop semantic pointer on every episodic artifact', () => {
      const { intent, item } = seed();
      initSystemDoc(root, {
        id: 'auth',
        name: 'Auth truth',
        purpose: 'How authentication works now',
        claimedScope: 'auth',
      });
      const { bolt, done } = finishBolt(item.id, { touchedScope: 'auth', reviewed: 'auth' });
      expect(done.current_truth).toBe('system/auth.md');

      const boltMd = read(`docs/specsmd/bolts/${bolt.id}/bolt.md`);
      const itemMd = read(`docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`);
      const intentMd = read(`docs/specsmd/intents/${intent.id}/brief.md`);
      const walk = readFileSync(join(root, 'docs/specsmd/bolts', bolt.id, 'walkthrough.md'), 'utf8');
      const plan = readFileSync(join(root, 'docs/specsmd/bolts', bolt.id, 'plan.md'), 'utf8');

      for (const body of [boltMd.body, itemMd.body, intentMd.body, walk, plan]) {
        const header = memory.parseHistoricalHeader(body);
        expect(header).toBeTruthy();
        expect(header.current_truth).toBe('system/auth.md');
        const info = memory.inspectPointer(root, header.current_truth, lib.loadContract());
        expect(info.ok).toBe(true);
        expect(info.memory_class).toBe('semantic');
      }
    });

    it('never points an episodic header at another episodic record', () => {
      const { item } = seed();
      const { bolt } = finishBolt(item.id);
      const header = memory.parseHistoricalHeader(read(`docs/specsmd/bolts/${bolt.id}/bolt.md`).body);
      expect(header.current_truth).toBe('project.md');
      expect(memory.inspectPointer(root, `bolts/${bolt.id}/bolt.md`, lib.loadContract()).ok).toBe(false);
    });
  });

  describe('decisions', () => {
    it('keeps only in-force decisions on the index and updates index plus old pointer in one supersede', () => {
      initProject(root, 'balanced');
      const first = initDecision(root, {
        title: 'Use OAuth',
        consultWhen: 'changing authentication',
      });
      const indexBefore = memory.readDecisionsIndex(root, lib.loadContract());
      expect(indexBefore.entries.map((e: { id: string }) => e.id)).toEqual([first.id]);
      expect(indexBefore.entries[0].consult_when).toMatch(/authentication/);

      const firstMd = read(`docs/specsmd/decisions/${first.id}.md`);
      const firstHeader = memory.parseHistoricalHeader(firstMd.body);
      expect(firstHeader.current_truth).toBe('decisions/index.md');
      expect(memory.inspectPointer(root, firstHeader.current_truth, lib.loadContract()).memory_class).toBe(
        'semantic'
      );

      const next = supersedeDecision(root, {
        replaces: first.id,
        title: 'Use OIDC',
        consultWhen: 'changing identity federation',
      });
      const index = memory.readDecisionsIndex(root, lib.loadContract());
      expect(index.entries.map((e: { id: string }) => e.id)).toEqual([next.id]);
      expect(index.entries.some((e: { id: string }) => e.id === first.id)).toBe(false);

      const old = read(`docs/specsmd/decisions/${first.id}.md`);
      expect(old.data.superseded).toBe(true);
      expect(old.data.superseded_by).toBe(next.id);
      const oldHeader = memory.parseHistoricalHeader(old.body);
      expect(oldHeader.current_truth).toBe('decisions/index.md');
      expect(oldHeader.current_truth).not.toBe(`decisions/${next.id}.md`);
    });
  });

  describe('archive', () => {
    it('refuses to archive an unindexed decision and records the override when forced', () => {
      initProject(root, 'balanced');
      const decision = initDecision(root, { title: 'Use sessions', consultWhen: 'auth storage' });
      const contract = lib.loadContract();
      memory.writeDecisionsIndex(root, contract, { id: 'decisions-index', status: 'active' }, []);

      try {
        archiveArtifact(root, { kind: 'decision', id: decision.id });
        throw new Error('expected archive to be refused');
      } catch (err) {
        const message = String((err as Error).message);
        const remediation = String((err as { remediation?: string }).remediation || '');
        expect(message).toMatch(/UNCAPTURED_TRUTH|absent from the decisions index/);
        expect(message + remediation).toContain(decision.id);
        expect(message + remediation).toMatch(/docs\/specsmd\/decisions\/index\.md/);
      }
      expect(existsSync(join(root, 'docs/specsmd/decisions', `${decision.id}.md`))).toBe(true);

      const forced = archiveArtifact(root, { kind: 'decision', id: decision.id, force: true });
      expect(forced.override).toBe(true);
      const archived = read(`docs/specsmd/archive/decisions/${decision.id}.md`);
      expect(archived.data.archive_override).toBe(true);
      expect(String(archived.data.archive_override_reason)).toContain(decision.id);
      expect(String(archived.data.archive_override_reason)).toMatch(/decisions\/index\.md/);
    });

    it('leaves statuses, cascade, and the compact index entry unchanged when a bolt is archived', () => {
      const { intent, item } = seed();
      const { bolt } = finishBolt(item.id);
      const compactBefore = readFileSync(join(root, 'docs/specsmd/bolts/index.md'), 'utf8');
      expect(compactBefore).toContain(bolt.id);
      const itemStatus = read(`docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`).data.status;
      const intentStatus = read(`docs/specsmd/intents/${intent.id}/brief.md`).data.status;

      archiveArtifact(root, { kind: 'bolt', id: bolt.id });
      expect(existsSync(join(root, 'docs/specsmd/bolts', bolt.id, 'bolt.md'))).toBe(false);
      expect(existsSync(join(root, 'docs/specsmd/archive/bolts', bolt.id, 'bolt.md'))).toBe(true);
      expect(readFileSync(join(root, 'docs/specsmd/bolts/index.md'), 'utf8')).toBe(compactBefore);
      expect(read(`docs/specsmd/intents/${intent.id}/work-items/${item.id}.md`).data.status).toBe(itemStatus);
      expect(read(`docs/specsmd/intents/${intent.id}/brief.md`).data.status).toBe(intentStatus);
      const report = projectStatus(root);
      expect(report.lenses.shipping.some((s: { id: string }) => s.id === bolt.id)).toBe(true);
    });
  });

  describe('gardening', () => {
    it('reports a system document that contradicts the codebase and does not fix it without consent', () => {
      initProject(root, 'balanced');
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src/auth.js'), 'module.exports = { provider: "session" };\n', 'utf8');
      initSystemDoc(root, {
        id: 'auth',
        name: 'Auth truth',
        purpose: 'How authentication works now',
        claimedScope: 'auth',
        facts: { provider: 'oauth' },
        claims: [{ path: 'src/auth.js', contains: 'oauth' }],
      });
      const before = readFileSync(join(root, 'docs/specsmd/system/auth.md'), 'utf8');
      const result = garden(root, { fix: true });
      const hit = result.findings.find((f: { code: string }) => f.code === 'CONTRADICTS_CODEBASE');
      expect(hit).toBeTruthy();
      expect(hit.remediation).toMatch(/system\/auth\.md/);
      expect(hit.remediation).toMatch(/src\/auth\.js/);
      expect(hit.auto_repairable).toBe(false);
      expect(result.repaired.filter((r: { code: string }) => r.code === 'CONTRADICTS_CODEBASE')).toEqual([]);
      expect(readFileSync(join(root, 'docs/specsmd/system/auth.md'), 'utf8')).toBe(before);
      expect(readFileSync(join(root, 'src/auth.js'), 'utf8')).toContain('session');
    });

    it('detects stale index entries, missing pointers, and past-horizon episodic still hot', () => {
      const { item } = seed();
      const { bolt } = finishBolt(item.id);
      const decision = initDecision(root, { title: 'Keep cookies', consultWhen: 'session storage' });
      const parsed = read(`docs/specsmd/decisions/${decision.id}.md`);
      parsed.data.superseded = true;
      lib.writeMarkdown(parsed.path, parsed.data, parsed.body, root);

      const boltMd = read(`docs/specsmd/bolts/${bolt.id}/bolt.md`);
      boltMd.body = memory.stripHistoricalHeader(boltMd.body);
      boltMd.data.completed = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
      boltMd.data.created = boltMd.data.completed;
      lib.writeMarkdown(boltMd.path, boltMd.data, boltMd.body, root);

      const findings = collectGardenFindings(root);
      expect(findings.some((f: { code: string }) => f.code === 'STALE_INDEX')).toBe(true);
      expect(findings.some((f: { code: string; artifact: string }) => f.code === 'MISSING_POINTER' && f.artifact === bolt.id)).toBe(
        true
      );
      expect(findings.some((f: { code: string; artifact: string }) => f.code === 'PAST_HORIZON' && f.artifact === bolt.id)).toBe(
        true
      );
      const stale = findings.find((f: { code: string }) => f.code === 'STALE_INDEX');
      expect(stale.remediation).toMatch(/decisions\/index\.md/);
      const missing = findings.find((f: { code: string; artifact: string }) => f.code === 'MISSING_POINTER' && f.artifact === bolt.id);
      expect(missing.remediation).toMatch(/Historical record/);
    });
  });

  describe('read path', () => {
    it('directs bootstrap and status at semantic memory first', () => {
      const { item } = seed();
      initSystemDoc(root, {
        id: 'auth',
        name: 'Auth truth',
        purpose: 'How authentication works now',
        claimedScope: 'auth',
      });
      initDecision(root, { title: 'Use OAuth', consultWhen: 'changing authentication' });
      finishBolt(item.id, { touchedScope: 'auth', reviewed: 'auth' });

      const report = projectStatus(root);
      expect(report.read_path.order).toEqual(['system', 'standards', 'decisions_index']);
      expect(report.read_path.system.some((d: { id: string }) => d.id === 'auth')).toBe(true);
      expect(report.read_path.standards.some((s: { id: string }) => s.id === 'nlspec')).toBe(true);
      expect(report.read_path.decisions_index.path).toBe('decisions/index.md');
      expect(report.read_path.guidance).toMatch(/system\//);
      expect(report.read_path.guidance).toMatch(/episodic/i);

      const using = readFileSync(USING, 'utf8');
      const status = readFileSync(STATUS_SKILL, 'utf8');
      expect(using).toMatch(/system\//);
      expect(using).toMatch(/standards\//);
      expect(using).toMatch(/decisions\/index\.md/);
      expect(using).toMatch(/semantic memory first/i);
      expect(status).toMatch(/read_path/);
      expect(status).toMatch(/system\//);
    });
  });
});
