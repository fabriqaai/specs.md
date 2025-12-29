/**
 * FocusCard - Expandable active bolt card.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import '../shared/progress-ring.js';
import '../shared/stage-pipeline.js';
import './stories-list.js';
import type { StageData } from '../shared/stage-pipeline.js';
import type { StoryData } from './stories-list.js';

/**
 * Artifact file data.
 */
export interface ArtifactFileData {
    name: string;
    path: string;
    type: 'walkthrough' | 'test-report' | 'plan' | 'design' | 'other';
}

/**
 * Active bolt data.
 */
export interface ActiveBoltData {
    id: string;
    name: string;
    type: string;
    currentStage: string | null;
    stagesComplete: number;
    stagesTotal: number;
    storiesComplete: number;
    storiesTotal: number;
    stages: StageData[];
    stories: StoryData[];
    path: string;
    files: ArtifactFileData[];
}

/**
 * Capitalize the first letter of a stage name.
 */
function formatStageName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Focus card component for active bolt.
 *
 * @fires toggle-expand - When card header is clicked
 * @fires continue-bolt - When Continue button is clicked
 * @fires view-files - When Files button is clicked
 * @fires open-bolt - When magnifier button is clicked
 * @fires open-file - When an artifact file is clicked
 *
 * @example
 * ```html
 * <focus-card .bolt=${bolt} expanded></focus-card>
 * ```
 */
@customElement('focus-card')
export class FocusCard extends BaseElement {
    /**
     * Active bolt data.
     */
    @property({ type: Object })
    bolt!: ActiveBoltData;

