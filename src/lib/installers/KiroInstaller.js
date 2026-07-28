const ToolInstaller = require('./ToolInstaller');
const path = require('path');
const fs = require('fs-extra');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

/**
 * Installer for Kiro CLI.
 *
 * Kiro CLI exposes user-defined slash commands through "Agent Skills":
 * a skill lives in `.kiro/skills/<name>/SKILL.md` and becomes the `/<name>`
 * slash command (see https://kiro.dev/docs/cli/skills/). Steering files
 * (`.kiro/steering/`) are always-on context and are NOT invocable as slash
 * commands, so installing the agent commands there meant `/specsmd-*` never
 * showed up in Kiro CLI. We install skills instead so the commands work
 * out of the box.
 */
class KiroInstaller extends ToolInstaller {
    get key() {
        return 'kiro';
    }

    get name() {
        return 'Kiro CLI';
    }

    get commandsDir() {
        // Skills are the slash-command mechanism in Kiro CLI.
        // (uninstall/rollback iterate this dir and remove `specsmd-*` entries.)
        return path.join('.kiro', 'skills');
    }

    get detectPath() {
        return '.kiro';
    }

    /**
     * Install each flow command as a Kiro CLI skill (`.kiro/skills/<name>/SKILL.md`)
     * so it is discoverable as a `/<name>` slash command.
     */
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
                const commandName = cmdFile.replace(/\.md$/, '');
                const prefix = (config && config.command && config.command.prefix) ? `${config.command.prefix}-` : '';
                // Skill name == slash command. Lowercase letters, numbers, hyphens only.
                const skillName = `specsmd-${prefix}${commandName}`.toLowerCase();

                const { description, body } = this.parseFrontmatter(content);

                // Build SKILL.md with Kiro CLI frontmatter (name + description required).
                const skillContent = [
                    '---',
                    `name: ${skillName}`,
                    `description: ${this.sanitizeDescription(description) || 'specsmd agent'}`,
                    '---',
                    '',
                    body
                ].join('\n');

                const skillDir = path.join(targetSkillsDir, skillName);
                await fs.ensureDir(skillDir);
                await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillContent, 'utf8');

                installedFiles.push(skillName);
            } catch (err) {
                console.log(theme.warning(`  Failed to install ${cmdFile}: ${err.message}`));
            }
        }

        CLIUtils.displayStatus('', `Installed ${installedFiles.length} skills for ${this.name}`, 'success');

        // For simple flow, create symlink to make specs visible in Kiro.
        if (flowPath.includes('simple')) {
            await this.createSpecsSymlink();
        }

        return installedFiles;
    }

    /**
     * Parse YAML frontmatter from a markdown command file.
     * Returns the description and the body (without the frontmatter block).
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

    /**
     * Kiro skill descriptions are single-line and capped at 1024 chars.
     */
    sanitizeDescription(description) {
        if (!description) return '';
        const oneLine = description.replace(/\s+/g, ' ').trim();
        return oneLine.length > 1024 ? oneLine.slice(0, 1021) + '...' : oneLine;
    }

    /**
     * Create symlink from .kiro/specs to specs/ for Kiro specifications compatibility
     */
    async createSpecsSymlink() {
        const kiroSpecsPath = path.join('.kiro', 'specs');
        const specsPath = 'specs';

        // Check if .kiro/specs already exists
        if (await fs.pathExists(kiroSpecsPath)) {
            const stats = await fs.lstat(kiroSpecsPath);
            if (stats.isSymbolicLink()) {
                console.log(theme.dim(`  .kiro/specs symlink already exists, skipping`));
            } else {
                console.log(theme.dim(`  .kiro/specs already exists as folder, skipping symlink`));
            }
            return;
        }

        // Ensure specs folder exists
        await fs.ensureDir(specsPath);

        try {
            // Create relative symlink from .kiro/specs -> ../specs
            await fs.ensureSymlink(path.join('..', specsPath), kiroSpecsPath);
            CLIUtils.displayStatus('', 'Created .kiro/specs symlink for Kiro compatibility', 'success');
        } catch (err) {
            // Handle specific error cases
            if (err.code === 'EPERM' || err.code === 'EACCES') {
                console.log(theme.warning(`  Cannot create symlink (permission denied). On Windows, try running as Administrator.`));
            } else if (err.code === 'EEXIST') {
                console.log(theme.dim(`  .kiro/specs already exists, skipping symlink`));
            } else {
                console.log(theme.warning(`  Failed to create specs symlink: ${err.message}`));
            }
        }
    }
}

module.exports = KiroInstaller;
