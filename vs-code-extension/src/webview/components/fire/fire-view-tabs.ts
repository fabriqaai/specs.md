/**
 * FireViewTabs - Tab navigation for FIRE flow.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * FIRE tab identifiers.
 */
export type FireTabId = 'runs' | 'intents' | 'overview';

/**
 * Tab definition.
 */
export interface FireTabDef {
    id: FireTabId;
    label: string;
    icon: string;
}

/**
 * Available FIRE tabs.
 */
export const FIRE_TABS: FireTabDef[] = [
    { id: 'runs', label: 'Runs', icon: '🔥' },
    { id: 'intents', label: 'Intents', icon: '🎯' },
    { id: 'overview', label: 'Overview', icon: '📊' }
];

/**
 * Tab navigation component for FIRE flow.
 *
 * @fires tab-change - When a tab is clicked
 *
 * @example
 * ```html
 * <fire-view-tabs activeTab="runs"></fire-view-tabs>
 * ```
 */
@customElement('fire-view-tabs')
export class FireViewTabs extends BaseElement {
    /**
     * Currently active tab.
     */
    @property({ type: String })
    activeTab: FireTabId = 'runs';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .tabs {
                display: flex;
                align-items: center;
                padding: 0 8px;
            }

            .tab {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 12px;
                font-size: 11px;
                font-weight: 500;
                color: var(--description-foreground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.15s ease;
            }

            .tab:hover {
                color: var(--foreground);
                background: rgba(255, 255, 255, 0.03);
            }

            .tab.active {
                color: var(--status-active);
                border-bottom-color: var(--status-active);
            }

            .tab-icon {
                font-size: 12px;
            }
        `
    ];

    render() {
        return html`
            <div class="tabs">
                ${FIRE_TABS.map(tab => html`
                    <div
                        class="tab ${this.activeTab === tab.id ? 'active' : ''}"
                        @click=${() => this._handleTabClick(tab.id)}
                    >
                        <span class="tab-icon">${tab.icon}</span>
                        <span>${tab.label}</span>
                    </div>
                `)}
            </div>
        `;
    }

    private _handleTabClick(tabId: FireTabId): void {
        if (tabId !== this.activeTab) {
            this.dispatchEvent(new CustomEvent('tab-change', {
                detail: { tab: tabId },
                bubbles: true,
                composed: true
            }));
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-view-tabs': FireViewTabs;
    }
}
