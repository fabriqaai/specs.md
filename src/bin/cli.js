#!/usr/bin/env node

const { program } = require('commander');
const installer = require('../lib/installer');
const dashboard = require('../lib/dashboard');
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

program
    .command('dashboard')
    .description('Live terminal dashboard for flow state (FIRE first)')
    .option('--flow <flow>', 'Flow to inspect (fire|aidlc|simple), default auto-detect')
    .option('--path <dir>', 'Workspace path', process.cwd())
    .option('--refresh-ms <n>', 'Fallback refresh interval in milliseconds (default: 1000)', '1000')
    .option('--no-watch', 'Render once and exit')
    .action((options) => dashboard.run(options));

program.parseAsync(process.argv).catch((error) => {
    console.error(error.message);
    process.exit(1);
});
