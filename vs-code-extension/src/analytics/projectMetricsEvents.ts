/**
 * Project Metrics Events
 *
 * Tracks project structure snapshots and changes for analytics.
 * Includes debouncing and rate limiting to prevent event spam.
 *
 * Events:
 * - project_snapshot: Captures project state once per activation
 * - project_changed: Tracks meaningful changes with debouncing/rate limiting
 */

import { tracker } from './tracker';
import type { MemoryBankModel, Bolt } from '../parser/types';
import { ArtifactStatus } from '../parser/types';
import type { EventProperties } from './types';

// ============================================
// Event Names
// ============================================

export const PROJECT_EVENTS = {
    SNAPSHOT: 'project_snapshot',
    CHANGED: 'project_changed',
} as const;

// ============================================
// Types
// ============================================

/**
 * Snapshot of project entity counts
 */
export interface ProjectCounts {
    intentCount: number;
    unitCount: number;
    storyCount: number;
    boltCount: number;
    activeBolts: number;
    queuedBolts: number;
    completedBolts: number;
    blockedBolts: number;
}

/**
 * Properties for project_snapshot event
 */
export interface ProjectSnapshotEventProperties {
    intent_count: number;
    unit_count: number;
    story_count: number;
    bolt_count: number;
    active_bolts: number;
    queued_bolts: number;
    completed_bolts: number;
    blocked_bolts: number;
    avg_units_per_intent: number;
    avg_stories_per_unit: number;
}

/**
 * Change type categories
 */
export type ProjectChangeType =
    | 'bolt_added'
    | 'bolt_completed'
    | 'intent_added'
    | 'story_added'
    | 'entities_removed';

/**
 * Properties for project_changed event
 */
export interface ProjectChangedEventProperties {
    change_type: ProjectChangeType;
    // Deltas (only non-zero values included)
    intents_delta?: number;
    units_delta?: number;
    stories_delta?: number;
    bolts_delta?: number;
    active_bolts_delta?: number;
    completed_bolts_delta?: number;
    // New totals
    intent_count: number;
    unit_count: number;
    story_count: number;
    bolt_count: number;
}

// ============================================
// Configuration
// ============================================

/** Debounce window in milliseconds (5 seconds) */
const DEBOUNCE_MS = 5000;

/** Maximum events per rate limit window */
const RATE_LIMIT_MAX = 5;

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60000;

// ============================================
// ProjectMetricsTracker Class
// ============================================

/**
 * Stateful tracker for project metrics with debouncing and rate limiting.
 *
 * Singleton pattern matching other analytics modules.
 */
class ProjectMetricsTracker {
    private static instance: ProjectMetricsTracker | null = null;

    /** Last snapshot for delta comparison */
    private lastSnapshot: ProjectCounts | null = null;

    /** Debounce timer handle */
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;

    /** Timestamps of recent emissions for rate limiting */
    private emitTimestamps: number[] = [];

    /** Pending counts waiting for debounce to complete */
    private pendingCounts: ProjectCounts | null = null;

    private constructor() {
        // Singleton - use getInstance()
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): ProjectMetricsTracker {
        if (!ProjectMetricsTracker.instance) {
            ProjectMetricsTracker.instance = new ProjectMetricsTracker();
        }
        return ProjectMetricsTracker.instance;
    }

    /**
     * Reset the singleton instance (for testing only)
     */
    public static resetInstance(): void {
        if (ProjectMetricsTracker.instance) {
            ProjectMetricsTracker.instance.dispose();
        }
        ProjectMetricsTracker.instance = null;
    }

    /**
     * Initialize with project snapshot on activation.
     * Should be called once after initial scanMemoryBank.
     *
     * @param model - The parsed memory bank model
     */
    public init(model: MemoryBankModel): void {
        if (!model.isProject) {
            return;
        }

        const counts = this.extractCounts(model);
        this.lastSnapshot = counts;

        // Track initial snapshot
        trackProjectSnapshot(counts, model);
    }

