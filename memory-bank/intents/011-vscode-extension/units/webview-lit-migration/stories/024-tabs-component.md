---
id: vscode-extension-story-wlm-024
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
implemented: true
priority: must
created: 2025-12-26
---

# Story: Migrate Tabs to Lit Component

## User Story

**As a** user
**I want** clickable tabs that switch views
**So that** I can navigate between Bolts, Specs, and Overview

## Acceptance Criteria

- [ ] **Given** tabs component, **When** rendered, **Then** shows 3 tabs with icons
- [ ] **Given** Bolts tab clicked, **When** event fires, **Then** Bolts view shows
- [ ] **Given** tab change, **When** VS Code notified, **Then** state persists
- [ ] **Given** extension restart, **When** sidebar opens, **Then** last tab restored

## Technical Implementation

### Create ViewTabs Component
```typescript
// src/webview/components/tabs/view-tabs.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type TabId = 'bolts' | 'specs' | 'overview';

@customElement('view-tabs')
export class ViewTabs extends LitElement {
    @property({ type: String }) activeTab: TabId = 'bolts';

    static styles = css`
        :host {
            display: flex;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
        }

        button {
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
            transition: color 0.15s, border-color 0.15s;
        }

        button.active {
            color: var(--accent-primary, #f97316);
            border-bottom-color: var(--accent-primary, #f97316);
        }
    `;

    render() {
        return html`
            <button
                class=${this.activeTab === 'bolts' ? 'active' : ''}
                @click=${() => this._selectTab('bolts')}>
                ⚡ Bolts
            </button>
            <button
                class=${this.activeTab === 'specs' ? 'active' : ''}
                @click=${() => this._selectTab('specs')}>
                📋 Specs
            </button>
            <button
                class=${this.activeTab === 'overview' ? 'active' : ''}
                @click=${() => this._selectTab('overview')}>
                📊 Overview
            </button>
        `;
    }

    private _selectTab(tab: TabId) {
        this.dispatchEvent(new CustomEvent('tab-change', {
            detail: { tab },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'view-tabs': ViewTabs;
    }
}
```

### Update App to Use ViewTabs
```typescript
// src/webview/components/app.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './tabs/view-tabs.js';
import type { TabId } from './tabs/view-tabs.js';
import { vscode } from '../index.js';

@customElement('specsmd-app')
export class SpecsmdApp extends LitElement {
    @state() private activeTab: TabId = 'bolts';

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
    `;

    render() {
        return html`
            <view-tabs
                .activeTab=${this.activeTab}
                @tab-change=${this._handleTabChange}>
            </view-tabs>
            <!-- View content here -->
        `;
    }

    private _handleTabChange(e: CustomEvent<{ tab: TabId }>) {
        this.activeTab = e.detail.tab;
        vscode.postMessage({ type: 'tabChange', tab: e.detail.tab });
    }
}
```

## Files to Create

- `src/webview/components/tabs/view-tabs.ts`

## Files to Modify

- `src/webview/components/app.ts` - Import and use view-tabs

## Testing

- Manual: Tabs render with correct icons
- Manual: Click tab, view changes
- Manual: Tab state persists across sidebar hide/show

## Dependencies

### Requires
- 023-lit-scaffold

### Enables
- 025-bolts-view-components
