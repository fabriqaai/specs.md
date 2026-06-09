/**
 * BoltsView - Main Bolts view container.
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './current-bolts.js';
import './focus-section.js';
import './queue-section.js';
import './completions-section.js';
import type { IntentInfo, BoltStats, IntentContext, IntentOption } from './current-bolts.js';
import type { ActiveBoltData } from './focus-card.js';
import type { QueuedBoltData } from './queue-item.js';
import type { CompletedBoltData } from './completion-item.js';

/**
 * Complete Bolts view data.
 */
export interface BoltsViewData {
    currentIntent: IntentInfo | null;
    currentIntentContext: IntentContext;
    stats: BoltStats;
    activeBolts: ActiveBoltData[];
    upNextQueue: QueuedBoltData[];
    completedBolts: CompletedBoltData[];
    focusCardExpanded: boolean;
    /** All intents in the workspace, for the intent picker. */
    boltIntents: IntentOption[];
    /**
     * Per-intent bolt stats keyed by intent number / name / combined form.
     * Computed by the backend from the full (untruncated) bolt arrays so
     * progress is accurate even when `completedBolts` is clipped for display.
     */
    intentStats: Record<string, BoltStats>;
}

/**
 * Bolts view container component.
 *
 * @fires toggle-focus - When focus card is expanded/collapsed
 * @fires start-bolt - When Start button is clicked
 * @fires continue-bolt - When Continue button is clicked
 * @fires view-files - When Files button is clicked
 * @fires open-file - When a file is clicked (story or artifact)
 * @fires open-bolt - When bolt magnifier is clicked
 *
 * @example
 * ```html
 * <bolts-view .data=${data}></bolts-view>
 * ```
 */
@customElement('bolts-view')
export class BoltsView extends BaseElement {
    /**
     * Complete Bolts view data.
     */
    @property({ type: Object })
    data!: BoltsViewData;

    /**
     * Currently selected intent number for the picker + queue filter.
     * `null` means "not yet initialized"; defaults to currentIntent.number on
     * first render where one is available.
     */
    @state()
    private _selectedIntent: string | null = null;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .content {
                flex: 1;
                overflow-y: auto;
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div>Loading...</div>`;
        }

        const intents = this.data.boltIntents ?? [];
        const selected = this._resolveSelectedIntent(intents);
        const perIntentStats = this._computePerIntentStats(selected);
        const filteredQueue = selected === null
            ? this.data.upNextQueue
            : this.data.upNextQueue.filter(b => this._boltMatchesIntent(b, selected));
        const filteredCompletions = selected === null
            ? this.data.completedBolts
            : this.data.completedBolts.filter(b => this._boltMatchesIntent(b, selected));

        return html`
            <current-intent
                .intents=${intents}
                .selected=${selected}
                .stats=${perIntentStats}
                .currentIntentNumber=${this.data.currentIntent?.number ?? null}
                .context=${this.data.currentIntentContext}
                @intent-select=${this._handleIntentSelect}>
            </current-intent>

            <div class="content">
                <focus-section
                    .bolts=${this.data.activeBolts}
                    @toggle-focus=${this._handleToggleFocus}
                    @continue-bolt=${this._handleContinueBolt}
                    @view-files=${this._handleViewFiles}
                    @open-bolt=${this._handleOpenBolt}
                    @open-file=${this._handleOpenFile}>
                </focus-section>

                <queue-section
                    .bolts=${filteredQueue}
                    @start-bolt=${this._handleStartBolt}
                    @open-file=${this._handleOpenFile}
                    @open-bolt=${this._handleOpenBolt}>
                </queue-section>

                <completions-section
                    .bolts=${filteredCompletions}
                    @open-file=${this._handleOpenFile}
                    @open-bolt=${this._handleOpenBolt}>
                </completions-section>
            </div>
        `;
    }

    /**
     * Resolve the effective selected intent, falling back to the backend's
     * current intent the first time around, then to the first available.
     */
    private _resolveSelectedIntent(intents: IntentOption[]): string | null {
        if (intents.length === 0) {
            return null;
        }
        if (this._selectedIntent && intents.some(i => i.number === this._selectedIntent)) {
            return this._selectedIntent;
        }
        const fallback = this.data.currentIntent?.number ?? intents[0].number;
        return fallback;
    }

    /**
     * Look up per-intent bolt stats. Falls back to zeros if the backend
     * didn't provide an entry for this intent.
     */
    private _computePerIntentStats(intentNumber: string | null): BoltStats {
        const empty: BoltStats = { active: 0, queued: 0, done: 0, blocked: 0 };
        if (intentNumber === null || !this.data.intentStats) {
            return empty;
        }
        return this.data.intentStats[intentNumber] ?? empty;
    }

    /**
     * Returns true if the bolt belongs to the given intent. Matches against
     * the resolved number, name, and the raw `intent` field for safety.
     */
    private _boltMatchesIntent(
        bolt: { intent: string; intentNumber: string; intentName: string },
        intentNumber: string
    ): boolean {
        return (
            bolt.intentNumber === intentNumber ||
            bolt.intent === intentNumber ||
            bolt.intentName === intentNumber
        );
    }

    private _handleIntentSelect(e: CustomEvent<{ number: string }>): void {
        e.stopPropagation();
        this._selectedIntent = e.detail.number;
    }

    private _handleToggleFocus(e: CustomEvent<{ expanded: boolean }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('toggle-focus', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleStartBolt(e: CustomEvent<{ boltId: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('start-bolt', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenFile(e: CustomEvent<{ path: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleContinueBolt(e: CustomEvent<{ boltId: string; boltName: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('continue-bolt', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleViewFiles(e: CustomEvent<{ boltId: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('view-files', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenBolt(e: CustomEvent<{ boltId: string }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-bolt', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'bolts-view': BoltsView;
    }
}
