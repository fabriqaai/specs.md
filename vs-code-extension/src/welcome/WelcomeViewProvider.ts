import * as vscode from 'vscode';
import { handleInstallCommand } from './installHandler';

/**
 * Provides the welcome view webview for non-specsmd workspaces.
 * Shows a branded onboarding experience with installation instructions.
 */
export class WelcomeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'specsmdWelcome';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'resources')
            ]
        };

        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'openWebsite':
                    vscode.env.openExternal(vscode.Uri.parse('https://specs.md'));
                    break;
                case 'copyCommand':
                    await vscode.env.clipboard.writeText('npx specsmd@latest install');
                    vscode.window.showInformationMessage('Command copied to clipboard!');
                    break;
                case 'install':
                    await handleInstallCommand();
                    break;
            }
        });
    }

    private _getHtmlContent(webview: vscode.Webview): string {
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'resources', 'logo.png')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Welcome to specsmd</title>
    <style>
        body {
            padding: 16px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: transparent;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 24px;
            cursor: pointer;
        }

        .logo {
            max-width: 120px;
            height: auto;
            image-rendering: pixelated;
        }

        .logo:hover {
            opacity: 0.8;
        }

        h2 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: var(--vscode-foreground);
        }

        p {
            margin: 0 0 16px 0;
            line-height: 1.5;
            color: var(--vscode-descriptionForeground);
        }

        .command-box {
            display: flex;
            align-items: center;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
        }

        .command-text {
            flex: 1;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            color: var(--vscode-input-foreground);
            user-select: all;
        }

        .copy-button {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: var(--vscode-foreground);
            opacity: 0.7;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .copy-button:hover {
            opacity: 1;
        }

        .copy-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .install-button {
            width: 100%;
            padding: 10px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.1s;
        }

        .install-button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .install-button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        .divider {
            height: 1px;
            background: var(--vscode-panel-border);
            margin: 16px 0;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .footer a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="logo-container" title="Visit specs.md">
        <img src="${logoUri}" alt="specsmd logo" class="logo" />
    </div>

    <h2>Welcome to specsmd</h2>

    <p>
        AI-native software development with multi-agent orchestration.
        Capture requirements, build iteratively, and deploy with confidence.
    </p>

    <p>Get started by running:</p>

    <div class="command-box">
        <code class="command-text">npx specsmd@latest install</code>
        <button class="copy-button" title="Copy to clipboard" aria-label="Copy command">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
            </svg>
        </button>
    </div>

    <button class="install-button">
        Install specsmd
    </button>

    <div class="divider"></div>

    <div class="footer">
        <a href="#" id="learnMoreLink">Learn more at specs.md</a>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        function openWebsite(e) {
            if (e) e.preventDefault();
            vscode.postMessage({ command: 'openWebsite' });
        }

        function copyCommand() {
            vscode.postMessage({ command: 'copyCommand' });
        }

        function install() {
            vscode.postMessage({ command: 'install' });
        }

        // Set up event listeners after DOM is ready
        document.getElementById('learnMoreLink').addEventListener('click', openWebsite);
        document.querySelector('.logo-container').addEventListener('click', openWebsite);
        document.querySelector('.copy-button').addEventListener('click', copyCommand);
        document.querySelector('.install-button').addEventListener('click', install);
    </script>
</body>
</html>`;
    }
}

/**
 * Generate a nonce for Content Security Policy
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
