/**
 * FireWorkItem - Individual work item row in a run.
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import '../shared/fire-mode-badge.js';
import type { ExecutionMode } from '../shared/fire-mode-badge.js';
import type { FirePhase, PhaseStatus } from './fire-phase-pipeline.js';

/**
 * Work item status within a run.
 */
export type RunItemStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Phase data for a work item.
 */
export interface WorkItemPhaseData {
    phase: FirePhase;
    status: PhaseStatus;
}

/**
 * Work item data.
 */
export interface RunWorkItemData {
    id: string;
    intentId: string;
    mode: ExecutionMode;
    status: RunItemStatus;
    title?: string;
    /** Current phase of this work item */
    currentPhase?: FirePhase;
    /** Phase statuses for this work item */
    phases?: WorkItemPhaseData[];
    /** Path to the intent file for opening */
    intentFilePath?: string;
    /** Path to the work item file */
    filePath?: string;
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
                flex-direction: column;
                gap: 6px;
                padding: 8px 10px;
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

            .item-header {
                display: flex;
                align-items: center;
                gap: 8px;
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

            .open-intent-btn {
                font-size: 12px;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.15s ease;
                padding: 2px;
                border-radius: 2px;
            }

            .open-intent-btn:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            /* Inline phase pipeline */
            .phases-row {
                display: flex;
                align-items: center;
                gap: 4px;
                padding-left: 24px;
            }

            .phase-node {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 600;
                border: 1.5px solid var(--border-color);
                background: var(--editor-background);
                color: var(--description-foreground);
                transition: all 0.2s ease;
            }

            .phase-node.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .phase-node.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
                box-shadow: 0 0 4px rgba(249, 115, 22, 0.4);
            }

            .phase-node.skipped {
                opacity: 0.5;
                border-style: dashed;
            }

            .phase-connector {
                width: 8px;
                height: 1.5px;
                background: var(--border-color);
                flex-shrink: 0;
            }

            .phase-connector.complete {
                background: var(--status-complete);
            }
        `
    ];

    render() {
        if (!this.item) return nothing;

        const statusIcon = this._getStatusIcon();
        const phases = this._computePhases();

        return html`
            <div
                class="item ${this.isCurrent ? 'current' : ''}"
                @click=${this._handleClick}
                title="${this.item.title || this.item.id}"
            >
                <div class="item-header">
                    <span class="status-icon ${this.item.status}">${statusIcon}</span>
                    <span class="name">${this.item.title || this.item.id}</span>
                    <fire-mode-badge mode=${this.item.mode}></fire-mode-badge>
                    ${this.isCurrent ? html`<span class="current-indicator">current</span>` : nothing}
                    ${this.item.intentFilePath ? html`
                        <span class="open-intent-btn" @click=${this._handleOpenIntent} title="Open intent file">🔍</span>
                    ` : nothing}
                </div>
                ${this._renderPhasesRow(phases)}
            </div>
        `;
    }

    private _computePhases(): WorkItemPhaseData[] {
        // If phases are provided, use them
        if (this.item.phases && this.item.phases.length > 0) {
            return this.item.phases;
        }

        // Otherwise compute from currentPhase or default to pending
        const phaseOrder: FirePhase[] = ['plan', 'execute', 'test', 'review'];
        const currentPhase = this.item.currentPhase || 'plan';
        const currentIdx = phaseOrder.indexOf(currentPhase);

        // If item is completed, all phases are complete
        if (this.item.status === 'completed') {
            return phaseOrder.map(phase => ({
                phase,
                status: 'complete' as PhaseStatus
            }));
        }

        // If item is pending, all phases are pending
        if (this.item.status === 'pending') {
            return phaseOrder.map(phase => ({
                phase,
                status: 'pending' as PhaseStatus
            }));
        }

        // Item is in_progress or failed - show based on currentPhase
        return phaseOrder.map((phase, idx) => ({
            phase,
            status: idx < currentIdx ? 'complete' as PhaseStatus :
                    idx === currentIdx ? 'active' as PhaseStatus :
                    'pending' as PhaseStatus
        }));
    }

    private _renderPhasesRow(phases: WorkItemPhaseData[]) {
        // Only show phases row for completed items or items with explicit phase data
        // Don't show for in_progress items without phase tracking (misleading)
        if (this.item.status === 'pending') {
            return nothing;
        }

        // Only show phases if item is completed OR has explicit phase data
        if (this.item.status === 'in_progress' && !this.item.currentPhase && !this.item.phases) {
            return nothing;
        }

        return html`
            <div class="phases-row">
                ${phases.map((phase, idx) => html`
                    <div class="phase-node ${phase.status}" title="${phase.phase}">
                        ${phase.status === 'complete' ? '✓' : this._getPhaseIcon(phase.phase)}
                    </div>
                    ${idx < phases.length - 1 ? html`
                        <div class="phase-connector ${phase.status === 'complete' ? 'complete' : ''}"></div>
                    ` : nothing}
                `)}
            </div>
        `;
    }

    private _getPhaseIcon(phase: FirePhase): string {
        switch (phase) {
            case 'plan': return 'P';
            case 'execute': return 'E';
            case 'test': return 'T';
            case 'review': return 'R';
            default: return '?';
        }
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
            detail: {
                id: this.item.id,
                intentId: this.item.intentId,
                path: this.item.filePath
            },
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenIntent(e: Event): void {
        e.stopPropagation();
        if (this.item.intentFilePath) {
            this.dispatchEvent(new CustomEvent('open-file', {
                detail: { path: this.item.intentFilePath },
                bubbles: true,
                composed: true
            }));
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-work-item': FireWorkItem;
    }
}
