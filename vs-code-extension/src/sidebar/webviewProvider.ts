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

/**
 * WebviewViewProvider for the SpecsMD sidebar.
 * Uses StateStore for centralized state management.
 */
export class SpecsmdWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'specsmdExplorer';

    private _view?: vscode.WebviewView;
    private _store: StateStore;
    private _workspacePath: string | undefined;
    private _context: vscode.ExtensionContext;
    private _unsubscribe?: () => void;

    // Re-render loop prevention flags
    private _initialLoadComplete = false;
    private _isUpdating = false;

    // Feature flag for Lit mode (can be configured via settings later)
    private _useLitMode = true;

    constructor(context: vscode.ExtensionContext, workspacePath?: string) {
        this._context = context;
        this._workspacePath = workspacePath;

        // Create the state store
        this._store = createStateStore();

        // Restore saved UI state from workspaceState
        this._restoreUIState();

        // Subscribe to store changes to update the webview
        this._unsubscribe = this._store.subscribe(() => {
            this._updateWebview();
        });
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
     */
    public async refresh(): Promise<void> {
        const workspacePath = this._getWorkspacePath();
        if (workspacePath) {
            const model = await scanMemoryBank(workspacePath);
            this._store.loadFromModel(model, workspacePath);
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
            const data = this._buildWebviewData();
            const activeTab = this._store.getState().ui.activeTab;

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
        } finally {
            this._isUpdating = false;
        }
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

        // Send to webview
        this._view.webview.postMessage({
            type: 'setData',
            activeTab,
            boltsData,
            specsHtml,
            overviewHtml
        });
    }

    /**
     * Builds the data structure for the webview from StateStore.
     */
    private _buildWebviewData(): WebviewData {
        const state = this._store.getState();

        if (!state.workspace.isProject) {
            return {
                currentIntent: null,
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
        const { currentIntent, activeBolts, pendingBolts, completedBolts, activityFeed, boltStats, nextActions } = state.computed;

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
        const stagesComplete = bolt.stages.filter(s => s.status === ArtifactStatus.Complete).length;

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
            stories: bolt.stories.map(id => ({
                id,
                name: id,
                status: 'pending' as const // Would need story status lookup
            }))
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
            files
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
            stories: bolt.stories.map(id => ({
                id,
                name: id,
                status: 'pending' as const
            }))
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

            case 'tabChange':
                this.setActiveTab(message.tab);
                break;

            case 'refresh':
                await this.refresh();
                break;

            case 'openArtifact':
                await this._openArtifact(message.kind, message.path);
                break;

            case 'toggleFocus':
                this._store.setUIState({ focusCardExpanded: message.expanded });
                this._context.workspaceState.update(FOCUS_EXPANDED_KEY, message.expanded);
                // No need to re-render, state is tracked client-side
                break;

            case 'activityFilter':
                this._store.setUIState({ activityFilter: message.filter as StateActivityFilter });
                this._context.workspaceState.update(ACTIVITY_FILTER_KEY, message.filter);
                // No need to re-render, filtering is done client-side
                break;

            case 'specsFilter':
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

            case 'startBolt':
                await this._showStartBoltCommand(message.boltId);
                break;

            case 'continueBolt':
                await this._showContinueBoltCommand(message.boltId, message.boltName);
                break;

            case 'viewBoltFiles':
                await this._openBoltFile(message.boltId);
                break;

            case 'openBoltMd':
                await this._openBoltFile(message.boltId);
                break;

            case 'openExternal':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
        }
    }

    /**
     * Opens an artifact file.
     */
    private async _openArtifact(kind: string, path: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(path);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open ${kind}: ${path}`);
        }
    }

    /**
     * Shows a popup with the command to start a bolt.
     */
    private async _showStartBoltCommand(boltId: string): Promise<void> {
        const command = `/specsmd-construction-agent --bolt-id="${boltId}"`;

        const result = await vscode.window.showInformationMessage(
            `Run this command in Claude Code to start the bolt:\n\n${command}`,
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
            `Continue working on "${displayName}":\n\nRun this command in Claude Code:\n\n${command}`,
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
     */
    private async _openBoltFile(boltId: string): Promise<void> {
        const state = this._store.getState();
        const bolt = state.bolts.get(boltId);

        if (bolt?.filePath) {
            try {
                const uri = vscode.Uri.file(bolt.filePath);
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc);
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
        this._store.dispose();
    }
}

/**
 * Creates and registers a SpecsmdWebviewProvider.
 */
export function createWebviewProvider(
    context: vscode.ExtensionContext,
    workspacePath?: string
): SpecsmdWebviewProvider {
    const provider = new SpecsmdWebviewProvider(context, workspacePath);

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
