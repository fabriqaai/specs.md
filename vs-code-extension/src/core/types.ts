/**
 * Core types for multi-flow support in specsmd VS Code extension.
 *
 * This module defines the interfaces that all flow adapters must implement.
 * Each flow (AIDLC, FIRE, Simple) provides its own implementation.
 *
 * Architecture:
 *   FlowRegistry → FlowAdapter → { Detector, Parser, StateManager, UIProvider }
 *
 * See: MULTI_FLOW_ARCHITECTURE.md for full documentation.
 */

import * as vscode from 'vscode';

// ============================================================================
// Flow Identification
// ============================================================================

/**
 * Unique identifier for each supported flow type.
 */
export type FlowId = 'aidlc' | 'fire' | 'simple';

/**
 * Information about a detected flow in the workspace.
 */
export interface FlowInfo {
    /** Unique flow identifier */
    id: FlowId;
    /** Human-readable display name */
    displayName: string;
    /** Icon (emoji or codicon) for UI display */
    icon: string;
    /** Root folder name where flow artifacts are stored */
    rootFolder: string;
    /** Flow version if detectable (e.g., from state.yaml for FIRE) */
    version?: string;
    /** Full path to the flow's root folder */
    flowPath?: string;
}

// ============================================================================
// Flow Detection
// ============================================================================

/**
 * Result of flow detection.
 */
export interface FlowDetectionResult {
    /** Whether this flow was detected in the workspace */
    detected: boolean;
    /** Full path to the flow's root folder if detected */
    flowPath: string | null;
    /** Flow version if detectable */
    version?: string;
}

/**
 * Interface for flow detection.
 * Each flow implements this to detect its presence in a workspace.
 */
export interface FlowDetector {
    /** Flow identifier this detector is for */
    readonly flowId: FlowId;
    /** Display name for UI */
    readonly displayName: string;
    /** Root folder to look for (e.g., 'memory-bank', '.specs-fire', 'specs') */
    readonly rootFolder: string;
    /** Icon for this flow */
    readonly icon: string;

    /**
     * Detect if this flow exists in the given workspace.
     * @param workspacePath - Root path of the workspace
     */
    detect(workspacePath: string): Promise<FlowDetectionResult>;

    /**
     * Synchronous version of detect for use in activation.
     * @param workspacePath - Root path of the workspace
     */
    detectSync(workspacePath: string): FlowDetectionResult;
}

// ============================================================================
// Flow Parser
// ============================================================================

/**
 * Result of parsing a single artifact.
 */
export interface ArtifactParseResult {
    /** Type of artifact (flow-specific, e.g., 'bolt', 'run', 'intent') */
    type: string;
    /** Parsed data */
    data: unknown;
    /** Path to the artifact file */
    path: string;
}

/**
 * Interface for parsing flow artifacts.
 * Each flow implements this with its specific artifact structure.
 */
export interface FlowParser<TArtifacts = unknown> {
    /**
     * Scan and parse all artifacts from the flow's root folder.
     * @param rootPath - Path to the flow's root folder
     */
    scanArtifacts(rootPath: string): Promise<TArtifacts>;

    /**
     * Get glob patterns to watch for changes.
     * @returns Array of glob patterns relative to flow root
     */
    watchPatterns(): string[];

    /**
     * Parse a single artifact file.
     * @param filePath - Path to the file to parse
     */
    parseArtifact(filePath: string): Promise<ArtifactParseResult | null>;
}

// ============================================================================
// Flow State Management
// ============================================================================

/**
 * Listener function for state changes.
 */
export type FlowStateListener<T> = (state: T) => void;

/**
 * Computed data that all flows must provide for common UI elements.
 */
export interface FlowComputedData {
    /** Current context name (e.g., active intent name) */
    currentContext: string | null;
    /** Overall progress percentage (0-100) */
    progressPercent: number;
    /** Item counts for summary display */
    itemCounts: {
        total: number;
        completed: number;
        inProgress: number;
        pending: number;
    };
}

