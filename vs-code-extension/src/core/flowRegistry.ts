/**
 * FlowRegistry - Central registry for flow adapters.
 *
 * The registry manages:
 * - Registration of flow adapters
 * - Detection of flows in workspace
 * - Activation/deactivation of flows
 * - Flow switching
 *
 * See: MULTI_FLOW_ARCHITECTURE.md for full documentation.
 */

import * as vscode from 'vscode';
import {
    FlowId,
    FlowInfo,
    FlowAdapter,
    FlowChangeEvent,
    FlowChangeListener,
    IFlowRegistry
} from './types';

/**
 * Configuration for the flow registry.
 */
export interface FlowRegistryConfig {
    /** Default flow to activate if multiple are detected */
    defaultFlowPriority: FlowId[];
    /** Whether to persist the last active flow preference */
    persistFlowPreference: boolean;
    /** Storage key for flow preference */
    flowPreferenceKey: string;
}

/**
 * Default registry configuration.
 */
export const DEFAULT_REGISTRY_CONFIG: FlowRegistryConfig = {
    defaultFlowPriority: ['fire', 'aidlc', 'simple'],
    persistFlowPreference: true,
    flowPreferenceKey: 'specsmd.activeFlowId'
};

/**
 * Flow icons for display.
 */
const FLOW_ICONS: Record<FlowId, string> = {
    fire: '🔥',
    aidlc: '📘',
    simple: '📄'
};

/**
 * FlowRegistry implementation.
 * Manages flow adapter registration, detection, and activation.
 */
export class FlowRegistry implements IFlowRegistry {
    private _adapters: Map<FlowId, FlowAdapter> = new Map();
    private _activeAdapter: FlowAdapter | null = null;
    private _activeFlow: FlowInfo | null = null;
    private _detectedFlows: FlowInfo[] = [];
    private _changeListeners: Set<FlowChangeListener> = new Set();
    private _config: FlowRegistryConfig;
    private _context: vscode.ExtensionContext | null = null;
    private _disposed: boolean = false;

