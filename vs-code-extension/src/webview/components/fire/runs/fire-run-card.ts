/**
 * FireRunCard - Card displaying a run's details.
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import './fire-phase-pipeline.js';
import './fire-work-item.js';
import '../shared/fire-scope-badge.js';
import type { PhaseData, FirePhase } from './fire-phase-pipeline.js';
import type { RunWorkItemData } from './fire-work-item.js';
import type { RunScope } from '../shared/fire-scope-badge.js';
import type { RunFileData } from './fire-completed-runs.js';

/**
 * Run data for display.
 */
export interface FireRunData {
    id: string;
    scope: RunScope;
    workItems: RunWorkItemData[];
    currentItem: string | null;
    folderPath: string;
    startedAt: string;
    completedAt?: string;
    hasPlan: boolean;
    hasWalkthrough: boolean;
    hasTestReport: boolean;
    files?: RunFileData[];
}

/**
 * Run card component showing run details and work items.
 *
 * @fires continue-run - When continue button is clicked
 * @fires view-artifact - When artifact button is clicked
 * @fires open-file - When work item is clicked
 *
 * @example
 * ```html
 * <fire-run-card .run=${run} ?isActive=${true}></fire-run-card>
 * ```
 */
@customElement('fire-run-card')
export class FireRunCard extends BaseElement {
    /**
     * Run data.
     */
    @property({ type: Object })
    run!: FireRunData;

    /**
     * Whether this is the active run.
     */
    @property({ type: Boolean })
    isActive = false;

    /**
     * Whether work items list is expanded.
     */
    @state()
    private _expanded = true;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                overflow: hidden;
            }

            .card.active {
                border-color: var(--status-active);
                box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2);
            }

            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                border-bottom: 1px solid var(--border-color);
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .run-id {
                font-size: 13px;
                font-weight: 600;
                color: var(--foreground);
            }

            .item-count {
                font-size: 11px;
                color: var(--description-foreground);
            }

            .phases-section {
                padding: 8px 12px;
                border-bottom: 1px solid var(--border-color);
            }

            .work-items-section {
                padding: 8px;
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 8px;
                cursor: pointer;
            }

            .section-title {
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                color: var(--description-foreground);
                letter-spacing: 0.5px;
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .work-items-list {
                margin-top: 4px;
            }

            .actions {
                display: flex;
                gap: 8px;
                padding: 12px;
                border-top: 1px solid var(--border-color);
            }

            .action-btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: 500;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .action-btn.primary {
                background: var(--status-active);
                color: white;
            }

            .action-btn.primary:hover {
                background: #ea580c;
            }

            .action-btn.secondary {
                background: var(--editor-background);
                color: var(--foreground);
                border: 1px solid var(--border-color);
            }

            .action-btn.secondary:hover {
                background: var(--background);
            }

            .action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .files-section {
                padding: 8px 12px;
                border-top: 1px solid var(--border-color);
            }

            .files-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
            }

            .files-title {
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                color: var(--description-foreground);
                letter-spacing: 0.5px;
            }

            .files-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .file-item {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s ease;
            }

            .file-item:hover {
                background: var(--background);
            }

            .file-icon {
                font-size: 12px;
                color: var(--description-foreground);
            }

            .file-name {
                font-size: 11px;
                color: var(--foreground);
            }

            .no-files {
                font-size: 11px;
                color: var(--description-foreground);
                font-style: italic;
            }
        `
    ];

    render() {
        if (!this.run) return nothing;

        const phases = this._computePhases();
        const completedCount = this.run.workItems.filter(w => w.status === 'completed').length;

        return html`
            <div class="card ${this.isActive ? 'active' : ''}">
                <div class="header">
                    <div class="header-left">
                        <span class="run-id">${this.run.id}</span>
                        <fire-scope-badge scope=${this.run.scope}></fire-scope-badge>
                    </div>
                    <span class="item-count">${completedCount}/${this.run.workItems.length} items</span>
                </div>

                <div class="phases-section">
                    <fire-phase-pipeline .phases=${phases}></fire-phase-pipeline>
                </div>

                <div class="work-items-section">
                    <div class="section-header" @click=${this._toggleExpanded}>
                        <span class="section-title">Work Items</span>
                        <span class="toggle-icon ${this._expanded ? '' : 'collapsed'}">▼</span>
                    </div>
                    ${this._expanded ? html`
                        <div class="work-items-list">
                            ${this.run.workItems.map(item => html`
                                <fire-work-item
                                    .item=${item}
                                    ?isCurrent=${item.id === this.run.currentItem}
                                ></fire-work-item>
                            `)}
                        </div>
                    ` : nothing}
                </div>

                ${this._renderFilesSection()}

                ${this.isActive ? html`
                    <div class="actions">
                        <button class="action-btn primary" @click=${this._handleContinue}>
                            Continue Run
                        </button>
                    </div>
                ` : nothing}
            </div>
        `;
    }

    private _computePhases(): PhaseData[] {
        // Determine current phase based on artifacts and progress
        let currentPhase: FirePhase = 'plan';

        if (this.run.hasPlan) {
            currentPhase = 'execute';
        }
        if (this.run.hasTestReport) {
            currentPhase = 'test';
        }
        if (this.run.hasWalkthrough) {
            currentPhase = 'review';
        }
        if (this.run.completedAt) {
            currentPhase = 'review';
        }

        const phaseOrder: FirePhase[] = ['plan', 'execute', 'test', 'review'];
        const currentIdx = phaseOrder.indexOf(currentPhase);

        return phaseOrder.map((phase, idx) => ({
            phase,
            status: idx < currentIdx ? 'complete' :
                    idx === currentIdx ? 'active' :
                    'pending'
        }));
    }

    private _toggleExpanded(): void {
        this._expanded = !this._expanded;
    }

    private _renderFilesSection() {
        const files = this.run.files || [];

        if (files.length === 0) {
            return nothing;
        }

        return html`
            <div class="files-section">
                <div class="files-header">
                    <span class="files-title">Run Files</span>
                </div>
                <div class="files-list">
                    ${files.map(file => html`
                        <div class="file-item" @click=${() => this._handleFileClick(file)}>
                            <span class="file-icon">${this._getFileIcon(file.name)}</span>
                            <span class="file-name">${file.name}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    private _getFileIcon(fileName: string): string {
        if (fileName.includes('plan')) return '📋';
        if (fileName.includes('test')) return '🧪';
        if (fileName.includes('walkthrough')) return '📝';
        if (fileName.includes('run')) return '🔥';
        return '📄';
    }

    private _handleFileClick(file: RunFileData): void {
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: file.path },
            bubbles: true,
            composed: true
        }));
    }

    private _handleContinue(): void {
        this.dispatchEvent(new CustomEvent('continue-run', {
            detail: { runId: this.run.id },
            bubbles: true,
            composed: true
        }));
    }

    private _handleViewArtifact(artifact: 'plan' | 'test-report' | 'walkthrough'): void {
        this.dispatchEvent(new CustomEvent('view-artifact', {
            detail: { runId: this.run.id, artifact },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-run-card': FireRunCard;
    }
}
