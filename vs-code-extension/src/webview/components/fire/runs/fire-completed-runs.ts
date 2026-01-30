/**
 * FireCompletedRuns - Section showing completed runs.
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import '../shared/fire-scope-badge.js';
import type { RunScope } from '../shared/fire-scope-badge.js';

/**
 * File within a completed run.
 */
export interface RunFileData {
    name: string;
    path: string;
}

/**
 * Completed run summary data.
 */
export interface CompletedRunData {
    id: string;
    scope: RunScope;
    itemCount: number;
    completedAt: string;
    folderPath: string;
    files?: RunFileData[];
}

/**
 * Completed runs section component.
 *
 * @fires view-run - When a run is clicked to view details
 * @fires open-file - When a file is clicked to open
 *
 * @example
 * ```html
 * <fire-completed-runs .runs=${completedRuns}></fire-completed-runs>
 * ```
 */
@customElement('fire-completed-runs')
export class FireCompletedRuns extends BaseElement {
    /**
     * Completed runs.
     */
    @property({ type: Array })
    runs: CompletedRunData[] = [];

    /**
     * Display limit for completed runs. Configurable via settings.
     */
    @property({ type: Number })
    displayLimit = 5;

    /**
     * Whether section is expanded.
     */
    @state()
    private _expanded = true;

    /**
     * Expanded run IDs.
     */
    @state()
    private _expandedRunIds: Set<string> = new Set();

    /**
     * Whether to show all runs or just the configured limit.
     */
    @state()
    private _showAll = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
                border-top: 1px solid var(--border-color);
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
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

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: rgba(34, 197, 94, 0.15);
                color: var(--status-complete);
                border-radius: 10px;
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .runs-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 12px;
            }

            .run-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--editor-background);
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .run-item:hover {
                background: var(--background);
            }

            .check-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: var(--status-complete);
                background: rgba(34, 197, 94, 0.15);
                border-radius: 50%;
            }

            .run-info {
                flex: 1;
                min-width: 0;
            }

            .run-id {
                font-size: 12px;
                color: var(--foreground);
            }

            .run-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
            }

            .item-count {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .completed-time {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-state {
                text-align: center;
                padding: 16px;
                color: var(--description-foreground);
                font-size: 12px;
            }

            .run-container {
                margin-bottom: 4px;
            }

            .run-expand-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
                width: 12px;
            }

            .run-expand-icon.expanded {
                transform: rotate(90deg);
            }

            .run-files {
                margin-left: 24px;
                padding: 4px 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .run-file {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s ease;
            }

            .run-file:hover {
                background: var(--editor-background);
            }

            .file-icon {
                font-size: 12px;
                color: var(--description-foreground);
            }

            .file-name {
                font-size: 11px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .show-more {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                margin-top: 4px;
                cursor: pointer;
                color: var(--description-foreground);
                font-size: 11px;
                border-radius: 4px;
                transition: background 0.15s ease, color 0.15s ease;
            }

            .show-more:hover {
                background: var(--editor-background);
                color: var(--foreground);
            }
        `
    ];

    render() {
        // Sort runs by completedAt descending (newest first)
        const sortedRuns = [...this.runs].sort((a, b) => {
            const dateA = new Date(a.completedAt).getTime();
            const dateB = new Date(b.completedAt).getTime();
            return dateB - dateA;
        });

        const limit = this.displayLimit;
        const hasMore = sortedRuns.length > limit;
        const displayedRuns = this._showAll ? sortedRuns : sortedRuns.slice(0, limit);
        const hiddenCount = sortedRuns.length - limit;

        return html`
            <div class="section">
                <div class="section-header" @click=${this._toggleExpanded}>
                    <div class="header-left">
                        <span class="section-icon">✅</span>
                        <span class="section-title">Completed Runs</span>
                        <span class="count-badge">${this.runs.length}</span>
                    </div>
                    <span class="toggle-icon ${this._expanded ? '' : 'collapsed'}">▼</span>
                </div>

                ${this._expanded ? html`
                    ${sortedRuns.length > 0 ? html`
                        <div class="runs-list">
                            ${displayedRuns.map(run => this._renderRunContainer(run))}
                        </div>
                        ${hasMore ? html`
                            <div class="show-more" @click=${this._toggleShowAll}>
                                ${this._showAll
                                    ? 'Show Less'
                                    : `Show ${hiddenCount} More`}
                            </div>
                        ` : nothing}
                    ` : html`
                        <div class="empty-state">
                            No completed runs yet
                        </div>
                    `}
                ` : nothing}
            </div>
        `;
    }

    private _renderRunContainer(run: CompletedRunData) {
        const isExpanded = this._expandedRunIds.has(run.id);
        const hasFiles = run.files && run.files.length > 0;

        return html`
            <div class="run-container">
                ${this._renderRun(run, isExpanded, hasFiles)}
                ${isExpanded && hasFiles ? html`
                    <div class="run-files">
                        ${run.files!.map(file => this._renderFile(file))}
                    </div>
                ` : nothing}
            </div>
        `;
    }

    private _renderRun(run: CompletedRunData, isExpanded: boolean, hasFiles: boolean | undefined) {
        const relativeTime = this._formatRelativeTime(run.completedAt);

        return html`
            <div class="run-item" @click=${() => this._handleRunHeaderClick(run)}>
                ${hasFiles ? html`
                    <span class="run-expand-icon ${isExpanded ? 'expanded' : ''}">▶</span>
                ` : html`
                    <span class="check-icon">✓</span>
                `}
                <div class="run-info">
                    <span class="run-id">${run.id}</span>
                    <div class="run-meta">
                        <span class="item-count">${run.itemCount} item${run.itemCount !== 1 ? 's' : ''}</span>
                        <span class="completed-time">· ${relativeTime}</span>
                    </div>
                </div>
                <fire-scope-badge scope=${run.scope}></fire-scope-badge>
            </div>
        `;
    }

    private _renderFile(file: RunFileData) {
        return html`
            <div class="run-file" @click=${(e: Event) => this._handleFileClick(e, file)}>
                <span class="file-icon">${this._getFileIcon(file.name)}</span>
                <span class="file-name">${file.name}</span>
            </div>
        `;
    }

    private _getFileIcon(fileName: string): string {
        if (fileName.includes('plan')) {
            return '📋';
        }
        if (fileName.includes('test')) {
            return '🧪';
        }
        if (fileName.includes('walkthrough')) {
            return '📝';
        }
        if (fileName.includes('review')) {
            return '👁️';
        }
        if (fileName.includes('run')) {
            return '🔥';
        }
        return '📄';
    }

    private _toggleExpanded(): void {
        this._expanded = !this._expanded;
    }

    private _toggleShowAll(): void {
        this._showAll = !this._showAll;
    }

    private _handleRunHeaderClick(run: CompletedRunData): void {
        // Toggle expansion for this run
        if (this._expandedRunIds.has(run.id)) {
            this._expandedRunIds.delete(run.id);
        } else {
            this._expandedRunIds.add(run.id);
        }
        this._expandedRunIds = new Set(this._expandedRunIds);
    }

    private _handleFileClick(e: Event, file: RunFileData): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: file.path },
            bubbles: true,
            composed: true
        }));
    }

    private _formatRelativeTime(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch {
            return dateStr;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-completed-runs': FireCompletedRuns;
    }
}
