/**
 * SpecsmdApp - Root component for the SpecsMD webview.
 *
 * This is the main entry point component that manages:
 * - Tab navigation state
 * - Communication with the VS Code extension
 * - View content rendering
 *
 * Bolts view uses Lit components with structured data.
 * Specs and Overview views use server-rendered HTML (hybrid approach).
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { BaseElement } from './shared/base-element.js';
import './tabs/view-tabs.js';
import './bolts/bolts-view.js';
import type { TabId, TabChangeDetail } from './tabs/view-tabs.js';
import type { BoltsViewData } from './bolts/bolts-view.js';
import type { ActivityFilter } from './bolts/activity-feed.js';
import { vscode } from '../vscode-api.js';

/**
 * Message types from the extension.
 */
interface ExtensionMessage {
    type: 'setData' | 'setTab' | 'setBoltsData';
    activeTab?: TabId;
    // Hybrid approach (specs/overview)
    specsHtml?: string;
    overviewHtml?: string;
    // Lit components approach (bolts)
    boltsData?: BoltsViewData;
    // Legacy support
    boltsHtml?: string;
}

/**
 * Root application component.
 */
@customElement('specsmd-app')
export class SpecsmdApp extends BaseElement {
    /**
     * Currently active tab.
     */
    @state()
    private _activeTab: TabId = 'bolts';

    /**
     * Bolts view data (Lit components).
     */
    @state()
    private _boltsData: BoltsViewData | null = null;

    /**
     * HTML content for specs/overview views (server-rendered).
     */
    @state()
    private _specsHtml = '';

    @state()
    private _overviewHtml = '';

