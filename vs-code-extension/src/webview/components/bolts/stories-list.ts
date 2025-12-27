/**
 * StoriesList - Story checkboxes display.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * Story data.
 */
export interface StoryData {
    id: string;
    name: string;
    status: 'complete' | 'active' | 'pending';
}

/**
 * Stories list component.
 *
 * @example
 * ```html
 * <stories-list .stories=${stories}></stories-list>
 * ```
 */
@customElement('stories-list')
export class StoriesList extends BaseElement {
    /**
     * Array of stories.
     */
    @property({ type: Array })
    stories: StoryData[] = [];

    /**
     * Number of completed stories.
     */
    @property({ type: Number })
    storiesComplete = 0;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 11px;
                font-weight: 600;
                color: var(--foreground);
            }

            .count {
                font-weight: normal;
                color: var(--description-foreground);
            }

            .list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .story {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
            }

            .story.complete {
                opacity: 0.7;
            }

            .status-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                flex-shrink: 0;
            }

            .status-icon.complete {
                background: var(--status-complete);
                color: white;
            }

            .status-icon.active {
                background: var(--status-active);
                color: white;
            }

            .status-icon.pending {
                background: var(--editor-background);
                border: 2px dashed var(--border-color);
                color: var(--description-foreground);
            }

            .name {
                font-size: 11px;
                color: var(--foreground);
            }

            .story.complete .name {
                text-decoration: line-through;
                color: var(--description-foreground);
            }

            .story.active .name {
                color: var(--status-active);
                font-weight: 500;
            }
        `
    ];

    render() {
        if (this.stories.length === 0) {
            return html``;
        }

        return html`
            <div class="header">
                <span>Stories</span>
                <span class="count">${this.storiesComplete}/${this.stories.length}</span>
            </div>
            <div class="list">
                ${this.stories.map(story => html`
                    <div class="story ${story.status}">
                        <div class="status-icon ${story.status}">
                            ${story.status === 'complete' ? '✓' : story.status === 'active' ? '●' : ''}
                        </div>
                        <span class="name">${story.id}</span>
                    </div>
                `)}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'stories-list': StoriesList;
    }
}
