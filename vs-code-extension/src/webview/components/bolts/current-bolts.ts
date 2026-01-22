/**
 * CurrentIntent - Current intent with progress bar and statistics.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * Intent info.
 */
export interface IntentInfo {
    name: string;
    number: string;
}

/**
 * Bolt statistics.
 */
export interface BoltStats {
    active: number;
    queued: number;
    done: number;
    blocked: number;
}

/**
 * Context for how the current intent was selected.
 */
export type IntentContext = 'active' | 'queued' | 'none';

/**
 * Current intent component with progress bar.
 *
 * @example
 * ```html
 * <current-intent .intent=${intent} .stats=${stats}></current-intent>
 * ```
 */
@customElement('current-intent')
export class CurrentIntent extends BaseElement {
    /**
     * Current intent info.
     */
    @property({ type: Object })
    intent: IntentInfo | null = null;

    /**
     * Context for how the intent was selected.
     */
    @property({ type: String })
    context: IntentContext = 'none';

    /**
     * Bolt statistics.
     */
    @property({ type: Object })
    stats: BoltStats = { active: 0, queued: 0, done: 0, blocked: 0 };

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                padding: 16px 16px 20px 16px;
                background: linear-gradient(135deg, var(--vscode-sideBar-background, #252526) 0%, rgba(249, 115, 22, 0.05) 100%);
                border-top: 3px solid #f97316;
            }

            .label {
                font-size: 11px;
                font-weight: 600;
                color: #f97316;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 6px;
            }

            .title {
                font-size: 17px;
                font-weight: 700;
                color: var(--foreground, #cccccc);
                margin-bottom: 16px;
                line-height: 1.2;
            }

            .progress-container {
                margin-bottom: 14px;
            }

            .progress-bar {
                height: 8px;
                background: var(--vscode-input-background, #3c3c3c);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .progress-text {
                font-size: 13px;
                color: var(--foreground, #cccccc);
            }

            .progress-text strong {
                font-weight: 600;
            }

            .progress-text .percent {
                color: #22c55e;
                font-weight: 700;
            }

            .breakdown {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .breakdown-item {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .breakdown-item::before {
                content: '·';
                color: var(--description-foreground, #858585);
            }

            .breakdown-item:first-child::before {
                content: '';
            }

            .breakdown-item.active {
                color: #f97316;
            }

            .breakdown-item.blocked {
                color: #ef4444;
            }
        `
    ];

    render() {
        // Determine label based on context
        const label = this.context === 'queued' ? 'Next Intent' : 'Current Intent';

        if (!this.intent) {
            return html`
                <div class="label">${label}</div>
                <div class="title" style="opacity: 0.6;">No active work</div>
            `;
        }

        const total = this.stats.active + this.stats.queued + this.stats.done + this.stats.blocked;
        const percent = total > 0 ? Math.round((this.stats.done / total) * 100) : 0;

        return html`
            <div class="label">${label}</div>
            <div class="title">${this.intent.number}-${this.intent.name}</div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="progress-text">
                    <span class="percent">${percent}%</span> complete
                    <span>(${this.stats.done} of ${total} bolts)</span>
                </div>
            </div>
            <div class="breakdown">
                ${this.stats.active > 0 ? html`
                    <span class="breakdown-item active">${this.stats.active} in progress</span>
                ` : ''}
                ${this.stats.queued > 0 ? html`
                    <span class="breakdown-item">${this.stats.queued} queued</span>
                ` : ''}
                ${this.stats.blocked > 0 ? html`
                    <span class="breakdown-item blocked">${this.stats.blocked} blocked</span>
                ` : ''}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'current-intent': CurrentIntent;
    }
}
