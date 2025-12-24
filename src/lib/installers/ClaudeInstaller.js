const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class ClaudeInstaller extends ToolInstaller {
    get key() {
        return 'claude';
    }

    get name() {
        return 'Claude Code';
    }

    get commandsDir() {
        return path.join('.claude', 'commands');
    }

    get agentsDir() {
        return path.join('.claude', 'agents');
    }

    get detectPath() {
        return '.claude';
    }

    /**
     * Override to install both commands and agents
     */
    async installCommands(flowPath, config) {
        // Install commands (default behavior)
        const installedCommands = await super.installCommands(flowPath, config);

        // Install agents
        const installedAgents = await this.installAgents(flowPath, config);

        return [...installedCommands, ...installedAgents];
    }

    /**
     * Install agents to .claude/agents/
     * Uses the commands folder as source (same files serve as both commands and agents)
     */
    async installAgents(flowPath, config) {
        const targetAgentsDir = this.agentsDir;
        console.log(theme.dim(`  Installing agents to ${targetAgentsDir}/...`));
        await fs.ensureDir(targetAgentsDir);

        const commandsSourceDir = path.join(flowPath, 'commands');

        if (!await fs.pathExists(commandsSourceDir)) {
            console.log(theme.dim(`  No commands folder found at ${commandsSourceDir}`));
            return [];
        }

        const agentFiles = await fs.readdir(commandsSourceDir);
        const installedFiles = [];

        for (const agentFile of agentFiles) {
            if (agentFile.endsWith('.md')) {
                try {
                    const sourcePath = path.join(commandsSourceDir, agentFile);
                    const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                    const targetFileName = `specsmd-${prefix}${agentFile}`;
                    const targetPath = path.join(targetAgentsDir, targetFileName);

                    const content = await fs.readFile(sourcePath, 'utf8');
                    await fs.outputFile(targetPath, content, 'utf8');
                    installedFiles.push(targetFileName);
                } catch (err) {
                    console.log(theme.warning(`  Failed to install agent ${agentFile}: ${err.message}`));
                }
            }
        }

        if (installedFiles.length > 0) {
            CLIUtils.displayStatus('', `Installed ${installedFiles.length} agents for ${this.name}`, 'success');
        }

        return installedFiles;
    }
}

module.exports = ClaudeInstaller;
