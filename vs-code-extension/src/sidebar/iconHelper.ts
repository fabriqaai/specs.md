/**
 * Icon helper for status-based icons with colors.
 * Provides themed icons for VS Code TreeView.
 */

import * as vscode from 'vscode';
import { ArtifactStatus } from '../parser/types';
import { TreeNode, NODE_ICONS } from './types';

/**
 * Status icon configurations.
 * Maps status to icon ID and color.
 * Uses consistent circle icons with color indicating status.
 */
const STATUS_ICON_CONFIG: Record<ArtifactStatus, { icon: string; color: string }> = {
    [ArtifactStatus.Complete]: {
        icon: 'circle-filled',
        color: 'charts.green'
    },
    [ArtifactStatus.InProgress]: {
        icon: 'circle-filled',
        color: 'charts.yellow'
    },
    [ArtifactStatus.Draft]: {
        icon: 'circle-outline',
        color: 'disabledForeground'
    },
    [ArtifactStatus.Blocked]: {
        icon: 'circle-filled',
        color: 'charts.red'
    },
    [ArtifactStatus.Unknown]: {
        icon: 'circle-outline',
        color: 'disabledForeground'
    }
};

/**
 * Gets a themed icon for a status.
 */
export function getStatusIcon(status: ArtifactStatus): vscode.ThemeIcon {
    const config = STATUS_ICON_CONFIG[status];
    return new vscode.ThemeIcon(config.icon, new vscode.ThemeColor(config.color));
}

/**
 * Gets the appropriate icon for a tree node.
 * Uses status-aware icons for nodes with status, otherwise uses default icons.
 */
export function getNodeIcon(node: TreeNode): vscode.ThemeIcon {
    // For nodes with status, use status-aware icons
    switch (node.kind) {
        case 'intent':
        case 'unit':
        case 'story':
            return getStatusIcon(node.data.status);
        case 'bolt':
            return getStatusIcon(node.data.status);
        case 'bolt-stage':
        case 'bolt-story':
            return getStatusIcon(node.status);
        default: {
            // Use default icon from NODE_ICONS
            const iconId = NODE_ICONS[node.kind];
            return new vscode.ThemeIcon(iconId);
        }
    }
}

/**
 * Gets bolt type badge text for display.
 */
export function getBoltTypeBadge(type: string): string {
    switch (type) {
        case 'ddd-construction-bolt':
            return '[DDD]';
        case 'simple-construction-bolt':
            return '[Simple]';
        default:
            return '';
    }
}
