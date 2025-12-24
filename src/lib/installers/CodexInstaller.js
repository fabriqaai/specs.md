const ToolInstaller = require('./ToolInstaller');

class CodexInstaller extends ToolInstaller {
    get key() {
        return 'codex';
    }

    get name() {
        return 'Codex';
    }

    get commandsDir() {
        return '.codex';
    }

    get detectPath() {
        return '.codex';
    }
}

module.exports = CodexInstaller;
