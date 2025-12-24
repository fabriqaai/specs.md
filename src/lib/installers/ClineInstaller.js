const ToolInstaller = require('./ToolInstaller');

class ClineInstaller extends ToolInstaller {
    get key() {
        return 'cline';
    }

    get name() {
        return 'Cline';
    }

    get commandsDir() {
        return '.clinerules';
    }

    get detectPath() {
        return '.clinerules';
    }
}

module.exports = ClineInstaller;
