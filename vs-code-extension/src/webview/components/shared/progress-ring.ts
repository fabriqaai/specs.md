/**
 * ProgressRing - SVG circular progress indicator.
 */

import { html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from './base-element.js';

/**
 * Circular progress ring component.
 *
 * @example
 * ```html
 * <progress-ring percent="75"></progress-ring>
 * ```
 */
@customElement('progress-ring')
export class ProgressRing extends BaseElement {
    /**
     * Progress percentage (0-100).
     */
    @property({ type: Number })
    percent = 0;

    /**
     * Size of the ring in pixels.
     */
    @property({ type: Number })
    size = 64;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: inline-block;
            }

            .ring-container {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            svg {
                transform: rotate(-90deg);
            }

            .ring-bg {
                fill: none;
                stroke: var(--border-color);
                stroke-width: 4;
            }

            .ring-fill {
                fill: none;
                stroke: var(--accent-primary);
                stroke-width: 4;
                stroke-linecap: round;
                stroke-dasharray: 157;
                transition: stroke-dashoffset 0.3s ease;
            }

            .ring-text {
                position: absolute;
                font-size: 14px;
                font-weight: 600;
                color: var(--foreground);
            }
        `
    ];

    render() {
        const radius = 25;
        const circumference = 2 * Math.PI * radius; // ~157
        const dashOffset = circumference - (circumference * this.percent / 100);

        return html`
            <div class="ring-container" style="width: ${this.size}px; height: ${this.size}px;">
                <svg width="${this.size}" height="${this.size}" viewBox="0 0 64 64">
                    <circle class="ring-bg" cx="32" cy="32" r="${radius}"></circle>
                    <circle
                        class="ring-fill"
                        cx="32"
                        cy="32"
                        r="${radius}"
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashOffset}">
                    </circle>
                </svg>
                <span class="ring-text">${this.percent}%</span>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'progress-ring': ProgressRing;
    }
}
