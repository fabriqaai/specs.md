/**
 * FireCurrentRun - Section displaying the active run.
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import './fire-run-card.js';
import type { FireRunData } from './fire-run-card.js';

/**
 * Current run section component.
 * Displays multiple active runs (supports parallel runs).
 *
 * @fires continue-run - When continue button is clicked
 * @fires view-artifact - When artifact button is clicked
 * @fires open-file - When work item is clicked
 *
 * @example
 * ```html
 * <fire-current-run .runs=${activeRuns}></fire-current-run>
 * ```
 */
@customElement('fire-current-run')
export class FireCurrentRun extends BaseElement {
    /**
     * The active runs data (supports multiple parallel runs).
     */
    @property({ type: Array })
    runs: FireRunData[] = [];

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .fire-icon {
                font-size: 16px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--status-active);
                letter-spacing: 0.5px;
            }

            .empty-state {
                text-align: center;
                padding: 24px;
                color: var(--description-foreground);
            }

            .empty-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .empty-text {
                font-size: 12px;
            }

            .empty-hint {
                font-size: 11px;
                margin-top: 4px;
                opacity: 0.7;
            }
        `
    ];

    render() {
        const hasRuns = this.runs && this.runs.length > 0;
        const runCount = this.runs?.length || 0;
        const sectionTitle = runCount > 1 ? `Active Runs (${runCount})` : 'Current Run';

        return html`
            <div class="section">
                <div class="section-header">
                    <span class="fire-icon">🔥</span>
                    <span class="section-title">${sectionTitle}</span>
                </div>

                ${hasRuns ? html`
                    ${this.runs.map(run => html`
                        <fire-run-card
                            .run=${run}
                            ?isActive=${true}
                        ></fire-run-card>
                    `)}
                ` : html`
                    <div class="empty-state">
                        <div class="empty-icon">💤</div>
                        <div class="empty-text">No active run</div>
                        <div class="empty-hint">Start a run from pending work items below</div>
                    </div>
                `}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-current-run': FireCurrentRun;
    }
}
