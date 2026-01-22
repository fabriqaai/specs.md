/**
 * FireScopeBadge - Displays run scope (single/batch/wide).
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';

/**
 * Run scope type.
 */
export type RunScope = 'single' | 'batch' | 'wide';

/**
 * Badge showing the scope of a run.
 *
 * @example
 * ```html
 * <fire-scope-badge scope="batch"></fire-scope-badge>
 * ```
 */
@customElement('fire-scope-badge')
export class FireScopeBadge extends BaseElement {
    /**
     * The run scope.
     */
    @property({ type: String })
    scope: RunScope = 'single';

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: inline-flex;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                color: var(--description-foreground);
            }

            .icon {
                font-size: 10px;
            }
        `
    ];

    render() {
        const icon = this._getIcon();
        const label = this._getLabel();

        return html`
            <span class="badge">
                <span class="icon">${icon}</span>
                <span>${label}</span>
            </span>
        `;
    }

    private _getIcon(): string {
        switch (this.scope) {
            case 'single': return '1️⃣';
            case 'batch': return '📦';
            case 'wide': return '🌐';
            default: return '•';
        }
    }

    private _getLabel(): string {
        switch (this.scope) {
            case 'single': return 'Single';
            case 'batch': return 'Batch';
            case 'wide': return 'Wide';
            default: return this.scope;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-scope-badge': FireScopeBadge;
    }
}