    /**
     * Whether initial data has been loaded.
     */
    @state()
    private _loaded = false;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100vh;
                overflow: hidden;
                background: var(--background);
            }

            .view-container {
                flex: 1;
                overflow-y: auto;
                display: none;
            }

            .view-container.active {
                display: flex;
                flex-direction: column;
            }

            bolts-view {
                flex: 1;
                min-height: 0;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--description-foreground);
            }

            /* ==================== SPECS VIEW ==================== */
            .specs-toolbar {
                padding: 8px 12px;
                background: var(--vscode-sideBarSectionHeader-background);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .specs-toolbar-label {
                font-size: 9px;
                color: var(--description-foreground);
                text-transform: uppercase;
            }

            .specs-toolbar-select {
                flex: 1;
                padding: 5px 8px;
                font-size: 10px;
                background: var(--vscode-input-background);
                border: 1px solid var(--border-color);
                color: var(--foreground);
                border-radius: 4px;
                cursor: pointer;
            }

            .specs-content {
                flex: 1;
                overflow-y: auto;
            }

            .intent-item {
                border-bottom: 1px solid var(--border-color);
            }

            .intent-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .intent-header:hover {
                background: var(--editor-background);
            }

            .intent-expand {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.2s;
            }

            .intent-item.collapsed .intent-expand {
                transform: rotate(-90deg);
            }

            .intent-icon {
                font-size: 14px;
            }

            .intent-info {
                flex: 1;
            }

            .intent-name {
                font-size: 12px;
                font-weight: 500;
            }

            .intent-meta {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .intent-progress-ring {
                width: 28px;
                height: 28px;
                position: relative;
            }

            .intent-progress-ring svg {
                transform: rotate(-90deg);
            }

            .intent-progress-ring .ring-bg {
                fill: none;
                stroke: var(--vscode-input-background);
                stroke-width: 3;
            }

            .intent-progress-ring .ring-fill {
                fill: none;
                stroke: var(--status-complete);
                stroke-width: 3;
                stroke-linecap: round;
                stroke-dasharray: 69.115;
            }

            .intent-progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 8px;
                font-weight: 600;
            }

            .intent-content {
                max-height: 2000px;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: var(--editor-background);
            }

            .intent-item.collapsed .intent-content {
                max-height: 0;
            }

            .unit-item {
                border-bottom: 1px solid var(--border-color);
            }

            .unit-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px 8px 28px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .unit-header:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .unit-expand {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.2s;
            }

            .unit-item.collapsed .unit-expand {
                transform: rotate(-90deg);
            }

            .unit-icon {
                font-size: 12px;
            }

            .unit-status {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                color: white;
            }

            .unit-status.complete { background: var(--status-complete); }
            .unit-status.active { background: var(--status-active); }
            .unit-status.pending {
                background: var(--vscode-input-background);
                border: 1px dashed var(--border-color);
                color: var(--description-foreground);
            }

            .unit-name {
                flex: 1;
                font-size: 11px;
            }

            /* Spec open buttons (magnifier icons) */
            .spec-open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px;
                font-size: 12px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .intent-header:hover .spec-open-btn,
            .unit-header:hover .spec-open-btn {
                opacity: 0.7;
            }

            .spec-open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .unit-progress {
                font-size: 9px;
                color: var(--description-foreground);
            }

            .unit-content {
                max-height: 1000px;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .unit-item.collapsed .unit-content {
                max-height: 0;
            }

            .spec-story-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px 6px 52px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .spec-story-item:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .spec-story-icon {
                font-size: 11px;
                opacity: 0.7;
            }

            .spec-story-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
            }

            .spec-story-status.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .spec-story-status.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
            }

            .spec-story-name {
                flex: 1;
                font-size: 11px;
            }

            .spec-story-name.complete {
                color: var(--description-foreground);
            }

            .spec-no-stories {
                padding: 8px 12px 8px 52px;
                font-size: 11px;
                font-style: italic;
                color: var(--description-foreground);
            }

            /* ==================== OVERVIEW VIEW ==================== */
            .overview-content {
                padding: 16px;
            }

            .overview-section {
                margin-bottom: 20px;
            }

            .overview-section-title {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--description-foreground);
                margin-bottom: 10px;
            }

            .overview-metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }

            .overview-metric-card {
                background: var(--editor-background);
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }

            .overview-metric-value {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .overview-metric-value.highlight { color: var(--status-active); }
            .overview-metric-value.success { color: var(--status-complete); }

            .overview-metric-label {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .overview-progress-bar {
                height: 8px;
                background: var(--vscode-input-background);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 20px;
            }

            .overview-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--status-complete), var(--status-active));
                border-radius: 4px;
                transition: width 0.5s ease;
            }

            .overview-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .overview-list-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: var(--editor-background);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .overview-list-item:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .overview-list-icon {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .overview-list-icon.intent {
                background: rgba(139, 92, 246, 0.2);
                color: #8b5cf6;
            }

            .overview-list-icon.action {
                background: rgba(249, 115, 22, 0.2);
                color: var(--status-active);
            }

            .overview-list-icon.bolt {
                background: rgba(249, 115, 22, 0.2);
                color: var(--status-active);
            }

            .overview-list-info {
                flex: 1;
            }

            .overview-list-name {
                font-size: 12px;
                font-weight: 500;
            }

            .overview-list-meta {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .overview-list-progress {
                font-size: 11px;
                font-weight: 600;
                color: var(--status-complete);
            }

            /* ==================== EMPTY STATE ==================== */
            .empty-state {
                padding: 20px;
                text-align: center;
                color: var(--description-foreground);
            }

            .empty-state-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .empty-state-text {
                font-size: 11px;
            }
        `
    ];

    connectedCallback(): void {
        super.connectedCallback();

        // Listen for messages from the extension
        window.addEventListener('message', this._handleMessage);

        // Notify extension we're ready
        vscode.postMessage({ type: 'ready' });
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        window.removeEventListener('message', this._handleMessage);
    }

    /**
     * Called after render. Attach event handlers to server-rendered HTML.
     */
    updated(changedProperties: Map<string, unknown>): void {
        super.updated(changedProperties);

        // Attach handlers for specs view whenever specsHtml changes or becomes active
        if (changedProperties.has('_specsHtml') || changedProperties.has('_activeTab')) {
            this._attachSpecsViewHandlers();
        }

        // Attach handlers for overview view
        if (changedProperties.has('_overviewHtml') || changedProperties.has('_activeTab')) {
            this._attachOverviewViewHandlers();
        }
    }

    /**
     * Attach event handlers to specs view server-rendered HTML.
     * Uses container-level guard to prevent duplicate listener attachment.
     */
    private _attachSpecsViewHandlers(): void {
        const specsView = this.shadowRoot?.querySelector('#specs-view') as HTMLElement | null;
        if (!specsView) return;

        // Container-level guard to prevent multiple attachment passes
        const currentHtmlHash = this._specsHtml.length.toString();
        if (specsView.dataset.handlersAttached === currentHtmlHash) return;
        specsView.dataset.handlersAttached = currentHtmlHash;

        // Intent expand/collapse
        specsView.querySelectorAll('.intent-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Don't toggle if clicking on the open button
                if ((e.target as HTMLElement).closest('.spec-open-btn')) {
                    return;
                }
                header.parentElement?.classList.toggle('collapsed');
            });
        });

        // Intent open button (magnifier) - opens intent requirements file
        specsView.querySelectorAll('.intent-open-btn').forEach(btn => {
            const htmlBtn = btn as HTMLElement;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = htmlBtn.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'intent', path });
                }
            });
        });

        // Unit expand/collapse
        specsView.querySelectorAll('.unit-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Don't toggle if clicking on the open button
                if ((e.target as HTMLElement).closest('.spec-open-btn')) {
                    return;
                }
                e.stopPropagation();
                header.parentElement?.classList.toggle('collapsed');
            });
        });

        // Unit open button (magnifier) - opens unit brief file
        specsView.querySelectorAll('.unit-open-btn').forEach(btn => {
            const htmlBtn = btn as HTMLElement;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = htmlBtn.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'unit', path });
                }
            });
        });

        // Story click
        specsView.querySelectorAll('.spec-story-item').forEach(item => {
            const htmlItem = item as HTMLElement;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = htmlItem.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'story', path });
                }
            });
        });
    }

    /**
     * Attach event handlers to overview view server-rendered HTML.
     * Uses data attribute to prevent duplicate listener attachment.
     */
    private _attachOverviewViewHandlers(): void {
        const overviewView = this.shadowRoot?.querySelector('#overview-view') as HTMLElement | null;
        if (!overviewView) return;

        // Container-level guard to prevent multiple attachment passes
        const currentHtmlHash = this._overviewHtml.length.toString();
        if (overviewView.dataset.handlersAttached === currentHtmlHash) return;
        overviewView.dataset.handlersAttached = currentHtmlHash;

        // List item clicks
        overviewView.querySelectorAll('.overview-list-item').forEach(item => {
            const htmlItem = item as HTMLElement;
            item.addEventListener('click', () => {
                const path = htmlItem.dataset.path;
                const intent = htmlItem.dataset.intent;
                const actionType = htmlItem.dataset.actionType;

                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'standard', path });
                } else if (intent) {
                    // Switch to specs tab when clicking on an intent
                    this._activeTab = 'specs';
                    vscode.postMessage({ type: 'tabChange', tab: 'specs' });
                } else if (actionType) {
                    const targetId = htmlItem.dataset.targetId;
                    this._handleSuggestedAction(actionType, targetId);
                }
            });
        });

        // Website link
        const websiteLink = overviewView.querySelector('#specsWebsiteLink') as HTMLElement | null;
        if (websiteLink) {
            websiteLink.addEventListener('click', () => {
                vscode.postMessage({ type: 'openExternal', url: 'https://specs.md' });
            });
        }
    }

    /**
     * Handle suggested action clicks.
     */
    private _handleSuggestedAction(actionType: string, targetId?: string): void {
        switch (actionType) {
            case 'continue-bolt':
            case 'start-bolt':
            case 'unblock-bolt':
                if (targetId) {
                    vscode.postMessage({ type: 'startBolt', boltId: targetId });
                }
                break;
            case 'complete-stage':
                if (targetId) {
                    vscode.postMessage({ type: 'continueBolt', boltId: targetId, boltName: targetId });
                }
                break;
        }
    }

    render() {
        if (!this._loaded) {
            return html`<div class="loading">Loading...</div>`;
        }

        return html`
            <view-tabs
                .activeTab=${this._activeTab}
                @tab-change=${this._handleTabChange}
            ></view-tabs>

            <div class="view-container ${this._activeTab === 'bolts' ? 'active' : ''}" id="bolts-view">
                ${this._boltsData ? html`
                    <bolts-view
                        .data=${this._boltsData}
                        @toggle-focus=${this._handleToggleFocus}
                        @filter-change=${this._handleFilterChange}
                        @resize=${this._handleResize}
                        @start-bolt=${this._handleStartBolt}
                        @continue-bolt=${this._handleContinueBolt}
                        @view-files=${this._handleViewFiles}
                        @open-file=${this._handleOpenFile}>
                    </bolts-view>
                ` : html`<div class="loading">Loading...</div>`}
            </div>

            <div class="view-container ${this._activeTab === 'specs' ? 'active' : ''}" id="specs-view">
                ${unsafeHTML(this._specsHtml)}
            </div>

            <div class="view-container ${this._activeTab === 'overview' ? 'active' : ''}" id="overview-view">
                ${unsafeHTML(this._overviewHtml)}
            </div>
        `;
    }

    /**
     * Handle messages from the extension.
     */
    private _handleMessage = (event: MessageEvent<ExtensionMessage>): void => {
        const message = event.data;

        switch (message.type) {
            case 'setData':
                if (message.activeTab) {
                    this._activeTab = message.activeTab;
                }
                if (message.boltsData !== undefined) {
                    this._boltsData = message.boltsData;
                }
                if (message.specsHtml !== undefined) {
                    this._specsHtml = message.specsHtml;
                }
                if (message.overviewHtml !== undefined) {
                    this._overviewHtml = message.overviewHtml;
                }
                this._loaded = true;
                break;

            case 'setBoltsData':
                if (message.boltsData !== undefined) {
                    this._boltsData = message.boltsData;
                }
                break;

            case 'setTab':
                if (message.activeTab) {
                    this._activeTab = message.activeTab;
                }
                break;
        }
    };

    /**
     * Handle tab change from the tabs component.
     */
    private _handleTabChange(e: CustomEvent<TabChangeDetail>): void {
        this._activeTab = e.detail.tab;
        vscode.postMessage({ type: 'tabChange', tab: e.detail.tab });
    }

    /**
     * Handle focus card toggle.
     */
    private _handleToggleFocus(e: CustomEvent<{ expanded: boolean }>): void {
        vscode.postMessage({ type: 'toggleFocus', expanded: e.detail.expanded });
        // Optimistically update local state
        if (this._boltsData) {
            this._boltsData = { ...this._boltsData, focusCardExpanded: e.detail.expanded };
        }
    }

    /**
     * Handle activity filter change.
     */
    private _handleFilterChange(e: CustomEvent<{ filter: ActivityFilter }>): void {
        vscode.postMessage({ type: 'activityFilter', filter: e.detail.filter });
        // Optimistically update local state
        if (this._boltsData) {
            this._boltsData = { ...this._boltsData, activityFilter: e.detail.filter };
        }
    }

    /**
     * Handle activity section resize.
     */
    private _handleResize(e: CustomEvent<{ height: number }>): void {
        vscode.postMessage({ type: 'activityResize', height: e.detail.height });
        // Optimistically update local state
        if (this._boltsData) {
            this._boltsData = { ...this._boltsData, activityHeight: e.detail.height };
        }
    }

    /**
     * Handle start bolt button.
     */
    private _handleStartBolt(e: CustomEvent<{ boltId: string }>): void {
        vscode.postMessage({ type: 'startBolt', boltId: e.detail.boltId });
    }

    /**
     * Handle open file from activity.
     */
    private _handleOpenFile(e: CustomEvent<{ path: string }>): void {
        vscode.postMessage({ type: 'openArtifact', kind: 'file', path: e.detail.path });
    }

    /**
     * Handle continue bolt button - shows agent prompt.
     */
    private _handleContinueBolt(e: CustomEvent<{ boltId: string; boltName: string }>): void {
        vscode.postMessage({ type: 'continueBolt', boltId: e.detail.boltId, boltName: e.detail.boltName });
    }

    /**
     * Handle view files button - opens bolt files.
     */
    private _handleViewFiles(e: CustomEvent<{ boltId: string }>): void {
        vscode.postMessage({ type: 'viewBoltFiles', boltId: e.detail.boltId });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'specsmd-app': SpecsmdApp;
    }
}
