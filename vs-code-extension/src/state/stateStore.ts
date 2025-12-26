/**
 * StateStore - Centralized state management with observable pattern.
 *
 * The StateStore is the single source of truth for all application state.
 * It implements the Observer pattern to notify subscribers of state changes.
 *
 * Architecture:
 *   File Watcher → Parser → StateStore → Selectors → UI Components
 *                               ↓
 *                          [Computed State]
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages state, delegates computation to selectors
 * - Open/Closed: Extend via selector strategies without modifying store
 * - Interface Segregation: Implements IStateReader and IStateWriter separately
 * - Dependency Inversion: Depends on abstractions (strategies), not concrete impls
 */

import { Intent, Unit, Story, Bolt, Standard, ArtifactStatus, ActivityEvent } from '../parser/types';
import { MemoryBankModel } from '../parser/types';
import {
    SpecsMDState,
    IStateStore,
    IStateReader,
    IStateWriter,
    StateListener,
    StateChangeEvent,
    WorkspaceContext,
    UIState,
    ActivityFilter,
    BoltStats,
    ProgressMetrics,
    NextAction,
    createEmptyState,
    DEFAULT_UI_STATE,
    EMPTY_WORKSPACE
} from './types';
import {
    computeState,
    ComputeConfig,
    DEFAULT_COMPUTE_CONFIG,
    indexIntents,
    indexUnits,
    indexStories,
    indexBolts,
    indexStandards,
    selectActivityFeed
} from './selectors';

/**
 * Configuration for the StateStore.
 */
export interface StateStoreConfig {
    /** Compute configuration for selectors */
    computeConfig: ComputeConfig;
    /** Whether to auto-recompute on entity changes */
    autoRecompute: boolean;
}

/**
 * Default store configuration.
 */
export const DEFAULT_STORE_CONFIG: StateStoreConfig = {
    computeConfig: DEFAULT_COMPUTE_CONFIG,
    autoRecompute: true
};

/**
 * StateStore implementation.
 * Manages the centralized state and notifies subscribers of changes.
 */
export class StateStore implements IStateStore {
    private _state: SpecsMDState;
    private _listeners: Set<StateListener> = new Set();
    private _config: StateStoreConfig;
    private _disposed: boolean = false;

    constructor(config: Partial<StateStoreConfig> = {}) {
        this._config = { ...DEFAULT_STORE_CONFIG, ...config };
        this._state = createEmptyState();
    }

    // ========================================================================
    // IStateReader Implementation
    // ========================================================================

    /**
     * Gets the current state (immutable reference).
     */
    getState(): Readonly<SpecsMDState> {
        return this._state;
    }

    /**
     * Subscribe to state changes.
     * Returns an unsubscribe function.
     */
    subscribe(listener: StateListener): () => void {
        this._listeners.add(listener);
        return () => {
            this._listeners.delete(listener);
        };
    }

    /**
     * Gets the current intent.
     */
    getCurrentIntent(): Intent | null {
        return this._state.computed.currentIntent;
    }

    /**
     * Gets all active bolts.
     */
    getActiveBolts(): Bolt[] {
        return this._state.computed.activeBolts;
    }

    /**
     * Gets pending bolts.
     */
    getPendingBolts(): Bolt[] {
        return this._state.computed.pendingBolts;
    }

    /**
     * Gets activity feed with optional filtering.
     */
    getActivityFeed(filter?: ActivityFilter): ActivityEvent[] {
        const bolts = Array.from(this._state.bolts.values());
        return selectActivityFeed(bolts, filter ?? this._state.ui.activityFilter);
    }

    /**
     * Gets bolt statistics.
     */
    getBoltStats(): BoltStats {
        return this._state.computed.boltStats;
    }

    /**
     * Gets progress metrics.
     */
    getProgressMetrics(): ProgressMetrics {
        return this._state.computed.overallProgress;
    }

    /**
     * Gets all suggested next actions.
     */
    getNextActions(): NextAction[] {
        return this._state.computed.nextActions;
    }

    /**
     * Gets the top priority next action.
     */
    getTopNextAction(): NextAction | null {
        const actions = this._state.computed.nextActions;
        return actions.length > 0 ? actions[0] : null;
    }

    // ========================================================================
    // IStateWriter Implementation
    // ========================================================================

    /**
     * Sets the workspace context.
     */
    setWorkspace(workspace: WorkspaceContext): void {
        this._state = {
            ...this._state,
            workspace
        };
        this._notify(['workspace']);
    }

