const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class GeminiInstaller extends ToolInstaller {
    get key() {
        return 'gemini';
    }

    get name() {
        return 'Gemini CLI';
    }

    get commandsDir() {
        return path.join('.gemini', 'commands');
    }

    get detectPath() {
        return '.gemini';
    }

    /**
     * Override to convert markdown to TOML format for Gemini CLI
     */
    async installCommands(flowPath, config) {
        const targetDir = this.commandsDir;
        console.log(theme.dim(`  Installing commands to ${targetDir}/...`));
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

                // Transform .md to .toml for Gemini CLI
                const targetFileName = `specsmd-${prefix}${file}`.replace(/\.md$/, '.toml');
                const targetPath = path.join(targetDir, targetFileName);

                // Read source content
                const content = await fs.readFile(sourcePath, 'utf8');

                // Extract description from filename (e.g., "master-agent" -> "Master Agent")
                const agentName = file.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                // Convert to TOML format
                const tomlContent = `description = "specsmd ${agentName}"
prompt = """
${content}
"""`;

                await fs.writeFile(targetPath, tomlContent);
                installedFiles.push(targetFileName);
            }
        }

        if (installedFiles.length > 0) {
            CLIUtils.displayStatus('', `Installed ${installedFiles.length} commands for ${this.name}`, 'success');
        }
        return installedFiles;
    }
}

module.exports = GeminiInstaller;
