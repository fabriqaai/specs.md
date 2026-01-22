/**
 * FirePhasePipeline - Shows the 4 FIRE phases: Plan → Execute → Test → Review.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';

/**
 * Phase status.
 */
export type PhaseStatus = 'pending' | 'active' | 'complete' | 'skipped';

/**
 * FIRE run phases.
 */
export const FIRE_PHASES = ['plan', 'execute', 'test', 'review'] as const;
export type FirePhase = typeof FIRE_PHASES[number];

/**
 * Phase data.
 */
export interface PhaseData {
    phase: FirePhase;
    status: PhaseStatus;
}

/**
 * Phase pipeline component showing FIRE phase progression.
 *
 * @example
 * ```html
 * <fire-phase-pipeline .phases=${phases} currentPhase="execute"></fire-phase-pipeline>
 * ```
 */
@customElement('fire-phase-pipeline')
export class FirePhasePipeline extends BaseElement {
    /**
     * Phases with their statuses.
     */
    @property({ type: Array })
    phases: PhaseData[] = [];

    /**
     * Current active phase.
     */
    @property({ type: String })
    currentPhase: FirePhase | null = null;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                align-items: center;
                gap: 2px;
                padding: 8px 0;
            }

            .phase {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                flex: 1;
            }

            .node {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 600;
                border: 2px solid var(--border-color);
                background: var(--editor-background);
                color: var(--description-foreground);
                transition: all 0.2s ease;
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
                box-shadow: 0 0 8px rgba(249, 115, 22, 0.4);
            }

            .node.skipped {
                opacity: 0.5;
                border-style: dashed;
            }

            .label {
                font-size: 9px;
                color: var(--description-foreground);
                text-align: center;
                text-transform: capitalize;
            }

            .label.active {
                color: var(--status-active);
                font-weight: 500;
            }

            .connector {
                width: 100%;
                max-width: 20px;
                height: 2px;
                background: var(--border-color);
                margin-bottom: 18px;
                flex-shrink: 1;
            }

            .connector.complete {
                background: var(--status-complete);
            }
        `
    ];

    render() {
        // Default phases if not provided
        const phases = this.phases.length > 0
            ? this.phases
            : this._getDefaultPhases();

        return html`
            ${phases.map((phase, idx) => html`
                <div class="phase">
                    <div class="node ${phase.status}">
                        ${phase.status === 'complete'
                            ? html`&#10003;`
                            : this._getPhaseIcon(phase.phase)}
                    </div>
                    <span class="label ${phase.status === 'active' ? 'active' : ''}">${phase.phase}</span>
                </div>
                ${idx < phases.length - 1 ? html`
                    <div class="connector ${phase.status === 'complete' ? 'complete' : ''}"></div>
                ` : ''}
            `)}
        `;
    }

    private _getDefaultPhases(): PhaseData[] {
        return FIRE_PHASES.map(phase => ({
            phase,
            status: phase === this.currentPhase ? 'active' : 'pending'
        }));
    }

    private _getPhaseIcon(phase: FirePhase): string {
        switch (phase) {
            case 'plan': return 'P';
            case 'execute': return 'E';
            case 'test': return 'T';
            case 'review': return 'R';
            default: return '?';
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-phase-pipeline': FirePhasePipeline;
    }
}