    constructor(config: Partial<FlowRegistryConfig> = {}) {
        this._config = { ...DEFAULT_REGISTRY_CONFIG, ...config };
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    /**
     * Initialize the registry with VS Code context.
     * Must be called before using other methods.
     * @param context - VS Code extension context
     */
    async initialize(context: vscode.ExtensionContext): Promise<void> {
        this._context = context;

        // Initialize all registered adapters
        for (const adapter of this._adapters.values()) {
            await adapter.initialize(context);
        }
    }

    // ========================================================================
    // Registration
    // ========================================================================

    /**
     * Register a flow adapter.
     * @param adapter - Flow adapter to register
     */
    register(adapter: FlowAdapter): void {
        if (this._adapters.has(adapter.flowId)) {
            console.warn(`FlowRegistry: Adapter for ${adapter.flowId} already registered, replacing`);
        }
        this._adapters.set(adapter.flowId, adapter);
    }

    /**
     * Get a registered adapter by flow ID.
     * @param flowId - Flow identifier
     */
    getAdapter(flowId: FlowId): FlowAdapter | undefined {
        return this._adapters.get(flowId);
    }

    /**
     * Check if an adapter is registered for the given flow.
     * @param flowId - Flow identifier
     */
    hasAdapter(flowId: FlowId): boolean {
        return this._adapters.has(flowId);
    }

    // ========================================================================
    // Detection
    // ========================================================================

    /**
     * Detect all flows in the workspace.
     * @param workspacePath - Root path of the workspace
     * @returns Array of detected flows
     */
    async detectFlows(workspacePath: string): Promise<FlowInfo[]> {
        const detected: FlowInfo[] = [];

        for (const [flowId, adapter] of this._adapters) {
            try {
                const result = await adapter.detector.detect(workspacePath);

                if (result.detected && result.flowPath) {
                    detected.push({
                        id: flowId,
                        displayName: adapter.detector.displayName,
                        icon: adapter.detector.icon || FLOW_ICONS[flowId] || '📁',
                        rootFolder: adapter.detector.rootFolder,
                        version: result.version,
                        flowPath: result.flowPath
                    });
                }
            } catch (error) {
                console.error(`FlowRegistry: Error detecting ${flowId}:`, error);
            }
        }

        this._detectedFlows = detected;
        return detected;
    }

    /**
     * Synchronous flow detection for use during activation.
     * @param workspacePath - Root path of the workspace
     * @returns Array of detected flows
     */
    detectFlowsSync(workspacePath: string): FlowInfo[] {
        const detected: FlowInfo[] = [];

        for (const [flowId, adapter] of this._adapters) {
            try {
                const result = adapter.detector.detectSync(workspacePath);

                if (result.detected && result.flowPath) {
                    detected.push({
                        id: flowId,
                        displayName: adapter.detector.displayName,
                        icon: adapter.detector.icon || FLOW_ICONS[flowId] || '📁',
                        rootFolder: adapter.detector.rootFolder,
                        version: result.version,
                        flowPath: result.flowPath
                    });
                }
            } catch (error) {
                console.error(`FlowRegistry: Error detecting ${flowId} (sync):`, error);
            }
        }

        this._detectedFlows = detected;
        return detected;
    }

    /**
     * Get the default flow to activate based on priority and detection.
     * @returns Default flow info or null if none detected
     */
    getDefaultFlow(): FlowInfo | null {
        if (this._detectedFlows.length === 0) {
            return null;
        }

        // Check for persisted preference first
        if (this._config.persistFlowPreference && this._context) {
            const preferredFlowId = this._context.workspaceState.get<FlowId>(
                this._config.flowPreferenceKey
            );

            if (preferredFlowId) {
                const preferred = this._detectedFlows.find(f => f.id === preferredFlowId);
                if (preferred) {
                    return preferred;
                }
            }
        }

        // Use priority order
        for (const flowId of this._config.defaultFlowPriority) {
            const flow = this._detectedFlows.find(f => f.id === flowId);
            if (flow) {
                return flow;
            }
        }

        // Fall back to first detected
        return this._detectedFlows[0];
    }

    // ========================================================================
    // Activation
    // ========================================================================

    /**
     * Activate a specific flow.
     * @param flowId - Flow to activate
     * @param flowPath - Path to the flow's root folder
     */
    async activateFlow(flowId: FlowId, flowPath: string): Promise<void> {
        const adapter = this._adapters.get(flowId);

        if (!adapter) {
            throw new Error(`FlowRegistry: No adapter registered for flow: ${flowId}`);
        }

        const previousFlow = this._activeFlow;

        // Deactivate current flow
        if (this._activeAdapter) {
            this._activeAdapter.deactivate();
        }

        // Activate new flow
        await adapter.activate(flowPath);
        this._activeAdapter = adapter;

        // Update active flow info
        this._activeFlow = this._detectedFlows.find(f => f.id === flowId) || {
            id: flowId,
            displayName: adapter.detector.displayName,
            icon: adapter.detector.icon || FLOW_ICONS[flowId] || '📁',
            rootFolder: adapter.detector.rootFolder,
            flowPath
        };

        // Persist preference
        if (this._config.persistFlowPreference && this._context) {
            await this._context.workspaceState.update(
                this._config.flowPreferenceKey,
                flowId
            );
        }

        // Notify listeners
        this._notifyFlowChange(previousFlow, this._activeFlow);
    }

    /**
     * Switch to a different flow.
     * Convenience method that handles finding the flow path.
     * @param flowId - Flow to switch to
     */
    async switchFlow(flowId: FlowId): Promise<void> {
        const flow = this._detectedFlows.find(f => f.id === flowId);

        if (!flow) {
            throw new Error(`FlowRegistry: Flow not detected in workspace: ${flowId}`);
        }

        if (!flow.flowPath) {
            throw new Error(`FlowRegistry: Flow path not available for: ${flowId}`);
        }

        await this.activateFlow(flowId, flow.flowPath);
    }

    // ========================================================================
    // Getters
    // ========================================================================

    /**
     * Get the currently active adapter.
     */
    getActiveAdapter(): FlowAdapter | null {
        return this._activeAdapter;
    }

    /**
     * Get the currently active flow info.
     */
    getActiveFlow(): FlowInfo | null {
        return this._activeFlow;
    }

    /**
     * Get all detected flows.
     */
    getDetectedFlows(): FlowInfo[] {
        return [...this._detectedFlows];
    }

    /**
     * Check if any flows are detected.
     */
    hasDetectedFlows(): boolean {
        return this._detectedFlows.length > 0;
    }

    /**
     * Check if a specific flow is detected.
     * @param flowId - Flow to check
     */
    isFlowDetected(flowId: FlowId): boolean {
        return this._detectedFlows.some(f => f.id === flowId);
    }

    // ========================================================================
    // Event Handling
    // ========================================================================

    /**
     * Subscribe to flow change events.
     * @param listener - Callback for flow changes
     * @returns Unsubscribe function
     */
    onFlowChange(listener: FlowChangeListener): () => void {
        this._changeListeners.add(listener);
        return () => {
            this._changeListeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of a flow change.
     */
    private _notifyFlowChange(previousFlow: FlowInfo | null, currentFlow: FlowInfo): void {
        if (this._disposed) return;

        const event: FlowChangeEvent = {
            previousFlow,
            currentFlow
        };

        for (const listener of this._changeListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('FlowRegistry: Error in flow change listener:', error);
            }
        }
    }

    // ========================================================================
    // Refresh
    // ========================================================================

    /**
     * Refresh the active flow's data.
     */
    async refresh(): Promise<void> {
        if (this._activeAdapter) {
            await this._activeAdapter.refresh();
        }
    }

    // ========================================================================
    // Disposal
    // ========================================================================

    /**
     * Dispose all resources.
     */
    dispose(): void {
        this._disposed = true;

        // Dispose all adapters
        for (const adapter of this._adapters.values()) {
            try {
                adapter.dispose();
            } catch (error) {
                console.error('FlowRegistry: Error disposing adapter:', error);
            }
        }

        this._adapters.clear();
        this._changeListeners.clear();
        this._activeAdapter = null;
        this._activeFlow = null;
        this._detectedFlows = [];
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new flow registry instance.
 * @param config - Optional configuration
 */
export function createFlowRegistry(config?: Partial<FlowRegistryConfig>): FlowRegistry {
    return new FlowRegistry(config);
}

/**
 * Singleton instance for the global registry.
 */
let globalRegistry: FlowRegistry | null = null;

/**
 * Get or create the global flow registry instance.
 * @param config - Optional configuration (only used on first call)
 */
export function getGlobalRegistry(config?: Partial<FlowRegistryConfig>): FlowRegistry {
    if (!globalRegistry) {
        globalRegistry = new FlowRegistry(config);
    }
    return globalRegistry;
}

/**
 * Reset the global registry (for testing).
 */
export function resetGlobalRegistry(): void {
    if (globalRegistry) {
        globalRegistry.dispose();
        globalRegistry = null;
    }
}
