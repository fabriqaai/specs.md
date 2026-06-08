/**
 * Theme styles and helpers for SpecsMD components.
 * These ensure components can match either the host VS Code theme or the
 * standalone dashboard theme switch.
 */

import { css } from 'lit';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'specsmd:webview-theme';

const THEME_PALETTES: Record<ThemeMode, Record<string, string>> = {
    dark: {
        '--vscode-foreground': '#cccccc',
        '--vscode-descriptionForeground': '#8b8b8b',
        '--vscode-sideBar-background': '#252526',
        '--vscode-editor-background': '#1e1e1e',
        '--vscode-sideBarSectionHeader-background': '#2d2d30',
        '--vscode-sideBarSectionHeader-border': '#454545',
        '--vscode-input-background': '#3c3c3c',
        '--vscode-input-border': '#3f3f46',
        '--vscode-list-hoverBackground': '#2a2d2e',
        '--vscode-list-activeSelectionBackground': '#094771',
        '--vscode-badge-background': '#4d4d4d',
        '--vscode-badge-foreground': '#ffffff',
        '--vscode-button-background': '#0e639c',
        '--vscode-button-foreground': '#ffffff',
        '--vscode-scrollbarSlider-background': '#686868',
        '--vscode-font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        '--vscode-font-size': '13px',
        '--specsmd-color-scheme': 'dark',
        '--specsmd-surface-glow': 'rgba(249, 115, 22, 0.05)'
    },
    light: {
        '--vscode-foreground': '#1f2328',
        '--vscode-descriptionForeground': '#57606a',
        '--vscode-sideBar-background': '#f6f8fa',
        '--vscode-editor-background': '#ffffff',
        '--vscode-sideBarSectionHeader-background': '#eef2f7',
        '--vscode-sideBarSectionHeader-border': '#d0d7de',
        '--vscode-input-background': '#ffffff',
        '--vscode-input-border': '#d0d7de',
        '--vscode-list-hoverBackground': '#eef2f7',
        '--vscode-list-activeSelectionBackground': '#dbeafe',
        '--vscode-badge-background': '#d0d7de',
        '--vscode-badge-foreground': '#24292f',
        '--vscode-button-background': '#0e639c',
        '--vscode-button-foreground': '#ffffff',
        '--vscode-scrollbarSlider-background': '#b6c2cf',
        '--vscode-font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        '--vscode-font-size': '13px',
        '--specsmd-color-scheme': 'light',
        '--specsmd-surface-glow': 'rgba(14, 99, 156, 0.06)'
    }
};

function isThemeMode(value: unknown): value is ThemeMode {
    return value === 'dark' || value === 'light';
}

function getThemeRoot(target?: Document | HTMLElement): HTMLElement | null {
    if (typeof document === 'undefined') {
        return null;
    }

    if (!target) {
        return document.documentElement;
    }

    if (target instanceof Document) {
        return target.documentElement;
    }

    return target;
}

function readStoredTheme(): ThemeMode | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
    }

    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeMode(stored) ? stored : null;
    } catch {
        return null;
    }
}

function getSystemTheme(): ThemeMode {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    return 'dark';
}

export function getInitialTheme(state?: unknown): ThemeMode {
    if (isThemeMode(state)) {
        return state;
    }

    const stored = readStoredTheme();
    if (stored) {
        return stored;
    }

    return getSystemTheme();
}

export function persistTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Theme persistence is best-effort in the standalone browser host.
    }
}

export function applyTheme(theme: ThemeMode, target?: Document | HTMLElement): void {
    const root = getThemeRoot(target);
    if (!root) {
        return;
    }

    const palette = THEME_PALETTES[theme];
    for (const [name, value] of Object.entries(palette)) {
        root.style.setProperty(name, value);
    }

    root.dataset.theme = theme;
    root.style.setProperty('color-scheme', palette['--specsmd-color-scheme']);
}

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

        color-scheme: var(--specsmd-color-scheme, dark);
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
