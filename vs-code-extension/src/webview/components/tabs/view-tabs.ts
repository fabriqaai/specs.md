/**
 * ViewTabs Component - Tab navigation for SpecsMD views.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * Valid tab identifiers.
 */
export type TabId = 'bolts' | 'specs' | 'overview';

/**
 * Tab definition with icon and label.
 */
interface TabDef {
    id: TabId;
    icon: string;
    label: string;
}

/**
 * Available tabs configuration.
 */
const TABS: TabDef[] = [
    { id: 'bolts', icon: '\u26A1', label: 'Bolts' },     // Lightning bolt
    { id: 'specs', icon: '\uD83D\uDCCB', label: 'Specs' },  // Clipboard
    { id: 'overview', icon: '\uD83D\uDCCA', label: 'Overview' }  // Chart
];

/**
 * Tab change event detail.
 */
export interface TabChangeDetail {
    tab: TabId;
}

/**
 * ViewTabs component for switching between Bolts, Specs, and Overview views.
 *
 * @fires tab-change - Dispatched when a tab is clicked
 *
 * @example
 * ```html
 * <view-tabs activeTab="bolts" @tab-change=${this._onTabChange}></view-tabs>
 * ```
 */
@customElement('view-tabs')
export class ViewTabs extends BaseElement {
    /**
     * The currently active tab.
     */
    @property({ type: String })
    activeTab: TabId = 'bolts';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            button {
                flex: 1;
                padding: 10px 8px;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
                color: var(--description-foreground);
                border-bottom: 2px solid transparent;
                transition: color 0.15s, border-color 0.15s;
            }

            button:hover {
                color: var(--foreground);
            }

            button.active {
                color: var(--accent-primary);
                border-bottom-color: var(--accent-primary);
            }

            .tab-icon {
                margin-right: 4px;
            }
        `
    ];

    render() {
        return html`
            ${TABS.map(tab => html`
                <button
                    class=${this.activeTab === tab.id ? 'active' : ''}
                    @click=${() => this._selectTab(tab.id)}
                    aria-selected=${this.activeTab === tab.id}
                    role="tab"
                >
                    <span class="tab-icon">${tab.icon}</span>${tab.label}
                </button>
            `)}
        `;
    }

    /**
     * Handle tab selection.
     */
    private _selectTab(tab: TabId): void {
        if (tab === this.activeTab) {
            return;
        }

        this.dispatchEvent(new CustomEvent<TabChangeDetail>('tab-change', {
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
