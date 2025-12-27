/**
 * StagePipeline - Stage status indicator row.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from './base-element.js';

/**
 * Stage data structure.
 */
export interface StageData {
    name: string;
    status: 'complete' | 'active' | 'pending';
}


/**
 * Stage pipeline component showing stage progression.
 *
 * @example
 * ```html
 * <stage-pipeline .stages=${stages}></stage-pipeline>
 * ```
 */
@customElement('stage-pipeline')
export class StagePipeline extends BaseElement {
    /**
     * Array of stage data.
     */
    @property({ type: Array })
    stages: StageData[] = [];

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 8px 0;
            }

            .stage {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }

            .node {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                border: 2px solid var(--border-color);
                background: var(--editor-background);
                color: var(--description-foreground);
            }

            .node.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .node.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
            }

            .label {
                font-size: 9px;
                color: var(--description-foreground);
                text-align: center;
            }

            .connector {
                width: 16px;
                height: 2px;
                background: var(--border-color);
                margin-bottom: 16px;
            }

            .connector.complete {
                background: var(--status-complete);
            }
        `
    ];

    render() {
        return html`
            ${this.stages.map((stage, idx) => html`
                <div class="stage">
                    <div class="node ${stage.status}">
                        ${stage.status === 'complete'
                            ? html`&#10003;`
                            : this._getInitial(stage.name)}
                    </div>
                    <span class="label">${this._formatName(stage.name)}</span>
                </div>
                ${idx < this.stages.length - 1 ? html`
                    <div class="connector ${stage.status === 'complete' ? 'complete' : ''}"></div>
                ` : ''}
            `)}
        `;
    }

    /**
     * Capitalize the first letter of the stage name.
     */
    private _formatName(name: string): string {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    /**
     * Get first letter of stage name for node display.
     */
    private _getInitial(name: string): string {
        return name.charAt(0).toUpperCase();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'stage-pipeline': StagePipeline;
    }
}
