#!/usr/bin/env node

/**
 * Flow scripts are copied into user projects (.specsmd/<flow>/...), where the
 * specsmd package's node_modules can't be resolved. The YAML library each flow
 * uses is bundled into a single file next to its scripts instead.
 *
 * Run `npm run vendor:flow-deps` after updating js-yaml, yaml or esbuild.
 * __tests__/unit/flow-consistency/standalone-scripts.test.ts fails while the
 * vendored files are out of date.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const packageRoot = path.resolve(__dirname, '..');

const VENDORED = [
  { pkg: 'js-yaml', out: 'flows/aidlc/scripts/vendor/js-yaml.cjs' },
  { pkg: 'yaml', out: 'flows/fire/agents/builder/skills/run-execute/scripts/vendor/yaml.cjs' },
];

function renderVendored(pkg) {
  const pkgJsonPath = require.resolve(`${pkg}/package.json`, { paths: [packageRoot] });
  const { version } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const license = fs.readFileSync(path.join(path.dirname(pkgJsonPath), 'LICENSE'), 'utf8').trim();

  const { outputFiles } = esbuild.buildSync({
    absWorkingDir: packageRoot,
    entryPoints: [require.resolve(pkg, { paths: [packageRoot] })],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    minify: true,
    legalComments: 'none',
    write: false,
  });

  const header = [
    `/*! ${pkg}@${version}, bundled by src/scripts/vendor-flow-deps.cjs. Do not edit.`,
    '',
    license,
    '*/',
  ].join('\n');

  return `${header}\n${outputFiles[0].text}`;
}

if (require.main === module) {
  for (const { pkg, out } of VENDORED) {
    const outPath = path.join(packageRoot, out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, renderVendored(pkg));
    console.log(`Vendored ${pkg} -> ${out}`);
  }
}

module.exports = { VENDORED, renderVendored };
