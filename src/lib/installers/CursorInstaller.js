const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class CursorInstaller extends ToolInstaller {
    get key() {
        return 'cursor';
    }

    get name() {
        return 'Cursor';
    }

    get commandsDir() {
        return path.join('.cursor', 'commands');
    }

    get detectPath() {
        return '.cursor';
    }

    /**
     * Override to install commands as .md files to .cursor/commands
     */
    async installCommands(flowPath, config) {
        const targetCommandsDir = this.commandsDir;
        console.log(theme.dim(`  Installing commands to ${targetCommandsDir}/...`));
        await fs.ensureDir(targetCommandsDir);

        const commandsSourceDir = path.join(flowPath, 'commands');

        if (!await fs.pathExists(commandsSourceDir)) {
            console.log(theme.warning(`  No commands folder found at ${commandsSourceDir}`));
            return [];
        }

        const commandFiles = await fs.readdir(commandsSourceDir);
        const installedFiles = [];

        for (const cmdFile of commandFiles) {
            if (cmdFile.endsWith('.md')) {
                const sourcePath = path.join(commandsSourceDir, cmdFile);
                const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';

                // Keep .md extension for Cursor commands
                const targetFileName = `specsmd-${prefix}${cmdFile}`;
                const targetPath = path.join(targetCommandsDir, targetFileName);

                // Copy content directly without adding frontmatter
                const content = await fs.readFile(sourcePath, 'utf8');
                await fs.writeFile(targetPath, content);
                installedFiles.push(targetFileName);
            }
        }

        CLIUtils.displayStatus('', `Installed ${installedFiles.length} commands for ${this.name}`, 'success');
        return installedFiles;
    }
}

module.exports = CursorInstaller;
