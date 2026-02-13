const ToolInstaller = require('./ToolInstaller');
const fs = require('fs-extra');
const path = require('path');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class CodexInstaller extends ToolInstaller {
    get key() {
        return 'codex';
    }

    get name() {
        return 'Codex';
    }

    get commandsDir() {
        return path.join('.codex', 'skills');
    }

    get detectPath() {
        return '.codex';
    }

    async installCommands(flowPath, config) {
        const targetSkillsDir = this.commandsDir;
        console.log(theme.dim(`  Installing skills to ${targetSkillsDir}/...`));
        await fs.ensureDir(targetSkillsDir);

        const commandsSourceDir = path.join(flowPath, 'commands');
        if (!await fs.pathExists(commandsSourceDir)) {
            console.log(theme.warning(`  No commands folder found at ${commandsSourceDir}`));
            return [];
        }

        const commandFiles = await fs.readdir(commandsSourceDir);
        const installedFiles = [];

        for (const cmdFile of commandFiles) {
            if (!cmdFile.endsWith('.md')) continue;

            try {
                const sourcePath = path.join(commandsSourceDir, cmdFile);
                const content = await fs.readFile(sourcePath, 'utf8');
                const commandName = cmdFile.replace('.md', '');
                const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                const skillName = `specsmd-${prefix}${commandName}`;

                const { description, body } = this.parseFrontmatter(content);

                // Build SKILL.md with Codex frontmatter
                const skillContent = [
                    '---',
                    `name: ${skillName}`,
                    `description: "${description || 'specsmd agent'}"`,
                    '---',
                    '',
                    body
                ].join('\n');

                // Write SKILL.md
                const skillDir = path.join(targetSkillsDir, skillName);
                await fs.ensureDir(skillDir);
                await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent, 'utf8');

                // Write agents/openai.yaml
                const agentsDir = path.join(skillDir, 'agents');
                await fs.ensureDir(agentsDir);
                const openaiYaml = [
                    'interface:',
                    `  display_name: "specsmd ${commandName}"`,
                    `  short_description: "${description || 'specsmd agent'}"`,
                    `  default_prompt: "Use $${skillName} to start spec-driven development"`
                ].join('\n');
                await fs.writeFile(path.join(agentsDir, 'openai.yaml'), openaiYaml, 'utf8');

                installedFiles.push(skillName);
            } catch (err) {
                console.log(theme.warning(`  Failed to install ${cmdFile}: ${err.message}`));
            }
        }

        CLIUtils.displayStatus('', `Installed ${installedFiles.length} skills for ${this.name}`, 'success');
        return installedFiles;
    }

    /**
     * Parse YAML frontmatter from a markdown file
     */
    parseFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        if (!match) return { description: '', body: content };

        const frontmatter = match[1];
        const body = match[2];
        const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
        return {
            description: descMatch ? descMatch[1] : '',
            body: body.trim()
        };
    }
}

module.exports = CodexInstaller;