/**
 * Interface for flow state management.
 * Each flow implements this with its specific state structure.
 */
export interface FlowStateManager<TState = unknown> {
    /**
     * Get the current state.
     */
    getState(): TState;

    /**
     * Load state from parsed artifacts.
     * @param artifacts - Parsed artifact data from the parser
     */
    loadFromArtifacts(artifacts: unknown): void;

    /**
     * Subscribe to state changes.
     * @param listener - Callback function for state changes
     * @returns Unsubscribe function
     */
    subscribe(listener: FlowStateListener<TState>): () => void;

    /**
     * Get computed data for common UI elements.
     */
    getComputedData(): FlowComputedData;

    /**
     * Persist UI state (e.g., expanded sections, active tab).
     * @param key - State key
     * @param value - State value
     */
    persistUIState(key: string, value: unknown): void;

    /**
     * Get persisted UI state.
     * @param key - State key
     * @param defaultValue - Default value if key doesn't exist
     */
    getUIState<V>(key: string, defaultValue: V): V;

    /**
     * Dispose resources.
     */
    dispose(): void;
}

// ============================================================================
// Flow UI Provider
// ============================================================================

/**
 * Definition of a tab in the sidebar.
 */
export interface TabDefinition {
    /** Unique tab identifier */
    id: string;
    /** Display label */
    label: string;
    /** Optional icon (codicon name without 'codicon-' prefix) */
    icon?: string;
}

/**
 * Data sent to webview for rendering.
 */
export interface WebviewData {
    /** Flow identifier */
    flowId: FlowId;
    /** Flow display name */
    flowDisplayName: string;
    /** Currently active tab */
    activeTab: string;
    /** Current context (e.g., active intent name) */
    currentContext: string | null;
    /** Tab-specific data keyed by tab ID */
    tabData: Record<string, unknown>;
    /** Available flows for switcher */
    availableFlows: FlowInfo[];
}

/**
 * Message from webview to extension.
 */
export interface WebviewMessage {
    /** Message type */
    type: string;
    /** Additional message data */
    [key: string]: unknown;
}

/**
 * Interface for flow UI rendering.
 * Each flow implements this to provide its visualization.
 */
export interface FlowUIProvider {
    /** Tab definitions for this flow */
    readonly tabs: TabDefinition[];

    /**
     * Get the HTML scaffold for the webview.
     * This includes flow-specific scripts and styles.
     * @param webview - VS Code webview instance
     * @param extensionUri - Extension URI for resource loading
     */
    getScaffoldHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string;

    /**
     * Get data for webview rendering.
     * @param state - Current flow state
     * @param activeTab - Currently active tab
     * @param availableFlows - All detected flows for switcher
     */
    getWebviewData(state: unknown, activeTab: string, availableFlows: FlowInfo[]): WebviewData;

    /**
     * Handle a message from the webview.
     * @param message - Message from webview
     * @returns Promise that resolves when message is handled
     */
    handleMessage(message: WebviewMessage): Promise<void>;
}

// ============================================================================
// Flow Adapter (Main Integration Point)
// ============================================================================

/**
 * Main interface for a flow implementation.
 * Each flow (AIDLC, FIRE, Simple) provides an adapter implementing this interface.
 *
 * The adapter bundles together:
 * - Detection logic
 * - Artifact parsing
 * - State management
 * - UI rendering
 */
export interface FlowAdapter<TState = unknown, TArtifacts = unknown> {
    /** Flow identifier */
    readonly flowId: FlowId;
    /** Flow detector */
    readonly detector: FlowDetector;
    /** Artifact parser */
    readonly parser: FlowParser<TArtifacts>;
    /** State manager */
    readonly stateManager: FlowStateManager<TState>;
    /** UI provider */
    readonly uiProvider: FlowUIProvider;

