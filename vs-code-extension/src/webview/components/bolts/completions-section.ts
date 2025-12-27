/**
 * CompletionsSection - Recently completed bolts section.
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './completion-item.js';
import type { CompletedBoltData } from './completion-item.js';

/** Default number of completions to show when collapsed. */
const DEFAULT_VISIBLE_COUNT = 3;

/**
 * Completions section component.
 *
 * @fires open-file - When a file is clicked in a completion item
 * @fires open-bolt - When magnifier button is clicked
 *
 * @example
 * ```html
 * <completions-section .bolts=${completedBolts}></completions-section>
 * ```
 */
@customElement('completions-section')
export class CompletionsSection extends BaseElement {
    /**
     * Array of completed bolts.
     */
    @property({ type: Array })
    bolts: CompletedBoltData[] = [];

    /**
     * Whether the section is expanded to show all completions.
     */
    @state()
    private _expanded = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                padding: 20px 16px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--description-foreground, #858585);
            }

            .count {
                font-size: 11px;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 12px;
                background: var(--status-complete, #22c55e);
                color: white;
            }

            .list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                color: var(--description-foreground, #858585);
                font-size: 12px;
            }

            .toggle-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                padding: 8px 12px;
                margin-top: 12px;
                background: transparent;
                border: 1px dashed var(--vscode-input-border, #3c3c3c);
                border-radius: 6px;
                color: var(--description-foreground, #858585);
                font-size: 11px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .toggle-btn:hover {
                background: var(--vscode-input-background, #3c3c3c);
                border-color: var(--foreground, #cccccc);
                color: var(--foreground, #cccccc);
            }

            .toggle-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                height: 12px;
                transition: transform 0.15s ease;
            }

            .toggle-icon svg {
                width: 10px;
                height: 10px;
                fill: currentColor;
            }

            .toggle-btn.expanded .toggle-icon {
                transform: rotate(180deg);
            }
        `
    ];

    /**
     * Gets the completions to display based on expanded state.
     */
    private get _visibleBolts(): CompletedBoltData[] {
        if (this._expanded) {
            return this.bolts;
        }
        return this.bolts.slice(0, DEFAULT_VISIBLE_COUNT);
    }

    /**
     * Whether to show the toggle button.
     */
    private get _showToggle(): boolean {
        return this.bolts.length > DEFAULT_VISIBLE_COUNT;
    }

    /**
     * Number of hidden completions when collapsed.
     */
    private get _hiddenCount(): number {
        return this.bolts.length - DEFAULT_VISIBLE_COUNT;
    }

    /**
     * Toggles expanded state.
     */
    private _handleToggle(): void {
        this._expanded = !this._expanded;
    }

    render() {
        // Don't render if no completed bolts
        if (!this.bolts || this.bolts.length === 0) {
            return html``;
        }

        return html`
            <div class="header">
                <span class="title">Recent Completions</span>
                <span class="count">${this.bolts.length} done</span>
            </div>
            <div class="list">
                ${this._visibleBolts.map(bolt => html`
                    <completion-item .bolt=${bolt}></completion-item>
                `)}
            </div>
            ${this._showToggle ? html`
                <button
                    type="button"
                    class="toggle-btn ${this._expanded ? 'expanded' : ''}"
                    @click=${this._handleToggle}>
                    <span class="toggle-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10.5L3 5.5h10L8 10.5z"/></svg></span>
                    ${this._expanded
                        ? 'Show Less'
                        : `Show ${this._hiddenCount} More`}
                </button>
            ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'completions-section': CompletionsSection;
    }
}
