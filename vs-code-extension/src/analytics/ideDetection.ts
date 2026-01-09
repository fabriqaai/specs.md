/**
 * IDE Detection
 *
 * Detects the IDE environment the extension is running in.
 * Supports VS Code, VS Code Insiders, VSCodium, Cursor, Windsurf, Positron,
 * and falls back to sanitized appName for unknown IDEs.
 */

import * as vscode from 'vscode';
import type { IDEInfo } from './types';

/**
 * Mapping of VS Code appName values to normalized IDE names
 */
const IDE_MAPPINGS: Record<string, string> = {
    'Visual Studio Code': 'vscode',
    'Visual Studio Code - Insiders': 'vscode-insiders',
    'VSCodium': 'vscodium',
    'Cursor': 'cursor',
    'Windsurf': 'windsurf',
    'Positron': 'positron',
};

/**
 * Normalize an IDE name to lowercase kebab-case
 *
 * @param appName - Raw app name from vscode.env.appName
 * @returns Normalized IDE name
 */
function normalizeIdeName(appName: string): string {
    // Check for known IDE mapping first
    if (appName in IDE_MAPPINGS) {
        return IDE_MAPPINGS[appName];
    }

    // Fall back to sanitized lowercase kebab-case
    return appName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Detect the IDE environment
 *
 * Reads from vscode.env to determine:
 * - IDE name (normalized)
 * - IDE version
 * - IDE host (desktop, web, codespaces, etc.)
 *
 * @returns IDE information object
 */
export function detectIDE(): IDEInfo {
    try {
        const appName = vscode.env.appName || 'unknown';
        const version = vscode.version || 'unknown';
        const host = vscode.env.appHost || 'desktop';

        return {
            name: normalizeIdeName(appName),
            version,
            host,
        };
    } catch {
        // If vscode.env is not available (e.g., in tests), return defaults
        return {
            name: 'unknown',
            version: 'unknown',
            host: 'unknown',
        };
    }
}

/**
 * Check if running in a known AI-enhanced IDE
 *
 * @returns true if running in Cursor, Windsurf, or similar
 */
export function isAIEnhancedIDE(): boolean {
    const ide = detectIDE();
    return ['cursor', 'windsurf'].includes(ide.name);
}
