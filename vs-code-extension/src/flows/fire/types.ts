/**
 * FIRE Flow Types
 *
 * Type definitions for FIRE flow artifacts and state.
 * Based on the FIRE memory-bank.yaml schema.
 */

// =============================================================================
// Status Types
// =============================================================================

/**
 * Status for intents and work items.
 */
export type FireStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

/**
 * Execution modes for work items.
 */
export type ExecutionMode = 'autopilot' | 'confirm' | 'validate';

/**
 * Run scope - how many work items in a run.
 */
export type RunScope = 'single' | 'batch' | 'wide';

/**
 * Workspace type.
 */
export type WorkspaceType = 'greenfield' | 'brownfield';

/**
 * Workspace structure.
 */
export type WorkspaceStructure = 'monolith' | 'monorepo' | 'multi-part';

/**
 * Autonomy bias setting.
 */
export type AutonomyBias = 'autonomous' | 'balanced' | 'controlled';

/**
 * Work item complexity.
 */
export type Complexity = 'low' | 'medium' | 'high';

// =============================================================================
// Core Artifact Types
// =============================================================================

/**
 * Work item within an intent.
 */
export interface FireWorkItem {
    /** Unique identifier (kebab-case) */
    id: string;
    /** Parent intent ID */
    intentId: string;
    /** Display title */
    title: string;
    /** Current status */
    status: FireStatus;
    /** Execution mode */
    mode: ExecutionMode;
    /** Complexity level */
    complexity: Complexity;
    /** File path to work item markdown */
    filePath: string;
    /** Brief description */
    description?: string;
    /** Dependencies on other work items */
    dependencies?: string[];
    /** Created timestamp */
    createdAt?: string;
    /** Completed timestamp */
    completedAt?: string;
}

/**
 * Intent - high-level objective.
 */
export interface FireIntent {
    /** Unique identifier (kebab-case) */
    id: string;
    /** Display title */
    title: string;
    /** Current status */
    status: FireStatus;
    /** File path to intent brief */
    filePath: string;
    /** Brief description */
    description?: string;
    /** Work items within this intent */
    workItems: FireWorkItem[];
    /** Created timestamp */
    createdAt?: string;
    /** Completed timestamp */
    completedAt?: string;
}

/**
 * Run - execution log for work items.
 */
export interface FireRun {
    /** Run ID (run-NNN format) */
    id: string;
    /** Run scope */
    scope: RunScope;
    /** Work items in this run */
    workItems: RunWorkItem[];
    /** Currently executing work item ID */
    currentItem: string | null;
    /** Run folder path */
    folderPath: string;
    /** Started timestamp */
    startedAt: string;
    /** Completed timestamp */
    completedAt?: string;
    /** Whether run has plan.md */
    hasPlan: boolean;
    /** Whether run has walkthrough.md */
    hasWalkthrough: boolean;
    /** Whether run has test-report.md */
    hasTestReport: boolean;
}

/**
 * Work item reference in a run.
 */
