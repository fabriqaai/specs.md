/**
 * BoltsView - Main Bolts view container.
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './current-bolts.js';
import './focus-section.js';
import './queue-section.js';
import './completions-section.js';
import './activity-feed.js';
import type { IntentInfo, BoltStats } from './current-bolts.js';
import type { ActiveBoltData } from './focus-card.js';
import type { QueuedBoltData } from './queue-item.js';
import type { CompletedBoltData } from './completion-item.js';
import type { ActivityEventData } from './activity-item.js';
import type { ActivityFilter } from './activity-feed.js';

/**
 * Complete Bolts view data.
 */
export interface BoltsViewData {
    currentIntent: IntentInfo | null;
    stats: BoltStats;
    activeBolts: ActiveBoltData[];
    upNextQueue: QueuedBoltData[];
    completedBolts: CompletedBoltData[];
    activityEvents: ActivityEventData[];
    focusCardExpanded: boolean;
    activityFilter: ActivityFilter;
    activityHeight: number;
}

/**
 * Bolts view container component.
 *
 * @fires toggle-focus - When focus card is expanded/collapsed
 * @fires filter-change - When activity filter is changed
 * @fires resize - When activity section is resized
 * @fires start-bolt - When Start button is clicked
 * @fires continue-bolt - When Continue button is clicked
 * @fires view-files - When Files button is clicked
 * @fires open-file - When activity file is clicked
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

            activity-feed {
                flex-shrink: 0;
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div>Loading...</div>`;
        }

        return html`
            <current-intent
                .intent=${this.data.currentIntent}
                .stats=${this.data.stats}>
            </current-intent>

            <div class="content">
                <focus-section
                    .bolts=${this.data.activeBolts}
                    @toggle-focus=${this._handleToggleFocus}
                    @continue-bolt=${this._handleContinueBolt}
                    @view-files=${this._handleViewFiles}
                    @open-bolt=${this._handleOpenBolt}>
                </focus-section>

                <queue-section
                    .bolts=${this.data.upNextQueue}
                    @start-bolt=${this._handleStartBolt}>
                </queue-section>

                <completions-section
                    .bolts=${this.data.completedBolts}
                    @open-file=${this._handleOpenFile}
                    @open-bolt=${this._handleOpenBolt}>
                </completions-section>
            </div>

            <activity-feed
                .events=${this.data.activityEvents}
                .filter=${this.data.activityFilter}
                .height=${this.data.activityHeight}
                @filter-change=${this._handleFilterChange}
                @resize=${this._handleResize}
                @open-file=${this._handleOpenFile}>
            </activity-feed>
        `;
    }

    private _handleToggleFocus(e: CustomEvent<{ expanded: boolean }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('toggle-focus', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleFilterChange(e: CustomEvent<{ filter: ActivityFilter }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _handleResize(e: CustomEvent<{ height: number }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('resize', {
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
