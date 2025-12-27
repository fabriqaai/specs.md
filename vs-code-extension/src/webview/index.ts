/**
 * Webview content generation - main entry point.
 * Based on variation-8-2.html design mockup.
 *
 * Supports two modes:
 * - Legacy: Full HTML generation with inline scripts (getWebviewContent)
 * - Lit: Minimal scaffold with Lit bundle (getLitWebviewContent)
 */

import * as vscode from 'vscode';
import { WebviewData, TabId } from '../sidebar/webviewMessaging';
import { getStyles } from './styles';
import { getBoltsViewHtml, getSpecsViewHtml, getOverviewViewHtml } from './html';
import { getScripts } from './scripts';
import { getNonce } from './utils';

// Re-export view HTML generators for use with Lit postMessage approach
export { getBoltsViewHtml, getSpecsViewHtml, getOverviewViewHtml } from './html';

// Re-export getNonce for backward compatibility
export { getNonce } from './utils';

/**
 * Generates the full HTML content for the webview.
 */
export function getWebviewContent(
    webview: vscode.Webview,
    data: WebviewData,
    activeTab: TabId
): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>SpecsMD</title>
    <style>${getStyles()}</style>
</head>
<body>
    <div class="sidebar">
        <div class="view-tabs">
            <button type="button" class="view-tab ${activeTab === 'bolts' ? 'active' : ''}" data-tab="bolts">
                &#9889; Bolts
            </button>
            <button type="button" class="view-tab ${activeTab === 'specs' ? 'active' : ''}" data-tab="specs">
                &#128203; Specs
            </button>
            <button type="button" class="view-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                &#128202; Overview
            </button>
        </div>

        <div class="view-container ${activeTab === 'bolts' ? 'active' : ''}" id="bolts-view">
            ${getBoltsViewHtml(data)}
        </div>

        <div class="view-container ${activeTab === 'specs' ? 'active' : ''}" id="specs-view">
            ${getSpecsViewHtml(data)}
        </div>

        <div class="view-container ${activeTab === 'overview' ? 'active' : ''}" id="overview-view">
            ${getOverviewViewHtml(data)}
        </div>
    </div>

    <script nonce="${nonce}">${getScripts()}</script>
</body>
</html>`;
}

/**
 * Generates the Lit-based HTML scaffold for the webview.
 * This loads the Lit bundle and creates the <specsmd-app> element.
 * Data is sent via postMessage after the webview loads.
 */
export function getLitWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
): string {
    const nonce = getNonce();

    // Get URI to the bundled webview script
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'bundle.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>SpecsMD</title>
    <style>${getStyles()}</style>
</head>
<body>
    <specsmd-app></specsmd-app>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
