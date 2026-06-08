#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..');
const extensionBundle = path.join(repoRoot, 'vs-code-extension', 'dist', 'webview', 'bundle.js');
const packagedBundle = path.join(packageRoot, 'lib', 'dashboard', 'web', 'public', 'webview-bundle.js');

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

if (!fs.existsSync(extensionBundle)) {
  console.error(`Missing VS Code webview bundle: ${extensionBundle}`);
  console.error('Run `npm run compile:webview` in vs-code-extension first.');
  process.exit(1);
}

if (!fs.existsSync(packagedBundle)) {
  console.error(`Missing packaged dashboard web bundle: ${packagedBundle}`);
  process.exit(1);
}

const extensionHash = hashFile(extensionBundle);
const packagedHash = hashFile(packagedBundle);

if (extensionHash !== packagedHash) {
  console.error('Dashboard web bundle is out of sync with the VS Code webview bundle.');
  console.error(`extension: ${extensionHash}`);
  console.error(`packaged:  ${packagedHash}`);
  console.error('Run `npm run sync:webview-bundle` from src/.');
  process.exit(1);
}

console.log('Dashboard web bundle is synced with the VS Code webview bundle.');
