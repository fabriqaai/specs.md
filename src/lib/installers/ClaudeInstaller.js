const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { FLOWS } = require('../constants');

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

    /**
     * Older versions also copied every command file into .claude/agents/.
     * Those copies have no `name:` frontmatter, so Claude Code skips them, and
     * subagents can't hold the checkpoint conversations the flow agents need.
     * Slash commands are the only Claude Code entry point.
     */
    get legacyAgentsDir() {
        return path.join('.claude', 'agents');
    }

    get detectPath() {
        return '.claude';
    }

    async installCommands(flowPath, config) {
        const installedCommands = await super.installCommands(flowPath, config);
        await this.removeLegacyFiles();
        return installedCommands;
    }

    /**
     * Remove the .claude/agents/ copies written by older versions.
     * Only file names that a flow command produces are removed.
     */
    async removeLegacyFiles() {
        const agentsDir = this.legacyAgentsDir;
        if (!await fs.pathExists(agentsDir)) {
            return [];
        }

        const legacyNames = new Set();
        for (const flow of Object.values(FLOWS)) {
            const commandsSourceDir = path.join(__dirname, '..', '..', 'flows', flow.path, 'commands');
            if (!await fs.pathExists(commandsSourceDir)) continue;
            for (const cmdFile of await fs.readdir(commandsSourceDir)) {
                if (cmdFile.endsWith('.md')) {
                    legacyNames.add(`specsmd-${cmdFile}`);
                }
            }
        }

        const removedFiles = [];
        for (const file of await fs.readdir(agentsDir)) {
            if (legacyNames.has(file)) {
                await fs.remove(path.join(agentsDir, file));
                removedFiles.push(file);
            }
        }

        if (removedFiles.length > 0) {
            CLIUtils.displayStatus('', `Removed ${removedFiles.length} legacy agent files from ${agentsDir}/`, 'success');
        }

        return removedFiles;
    }
}

module.exports = ClaudeInstaller;
