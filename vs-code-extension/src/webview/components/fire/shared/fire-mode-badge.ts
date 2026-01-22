/**
 * FireModeBadge - Displays execution mode (autopilot/confirm/validate).
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';

/**
 * Execution mode type.
 */
export type ExecutionMode = 'autopilot' | 'confirm' | 'validate';

/**
 * Badge showing the execution mode of a work item.
 *
 * @example
 * ```html
 * <fire-mode-badge mode="autopilot"></fire-mode-badge>
 * ```
 */
@customElement('fire-mode-badge')
export class FireModeBadge extends BaseElement {
    /**
     * The execution mode.
     */
    @property({ type: String })
    mode: ExecutionMode = 'confirm';

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
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .badge.autopilot {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }

            .badge.confirm {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
                border: 1px solid rgba(249, 115, 22, 0.3);
            }

            .badge.validate {
                background: rgba(139, 92, 246, 0.15);
                color: #8b5cf6;
                border: 1px solid rgba(139, 92, 246, 0.3);
            }

            .icon {
                font-size: 10px;
            }
        `
    ];

    render() {
        const icon = this._getIcon();
        const label = this._getLabel();

        return html`
            <span class="badge ${this.mode}">
                <span class="icon">${icon}</span>
                <span>${label}</span>
            </span>
        `;
    }

    private _getIcon(): string {
        switch (this.mode) {
            case 'autopilot': return '🚀';
            case 'confirm': return '✋';
            case 'validate': return '🔍';
            default: return '•';
        }
    }

    private _getLabel(): string {
        switch (this.mode) {
            case 'autopilot': return 'Auto';
            case 'confirm': return 'Confirm';
            case 'validate': return 'Validate';
            default: return this.mode;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-mode-badge': FireModeBadge;
    }
}
