const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class WindsurfInstaller extends ToolInstaller {
    get key() {
        return 'windsurf';
    }

    get name() {
        return 'Windsurf';
    }

    get commandsDir() {
        return path.join('.windsurf', 'workflows');
    }

    get detectPath() {
        return '.windsurf';
    }

    /**
     * Override to add frontmatter for Windsurf workflows
     */
    async installCommands(flowPath, config) {
        const targetCommandsDir = this.commandsDir;
        console.log(theme.dim(`  Installing workflows to ${targetCommandsDir}/...`));
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

                const targetFileName = `specsmd-${prefix}${cmdFile}`;
                const targetPath = path.join(targetCommandsDir, targetFileName);

                // Extract agent name from target filename (e.g., "specsmd-master-agent.md" -> "specsmd-master-agent")
                const agentName = targetFileName.replace(/\.md$/, '');

                // Read source content and add Windsurf frontmatter
                let content = await fs.readFile(sourcePath, 'utf8');

                // Add Windsurf-specific frontmatter if not present
                if (!content.startsWith('---')) {
                    const frontmatter = `---
description: ${agentName}
---

`;
                    content = frontmatter + content;
                }

                await fs.writeFile(targetPath, content);
                installedFiles.push(targetFileName);
            }
        }

        CLIUtils.displayStatus('', `Installed ${installedFiles.length} workflows for ${this.name}`, 'success');
        return installedFiles;
    }
}

module.exports = WindsurfInstaller;