    /**
     * Handle scan completion from file watcher.
     * Debounces and rate-limits project_changed events.
     *
     * @param model - The parsed memory bank model
     */
    public onScanComplete(model: MemoryBankModel): void {
        if (!model.isProject) {
            return;
        }

        const counts = this.extractCounts(model);
        this.pendingCounts = counts;

        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new debounce timer
        this.debounceTimer = setTimeout(() => {
            this.checkAndEmit();
            this.debounceTimer = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Check for changes and emit event if changed and not rate limited.
     */
    private checkAndEmit(): void {
        if (!this.pendingCounts) {
            return;
        }

        const counts = this.pendingCounts;
        this.pendingCounts = null;

        // Check rate limit
        if (this.isRateLimited()) {
            return; // Silently drop
        }

        // Check if actually changed
        if (!this.hasChanged(counts)) {
            return;
        }

        // Emit change event
        const changeType = this.detectChangeType(this.lastSnapshot!, counts);
        trackProjectChanged(this.lastSnapshot!, counts, changeType);

        // Record emission and update snapshot
        this.emitTimestamps.push(Date.now());
        this.lastSnapshot = counts;
    }

    /**
     * Check if we're at the rate limit.
     * Uses sliding window approach.
     */
    private isRateLimited(): boolean {
        const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;

        // Clean up old timestamps
        this.emitTimestamps = this.emitTimestamps.filter(t => t > cutoff);

        // Check if at limit
        return this.emitTimestamps.length >= RATE_LIMIT_MAX;
    }

    /**
     * Check if counts have changed from last snapshot.
     */
    private hasChanged(counts: ProjectCounts): boolean {
        if (!this.lastSnapshot) {
            return true;
        }

        return (
            counts.intentCount !== this.lastSnapshot.intentCount ||
            counts.unitCount !== this.lastSnapshot.unitCount ||
            counts.storyCount !== this.lastSnapshot.storyCount ||
            counts.boltCount !== this.lastSnapshot.boltCount ||
            counts.activeBolts !== this.lastSnapshot.activeBolts ||
            counts.queuedBolts !== this.lastSnapshot.queuedBolts ||
            counts.completedBolts !== this.lastSnapshot.completedBolts ||
            counts.blockedBolts !== this.lastSnapshot.blockedBolts
        );
    }

    /**
     * Detect the type of change that occurred.
     */
    private detectChangeType(prev: ProjectCounts, curr: ProjectCounts): ProjectChangeType {
        // Priority order: completed bolts > new bolts > new intents > new stories > removed
        if (curr.completedBolts > prev.completedBolts) {
            return 'bolt_completed';
        }
        if (curr.boltCount > prev.boltCount) {
            return 'bolt_added';
        }
        if (curr.intentCount > prev.intentCount) {
            return 'intent_added';
        }
        if (curr.storyCount > prev.storyCount) {
            return 'story_added';
        }
        return 'entities_removed';
    }

    /**
     * Extract counts from memory bank model.
     */
    private extractCounts(model: MemoryBankModel): ProjectCounts {
        let unitCount = 0;
        let storyCount = 0;

        for (const intent of model.intents) {
            unitCount += intent.units.length;
            for (const unit of intent.units) {
                storyCount += unit.stories.length;
            }
        }

        // Count bolt statuses
        const boltStatusCounts = this.countBoltStatuses(model.bolts);

        return {
            intentCount: model.intents.length,
            unitCount,
            storyCount,
            boltCount: model.bolts.length,
            ...boltStatusCounts,
        };
    }

    /**
     * Count bolts by status category.
     */
    private countBoltStatuses(bolts: Bolt[]): {
        activeBolts: number;
        queuedBolts: number;
        completedBolts: number;
        blockedBolts: number;
    } {
        let activeBolts = 0;
        let queuedBolts = 0;
        let completedBolts = 0;
        let blockedBolts = 0;

        for (const bolt of bolts) {
            if (bolt.isBlocked) {
                blockedBolts++;
            } else if (bolt.status === ArtifactStatus.Complete) {
                completedBolts++;
            } else if (bolt.status === ArtifactStatus.InProgress) {
                activeBolts++;
            } else {
                // Draft, Unknown, or other = queued
                queuedBolts++;
            }
        }

        return { activeBolts, queuedBolts, completedBolts, blockedBolts };
    }

    /**
     * Clean up resources.
     * Must be called on extension deactivation.
     */
    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.pendingCounts = null;
        this.emitTimestamps = [];
        // Don't clear lastSnapshot - allows re-init if needed
    }

    // ============================================
    // Testing Helpers
    // ============================================

    /**
     * Get current debounce delay (for testing)
     */
    public static getDebounceMs(): number {
        return DEBOUNCE_MS;
    }

    /**
     * Get rate limit config (for testing)
     */
    public static getRateLimitConfig(): { max: number; windowMs: number } {
        return { max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS };
    }

    /**
     * Get last snapshot (for testing)
     */
    public getLastSnapshot(): ProjectCounts | null {
        return this.lastSnapshot;
    }

    /**
     * Get emit timestamps count (for testing)
     */
    public getEmitCount(): number {
        const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
        this.emitTimestamps = this.emitTimestamps.filter(t => t > cutoff);
        return this.emitTimestamps.length;
    }

    /**
     * Force emit (for testing) - bypasses debounce
     */
    public forceEmit(model: MemoryBankModel): void {
        if (!model.isProject) {
            return;
        }
        this.pendingCounts = this.extractCounts(model);
        this.checkAndEmit();
    }
}

// ============================================
// Tracking Functions
// ============================================

/**
 * Track project snapshot event.
 * Called once per activation for specsmd projects.
 *
 * @param counts - The project entity counts
 * @param model - The memory bank model (for aggregate calculations)
 */
function trackProjectSnapshot(counts: ProjectCounts, _model: MemoryBankModel): void {
    try {
        // Calculate averages
        const avgUnitsPerIntent = counts.intentCount > 0
            ? Math.round((counts.unitCount / counts.intentCount) * 100) / 100
            : 0;
        const avgStoriesPerUnit = counts.unitCount > 0
            ? Math.round((counts.storyCount / counts.unitCount) * 100) / 100
            : 0;

        const properties: EventProperties = {
            intent_count: counts.intentCount,
            unit_count: counts.unitCount,
            story_count: counts.storyCount,
            bolt_count: counts.boltCount,
            active_bolts: counts.activeBolts,
            queued_bolts: counts.queuedBolts,
            completed_bolts: counts.completedBolts,
            blocked_bolts: counts.blockedBolts,
            avg_units_per_intent: avgUnitsPerIntent,
            avg_stories_per_unit: avgStoriesPerUnit,
        };

        tracker.track(PROJECT_EVENTS.SNAPSHOT, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track project changed event.
 * Called when entity counts change (debounced and rate limited).
 *
 * @param prev - Previous counts
 * @param curr - Current counts
 * @param changeType - Detected type of change
 */
function trackProjectChanged(
    prev: ProjectCounts,
    curr: ProjectCounts,
    changeType: ProjectChangeType
): void {
    try {
        const properties: EventProperties = {
            change_type: changeType,
            intent_count: curr.intentCount,
            unit_count: curr.unitCount,
            story_count: curr.storyCount,
            bolt_count: curr.boltCount,
        };

        // Add non-zero deltas
        const intentsDelta = curr.intentCount - prev.intentCount;
        const unitsDelta = curr.unitCount - prev.unitCount;
        const storiesDelta = curr.storyCount - prev.storyCount;
        const boltsDelta = curr.boltCount - prev.boltCount;
        const activeBoltsDelta = curr.activeBolts - prev.activeBolts;
        const completedBoltsDelta = curr.completedBolts - prev.completedBolts;

        if (intentsDelta !== 0) {
            properties.intents_delta = intentsDelta;
        }
        if (unitsDelta !== 0) {
            properties.units_delta = unitsDelta;
        }
        if (storiesDelta !== 0) {
            properties.stories_delta = storiesDelta;
        }
        if (boltsDelta !== 0) {
            properties.bolts_delta = boltsDelta;
        }
        if (activeBoltsDelta !== 0) {
            properties.active_bolts_delta = activeBoltsDelta;
        }
        if (completedBoltsDelta !== 0) {
            properties.completed_bolts_delta = completedBoltsDelta;
        }

        tracker.track(PROJECT_EVENTS.CHANGED, properties);
    } catch {
        // Silent failure
    }
}

// ============================================
// Exports
// ============================================

/** Singleton instance */
export const projectMetricsTracker = ProjectMetricsTracker.getInstance();

/** Export class for testing */
export { ProjectMetricsTracker };
