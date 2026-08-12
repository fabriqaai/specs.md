import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Validates the Agent Skills plugins under plugins/ against the
 * skill-format rules the port standardized on:
 *  - SKILL.md per skill directory, frontmatter name matches directory
 *  - six spec fields + sanctioned extension (disable-model-invocation)
 *  - trigger-description budgets (portable across tools)
 *  - no legacy .specsmd/ or repo-relative path references
 *  - manifest JSON validity and version sync across manifests + marketplace
 */

const PLUGINS_ROOT = path.resolve(__dirname, '..', '..', 'plugins');
const PLUGIN_NAMES = [
  'specsmd',
  'specsmd-core',
  'specsmd-aidlc',
  'specsmd-fire',
  'specsmd-ideation',
  'specsmd-simple',
];
const MANIFESTS = [
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  'plugin.json',
];
const ALLOWED_KEYS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
  'disable-model-invocation',
]);
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Skill {
  plugin: string;
  dir: string;
  file: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function loadSkills(): Skill[] {
  const skills: Skill[] = [];
  for (const plugin of PLUGIN_NAMES) {
    const skillsDir = path.join(PLUGINS_ROOT, plugin, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(file)) {
        skills.push({ plugin, dir: entry.name, file, frontmatter: {}, body: '' });
        continue;
      }
      const raw = fs.readFileSync(file, 'utf8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      const frontmatter = match
        ? ((yaml.load(match[1]) ?? {}) as Record<string, unknown>)
        : {};
      skills.push({ plugin, dir: entry.name, file, frontmatter, body: match ? match[2] : raw });
    }
  }
  return skills;
}

const skills = loadSkills();

describe('plugins: structure', () => {
  it('finds every listed plugin with at least one skill each', () => {
    for (const plugin of PLUGIN_NAMES) {
      const withSkills = skills.filter((s) => s.plugin === plugin);
      expect(withSkills.length, `${plugin} has no skills`).toBeGreaterThan(0);
    }
  });

  it('every skill directory contains SKILL.md', () => {
    const missing = skills.filter((s) => !fs.existsSync(s.file));
    expect(missing.map((s) => `${s.plugin}/${s.dir}`)).toEqual([]);
  });
});

describe('plugins: SKILL.md frontmatter', () => {
  it('has valid frontmatter with name matching the directory', () => {
    for (const s of skills) {
      expect(s.frontmatter.name, `${s.plugin}/${s.dir}: missing name`).toBe(s.dir);
    }
  });

  it('names follow the spec pattern (lowercase, hyphens, no prefixes)', () => {
    for (const s of skills) {
      const name = String(s.frontmatter.name ?? '');
      expect(name, `${s.plugin}/${s.dir}: bad name "${name}"`).toMatch(NAME_RE);
      expect(name.length, `${s.plugin}/${s.dir}: name too long`).toBeLessThanOrEqual(64);
      expect(name.includes(':') || name.includes('/'), `${s.plugin}/${s.dir}: namespace prefix in name`).toBe(false);
    }
  });

  it('uses only sanctioned frontmatter keys', () => {
    for (const s of skills) {
      const extra = Object.keys(s.frontmatter).filter((k) => !ALLOWED_KEYS.has(k));
      expect(extra, `${s.plugin}/${s.dir}: unsanctioned keys ${extra.join(', ')}`).toEqual([]);
    }
  });

  it('carries metadata.version and metadata.flow', () => {
    for (const s of skills) {
      const metadata = (s.frontmatter.metadata ?? {}) as Record<string, unknown>;
      expect(metadata.version, `${s.plugin}/${s.dir}: metadata.version missing`).toBeTruthy();
      expect(metadata.flow, `${s.plugin}/${s.dir}: metadata.flow missing`).toBeTruthy();
    }
  });

  it('descriptions are trigger-sized', () => {
    for (const s of skills) {
      const description = String(s.frontmatter.description ?? '');
      expect(description.length, `${s.plugin}/${s.dir}: empty description`).toBeGreaterThan(0);
      expect(description.length, `${s.plugin}/${s.dir}: description over spec cap`).toBeLessThanOrEqual(1024);
      const userOnly = s.frontmatter['disable-model-invocation'] === true;
      const budget = userOnly ? 350 : 600;
      expect(
        description.length,
        `${s.plugin}/${s.dir}: description ${description.length} chars exceeds ${budget} budget`
      ).toBeLessThanOrEqual(budget);
    }
  });

  it('keeps the model-invocable description set inside a shared 8k budget', () => {
    const modelVisible = skills.filter((s) => s.frontmatter['disable-model-invocation'] !== true);
    const total = modelVisible.reduce((n, s) => n + String(s.frontmatter.description ?? '').length, 0);
    expect(total, `model-visible descriptions total ${total} chars`).toBeLessThanOrEqual(8000);
  });
});

describe('plugins: SKILL.md body', () => {
  it('starts with an h1', () => {
    for (const s of skills) {
      expect(s.body.trimStart().startsWith('# '), `${s.plugin}/${s.dir}: body must start with h1`).toBe(true);
    }
  });

  it('contains no legacy .specsmd/ or repo-relative path references', () => {
    for (const s of skills) {
      expect(s.body.includes('.specsmd/'), `${s.plugin}/${s.dir}: legacy .specsmd/ path`).toBe(false);
      expect(s.body.includes('src/flows/'), `${s.plugin}/${s.dir}: repo-relative src/flows path`).toBe(false);
    }
  });

  it('referenced bundled files exist (locally or in the named sibling skill)', () => {
    const refRe = /`((?:references|scripts|assets)\/[A-Za-z0-9._\/-]+)`/g;
    const siblingRe = /^[^`]{0,40}?(?:in|with) the `([a-z0-9-]+)` [Ss]kill/;
    for (const s of skills) {
      for (const match of s.body.matchAll(refRe)) {
        const rel = match[1];
        if (/[{}*<>]/.test(rel)) continue; // pattern placeholders like {bolt_type}
        // Cross-skill idiom: "`references/x` in the `other-skill` skill" resolves
        // against the named sibling skill's directory in the same plugin.
        const tail = s.body.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 60);
        const sibling = tail.match(siblingRe);
        const baseDir = sibling
          ? path.join(PLUGINS_ROOT, s.plugin, 'skills', sibling[1])
          : path.dirname(s.file);
        const target = path.join(baseDir, rel);
        expect(
          fs.existsSync(target),
          `${s.plugin}/${s.dir}: missing bundled file ${rel}${sibling ? ` (in sibling skill ${sibling[1]})` : ''}`
        ).toBe(true);
      }
    }
  });
});

describe('plugins: manifests and marketplace', () => {
  const marketplacePath = path.join(PLUGINS_ROOT, '.claude-plugin', 'marketplace.json');
  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));

  it('marketplace lists every plugin with a relative source', () => {
    const listed = marketplace.plugins.map((p: { name: string }) => p.name).sort();
    expect(listed).toEqual([...PLUGIN_NAMES].sort());
    for (const entry of marketplace.plugins) {
      expect(entry.source.startsWith('./'), `${entry.name}: source must be relative`).toBe(true);
    }
  });

  it('repo-root marketplace declares pluginRoot so Claude resolves plugins/', () => {
    const rootMarketPath = path.resolve(__dirname, '..', '..', '.claude-plugin', 'marketplace.json');
    expect(fs.existsSync(rootMarketPath), 'missing .claude-plugin/marketplace.json at repo root').toBe(true);
    const rootMarket = JSON.parse(fs.readFileSync(rootMarketPath, 'utf8'));
    expect(rootMarket.metadata.pluginRoot).toBe('./plugins');
    const listed = rootMarket.plugins.map((p: { name: string }) => p.name).sort();
    expect(listed).toEqual([...PLUGIN_NAMES].sort());
  });

  it('lists specsmd first and keeps both marketplace plugin lists in sync', () => {
    const rootMarketPath = path.resolve(__dirname, '..', '..', '.claude-plugin', 'marketplace.json');
    const rootMarket = JSON.parse(fs.readFileSync(rootMarketPath, 'utf8'));
    const pick = (p: { name: string; source: string; version: string; description: string }) => ({
      name: p.name,
      source: p.source,
      version: p.version,
      description: p.description,
    });
    expect(marketplace.plugins[0].name).toBe('specsmd');
    expect(rootMarket.plugins[0].name).toBe('specsmd');
    expect(rootMarket.plugins.map(pick)).toEqual(marketplace.plugins.map(pick));
  });

  it('ships bootstrap and navigator inside specsmd with no specsmd-core dependency', () => {
    const names = skills.filter((s) => s.plugin === 'specsmd').map((s) => s.dir);
    expect(names).toEqual(expect.arrayContaining(['using-specsmd', 'specsmd-status']));
    const invocable = skills
      .filter((s) => s.plugin === 'specsmd' && s.frontmatter['disable-model-invocation'] !== true)
      .map((s) => s.dir)
      .sort();
    expect(invocable).toEqual(['specsmd-status', 'using-specsmd']);
    const pluginJson = fs.readFileSync(path.join(PLUGINS_ROOT, 'specsmd', 'plugin.json'), 'utf8');
    expect(pluginJson).not.toMatch(/specsmd-core/);
  });

  it('documents the marketplace-less copy into .agents/skills/', () => {
    const readme = fs.readFileSync(path.join(PLUGINS_ROOT, 'README.md'), 'utf8');
    expect(readme).toMatch(/cp -R plugins\/specsmd\/skills\/\* \.agents\/skills\//);
  });

  it('root plugin.json conforms to the Agent Plugins spec (closed schema, $schema required)', () => {
    const allowed = new Set([
      '$schema', 'name', 'version', 'description', 'author',
      'homepage', 'repository', 'license', 'keywords', 'extensions',
    ]);
    for (const plugin of PLUGIN_NAMES) {
      const json = JSON.parse(fs.readFileSync(path.join(PLUGINS_ROOT, plugin, 'plugin.json'), 'utf8'));
      expect(json.$schema, `${plugin}: $schema required by Agent Plugins spec`).toBe(
        'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
      );
      const extra = Object.keys(json).filter((k) => !allowed.has(k));
      expect(extra, `${plugin}: non-spec fields in root plugin.json: ${extra.join(', ')}`).toEqual([]);
      const authorKeys = Object.keys(json.author ?? {}).filter((k) => !['name', 'email', 'url'].includes(k));
      expect(authorKeys, `${plugin}: invalid author fields`).toEqual([]);
    }
  });

  it('all four manifests exist per plugin, parse, and agree on name + version', () => {
    for (const plugin of PLUGIN_NAMES) {
      const versions = new Set<string>();
      for (const rel of MANIFESTS) {
        const file = path.join(PLUGINS_ROOT, plugin, rel);
        expect(fs.existsSync(file), `${plugin}/${rel} missing`).toBe(true);
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));
        expect(json.name).toBe(plugin);
        versions.add(json.version);
      }
      expect(versions.size, `${plugin}: manifest versions disagree`).toBe(1);
      const marketEntry = marketplace.plugins.find((p: { name: string }) => p.name === plugin);
      expect(marketEntry.version, `${plugin}: marketplace version out of sync`).toBe([...versions][0]);
    }
  });
});
