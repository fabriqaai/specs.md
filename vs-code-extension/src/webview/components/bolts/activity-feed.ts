/**
 * ActivityFeed - Recent activity list with filtering.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './activity-item.js';
import type { ActivityEventData } from './activity-item.js';

/**
 * Activity filter options.
 */
export type ActivityFilter = 'all' | 'stages' | 'bolts';

/**
 * Activity feed component with filtering.
 *
 * @fires filter-change - When filter is changed
 * @fires open-file - When file link is clicked
 *
 * @example
 * ```html
 * <activity-feed
 *   .events=${events}
 *   filter="all"
 * ></activity-feed>
 * ```
 */
@customElement('activity-feed')
export class ActivityFeed extends BaseElement {
    /**
     * Activity events.
     */
    @property({ type: Array })
    events: ActivityEventData[] = [];

    /**
     * Current filter.
     */
    @property({ type: String })
    filter: ActivityFilter = 'all';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 0;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px;
            }

            .title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--description-foreground, #858585);
            }

            .title-icon {
                font-size: 14px;
            }

            .filters {
                display: flex;
                gap: 6px;
            }

            .filter-btn {
                padding: 5px 12px;
                font-size: 11px;
                font-weight: 500;
                border-radius: 14px;
                color: var(--description-foreground, #858585);
                background: transparent;
                border: 1px solid var(--vscode-input-border, #3c3c3c);
                cursor: pointer;
                transition: all 0.15s;
            }

            .filter-btn:hover {
                color: var(--foreground, #cccccc);
                border-color: var(--foreground, #cccccc);
            }

            .filter-btn.active {
                background: #f97316;
                color: white;
                border-color: #f97316;
            }

            .list {
                flex: 1;
                overflow-y: auto;
            }

            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 80px;
                color: var(--description-foreground, #858585);
                font-size: 12px;
            }
        `
    ];

    render() {
        const filtered = this._filterEvents();

        return html`
            <div class="header">
                <div class="title">
                    <span class="title-icon">🕐</span>
                    Recent Activity
                </div>
                <div class="filters">
                    ${(['all', 'stages', 'bolts'] as ActivityFilter[]).map(f => html`
                        <button
                            class="filter-btn ${this.filter === f ? 'active' : ''}"
                            @click=${() => this._setFilter(f)}>
                            ${f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    `)}
                </div>
            </div>
            <div class="list">
                ${filtered.length > 0
                    ? filtered.slice(0, 10).map(event => html`
                        <activity-item .event=${event}></activity-item>
                    `)
                    : html`<div class="empty-state">No recent activity</div>`
                }
            </div>
        `;
    }

    private _filterEvents(): ActivityEventData[] {
        if (this.filter === 'all') {
            return this.events;
        }
        return this.events.filter(e => {
            if (this.filter === 'stages') {
                return e.tag === 'stage';
            }
            return e.tag === 'bolt';
        });
    }

    private _setFilter(filter: ActivityFilter): void {
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: { filter },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'activity-feed': ActivityFeed;
    }
}
