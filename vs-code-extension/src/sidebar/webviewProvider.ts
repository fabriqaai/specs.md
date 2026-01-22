/**
 * WebviewViewProvider implementation for the SpecsMD sidebar.
 * Provides a tabbed interface with Bolts, Specs, and Overview views.
 *
 * ARCHITECTURE:
 * This provider uses the StateStore for centralized state management.
 * It depends on IStateReader (not concrete StateStore) for reading state.
 *
 *   File Watcher → Parser → StateStore → WebviewProvider → Webview
 *                               ↓
 *                        [Computed State]
 */

import * as vscode from 'vscode';
import { Bolt, ArtifactStatus } from '../parser/types';
import { scanMemoryBank } from '../parser/artifactParser';
import { formatRelativeTime } from '../parser/activityFeed';
import {
    getWebviewContent,
    getLitWebviewContent,
    getSpecsViewHtml,
    getOverviewViewHtml
} from '../webview';
import {
    StateStore,
    createStateStore,
    IStateReader,
    TabId as StateTabId,
    ActivityFilter as StateActivityFilter,
    SpecsFilter as StateSpecsFilter
} from '../state';
import {
    WebviewData,
    TabId,
    DEFAULT_TAB,
    TAB_STATE_KEY,
    FOCUS_EXPANDED_KEY,
    ACTIVITY_FILTER_KEY,
    ACTIVITY_HEIGHT_KEY,
    SPECS_FILTER_KEY,
    DEFAULT_ACTIVITY_FILTER,
    DEFAULT_ACTIVITY_HEIGHT,
    DEFAULT_SPECS_FILTER,
    MIN_ACTIVITY_HEIGHT,
    MAX_ACTIVITY_HEIGHT,
    WebviewToExtensionMessage,
    ActiveBoltData,
    QueuedBoltData,
    ActivityEventData,
    ActivityFilter,
    SpecsFilter,
    IntentData,
    UnitData,
    StoryData,
    NextActionData,
    CompletedBoltData,
    ArtifactFileData
} from './webviewMessaging';
import * as fs from 'fs';
import * as path from 'path';
import {
    trackTabChanged,
    trackBoltAction,
    trackArtifactOpened,
    trackFilterChanged,
    normalizeBoltType,
    normalizeBoltStatus,
    projectMetricsTracker,
} from '../analytics';
import { openFile } from '../utils';
import { FlowRegistry, FlowInfo, FlowId } from '../core';

/**
 * Flow info for webview display.
 */
interface WebviewFlowInfo {
    id: string;
    displayName: string;
    icon: string;
    rootFolder: string;
}

/**
 * WebviewViewProvider for the SpecsMD sidebar.
 * Uses StateStore for centralized state management.
 * Supports multi-flow switching via FlowRegistry.
 */
