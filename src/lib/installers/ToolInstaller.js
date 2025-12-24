const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

/**
 * Base class for Agentic Coding Tool Installers
 */
class ToolInstaller {
    constructor() {
        if (this.constructor === ToolInstaller) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    get key() {
        throw new Error("Method 'key' must be implemented.");
    }

    get name() {
        throw new Error("Method 'name' must be implemented.");
    }

    get commandsDir() {
        throw new Error("Method 'commandsDir' must be implemented.");
    }

    get detectPath() {
        throw new Error("Method 'detectPath' must be implemented.");
    }

    async detect() {
        return await fs.pathExists(this.detectPath);
    }

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
                try {
                    const sourcePath = path.join(commandsSourceDir, cmdFile);
                    const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                    const targetFileName = `specsmd-${prefix}${cmdFile}`;
                    const targetPath = path.join(targetCommandsDir, targetFileName);

                    const content = await fs.readFile(sourcePath, 'utf8');
                    await fs.outputFile(targetPath, content, 'utf8');
                    installedFiles.push(targetFileName);
                } catch (err) {
                    console.log(theme.warning(`  Failed to install ${cmdFile}: ${err.message}`));
                }
            }
        }

        CLIUtils.displayStatus('', `Installed ${installedFiles.length} commands for ${this.name}`, 'success');
        return installedFiles;
    }
}

module.exports = ToolInstaller;