    /**
     * Whether the card is expanded.
     */
    @property({ type: Boolean })
    expanded = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .card {
                background: linear-gradient(135deg, var(--card-active-gradient-start, rgba(249, 115, 22, 0.08)) 0%, var(--card-active-gradient-end, rgba(249, 115, 22, 0.02)) 100%);
                border-left: 4px solid var(--card-active-border, #f97316);
                border-radius: 8px;
                overflow: hidden;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .header:hover {
                background: rgba(255, 255, 255, 0.02);
            }

            .header-content {
                flex: 1;
                min-width: 0;
            }

            .title {
                font-size: 15px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                margin-bottom: 4px;
            }

            .subtitle {
                font-size: 12px;
                color: var(--description-foreground, #858585);
            }

            .badge {
                font-size: 11px;
                font-weight: 600;
                padding: 6px 14px;
                border-radius: 16px;
                background: var(--card-active-border, #f97316);
                color: white;
                flex-shrink: 0;
                margin-left: 12px;
            }

            .open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 14px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 8px;
            }

            .header:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .body {
                padding: 0 16px 16px;
                display: none;
            }

            .card.expanded .body {
                display: block;
            }

            .progress-section {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                padding-top: 4px;
            }

            .progress-details {
                flex: 1;
            }

            .progress-stage {
                font-size: 13px;
                color: var(--foreground);
                margin-bottom: 6px;
            }

            .progress-info {
                font-size: 12px;
                color: var(--description-foreground);
                margin-bottom: 4px;
            }

            .pipeline-section {
                margin-bottom: 16px;
                padding: 12px 0;
                border-top: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
            }

            .actions {
                display: flex;
                gap: 10px;
                margin-top: 16px;
            }

            .action-btn {
                flex: 1;
                padding: 10px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
            }

            .action-btn-primary {
                background: var(--accent-primary);
                color: white;
            }

            .action-btn-primary:hover {
                opacity: 0.9;
            }

            .action-btn-secondary {
                background: var(--border-color);
                color: var(--foreground);
            }

            .action-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .artifacts-section {
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }

            .artifacts-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .artifact-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                margin: 2px 0;
                border-radius: 4px;
                font-size: 13px;
                color: var(--foreground, #cccccc);
                cursor: pointer;
                transition: background 0.1s;
            }

            .artifact-item:hover {
                background: var(--vscode-input-background, #3c3c3c);
            }

            .artifact-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .artifact-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .artifact-type {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
            }

            .no-artifacts {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                font-style: italic;
                padding: 8px 0;
            }
        `
    ];

    render() {
        if (!this.bolt) {
            return html``;
        }

        const progressPercent = this.bolt.stagesTotal > 0
            ? Math.round((this.bolt.stagesComplete / this.bolt.stagesTotal) * 100)
            : 0;

        const currentStage = this.bolt.stages.find(s => s.status === 'active');
        const currentStageName = currentStage
            ? formatStageName(currentStage.name)
            : (this.bolt.stages[0]?.name ? formatStageName(this.bolt.stages[0].name) : 'Not started');

        const stageLabel = this.bolt.currentStage
            ? formatStageName(this.bolt.currentStage)
            : 'Not started';

        return html`
            <div class="card ${this.expanded ? 'expanded' : ''}" data-bolt-id="${this.bolt.id}">
                <div class="header" @click=${this._toggleExpand}>
                    <div class="header-content">
                        <div class="title">${this.bolt.name}</div>
                        <div class="subtitle">${this.bolt.type} Bolt | ${stageLabel} Stage</div>
                    </div>
                    <button class="open-btn" @click=${this._handleOpenBolt} title="Open bolt.md">🔍</button>
                    <div class="badge">In Progress</div>
                </div>
                <div class="body">
                    <div class="progress-section">
                        <progress-ring .percent=${progressPercent}></progress-ring>
                        <div class="progress-details">
                            <div class="progress-stage">Stage: <strong>${currentStageName}</strong></div>
                            <div class="progress-info">${this.bolt.stagesComplete} of ${this.bolt.stagesTotal} stages complete</div>
                            <div class="progress-info">${this.bolt.storiesComplete}/${this.bolt.storiesTotal} stories done</div>
                        </div>
                    </div>

                    <div class="pipeline-section">
                        <stage-pipeline .stages=${this.bolt.stages}></stage-pipeline>
                    </div>

                    ${this.bolt.stories.length > 0 ? html`
                        <stories-list
                            .stories=${this.bolt.stories}
                            .storiesComplete=${this.bolt.storiesComplete}>
                        </stories-list>
                    ` : ''}

                    ${this._renderArtifacts()}

                    <div class="actions">
                        <button class="action-btn action-btn-primary" @click=${this._handleContinue}>Continue</button>
                        <button class="action-btn action-btn-secondary" @click=${this._handleViewFiles}>See Bolt</button>
                    </div>
                </div>
            </div>
        `;
    }

    private _toggleExpand(): void {
        this.dispatchEvent(new CustomEvent('toggle-expand', {
            detail: { expanded: !this.expanded },
            bubbles: true,
            composed: true
        }));
    }

    private _handleContinue(e: Event): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('continue-bolt', {
            detail: { boltId: this.bolt.id, boltName: this.bolt.name },
            bubbles: true,
            composed: true
        }));
    }

    private _handleViewFiles(e: Event): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('view-files', {
            detail: { boltId: this.bolt.id },
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenBolt(e: Event): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-bolt', {
            detail: { boltId: this.bolt.id },
            bubbles: true,
            composed: true
        }));
    }

    private _renderArtifacts() {
        const hasFiles = this.bolt.files && this.bolt.files.length > 0;

        if (!hasFiles) {
            return html``;
        }

        return html`
            <div class="artifacts-section">
                <div class="artifacts-header">Artifacts</div>
                ${this.bolt.files.map(file => html`
                    <div class="artifact-item" @click=${(e: Event) => this._handleFileClick(e, file.path)}>
                        <span class="artifact-icon">${this._getFileIcon(file.type)}</span>
                        <span class="artifact-name">${file.name}</span>
                        <span class="artifact-type">${file.type}</span>
                    </div>
                `)}
            </div>
        `;
    }

    private _getFileIcon(type: string): string {
        switch (type) {
            case 'walkthrough': return '📖';
            case 'test-report': return '📋';
            case 'plan': return '📄';
            case 'design': return '🔧';
            default: return '📄';
        }
    }

    private _handleFileClick(e: Event, path: string): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'focus-card': FocusCard;
    }
}
