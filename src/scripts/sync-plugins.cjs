#!/usr/bin/env node
/**
 * Copies the repo-root plugins/ tree into src/plugins/ so `npm pack` ships it
 * with the package (the `specsmd skills` command installs from it).
 * Runs at prepack; src/plugins/ is generated output and is gitignored.
 */
const fs = require('fs-extra');
const path = require('path');

const source = path.resolve(__dirname, '..', '..', 'plugins');
const target = path.resolve(__dirname, '..', 'plugins');

if (!fs.existsSync(source)) {
    console.error(`plugins source not found: ${source}`);
    process.exit(1);
}

fs.removeSync(target);
fs.copySync(source, target);
console.log(`Synced plugins -> ${target}`);
