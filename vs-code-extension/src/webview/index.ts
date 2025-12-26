/**
 * Webview content generation - main entry point.
 * Based on variation-8-2.html design mockup.
 */

import * as vscode from 'vscode';
import { WebviewData, TabId } from '../sidebar/webviewMessaging';
import { getStyles } from './styles';
import { getBoltsViewHtml, getSpecsViewHtml, getOverviewViewHtml } from './html';
import { getScripts } from './scripts';

/**
 * Generates a nonce for CSP.
 */
export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

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
