/**
 * FIRE Flow Engagement Events
 *
 * Helper functions for tracking user engagement with the FIRE flow view
 * including tab navigation, run actions, artifact access, and filter usage.
 */

import { tracker } from './tracker';
import type { EventProperties, FlowType } from './types';

/** Flow type constant for FIRE events */
const FLOW_TYPE: FlowType = 'fire';

// FIRE-specific event names
export const FIRE_EVENTS = {
    TAB_CHANGED: 'ext_fire_tab_changed',
    RUN_STARTED: 'ext_fire_run_started',
    RUN_CONTINUED: 'ext_fire_run_continued',
    ARTIFACT_VIEWED: 'ext_fire_artifact_viewed',
    WORK_ITEM_OPENED: 'ext_fire_work_item_opened',
    FILTER_CHANGED: 'ext_fire_filter_changed',
    INTENT_TOGGLED: 'ext_fire_intent_toggled',
} as const;

/** FIRE tab types */
export type FireTabId = 'overview' | 'runs' | 'intents';

/** FIRE run scope */
export type FireRunScope = 'single' | 'batch' | 'wide';

/** FIRE artifact type */
export type FireArtifactType = 'plan' | 'test-report' | 'walkthrough' | 'run-folder';

/**
 * Track FIRE tab navigation event
 *
 * @param fromTab - Previous tab (null on first navigation)
 * @param toTab - New active tab
 */
export function trackFireTabChanged(
    fromTab: FireTabId | null,
    toTab: FireTabId
): void {
    try {
        if (fromTab === toTab) {
            return;
        }

        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            from_tab: fromTab,
            to_tab: toTab,
        };

        tracker.track(FIRE_EVENTS.TAB_CHANGED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track run started event
 *
 * @param workItemCount - Number of work items in the run
 * @param scope - Run scope (single, batch, wide)
 */
export function trackFireRunStarted(
    workItemCount: number,
    scope: FireRunScope = 'single'
): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            work_item_count: workItemCount,
            scope,
        };

        tracker.track(FIRE_EVENTS.RUN_STARTED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track run continued event
 *
 * @param runId - ID of the run being continued
 */
export function trackFireRunContinued(runId: string): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            run_id_hash: hashId(runId),
        };

        tracker.track(FIRE_EVENTS.RUN_CONTINUED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track artifact viewed event
 *
 * @param artifactType - Type of artifact viewed
 * @param runId - ID of the run the artifact belongs to
 */
export function trackFireArtifactViewed(
    artifactType: FireArtifactType,
    runId: string
): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            artifact_type: artifactType,
            run_id_hash: hashId(runId),
        };

        tracker.track(FIRE_EVENTS.ARTIFACT_VIEWED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track work item opened event
 *
 * @param source - Where the work item was opened from
 */
export function trackFireWorkItemOpened(
    source: 'runs' | 'intents' | 'overview'
): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            source,
        };

        tracker.track(FIRE_EVENTS.WORK_ITEM_OPENED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track filter changed event
 *
 * @param filterValue - New filter value (sanitized)
 */
export function trackFireFilterChanged(filterValue: string): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            filter_value: sanitizeFilterValue(filterValue),
            has_filter: filterValue.length > 0,
        };

        tracker.track(FIRE_EVENTS.FILTER_CHANGED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track intent expand/collapse toggle
 *
 * @param expanded - Whether the intent is now expanded
 */
export function trackFireIntentToggled(expanded: boolean): void {
    try {
        const properties: EventProperties = {
            flow_type: FLOW_TYPE,
            expanded,
        };

        tracker.track(FIRE_EVENTS.INTENT_TOGGLED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Hash an ID for privacy (we don't want to track actual IDs)
 */
function hashId(id: string): string {
    // Simple hash - just take first 8 chars of a basic hash
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Sanitize filter value to ensure no PII
 */
function sanitizeFilterValue(value: string): string {
    if (!value) {
        return '';
    }

    // Limit length and lowercase
    let sanitized = value.substring(0, 30).toLowerCase();

    // Keep only alphanumeric, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-z0-9_-]/g, '_');

    return sanitized;
}
