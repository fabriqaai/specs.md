/**
 * FIRE UI Provider
 *
 * Implements the FlowUIProvider interface for FIRE flow visualization.
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
import { FireWebviewSnapshot, FireTabId } from '../types';
import { getLitWebviewContent } from '../../../webview';
import { openFile } from '../../../utils';
import {
    trackTabChanged,
    trackArtifactOpened,
    trackFilterChanged
} from '../../../analytics';
import type {
    ArtifactType,
    TabId as AnalyticsTabId
} from '../../../analytics/types';

/**
 * Tab definitions for FIRE flow.
 */
export const FIRE_TABS: TabDefinition[] = [
    { id: 'runs', label: 'Runs', icon: 'play' },
    { id: 'intents', label: 'Intents', icon: 'target' },
    { id: 'overview', label: 'Overview', icon: 'dashboard' }
];

/**
 * FIRE UI Provider implementation.
 */
export class FireUIProvider implements FlowUIProvider {
    readonly tabs: TabDefinition[] = FIRE_TABS;

    private _context: vscode.ExtensionContext | null = null;
    private _onUIStateChange: ((key: string, value: unknown) => void) | null = null;
    private _previousTab: AnalyticsTabId = 'runs' as AnalyticsTabId;

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
        return getLitWebviewContent(webview, extensionUri);
    }

    /**
     * Get data for webview rendering.
     */
    getWebviewData(
        state: FireWebviewSnapshot,
        activeTab: string,
        availableFlows: FlowInfo[]
    ): WebviewData {
        // Transform FIRE state to WebviewData format
        const runsData = this._transformRunsData(state);

        return {
            flowId: 'fire',
            flowDisplayName: 'FIRE',
            activeTab,
            currentContext: this._getCurrentContext(state),
            tabData: {
                runs: runsData,
                intents: state.intents,
                standards: state.standards,
                project: state.project,
                workspace: state.workspace,
                stats: state.stats,
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
                    const artifactType = this._mapKindToArtifactType(msg.kind);
                    const sourceTab = this._getActiveTab();
                    trackArtifactOpened(artifactType, sourceTab);
                }
                break;

            case 'runsFilter':
                this._persistUIState('runsFilter', (msg as { filter: string }).filter);
                trackFilterChanged('runs', (msg as { filter: string }).filter);
                break;

            case 'intentsFilter':
                this._persistUIState('intentsFilter', (msg as { filter: string }).filter);
                trackFilterChanged('intents', (msg as { filter: string }).filter);
                break;

            case 'expandIntent':
                this._handleExpandIntent((msg as { intentId: string; expanded: boolean }).intentId, (msg as { intentId: string; expanded: boolean }).expanded);
                break;

            case 'selectRun':
                this._persistUIState('selectedRunId', (msg as { runId: string | null }).runId);
                break;

            case 'startRun':
                // Handle run start request - would integrate with FIRE CLI
                this._handleStartRun(msg as { workItemIds: string[] });
                break;

            case 'viewRunFiles':
                // Open run folder in explorer
                this._handleViewRunFiles(msg as { runId: string; folderPath: string });
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

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Transform state to runs data format expected by Lit components.
     */
    private _transformRunsData(state: FireWebviewSnapshot) {
        return {
            activeRun: state.activeRun ? this._transformRun(state.activeRun) : null,
            completedRuns: state.completedRuns.map(r => this._transformRun(r)),
            stats: state.stats,
            ui: state.ui
        };
    }

    /**
     * Transform a run to the UI data format.
     */
    private _transformRun(run: FireWebviewSnapshot['activeRun']) {
        if (!run) return null;

        return {
            id: run.id,
            scope: run.scope,
            workItems: run.workItems.map(w => ({
                id: w.id,
                intentId: w.intentId,
                mode: w.mode,
                status: w.status
            })),
            currentItem: run.currentItem,
            folderPath: run.folderPath,
            startedAt: run.startedAt,
            completedAt: run.completedAt,
            hasPlan: run.hasPlan,
            hasWalkthrough: run.hasWalkthrough,
            hasTestReport: run.hasTestReport
        };
    }

    /**
     * Get current context string.
     */
    private _getCurrentContext(state: FireWebviewSnapshot): string | null {
        if (state.activeRun) {
            return `Run: ${state.activeRun.id}`;
        }

        const activeIntent = state.intents.find(i => i.status === 'in_progress');
        if (activeIntent) {
            return activeIntent.title;
        }

        return null;
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
     * Handle intent expand/collapse.
     */
    private _handleExpandIntent(intentId: string, expanded: boolean): void {
        // This would update the expandedIntents array in state
        // For now, just persist the change
        if (this._onUIStateChange) {
            this._onUIStateChange('expandIntent', { intentId, expanded });
        }
    }

    /**
     * Handle run start request.
     */
    private _handleStartRun(msg: { workItemIds: string[] }): void {
        // In a full implementation, this would:
        // 1. Call FIRE CLI to start a new run
        // 2. Update state
        // 3. Refresh the view
        vscode.window.showInformationMessage(
            `Starting run with ${msg.workItemIds.length} work item(s)...`
        );
    }

    /**
     * Handle view run files request.
     */
    private _handleViewRunFiles(msg: { runId: string; folderPath: string }): void {
        if (msg.folderPath) {
            const uri = vscode.Uri.file(msg.folderPath);
            vscode.commands.executeCommand('revealFileInOS', uri);
        }
    }

    /**
     * Map artifact kind to analytics artifact type.
     */
    private _mapKindToArtifactType(kind?: string): ArtifactType {
        switch (kind?.toLowerCase()) {
            case 'run':
                return 'bolt'; // Map to closest AIDLC equivalent
            case 'workitem':
            case 'work-item':
                return 'story'; // Map to closest AIDLC equivalent
            case 'intent':
                return 'intent';
            case 'standard':
                return 'standard';
            default:
                return 'bolt';
        }
    }

    /**
     * Get the currently active tab (for analytics source).
     */
    private _getActiveTab(): AnalyticsTabId {
        return this._previousTab || ('runs' as AnalyticsTabId);
    }
}

/**
 * Create a FIRE UI provider instance.
 */
export function createFireUIProvider(): FireUIProvider {
    return new FireUIProvider();
}
