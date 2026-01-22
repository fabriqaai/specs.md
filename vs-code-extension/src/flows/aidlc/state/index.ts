/**
 * AIDLC State Store Module
 *
 * Wraps the existing StateStore to implement FlowStateManager interface.
 * Re-exports all types for backward compatibility.
 */

import * as vscode from 'vscode';
import { FlowStateManager, FlowStateListener, FlowComputedData } from '../../../core/types';
import {
    StateStore,
    createStateStore,
    WebviewSnapshot
} from '../../../state/stateStore';
import { AidlcArtifacts } from '../parser';

// Re-export all types from the original state module
export {
    TabId,
    ActivityFilter,
    IntentContext,
    SpecsFilter,
    UIState,
    ProgressMetrics,
    BoltStats,
    NextActionType,
    NextAction,
    ComputedState,
    WorkspaceContext,
    SpecsMDState,
    StateChangeEvent,
    StateListener,
    IStateReader,
    IStateWriter,
    IStateStore,
    DEFAULT_UI_STATE,
    EMPTY_COMPUTED_STATE,
    EMPTY_WORKSPACE,
    createEmptyState
} from '../../../state/types';

export {
    StateStore,
    StateStoreConfig,
    DEFAULT_STORE_CONFIG,
    WebviewSnapshot,
    createStateStore,
    createStateStoreFromModel
} from '../../../state/stateStore';

export {
    computeState,
    ComputeConfig,
    DEFAULT_COMPUTE_CONFIG,
    indexIntents,
    indexUnits,
    indexStories,
    indexBolts,
    indexStandards,
    selectActivityFeed,
    selectCurrentIntentWithContext,
    selectCurrentIntentDefault,
    selectBoltStats,
    selectProgressMetrics
} from '../../../state/selectors';

/**
 * AIDLC-specific FlowStateManager implementation.
 *
 * Wraps the existing StateStore to fit the FlowStateManager interface.
 */
export class AidlcStateManager implements FlowStateManager<WebviewSnapshot> {
    private _store: StateStore;
    private _context: vscode.ExtensionContext | null = null;
    private _workspacePath: string = '';

    constructor() {
        this._store = createStateStore();
    }

    /**
     * Initialize with VS Code context for persistence.
     */
    initialize(context: vscode.ExtensionContext): void {
        this._context = context;
    }

    /**
     * Set the workspace path.
     */
    setWorkspacePath(path: string): void {
        this._workspacePath = path;
    }

    /**
     * Get the underlying StateStore for direct access.
     * Used for backward compatibility with existing code.
     */
    getStore(): StateStore {
        return this._store;
    }

    // ========================================================================
    // FlowStateManager Implementation
    // ========================================================================

    /**
     * Get the current state snapshot.
     */
    getState(): WebviewSnapshot {
        return this._store.getWebviewSnapshot();
    }

    /**
     * Load state from parsed artifacts.
     */
    loadFromArtifacts(artifacts: AidlcArtifacts): void {
        // AidlcArtifacts extends MemoryBankModel
        this._store.loadFromModel(artifacts as import('../../../parser/types').MemoryBankModel, this._workspacePath);
    }

    /**
     * Subscribe to state changes.
     */
    subscribe(listener: FlowStateListener<WebviewSnapshot>): () => void {
        return this._store.subscribe(() => {
            listener(this._store.getWebviewSnapshot());
        });
    }

    /**
     * Get computed data for common UI elements.
     */
    getComputedData(): FlowComputedData {
        const state = this._store.getState();
        const computed = state.computed;

        return {
            currentContext: computed.currentIntent?.name || null,
            progressPercent: computed.overallProgress.overallPercent,
            itemCounts: {
                total: computed.boltStats.active + computed.boltStats.queued +
                       computed.boltStats.done + computed.boltStats.blocked,
                completed: computed.boltStats.done,
                inProgress: computed.boltStats.active,
                pending: computed.boltStats.queued + computed.boltStats.blocked
            }
        };
    }

    /**
     * Persist UI state.
     */
    persistUIState(key: string, value: unknown): void {
        if (!this._context) return;
        const fullKey = `specsmd.aidlc.${key}`;
        this._context.workspaceState.update(fullKey, value);
    }

    /**
     * Get persisted UI state.
     */
    getUIState<V>(key: string, defaultValue: V): V {
        if (!this._context) return defaultValue;
        const fullKey = `specsmd.aidlc.${key}`;
        const value = this._context.workspaceState.get<V>(fullKey);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Dispose resources.
     */
    dispose(): void {
        this._store.dispose();
    }

    // ========================================================================
    // AIDLC-Specific Methods (Backward Compatibility)
    // ========================================================================

    /**
     * Get the full internal state.
     */
    getFullState() {
        return this._store.getState();
    }

    /**
     * Update UI state in the store.
     */
    setUIState(updates: Partial<import('../../../state/types').UIState>): void {
        this._store.setUIState(updates);
    }

    /**
     * Get current intent.
     */
    getCurrentIntent() {
        return this._store.getCurrentIntent();
    }

    /**
     * Get active bolts.
     */
    getActiveBolts() {
        return this._store.getActiveBolts();
    }

    /**
     * Get pending bolts.
     */
    getPendingBolts() {
        return this._store.getPendingBolts();
    }

    /**
     * Get activity feed.
     */
    getActivityFeed(filter?: import('../../../state/types').ActivityFilter) {
        return this._store.getActivityFeed(filter);
    }

    /**
     * Get bolt stats.
     */
    getBoltStats() {
        return this._store.getBoltStats();
    }

    /**
     * Get progress metrics.
     */
    getProgressMetrics() {
        return this._store.getProgressMetrics();
    }

    /**
     * Get next actions.
     */
    getNextActions() {
        return this._store.getNextActions();
    }

    /**
     * Force recomputation.
     */
    recompute(): void {
        this._store.recompute();
    }
}

/**
 * Create an AIDLC state manager instance.
 */
export function createAidlcStateManager(): AidlcStateManager {
    return new AidlcStateManager();
}