    /**
     * Updates entities from parsed data.
     */
    setEntities(entities: {
        intents?: Intent[];
        units?: Unit[];
        stories?: Story[];
        bolts?: Bolt[];
        standards?: Standard[];
    }): void {
        const changedPaths: string[] = [];

        if (entities.intents !== undefined) {
            this._state.intents = indexIntents(entities.intents);
            changedPaths.push('intents');
        }

        if (entities.units !== undefined) {
            this._state.units = indexUnits(entities.units);
            changedPaths.push('units');
        }

        if (entities.stories !== undefined) {
            this._state.stories = indexStories(entities.stories);
            changedPaths.push('stories');
        }

        if (entities.bolts !== undefined) {
            this._state.bolts = indexBolts(entities.bolts);
            changedPaths.push('bolts');
        }

        if (entities.standards !== undefined) {
            this._state.standards = indexStandards(entities.standards);
            changedPaths.push('standards');
        }

        if (changedPaths.length > 0 && this._config.autoRecompute) {
            this._recomputeInternal();
            changedPaths.push('computed');
        }

        this._notify(changedPaths);
    }

    /**
     * Updates a single bolt.
     */
    updateBolt(bolt: Bolt): void {
        this._state.bolts.set(bolt.id, bolt);

        if (this._config.autoRecompute) {
            this._recomputeInternal();
        }

        this._notify(['bolts', 'computed']);
    }

    /**
     * Updates UI state.
     */
    setUIState(updates: Partial<UIState>): void {
        this._state = {
            ...this._state,
            ui: {
                ...this._state.ui,
                ...updates
            }
        };
        this._notify(['ui']);
    }

    /**
     * Force recomputation of derived state.
     */
    recompute(): void {
        this._recomputeInternal();
        this._notify(['computed']);
    }

    // ========================================================================
    // High-Level Methods
    // ========================================================================

    /**
     * Loads state from a MemoryBankModel.
     * This is a convenience method for integration with the existing parser.
     */
    loadFromModel(model: MemoryBankModel, workspacePath: string): void {
        // Extract all units and stories from intents
        const allUnits: Unit[] = [];
        const allStories: Story[] = [];

        for (const intent of model.intents) {
            for (const unit of intent.units) {
                allUnits.push(unit);
                for (const story of unit.stories) {
                    allStories.push(story);
                }
            }
        }

        // Set workspace
        this.setWorkspace({
            name: workspacePath.split('/').pop() || '',
            path: workspacePath,
            memoryBankPath: `${workspacePath}/memory-bank`,
            isProject: model.isProject
        });

        // Set all entities at once (triggers single recompute)
        this.setEntities({
            intents: model.intents,
            units: allUnits,
            stories: allStories,
            bolts: model.bolts,
            standards: model.standards
        });
    }

    /**
     * Gets a snapshot suitable for webview rendering.
     * This bridges the old WebviewData format with the new state model.
     */
    getWebviewSnapshot(): WebviewSnapshot {
        const state = this._state;

        return {
            currentIntent: state.computed.currentIntent
                ? { name: state.computed.currentIntent.name, number: state.computed.currentIntent.number }
                : null,
            stats: state.computed.boltStats,
            activeBolts: state.computed.activeBolts,
            pendingBolts: state.computed.pendingBolts,
            completedBolts: state.computed.completedBolts,
            activityFeed: this.getActivityFeed(),
            intents: Array.from(state.intents.values()),
            standards: Array.from(state.standards.values()),
            ui: state.ui,
            isProject: state.workspace.isProject
        };
    }

    // ========================================================================
    // Disposal
    // ========================================================================

    /**
     * Disposes the store and clears all listeners.
     */
    dispose(): void {
        this._disposed = true;
        this._listeners.clear();
        this._state = createEmptyState();
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Internal recomputation.
     */
    private _recomputeInternal(): void {
        const intents = Array.from(this._state.intents.values());
        const units = Array.from(this._state.units.values());
        const stories = Array.from(this._state.stories.values());
        const bolts = Array.from(this._state.bolts.values());

        this._state = {
            ...this._state,
            computed: computeState(intents, units, stories, bolts, this._config.computeConfig)
        };
    }

    /**
     * Notifies all listeners of state change.
     */
    private _notify(changedPaths: string[]): void {
        if (this._disposed) {
            return;
        }

        const event: StateChangeEvent = {
            state: this._state,
            changedPaths
        };

        for (const listener of this._listeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('StateStore listener error:', error);
            }
        }
    }
}

// ============================================================================
// Webview Snapshot Type
// ============================================================================

/**
 * Snapshot of state suitable for webview rendering.
 * This provides a bridge to the existing WebviewData format.
 */
export interface WebviewSnapshot {
    currentIntent: { name: string; number: string } | null;
    stats: BoltStats;
    activeBolts: Bolt[];
    pendingBolts: Bolt[];
    completedBolts: Bolt[];
    activityFeed: ActivityEvent[];
    intents: Intent[];
    standards: Standard[];
    ui: UIState;
    isProject: boolean;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new StateStore instance.
 */
export function createStateStore(config?: Partial<StateStoreConfig>): StateStore {
    return new StateStore(config);
}

/**
 * Creates a StateStore and loads from a MemoryBankModel.
 */
export function createStateStoreFromModel(
    model: MemoryBankModel,
    workspacePath: string,
    config?: Partial<StateStoreConfig>
): StateStore {
    const store = new StateStore(config);
    store.loadFromModel(model, workspacePath);
    return store;
}
