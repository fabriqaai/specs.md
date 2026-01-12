const ToolInstaller = require('./ToolInstaller');
const path = require('path');
const fs = require('fs-extra');
const CLIUtils = require('../cli-utils');
const { theme } = CLIUtils;

class KiroInstaller extends ToolInstaller {
    get key() {
        return 'kiro';
    }

    get name() {
        return 'Kiro CLI';
    }

    get commandsDir() {
        return path.join('.kiro', 'steering');
    }

    get detectPath() {
        return '.kiro';
    }

    /**
     * Override to install commands and create specs symlink for simple flow
     */
    async installCommands(flowPath, config) {
        // Install commands (default behavior)
        const installedCommands = await super.installCommands(flowPath, config);

        // For simple flow, create symlink to make specs visible in Kiro
        if (flowPath.includes('simple')) {
            await this.createSpecsSymlink();
        }

        return installedCommands;
    }

    /**
     * Create symlink from .kiro/specs to specs/ for Kiro specifications compatibility
     */
    async createSpecsSymlink() {
        const kiroSpecsPath = path.join('.kiro', 'specs');
        const specsPath = 'specs';

        // Only create if .kiro/specs doesn't exist
        if (await fs.pathExists(kiroSpecsPath)) {
            console.log(theme.dim(`  .kiro/specs already exists, skipping symlink`));
            return;
        }

        // Ensure specs folder exists
        await fs.ensureDir(specsPath);

        try {
            // Create relative symlink from .kiro/specs -> ../specs
            await fs.ensureSymlink(path.join('..', specsPath), kiroSpecsPath);
            CLIUtils.displayStatus('', 'Created .kiro/specs symlink for Kiro compatibility', 'success');
        } catch (err) {
            console.log(theme.warning(`  Failed to create specs symlink: ${err.message}`));
        }
    }
}

module.exports = KiroInstaller;
