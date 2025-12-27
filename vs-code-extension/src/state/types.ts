/**
 * State types for SpecsMD centralized state management.
 *
 * This module defines the root state structure as specified in variation-8-2-spec.md.
 * The state is the single source of truth for all UI components.
 *
 * Architecture:
 *   File System → Parser → StateStore → Selectors → UI Components
 *
 * SOLID Principles Applied:
 * - Single Responsibility: State types are separate from parsing and rendering
 * - Open/Closed: Extend via new selectors without modifying core types
 * - Interface Segregation: IStateReader and IStateWriter are separate
 */

import { Intent, Unit, Story, Bolt, Standard, ArtifactStatus, ActivityEvent } from '../parser/types';

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Tab identifiers for the sidebar.
 */
export type TabId = 'bolts' | 'specs' | 'overview';

/**
 * Activity feed filter options.
 */
export type ActivityFilter = 'all' | 'stages' | 'bolts';

/**
 * Specs tree filter options.
 * Can be 'all' or any raw status string discovered from unit frontmatter.
 */
export type SpecsFilter = string;

/**
 * UI-specific state that is separate from data state.
 * This state is persisted in workspaceState.
 */
export interface UIState {
    /** Currently active tab */
    activeTab: TabId;
    /** Set of expanded intent IDs in specs tree */
    expandedIntents: Set<string>;
    /** Set of expanded unit IDs in specs tree */
    expandedUnits: Set<string>;
    /** Set of expanded bolt IDs */
    expandedBolts: Set<string>;
    /** Activity feed filter */
    activityFilter: ActivityFilter;
    /** Specs tree filter */
    specsFilter: SpecsFilter;
    /** Activity section height in pixels */
    activitySectionHeight: number;
    /** Whether focus card is expanded */
    focusCardExpanded: boolean;
}

// ============================================================================
// Computed State Types
// ============================================================================

/**
 * Progress metrics for the overview.
 */
export interface ProgressMetrics {
    totalIntents: number;
    totalUnits: number;
    totalStories: number;
    totalBolts: number;
    completedStories: number;
    completedBolts: number;
    overallPercent: number;
}

/**
 * Bolt statistics for display.
 */
export interface BoltStats {
    active: number;
    queued: number;
    done: number;
    blocked: number;
}

/**
 * Action types that can be suggested to the user.
 */
export type NextActionType =
    | 'continue-bolt'
    | 'start-bolt'
    | 'complete-stage'
    | 'unblock-bolt'
    | 'review-stories'
    | 'create-bolt'
    | 'celebrate';

/**
 * Represents a suggested next action for the user.
 */
export interface NextAction {
    type: NextActionType;
    priority: number;
    title: string;
    description: string;
    targetId?: string;
    targetName?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Computed/derived state that is calculated from raw data.
 * These values are cached and updated when dependencies change.
 */
export interface ComputedState {
    /** Currently selected intent (first intent with active bolts, or first intent) */
    currentIntent: Intent | null;
    /** All currently active bolts (in-progress), sorted by most recent */
    activeBolts: Bolt[];
    /** Pending bolts ordered by dependency priority */
    pendingBolts: Bolt[];
    /** Completed bolts */
    completedBolts: Bolt[];
    /** Activity feed events derived from bolt timestamps */
    activityFeed: ActivityEvent[];
    /** Overall progress metrics */
    overallProgress: ProgressMetrics;
    /** Bolt statistics */
    boltStats: BoltStats;
    /** Suggested next actions for the user */
    nextActions: NextAction[];
}

// ============================================================================
// Root State Type
// ============================================================================

/**
 * Workspace context information.
 */
export interface WorkspaceContext {
    /** Workspace name */
    name: string;
    /** Workspace root path */
    path: string;
    /** Path to memory-bank folder */
    memoryBankPath: string;
    /** Whether this is a valid specsmd project */
    isProject: boolean;
}

/**
 * Root state structure for SpecsMD.
 * This is the single source of truth for all UI components.
 *
 * State is organized into:
 * 1. Workspace context - environment info
 * 2. Raw entities - parsed from files (indexed by ID for O(1) lookup)
 * 3. Computed state - derived values cached for performance
 * 4. UI state - presentation state (separate from data)
 */
export interface SpecsMDState {
    /** Workspace context */
    workspace: WorkspaceContext;