    /**
     * Initialize the adapter with VS Code context.
     * Called once when the extension activates.
     * @param context - VS Code extension context
     */
    initialize(context: vscode.ExtensionContext): Promise<void>;

    /**
     * Activate this flow for the given path.
     * Called when this flow becomes the active flow.
     * @param flowPath - Path to the flow's root folder
     */
    activate(flowPath: string): Promise<void>;

    /**
     * Deactivate this flow.
     * Called when switching to a different flow.
     */
    deactivate(): void;

    /**
     * Refresh the flow's data.
     * Called when files change or user requests refresh.
     */
    refresh(): Promise<void>;

    /**
     * Dispose all resources.
     * Called when the extension deactivates.
     */
    dispose(): void;
}

// ============================================================================
// Flow Registry Types
// ============================================================================

/**
 * Event emitted when the active flow changes.
 */
export interface FlowChangeEvent {
    /** Previously active flow (null if none) */
    previousFlow: FlowInfo | null;
    /** Newly active flow */
    currentFlow: FlowInfo;
}

/**
 * Listener for flow change events.
 */
export type FlowChangeListener = (event: FlowChangeEvent) => void;

/**
 * Interface for the flow registry.
 */
export interface IFlowRegistry {
    /**
     * Register a flow adapter.
     * @param adapter - Flow adapter to register
     */
    register(adapter: FlowAdapter): void;

    /**
     * Detect all flows in the workspace.
     * @param workspacePath - Root path of the workspace
     * @returns Array of detected flows
     */
    detectFlows(workspacePath: string): Promise<FlowInfo[]>;

    /**
     * Activate a specific flow.
     * @param flowId - Flow to activate
     * @param flowPath - Path to the flow's root folder
     */
    activateFlow(flowId: FlowId, flowPath: string): Promise<void>;

    /**
     * Get the currently active adapter.
     */
    getActiveAdapter(): FlowAdapter | null;

    /**
     * Get the currently active flow info.
     */
    getActiveFlow(): FlowInfo | null;

    /**
     * Get all detected flows.
     */
    getDetectedFlows(): FlowInfo[];

    /**
     * Subscribe to flow change events.
     * @param listener - Callback for flow changes
     * @returns Unsubscribe function
     */
    onFlowChange(listener: FlowChangeListener): () => void;

    /**
     * Dispose all resources.
     */
    dispose(): void;
}

// ============================================================================
// Shared UI Types
// ============================================================================

/**
 * Common status values across flows.
 */
export type CommonStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'unknown';

/**
 * Normalizes various status string formats to common status.
 */
export function normalizeStatus(status: string | undefined): CommonStatus {
    if (!status) return 'unknown';

    const normalized = status.toLowerCase().replace(/[-_\s]/g, '');

    switch (normalized) {
        case 'pending':
        case 'draft':
        case 'todo':
        case 'notstarted':
            return 'pending';

        case 'inprogress':
        case 'active':
        case 'started':
        case 'working':
            return 'in_progress';

        case 'completed':
        case 'complete':
        case 'done':
        case 'finished':
            return 'completed';

        case 'blocked':
        case 'stuck':
        case 'waiting':
            return 'blocked';

        default:
            return 'unknown';
    }
}

/**
 * Get status icon for display.
 */
export function getStatusIcon(status: CommonStatus): string {
    switch (status) {
        case 'completed':
            return '✓';
        case 'in_progress':
            return '●';
        case 'pending':
            return '○';
        case 'blocked':
            return '⚠';
        default:
            return '?';
    }
}

/**
 * Get CSS class for status styling.
 */
export function getStatusClass(status: CommonStatus): string {
    switch (status) {
        case 'completed':
            return 'status-complete';
        case 'in_progress':
            return 'status-in-progress';
        case 'pending':
            return 'status-pending';
        case 'blocked':
            return 'status-blocked';
        default:
            return 'status-unknown';
    }
}
