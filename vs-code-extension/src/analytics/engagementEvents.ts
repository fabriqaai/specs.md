/**
 * Engagement Events
 *
 * Helper functions for tracking user engagement with the explorer view
 * including tab navigation, bolt actions, artifact access, and filter usage.
 */

import { tracker } from './tracker';
import type {
    BoltAction,
    BoltType,
    BoltStatus,
    ArtifactType,
    TabId,
    FilterType,
    EventProperties,
} from './types';

// Event names
const ENGAGEMENT_EVENTS = {
    TAB_CHANGED: 'tab_changed',
    BOLT_ACTION: 'bolt_action',
    ARTIFACT_OPENED: 'artifact_opened',
    FILTER_CHANGED: 'filter_changed',
} as const;

/**
 * Track tab navigation event
 *
 * @param fromTab - Previous tab (null on first navigation)
 * @param toTab - New active tab
 */
export function trackTabChanged(
    fromTab: TabId | null,
    toTab: TabId
): void {
    try {
        // Don't track if navigating to same tab
        if (fromTab === toTab) {
            return;
        }

        const properties: EventProperties = {
            from_tab: fromTab,
            to_tab: toTab,
        };

        tracker.track(ENGAGEMENT_EVENTS.TAB_CHANGED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track bolt action event
 *
 * @param action - Type of action performed
 * @param boltType - Type of bolt (normalized)
 * @param boltStatus - Current status of the bolt
 */
export function trackBoltAction(
    action: BoltAction,
    boltType: BoltType,
    boltStatus: BoltStatus
): void {
    try {
        const properties: EventProperties = {
            action,
            bolt_type: boltType,
            bolt_status: boltStatus,
        };

        tracker.track(ENGAGEMENT_EVENTS.BOLT_ACTION, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track artifact opened event
 *
 * @param artifactType - Type of artifact opened
 * @param source - Which view the artifact was opened from
 */
export function trackArtifactOpened(
    artifactType: ArtifactType,
    source: TabId
): void {
    try {
        const properties: EventProperties = {
            artifact_type: artifactType,
            source,
        };

        tracker.track(ENGAGEMENT_EVENTS.ARTIFACT_OPENED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track filter changed event
 *
 * @param filterType - Type of filter changed
 * @param filterValue - New filter value
 */
export function trackFilterChanged(
    filterType: FilterType,
    filterValue: string
): void {
    try {
        const properties: EventProperties = {
            filter_type: filterType,
            filter_value: sanitizeFilterValue(filterValue),
        };

        tracker.track(ENGAGEMENT_EVENTS.FILTER_CHANGED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Normalize bolt type string to standard categories
 *
 * @param rawType - Raw bolt type from bolt metadata
 * @returns Normalized bolt type
 */
export function normalizeBoltType(rawType: string | undefined): BoltType {
    if (!rawType) {
        return 'unknown';
    }

    const lower = rawType.toLowerCase();

    if (lower.includes('ddd') || lower === 'ddd-construction-bolt') {
        return 'DDD';
    }

    if (lower.includes('simple') || lower === 'simple-construction-bolt') {
        return 'Simple';
    }

    if (lower.includes('spike') || lower === 'spike-bolt') {
        return 'Spike';
    }

    return 'unknown';
}

/**
 * Normalize bolt status to standard categories
 * Accepts both string and ArtifactStatus enum values.
 *
 * @param rawStatus - Raw status from bolt metadata (string or ArtifactStatus)
 * @returns Normalized bolt status
 */
export function normalizeBoltStatus(rawStatus: string | { toString(): string } | undefined): BoltStatus {
    if (!rawStatus) {
        return 'unknown';
    }

    // Convert to string if it's an enum or object
    const statusStr = typeof rawStatus === 'string' ? rawStatus : String(rawStatus);
    const lower = statusStr.toLowerCase();

    if (lower === 'in-progress' || lower === 'active') {
        return 'active';
    }

    if (lower === 'planned' || lower === 'queued' || lower === 'draft') {
        return 'queued';
    }

    if (lower === 'complete' || lower === 'completed' || lower === 'done') {
        return 'completed';
    }

    return 'unknown';
}

/**
 * Sanitize filter value to ensure no PII
 *
 * @param value - Raw filter value
 * @returns Sanitized filter value
 */
function sanitizeFilterValue(value: string): string {
    if (!value) {
        return 'unknown';
    }

    // Limit length
    let sanitized = value.substring(0, 30).toLowerCase();

    // Keep only alphanumeric, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-z0-9_-]/g, '_');

    return sanitized || 'unknown';
}

// Export event names for testing
export { ENGAGEMENT_EVENTS };
