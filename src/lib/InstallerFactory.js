const ClaudeInstaller = require('./installers/ClaudeInstaller');
const CursorInstaller = require('./installers/CursorInstaller');
const CopilotInstaller = require('./installers/CopilotInstaller');
const AntigravityInstaller = require('./installers/AntigravityInstaller');
const WindsurfInstaller = require('./installers/WindsurfInstaller');
const ClineInstaller = require('./installers/ClineInstaller');
const RooInstaller = require('./installers/RooInstaller');
const KiroInstaller = require('./installers/KiroInstaller');
const GeminiInstaller = require('./installers/GeminiInstaller');
const CodexInstaller = require('./installers/CodexInstaller');
const OpenCodeInstaller = require('./installers/OpenCodeInstaller');

class InstallerFactory {
    static getInstallers() {
        return [
            new ClaudeInstaller(),
            new CursorInstaller(),
            new CopilotInstaller(),
            new AntigravityInstaller(),
            new WindsurfInstaller(),
            new ClineInstaller(),
            new RooInstaller(),
            new KiroInstaller(),
            new GeminiInstaller(),
            new CodexInstaller(),
            new OpenCodeInstaller()
        ];
    }

    static getInstaller(key) {
        const installers = this.getInstallers();
        return installers.find(i => i.key === key);
    }
}

module.exports = InstallerFactory;
