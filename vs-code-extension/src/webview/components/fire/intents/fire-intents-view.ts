/**
 * FireIntentsView - Main intents view container for FIRE flow.
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import './fire-intent-card.js';
import type { FireIntentData } from './fire-intent-card.js';
import type { FireStatus } from '../shared/fire-status-badge.js';

/**
 * Filter option type.
 */
export type IntentsFilter = 'all' | FireStatus;

/**
 * Intents view data.
 */
export interface FireIntentsViewData {
    intents: FireIntentData[];
    expandedIntents: string[];
    filter: IntentsFilter;
}

/**
 * Intents view container component.
 *
 * @fires open-file - When intent or work item is clicked
 * @fires filter-change - When filter is changed
 * @fires toggle-expand - When intent expand state changes
 *
 * @example
 * ```html
 * <fire-intents-view .data=${data}></fire-intents-view>
 * ```
 */
@customElement('fire-intents-view')
export class FireIntentsView extends BaseElement {
    /**
     * Intents view data.
     */
    @property({ type: Object })
    data!: FireIntentsViewData;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .header-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .title-icon {
                font-size: 14px;
            }

            .title-text {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: var(--background);
                border-radius: 10px;
                color: var(--description-foreground);
            }

            .filter-select {
                font-size: 11px;
                padding: 4px 8px;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--foreground);
                cursor: pointer;
            }

            .filter-select:focus {
                outline: none;
                border-color: var(--status-active);
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }

            .intents-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .empty-state {
                text-align: center;
                padding: 32px 16px;
                color: var(--description-foreground);
            }

            .empty-icon {
                font-size: 32px;
                margin-bottom: 12px;
            }

            .empty-text {
                font-size: 13px;
                margin-bottom: 4px;
            }

            .empty-hint {
                font-size: 11px;
                opacity: 0.7;
            }

            .stats-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
            }

            .stat-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }

            .stat-dot.completed { background: var(--status-complete); }
            .stat-dot.in_progress { background: var(--status-active); }
            .stat-dot.pending { background: var(--status-pending); }
            .stat-dot.blocked { background: var(--status-blocked); }

            .stat-value {
                font-weight: 500;
                color: var(--foreground);
            }

            .stat-label {
                color: var(--description-foreground);
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div>Loading...</div>`;
        }

        const { intents, expandedIntents, filter } = this.data;
        const filteredIntents = this._filterIntents(intents, filter);
        const stats = this._computeStats(intents);

        return html`
            <div class="header-bar">
                <div class="title">
                    <span class="title-icon">🎯</span>
                    <span class="title-text">Intents</span>
                    <span class="count-badge">${filteredIntents.length}</span>
                </div>
                <select class="filter-select" @change=${this._handleFilterChange}>
                    <option value="all" ?selected=${filter === 'all'}>All</option>
                    <option value="pending" ?selected=${filter === 'pending'}>Pending</option>
                    <option value="in_progress" ?selected=${filter === 'in_progress'}>In Progress</option>
                    <option value="completed" ?selected=${filter === 'completed'}>Completed</option>
                    <option value="blocked" ?selected=${filter === 'blocked'}>Blocked</option>
                </select>
            </div>

            <div class="stats-row">
                <div class="stat">
                    <span class="stat-dot completed"></span>
                    <span class="stat-value">${stats.completed}</span>
                    <span class="stat-label">completed</span>
                </div>
                <div class="stat">
                    <span class="stat-dot in_progress"></span>
                    <span class="stat-value">${stats.inProgress}</span>
                    <span class="stat-label">in progress</span>
                </div>
                <div class="stat">
                    <span class="stat-dot pending"></span>
                    <span class="stat-value">${stats.pending}</span>
                    <span class="stat-label">pending</span>
                </div>
            </div>

            <div class="content">
                ${filteredIntents.length > 0 ? html`
                    <div class="intents-list">
                        ${filteredIntents.map(intent => html`
                            <fire-intent-card
                                .intent=${intent}
                                ?expanded=${expandedIntents.includes(intent.id)}
                                @toggle-expand=${this._handleToggleExpand}
                                @open-file=${this._handleOpenFile}
                            ></fire-intent-card>
                        `)}
                    </div>
                ` : html`
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <div class="empty-text">No intents found</div>
                        <div class="empty-hint">
                            ${filter === 'all'
                                ? 'Create an intent to get started'
                                : `No ${filter.replace('_', ' ')} intents`}
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    private _filterIntents(intents: FireIntentData[], filter: IntentsFilter): FireIntentData[] {
        if (filter === 'all') return intents;
        return intents.filter(i => i.status === filter);
    }

    private _computeStats(intents: FireIntentData[]) {
        return {
            completed: intents.filter(i => i.status === 'completed').length,
            inProgress: intents.filter(i => i.status === 'in_progress').length,
            pending: intents.filter(i => i.status === 'pending').length,
            blocked: intents.filter(i => i.status === 'blocked').length
        };
    }

    private _handleFilterChange(e: Event): void {
        const select = e.target as HTMLSelectElement;
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: { filter: select.value },
            bubbles: true,
            composed: true
        }));
    }

    private _handleToggleExpand(e: CustomEvent<{ intentId: string; expanded: boolean }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('toggle-expand', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenFile(e: CustomEvent<{ path: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-intents-view': FireIntentsView;
    }
}
