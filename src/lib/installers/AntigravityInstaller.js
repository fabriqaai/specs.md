const ToolInstaller = require('./ToolInstaller');
const path = require('path');

class AntigravityInstaller extends ToolInstaller {
    get key() {
        return 'antigravity';
    }

    get name() {
        return 'Google Antigravity';
    }

    get commandsDir() {
        return path.join('.agent', 'agents');
    }

    get detectPath() {
        return '.agent';
    }
}

module.exports = AntigravityInstaller;
