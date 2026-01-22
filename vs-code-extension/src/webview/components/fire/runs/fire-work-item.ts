/**
 * FireWorkItem - Individual work item row in a run.
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import '../shared/fire-mode-badge.js';
import type { ExecutionMode } from '../shared/fire-mode-badge.js';

/**
 * Work item status within a run.
 */
export type RunItemStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Work item data.
 */
export interface RunWorkItemData {
    id: string;
    intentId: string;
    mode: ExecutionMode;
    status: RunItemStatus;
    title?: string;
}

/**
 * Work item row component.
 *
 * @fires open-file - When work item is clicked
 *
 * @example
 * ```html
 * <fire-work-item .item=${item} ?isCurrent=${true}></fire-work-item>
 * ```
 */
@customElement('fire-work-item')
export class FireWorkItem extends BaseElement {
    /**
     * Work item data.
     */
    @property({ type: Object })
    item!: RunWorkItemData;

    /**
     * Whether this is the currently executing item.
     */
    @property({ type: Boolean })
    isCurrent = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .item:hover {
                background: var(--editor-background);
            }

            .item.current {
                background: rgba(249, 115, 22, 0.1);
                border-left: 2px solid var(--status-active);
            }

            .status-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                flex-shrink: 0;
            }

            .status-icon.pending { color: var(--status-pending); }
            .status-icon.in_progress { color: var(--status-active); }
            .status-icon.completed { color: var(--status-complete); }
            .status-icon.failed { color: var(--status-blocked); }

            .name {
                flex: 1;
                font-size: 12px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .current-indicator {
                font-size: 9px;
                color: var(--status-active);
                padding: 1px 4px;
                background: rgba(249, 115, 22, 0.15);
                border-radius: 2px;
            }
        `
    ];

    render() {
        if (!this.item) return nothing;

        const statusIcon = this._getStatusIcon();

        return html`
            <div
                class="item ${this.isCurrent ? 'current' : ''}"
                @click=${this._handleClick}
                title="${this.item.title || this.item.id}"
            >
                <span class="status-icon ${this.item.status}">${statusIcon}</span>
                <span class="name">${this.item.title || this.item.id}</span>
                <fire-mode-badge mode=${this.item.mode}></fire-mode-badge>
                ${this.isCurrent ? html`<span class="current-indicator">current</span>` : nothing}
            </div>
        `;
    }

    private _getStatusIcon(): string {
        switch (this.item.status) {
            case 'pending': return '○';
            case 'in_progress': return '●';
            case 'completed': return '✓';
            case 'failed': return '✗';
            default: return '○';
        }
    }

    private _handleClick(): void {
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { id: this.item.id, intentId: this.item.intentId },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-work-item': FireWorkItem;
    }
}
