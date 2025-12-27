/**
 * ProgressBar - Linear progress indicator.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from './base-element.js';

/**
 * Linear progress bar component.
 *
 * @example
 * ```html
 * <progress-bar percent="75" label="Complete"></progress-bar>
 * ```
 */
@customElement('progress-bar')
export class ProgressBar extends BaseElement {
    /**
     * Progress percentage (0-100).
     */
    @property({ type: Number })
    percent = 0;

    /**
     * Optional label to display.
     */
    @property({ type: String })
    label = '';

    /**
     * Whether to show percentage text.
     */
    @property({ type: Boolean })
    showPercent = true;

    /**
     * Bar height in pixels.
     */
    @property({ type: Number })
    height = 8;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .container {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .label {
                font-size: 11px;
                color: var(--description-foreground);
            }

            .percent {
                font-size: 12px;
                font-weight: 600;
                color: var(--foreground);
            }

            .track {
                width: 100%;
                background: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .fill {
                height: 100%;
                background: var(--accent-primary);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .fill.complete {
                background: var(--status-complete);
            }
        `
    ];

    render() {
        const clampedPercent = Math.max(0, Math.min(100, this.percent));
        const isComplete = clampedPercent === 100;

        return html`
            <div class="container">
                ${this.label || this.showPercent ? html`
                    <div class="header">
                        ${this.label ? html`<span class="label">${this.label}</span>` : ''}
                        ${this.showPercent ? html`<span class="percent">${clampedPercent}%</span>` : ''}
                    </div>
                ` : ''}
                <div class="track" style="height: ${this.height}px;">
                    <div
                        class="fill ${isComplete ? 'complete' : ''}"
                        style="width: ${clampedPercent}%;">
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'progress-bar': ProgressBar;
    }
}
