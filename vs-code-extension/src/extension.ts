/**
 * specsmd VS Code Extension
 *
 * Entry point for the specsmd extension that provides a dashboard sidebar
 * for browsing AI-DLC memory-bank artifacts and FIRE flow visualization.
 *
 * Multi-Flow Architecture:
 * - FlowRegistry manages flow detection and activation
 * - Each flow (AIDLC, FIRE, Simple) has its own adapter
 * - Currently uses existing webview provider for backward compatibility
 * - Flow switching will be added in Phase 4
 */

import * as vscode from 'vscode';
import { scanMemoryBank } from './parser/artifactParser';
import { SpecsmdWebviewProvider, createWebviewProvider } from './sidebar/webviewProvider';
import { FileWatcher } from './watcher';
import { WelcomeViewProvider, createInstallationWatcher } from './welcome';
import { tracker, trackActivation, trackError, projectMetricsTracker } from './analytics';
import { openFile, showMarkdownEditorPicker } from './utils';

// Multi-flow support
import { FlowRegistry, createFlowRegistry, hasAnyFlow, detectAllFlows } from './core';
import { registerAllFlows } from './flows';

// Global instances
let flowRegistry: FlowRegistry | undefined;
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

    // Initialize multi-flow registry
    flowRegistry = createFlowRegistry();
    registerAllFlows(flowRegistry);
    await flowRegistry.initialize(context);

    // Detect flows and set context
    let isSpecsmdProject = false;
    let detectedFlows: import('./core').FlowInfo[] = [];

    if (workspacePath) {
        try {
            // Use new multi-flow detection
            detectedFlows = await flowRegistry.detectFlows(workspacePath);
            isSpecsmdProject = detectedFlows.length > 0;

            // Set VS Code context for view visibility
            await vscode.commands.executeCommand('setContext', 'specsmd.isProject', isSpecsmdProject);

            // Set flow-specific contexts
            await vscode.commands.executeCommand(
                'setContext',
                'specsmd.hasAidlc',
                detectedFlows.some(f => f.id === 'aidlc')
            );
            await vscode.commands.executeCommand(
                'setContext',
                'specsmd.hasFire',
                detectedFlows.some(f => f.id === 'fire')
            );
            await vscode.commands.executeCommand(
                'setContext',
                'specsmd.hasMultipleFlows',
                detectedFlows.length > 1
            );

            // Activate default flow if any detected
            if (isSpecsmdProject) {
                const defaultFlow = flowRegistry.getDefaultFlow();
                if (defaultFlow && defaultFlow.flowPath) {
                    await flowRegistry.activateFlow(defaultFlow.id, defaultFlow.flowPath);
                }
            }
        } catch (error) {
            trackError('activation', 'FLOW_DETECTION_FAILED', 'flowRegistry', true);
            console.error('Flow detection error:', error);

            // Fallback to legacy detection
            try {
                const model = await scanMemoryBank(workspacePath);
                isSpecsmdProject = model.isProject;
            } catch {
                trackError('activation', 'SCAN_FAILED', 'artifactParser', true);
            }

            await vscode.commands.executeCommand('setContext', 'specsmd.isProject', isSpecsmdProject);
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

    // Create and register webview provider with flow registry for multi-flow support
    webviewProvider = createWebviewProvider(context, workspacePath, flowRegistry);

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

    // Log detected flows
    if (detectedFlows.length > 0) {
        console.log(`specsmd extension activated with flows: ${detectedFlows.map(f => f.displayName).join(', ')}`);
    } else {
        console.log('specsmd extension activated (no flows detected)');
    }
}

/**
 * Extension deactivation.
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    // Clean up project metrics tracker timers
    projectMetricsTracker.dispose();

    // Dispose flow registry
    flowRegistry?.dispose();
    flowRegistry = undefined;

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

    // Use multi-flow detection
    if (flowRegistry) {
        const detectedFlows = await flowRegistry.detectFlows(workspacePath);
        const isProject = detectedFlows.length > 0;

        await vscode.commands.executeCommand('setContext', 'specsmd.isProject', isProject);
        await vscode.commands.executeCommand(
            'setContext',
            'specsmd.hasAidlc',
            detectedFlows.some(f => f.id === 'aidlc')
        );
        await vscode.commands.executeCommand(
            'setContext',
            'specsmd.hasFire',
            detectedFlows.some(f => f.id === 'fire')
        );
        await vscode.commands.executeCommand(
            'setContext',
            'specsmd.hasMultipleFlows',
            detectedFlows.length > 1
        );
    } else {
        // Fallback to legacy detection
        const model = await scanMemoryBank(workspacePath);
        await vscode.commands.executeCommand('setContext', 'specsmd.isProject', model.isProject);
    }
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
    // Uses the user's markdown editor preference for .md files
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.openFile', async (filePath: string) => {
            if (filePath) {
                await openFile(filePath);
            }
        })
    );

    // Select markdown editor command
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.selectMarkdownEditor', async () => {
            await showMarkdownEditorPicker();
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

    // Switch flow command (for Phase 4)
    context.subscriptions.push(
        vscode.commands.registerCommand('specsmd.switchFlow', async (flowId?: string) => {
            if (!flowRegistry) return;

            const detectedFlows = flowRegistry.getDetectedFlows();
            if (detectedFlows.length <= 1) {
                vscode.window.showInformationMessage('Only one flow detected in this workspace.');
                return;
            }

            if (flowId) {
                // Direct switch
                try {
                    await flowRegistry.switchFlow(flowId as import('./core').FlowId);
                    await webviewProvider?.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to switch to flow: ${flowId}`);
                }
            } else {
                // Show picker
                const items = detectedFlows.map(f => ({
                    label: `${f.icon} ${f.displayName}`,
                    description: f.rootFolder,
                    flowId: f.id
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select flow to switch to'
                });

                if (selected) {
                    try {
                        await flowRegistry.switchFlow(selected.flowId as import('./core').FlowId);
                        await webviewProvider?.refresh();
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to switch to flow: ${selected.label}`);
                    }
                }
            }
        })
    );
}

// Export for testing
export { flowRegistry, webviewProvider };
