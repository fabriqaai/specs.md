const ToolInstaller = require('./ToolInstaller');
const path = require('path');

class OpenCodeInstaller extends ToolInstaller {
    get key() {
        return 'opencode';
    }

    get name() {
        return 'OpenCode';
    }

    get commandsDir() {
        return path.join('.opencode', 'agent');
    }

    get detectPath() {
        return '.opencode';
    }
}

module.exports = OpenCodeInstaller;
