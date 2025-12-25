/**
 * specsmd VS Code Extension
 *
 * Entry point for the specsmd extension that provides a dashboard sidebar
 * for browsing AI-DLC memory-bank artifacts.
 */

import * as vscode from 'vscode';
import { scanMemoryBank } from './parser/artifactParser';
import { MemoryBankTreeProvider } from './sidebar/treeProvider';
import { TreeNode } from './sidebar/types';
import { FileWatcher } from './watcher';
import { WelcomeViewProvider, createInstallationWatcher } from './welcome';

let treeProvider: MemoryBankTreeProvider | undefined;
let fileWatcher: FileWatcher | undefined;
let installationWatcher: vscode.Disposable | undefined;

/**
 * Extension activation.
 * Called when the extension is first activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const workspacePath = getWorkspacePath();

    // Set initial project context
    await updateProjectContext(workspacePath);

    // Create tree provider
    treeProvider = new MemoryBankTreeProvider(workspacePath);

    // Register tree data provider
    const treeView = vscode.window.createTreeView('specsmdTree', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);
    context.subscriptions.push(treeProvider);

    // Register welcome view provider
    const welcomeProvider = new WelcomeViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            WelcomeViewProvider.viewType,
            welcomeProvider
        )
    );

    // Initial tree load
    await treeProvider.refresh();

    // Set up file watcher for auto-refresh
    if (workspacePath) {
        fileWatcher = new FileWatcher(workspacePath, async () => {
            await treeProvider?.refresh();
            await updateProjectContext(workspacePath);
        });
        fileWatcher.start();
        context.subscriptions.push(fileWatcher);
    }

    // Set up installation watcher for non-specsmd workspaces
    installationWatcher = createInstallationWatcher(async () => {
        await treeProvider?.refresh();
        await updateProjectContext(workspacePath);
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
    // Resources are cleaned up via context.subscriptions
    treeProvider = undefined;
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
            await treeProvider?.refresh();
            const workspacePath = getWorkspacePath();
            await updateProjectContext(workspacePath);
        })
    );

    // Open file command (for tree item click)
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.openFile', async (node: TreeNode) => {
            const filePath = getNodeFilePath(node);
            if (filePath) {
                const uri = vscode.Uri.file(filePath);
                await vscode.window.showTextDocument(uri);
            }
        })
    );

    // Open artifact command (for tree item double-click)
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.openArtifact', async (node: TreeNode) => {
            const filePath = getNodeFilePath(node);
            if (filePath) {
                const uri = vscode.Uri.file(filePath);
                await vscode.window.showTextDocument(uri);
            }
        })
    );

    // Reveal in Explorer command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.revealInExplorer', async (node: TreeNode) => {
            const filePath = getNodeFilePath(node);
            if (filePath) {
                const uri = vscode.Uri.file(filePath);
                await vscode.commands.executeCommand('revealFileInOS', uri);
            }
        })
    );

    // Copy Path command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.copyPath', async (node: TreeNode) => {
            const filePath = getNodeFilePath(node);
            if (filePath) {
                await vscode.env.clipboard.writeText(filePath);
                vscode.window.showInformationMessage(`Path copied: ${filePath}`);
            }
        })
    );
}

/**
 * Gets the file path for a tree node.
 */
function getNodeFilePath(node: TreeNode): string | undefined {
    switch (node.kind) {
        case 'intent':
            return node.data.path;
        case 'unit':
            return node.data.path;
        case 'story':
            return node.data.path;
        case 'bolt':
            return node.data.path;
        case 'standard':
            return node.data.path;
        default:
            return undefined;
    }
}
