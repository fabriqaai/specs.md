#!/usr/bin/env node
/**
 * Propagates a single version to every plugin manifest and the marketplace.
 * Usage: node plugins/scripts/bump-version.cjs <new-version> [plugin-name]
 * Without plugin-name, bumps all plugins and the marketplace metadata.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLUGINS = ['specsmd', 'specsmd-core', 'specsmd-aidlc', 'specsmd-fire', 'specsmd-ideation', 'specsmd-simple'];
const MANIFESTS = ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', 'plugin.json'];

const version = process.argv[2];
const only = process.argv[3];

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('Usage: bump-version.cjs <semver> [plugin-name]');
  process.exit(1);
}
if (only && !PLUGINS.includes(only)) {
  console.error(`Unknown plugin "${only}". Known: ${PLUGINS.join(', ')}`);
  process.exit(1);
}

const targets = only ? [only] : PLUGINS;
let changed = 0;

for (const plugin of targets) {
  for (const rel of MANIFESTS) {
    const file = path.join(ROOT, plugin, rel);
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    json.version = version;
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
    changed++;
  }
}

const marketFiles = [
  path.join(ROOT, '.claude-plugin', 'marketplace.json'),
  path.join(ROOT, '..', '.claude-plugin', 'marketplace.json'),
];
for (const marketFile of marketFiles) {
  if (!fs.existsSync(marketFile)) continue;
  const market = JSON.parse(fs.readFileSync(marketFile, 'utf8'));
  for (const entry of market.plugins) {
    if (targets.includes(entry.name)) entry.version = version;
  }
  if (!only) market.metadata.version = version;
  fs.writeFileSync(marketFile, JSON.stringify(market, null, 2) + '\n');
  changed++;
}

console.log(`Set version ${version} on ${targets.join(', ')} (${changed} files).`);
