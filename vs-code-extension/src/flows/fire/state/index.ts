/**
 * FIRE State Manager Module
 *
 * Implements FlowStateManager interface for FIRE flow state management.
 */

import * as vscode from 'vscode';
import { FlowStateManager, FlowStateListener, FlowComputedData } from '../../../core/types';
import {
    FireArtifacts,
    FireWebviewSnapshot,
    FireUIState,
    FireStats,
    FireRun,
    DEFAULT_FIRE_UI_STATE,
    calculateFireStats
} from '../types';

// Re-export types
export * from '../types';

/**
 * Internal state structure.
 */
interface FireInternalState {
    artifacts: FireArtifacts | null;
    ui: FireUIState;
}

/**
 * FIRE-specific FlowStateManager implementation.
 */
export class FireStateManager implements FlowStateManager<FireWebviewSnapshot> {
    private _state: FireInternalState;
    private _context: vscode.ExtensionContext | null = null;
    private _workspacePath: string = '';
    private _listeners: Set<FlowStateListener<FireWebviewSnapshot>> = new Set();

    constructor() {
        this._state = {
            artifacts: null,
            ui: { ...DEFAULT_FIRE_UI_STATE }
        };
    }

    /**
     * Initialize with VS Code context for persistence.
     */
    initialize(context: vscode.ExtensionContext): void {
        this._context = context;
        this._loadPersistedUIState();
    }

    /**
     * Set the workspace path.
     */
    setWorkspacePath(path: string): void {
        this._workspacePath = path;
    }

    // =========================================================================
    // FlowStateManager Implementation
    // =========================================================================

    /**
     * Get the current state snapshot.
     */
    getState(): FireWebviewSnapshot {
        const artifacts = this._state.artifacts;

        if (!artifacts || !artifacts.isProject) {
            return this._createEmptySnapshot();
        }

        const stats = calculateFireStats(artifacts);
        const completedRuns = artifacts.runs.filter(r => r.completedAt != null);

        return {
            project: artifacts.project,
            workspace: artifacts.workspace,
            intents: artifacts.intents,
            activeRun: artifacts.activeRun,
            completedRuns,
            standards: artifacts.standards,
            stats,
            ui: this._state.ui
        };
    }

    /**
     * Load state from parsed artifacts.
     */
    loadFromArtifacts(artifacts: FireArtifacts): void {
        this._state.artifacts = artifacts;
        this._notify();
    }

    /**
     * Subscribe to state changes.
     */
    subscribe(listener: FlowStateListener<FireWebviewSnapshot>): () => void {
        this._listeners.add(listener);

        return () => {
            this._listeners.delete(listener);
        };
    }

    /**
     * Get computed data for common UI elements.
     */
    getComputedData(): FlowComputedData {
        const artifacts = this._state.artifacts;

        if (!artifacts || !artifacts.isProject) {
            return {
                currentContext: null,
                progressPercent: 0,
                itemCounts: {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                    pending: 0
                }
            };
        }

        const stats = calculateFireStats(artifacts);
        const progressPercent = stats.totalWorkItems > 0
            ? Math.round((stats.completedWorkItems / stats.totalWorkItems) * 100)
            : 0;

        // Current context is the active run or first in-progress intent
        let currentContext: string | null = null;
        if (artifacts.activeRun) {
            currentContext = `Run: ${artifacts.activeRun.id}`;
        } else {
            const activeIntent = artifacts.intents.find(i => i.status === 'in_progress');
            if (activeIntent) {
                currentContext = activeIntent.title;
            }
        }

        return {
            currentContext,
            progressPercent,
            itemCounts: {
                total: stats.totalWorkItems,
                completed: stats.completedWorkItems,
                inProgress: stats.inProgressWorkItems,
                pending: stats.pendingWorkItems
            }
        };
    }