    /** Parsed entities indexed by ID */
    intents: Map<string, Intent>;
    units: Map<string, Unit>;
    stories: Map<string, Story>;
    bolts: Map<string, Bolt>;
    standards: Map<string, Standard>;

    /** Computed/derived state */
    computed: ComputedState;

    /** UI presentation state */
    ui: UIState;
}

// ============================================================================
// State Store Interfaces (Interface Segregation Principle)
// ============================================================================

/**
 * State change event containing the new state and what changed.
 */
export interface StateChangeEvent {
    state: SpecsMDState;
    changedPaths: string[];
}

/**
 * Listener for state changes.
 */
export type StateListener = (event: StateChangeEvent) => void;

/**
 * Read-only interface for state access.
 * UI components should depend on this interface.
 */
export interface IStateReader {
    /** Get the current state (immutable) */
    getState(): Readonly<SpecsMDState>;

    /** Subscribe to state changes */
    subscribe(listener: StateListener): () => void;

    // Computed value accessors (selector shortcuts)
    getCurrentIntent(): Intent | null;
    getActiveBolts(): Bolt[];
    getPendingBolts(): Bolt[];
    getActivityFeed(filter?: ActivityFilter): ActivityEvent[];
    getBoltStats(): BoltStats;
    getProgressMetrics(): ProgressMetrics;
    getNextActions(): NextAction[];
    getTopNextAction(): NextAction | null;
}

/**
 * Write interface for state mutations.
 * Only the parser and message handlers should use this.
 */
export interface IStateWriter {
    /** Set workspace context */
    setWorkspace(workspace: WorkspaceContext): void;

    /** Update entities from parsed data */
    setEntities(entities: {
        intents?: Intent[];
        units?: Unit[];
        stories?: Story[];
        bolts?: Bolt[];
        standards?: Standard[];
    }): void;

    /** Update a single bolt */
    updateBolt(bolt: Bolt): void;

    /** Update UI state */
    setUIState(updates: Partial<UIState>): void;

    /** Force recomputation of derived state */
    recompute(): void;
}

/**
 * Combined interface for the state store.
 */
export interface IStateStore extends IStateReader, IStateWriter {
    /** Dispose resources */
    dispose(): void;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_UI_STATE: UIState = {
    activeTab: 'bolts',
    expandedIntents: new Set(),
    expandedUnits: new Set(),
    expandedBolts: new Set(),
    activityFilter: 'all',
    specsFilter: 'all',
    activitySectionHeight: 200,
    focusCardExpanded: false
};

export const EMPTY_COMPUTED_STATE: ComputedState = {
    currentIntent: null,
    activeBolts: [],
    pendingBolts: [],
    completedBolts: [],
    activityFeed: [],
    overallProgress: {
        totalIntents: 0,
        totalUnits: 0,
        totalStories: 0,
        totalBolts: 0,
        completedStories: 0,
        completedBolts: 0,
        overallPercent: 0
    },
    boltStats: { active: 0, queued: 0, done: 0, blocked: 0 },
    nextActions: []
};

export const EMPTY_WORKSPACE: WorkspaceContext = {
    name: '',
    path: '',
    memoryBankPath: '',
    isProject: false
};

/**
 * Creates an empty initial state.
 */
export function createEmptyState(): SpecsMDState {
    return {
        workspace: { ...EMPTY_WORKSPACE },
        intents: new Map(),
        units: new Map(),
        stories: new Map(),
        bolts: new Map(),
        standards: new Map(),
        computed: { ...EMPTY_COMPUTED_STATE },
        ui: { ...DEFAULT_UI_STATE }
    };
}
