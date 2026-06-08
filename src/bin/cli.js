#!/usr/bin/env node

const { program } = require('commander');
const installer = require('../lib/installer');
const dashboard = require('../lib/dashboard');
const dashboardWeb = require('../lib/dashboard/web/server');
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
    .description('Local web dashboard for flow state')
    .option('--flow <flow>', 'Flow to inspect (fire|aidlc|simple), default auto-detect')
    .option('--path <dir>', 'Workspace path', process.cwd())
    .option('--host <host>', 'Host to bind (default: 127.0.0.1)', '127.0.0.1')
    .option('--port <n>', 'Port to bind (default: random available port)', '0')
    .option('--refresh-ms <n>', 'Fallback refresh interval in milliseconds (reserved for compatibility)', '1000')
    .option('--no-watch', 'Disable file watching')
    .option('--no-open', 'Do not open the dashboard in a browser automatically')
    .action((options) => dashboardWeb.run(options));

program
    .command('dashboard-cli')
    .description('Live terminal dashboard for flow state')
    .option('--flow <flow>', 'Flow to inspect (fire|aidlc|simple), default auto-detect')
    .option('--path <dir>', 'Workspace path', process.cwd())
    .option('--worktree <nameOrPath>', 'Initial git worktree (branch name, worktree name, id, or absolute path)')
    .option('--refresh-ms <n>', 'Fallback refresh interval in milliseconds (default: 1000)', '1000')
    .option('--no-watch', 'Render once and exit')
    .action((options) => dashboard.run(options));

program.parseAsync(process.argv).catch((error) => {
    console.error(error.message);
    process.exit(1);
});
