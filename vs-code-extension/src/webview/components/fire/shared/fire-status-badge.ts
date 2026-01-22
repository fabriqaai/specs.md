/**
 * FireStatusBadge - Displays status (pending/in_progress/completed/blocked).
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';

/**
 * Status type.
 */
export type FireStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

/**
 * Badge showing the status of an item.
 *
 * @example
 * ```html
 * <fire-status-badge status="in_progress"></fire-status-badge>
 * ```
 */
@customElement('fire-status-badge')
export class FireStatusBadge extends BaseElement {
    /**
     * The status.
     */
    @property({ type: String })
    status: FireStatus = 'pending';

    /**
     * Size variant.
     */
    @property({ type: String })
    size: 'small' | 'normal' = 'normal';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: inline-flex;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
            }

            .badge.small {
                padding: 1px 4px;
                font-size: 9px;
            }

            .badge.pending {
                background: rgba(107, 114, 128, 0.15);
                color: var(--status-pending);
            }

            .badge.in_progress {
                background: rgba(249, 115, 22, 0.15);
                color: var(--status-active);
            }

            .badge.completed {
                background: rgba(34, 197, 94, 0.15);
                color: var(--status-complete);
            }

            .badge.blocked {
                background: rgba(239, 68, 68, 0.15);
                color: var(--status-blocked);
            }

            .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }

            .dot.pending { background: var(--status-pending); }
            .dot.in_progress { background: var(--status-active); }
            .dot.completed { background: var(--status-complete); }
            .dot.blocked { background: var(--status-blocked); }
        `
    ];

    render() {
        const label = this._getLabel();

        return html`
            <span class="badge ${this.status} ${this.size}">
                <span class="dot ${this.status}"></span>
                <span>${label}</span>
            </span>
        `;
    }

    private _getLabel(): string {
        switch (this.status) {
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'blocked': return 'Blocked';
            default: return this.status;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-status-badge': FireStatusBadge;
    }
}
