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

            /* Resources Footer */
            .resources-footer {
                position: sticky;
                bottom: 0;
                background: var(--background);
                border-top: 1px solid var(--border-color);
                padding: 12px;
                margin-top: auto;
            }

            .resources-title {
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--description-foreground);
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .resources-links {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .resource-link {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: all 0.15s ease;
                color: var(--description-foreground);
            }

            .resource-link:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--status-active);
                color: var(--status-active);
            }

            .resource-link svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            .feedback-message {
                text-align: center;
                font-size: 11px;
                color: var(--description-foreground);
                margin-bottom: 12px;
                padding: 8px 12px;
                background: var(--editor-background);
                border-radius: 6px;
            }

            .feedback-link {
                color: var(--status-active);
                cursor: pointer;
                text-decoration: underline;
            }

            .feedback-link:hover {
                opacity: 0.8;
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

                <!-- Resources Footer -->
                <div class="resources-footer">
                    <div class="feedback-message">
                        We're new! Help us improve — <span class="feedback-link" @click=${() => this._openExternal('https://specs.md/feedback')}>share your feedback</span>
                    </div>
                    <div class="resources-title">Resources</div>
                    <div class="resources-links">
                        <div class="resource-link" @click=${() => this._openExternal('https://specs.md')} title="Website">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                        </div>
                        <div class="resource-link" @click=${() => this._openExternal('https://discord.specs.md')} title="Discord">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                        </div>
                        <div class="resource-link" @click=${() => this._openExternal('https://x.com/specsmd')} title="X (Twitter)">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </div>
                    </div>
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

    private _openExternal(url: string): void {
        this.dispatchEvent(new CustomEvent('open-external', {
            detail: { url },
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