export class SpecsmdWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'specsmdExplorer';

    private _view?: vscode.WebviewView;
    private _store: StateStore;
    private _workspacePath: string | undefined;
    private _context: vscode.ExtensionContext;
    private _unsubscribe?: () => void;
    private _flowRegistry?: FlowRegistry;
    private _flowChangeUnsubscribe?: () => void;

    // Re-render loop prevention flags
    private _initialLoadComplete = false;
    private _isUpdating = false;

    // Feature flag for Lit mode (can be configured via settings later)
    private _useLitMode = true;

    constructor(context: vscode.ExtensionContext, workspacePath?: string, flowRegistry?: FlowRegistry) {
        this._context = context;
        this._workspacePath = workspacePath;
        this._flowRegistry = flowRegistry;

        // Create the state store
        this._store = createStateStore();

        // Restore saved UI state from workspaceState
        this._restoreUIState();

        // Subscribe to store changes to update the webview
        this._unsubscribe = this._store.subscribe(() => {
            this._updateWebview();
        });

        // Subscribe to flow changes
        if (this._flowRegistry) {
            this._flowChangeUnsubscribe = this._flowRegistry.onFlowChange(() => {
                // Refresh data when flow changes
                this.refresh();
            });
        }
    }

    /**
     * Restores UI state from VS Code workspace state.
     */
    private _restoreUIState(): void {
        const savedTab = this._context.workspaceState.get<TabId>(TAB_STATE_KEY);
        const savedFocusExpanded = this._context.workspaceState.get<boolean>(FOCUS_EXPANDED_KEY);
        const savedActivityFilter = this._context.workspaceState.get<ActivityFilter>(ACTIVITY_FILTER_KEY);
        const savedActivityHeight = this._context.workspaceState.get<number>(ACTIVITY_HEIGHT_KEY);
        const savedSpecsFilter = this._context.workspaceState.get<SpecsFilter>(SPECS_FILTER_KEY);

        this._store.setUIState({
            activeTab: (savedTab && ['bolts', 'specs', 'overview'].includes(savedTab))
                ? savedTab as StateTabId
                : DEFAULT_TAB as StateTabId,
            focusCardExpanded: savedFocusExpanded ?? false,
            activityFilter: (savedActivityFilter && ['all', 'stages', 'bolts'].includes(savedActivityFilter))
                ? savedActivityFilter as StateActivityFilter
                : DEFAULT_ACTIVITY_FILTER as StateActivityFilter,
            activitySectionHeight: savedActivityHeight !== undefined
                ? Math.max(MIN_ACTIVITY_HEIGHT, Math.min(MAX_ACTIVITY_HEIGHT, savedActivityHeight))
                : DEFAULT_ACTIVITY_HEIGHT,
            // specsFilter accepts any string - 'all' or any raw status from unit frontmatter
            specsFilter: savedSpecsFilter ?? DEFAULT_SPECS_FILTER
        });
    }

    /**
     * Called when the webview view is resolved.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        // Configure webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: this._useLitMode
                ? [vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview')]
                : []
        };

        // Set up message handling
        webviewView.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            undefined,
            this._context.subscriptions
        );

        // Handle visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._updateWebview();
            }
        });

        // Initial render
        if (this._useLitMode) {
            // Lit mode: Set the scaffold HTML, data sent via postMessage on 'ready'
            webviewView.webview.html = getLitWebviewContent(
                webviewView.webview,
                this._context.extensionUri
            );
        } else {
            // Legacy mode: Set full HTML immediately
            this._updateWebview();
        }
    }

    /**
     * Refreshes the view by rescanning the memory-bank.
     * Uses the active flow adapter if available.
     */
    public async refresh(): Promise<void> {
        const workspacePath = this._getWorkspacePath();

        // If we have an active flow adapter, use it
        if (this._flowRegistry) {
            const activeAdapter = this._flowRegistry.getActiveAdapter();
            if (activeAdapter) {
                await activeAdapter.refresh();
                // For now, only AI-DLC uses the StateStore directly
                // FIRE flow has its own state manager
                if (activeAdapter.flowId === 'aidlc' && workspacePath) {
                    const model = await scanMemoryBank(workspacePath);
                    this._store.loadFromModel(model, workspacePath);
                    projectMetricsTracker.onScanComplete(model);
                }
                this._updateWebview();
                return;
            }
        }

        // Fallback: use old scanMemoryBank approach
        if (workspacePath) {
            const model = await scanMemoryBank(workspacePath);
            this._store.loadFromModel(model, workspacePath);

            // Notify project metrics tracker of scan completion (debounced)
            projectMetricsTracker.onScanComplete(model);
        } else {
            // Reset store to empty state
            this._store.setEntities({
                intents: [],
                units: [],
                stories: [],
                bolts: [],
                standards: []
            });
            this._store.setWorkspace({
                name: '',
                path: '',
                memoryBankPath: '',
                isProject: false
            });
        }
        this._updateWebview();
    }

    /**
     * Gets the state store reader interface (for testing).
     */
    public getStateReader(): IStateReader {
        return this._store;
    }

    /**
     * Gets the active tab.
     */
    public getActiveTab(): TabId {
        return this._store.getState().ui.activeTab;
    }

    /**
     * Sets the active tab and updates the view.
     */
    public setActiveTab(tab: TabId): void {
        this._store.setUIState({ activeTab: tab as StateTabId });
        this._context.workspaceState.update(TAB_STATE_KEY, tab);

        if (this._useLitMode && this._view) {
            // Lit mode: Just send tab change, no full re-render needed
            this._view.webview.postMessage({
                type: 'setTab',
                activeTab: tab
            });
        } else {
            // Legacy mode: Full re-render
            this._updateWebview();
        }
    }

    /**
     * Gets the workspace path.
     */
    private _getWorkspacePath(): string | undefined {
        if (this._workspacePath) {
            return this._workspacePath;
        }
        const folders = vscode.workspace.workspaceFolders;
        return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
    }

    /**
     * Updates the webview content.
     * Protected against re-entrancy to prevent infinite render loops.
     *
     * In Lit mode, sends data via postMessage.
     * In legacy mode, replaces the entire HTML.
     */
    private _updateWebview(): void {
        if (!this._view || this._isUpdating) {
            return;
        }

        this._isUpdating = true;
        try {
            // Check active flow
            const activeFlow = this._flowRegistry?.getActiveFlow();
            const activeTab = this._store.getState().ui.activeTab;

            if (activeFlow?.id === 'fire') {
                // FIRE flow: Send FIRE-specific data
                this._sendFireDataToWebview(activeTab);
            } else {
                // AI-DLC flow (default): Use existing data flow
                const data = this._buildWebviewData();

                if (this._useLitMode) {
                    // Lit mode: Send data via postMessage
                    this._sendDataToWebview(data, activeTab);
                } else {
                    // Legacy mode: Replace entire HTML
                    this._view.webview.html = getWebviewContent(
                        this._view.webview,
                        data,
                        activeTab
                    );
                }
            }
        } finally {
            this._isUpdating = false;
        }
    }

    /**
     * Send FIRE flow specific data to webview.
     */
    private _sendFireDataToWebview(activeTab: TabId): void {
        if (!this._view || !this._flowRegistry) {
            return;
        }

        const adapter = this._flowRegistry.getActiveAdapter();
        if (!adapter || adapter.flowId !== 'fire') {
            return;
        }

        // Get FIRE state snapshot
        const fireState = adapter.stateManager.getState() as {
            project: { name: string; description?: string; created: string; fireVersion: string } | null;
            workspace: { type: string; structure: string; autonomyBias: string; runScopePreference: string } | null;
            intents: Array<{
                id: string;
                title: string;
                status: string;
                filePath: string;
                description?: string;
                workItems: Array<{
                    id: string;
                    title: string;
                    status: string;
                    mode: string;
                    complexity: string;
                    filePath: string;
                }>;
            }>;
            activeRun: {
                id: string;
                scope: string;
                workItems: Array<{ id: string; intentId: string; mode: string; status: string }>;
                currentItem: string | null;
                folderPath: string;
                startedAt: string;
                completedAt?: string;
                hasPlan: boolean;
                hasWalkthrough: boolean;
                hasTestReport: boolean;
            } | null;
            completedRuns: Array<{
                id: string;
                scope: string;
                workItems: Array<{ id: string; intentId: string; mode: string; status: string }>;
                completedAt: string;
                folderPath: string;
            }>;
            standards: Array<{ type: string; filePath: string }>;
            stats: {
                totalIntents: number;
                completedIntents: number;
                inProgressIntents: number;
                pendingIntents: number;
                totalWorkItems: number;
                completedWorkItems: number;
                inProgressWorkItems: number;
                pendingWorkItems: number;
                totalRuns: number;
                completedRuns: number;
                hasActiveRun: boolean;
            };
            ui: { activeTab: string; runsFilter: string; intentsFilter: string; expandedIntents: string[] };
        };

        // Build flow information for the switcher
        const flowData = this._buildFlowData();

        // Transform FIRE state to FireViewData format expected by webview
        const fireViewData = this._buildFireViewData(fireState);

        this._view.webview.postMessage({
            type: 'setData',
            activeTab,
            flowType: 'fire',
            fireData: fireViewData,
            boltsData: null, // FIRE doesn't use bolts
            specsHtml: '', // Not used for FIRE
            overviewHtml: '', // Not used for FIRE
            ...flowData
        });
    }

    /**
     * Build FireViewData from FIRE state snapshot.
     */
    private _buildFireViewData(state: {
        project: { name: string; description?: string; created: string; fireVersion: string } | null;
        workspace: { type: string; structure: string; autonomyBias: string; runScopePreference: string } | null;
        intents: Array<{
            id: string;
            title: string;
            status: string;
            filePath: string;
            description?: string;
            workItems: Array<{
                id: string;
                title: string;
                status: string;
                mode: string;
                complexity: string;
                filePath: string;
                dependencies?: string[];
            }>;
        }>;
        activeRun: {
            id: string;
            scope: string;
            workItems: Array<{ id: string; intentId: string; mode: string; status: string }>;
            currentItem: string | null;
            folderPath: string;
            startedAt: string;
            completedAt?: string;
            hasPlan: boolean;
            hasWalkthrough: boolean;
            hasTestReport: boolean;
        } | null;
        completedRuns: Array<{
            id: string;
            scope: string;
            workItems: Array<{ id: string; intentId: string; mode: string; status: string }>;
            completedAt: string;
            folderPath: string;
        }>;
        standards: Array<{ type: string; filePath: string }>;
        stats: {
            totalIntents: number;
            completedIntents: number;
            inProgressIntents: number;
            pendingIntents: number;
            totalWorkItems: number;
            completedWorkItems: number;
            inProgressWorkItems: number;
            pendingWorkItems: number;
            totalRuns: number;
            completedRuns: number;
            hasActiveRun: boolean;
        };
        ui: { activeTab: string; runsFilter: string; intentsFilter: string; expandedIntents: string[] };
    }) {
        // Build pending work items from all intents
        const pendingItems = state.intents.flatMap(intent =>
            intent.workItems
                .filter(w => w.status === 'pending')
                .map(w => ({
                    id: w.id,
                    intentId: intent.id,
                    intentTitle: intent.title,
                    intentFilePath: intent.filePath,
                    title: w.title,
                    status: w.status as 'pending' | 'in_progress' | 'completed' | 'blocked',
                    mode: w.mode as 'autopilot' | 'confirm' | 'validate',
                    complexity: w.complexity as 'low' | 'medium' | 'high',
                    filePath: w.filePath,
                    dependencies: w.dependencies
                }))
        );

        // Build completed runs data with files
        const completedRunsData = state.completedRuns.map(run => ({
            id: run.id,
            scope: run.scope as 'single' | 'batch' | 'wide',
            itemCount: run.workItems.length,
            completedAt: run.completedAt,
            folderPath: run.folderPath,
            files: this._scanRunFiles(run.folderPath)
        }));

        // Build active run data if exists
        const activeRunData = state.activeRun ? {
            id: state.activeRun.id,
            scope: state.activeRun.scope as 'single' | 'batch' | 'wide',
            workItems: state.activeRun.workItems.map(w => ({
                id: w.id,
                intentId: w.intentId,
                mode: w.mode as 'autopilot' | 'confirm' | 'validate',
                status: w.status as 'pending' | 'in_progress' | 'completed' | 'failed',
                title: this._findWorkItemTitle(state.intents, w.id, w.intentId)
            })),
            currentItem: state.activeRun.currentItem,
            folderPath: state.activeRun.folderPath,
            startedAt: state.activeRun.startedAt,
            completedAt: state.activeRun.completedAt,
            hasPlan: state.activeRun.hasPlan,
            hasWalkthrough: state.activeRun.hasWalkthrough,
            hasTestReport: state.activeRun.hasTestReport,
            files: this._scanRunFiles(state.activeRun.folderPath)
        } : null;

        // Build intents data
        const intentsData = state.intents.map(intent => ({
            id: intent.id,
            title: intent.title,
            status: intent.status as 'pending' | 'in_progress' | 'completed' | 'blocked',
            filePath: intent.filePath,
            description: intent.description,
            workItems: intent.workItems.map(w => ({
                id: w.id,
                title: w.title,
                status: w.status as 'pending' | 'in_progress' | 'completed' | 'blocked',
                mode: w.mode as 'autopilot' | 'confirm' | 'validate',
                complexity: w.complexity as 'low' | 'medium' | 'high',
                filePath: w.filePath
            }))
        }));

        return {
            activeTab: (state.ui.activeTab || 'runs') as 'runs' | 'intents' | 'overview',
            runsData: {
                activeRun: activeRunData,
                pendingItems,
                completedRuns: completedRunsData,
                stats: {
                    totalWorkItems: state.stats.totalWorkItems,
                    completedWorkItems: state.stats.completedWorkItems,
                    inProgressWorkItems: state.stats.inProgressWorkItems,
                    pendingWorkItems: state.stats.pendingWorkItems,
                    totalRuns: state.stats.totalRuns,
                    completedRuns: state.stats.completedRuns,
                    hasActiveRun: state.stats.hasActiveRun
                }
            },
            intentsData: {
                intents: intentsData,
                // Default to all intents expanded if none specified
                expandedIntents: state.ui.expandedIntents && state.ui.expandedIntents.length > 0
                    ? state.ui.expandedIntents
                    : intentsData.map(i => i.id),
                filter: (state.ui.intentsFilter || 'all') as 'all' | 'pending' | 'in_progress' | 'completed' | 'blocked'
            },
            overviewData: {
                project: state.project,
                workspace: state.workspace ? {
                    type: state.workspace.type as 'greenfield' | 'brownfield',
                    structure: state.workspace.structure as 'monolith' | 'monorepo' | 'multi-part',
                    autonomyBias: state.workspace.autonomyBias as 'autonomous' | 'balanced' | 'controlled',
                    runScopePreference: state.workspace.runScopePreference as 'single' | 'batch' | 'wide'
                } : null,
                standards: state.standards.map(s => ({ type: s.type, filePath: s.filePath })),
                stats: {
                    totalIntents: state.stats.totalIntents,
                    completedIntents: state.stats.completedIntents,
                    totalWorkItems: state.stats.totalWorkItems,
                    completedWorkItems: state.stats.completedWorkItems,
                    totalRuns: state.stats.totalRuns,
                    completedRuns: state.stats.completedRuns
                }
            }
        };
    }

    /**
     * Scans a run folder for markdown files.
     */
    private _scanRunFiles(folderPath: string): Array<{ name: string; path: string }> {
        const files: Array<{ name: string; path: string }> = [];

        try {
            if (!folderPath || !fs.existsSync(folderPath)) {
                return files;
            }

            const entries = fs.readdirSync(folderPath);

            for (const entry of entries) {
                if (!entry.endsWith('.md')) {
                    continue;
                }

                const filePath = path.join(folderPath, entry);
                const stat = fs.statSync(filePath);

                if (stat.isFile()) {
                    files.push({
                        name: entry,
                        path: filePath
                    });
                }
            }
        } catch {
            // Ignore errors reading directory
        }

        return files;
    }

    /**
     * Find work item title by id and intentId.
     */
    private _findWorkItemTitle(
        intents: Array<{ id: string; workItems: Array<{ id: string; title: string }> }>,
        workItemId: string,
        intentId: string
    ): string {
        const intent = intents.find(i => i.id === intentId);
        const workItem = intent?.workItems.find(w => w.id === workItemId);
        return workItem?.title || workItemId;
    }

    /**
     * Build HTML for FIRE specs view.
     */
    private _buildFireSpecsHtml(fireState: unknown): string {
        // TODO: Implement proper FIRE specs view
        return `
            <div style="padding: 16px; color: var(--vscode-foreground);">
                <h3 style="margin: 0 0 12px 0; color: var(--vscode-foreground);">🔥 FIRE Flow - Specs</h3>
                <p style="color: var(--vscode-descriptionForeground); margin: 0;">
                    FIRE (Fast Intent-Run Engineering) flow view is coming soon.
                </p>
            </div>
        `;
    }

    /**
     * Build HTML for FIRE overview view.
     */
    private _buildFireOverviewHtml(fireState: unknown): string {
        // TODO: Implement proper FIRE overview view
        return `
            <div style="padding: 16px; color: var(--vscode-foreground);">
                <h3 style="margin: 0 0 12px 0; color: var(--vscode-foreground);">🔥 FIRE Flow - Overview</h3>
                <p style="color: var(--vscode-descriptionForeground); margin: 0;">
                    FIRE flow provides a simplified AI-DLC approach with Plan → Execute phases.
                </p>
            </div>
        `;
    }

    /**
     * Sends data to the Lit webview via postMessage.
     * Bolts view uses structured data for Lit components.
     * Specs and Overview views use server-rendered HTML (hybrid approach).
     */
    private _sendDataToWebview(data: WebviewData, activeTab: TabId): void {
        if (!this._view) {
            return;
        }

        // Build structured data for Bolts view (Lit components)
        const boltsData = {
            currentIntent: data.currentIntent,
            currentIntentContext: data.currentIntentContext,
            stats: data.stats,
            activeBolts: data.activeBolts,
            upNextQueue: data.upNextQueue,
            completedBolts: data.completedBolts,
            activityEvents: data.activityEvents,
            focusCardExpanded: data.focusCardExpanded,
            activityFilter: data.activityFilter,
            activityHeight: data.activityHeight,
            specsFilter: data.specsFilter
        };

        // Generate HTML for specs/overview views (hybrid approach)
        const specsHtml = getSpecsViewHtml(data);
        const overviewHtml = getOverviewViewHtml(data);

        // Build flow information for the switcher
        const flowData = this._buildFlowData();

        // Send to webview
        this._view.webview.postMessage({
            type: 'setData',
            activeTab,
            boltsData,
            specsHtml,
            overviewHtml,
            ...flowData
        });
    }

    /**
     * Builds flow data for the webview.
     * Returns available flows and active flow ID for the flow switcher.
     */
    private _buildFlowData(): { availableFlows: WebviewFlowInfo[]; activeFlowId: string | null } {
        if (!this._flowRegistry) {
            return { availableFlows: [], activeFlowId: null };
        }

        const detectedFlows = this._flowRegistry.getDetectedFlows();
        const activeFlow = this._flowRegistry.getActiveFlow();

        const availableFlows: WebviewFlowInfo[] = detectedFlows.map(flow => ({
            id: flow.id,
            displayName: flow.displayName,
            icon: flow.icon,
            rootFolder: flow.rootFolder
        }));

        return {
            availableFlows,
            activeFlowId: activeFlow?.id || null
        };
    }

    /**
     * Builds the data structure for the webview from StateStore.
     */
    private _buildWebviewData(): WebviewData {
        const state = this._store.getState();

        if (!state.workspace.isProject) {
            return {
                currentIntent: null,
                currentIntentContext: 'none',
                stats: { active: 0, queued: 0, done: 0, blocked: 0 },
                activeBolts: [],
                upNextQueue: [],
                completedBolts: [],
                activityEvents: [],
                intents: [],
                standards: [],
                nextActions: [],
                focusCardExpanded: state.ui.focusCardExpanded,
                activityFilter: state.ui.activityFilter,
                activityHeight: state.ui.activitySectionHeight,
                specsFilter: state.ui.specsFilter,
                availableStatuses: []
            };
        }

        // Get computed values from state
        const { currentIntent, currentIntentContext, activeBolts, pendingBolts, completedBolts, activityFeed, boltStats, nextActions } = state.computed;

        // Transform current intent
        const currentIntentData = currentIntent
            ? { name: currentIntent.name, number: currentIntent.number }
            : null;

        // Transform active bolts (supports multiple)
        const activeBoltsData = activeBolts.map(bolt => this._transformActiveBolt(bolt));

        // Transform pending bolts to queue (send all, filtering done client-side)
        const upNextQueue = pendingBolts.map(bolt => this._transformQueuedBolt(bolt));

        // Transform completed bolts (last 10, sorted by completion time)
        const now = new Date();
        const completedBoltsData = completedBolts
            .filter(b => b.completedAt)
            .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
            .slice(0, 10)
            .map(bolt => this._transformCompletedBolt(bolt, now));

        // Transform activity events
        const activityEvents: ActivityEventData[] = activityFeed.slice(0, 10).map(event => {
            // Look up bolt path from store
            const bolt = state.bolts.get(event.targetId);
            return {
                id: event.id,
                type: event.type,
                text: event.text,
                target: event.targetName,
                tag: event.tag,
                relativeTime: formatRelativeTime(event.timestamp, now),
                exactTime: this._formatExactTime(event.timestamp),
                path: bolt?.filePath
            };
        });

        // Build intents data for specs view (includes available statuses)
        const { intents, availableStatuses } = this._buildIntentsData();

        // Build standards data
        const standards = Array.from(state.standards.values()).map(s => ({
            name: s.name,
            path: s.path
        }));

        // Transform next actions
        const nextActionsData: NextActionData[] = nextActions.slice(0, 5).map(action => ({
            type: action.type,
            priority: action.priority,
            title: action.title,
            description: action.description,
            targetId: action.targetId,
            targetName: action.targetName
        }));

        return {
            currentIntent: currentIntentData,
            currentIntentContext,
            stats: boltStats,
            activeBolts: activeBoltsData,
            upNextQueue,
            completedBolts: completedBoltsData,
            activityEvents,
            intents,
            standards,
            nextActions: nextActionsData,
            focusCardExpanded: state.ui.focusCardExpanded,
            activityFilter: state.ui.activityFilter,
            activityHeight: state.ui.activitySectionHeight,
            specsFilter: state.ui.specsFilter,
            availableStatuses
        };
    }

    /**
     * Transforms a Bolt to ActiveBoltData.
     */
    private _transformActiveBolt(bolt: Bolt): ActiveBoltData {
        const state = this._store.getState();
        const stagesComplete = bolt.stages.filter(s => s.status === ArtifactStatus.Complete).length;
        const files = this._scanBoltArtifactFiles(bolt.path);

        return {
            id: bolt.id,
            name: bolt.id,
            type: this._formatBoltType(bolt.type),
            currentStage: bolt.currentStage,
            stagesComplete,
            stagesTotal: bolt.stages.length,
            storiesComplete: 0, // Would need story status tracking
            storiesTotal: bolt.stories.length,
            stages: bolt.stages.map(s => ({
                name: s.name,
                status: this._mapStatus(s.status)
            })),
            stories: bolt.stories.map(storyRef => {
                // Construct the story file path directly from bolt's intent/unit
                // Path format: {workspace}/memory-bank/intents/{intent}/units/{unit}/stories/{storyRef}.md
                let storyPath: string | undefined;
                if (bolt.intent && bolt.unit && state.workspace.path) {
                    const storyFileName = storyRef.endsWith('.md') ? storyRef : `${storyRef}.md`;
                    storyPath = path.join(
                        state.workspace.path,
                        'memory-bank',
                        'intents',
                        bolt.intent,
                        'units',
                        bolt.unit,
                        'stories',
                        storyFileName
                    );
                }

                return {
                    id: storyRef,
                    name: storyRef,
                    status: 'pending' as const,
                    path: storyPath
                };
            }),
            path: bolt.path,
            files
        };
    }

    /**
     * Transforms a Bolt to CompletedBoltData.
     */
    private _transformCompletedBolt(bolt: Bolt, now: Date): CompletedBoltData {
        const files = this._scanBoltArtifactFiles(bolt.path);
        return {
            id: bolt.id,
            name: bolt.id,
            type: this._formatBoltType(bolt.type),
            completedAt: bolt.completedAt?.toISOString() ?? '',
            relativeTime: bolt.completedAt ? formatRelativeTime(bolt.completedAt, now) : 'unknown',
            path: bolt.path,
            files,
            constructionLogPath: bolt.constructionLogPath
        };
    }

    /**
     * Scans a bolt directory for artifact files.
     */
    private _scanBoltArtifactFiles(boltPath: string): ArtifactFileData[] {
        const files: ArtifactFileData[] = [];

        try {
            if (!fs.existsSync(boltPath)) {
                return files;
            }

            const entries = fs.readdirSync(boltPath);

            for (const entry of entries) {
                // Skip bolt.md itself and non-markdown files
                if (entry === 'bolt.md' || !entry.endsWith('.md')) {
                    continue;
                }

                const filePath = path.join(boltPath, entry);
                const stat = fs.statSync(filePath);

                if (stat.isFile()) {
                    const type = this._classifyArtifactFile(entry);
                    files.push({
                        name: entry,
                        path: filePath,
                        type
                    });
                }
            }
        } catch {
            // Ignore errors reading directory
        }

        return files;
    }

    /**
     * Classifies an artifact file by its name.
     */
    private _classifyArtifactFile(filename: string): ArtifactFileData['type'] {
        const lower = filename.toLowerCase();
        if (lower.includes('walkthrough') && lower.includes('test')) {
            return 'test-report';
        }
        if (lower.includes('walkthrough')) {
            return 'walkthrough';
        }
        if (lower.includes('test') || lower.includes('report')) {
            return 'test-report';
        }
        if (lower.includes('plan')) {
            return 'plan';
        }
        if (lower.includes('design') || lower.includes('adr')) {
            return 'design';
        }
        return 'other';
    }

    /**
     * Transforms a Bolt to QueuedBoltData.
     */
    private _transformQueuedBolt(bolt: Bolt): QueuedBoltData {
        const state = this._store.getState();

        return {
            id: bolt.id,
            name: bolt.id,
            type: this._formatBoltType(bolt.type),
            storiesCount: bolt.stories.length,
            isBlocked: bolt.isBlocked,
            blockedBy: bolt.blockedBy,
            unblocksCount: bolt.unblocksCount,
            stages: bolt.stages.map(s => ({
                name: s.name,
                status: this._mapStatus(s.status)
            })),
            stories: bolt.stories.map(storyRef => {
                // Construct the story file path from bolt's intent/unit
                // Path format: {workspace}/memory-bank/intents/{intent}/units/{unit}/stories/{storyRef}.md
                let storyPath: string | undefined;
                if (bolt.intent && bolt.unit && state.workspace.path) {
                    const storyFileName = storyRef.endsWith('.md') ? storyRef : `${storyRef}.md`;
                    storyPath = path.join(
                        state.workspace.path,
                        'memory-bank',
                        'intents',
                        bolt.intent,
                        'units',
                        bolt.unit,
                        'stories',
                        storyFileName
                    );
                }

                return {
                    id: storyRef,
                    name: storyRef,
                    status: 'pending' as const,
                    path: storyPath
                };
            })
        };
    }

    /**
     * Formats a timestamp for tooltip display.
     */
    private _formatExactTime(date: Date): string {
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Builds intents data for specs view from StateStore.
     * Applies the current specs filter from UI state.
     * Filter is based on UNIT raw statuses - if any unit within an intent matches the filter,
     * the entire intent (with all units) is shown.
     * Also discovers and returns all unique unit raw statuses for the filter dropdown.
     */
    private _buildIntentsData(): { intents: IntentData[]; availableStatuses: string[] } {
        const state = this._store.getState();
        const allIntents = Array.from(state.intents.values());
        const specsFilter = state.ui.specsFilter;

        // Collect all unique raw unit statuses from frontmatter
        const statusSet = new Set<string>();

        // First, transform all intents to get their calculated story counts
        const allIntentData = allIntents.map(intent => {
            const units: UnitData[] = (intent.units || []).map(unit => {
                const stories: StoryData[] = (unit.stories || []).map(story => ({
                    id: story.id,
                    title: story.title,
                    path: story.path,
                    status: this._getStatusString(story.status)
                }));

                const storiesComplete = stories.filter(s => s.status === 'complete').length;

                // Use raw status from frontmatter for filtering/display
                // Fall back to normalized status string if no raw status
                const unitStatus = unit.rawStatus || this._getStatusString(unit.status);
                if (unitStatus) {
                    statusSet.add(unitStatus);
                }

                return {
                    name: unit.name,
                    path: unit.path,
                    status: unitStatus,
                    storiesComplete,
                    storiesTotal: stories.length,
                    stories
                };
            });

            const storiesComplete = units.reduce((sum, u) => sum + u.storiesComplete, 0);
            const storiesTotal = units.reduce((sum, u) => sum + u.storiesTotal, 0);

            return {
                name: intent.name,
                number: intent.number,
                path: intent.path,
                storiesComplete,
                storiesTotal,
                units
            };
        });

        // Apply specs filter based on UNIT raw statuses
        // If any unit within an intent matches the filter, show that intent with ALL its units
        const filteredIntents = specsFilter === 'all' ? allIntentData : allIntentData.filter(intent => {
            // Check if ANY unit matches the filter status
            return intent.units.some(unit => unit.status === specsFilter);
        });

        // Convert status set to sorted array
        const availableStatuses = Array.from(statusSet).sort();

        return { intents: filteredIntents, availableStatuses };
    }

    /**
     * Gets a display-friendly status string from ArtifactStatus.
     */
    private _getStatusString(status: ArtifactStatus): string {
        switch (status) {
            case ArtifactStatus.Complete:
                return 'complete';
            case ArtifactStatus.InProgress:
                return 'in-progress';
            case ArtifactStatus.Draft:
                return 'draft';
            case ArtifactStatus.Blocked:
                return 'blocked';
            default:
                return 'unknown';
        }
    }

    /**
     * Maps ArtifactStatus to webview status.
     */
    private _mapStatus(status: ArtifactStatus): 'complete' | 'active' | 'pending' {
        switch (status) {
            case ArtifactStatus.Complete:
                return 'complete';
            case ArtifactStatus.InProgress:
                return 'active';
            default:
                return 'pending';
        }
    }

    /**
     * Formats bolt type for display.
     */
    private _formatBoltType(type: string): string {
        switch (type) {
            case 'ddd-construction-bolt':
                return 'DDD';
            case 'simple-construction-bolt':
                return 'Simple';
            case 'spike-bolt':
                return 'Spike';
            default:
                return type;
        }
    }

    /**
     * Handles messages from the webview.
     */
    private async _handleMessage(message: WebviewToExtensionMessage): Promise<void> {
        switch (message.type) {
            case 'ready':
                // Webview is ready, trigger initial data load
                // Guard against re-processing to prevent infinite render loop
                if (!this._initialLoadComplete) {
                    this._initialLoadComplete = true;
                    if (this._useLitMode) {
                        // Lit mode: First refresh data, then send via postMessage
                        await this.refresh();
                        this._sendDataToWebview(
                            this._buildWebviewData(),
                            this._store.getState().ui.activeTab
                        );
                    } else {
                        // Legacy mode: Refresh will update HTML
                        await this.refresh();
                    }
                }
                break;

            case 'tabChange': {
                const previousTab = this._store.getState().ui.activeTab;
                this.setActiveTab(message.tab);
                // Track tab navigation (only on explicit user navigation)
                trackTabChanged(previousTab, message.tab);
                break;
            }

            case 'refresh':
                await this.refresh();
                break;

            case 'openArtifact':
                // Track artifact opened before opening
                trackArtifactOpened(
                    message.kind as 'bolt' | 'unit' | 'story' | 'intent' | 'standard',
                    this._store.getState().ui.activeTab
                );
                await this._openArtifact(message.kind, message.path);
                break;

            case 'toggleFocus':
                this._store.setUIState({ focusCardExpanded: message.expanded });
                this._context.workspaceState.update(FOCUS_EXPANDED_KEY, message.expanded);
                // No need to re-render, state is tracked client-side
                break;

            case 'activityFilter':
                // Track filter change
                trackFilterChanged('activity', message.filter);
                this._store.setUIState({ activityFilter: message.filter as StateActivityFilter });
                this._context.workspaceState.update(ACTIVITY_FILTER_KEY, message.filter);
                // No need to re-render, filtering is done client-side
                break;

            case 'specsFilter':
                // Track filter change
                trackFilterChanged('specs', message.filter);
                this._store.setUIState({ specsFilter: message.filter as StateSpecsFilter });
                this._context.workspaceState.update(SPECS_FILTER_KEY, message.filter);
                // Re-render to apply the filter server-side
                this._updateWebview();
                break;

            case 'activityResize': {
                const height = Math.max(MIN_ACTIVITY_HEIGHT, Math.min(MAX_ACTIVITY_HEIGHT, message.height));
                this._store.setUIState({ activitySectionHeight: height });
                this._context.workspaceState.update(ACTIVITY_HEIGHT_KEY, height);
                // No need to re-render, resize is done client-side
                break;
            }

            case 'startBolt': {
                // Track bolt action with normalized type and status
                const startBolt = this._store.getState().bolts.get(message.boltId);
                trackBoltAction(
                    'start',
                    normalizeBoltType(startBolt?.type),
                    'queued'
                );
                await this._showStartBoltCommand(message.boltId);
                break;
            }

            case 'continueBolt': {
                // Track bolt action with normalized type and status
                const continueBolt = this._store.getState().bolts.get(message.boltId);
                trackBoltAction(
                    'continue',
                    normalizeBoltType(continueBolt?.type),
                    'active'
                );
                await this._showContinueBoltCommand(message.boltId, message.boltName);
                break;
            }

            case 'viewBoltFiles': {
                // Track bolt action with normalized type and status
                const viewBolt = this._store.getState().bolts.get(message.boltId);
                trackBoltAction(
                    'view_files',
                    normalizeBoltType(viewBolt?.type),
                    normalizeBoltStatus(viewBolt?.status)
                );
                await this._openBoltFile(message.boltId);
                break;
            }

            case 'openBoltMd': {
                // Track bolt action with normalized type and status
                const openBolt = this._store.getState().bolts.get(message.boltId);
                trackBoltAction(
                    'open_md',
                    normalizeBoltType(openBolt?.type),
                    normalizeBoltStatus(openBolt?.status)
                );
                await this._openBoltFile(message.boltId);
                break;
            }

            case 'openExternal':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;

            case 'switchFlow':
                await this._handleFlowSwitch(message.flowId);
                break;
        }
    }

    /**
     * Handles flow switch request from webview.
     * If flowId is provided, switches directly. Otherwise shows quick pick.
     */
    private async _handleFlowSwitch(flowId?: string): Promise<void> {
        if (!this._flowRegistry) {
            vscode.window.showWarningMessage('Flow switching is not available.');
            return;
        }

        // If no flowId provided, trigger the VS Code command to show quick pick
        if (!flowId) {
            await vscode.commands.executeCommand('specsmd.switchFlow');
            return;
        }

        try {
            await this._flowRegistry.switchFlow(flowId as FlowId);

            // Refresh to load new flow's data
            await this.refresh();

            // Send updated flow info to webview
            if (this._view) {
                const flowData = this._buildFlowData();
                this._view.webview.postMessage({
                    type: 'switchFlow',
                    ...flowData,
                    boltsData: this._buildWebviewData().activeBolts.length > 0 ? {
                        currentIntent: this._buildWebviewData().currentIntent,
                        currentIntentContext: this._buildWebviewData().currentIntentContext,
                        stats: this._buildWebviewData().stats,
                        activeBolts: this._buildWebviewData().activeBolts,
                        upNextQueue: this._buildWebviewData().upNextQueue,
                        completedBolts: this._buildWebviewData().completedBolts,
                        activityEvents: this._buildWebviewData().activityEvents,
                        focusCardExpanded: this._buildWebviewData().focusCardExpanded,
                        activityFilter: this._buildWebviewData().activityFilter,
                        activityHeight: this._buildWebviewData().activityHeight,
                        specsFilter: this._buildWebviewData().specsFilter
                    } : null,
                    specsHtml: getSpecsViewHtml(this._buildWebviewData()),
                    overviewHtml: getOverviewViewHtml(this._buildWebviewData())
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to switch flow: ${error}`);
        }
    }

    /**
     * Opens an artifact file.
     * Uses the user's markdown editor preference for .md files.
     */
    private async _openArtifact(kind: string, filePath: string): Promise<void> {
        try {
            await openFile(filePath);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open ${kind}: ${filePath}`);
        }
    }

    /**
     * Shows a popup with the command to start a bolt.
     */
    private async _showStartBoltCommand(boltId: string): Promise<void> {
        const command = `/specsmd-construction-agent --bolt-id="${boltId}"`;

        const result = await vscode.window.showInformationMessage(
            `Run this command to start the bolt:\n\n${command}`,
            { modal: true },
            'Copy to Clipboard'
        );

        if (result === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(command);
            vscode.window.showInformationMessage('Command copied to clipboard!');
        }
    }

    /**
     * Shows a popup with the command to continue working on a bolt.
     */
    private async _showContinueBoltCommand(boltId: string, boltName?: string): Promise<void> {
        const displayName = boltName || boltId;
        const command = `/specsmd-construction-agent --bolt-id="${boltId}"`;

        const result = await vscode.window.showInformationMessage(
            `Continue working on "${displayName}":\n\nIf you're not already running this bolt in your AI agent, run this command:\n\n${command}`,
            { modal: true },
            'Copy to Clipboard'
        );

        if (result === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(command);
            vscode.window.showInformationMessage('Command copied to clipboard!');
        }
    }

    /**
     * Opens the bolt file in the editor.
     * Uses the user's markdown editor preference.
     */
    private async _openBoltFile(boltId: string): Promise<void> {
        const state = this._store.getState();
        const bolt = state.bolts.get(boltId);

        if (bolt?.filePath) {
            try {
                await openFile(bolt.filePath);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open bolt file: ${bolt.filePath}`);
            }
        } else {
            vscode.window.showWarningMessage(`Bolt file not found: ${boltId}`);
        }
    }

    /**
     * Disposes resources.
     */
    public dispose(): void {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        if (this._flowChangeUnsubscribe) {
            this._flowChangeUnsubscribe();
        }
        this._store.dispose();
    }
}

/**
 * Creates and registers a SpecsmdWebviewProvider.
 */
export function createWebviewProvider(
    context: vscode.ExtensionContext,
    workspacePath?: string,
    flowRegistry?: FlowRegistry
): SpecsmdWebviewProvider {
    const provider = new SpecsmdWebviewProvider(context, workspacePath, flowRegistry);

    // Register the webview view provider
    const registration = vscode.window.registerWebviewViewProvider(
        SpecsmdWebviewProvider.viewType,
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    context.subscriptions.push(registration);

    return provider;
}
