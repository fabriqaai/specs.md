/**
 * FireRunsView - Main runs view container for FIRE flow.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import './fire-current-run.js';
import './fire-pending-items.js';
import './fire-completed-runs.js';
import type { FireRunData } from './fire-run-card.js';
import type { PendingWorkItemData } from './fire-pending-items.js';
import type { CompletedRunData } from './fire-completed-runs.js';

/**
 * Stats for the runs view.
 */
export interface FireRunsStats {
    totalWorkItems: number;
    completedWorkItems: number;
    inProgressWorkItems: number;
    pendingWorkItems: number;
    totalRuns: number;
    completedRuns: number;
    activeRunsCount: number;
}

/**
 * Complete runs view data.
 */
export interface FireRunsViewData {
    activeRuns: FireRunData[];
    pendingItems: PendingWorkItemData[];
    completedRuns: CompletedRunData[];
    stats: FireRunsStats;
}

/**
 * Runs view container component.
 *
 * @fires continue-run - When continue button is clicked
 * @fires start-run - When start run button is clicked
 * @fires view-artifact - When artifact button is clicked
 * @fires view-run - When completed run is clicked
 * @fires open-file - When work item is clicked
 *
 * @example
 * ```html
 * <fire-runs-view .data=${data}></fire-runs-view>
 * ```
 */
@customElement('fire-runs-view')
export class FireRunsView extends BaseElement {
    /**
     * Complete runs view data.
     */
    @property({ type: Object })
    data!: FireRunsViewData;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .stats-bar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
            }

            .stat-value {
                font-weight: 600;
                color: var(--foreground);
            }

            .stat-label {
                color: var(--description-foreground);
            }

            .stat-icon {
                font-size: 12px;
            }

            .progress-bar {
                flex: 1;
                height: 4px;
                background: var(--border-color);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--status-complete);
                transition: width 0.3s ease;
            }

            .content {
                flex: 1;
                overflow-y: auto;
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div>Loading...</div>`;
        }

        const { activeRuns, pendingItems, completedRuns, stats } = this.data;
        const progressPercent = stats.totalWorkItems > 0
            ? Math.round((stats.completedWorkItems / stats.totalWorkItems) * 100)
            : 0;

        return html`
            <div class="stats-bar">
                <div class="stat">
                    <span class="stat-icon">📊</span>
                    <span class="stat-value">${stats.completedWorkItems}</span>
                    <span class="stat-label">/ ${stats.totalWorkItems} items</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="stat">
                    <span class="stat-value">${progressPercent}%</span>
                </div>
            </div>

            <div class="content">
                <fire-current-run
                    .runs=${activeRuns}
                    @continue-run=${this._handleContinueRun}
                    @view-artifact=${this._handleViewArtifact}
                    @open-file=${this._handleOpenFile}
                ></fire-current-run>

                <fire-completed-runs
                    .runs=${completedRuns}
                    @view-run=${this._handleViewRun}
                    @open-file=${this._handleOpenFile}
                ></fire-completed-runs>

                <fire-pending-items
                    .items=${pendingItems}
                    ?hasActiveRun=${stats.activeRunsCount > 0}
                    @start-run=${this._handleStartRun}
                    @open-file=${this._handleOpenFile}
                ></fire-pending-items>
            </div>
        `;
    }

    private _handleContinueRun(e: CustomEvent<{ runId: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('continue-run', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleStartRun(e: CustomEvent<{ workItemIds: string[] }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('start-run', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleViewArtifact(e: CustomEvent<{ runId: string; artifact: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('view-artifact', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleViewRun(e: CustomEvent<{ runId: string; folderPath: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('view-run', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenFile(e: CustomEvent<{ path?: string; id?: string; intentId?: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-runs-view': FireRunsView;
    }
}
