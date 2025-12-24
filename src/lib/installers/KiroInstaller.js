const ToolInstaller = require('./ToolInstaller');
const path = require('path');

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
}

module.exports = KiroInstaller;
