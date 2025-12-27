import * as vscode from 'vscode';

/**
 * The installation command to paste into the terminal
 */
const INSTALL_COMMAND = 'npx specsmd@latest install';

/**
 * Handle the install button click from the welcome view.
 * Shows a confirmation dialog and opens a terminal with the install command.
 */
export async function handleInstallCommand(): Promise<void> {
    // Check if there's a workspace folder open
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
            'Please open a folder first before installing specsmd.'
        );
        return;
    }

    // Show confirmation dialog
    const confirm = await vscode.window.showInformationMessage(
        'This will open a terminal with the specsmd install command. ' +
        'Press Enter in the terminal to run the installation.',
        { modal: true },
        'Open Terminal'
    );

    if (confirm !== 'Open Terminal') {
        return; // User cancelled
    }

    // Create a new terminal
    const terminal = vscode.window.createTerminal({
        name: 'specsmd install',
        cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
    });

    // Show the terminal
    terminal.show();

    // Wait for terminal to be ready (zsh needs time to initialize)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send the command without executing (false = don't add newline)
    terminal.sendText(INSTALL_COMMAND, false);
}

/**
 * Set up watchers for post-installation detection.
 * Updates the specsmd.isProject context when project folders are detected.
 */
export function createInstallationWatcher(
    onProjectDetected: () => void
): vscode.Disposable {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return { dispose: () => {} };
    }

    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Watch for memory-bank and .specsmd folder creation
    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(rootPath, '{memory-bank,.specsmd}/**'),
        false, // Don't ignore creates
        true,  // Ignore changes
        true   // Ignore deletes
    );

    let detected = false;

    const checkAndNotify = () => {
        if (!detected) {
            detected = true;
            onProjectDetected();
        }
    };

    watcher.onDidCreate(checkAndNotify);

    return watcher;
}
