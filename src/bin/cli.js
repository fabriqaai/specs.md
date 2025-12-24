#!/usr/bin/env node

const { program } = require('commander');
const installer = require('../lib/installer');
const packageJson = require('../package.json');

program
    .version(packageJson.version)
    .description(packageJson.description);

program
    .command('install')
    .description('Interactively install a specsmd flow')
    .action(installer.install);

program
    .command('uninstall')
    .description('Uninstall specsmd from the current project')
    .action(installer.uninstall);

program.parse(process.argv);
