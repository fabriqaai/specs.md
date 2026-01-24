/**
 * Analytics Types
 *
 * TypeScript interfaces for the analytics module.
 */

/**
 * IDE information detected from VS Code environment
 */
export interface IDEInfo {
    /** Normalized IDE name (e.g., 'vscode', 'cursor', 'windsurf') */
    name: string;
    /** IDE version (e.g., '1.85.0') */
    version: string;
    /** IDE host environment (e.g., 'desktop', 'web', 'codespaces') */
    host: string;
}

/**
 * Base properties included with every analytics event
 */
export interface BaseProperties {
    /** Machine identifier (SHA-256 hash) */
    distinct_id: string;
    /** Session identifier (UUID v4) */
    session_id: string;
    /** Normalized IDE name */
    ide_name: string;
    /** IDE version */
    ide_version: string;
    /** IDE host environment */
    ide_host: string;
    /** Operating system platform */
    platform: string;
    /** User locale */
    locale: string;
    /** Extension version */
    extension_version: string;
}

/**
 * Analytics event properties
 */
export type EventProperties = Record<string, unknown>;

/**
 * Mixpanel-compatible tracking interface
 */
export interface MixpanelLike {
    track(eventName: string, properties: Record<string, unknown>, callback?: (err?: Error) => void): void;
}

/**
 * Activation trigger types
 */
export type ActivationTrigger = 'workspace' | 'command' | 'uri' | 'unknown';

/**
 * Properties for extension activation event
 */
export interface ActivationEventProperties {
    /** Whether the workspace is a specsmd project */
    is_specsmd_project: boolean;
    /** Whether this is the first-ever activation */
    is_first_activation: boolean;
    /** What triggered the activation */
    activation_trigger: ActivationTrigger;
}

/**
 * Error category types for categorized error tracking
 */
export type ErrorCategory = 'activation' | 'parse' | 'file_op' | 'webview' | 'command';

/**
 * Properties for error tracking event
 */
export interface ErrorEventProperties {
    /** Category of the error */
    error_category: ErrorCategory;
    /** Error code (generic, no PII) */
    error_code: string;
    /** Component where error occurred */
    component: string;
    /** Whether the extension recovered from the error */
    recoverable: boolean;
}

/**
 * Properties for welcome install completed event
 */
export interface WelcomeInstallCompletedProperties {
    /** Duration from install click to completion in milliseconds */
    duration_ms?: number;
}

/**
 * Properties for welcome view displayed event
 */
export interface WelcomeViewDisplayedProperties {
    /** Whether a workspace folder is open */
    has_workspace: boolean;
}

// ============================================
// Engagement Event Types
// ============================================

/**
 * Flow type identifier for analytics
 */
export type FlowType = 'aidlc' | 'fire';

/**
 * Tab identifiers for navigation tracking.
 * Includes both AI-DLC tabs (bolts, specs, overview) and FIRE tabs (runs, intents, overview).
 */
export type TabId = 'bolts' | 'specs' | 'overview' | 'runs' | 'intents';

/**
 * Bolt action types for interaction tracking
 */
export type BoltAction = 'start' | 'continue' | 'view_files' | 'open_md';

/**
 * Normalized bolt types for analytics
 */
export type BoltType = 'DDD' | 'Simple' | 'Spike' | 'unknown';

/**
 * Normalized bolt status for analytics
 */
export type BoltStatus = 'active' | 'queued' | 'completed' | 'unknown';

/**
 * Artifact types that can be opened
 */
export type ArtifactType = 'bolt' | 'unit' | 'story' | 'intent' | 'standard';

/**
 * Filter types in the explorer view
 */
export type FilterType = 'activity' | 'specs' | 'runs' | 'intents';

/**
 * Properties for tab changed event
 */
export interface TabChangedEventProperties {
    /** Previous tab (null on first navigation) */
    from_tab: TabId | null;
    /** New active tab */
    to_tab: TabId;
}

/**
 * Properties for bolt action event
 */
export interface BoltActionEventProperties {
    /** Type of action performed */
    action: BoltAction;
    /** Normalized bolt type */
    bolt_type: BoltType;
    /** Current bolt status */
    bolt_status: BoltStatus;
}

/**
 * Properties for artifact opened event
 */
export interface ArtifactOpenedEventProperties {
    /** Type of artifact opened */
    artifact_type: ArtifactType;
    /** Which view the artifact was opened from */
    source: TabId;
}

/**
 * Properties for filter changed event
 */
export interface FilterChangedEventProperties {
    /** Type of filter changed */
    filter_type: FilterType;
    /** New filter value (sanitized) */
    filter_value: string;
}

// ============================================
// Project Metrics Event Types
// ============================================

/**
 * Snapshot of project entity counts (internal)
 */
export interface ProjectCounts {
    /** Number of intents */
    intentCount: number;
    /** Number of units across all intents */
    unitCount: number;
    /** Number of stories across all units */
    storyCount: number;
    /** Total number of bolts */
    boltCount: number;
    /** Bolts currently in-progress */
    activeBolts: number;
    /** Bolts pending (draft/unknown) */
    queuedBolts: number;
    /** Bolts completed */
    completedBolts: number;
    /** Bolts blocked by dependencies */
    blockedBolts: number;
}

/**
 * Properties for project_snapshot event
 */
export interface ProjectSnapshotEventProperties {
    /** Number of intents */
    intent_count: number;
    /** Number of units */
    unit_count: number;
    /** Number of stories */
    story_count: number;
    /** Number of bolts */
    bolt_count: number;
    /** Bolts in-progress */
    active_bolts: number;
    /** Bolts pending */
    queued_bolts: number;
    /** Bolts completed */
    completed_bolts: number;
    /** Bolts blocked */
    blocked_bolts: number;
    /** Average units per intent */
    avg_units_per_intent: number;
    /** Average stories per unit */
    avg_stories_per_unit: number;
}

/**
 * Change type categories for project_changed event
 */
export type ProjectChangeType =
    | 'bolt_added'
    | 'bolt_completed'
    | 'intent_added'
    | 'unit_added'
    | 'story_added'
    | 'counts_changed';

/**
 * Properties for project_changed event
 */
export interface ProjectChangedEventProperties {
    /** Type of change detected */
    change_type: ProjectChangeType;
    /** Delta in intent count (if non-zero) */
    intents_delta?: number;
    /** Delta in unit count (if non-zero) */
    units_delta?: number;
    /** Delta in story count (if non-zero) */
    stories_delta?: number;
    /** Delta in bolt count (if non-zero) */
    bolts_delta?: number;
    /** Delta in active bolts (if non-zero) */
    active_bolts_delta?: number;
    /** Delta in completed bolts (if non-zero) */
    completed_bolts_delta?: number;
    /** New total intent count */
    intent_count: number;
    /** New total unit count */
    unit_count: number;
    /** New total story count */
    story_count: number;
    /** New total bolt count */
    bolt_count: number;
}
