/**
 * CurrentIntent - Intent picker with progress bar for the selected intent.
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
 * Intent picker option.
 */
export interface IntentOption {
    number: string;
    name: string;
}

/**
 * Intent picker component. Lets the user choose which intent to focus on and
 * displays a progress bar + breakdown for just that intent.
 *
 * @fires intent-select - Dispatched when the picker selection changes.
 *   detail: { number: string }
 *
 * @example
 * ```html
 * <current-intent
 *   .intents=${intents}
 *   .selected=${selected}
 *   .stats=${perIntentStats}>
 * </current-intent>
 * ```
 */
@customElement('current-intent')
export class CurrentIntent extends BaseElement {
    /**
     * Available intents for the picker.
     */
    @property({ type: Array })
    intents: IntentOption[] = [];

    /**
     * Currently selected intent number (or null for none).
     */
    @property({ type: String })
    selected: string | null = null;

    /**
     * Bolt statistics for the *selected* intent.
     */
    @property({ type: Object })
    stats: BoltStats = { active: 0, queued: 0, done: 0, blocked: 0 };

    /**
     * Intent number that the backend considers active/queued (for the
     * "(current)" marker in the dropdown).
     */
    @property({ type: String })
    currentIntentNumber: string | null = null;

    /**
     * Context for how the backend-selected intent was determined.
     */
    @property({ type: String })
    context: IntentContext = 'none';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                padding: 16px 16px 20px 16px;
                background: linear-gradient(135deg, var(--vscode-sideBar-background, #252526) 0%, rgba(249, 115, 22, 0.05) 100%);
            }

            .container {
                padding: 4px;
            }

            .label {
                font-size: 11px;
                font-weight: 600;
                color: #f97316;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 6px;
            }

            .picker {
                display: block;
                width: 100%;
                font-size: 12px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                background: var(--vscode-input-background, #3c3c3c);
                border: 1px solid var(--vscode-input-border, #3c3c3c);
                border-radius: 4px;
                padding: 6px 8px;
                margin: 4px 0 20px;
                cursor: pointer;
            }

            .picker:focus {
                outline: 1px solid #f97316;
                outline-offset: -1px;
            }

            .empty-title {
                font-size: 17px;
                font-weight: 700;
                color: var(--foreground, #cccccc);
                margin-bottom: 16px;
                opacity: 0.6;
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
        if (this.intents.length === 0) {
            return html`
                <div class="container">
                    <div class="label">Intent</div>
                    <div class="empty-title">No intents detected</div>
                </div>
            `;
        }

        const total = this.stats.active + this.stats.queued + this.stats.done + this.stats.blocked;
        const percent = total > 0 ? Math.round((this.stats.done / total) * 100) : 0;

        return html`
            <div class="container">
                <div class="label">Intent</div>
                <select class="picker" .value=${this.selected ?? ''} @change=${this._handleChange}>
                    ${this.intents.map(intent => {
                        const isCurrent = intent.number === this.currentIntentNumber;
                        const label = `${intent.number}-${intent.name}${isCurrent ? ' (current)' : ''}`;
                        return html`
                            <option value=${intent.number} ?selected=${intent.number === this.selected}>
                                ${label}
                            </option>
                        `;
                    })}
                </select>
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
            </div>
        `;
    }

    private _handleChange(e: Event): void {
        const target = e.target as HTMLSelectElement;
        this.dispatchEvent(new CustomEvent<{ number: string }>('intent-select', {
            detail: { number: target.value },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'current-intent': CurrentIntent;
    }
}
