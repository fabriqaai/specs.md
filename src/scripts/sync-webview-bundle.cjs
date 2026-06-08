#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..');
const extensionBundle = path.join(repoRoot, 'vs-code-extension', 'dist', 'webview', 'bundle.js');
const packagedBundle = path.join(packageRoot, 'lib', 'dashboard', 'web', 'public', 'webview-bundle.js');

if (!fs.existsSync(extensionBundle)) {
  console.error(`Missing VS Code webview bundle: ${extensionBundle}`);
  console.error('Run `npm run compile:webview` in vs-code-extension first.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(packagedBundle), { recursive: true });
fs.copyFileSync(extensionBundle, packagedBundle);
console.log(`Synced ${path.relative(repoRoot, packagedBundle)} from ${path.relative(repoRoot, extensionBundle)}.`);
