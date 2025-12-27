/**
 * Activity feed derivation functions.
 * Derives activity events from bolt timestamps for the command center UI.
 */

import { Bolt, ActivityEvent, ActivityEventType } from './types';

/**
 * Icon mapping for activity event types.
 */
const EVENT_ICONS: Record<ActivityEventType, { icon: string; iconClass: string }> = {
    'bolt-created': { icon: '+', iconClass: 'bolt-created' },
    'bolt-start': { icon: '▶', iconClass: 'bolt-start' },
    'stage-complete': { icon: '✓', iconClass: 'stage-complete' },
    'bolt-complete': { icon: '✔', iconClass: 'bolt-complete' }
};

/**
 * Creates a display name for a bolt.
 * Extracts unit and number from bolt ID like "bolt-artifact-parser-1".
 */
function getBoltDisplayName(boltId: string): string {
    // Remove "bolt-" prefix if present
    const withoutPrefix = boltId.replace(/^bolt-/, '');
    return withoutPrefix;
}

/**
 * Creates an activity event.
 */
function createEvent(
    type: ActivityEventType,
    bolt: Bolt,
    timestamp: Date,
    stageName?: string
): ActivityEvent {
    const iconData = EVENT_ICONS[type];
    let text: string;
    let id: string;
    let tag: 'bolt' | 'stage';

    switch (type) {
        case 'bolt-created':
            text = `Created <strong>${getBoltDisplayName(bolt.id)}</strong>`;
            id = `${bolt.id}-created`;
            tag = 'bolt';
            break;
        case 'bolt-start':
            text = `Started <strong>${getBoltDisplayName(bolt.id)}</strong>`;
            id = `${bolt.id}-started`;
            tag = 'bolt';
            break;
        case 'stage-complete':
            text = `Completed <strong>${stageName}</strong> stage in ${getBoltDisplayName(bolt.id)}`;
            id = `${bolt.id}-stage-${stageName}`;
            tag = 'stage';
            break;
        case 'bolt-complete':
            text = `Completed <strong>${getBoltDisplayName(bolt.id)}</strong>`;
            id = `${bolt.id}-completed`;
            tag = 'bolt';
            break;
    }

    return {
        id,
        type,
        timestamp,
        icon: iconData.icon,
        iconClass: iconData.iconClass,
        text,
        targetId: bolt.id,
        targetName: getBoltDisplayName(bolt.id),
        tag,
        path: bolt.filePath
    };
}

/**
 * Builds an activity feed from bolt timestamps.
 * Derives events from created, started, completed, and stage completion timestamps.
 *
 * @param bolts - Array of bolts with timestamp fields
 * @returns Array of ActivityEvents sorted by timestamp descending (most recent first)
 */
export function buildActivityFeed(bolts: Bolt[]): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    for (const bolt of bolts) {
        // bolt-created event
        if (bolt.createdAt) {
            events.push(createEvent('bolt-created', bolt, bolt.createdAt));
        }

        // bolt-start event
        if (bolt.startedAt) {
            events.push(createEvent('bolt-start', bolt, bolt.startedAt));
        }

        // stage-complete events from stages array
        for (const stage of bolt.stages) {
            if (stage.completedAt) {
                events.push(
                    createEvent('stage-complete', bolt, stage.completedAt, stage.name)
                );
            }
        }

        // bolt-complete event
        if (bolt.completedAt) {
            events.push(createEvent('bolt-complete', bolt, bolt.completedAt));
        }
    }

    // Sort by timestamp descending (most recent first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Filters activity events by tag.
 *
 * @param events - Array of activity events
 * @param tag - Tag to filter by ('bolt' or 'stage'), or 'all' for no filtering
 * @returns Filtered array of events
 */
export function filterActivityEvents(
    events: ActivityEvent[],
    tag: 'all' | 'bolt' | 'stage'
): ActivityEvent[] {
    if (tag === 'all') {
        return events;
    }
    return events.filter(e => e.tag === tag);
}

/**
 * Limits activity events to most recent N items.
 *
 * @param events - Array of activity events (should already be sorted)
 * @param limit - Maximum number of events to return
 * @returns Array limited to specified count
 */
export function limitActivityEvents(events: ActivityEvent[], limit: number): ActivityEvent[] {
    return events.slice(0, limit);
}

/**
 * Formats a relative time string for display.
 * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "3d ago"
 *
 * @param timestamp - Date to format
 * @param now - Reference time (defaults to current time)
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(timestamp: Date, now: Date = new Date()): string {
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'Just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    // For older events, show the date
    return timestamp.toLocaleDateString();
}
