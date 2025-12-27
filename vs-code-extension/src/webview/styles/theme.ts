/**
 * Theme styles using VS Code CSS variables.
 * These ensure components match the VS Code theme.
 */

import { css } from 'lit';

/**
 * Base theme CSS variables for SpecsMD components.
 */
export const themeStyles = css`
    :host {
        /* VS Code font */
        --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        --font-size: var(--vscode-font-size, 13px);

        /* VS Code colors */
        --foreground: var(--vscode-foreground, #cccccc);
        --background: var(--vscode-sideBar-background, #252526);
        --editor-background: var(--vscode-editor-background, #1e1e1e);
        --border-color: var(--vscode-sideBarSectionHeader-border, #454545);
        --description-foreground: var(--vscode-descriptionForeground, #8b8b8b);

        /* SpecsMD accent colors */
        --accent-primary: #f97316;
        --status-complete: #22c55e;
        --status-active: #f97316;
        --status-pending: #6b7280;
        --status-blocked: #ef4444;
    }
`;

/**
 * Reset styles for consistent behavior.
 */
export const resetStyles = css`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    button {
        font-family: inherit;
        font-size: inherit;
        border: none;
        background: none;
        cursor: pointer;
    }
`;
