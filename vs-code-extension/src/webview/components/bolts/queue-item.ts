/**
 * QueueItem - Queued bolt item display with expandable stories.
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import type { StageData } from '../shared/stage-pipeline.js';

/**
 * Story data for queued bolt.
 */
export interface QueueStoryData {
    id: string;
    name: string;
    status: 'complete' | 'active' | 'pending';
}

/**
 * Queued bolt data.
 */
export interface QueuedBoltData {
    id: string;
    name: string;
    type: string;
    storiesCount: number;
    isBlocked: boolean;
    blockedBy: string[];
    unblocksCount: number;
    stages: StageData[];
    stories: QueueStoryData[];
}


/**
 * Queue item component.
 *
 * @fires start-bolt - When Start button is clicked
 *
 * @example
 * ```html
 * <queue-item .bolt=${bolt} priority="1"></queue-item>
 * ```
 */
@customElement('queue-item')
export class QueueItem extends BaseElement {
    /**
     * Queued bolt data.
     */
    @property({ type: Object })
    bolt!: QueuedBoltData;

    /**
     * Queue priority (1-based).
     */
    @property({ type: Number })
    priority = 1;

    /**
     * Whether the item is expanded to show stories.
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
                border-left: 4px solid #f97316;
                overflow: hidden;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 16px;
                cursor: pointer;
            }

            .priority {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--foreground, #cccccc);
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .lock {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
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

            .blocked-info {
                font-size: 12px;
                color: #f97316;
                margin-top: 6px;
                line-height: 1.4;
            }

            .actions {
                flex-shrink: 0;
                padding-top: 2px;
            }

            .start-btn {
                padding: 8px 16px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
                background: transparent;
                color: var(--foreground, #cccccc);
                border: 1px solid var(--vscode-input-border, #454545);
                cursor: pointer;
                transition: all 0.15s;
            }

            .start-btn:hover:not(:disabled) {
                background: var(--vscode-input-background, #3c3c3c);
                border-color: #f97316;
                color: #f97316;
            }

            .start-btn:disabled {
                background: transparent;
                color: var(--description-foreground, #666666);
                border-color: transparent;
                cursor: default;
                font-style: italic;
            }

            .stories-section {
                display: none;
                padding: 0 16px 14px 52px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .stories-section.expanded {
                display: block;
            }

            .stories-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 12px 0 10px 0;
            }

            .story-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                font-size: 13px;
                color: var(--foreground, #cccccc);
            }

            .story-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .story-status.complete {
                background: var(--status-complete, #22c55e);
            }

            .story-status.active {
                background: var(--status-active, #f97316);
            }

            .story-status.pending {
                background: var(--border-color, #3c3c3c);
            }

            .story-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        `
    ];

    render() {
        if (!this.bolt) {
            return html``;
        }

        const hasStories = this.bolt.stories && this.bolt.stories.length > 0;

        return html`
            <div class="header" @click=${this._toggleExpand}>
                ${this.bolt.isBlocked
                    ? html`<div class="lock">🔒</div>`
                    : html`<div class="priority">${this.priority}</div>`
                }
                <div class="info">
                    <div class="name">
                        ${this.bolt.name}
                        ${hasStories ? html`
                            <span class="expand-icon ${this._expanded ? 'expanded' : ''}">▶</span>
                        ` : ''}
                    </div>
                    <div class="meta">
                        ${this.bolt.type} | ${this.bolt.storiesCount} ${this.bolt.storiesCount === 1 ? 'story' : 'stories'}${this.bolt.unblocksCount > 0 ? ` | Enables ${this.bolt.unblocksCount}` : ''}
                    </div>
                    ${this.bolt.isBlocked ? html`
                        <div class="blocked-info">Waiting: ${this.bolt.blockedBy.join(', ')}</div>
                    ` : ''}
                </div>
                <div class="actions">
                    ${this.bolt.isBlocked
                        ? html`<button class="start-btn" disabled>Blocked</button>`
                        : html`<button class="start-btn" @click=${this._handleStart}>Start ▶</button>`
                    }
                </div>
            </div>
            ${hasStories ? html`
                <div class="stories-section ${this._expanded ? 'expanded' : ''}">
                    <div class="stories-header">Stories</div>
                    ${this.bolt.stories.map(story => html`
                        <div class="story-item">
                            <div class="story-status ${story.status}"></div>
                            <span class="story-name">${story.name}</span>
                        </div>
                    `)}
                </div>
            ` : ''}
        `;
    }

    private _toggleExpand(): void {
        if (this.bolt.stories && this.bolt.stories.length > 0) {
            this._expanded = !this._expanded;
        }
    }

    private _handleStart(e: Event): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('start-bolt', {
            detail: { boltId: this.bolt.id },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'queue-item': QueueItem;
    }
}