export interface RunWorkItem {
    /** Work item ID */
    id: string;
    /** Parent intent ID */
    intentId: string;
    /** Execution mode */
    mode: ExecutionMode;
    /** Status within the run */
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Standard document.
 */
export interface FireStandard {
    /** Standard type (constitution, tech-stack, etc.) */
    type: 'constitution' | 'tech-stack' | 'coding-standards' | 'testing-standards' | 'system-architecture';
    /** File path */
    filePath: string;
    /** Whether this is from root or module level */
    scope: 'root' | 'module';
    /** Module path if scope is 'module' */
    modulePath?: string;
}

// =============================================================================
// State Types
// =============================================================================

/**
 * Project info from state.yaml.
 */
export interface FireProject {
    name: string;
    description?: string;
    created: string;
    fireVersion: string;
}

/**
 * Workspace settings from state.yaml.
 */
export interface FireWorkspace {
    type: WorkspaceType;
    structure: WorkspaceStructure;
    autonomyBias: AutonomyBias;
    runScopePreference: RunScope;
    scannedAt?: string;
    parts?: string[];
}

/**
 * Active run info from state.yaml.
 */
export interface FireActiveRun {
    id: string;
    scope: RunScope;
    workItems: RunWorkItem[];
    currentItem: string;
    started: string;
}

/**
 * FIRE state.yaml parsed structure.
 */
export interface FireState {
    project: FireProject;
    workspace: FireWorkspace;
    intents: FireStateIntent[];
    runs: {
        active: FireActiveRun[];
        completed: CompletedRun[];
    };
}

/**
 * Intent as stored in state.yaml.
 */
export interface FireStateIntent {
    id: string;
    title: string;
    status: FireStatus;
    workItems: FireStateWorkItem[];
}

/**
 * Work item as stored in state.yaml.
 */
export interface FireStateWorkItem {
    id: string;
    status: FireStatus;
    mode?: ExecutionMode;
}

/**
 * Completed run record.
 */
export interface CompletedRun {
    id: string;
    workItems: RunWorkItem[];
    completed: string;
}

// =============================================================================
// Aggregated Model
// =============================================================================

/**
 * Complete FIRE artifacts model.
 * Combines parsed state.yaml with filesystem artifacts.
 */
export interface FireArtifacts {
    /** Whether this is a valid FIRE project */
    isProject: boolean;
    /** Root path to .specs-fire folder */
    rootPath: string;
    /** Workspace root path */
    workspacePath: string;
    /** FIRE flow version */
    version: string;
    /** Project info */
    project: FireProject | null;
    /** Workspace settings */
    workspace: FireWorkspace | null;
    /** All intents with their work items */
    intents: FireIntent[];
    /** All runs (active and completed) */
    runs: FireRun[];
    /** Active runs (supports multiple parallel runs) */
    activeRuns: FireRun[];
    /** Standards documents */
    standards: FireStandard[];
}

// =============================================================================
// UI State Types
// =============================================================================

/**
 * Tab identifiers for FIRE UI.
 */
export type FireTabId = 'runs' | 'intents' | 'overview';

/**
 * Filter for runs view.
 */
export type RunsFilter = 'all' | 'active' | 'completed';

/**
 * Filter for intents view.
 */
export type IntentsFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'blocked';

/**
 * UI state for FIRE flow.
 */
export interface FireUIState {
    activeTab: FireTabId;
    runsFilter: RunsFilter;
    intentsFilter: IntentsFilter;
    expandedIntents: string[];
    selectedRunId: string | null;
}

/**
 * Default UI state.
 */
export const DEFAULT_FIRE_UI_STATE: FireUIState = {
    activeTab: 'runs',
    runsFilter: 'all',
    intentsFilter: 'all',
    expandedIntents: [],
    selectedRunId: null
};

// =============================================================================
// Stats Types
// =============================================================================

/**
 * Statistics for FIRE dashboard.
 */
export interface FireStats {
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
    activeRunsCount: number;
}

/**
 * Calculate stats from artifacts.
 */
export function calculateFireStats(artifacts: FireArtifacts): FireStats {
    const intents = artifacts.intents;
    const workItems = intents.flatMap(i => i.workItems);
    const runs = artifacts.runs;

    return {
        totalIntents: intents.length,
        completedIntents: intents.filter(i => i.status === 'completed').length,
        inProgressIntents: intents.filter(i => i.status === 'in_progress').length,
        pendingIntents: intents.filter(i => i.status === 'pending').length,
        totalWorkItems: workItems.length,
        completedWorkItems: workItems.filter(w => w.status === 'completed').length,
        inProgressWorkItems: workItems.filter(w => w.status === 'in_progress').length,
        pendingWorkItems: workItems.filter(w => w.status === 'pending').length,
        totalRuns: runs.length,
        completedRuns: runs.filter(r => r.completedAt != null).length,
        activeRunsCount: artifacts.activeRuns.length
    };
}

// =============================================================================
// Webview Snapshot
// =============================================================================

/**
 * Snapshot of FIRE state for webview rendering.
 */
export interface FireWebviewSnapshot {
    /** Project info */
    project: FireProject | null;
    /** Workspace settings */
    workspace: FireWorkspace | null;
    /** All intents */
    intents: FireIntent[];
    /** Active runs (supports multiple parallel runs) */
    activeRuns: FireRun[];
    /** Completed runs */
    completedRuns: FireRun[];
    /** Standards */
    standards: FireStandard[];
    /** Statistics */
    stats: FireStats;
    /** UI state */
    ui: FireUIState;
}
