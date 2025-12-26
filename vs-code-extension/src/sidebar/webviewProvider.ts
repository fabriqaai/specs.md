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
import { getWebviewContent } from '../webview';
import {
    StateStore,
    createStateStore,
    IStateReader,
    TabId as StateTabId,
    ActivityFilter as StateActivityFilter
} from '../state';
import {
    WebviewData,
    TabId,
    DEFAULT_TAB,
    TAB_STATE_KEY,
    FOCUS_EXPANDED_KEY,
    ACTIVITY_FILTER_KEY,
    ACTIVITY_HEIGHT_KEY,
    DEFAULT_ACTIVITY_FILTER,
    DEFAULT_ACTIVITY_HEIGHT,
    MIN_ACTIVITY_HEIGHT,
    MAX_ACTIVITY_HEIGHT,
    WebviewToExtensionMessage,
    ActiveBoltData,
    QueuedBoltData,
    ActivityEventData,
    ActivityFilter,
    IntentData,
    UnitData,
    StoryData,
    NextActionData
} from './webviewMessaging';

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
                : DEFAULT_ACTIVITY_HEIGHT
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
            localResourceRoots: []
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
        this._updateWebview();
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
        this._updateWebview();
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
     */
    private _updateWebview(): void {
        if (!this._view) {
            return;
        }

        const data = this._buildWebviewData();
        this._view.webview.html = getWebviewContent(
            this._view.webview,
            data,
            this._store.getState().ui.activeTab
        );
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
                activeBolt: null,
                upNextQueue: [],
                activityEvents: [],
                intents: [],
                standards: [],
                nextActions: [],
                focusCardExpanded: state.ui.focusCardExpanded,
                activityFilter: state.ui.activityFilter,
                activityHeight: state.ui.activitySectionHeight
            };
        }

        // Get computed values from state
        const { currentIntent, activeBolt, pendingBolts, activityFeed, boltStats, nextActions } = state.computed;

        // Transform current intent
        const currentIntentData = currentIntent
            ? { name: currentIntent.name, number: currentIntent.number }
            : null;

        // Transform active bolt
        const activeBoltData = activeBolt
            ? this._transformActiveBolt(activeBolt)
            : null;

        // Transform pending bolts to queue
        const upNextQueue = pendingBolts.slice(0, 5).map(bolt => this._transformQueuedBolt(bolt));

        // Transform activity events
        const now = new Date();
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
                path: bolt?.path
            };
        });

        // Build intents data for specs view
        const intents = this._buildIntentsData();

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
            activeBolt: activeBoltData,
            upNextQueue,
            activityEvents,
            intents,
            standards,
            nextActions: nextActionsData,
            focusCardExpanded: state.ui.focusCardExpanded,
            activityFilter: state.ui.activityFilter,
            activityHeight: state.ui.activitySectionHeight
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
     */
    private _buildIntentsData(): IntentData[] {
        const state = this._store.getState();
        const intents = Array.from(state.intents.values());

        return intents.map(intent => {
            const units: UnitData[] = intent.units.map(unit => {
                const stories: StoryData[] = unit.stories.map(story => ({
                    id: story.id,
                    title: story.title,
                    path: story.path,
                    status: this._mapStatus(story.status)
                }));

                const storiesComplete = stories.filter(s => s.status === 'complete').length;

                return {
                    name: unit.name,
                    path: unit.path,
                    status: this._mapStatus(unit.status),
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
                await this.refresh();
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
