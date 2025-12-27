/**
 * CompletionItem - Completed bolt item with expandable artifact files.
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * Artifact file data.
 */
export interface ArtifactFileData {
    name: string;
    path: string;
    type: 'walkthrough' | 'test-report' | 'plan' | 'design' | 'other';
}

/**
 * Completed bolt data.
 */
export interface CompletedBoltData {
    id: string;
    name: string;
    type: string;
    completedAt: string;
    relativeTime: string;
    path: string;
    files: ArtifactFileData[];
}

/**
 * Completion item component.
 *
 * @fires open-file - When a file is clicked
 * @fires open-bolt - When magnifier button is clicked
 *
 * @example
 * ```html
 * <completion-item .bolt=${bolt}></completion-item>
 * ```
 */
@customElement('completion-item')
export class CompletionItem extends BaseElement {
    /**
     * Completed bolt data.
     */
    @property({ type: Object })
    bolt!: CompletedBoltData;

    /**
     * Whether the item is expanded to show files.
     */
    @state()
    private _expanded = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                border-radius: 8px;
                background: var(--vscode-editor-background, #1e1e1e);
                border-left: 4px solid var(--status-complete, #22c55e);
                overflow: hidden;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
            }

            .check {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--status-complete, #22c55e);
                color: white;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .info {
                flex: 1;
                min-width: 0;
            }

            .name {
                font-size: 14px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .expand-icon {
                font-size: 10px;
                color: var(--description-foreground, #858585);
                margin-left: 6px;
                transition: transform 0.15s;
                display: inline-block;
            }

            .expand-icon.expanded {
                transform: rotate(90deg);
            }

            .meta {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                line-height: 1.4;
            }

            .time {
                color: var(--status-complete, #22c55e);
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
                flex-shrink: 0;
            }

            .header:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .files-section {
                display: none;
                padding: 0 16px 12px 52px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .files-section.expanded {
                display: block;
            }

            .files-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 10px 0 8px 0;
            }

            .file-item {
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

            .file-item:hover {
                background: var(--vscode-input-background, #3c3c3c);
            }

            .file-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .file-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .file-type {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
            }

            .no-files {
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

        const hasFiles = this.bolt.files && this.bolt.files.length > 0;

        return html`
            <div class="header" @click=${this._toggleExpand}>
                <div class="check">&#10003;</div>
                <div class="info">
                    <div class="name">
                        ${this.bolt.name}
                        ${hasFiles ? html`
                            <span class="expand-icon ${this._expanded ? 'expanded' : ''}">&#9654;</span>
                        ` : ''}
                    </div>
                    <div class="meta">
                        ${this.bolt.type} | <span class="time">${this.bolt.relativeTime}</span>
                    </div>
                </div>
                <button class="open-btn" @click=${this._handleOpenBolt} title="Open bolt.md">🔍</button>
            </div>
            ${hasFiles ? html`
                <div class="files-section ${this._expanded ? 'expanded' : ''}">
                    <div class="files-header">Artifacts</div>
                    ${this.bolt.files.map(file => html`
                        <div class="file-item" @click=${(e: Event) => this._handleFileClick(e, file.path)}>
                            <span class="file-icon">${this._getFileIcon(file.type)}</span>
                            <span class="file-name">${file.name}</span>
                            <span class="file-type">${file.type}</span>
                        </div>
                    `)}
                </div>
            ` : html`
                <div class="files-section ${this._expanded ? 'expanded' : ''}">
                    <div class="no-files">No artifact files found</div>
                </div>
            `}
        `;
    }

    private _getFileIcon(type: string): string {
        switch (type) {
            case 'walkthrough': return '📖'; // open book
            case 'test-report': return '📋'; // clipboard
            case 'plan': return '📄'; // page
            case 'design': return '🔧'; // wrench
            default: return '📄'; // page
        }
    }

    private _toggleExpand(): void {
        this._expanded = !this._expanded;
    }

    private _handleFileClick(e: Event, path: string): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path },
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
}

declare global {
    interface HTMLElementTagNameMap {
        'completion-item': CompletionItem;
    }
}
