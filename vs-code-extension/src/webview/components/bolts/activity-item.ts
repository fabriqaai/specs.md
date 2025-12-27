/**
 * ActivityItem - Single activity event display.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { BaseElement } from '../shared/base-element.js';

/**
 * Activity event data.
 */
export interface ActivityEventData {
    id: string;
    type: 'bolt-created' | 'bolt-start' | 'stage-complete' | 'bolt-complete';
    text: string;
    target: string;
    tag: 'bolt' | 'stage';
    relativeTime: string;
    exactTime: string;
    path?: string;
}

/**
 * Activity item component.
 *
 * @fires open-file - When file link is clicked
 *
 * @example
 * ```html
 * <activity-item .event=${event}></activity-item>
 * ```
 */
@customElement('activity-item')
export class ActivityItem extends BaseElement {
    /**
     * Activity event data.
     */
    @property({ type: Object })
    event!: ActivityEventData;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .icon {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                flex-shrink: 0;
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .icon.bolt-created {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .icon.bolt-start {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .icon.stage-complete,
            .icon.bolt-complete {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .content {
                flex: 1;
                min-width: 0;
            }

            .text {
                font-size: 13px;
                color: var(--foreground, #cccccc);
                line-height: 1.5;
                margin-bottom: 4px;
            }

            .text strong {
                color: #f97316;
                font-weight: 600;
            }

            .meta {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 11px;
                color: var(--description-foreground, #858585);
            }

            .target {
                font-weight: 500;
            }

            .tag {
                text-transform: uppercase;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                background: var(--vscode-input-background, #3c3c3c);
                border-radius: 3px;
            }

            .time {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                white-space: nowrap;
                flex-shrink: 0;
            }

            .open-btn {
                opacity: 0.4;
                padding: 8px;
                border-radius: 6px;
                font-size: 16px;
                transition: opacity 0.15s;
                flex-shrink: 0;
                background: transparent;
                border: none;
                cursor: pointer;
                color: var(--foreground, #cccccc);
            }

            :host(:hover) .open-btn {
                opacity: 0.8;
            }

            .open-btn:hover {
                opacity: 1;
                background: var(--vscode-input-background, #3c3c3c);
            }
        `
    ];

    render() {
        if (!this.event) {
            return html``;
        }

        return html`
            <div class="icon ${this.event.type}">${this._getIcon()}</div>
            <div class="content">
                <div class="text">${unsafeHTML(this.event.text)}</div>
                <div class="meta">
                    <span class="target">${this.event.target}</span>
                    <span class="tag">${this.event.tag}</span>
                </div>
            </div>
            <span class="time" title="${this.event.exactTime}">${this.event.relativeTime}</span>
            ${this.event.path ? html`
                <button
                    class="open-btn"
                    @click=${this._handleOpenFile}
                    title="Open file">
                    🔍
                </button>
            ` : ''}
        `;
    }

    private _getIcon(): string {
        switch (this.event.type) {
            case 'bolt-created': return '+';
            case 'bolt-start': return '▶';
            case 'stage-complete': return '✓';
            case 'bolt-complete': return '✔';
            default: return '•';
        }
    }

    private _handleOpenFile(e: Event): void {
        e.stopPropagation();
        if (this.event.path) {
            this.dispatchEvent(new CustomEvent('open-file', {
                detail: { path: this.event.path },
                bubbles: true,
                composed: true
            }));
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'activity-item': ActivityItem;
    }
}
