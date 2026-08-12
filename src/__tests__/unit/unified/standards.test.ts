/**
 * Hierarchical standards: override rules, constitution immunity, deterministic resolution.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const SCRIPTS = join(__dirname, '../../../../plugins/specsmd/skills/flow-runtime/scripts');
const REFERENCES = join(SCRIPTS, '../references');
const TEMPLATES = join(REFERENCES, 'standards');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require(join(SCRIPTS, 'lib.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const standards = require(join(SCRIPTS, 'standards.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initProject } = require(join(SCRIPTS, 'init-project.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { recordStandards } = require(join(SCRIPTS, 'record-standards.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveStandards } = require(join(SCRIPTS, 'resolve-standards.cjs'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { reportViolation } = require(join(SCRIPTS, 'report-violation.cjs'));

function runScript(script: string, args: string[]) {
  return spawnSync(process.execPath, [join(SCRIPTS, script), ...args], {
    encoding: 'utf8',
  });
}

function writeStd(
  root: string,
  id: string,
  opts: { scope?: string; invariant?: string; body?: string } = {}
) {
  const scope = opts.scope || 'root';
  const file = standards.standardPath(root, id, scope, lib.loadContract());
  mkdirSync(join(file, '..'), { recursive: true });
  const invariant = opts.invariant || `${id} invariant at ${scope}`;
  writeFileSync(
    file,
    [
      '---',
      `id: ${id}`,
      `title: ${id}`,
      'status: active',
      `kind: ${id === 'constitution' ? 'constitution' : 'overridable'}`,
      `override: ${id === 'constitution' ? 'never' : 'allowed'}`,
      'enforcement_tier: principle',
      `invariant: "${invariant}"`,
      `remediation: "In {file}, {change} so ${id} holds."`,
      'created: "2026-08-13T00:00:00Z"',
      '---',
      '',
      opts.body || `# ${id}\n`,
    ].join('\n'),
    'utf8'
  );
  return file;
}

describe('standards system', () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `specsmd-std-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(root, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  describe('templates', () => {
    it('ships each template with invariant, enforcement tier, and remediation phrasing', () => {
      const ids = readdirSync(TEMPLATES)
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.replace(/\.md$/, ''))
        .sort();
      expect(ids).toEqual(['architecture', 'coding', 'constitution', 'tech-stack', 'testing']);
      const tiers = ['principle', 'review', 'mechanical'];
      for (const id of ids) {
        const parsed = lib.parseFrontmatter(readFileSync(join(TEMPLATES, `${id}.md`), 'utf8'));
        expect(parsed.data.invariant, `${id} invariant`).toBeTruthy();
        expect(tiers, `${id} tier`).toContain(parsed.data.enforcement_tier);
        expect(String(parsed.data.remediation), `${id} remediation`).toMatch(/\{file\}/);
        expect(String(parsed.data.remediation), `${id} change`).toMatch(/\{change\}/);
      }
      const nlspec = lib.parseFrontmatter(readFileSync(join(REFERENCES, 'nlspec.md'), 'utf8'));
      expect(nlspec.data.invariant).toBeTruthy();
      expect(tiers).toContain(nlspec.data.enforcement_tier);
      expect(String(nlspec.data.remediation)).toMatch(/\{file\}/);
    });
  });

  describe('initialization', () => {
    it('completes an empty project with exactly one required question and records template standards', () => {
      const result = initProject(root, 'balanced');
      expect(result.required_questions).toEqual(['autonomy_bias']);
      expect(result.workspace.kind).toBe('greenfield');
      expect(result.workspace.structure).toBe('single');
      expect(result.standards.pending_confirmation).toEqual([]);
      expect(existsSync(join(root, 'docs/specsmd/standards/constitution.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/tech-stack.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/coding.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/testing.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/architecture.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/nlspec.md'))).toBe(true);
    });

    it('detects an existing monorepo and does not record inferred standards until confirmation', () => {
      writeFileSync(
        join(root, 'package.json'),
        JSON.stringify({ name: 'app', workspaces: ['packages/*'] }),
        'utf8'
      );
      mkdirSync(join(root, 'packages/api'), { recursive: true });
      mkdirSync(join(root, 'packages/web'), { recursive: true });
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'packages/api/package.json'), JSON.stringify({ name: 'api' }), 'utf8');
      writeFileSync(join(root, 'packages/web/package.json'), JSON.stringify({ name: 'web' }), 'utf8');
      writeFileSync(join(root, 'tsconfig.json'), '{}', 'utf8');
      writeFileSync(join(root, 'src/index.ts'), 'export {}\n', 'utf8');

      const result = initProject(root, 'controlled');
      expect(result.required_questions).toEqual(['autonomy_bias']);
      expect(result.workspace.kind).toBe('existing');
      expect(result.workspace.structure).toBe('monorepo');
      expect(result.workspace.modules.map((m: { path: string }) => m.path)).toEqual([
        'packages/api',
        'packages/web',
      ]);
      expect(result.standards.pending_confirmation.length).toBeGreaterThan(0);
      expect(result.standards.pending_confirmation.every((p: { id: string }) => p.id !== 'constitution')).toBe(
        true
      );
      expect(existsSync(join(root, 'docs/specsmd/standards/constitution.md'))).toBe(true);
      expect(existsSync(join(root, 'docs/specsmd/standards/tech-stack.md'))).toBe(false);
      expect(existsSync(join(root, 'docs/specsmd/standards/coding.md'))).toBe(false);

      const recorded = recordStandards(root, {});
      expect(existsSync(join(root, 'docs/specsmd/standards/tech-stack.md'))).toBe(true);
      expect(recorded.recorded.some((r: { id: string }) => r.id === 'tech-stack')).toBe(true);
    });

    it('records edited inferred standards from the confirmation payload, not silently', () => {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }), 'utf8');
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src/index.ts'), 'export {}\n', 'utf8');
      writeFileSync(join(root, 'tsconfig.json'), '{}', 'utf8');
      const first = initProject(root, 'balanced');
      expect(first.standards.pending_confirmation.length).toBeGreaterThan(0);
      recordStandards(root, {
        standards: [
          {
            id: 'tech-stack',
            scope: 'root',
            invariant: 'New work uses TypeScript on Node.',
            enforcement_tier: 'principle',
          },
        ],
      });
      const md = lib.readMarkdown(join(root, 'docs/specsmd/standards/tech-stack.md'));
      expect(md.data.invariant).toBe('New work uses TypeScript on Node.');
      expect(existsSync(join(root, 'docs/specsmd/standards/coding.md'))).toBe(false);
    });
  });

  describe('resolution', () => {
    function seedMonorepo() {
      initProject(root, 'balanced');
      writeStd(root, 'tech-stack', { invariant: 'root stack' });
      writeStd(root, 'coding', { invariant: 'root coding' });
      writeStd(root, 'testing', { invariant: 'root testing' });
      writeStd(root, 'architecture', { invariant: 'root architecture' });
      writeStd(root, 'tech-stack', { scope: 'packages/api', invariant: 'api stack' });
      writeStd(root, 'coding', { scope: 'packages/api', invariant: 'api coding' });
      writeStd(root, 'constitution', { scope: 'packages/api', invariant: 'rogue constitution' });
      writeStd(root, 'tech-stack', { scope: 'packages/web', invariant: 'web stack' });
      mkdirSync(join(root, 'packages/api/src'), { recursive: true });
      mkdirSync(join(root, 'packages/web/src'), { recursive: true });
      mkdirSync(join(root, 'scripts'), { recursive: true });
      writeFileSync(join(root, 'packages/api/src/handler.ts'), 'export {}\n', 'utf8');
      writeFileSync(join(root, 'packages/web/src/app.ts'), 'export {}\n', 'utf8');
      writeFileSync(join(root, 'scripts/deploy.sh'), '#!/bin/sh\n', 'utf8');
    }

    it('lets a module standard override the root standard for that module’s files', () => {
      seedMonorepo();
      const api = resolveStandards(root, 'packages/api/src/handler.ts');
      const tech = api.standards.find((s: { id: string }) => s.id === 'tech-stack');
      const coding = api.standards.find((s: { id: string }) => s.id === 'coding');
      const testing = api.standards.find((s: { id: string }) => s.id === 'testing');
      expect(tech.scope).toBe('packages/api');
      expect(tech.invariant).toBe('api stack');
      expect(tech.won_because).toMatch(/nearest scope packages\/api/);
      expect(coding.scope).toBe('packages/api');
      expect(testing.scope).toBe('root');
      expect(testing.won_because).toMatch(/no nearer scope than root/);
    });

    it('never overrides the constitution, even when a module file exists', () => {
      seedMonorepo();
      const api = resolveStandards(root, 'packages/api/src/handler.ts');
      const web = resolveStandards(root, 'packages/web/src/app.ts');
      const rootFile = resolveStandards(root, 'scripts/deploy.sh');
      for (const result of [api, web, rootFile]) {
        const constitution = result.standards.find((s: { id: string }) => s.id === 'constitution');
        expect(constitution.scope).toBe('root');
        expect(constitution.won_because).toBe('constitution is never overridden; root always wins');
        expect(constitution.path).toBe('docs/specsmd/standards/constitution.md');
        expect(constitution.invariant).not.toBe('rogue constitution');
      }
      expect(api.standards.find((s: { id: string }) => s.id === 'constitution').ignored_overrides).toEqual([
        {
          scope: 'packages/api',
          path: 'docs/specsmd/standards/scopes/packages/api/constitution.md',
          reason: 'constitution is never overridden; root always wins',
        },
      ]);
      expect(() =>
        standards.writeStandard(
          root,
          { id: 'constitution', scope: 'packages/web', invariant: 'nope' },
          lib.loadContract()
        )
      ).toThrow(/CONSTITUTION_IMMUNE|cannot be recorded at module scope/i);
    });

    it('is deterministic and explainable for every file in a monorepo test tree', () => {
      seedMonorepo();
      const files = ['packages/api/src/handler.ts', 'packages/web/src/app.ts', 'scripts/deploy.sh'];
      for (const file of files) {
        const a = resolveStandards(root, file);
        const b = resolveStandards(root, file);
        expect(a).toEqual(b);
        expect(a.file).toBe(file);
        expect(a.scopes_considered[0]).toBeTruthy();
        expect(a.scopes_considered.some((s: { id: string }) => s.id === 'root')).toBe(true);
        const ids = a.standards.map((s: { id: string }) => s.id);
        expect(ids).toEqual([...ids].sort());
        for (const std of a.standards) {
          expect(std.won_because).toBeTruthy();
          expect(std.path).toBeTruthy();
          expect(std.scope).toBeTruthy();
        }
      }
      const api = resolveStandards(root, 'packages/api/src/handler.ts');
      expect(api.scopes_considered.map((s: { id: string }) => s.id)).toEqual(['packages/api', 'root']);
      const web = resolveStandards(root, 'packages/web/src/app.ts');
      expect(web.standards.find((s: { id: string }) => s.id === 'tech-stack').scope).toBe('packages/web');
      expect(web.standards.find((s: { id: string }) => s.id === 'coding').scope).toBe('root');
      const script = resolveStandards(root, 'scripts/deploy.sh');
      expect(script.standards.find((s: { id: string }) => s.id === 'tech-stack').scope).toBe('root');
    });
  });

  describe('violations', () => {
    it('reports a violation as a remediation naming the standard, the file, and the change', () => {
      initProject(root, 'balanced');
      const result = reportViolation(root, {
        standard: 'constitution',
        file: 'src/secret.ts',
        change: 'remove the committed API key',
      });
      expect(result.remediation).toContain('constitution');
      expect(result.remediation).toContain('src/secret.ts');
      expect(result.remediation).toContain('remove the committed API key');
    });
  });

  describe('cli', () => {
    it('refuses to record inferred standards without confirmation', () => {
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'app' }), 'utf8');
      mkdirSync(join(root, 'src'), { recursive: true });
      writeFileSync(join(root, 'src/index.js'), 'module.exports = {}\n', 'utf8');
      initProject(root, 'balanced');
      const refused = runScript('record-standards.cjs', [root]);
      expect(refused.status).toBe(2);
      expect(refused.stdout).toMatch(/CONFIRM_REQUIRED|without confirmation/i);
      const resolved = runScript('resolve-standards.cjs', [root, '--file', 'src/index.js']);
      expect(resolved.status).toBe(0);
      const payload = JSON.parse(resolved.stdout);
      expect(payload.ok).toBe(true);
      expect(payload.data.file).toBe('src/index.js');
    });
  });
});