    /**
     * Persist UI state.
     */
    persistUIState(key: string, value: unknown): void {
        if (!this._context) return;
        const fullKey = `specsmd.fire.${key}`;
        this._context.workspaceState.update(fullKey, value);
    }

    /**
     * Get persisted UI state.
     */
    getUIState<V>(key: string, defaultValue: V): V {
        if (!this._context) return defaultValue;
        const fullKey = `specsmd.fire.${key}`;
        const value = this._context.workspaceState.get<V>(fullKey);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Dispose resources.
     */
    dispose(): void {
        this._listeners.clear();
        this._state = {
            artifacts: null,
            ui: { ...DEFAULT_FIRE_UI_STATE }
        };
    }

    // =========================================================================
    // FIRE-Specific Methods
    // =========================================================================

    /**
     * Get all artifacts.
     */
    getArtifacts(): FireArtifacts | null {
        return this._state.artifacts;
    }

    /**
     * Get UI state.
     */
    getFireUIState(): FireUIState {
        return this._state.ui;
    }

    /**
     * Update UI state.
     */
    setFireUIState(updates: Partial<FireUIState>): void {
        this._state.ui = {
            ...this._state.ui,
            ...updates
        };
        this._notify();
    }

    /**
     * Get active run.
     */
    getActiveRun(): FireRun | null {
        return this._state.artifacts?.activeRun || null;
    }

    /**
     * Get completed runs.
     */
    getCompletedRuns(): FireRun[] {
        const artifacts = this._state.artifacts;
        if (!artifacts) return [];
        return artifacts.runs.filter(r => r.completedAt != null);
    }

    /**
     * Get stats.
     */
    getStats(): FireStats {
        const artifacts = this._state.artifacts;
        if (!artifacts) {
            return {
                totalIntents: 0,
                completedIntents: 0,
                inProgressIntents: 0,
                pendingIntents: 0,
                totalWorkItems: 0,
                completedWorkItems: 0,
                inProgressWorkItems: 0,
                pendingWorkItems: 0,
                totalRuns: 0,
                completedRuns: 0,
                hasActiveRun: false
            };
        }
        return calculateFireStats(artifacts);
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Notify all listeners of state change.
     */
    private _notify(): void {
        const snapshot = this.getState();
        for (const listener of this._listeners) {
            try {
                listener(snapshot);
            } catch (error) {
                console.error('FireStateManager listener error:', error);
            }
        }
    }

    /**
     * Create empty snapshot.
     */
    private _createEmptySnapshot(): FireWebviewSnapshot {
        return {
            project: null,
            workspace: null,
            intents: [],
            activeRun: null,
            completedRuns: [],
            standards: [],
            stats: {
                totalIntents: 0,
                completedIntents: 0,
                inProgressIntents: 0,
                pendingIntents: 0,
                totalWorkItems: 0,
                completedWorkItems: 0,
                inProgressWorkItems: 0,
                pendingWorkItems: 0,
                totalRuns: 0,
                completedRuns: 0,
                hasActiveRun: false
            },
            ui: this._state.ui
        };
    }

    /**
     * Load persisted UI state from VS Code storage.
     */
    private _loadPersistedUIState(): void {
        if (!this._context) return;

        this._state.ui = {
            activeTab: this.getUIState('activeTab', DEFAULT_FIRE_UI_STATE.activeTab),
            runsFilter: this.getUIState('runsFilter', DEFAULT_FIRE_UI_STATE.runsFilter),
            intentsFilter: this.getUIState('intentsFilter', DEFAULT_FIRE_UI_STATE.intentsFilter),
            expandedIntents: this.getUIState('expandedIntents', DEFAULT_FIRE_UI_STATE.expandedIntents),
            selectedRunId: this.getUIState('selectedRunId', DEFAULT_FIRE_UI_STATE.selectedRunId)
        };
    }
}

/**
 * Create a FIRE state manager instance.
 */
export function createFireStateManager(): FireStateManager {
    return new FireStateManager();
}
