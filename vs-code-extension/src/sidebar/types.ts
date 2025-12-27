/**
 * Type definitions for the memory-bank tree view.
 * Uses discriminated unions for type-safe tree node handling.
 *
 * Note: This file intentionally does NOT import vscode to allow unit testing
 * without the VS Code runtime. VS Code-specific functions are in treeProvider.ts.
 */

import { Intent, Unit, Story, Bolt, Standard, ArtifactStatus } from '../parser/types';

/**
 * Node kinds for the tree view.
 */
export type TreeNodeKind =
    | 'root-intents'
    | 'root-bolts'
    | 'root-standards'
    | 'intent'
    | 'unit'
    | 'story'
    | 'bolt'
    | 'bolt-stages-group'
    | 'bolt-stage'
    | 'bolt-stories-group'
    | 'bolt-story'
    | 'standard';

/**
 * Base interface for all tree nodes.
 */
interface BaseTreeNode {
    kind: TreeNodeKind;
    label: string;
    id: string;
}

/**
 * Root section nodes.
 */
export interface RootIntentsNode extends BaseTreeNode {
    kind: 'root-intents';
}

export interface RootBoltsNode extends BaseTreeNode {
    kind: 'root-bolts';
}

export interface RootStandardsNode extends BaseTreeNode {
    kind: 'root-standards';
}

/**
 * Intent node with nested data.
 */
export interface IntentNode extends BaseTreeNode {
    kind: 'intent';
    data: Intent;
}

/**
 * Unit node with nested data.
 */
export interface UnitNode extends BaseTreeNode {
    kind: 'unit';
    data: Unit;
}

/**
 * Story node with nested data.
 */
export interface StoryNode extends BaseTreeNode {
    kind: 'story';
    data: Story;
}

/**
 * Bolt node with nested data.
 */
export interface BoltNode extends BaseTreeNode {
    kind: 'bolt';
    data: Bolt;
}

/**
 * Group node for bolt stages.
 */
export interface BoltStagesGroupNode extends BaseTreeNode {
    kind: 'bolt-stages-group';
    boltId: string;
    data: Bolt;
}

/**
 * Individual bolt stage node.
 */
export interface BoltStageNode extends BaseTreeNode {
    kind: 'bolt-stage';
    boltId: string;
    stageName: string;
    stageOrder: number;
    status: ArtifactStatus;
}

/**
 * Group node for bolt stories.
 */
export interface BoltStoriesGroupNode extends BaseTreeNode {
    kind: 'bolt-stories-group';
    boltId: string;
    data: Bolt;
}

/**
 * Individual bolt story node.
 */
export interface BoltStoryNode extends BaseTreeNode {
    kind: 'bolt-story';
    boltId: string;
    storyId: string;
    status: ArtifactStatus;
}

/**
 * Standard node with nested data.
 */
export interface StandardNode extends BaseTreeNode {
    kind: 'standard';
    data: Standard;
}

/**
 * Union type for all tree nodes.
 */
export type TreeNode =
    | RootIntentsNode
    | RootBoltsNode
    | RootStandardsNode
    | IntentNode
    | UnitNode
    | StoryNode
    | BoltNode
    | BoltStagesGroupNode
    | BoltStageNode
    | BoltStoriesGroupNode
    | BoltStoryNode
    | StandardNode;

/**
 * Icon configuration for tree nodes.
 */
export const NODE_ICONS: Record<TreeNodeKind, string> = {
    'root-intents': 'folder-library',
    'root-bolts': 'tools',
    'root-standards': 'law',
    'intent': 'package',
    'unit': 'symbol-module',
    'story': 'note',
    'bolt': 'wrench',
    'bolt-stages-group': 'list-tree',
    'bolt-stage': 'circle-outline',
    'bolt-stories-group': 'list-unordered',
    'bolt-story': 'note',
    'standard': 'file-text'
};

/**
 * Status indicators for display.
 */
export const STATUS_INDICATORS: Record<ArtifactStatus, string> = {
    [ArtifactStatus.Complete]: '\u2713',  // checkmark
    [ArtifactStatus.InProgress]: '\u25CF', // filled circle
    [ArtifactStatus.Draft]: '\u25CB',      // empty circle
    [ArtifactStatus.Blocked]: '\u2717',    // X mark for blocked
    [ArtifactStatus.Unknown]: ''
};

/**
 * Collapsible state values (matching vscode.TreeItemCollapsibleState).
 * Defined here to avoid vscode import in this file.
 */
export const CollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2
} as const;

export type CollapsibleStateValue = typeof CollapsibleState[keyof typeof CollapsibleState];

/**
 * Gets the collapsible state for a tree node.
 * Returns values matching vscode.TreeItemCollapsibleState.
 */
export function getCollapsibleState(node: TreeNode): CollapsibleStateValue {
    switch (node.kind) {
        case 'root-intents':
        case 'root-bolts':
        case 'root-standards':
            return CollapsibleState.Expanded;
        case 'intent':
            return node.data.units.length > 0
                ? CollapsibleState.Collapsed
                : CollapsibleState.None;
        case 'unit':
            return node.data.stories.length > 0
                ? CollapsibleState.Collapsed
                : CollapsibleState.None;
        case 'bolt':
            // Bolts are expandable to show stages and stories
            return CollapsibleState.Collapsed;
        case 'bolt-stages-group':
            return node.data.stages.length > 0
                ? CollapsibleState.Collapsed
                : CollapsibleState.None;
        case 'bolt-stories-group':
            return node.data.stories.length > 0
                ? CollapsibleState.Collapsed
                : CollapsibleState.None;
        case 'story':
        case 'bolt-stage':
        case 'bolt-story':
        case 'standard':
            return CollapsibleState.None;
    }
}

/**
 * Type guard for root nodes.
 */
export function isRootNode(node: TreeNode): node is RootIntentsNode | RootBoltsNode | RootStandardsNode {
    return node.kind === 'root-intents' ||
           node.kind === 'root-bolts' ||
           node.kind === 'root-standards';
}

/**
 * Type guard for intent nodes.
 */
export function isIntentNode(node: TreeNode): node is IntentNode {
    return node.kind === 'intent';
}

/**
 * Type guard for unit nodes.
 */
export function isUnitNode(node: TreeNode): node is UnitNode {
    return node.kind === 'unit';
}

/**
 * Type guard for bolt nodes.
 */
export function isBoltNode(node: TreeNode): node is BoltNode {
    return node.kind === 'bolt';
}
