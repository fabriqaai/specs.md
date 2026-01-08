/**
 * specsmd VS Code Extension
 *
 * Entry point for the specsmd extension that provides a dashboard sidebar
 * for browsing AI-DLC memory-bank artifacts.
 */

import * as vscode from 'vscode';
import { scanMemoryBank } from './parser/artifactParser';
import { SpecsmdWebviewProvider, createWebviewProvider } from './sidebar/webviewProvider';
import { FileWatcher } from './watcher';
import { WelcomeViewProvider, createInstallationWatcher } from './welcome';
import { tracker, trackActivation, trackError, projectMetricsTracker } from './analytics';

let webviewProvider: SpecsmdWebviewProvider | undefined;
let fileWatcher: FileWatcher | undefined;
let installationWatcher: vscode.Disposable | undefined;

/**
 * Extension activation.
 * Called when the extension is first activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Initialize analytics first (fire-and-forget, never blocks)
    tracker.init(context);

    const workspacePath = getWorkspacePath();

    // Scan memory bank and set project context
    let isSpecsmdProject = false;
    if (workspacePath) {
        try {
            const model = await scanMemoryBank(workspacePath);
            isSpecsmdProject = model.isProject;
            await vscode.commands.executeCommand('setContext', 'specsmd.isProject', isSpecsmdProject);
        } catch {
            trackError('activation', 'SCAN_FAILED', 'artifactParser', true);
            await vscode.commands.executeCommand('setContext', 'specsmd.isProject', false);
        }
    } else {
        await vscode.commands.executeCommand('setContext', 'specsmd.isProject', false);
    }

    // Track activation after project detection
    trackActivation(context, isSpecsmdProject);

    // Initialize project metrics tracking (fires project_snapshot for specsmd projects)
    if (workspacePath && isSpecsmdProject) {
        try {
            const model = await scanMemoryBank(workspacePath);
            projectMetricsTracker.init(model);
        } catch {
            // Silent failure - metrics are optional
        }
    }

    // Create and register webview provider
    webviewProvider = createWebviewProvider(context, workspacePath);

    // Register welcome view provider
    const welcomeProvider = new WelcomeViewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            WelcomeViewProvider.viewType,
            welcomeProvider
        )
    );

    // Initial data load
    await webviewProvider.refresh();

    // Set up file watcher for auto-refresh
    if (workspacePath) {
        fileWatcher = new FileWatcher(workspacePath, async () => {
            await webviewProvider?.refresh();
            await updateProjectContext(workspacePath);
        });
        fileWatcher.start();
        context.subscriptions.push(fileWatcher);
    }

    // Set up installation watcher for non-specsmd workspaces
    installationWatcher = createInstallationWatcher(async () => {
        await webviewProvider?.refresh();
        await updateProjectContext(workspacePath);
        // Track successful installation completion from welcome view
        welcomeProvider.onInstallationComplete();
    });
    context.subscriptions.push(installationWatcher);

    // Register commands
    registerCommands(context);

    console.log('specsmd extension activated');
}

/**
 * Extension deactivation.
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    // Clean up project metrics tracker timers
    projectMetricsTracker.dispose();

    // Resources are cleaned up via context.subscriptions
    webviewProvider?.dispose();
    webviewProvider = undefined;
    fileWatcher = undefined;
    installationWatcher = undefined;
    console.log('specsmd extension deactivated');
}

/**
 * Gets the workspace path.
 */
function getWorkspacePath(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}

/**
 * Updates the specsmd.isProject context based on workspace scan.
 */
async function updateProjectContext(workspacePath: string | undefined): Promise<void> {
    if (!workspacePath) {
        await vscode.commands.executeCommand('setContext', 'specsmd.isProject', false);
        return;
    }

    const model = await scanMemoryBank(workspacePath);
    await vscode.commands.executeCommand('setContext', 'specsmd.isProject', model.isProject);
}

/**
 * Registers all extension commands.
 */
function registerCommands(context: vscode.ExtensionContext): void {
    // Refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.refresh', async () => {
            await webviewProvider?.refresh();
            const workspacePath = getWorkspacePath();
            await updateProjectContext(workspacePath);
        })
    );

    // Open file command (can be triggered from webview)
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.openFile', async (filePath: string) => {
            if (filePath) {
                const uri = vscode.Uri.file(filePath);
                await vscode.window.showTextDocument(uri);
            }
        })
    );

    // Reveal in Explorer command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.revealInExplorer', async (filePath: string) => {
            if (filePath) {
                const uri = vscode.Uri.file(filePath);
                await vscode.commands.executeCommand('revealFileInOS', uri);
            }
        })
    );

    // Copy Path command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.copyPath', async (filePath: string) => {
            if (filePath) {
                await vscode.env.clipboard.writeText(filePath);
                vscode.window.showInformationMessage(`Path copied: ${filePath}`);
            }
        })
    );
}
