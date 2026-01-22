/**
 * FireIntentCard - Expandable card for an intent showing work items.
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PropertyValues } from 'lit';
import { BaseElement } from '../../shared/base-element.js';
import '../shared/fire-status-badge.js';
import '../shared/fire-mode-badge.js';
import type { FireStatus } from '../shared/fire-status-badge.js';
import type { ExecutionMode } from '../shared/fire-mode-badge.js';
import type { Complexity } from '../runs/fire-pending-items.js';

/**
 * Work item in intent context.
 */
export interface IntentWorkItemData {
    id: string;
    title: string;
    status: FireStatus;
    mode: ExecutionMode;
    complexity: Complexity;
    filePath: string;
}

/**
 * Intent data for display.
 */
export interface FireIntentData {
    id: string;
    title: string;
    status: FireStatus;
    filePath: string;
    description?: string;
    workItems: IntentWorkItemData[];
}

/**
 * Intent card component with expandable work items list.
 *
 * @fires open-file - When intent or work item is clicked
 * @fires toggle-expand - When expand state changes
 *
 * @example
 * ```html
 * <fire-intent-card .intent=${intent} ?expanded=${true}></fire-intent-card>
 * ```
 */
@customElement('fire-intent-card')
export class FireIntentCard extends BaseElement {
    /**
     * Intent data.
     */
    @property({ type: Object })
    intent!: FireIntentData;

    /**
     * Whether the card is expanded (from parent).
     */
    @property({ type: Boolean })
    expanded = false;

    /**
     * Local expanded state for immediate feedback.
     */
    @state()
    private _localExpanded = false;

    /**
     * Sync local state with property when it changes.
     */
    protected willUpdate(changedProperties: PropertyValues): void {
        if (changedProperties.has('expanded')) {
            this._localExpanded = this.expanded;
        }
    }

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                overflow: hidden;
            }

            .header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .header:hover {
                background: var(--background);
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
                width: 12px;
            }

            .toggle-icon.expanded {
                transform: rotate(90deg);
            }

            .intent-icon {
                font-size: 14px;
            }

            .intent-info {
                flex: 1;
                min-width: 0;
            }

            .intent-title {
                font-size: 12px;
                font-weight: 500;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .intent-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
            }

            .item-count {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .progress {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .progress-bar {
                width: 40px;
                height: 3px;
                background: var(--border-color);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--status-complete);
            }

            .progress-text {
                font-size: 9px;
                color: var(--description-foreground);
            }

            .work-items {
                border-top: 1px solid var(--border-color);
                padding: 4px;
            }

            .work-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .work-item:hover {
                background: var(--background);
            }

            .work-item-icon {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }

            .work-item-icon.pending { color: var(--status-pending); }
            .work-item-icon.in_progress { color: var(--status-active); }
            .work-item-icon.completed { color: var(--status-complete); }
            .work-item-icon.blocked { color: var(--status-blocked); }

            .work-item-info {
                flex: 1;
                min-width: 0;
            }

            .work-item-title {
                font-size: 11px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .work-item-badges {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .complexity {
                font-size: 8px;
                padding: 1px 3px;
                border-radius: 2px;
                text-transform: uppercase;
            }

            .complexity.low {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .complexity.medium {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .complexity.high {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }

            .open-intent-btn {
                font-size: 10px;
                padding: 2px 6px;
                color: var(--description-foreground);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .open-intent-btn:hover {
                background: var(--background);
                color: var(--foreground);
            }
        `
    ];

    render() {
        if (!this.intent) return nothing;

        const completed = this.intent.workItems.filter(w => w.status === 'completed').length;
        const total = this.intent.workItems.length;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return html`
            <div class="card">
                <div class="header" @click=${this._handleHeaderClick}>
                    <span class="toggle-icon ${this._localExpanded ? 'expanded' : ''}">▶</span>
                    <span class="intent-icon">🎯</span>
                    <div class="intent-info">
                        <div class="intent-title">${this.intent.title}</div>
                        <div class="intent-meta">
                            <span class="item-count">${total} work item${total !== 1 ? 's' : ''}</span>
                            <div class="progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <span class="progress-text">${completed}/${total}</span>
                            </div>
                        </div>
                    </div>
                    <fire-status-badge status=${this.intent.status} size="small"></fire-status-badge>
                    <button class="open-intent-btn" @click=${this._handleOpenIntent} title="Open intent brief">
                        🔍
                    </button>
                </div>

                ${this._localExpanded && this.intent.workItems.length > 0 ? html`
                    <div class="work-items">
                        ${this.intent.workItems.map(item => this._renderWorkItem(item))}
                    </div>
                ` : nothing}
            </div>
        `;
    }

    private _renderWorkItem(item: IntentWorkItemData) {
        const icon = this._getStatusIcon(item.status);

        return html`
            <div class="work-item" @click=${() => this._handleWorkItemClick(item)}>
                <span class="work-item-icon ${item.status}">${icon}</span>
                <div class="work-item-info">
                    <div class="work-item-title">${item.title || item.id}</div>
                </div>
                <div class="work-item-badges">
                    <fire-mode-badge mode=${item.mode}></fire-mode-badge>
                    <span class="complexity ${item.complexity}">${item.complexity}</span>
                </div>
            </div>
        `;
    }

    private _getStatusIcon(status: FireStatus): string {
        switch (status) {
            case 'pending': return '○';
            case 'in_progress': return '●';
            case 'completed': return '✓';
            case 'blocked': return '⚠';
            default: return '○';
        }
    }

    private _handleHeaderClick(): void {
        // Toggle local state immediately for responsive UI
        this._localExpanded = !this._localExpanded;

        // Dispatch event for persistence
        this.dispatchEvent(new CustomEvent('toggle-expand', {
            detail: { intentId: this.intent.id, expanded: this._localExpanded },
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenIntent(e: Event): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: this.intent.filePath },
            bubbles: true,
            composed: true
        }));
    }

    private _handleWorkItemClick(item: IntentWorkItemData): void {
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: item.filePath },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-intent-card': FireIntentCard;
    }
}
