/**
 * EmptyState - Consistent empty state display.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from './base-element.js';

/**
 * Empty state component for displaying when no data is available.
 *
 * @example
 * ```html
 * <empty-state icon="📭" message="No items found"></empty-state>
 * ```
 */
@customElement('empty-state')
export class EmptyState extends BaseElement {
    /**
     * Icon to display (emoji or text).
     */
    @property({ type: String })
    icon = '📭';

    /**
     * Primary message.
     */
    @property({ type: String })
    message = 'No items found';

    /**
     * Optional hint or secondary text.
     */
    @property({ type: String })
    hint = '';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 32px 16px;
                text-align: center;
            }

            .icon {
                font-size: 32px;
                margin-bottom: 12px;
                opacity: 0.7;
            }

            .message {
                font-size: 13px;
                font-weight: 500;
                color: var(--foreground);
                margin-bottom: 4px;
            }

            .hint {
                font-size: 11px;
                color: var(--description-foreground);
            }
        `
    ];

    render() {
        return html`
            <div class="icon">${this.icon}</div>
            <div class="message">${this.message}</div>
            ${this.hint ? html`<div class="hint">${this.hint}</div>` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'empty-state': EmptyState;
    }
}
