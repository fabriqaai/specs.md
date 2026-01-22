/**
 * AIDLC UI Provider
 *
 * Implements the FlowUIProvider interface for AI-DLC visualization.
 * Delegates to the existing webview rendering functions for backward compatibility.
 */

import * as vscode from 'vscode';
import {
    FlowUIProvider,
    TabDefinition,
    WebviewData,
    WebviewMessage,
    FlowInfo
} from '../../../core/types';
import {
    FromWebviewMessage,
    isTabChangeMessage,
    isOpenArtifactMessage
} from '../../../core/webview/messaging';
import { WebviewSnapshot } from '../state';
import { getLitWebviewContent } from '../../../webview';
import { openFile } from '../../../utils';
import {
    trackTabChanged,
    trackBoltAction,
    trackArtifactOpened,
    trackFilterChanged,
    normalizeBoltType,
    normalizeBoltStatus
} from '../../../analytics';
import type {
    BoltAction,
    BoltType,
    BoltStatus,
    ArtifactType,
    TabId as AnalyticsTabId
} from '../../../analytics/types';

/**
 * Tab definitions for AIDLC flow.
 */
export const AIDLC_TABS: TabDefinition[] = [
    { id: 'bolts', label: 'Bolts', icon: 'zap' },
    { id: 'specs', label: 'Specs', icon: 'file-text' },
    { id: 'overview', label: 'Overview', icon: 'dashboard' }
];

/**
 * AIDLC UI Provider implementation.
 */
export class AidlcUIProvider implements FlowUIProvider {
    readonly tabs: TabDefinition[] = AIDLC_TABS;

    private _context: vscode.ExtensionContext | null = null;
    private _onUIStateChange: ((key: string, value: unknown) => void) | null = null;
    private _previousTab: AnalyticsTabId = 'bolts';

    /**
     * Initialize the UI provider.
     */
    initialize(
        context: vscode.ExtensionContext,
        onUIStateChange?: (key: string, value: unknown) => void
    ): void {
        this._context = context;
        this._onUIStateChange = onUIStateChange || null;
    }

