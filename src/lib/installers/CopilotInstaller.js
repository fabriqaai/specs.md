const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class CopilotInstaller extends ToolInstaller {
    get key() {
        return 'copilot';
    }

    get name() {
        return 'GitHub Copilot';
    }

    get commandsDir() {
        return path.join('.github', 'prompts');
    }

    get agentsDir() {
        return path.join('.github', 'agents');
    }

    get detectPath() {
        return '.github';
    }

    /**
     * Override to install both commands and agents
     */
    async installCommands(flowPath, config) {
        const installedCommands = await this.installCommandFiles(flowPath, config);
        const installedAgents = await this.installAgentFiles(flowPath, config);
        return [...installedCommands, ...installedAgents];
    }

    /**
     * Install prompts to .github/prompts/ with .prompt.md extension
     */
    async installCommandFiles(flowPath, config) {
        const targetDir = this.commandsDir;
        console.log(theme.dim(`  Installing prompts to ${targetDir}/...`));
        await fs.ensureDir(targetDir);

        const sourceDir = path.join(flowPath, 'commands');

        if (!await fs.pathExists(sourceDir)) {
            console.log(theme.dim(`  No commands folder found at ${sourceDir}`));
            return [];
        }

        const files = await fs.readdir(sourceDir);
        const installedFiles = [];

        for (const file of files) {
            if (file.endsWith('.md')) {
                const sourcePath = path.join(sourceDir, file);
                const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                // Transform .md to .prompt.md for Copilot prompts
                const targetFileName = `specsmd-${prefix}${file}`.replace(/\.md$/, '.prompt.md');
                const targetPath = path.join(targetDir, targetFileName);

                await fs.copy(sourcePath, targetPath);
                installedFiles.push(targetFileName);
            }
        }

        if (installedFiles.length > 0) {
            CLIUtils.displayStatus('', `Installed ${installedFiles.length} prompts for ${this.name}`, 'success');
        }
        return installedFiles;
    }

    /**
     * Install agents to .github/agents/ with .agent.md extension
     * Uses the commands folder as source (same files serve as both commands and agents)
     */
    async installAgentFiles(flowPath, config) {
        const targetDir = this.agentsDir;
        console.log(theme.dim(`  Installing agents to ${targetDir}/...`));
        await fs.ensureDir(targetDir);

        const sourceDir = path.join(flowPath, 'commands');

        if (!await fs.pathExists(sourceDir)) {
            console.log(theme.dim(`  No commands folder found at ${sourceDir}`));
            return [];
        }

        const files = await fs.readdir(sourceDir);
        const installedFiles = [];

        for (const file of files) {
            if (file.endsWith('.md')) {
                const sourcePath = path.join(sourceDir, file);
                const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                // Transform .md to .agent.md for Copilot agents
                const targetFileName = `specsmd-${prefix}${file}`.replace(/\.md$/, '.agent.md');
                const targetPath = path.join(targetDir, targetFileName);

                await fs.copy(sourcePath, targetPath);
                installedFiles.push(targetFileName);
            }
        }

        if (installedFiles.length > 0) {
            CLIUtils.displayStatus('', `Installed ${installedFiles.length} agents for ${this.name}`, 'success');
        }
        return installedFiles;
    }
}

module.exports = CopilotInstaller;
