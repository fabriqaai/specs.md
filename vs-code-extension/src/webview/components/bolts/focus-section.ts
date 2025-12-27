/**
 * FocusSection - Current Focus section wrapper.
 * Supports multiple active bolts.
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './focus-card.js';
import type { ActiveBoltData } from './focus-card.js';

/**
 * Focus section component.
 *
 * @fires toggle-focus - When focus card is toggled (for persistence)
 * @fires copy-command - When command is copied
 * @fires continue-bolt - When Continue button is clicked
 * @fires view-files - When Files button is clicked
 * @fires open-bolt - When magnifier button is clicked
 *
 * @example
 * ```html
 * <focus-section .bolts=${bolts}></focus-section>
 * ```
 */
@customElement('focus-section')
export class FocusSection extends BaseElement {
    /**
     * Active bolts data (empty array if no active bolts).
     */
    @property({ type: Array })
    bolts: ActiveBoltData[] = [];

    /**
     * Set of expanded bolt IDs (tracked locally per-bolt).
     */
    @state()
    private _expandedBolts: Set<string> = new Set();

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
                padding: 16px;
                background: var(--vscode-sideBar-background, #252526);
            }

            .label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 12px;
            }

            .label-icon {
                font-size: 14px;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 32px 16px;
                text-align: center;
                color: var(--description-foreground, #858585);
            }

            .empty-state-icon {
                font-size: 32px;
                margin-bottom: 4px;
            }

            .empty-state-text {
                font-size: 13px;
                line-height: 1.5;
            }

            .empty-state code {
                background: var(--vscode-input-background, #3c3c3c);
                padding: 4px 10px;
                border-radius: 4px;
                font-family: var(--vscode-editor-font-family, monospace);
                font-size: 11px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .empty-state code:hover {
                background: var(--vscode-button-background, #0e639c);
                color: var(--vscode-button-foreground, #ffffff);
            }

            .empty-state-hint {
                font-size: 12px;
                color: var(--description-foreground, #858585);
            }

            .bolts-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
        `
    ];

    render() {
        return html`
            <div class="label">
                <span class="label-icon">🎯</span>
                Current Focus
            </div>
            ${this.bolts.length > 0
                ? html`
                    <div class="bolts-list">
                        ${this.bolts.map(bolt => html`
                            <focus-card
                                .bolt=${bolt}
                                .expanded=${this._expandedBolts.has(bolt.id)}
                                @toggle-expand=${(e: CustomEvent) => this._handleToggleExpand(bolt.id, e)}>
                            </focus-card>
                        `)}
                    </div>
                `
                : html`
                    <div class="empty-state">
                        <span class="empty-state-icon">🚀</span>
                        <div class="empty-state-text">No active bolt</div>
                        <div class="empty-state-hint">
                            run <code @click=${this._copyCommand}>/specsmd-construction-agent</code> to start
                        </div>
                    </div>
                `
            }
        `;
    }

    private _handleToggleExpand(boltId: string, e: CustomEvent): void {
        e.stopPropagation();
        const newExpanded = new Set(this._expandedBolts);
        if (newExpanded.has(boltId)) {
            newExpanded.delete(boltId);
        } else {
            newExpanded.add(boltId);
        }
        this._expandedBolts = newExpanded;

        // Notify parent for any persistence needs
        this.dispatchEvent(new CustomEvent('toggle-focus', {
            detail: { boltId, expanded: newExpanded.has(boltId) },
            bubbles: true,
            composed: true
        }));
    }

    private _copyCommand(): void {
        const command = '/specsmd-construction-agent';
        navigator.clipboard.writeText(command).then(() => {
            this.dispatchEvent(new CustomEvent('copy-command', {
                detail: { command },
                bubbles: true,
                composed: true
            }));
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'focus-section': FocusSection;
    }
}
