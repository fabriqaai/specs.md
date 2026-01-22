/**
 * FireView - Main FIRE flow view container.
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseElement } from '../shared/base-element.js';
import './fire-view-tabs.js';
import './runs/fire-runs-view.js';
import './intents/fire-intents-view.js';
import './overview/fire-overview-view.js';
import type { FireTabId } from './fire-view-tabs.js';
import type { FireRunsViewData } from './runs/fire-runs-view.js';
import type { FireIntentsViewData } from './intents/fire-intents-view.js';
import type { FireOverviewViewData } from './overview/fire-overview-view.js';

/**
 * Complete FIRE view data structure.
 */
export interface FireViewData {
    activeTab: FireTabId;
    runsData: FireRunsViewData;
    intentsData: FireIntentsViewData;
    overviewData: FireOverviewViewData;
}

/**
 * Main FIRE flow view container.
 *
 * @fires tab-change - When tab is changed
 * @fires continue-run - When continue run is clicked
 * @fires start-run - When start run is clicked
 * @fires view-artifact - When artifact is viewed
 * @fires view-run - When completed run is viewed
 * @fires open-file - When file is opened
 * @fires filter-change - When filter is changed
 * @fires toggle-expand - When intent expand state changes
 *
 * @example
 * ```html
 * <fire-view .data=${data}></fire-view>
 * ```
 */
@customElement('fire-view')
export class FireView extends BaseElement {
    /**
     * Complete FIRE view data.
     */
    @property({ type: Object })
    data!: FireViewData;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .view-content {
                flex: 1;
                overflow: hidden;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--description-foreground);
            }
        `
    ];

    render() {
        if (!this.data) {
            return html`<div class="loading">Loading FIRE view...</div>`;
        }

        return html`
            <fire-view-tabs
                activeTab=${this.data.activeTab}
                @tab-change=${this._handleTabChange}
            ></fire-view-tabs>

            <div class="view-content">
                ${this._renderActiveView()}
            </div>
        `;
    }

    private _renderActiveView() {
        switch (this.data.activeTab) {
            case 'runs':
                return html`
                    <fire-runs-view
                        .data=${this.data.runsData}
                        @continue-run=${this._forwardEvent}
                        @start-run=${this._forwardEvent}
                        @view-artifact=${this._forwardEvent}
                        @view-run=${this._forwardEvent}
                        @open-file=${this._forwardEvent}
                    ></fire-runs-view>
                `;

            case 'intents':
                return html`
                    <fire-intents-view
                        .data=${this.data.intentsData}
                        @filter-change=${this._forwardEvent}
                        @toggle-expand=${this._forwardEvent}
                        @open-file=${this._forwardEvent}
                    ></fire-intents-view>
                `;

            case 'overview':
                return html`
                    <fire-overview-view
                        .data=${this.data.overviewData}
                        @open-file=${this._forwardEvent}
                    ></fire-overview-view>
                `;

            default:
                return nothing;
        }
    }

    private _handleTabChange(e: CustomEvent<{ tab: FireTabId }>): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('tab-change', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    private _forwardEvent(e: CustomEvent): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent(e.type, {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-view': FireView;
    }
}
