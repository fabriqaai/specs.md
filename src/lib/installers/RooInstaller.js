const ToolInstaller = require('./ToolInstaller');
const path = require('path');

class RooInstaller extends ToolInstaller {
    get key() {
        return 'roo';
    }

    get name() {
        return 'Roo Code';
    }

    get commandsDir() {
        return path.join('.roo', 'commands');
    }

    get detectPath() {
        return '.roo';
    }
}

module.exports = RooInstaller;
