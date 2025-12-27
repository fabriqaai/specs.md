/**
 * VS Code API instance for webview.
 *
 * This module acquires the VS Code API and exports it for use by components.
 * IMPORTANT: This must only be imported by code running in the webview context.
 */

import type { VsCodeApi } from './types/vscode.js';

/**
 * The VS Code API instance.
 * Acquired once when this module loads.
 */
export const vscode: VsCodeApi = acquireVsCodeApi();
