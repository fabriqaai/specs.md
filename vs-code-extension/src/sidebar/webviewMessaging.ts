/**
 * PostMessage communication types and handlers for webview.
 */

/**
 * Message types from webview to extension.
 */
/**
 * Specs filter - 'all' or any unit status string discovered from parsed data.
 */
export type SpecsFilter = string;

export type WebviewToExtensionMessage =
    | { type: 'ready' }
    | { type: 'tabChange'; tab: TabId }
    | { type: 'openArtifact'; kind: string; path: string }
    | { type: 'refresh' }
    | { type: 'toggleFocus'; expanded: boolean }
    | { type: 'activityFilter'; filter: ActivityFilter }
    | { type: 'specsFilter'; filter: SpecsFilter }
    | { type: 'activityResize'; height: number }
    | { type: 'startBolt'; boltId: string }
    | { type: 'continueBolt'; boltId: string; boltName?: string }
    | { type: 'viewBoltFiles'; boltId: string }
    | { type: 'openBoltMd'; boltId: string }
    | { type: 'openExternal'; url: string };

/**
 * Activity filter options.
 */
export type ActivityFilter = 'all' | 'stages' | 'bolts';

/**
 * Message types from extension to webview.
 */
export type ExtensionToWebviewMessage =
    | { type: 'update'; data: WebviewData }
    | { type: 'setTab'; tab: TabId };

/**
 * Tab identifiers.
 */
export type TabId = 'bolts' | 'specs' | 'overview';

/**
 * Data structure sent to webview for rendering.
 */
export interface WebviewData {
    /** Current intent information */
    currentIntent: {
        name: string;
        number: string;
    } | null;

    /** Bolt statistics */
    stats: {
        active: number;
        queued: number;
        done: number;
        blocked: number;
    };

    /** Active bolts (Current Focus) - supports multiple */
    activeBolts: ActiveBoltData[];

    /** Up Next queue */
    upNextQueue: QueuedBoltData[];

    /** Recently completed bolts */
    completedBolts: CompletedBoltData[];

    /** Recent activity events */
    activityEvents: ActivityEventData[];

    /** All intents for specs view */
    intents: IntentData[];

    /** All standards */
    standards: StandardData[];

    /** Suggested next actions */
    nextActions: NextActionData[];

    /** UI State: Focus card expanded */
    focusCardExpanded: boolean;

    /** UI State: Activity filter */
    activityFilter: ActivityFilter;

    /** UI State: Activity section height */
    activityHeight: number;

    /** UI State: Specs filter */
    specsFilter: SpecsFilter;

    /** Available unit statuses discovered from parsed data */
    availableStatuses: string[];
}

/**
 * Active bolt data for Current Focus section.
 */
export interface ActiveBoltData {
    id: string;
    name: string;
    type: string;
    currentStage: string | null;
    stagesComplete: number;
    stagesTotal: number;
    storiesComplete: number;
    storiesTotal: number;
    stages: {
        name: string;
        status: 'complete' | 'active' | 'pending';
    }[];
    stories: {
        id: string;
        name: string;
        status: 'complete' | 'active' | 'pending';
    }[];
}

/**
 * Queued bolt data for Up Next section.
 */
export interface QueuedBoltData {
    id: string;
    name: string;
    type: string;
    storiesCount: number;
    isBlocked: boolean;
    blockedBy: string[];
    unblocksCount: number;
    stages: {
        name: string;
        status: 'complete' | 'active' | 'pending';
    }[];
    stories: {
        id: string;
        name: string;
        status: 'complete' | 'active' | 'pending';
    }[];
}

/**
 * Activity event data for Recent Activity section.
 */
export interface ActivityEventData {
    id: string;
    type: 'bolt-created' | 'bolt-start' | 'stage-complete' | 'bolt-complete';
    text: string;
    target: string;
    tag: 'bolt' | 'stage';
    relativeTime: string;
    /** Exact timestamp for tooltip display */
    exactTime: string;
    /** Path to the relevant file for opening */
    path?: string;
}

/**
 * Intent data for Specs view.
 */
export interface IntentData {
    name: string;
    number: string;
    path: string;
    storiesComplete: number;
    storiesTotal: number;
    units: UnitData[];
}

/**
 * Unit data for Specs view.
 */
export interface UnitData {
    name: string;
    path: string;
    status: string;  // Raw status from frontmatter (e.g., 'draft', 'in-progress', 'complete')
    storiesComplete: number;
    storiesTotal: number;
    stories: StoryData[];
}

/**
 * Story data for Specs view.
 */
export interface StoryData {
    id: string;
    title: string;
    path: string;
    status: string;  // Raw status from frontmatter
}

/**
 * Standard data for Overview view.
 */
export interface StandardData {
    name: string;
    path: string;
}

/**
 * Artifact file data for completed bolts.
 */
export interface ArtifactFileData {
    name: string;
    path: string;
    type: 'walkthrough' | 'test-report' | 'plan' | 'design' | 'other';
}

/**
 * Completed bolt data for Recent Completions section.
 */
export interface CompletedBoltData {
    id: string;
    name: string;
    type: string;
    completedAt: string;
    relativeTime: string;
    path: string;
    files: ArtifactFileData[];
}

/**
 * Next action types for suggested actions.
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
 * Next action data for Suggested Actions section.
 */
export interface NextActionData {
    type: NextActionType;
    priority: number;
    title: string;
    description: string;
    targetId?: string;
    targetName?: string;
}

/**
 * Default tab to show when no state is saved.
 */
export const DEFAULT_TAB: TabId = 'bolts';

/**
 * Workspace state key for persisting active tab.
 */
export const TAB_STATE_KEY = 'specsmd.activeTab';

/**
 * Workspace state key for focus card expanded state.
 */
export const FOCUS_EXPANDED_KEY = 'specsmd.focusCardExpanded';

/**
 * Workspace state key for activity filter.
 */
export const ACTIVITY_FILTER_KEY = 'specsmd.activityFilter';

/**
 * Workspace state key for activity section height.
 */
export const ACTIVITY_HEIGHT_KEY = 'specsmd.activityHeight';

/**
 * Workspace state key for specs filter.
 */
export const SPECS_FILTER_KEY = 'specsmd.specsFilter';

/**
 * Default activity filter.
 */
export const DEFAULT_ACTIVITY_FILTER: ActivityFilter = 'all';

/**
 * Default specs filter.
 */
export const DEFAULT_SPECS_FILTER: SpecsFilter = 'all';

/**
 * Default activity section height.
 */
export const DEFAULT_ACTIVITY_HEIGHT = 200;

/**
 * Minimum activity section height.
 */
export const MIN_ACTIVITY_HEIGHT = 120;

/**
 * Maximum activity section height.
 */
export const MAX_ACTIVITY_HEIGHT = 500;
