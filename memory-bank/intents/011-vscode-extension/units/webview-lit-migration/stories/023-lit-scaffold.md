---
id: vscode-extension-story-wlm-023
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
implemented: true
priority: must
created: 2025-12-26
---

# Story: Create Lit Project Structure

## User Story

**As a** developer
**I want** a well-organized Lit component structure
**So that** I can build maintainable, reusable components

## Acceptance Criteria

- [ ] **Given** Lit installed, **When** app component created, **Then** renders in webview
- [ ] **Given** project structure, **When** developer looks, **Then** clear organization
- [ ] **Given** VS Code theme, **When** component renders, **Then** uses theme colors
- [ ] **Given** basic app, **When** tabs exist, **Then** tabs display correctly

## Technical Implementation

### 1. Install Lit
```bash
npm install lit
```

### 2. Create Directory Structure
```
src/webview/
├── components/
│   ├── app.ts                 # Root <specsmd-app>
│   └── shared/
│       └── base-element.ts    # Base class with common styles
├── styles/
│   └── theme.ts               # VS Code CSS variables as Lit styles
├── types/
│   └── index.ts               # Shared TypeScript types
└── index.ts                   # Entry point
```

### 3. Create Base Element
```typescript
// src/webview/components/shared/base-element.ts
import { LitElement, css } from 'lit';

export class BaseElement extends LitElement {
    static baseStyles = css`
        :host {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
        }

        * {
            box-sizing: border-box;
        }
    `;
}
```

### 4. Create Theme Styles
```typescript
// src/webview/styles/theme.ts
import { css } from 'lit';

export const themeStyles = css`
    :root {
        --status-complete: #22c55e;
        --status-active: #f97316;
        --status-pending: #6b7280;
        --status-blocked: #ef4444;
        --accent-primary: #f97316;
    }
`;
```

### 5. Create App Component
```typescript
// src/webview/components/app.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('specsmd-app')
export class SpecsmdApp extends LitElement {
    @state() private activeTab: 'bolts' | 'specs' | 'overview' = 'bolts';

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }

        .view-tabs {
            display: flex;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
        }

        .view-tab {
            flex: 1;
            padding: 10px;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            background: none;
            border: none;
            color: var(--vscode-descriptionForeground);
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }

        .view-tab.active {
            color: var(--accent-primary, #f97316);
            border-bottom-color: var(--accent-primary, #f97316);
        }
    `;

    render() {
        return html`
            <div class="view-tabs">
                <button
                    class="view-tab ${this.activeTab === 'bolts' ? 'active' : ''}"
                    @click=${() => this._setTab('bolts')}>
                    ⚡ Bolts
                </button>
                <button
                    class="view-tab ${this.activeTab === 'specs' ? 'active' : ''}"
                    @click=${() => this._setTab('specs')}>
                    📋 Specs
                </button>
                <button
                    class="view-tab ${this.activeTab === 'overview' ? 'active' : ''}"
                    @click=${() => this._setTab('overview')}>
                    📊 Overview
                </button>
            </div>

            <div class="view-content">
                ${this.activeTab === 'bolts' ? html`<div>Bolts View (TODO)</div>` : ''}
                ${this.activeTab === 'specs' ? html`<div>Specs View (TODO)</div>` : ''}
                ${this.activeTab === 'overview' ? html`<div>Overview View (TODO)</div>` : ''}
            </div>
        `;
    }

    private _setTab(tab: 'bolts' | 'specs' | 'overview') {
        this.activeTab = tab;
        // Will add VS Code messaging later
    }
}
```

### 6. Create Entry Point
```typescript
// src/webview/index.ts
import './components/app.js';

// Declare VS Code API
declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

// Export for use in components
export const vscode = acquireVsCodeApi();
```

## Files to Create

- `src/webview/components/app.ts`
- `src/webview/components/shared/base-element.ts`
- `src/webview/styles/theme.ts`
- `src/webview/types/index.ts`
- `src/webview/index.ts`

## Testing

- Manual: Extension loads, tabs render
- Manual: Click tab, it becomes active
- Manual: VS Code theme colors applied

## Dependencies

### Requires
- 022-setup-esbuild

### Enables
- 024-tabs-component
- 025-bolts-view-components
- 026-specs-view-components
- 027-overview-view-components
