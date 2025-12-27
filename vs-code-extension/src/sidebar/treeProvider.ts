/**
 * TreeDataProvider implementation for the memory-bank sidebar.
 */

import * as vscode from 'vscode';
import { MemoryBankModel } from '../parser/types';
import { scanMemoryBank } from '../parser/artifactParser';
import {
    TreeNode,
    getCollapsibleState
} from './types';
import {
    createRootNodes,
    getChildNodes
} from './treeBuilder';
import { getNodeIcon, getBoltTypeBadge } from './iconHelper';

/**
 * TreeDataProvider for the memory-bank view.
 * Displays Intents, Bolts, and Standards in a hierarchical tree.
 */
export class MemoryBankTreeProvider implements vscode.TreeDataProvider<TreeNode> {
    private model: MemoryBankModel | null = null;
    private workspacePath: string | undefined;

    /**
     * Event emitter for tree data changes.
     * Fire this to refresh the tree view.
     */
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    /**
     * Creates a new MemoryBankTreeProvider.
     * @param workspacePath Optional workspace path. If not provided, uses first workspace folder.
     */
    constructor(workspacePath?: string) {
        this.workspacePath = workspacePath;
    }

    /**
     * Gets the workspace path, falling back to first workspace folder.
     */
    private getWorkspacePath(): string | undefined {
        if (this.workspacePath) {
            return this.workspacePath;
        }
        const folders = vscode.workspace.workspaceFolders;
        return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
    }

    /**
     * Refreshes the tree by rescanning the memory-bank.
     */
    async refresh(): Promise<void> {
        const workspacePath = this.getWorkspacePath();
        if (workspacePath) {
            this.model = await scanMemoryBank(workspacePath);
        } else {
            this.model = null;
        }
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the current model (for testing).
     */
    getModel(): MemoryBankModel | null {
        return this.model;
    }

    /**
     * Sets the model directly (for testing).
     */
    setModel(model: MemoryBankModel): void {
        this.model = model;
    }

    /**
     * Converts a TreeNode to a TreeItem for display.
     */
    getTreeItem(element: TreeNode): vscode.TreeItem {
        // Add bolt type badge to bolt labels
        let label = element.label;
        if (element.kind === 'bolt') {
            const badge = getBoltTypeBadge(element.data.type);
            if (badge) {
                // Insert badge before status indicator
                const parts = label.split(' ');
                if (parts.length > 1 && /[\u2713\u25CF\u25CB]/.test(parts[parts.length - 1])) {
                    parts.splice(parts.length - 1, 0, badge);
                    label = parts.join(' ');
                } else {
                    label = `${label} ${badge}`;
                }
            }
        }

        const item = new vscode.TreeItem(
            label,
            getCollapsibleState(element)
        );

        // Set status-aware icon
        item.iconPath = getNodeIcon(element);

        // Set unique ID for element tracking
        item.id = element.id;

        // Set tooltip
        item.tooltip = this.getTooltip(element);

        // Set context value for menu contributions
        item.contextValue = element.kind;

        // Set command for leaf nodes
        if (this.isClickableNode(element)) {
            item.command = {
                command: 'specsmd.openArtifact',
                title: 'Open Artifact',
                arguments: [element]
            };
        }

        return item;
    }

    /**
     * Checks if a node should be clickable.
     */
    private isClickableNode(node: TreeNode): boolean {
        return node.kind === 'story' ||
               node.kind === 'bolt' ||
               node.kind === 'standard';
    }

    /**
     * Gets tooltip text for a node.
     */
    private getTooltip(node: TreeNode): string {
        switch (node.kind) {
            case 'root-intents':
                return 'Features and capabilities';
            case 'root-bolts':
                return 'Construction sessions';
            case 'root-standards':
                return 'Project standards';
            case 'intent':
                return `Intent: ${node.data.number}-${node.data.name}\nUnits: ${node.data.units.length}`;
            case 'unit':
                return `Unit: ${node.data.name}\nStories: ${node.data.stories.length}`;
            case 'story':
                return `Story: ${node.data.id}-${node.data.title}\nPriority: ${node.data.priority}`;
            case 'bolt':
                return `Bolt: ${node.data.id}\nType: ${node.data.type}\nStatus: ${node.data.status}\nStages: ${node.data.stages.length}`;
            case 'bolt-stages-group':
                return `Stages for ${node.boltId}`;
            case 'bolt-stage':
                return `Stage ${node.stageOrder}: ${node.stageName}\nStatus: ${node.status}`;
            case 'bolt-stories-group':
                return `Stories included in ${node.boltId}`;
            case 'bolt-story':
                return `Story: ${node.storyId}`;
            case 'standard':
                return `Standard: ${node.data.name}`;
        }
    }

    /**
     * Gets children for a tree element.
     * Returns root nodes if no element is provided.
     */
    getChildren(element?: TreeNode): vscode.ProviderResult<TreeNode[]> {
        // Return empty if no model loaded
        if (!this.model || !this.model.isProject) {
            return [];
        }

        // Root level - return section nodes
        if (!element) {
            return createRootNodes();
        }

        // Return children based on node type
        return getChildNodes(element, this.model);
    }

    /**
     * Gets parent of a tree element (for reveal functionality).
     */
    getParent(_element: TreeNode): vscode.ProviderResult<TreeNode> {
        // Parent lookup would require storing parent references
        // For now, return undefined (tree will still function)
        return undefined;
    }

    /**
     * Disposes resources.
     */
    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}

/**
 * Creates and registers a MemoryBankTreeProvider.
 */
export function createTreeProvider(
    context: vscode.ExtensionContext,
    workspacePath?: string
): MemoryBankTreeProvider {
    const provider = new MemoryBankTreeProvider(workspacePath);

    // Register the tree data provider
    const treeView = vscode.window.createTreeView('specsmdExplorer', {
        treeDataProvider: provider,
        showCollapseAll: true
    });

    // Add to subscriptions for cleanup
    context.subscriptions.push(treeView);
    context.subscriptions.push(provider);

    return provider;
}
