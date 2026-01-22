/**
 * FireOverviewView - Main overview view for FIRE flow.
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import type { RunScope } from '../shared/fire-scope-badge.js';

/**
 * Workspace type.
 */
export type WorkspaceType = 'greenfield' | 'brownfield';

/**
 * Workspace structure.
 */
export type WorkspaceStructure = 'monolith' | 'monorepo' | 'multi-part';

/**
 * Autonomy bias.
 */
export type AutonomyBias = 'autonomous' | 'balanced' | 'controlled';

/**
 * Project info.
 */
export interface FireProjectInfo {
    name: string;
    description?: string;
    created: string;
    fireVersion: string;
}

/**
 * Workspace settings.
 */
export interface FireWorkspaceInfo {
    type: WorkspaceType;
    structure: WorkspaceStructure;
    autonomyBias: AutonomyBias;
    runScopePreference: RunScope;
}

/**
 * Standard document.
 */
export interface FireStandardInfo {
    type: string;
    filePath: string;
}

/**
 * Overview stats.
 */
export interface FireOverviewStats {
    totalIntents: number;
    completedIntents: number;
    totalWorkItems: number;
    completedWorkItems: number;
    totalRuns: number;
    completedRuns: number;
}

/**
 * Overview view data.
 */
export interface FireOverviewViewData {
    project: FireProjectInfo | null;
    workspace: FireWorkspaceInfo | null;
    standards: FireStandardInfo[];
    stats: FireOverviewStats;
}

/**
 * Overview view container component.
 *
 * @fires open-file - When standard is clicked
 *
 * @example
 * ```html
 * <fire-overview-view .data=${data}></fire-overview-view>
 * ```
 */
@customElement('fire-overview-view')
export class FireOverviewView extends BaseElement {
    /**
     * Overview view data.
     */
    @property({ type: Object })
    data!: FireOverviewViewData;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }

            .section {
                margin-bottom: 16px;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .section-icon {
                font-size: 14px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px;
            }

            /* Project Info */
            .project-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--foreground);
                margin-bottom: 4px;
            }

            .project-description {
                font-size: 12px;
                color: var(--description-foreground);
                margin-bottom: 8px;
            }

            .project-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 10px;
                color: var(--description-foreground);
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }

            .stat-card {
                background: var(--background);
                border-radius: 4px;
                padding: 12px;
                text-align: center;
            }

            .stat-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--status-active);
            }

            .stat-label {
                font-size: 9px;
                text-transform: uppercase;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .stat-sub {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 4px;
            }

            /* Workspace Settings */
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .setting-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 8px;
                background: var(--background);
                border-radius: 4px;
            }

            .setting-label {
                font-size: 9px;
                text-transform: uppercase;
                color: var(--description-foreground);
            }

            .setting-value {
                font-size: 12px;
                font-weight: 500;
                color: var(--foreground);
                text-transform: capitalize;
            }

            /* Standards List */
            .standards-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .standard-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--background);
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .standard-item:hover {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                margin: -1px;
            }

            .standard-icon {
                font-size: 14px;
            }

            .standard-name {
                flex: 1;
                font-size: 12px;
                color: var(--foreground);
                text-transform: capitalize;
            }

            .standard-arrow {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-standards {
                padding: 16px;
                text-align: center;
                color: var(--description-foreground);
                font-size: 12px;
            }

            /* Fire Badge */
            .fire-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: rgba(249, 115, 22, 0.15);
                color: var(--status-active);
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div>Loading...</div>`;
        }

        const { project, workspace, standards, stats } = this.data;

        return html`
            <div class="content">
                <!-- Project Info -->
                ${project ? html`
                    <div class="section">
                        <div class="section-header">
                            <span class="section-icon">🔥</span>
                            <span class="section-title">Project</span>
                        </div>
                        <div class="card">
                            <div class="project-name">${project.name}</div>
                            ${project.description ? html`
                                <div class="project-description">${project.description}</div>
                            ` : nothing}
                            <div class="project-meta">
                                <span class="fire-badge">🔥 FIRE v${project.fireVersion}</span>
                                <span class="meta-item">
                                    📅 Created ${this._formatDate(project.created)}
                                </span>
                            </div>
                        </div>
                    </div>
                ` : nothing}

                <!-- Stats -->
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">📊</span>
                        <span class="section-title">Progress</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${stats.completedIntents}</div>
                            <div class="stat-label">Intents Done</div>
                            <div class="stat-sub">of ${stats.totalIntents}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.completedWorkItems}</div>
                            <div class="stat-label">Work Items Done</div>
                            <div class="stat-sub">of ${stats.totalWorkItems}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalRuns}</div>
                            <div class="stat-label">Total Runs</div>
                            <div class="stat-sub">${stats.completedRuns} completed</div>
                        </div>
                    </div>
                </div>

                <!-- Workspace Settings -->
                ${workspace ? html`
                    <div class="section">
                        <div class="section-header">
                            <span class="section-icon">⚙️</span>
                            <span class="section-title">Workspace Settings</span>
                        </div>
                        <div class="card">
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <span class="setting-label">Type</span>
                                    <span class="setting-value">${workspace.type}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Structure</span>
                                    <span class="setting-value">${workspace.structure}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Autonomy Bias</span>
                                    <span class="setting-value">${workspace.autonomyBias}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Run Scope</span>
                                    <span class="setting-value">${workspace.runScopePreference}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : nothing}

                <!-- Standards -->
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">📚</span>
                        <span class="section-title">Standards</span>
                    </div>
                    ${standards.length > 0 ? html`
                        <div class="standards-list">
                            ${standards.map(std => html`
                                <div class="standard-item" @click=${() => this._handleStandardClick(std)}>
                                    <span class="standard-icon">${this._getStandardIcon(std.type)}</span>
                                    <span class="standard-name">${std.type.replace(/-/g, ' ')}</span>
                                    <span class="standard-arrow">→</span>
                                </div>
                            `)}
                        </div>
                    ` : html`
                        <div class="empty-standards">
                            No standards defined yet
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    private _formatDate(dateStr: string): string {
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    }

    private _getStandardIcon(type: string): string {
        switch (type) {
            case 'constitution': return '📜';
            case 'tech-stack': return '🛠️';
            case 'coding-standards': return '📝';
            case 'testing-standards': return '🧪';
            case 'system-architecture': return '🏗️';
            default: return '📄';
        }
    }

    private _handleStandardClick(standard: FireStandardInfo): void {
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: standard.filePath },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-overview-view': FireOverviewView;
    }
}
