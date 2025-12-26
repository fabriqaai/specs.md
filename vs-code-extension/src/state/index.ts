/**
 * State Module - Centralized state management for SpecsMD.
 *
 * This module provides a centralized state store following the architecture:
 *   File System → Parser → StateStore → Selectors → UI Components
 *
 * Key Components:
 * - SpecsMDState: Root state interface
 * - StateStore: Observable state container
 * - Selectors: Pure functions for computing derived values
 *
 * Usage:
 * ```typescript
 * import { createStateStore, StateStore } from './state';
 *
 * const store = createStateStore();
 * store.loadFromModel(model, workspacePath);
 *
 * // Subscribe to changes
 * store.subscribe(({ state }) => {
 *     console.log('Current intent:', state.computed.currentIntent?.name);
 * });
 *
 * // Read computed values
 * const activeBolt = store.getActiveBolt();
 * const stats = store.getBoltStats();
 * ```
 */

// Types
export {
    // State types
    SpecsMDState,
    WorkspaceContext,
    UIState,
    ComputedState,
    ProgressMetrics,
    BoltStats,
    NextAction,
    NextActionType,

    // Filter types
    TabId,
    ActivityFilter,
    SpecsFilter,

    // Event types
    StateChangeEvent,
    StateListener,

    // Interfaces
    IStateStore,
    IStateReader,
    IStateWriter,

    // Factory
    createEmptyState,

    // Defaults
    DEFAULT_UI_STATE,
    EMPTY_COMPUTED_STATE,
    EMPTY_WORKSPACE
} from './types';

// Selectors
export {
    // Selection strategies
    IntentSelectionStrategy,
    BoltSelectionStrategy,
    selectCurrentIntentDefault,
    selectCurrentIntentByPendingBolts,
    selectActiveBoltsDefault,
    selectActiveBoltDefault, // Legacy, deprecated

    // Intent selection strategies (individual)
    selectIntentByActiveBolt,
    selectIntentByRecentActivity,
    selectIntentByInProgressStories,

    // Selector functions
    selectPendingBolts,
    selectCompletedBolts,
    selectBoltStats,
    selectActivityFeed,
    selectProgressMetrics,
    selectFilteredIntents,

    // Next actions
    selectNextActions,
    selectTopNextAction,

    // Main computation
    ComputeConfig,
    DEFAULT_COMPUTE_CONFIG,
    computeState,

    // Indexing helpers
    indexById,
    indexIntents,
    indexUnits,
    indexStories,
    indexBolts,
    indexStandards
} from './selectors';

// Store
export {
    StateStore,
    StateStoreConfig,
    DEFAULT_STORE_CONFIG,
    WebviewSnapshot,
    createStateStore,
    createStateStoreFromModel
} from './stateStore';