    /**
     * Get the HTML scaffold for the webview.
     */
    getScaffoldHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        // Use the existing Lit webview content generator
        return getLitWebviewContent(webview, extensionUri);
    }

    /**
     * Get data for webview rendering.
     * Note: The actual HTML generation for specs/overview is done by the existing
     * webview provider. This method prepares the data structure.
     */
    getWebviewData(
        state: WebviewSnapshot,
        activeTab: string,
        availableFlows: FlowInfo[]
    ): WebviewData {
        // Transform AIDLC state to WebviewData format
        const boltsData = this._transformBoltsData(state);

        return {
            flowId: 'aidlc',
            flowDisplayName: 'AI-DLC',
            activeTab,
            currentContext: state.currentIntent?.name || null,
            tabData: {
                bolts: boltsData,
                intents: state.intents,
                standards: state.standards,
                ui: state.ui
            },
            availableFlows
        };
    }

    /**
     * Handle a message from the webview.
     */
    async handleMessage(message: WebviewMessage): Promise<void> {
        const msg = message as FromWebviewMessage;

        switch (msg.type) {
            case 'tabChange':
                if (isTabChangeMessage(msg)) {
                    const newTab = msg.tab as AnalyticsTabId;
                    this._persistUIState('activeTab', newTab);
                    trackTabChanged(this._previousTab, newTab);
                    this._previousTab = newTab;
                }
                break;

            case 'openArtifact':
                if (isOpenArtifactMessage(msg)) {
                    await openFile(msg.path);
                    // Map kind to artifact type
                    const artifactType = this._mapKindToArtifactType(msg.kind);
                    const sourceTab = this._getActiveTab();
                    trackArtifactOpened(artifactType, sourceTab);
                }
                break;

            case 'startBolt':
                this._handleBoltAction('start', msg as { boltId: string; type?: string; status?: string });
                break;

            case 'continueBolt':
                this._handleBoltAction('continue', msg as { boltId: string; type?: string; status?: string });
                break;

            case 'viewBoltFiles':
                this._handleBoltAction('view_files', msg as { boltId: string; type?: string; status?: string });
                break;

            case 'openBoltMd':
                this._handleBoltAction('open_md', msg as { boltId: string; type?: string; status?: string });
                break;

            case 'toggleFocus':
                this._persistUIState('focusCardExpanded', (msg as { expanded: boolean }).expanded);
                break;

            case 'activityFilter':
                this._persistUIState('activityFilter', (msg as { filter: string }).filter);
                trackFilterChanged('activity', (msg as { filter: string }).filter);
                break;

            case 'specsFilter':
                this._persistUIState('specsFilter', (msg as { filter: string }).filter);
                trackFilterChanged('specs', (msg as { filter: string }).filter);
                break;

            case 'activityResize':
                this._persistUIState('activitySectionHeight', (msg as { height: number }).height);
                break;

            case 'openExternal': {
                const url = (msg as { url: string }).url;
                if (url) {
                    vscode.env.openExternal(vscode.Uri.parse(url));
                }
                break;
            }
        }
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Transform state to bolts data format expected by Lit components.
     */
    private _transformBoltsData(state: WebviewSnapshot) {
        return {
            currentIntent: state.currentIntent,
            stats: state.stats,
            activeBolts: state.activeBolts.map(b => this._transformBolt(b)),
            pendingBolts: state.pendingBolts.map(b => this._transformBolt(b)),
            completedBolts: state.completedBolts.map(b => this._transformBolt(b)),
            activityFeed: state.activityFeed,
            ui: state.ui
        };
    }

    /**
     * Transform a bolt to the UI data format.
     */
    private _transformBolt(bolt: import('../parser').Bolt) {
        return {
            id: bolt.id,
            name: bolt.id.replace(/^bolt-/, '').replace(/-\d+$/, ''),
            type: bolt.type,
            status: bolt.status,
            intent: bolt.intent,
            unit: bolt.unit,
            currentStage: bolt.currentStage,
            stages: bolt.stages,
            stagesCompleted: bolt.stagesCompleted,
            stories: bolt.stories,
            path: bolt.path,
            filePath: bolt.filePath,
            isBlocked: bolt.isBlocked,
            blockedBy: bolt.blockedBy,
            unblocksCount: bolt.unblocksCount,
            createdAt: bolt.createdAt,
            startedAt: bolt.startedAt,
            completedAt: bolt.completedAt,
            constructionLogPath: bolt.constructionLogPath
        };
    }

    /**
     * Persist UI state change.
     */
    private _persistUIState(key: string, value: unknown): void {
        if (this._onUIStateChange) {
            this._onUIStateChange(key, value);
        }
    }

    /**
     * Handle bolt action with proper analytics tracking.
     */
    private _handleBoltAction(
        action: BoltAction,
        msg: { boltId: string; type?: string; status?: string }
    ): void {
        const boltType: BoltType = msg.type ? normalizeBoltType(msg.type) : 'unknown';
        const boltStatus: BoltStatus = msg.status ? normalizeBoltStatus(msg.status) : 'unknown';
        trackBoltAction(action, boltType, boltStatus);
    }

    /**
     * Map artifact kind to analytics artifact type.
     */
    private _mapKindToArtifactType(kind?: string): ArtifactType {
        switch (kind?.toLowerCase()) {
            case 'bolt':
                return 'bolt';
            case 'unit':
                return 'unit';
            case 'story':
                return 'story';
            case 'intent':
                return 'intent';
            case 'standard':
                return 'standard';
            default:
                return 'bolt'; // Default fallback
        }
    }

    /**
     * Get the currently active tab (for analytics source).
     */
    private _getActiveTab(): AnalyticsTabId {
        // Default to bolts if we don't have context
        return 'bolts';
    }
}

/**
 * Create an AIDLC UI provider instance.
 */
export function createAidlcUIProvider(): AidlcUIProvider {
    return new AidlcUIProvider();
}
