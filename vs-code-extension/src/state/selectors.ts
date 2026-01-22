/**
 * State Selectors - Pure functions for computing derived values.
 *
 * Selectors follow the Single Responsibility Principle:
 * - Each selector computes one specific derived value
 * - Selectors are pure functions (same input → same output)
 * - Selectors can be composed to build complex derivations
 *
 * These functions are used by the StateStore to compute the `computed` state.
 */

import { Intent, Unit, Story, Bolt, Standard, ArtifactStatus, ActivityEvent } from '../parser/types';
import { buildActivityFeed } from '../parser/activityFeed';
import { computeBoltDependencies, getUpNextBolts } from '../parser/dependencyComputation';
import {
    ComputedState,
    ProgressMetrics,
    BoltStats,
    ActivityFilter,
    IntentContext
} from './types';

// ============================================================================
// Current Intent Selection
// ============================================================================

/**
 * Strategy for selecting the current intent.
 * Can be extended with different strategies (Open/Closed Principle).
 */
export type IntentSelectionStrategy = (intents: Intent[], bolts: Bolt[]) => Intent | null;

/**
 * Result of intent selection with context.
 */
export interface IntentSelectionResult {
    intent: Intent | null;
    context: IntentContext;
}

/**
 * Helper: Match intent by number, name, or combined format (e.g., "007-installer-analytics").
 */
function matchIntent(intent: Intent, identifier: string): boolean {
    const combined = `${intent.number}-${intent.name}`;
    return intent.number === identifier
        || intent.name === identifier
        || combined === identifier;
}

/**
 * Strategy 1: Intent containing the active bolt.
 * Shows the intent where work is currently happening.
 */
export const selectIntentByActiveBolt: IntentSelectionStrategy = (intents, bolts) => {
    if (intents.length === 0) {
        return null;
    }

    const activeBolt = bolts.find(b => b.status === ArtifactStatus.InProgress);
    if (activeBolt) {
        const intent = intents.find(i => matchIntent(i, activeBolt.intent));
        if (intent) {
            return intent;
        }
    }

    return null;
};

/**
 * Strategy 2: Intent with most recent activity.
 * Based on bolt timestamps (most recent created/started/completed).
 */
export const selectIntentByRecentActivity: IntentSelectionStrategy = (intents, bolts) => {
    if (intents.length === 0) {
        return null;
    }

    // Find the most recent timestamp across all bolts
    let mostRecentTime = 0;
    let mostRecentIntentId: string | null = null;

    for (const bolt of bolts) {
        const timestamps = [
            bolt.completedAt?.getTime(),
            bolt.startedAt?.getTime(),
            bolt.createdAt?.getTime()
        ].filter((t): t is number => t !== undefined);

        const maxTime = Math.max(...timestamps, 0);
        if (maxTime > mostRecentTime) {
            mostRecentTime = maxTime;
            mostRecentIntentId = bolt.intent;
        }
    }

    if (mostRecentIntentId) {
        const intent = intents.find(i => matchIntent(i, mostRecentIntentId!));
        if (intent) {
            return intent;
        }
    }

    return null;
};

/**
 * Strategy 3: Intent with most in-progress stories.
 * Shows where attention is needed most.
 */
export const selectIntentByInProgressStories: IntentSelectionStrategy = (intents, _bolts) => {
    if (intents.length === 0) {
        return null;
    }

    // Count in-progress stories per intent
    const intentScores = new Map<string, number>();

    for (const intent of intents) {
        let inProgressCount = 0;
        for (const unit of intent.units) {
            inProgressCount += unit.stories.filter(
                s => s.status === ArtifactStatus.InProgress
            ).length;
        }
        intentScores.set(`${intent.number}-${intent.name}`, inProgressCount);
    }

    // Find intent with highest in-progress count
    let maxScore = 0;
    let bestIntent: Intent | null = null;

    for (const intent of intents) {
        const score = intentScores.get(`${intent.number}-${intent.name}`) || 0;
        if (score > maxScore) {
            maxScore = score;
            bestIntent = intent;
        }
    }

    return bestIntent;
};

/**
 * Selects current intent with context information.
 * Returns both the intent and how it was selected (active, queued, or none).
 *
 * Priority:
 * 1. Intent with active bolt → context: 'active'
 * 2. Intent with next queued bolt → context: 'queued'
 * 3. No active/queued work → context: 'none', intent: null
 */
export function selectCurrentIntentWithContext(intents: Intent[], bolts: Bolt[]): IntentSelectionResult {
    if (intents.length === 0) {
        return { intent: null, context: 'none' };
    }

    // Priority 1: Intent with active bolt
    const byActiveBolt = selectIntentByActiveBolt(intents, bolts);
    if (byActiveBolt) {
        return { intent: byActiveBolt, context: 'active' };
    }

    // Priority 2: Intent with next queued bolt (unblocked draft)
    const upNextBolts = getUpNextBolts(bolts);
    const nextQueuedBolt = upNextBolts.find(b => !b.isBlocked);
    if (nextQueuedBolt) {
        const intent = intents.find(i => matchIntent(i, nextQueuedBolt.intent));
        if (intent) {
            return { intent, context: 'queued' };
        }
    }

    // No active or queued work
    return { intent: null, context: 'none' };
}

/**
 * Default strategy: Composite of all strategies with priority.
 * Now simplified to only show meaningful current work.
 * @deprecated Use selectCurrentIntentWithContext for new code
 */
export const selectCurrentIntentDefault: IntentSelectionStrategy = (intents, bolts) => {
    return selectCurrentIntentWithContext(intents, bolts).intent;
};

/**
 * Strategy: Select intent with most pending bolts (maximize throughput).
 */
export const selectCurrentIntentByPendingBolts: IntentSelectionStrategy = (intents, bolts) => {
    if (intents.length === 0) {
        return null;
    }

    const intentBoltCounts = new Map<string, number>();

    for (const bolt of bolts) {
        if (bolt.status === ArtifactStatus.Draft || bolt.status === ArtifactStatus.InProgress) {
            const count = intentBoltCounts.get(bolt.intent) || 0;
            intentBoltCounts.set(bolt.intent, count + 1);
        }
    }

    let maxIntent: Intent | null = null;
    let maxCount = -1;

    for (const intent of intents) {
        const count = intentBoltCounts.get(intent.number) || intentBoltCounts.get(intent.name) || 0;
        if (count > maxCount) {
            maxCount = count;
            maxIntent = intent;
        }
    }

    return maxIntent || intents[0];
};

// ============================================================================
// Active Bolt Selection
// ============================================================================

/**
 * Strategy for selecting active bolts (supports multiple).
 */
export type BoltSelectionStrategy = (bolts: Bolt[]) => Bolt[];

/**
 * Default strategy: All in-progress bolts, sorted by most recently started.
 */
export const selectActiveBoltsDefault: BoltSelectionStrategy = (bolts) => {
    return bolts
        .filter(b => b.status === ArtifactStatus.InProgress)
        .sort((a, b) => {
            const aTime = a.startedAt?.getTime() ?? 0;
            const bTime = b.startedAt?.getTime() ?? 0;
            return bTime - aTime; // Most recent first
        });
};

/**
 * Legacy: First in-progress bolt only (for backwards compatibility).
 * @deprecated Use selectActiveBoltsDefault instead
 */
export const selectActiveBoltDefault = (bolts: Bolt[]): Bolt | null => {
    return bolts.find(b => b.status === ArtifactStatus.InProgress) || null;
};

// ============================================================================
// Bolt Categorization
// ============================================================================

/**
 * Selects all pending bolts (draft or blocked), ordered by priority.
 */
export function selectPendingBolts(bolts: Bolt[]): Bolt[] {
    // Use the existing dependency computation for proper ordering
    return getUpNextBolts(bolts);
}

/**
 * Selects all completed bolts.
 */
export function selectCompletedBolts(bolts: Bolt[]): Bolt[] {
    return bolts.filter(b => b.status === ArtifactStatus.Complete);
}

/**
 * Computes bolt statistics.
 */
export function selectBoltStats(bolts: Bolt[]): BoltStats {
    return {
        active: bolts.filter(b => b.status === ArtifactStatus.InProgress).length,
        queued: bolts.filter(b => b.status === ArtifactStatus.Draft).length,
        done: bolts.filter(b => b.status === ArtifactStatus.Complete).length,
        blocked: bolts.filter(b => b.status === ArtifactStatus.Blocked || b.isBlocked).length
    };
}

// ============================================================================
// Next Actions Detection
// ============================================================================

/**
 * Action types that can be suggested to the user.
 */
export type NextActionType =
    | 'continue-bolt'      // Continue working on active bolt
    | 'start-bolt'         // Start a new bolt from queue
    | 'complete-stage'     // Complete current stage of active bolt
    | 'unblock-bolt'       // Work on blocking bolt to unblock others
    | 'review-stories'     // Review and prioritize stories
    | 'create-bolt'        // Create a new bolt for pending stories
    | 'celebrate';         // All work complete!

/**
 * Represents a suggested next action for the user.
 */
export interface NextAction {
    type: NextActionType;
    priority: number;           // 1 = highest priority
    title: string;              // Short action title
    description: string;        // Detailed description
    targetId?: string;          // ID of related artifact (bolt, intent, etc.)
    targetName?: string;        // Display name of target
    metadata?: Record<string, unknown>;  // Additional context
}

/**
 * Detects and prioritizes next actions based on current state.
 * Returns actions sorted by priority (highest first).
 */
export function selectNextActions(
    bolts: Bolt[],
    intents: Intent[]
): NextAction[] {
    const actions: NextAction[] = [];

    // Check for active bolt - continue work
    const activeBolt = bolts.find(b => b.status === ArtifactStatus.InProgress);
    if (activeBolt) {
        actions.push({
            type: 'continue-bolt',
            priority: 1,
            title: 'Continue Current Bolt',
            description: `Continue working on ${activeBolt.id} - currently in ${activeBolt.currentStage || 'unknown'} stage`,
            targetId: activeBolt.id,
            targetName: activeBolt.id,
            metadata: {
                currentStage: activeBolt.currentStage,
                stagesRemaining: activeBolt.stages.filter(s => s.status !== ArtifactStatus.Complete).length
            }
        });

        // Suggest completing current stage
        if (activeBolt.currentStage) {
            actions.push({
                type: 'complete-stage',
                priority: 2,
                title: `Complete ${activeBolt.currentStage} Stage`,
                description: `Finish the ${activeBolt.currentStage} stage to progress the bolt`,
                targetId: activeBolt.id,
                targetName: activeBolt.id,
                metadata: { stage: activeBolt.currentStage }
            });
        }
    }

    // Check for ready-to-start bolts (unblocked drafts)
    const upNextBolts = getUpNextBolts(bolts);
    const readyBolts = upNextBolts.filter(b => !b.isBlocked);

    if (readyBolts.length > 0 && !activeBolt) {
        const nextBolt = readyBolts[0];
        actions.push({
            type: 'start-bolt',
            priority: 1,
            title: 'Start Next Bolt',
            description: `Start ${nextBolt.id} - ${nextBolt.unblocksCount > 0 ? `enables ${nextBolt.unblocksCount} other bolt(s)` : 'ready to begin'}`,
            targetId: nextBolt.id,
            targetName: nextBolt.id,
            metadata: { unblocksCount: nextBolt.unblocksCount }
        });
    }

    // Check for high-impact unblocking opportunities
    const blockedBolts = upNextBolts.filter(b => b.isBlocked);
    if (blockedBolts.length > 0) {
        // Find the bolt that would unblock the most work
        const blockingBoltIds = new Set<string>();
        for (const blocked of blockedBolts) {
            for (const blockerId of blocked.blockedBy) {
                blockingBoltIds.add(blockerId);
            }
        }

        // Find which blocking bolt would unblock the most
        let bestUnblocker: Bolt | null = null;
        let maxUnblocks = 0;

        for (const blockerId of blockingBoltIds) {
            const blocker = bolts.find(b => b.id === blockerId);
            if (blocker && blocker.status !== ArtifactStatus.Complete) {
                const unblockCount = blockedBolts.filter(b => b.blockedBy.includes(blockerId)).length;
                if (unblockCount > maxUnblocks) {
                    maxUnblocks = unblockCount;
                    bestUnblocker = blocker;
                }
            }
        }

        if (bestUnblocker && maxUnblocks > 1) {
            actions.push({
                type: 'unblock-bolt',
                priority: 3,
                title: 'Unblock Multiple Bolts',
                description: `Complete ${bestUnblocker.id} to unblock ${maxUnblocks} waiting bolt(s)`,
                targetId: bestUnblocker.id,
                targetName: bestUnblocker.id,
                metadata: { unblocksCount: maxUnblocks }
            });
        }
    }

    // Check for intents with pending stories but no bolts
    for (const intent of intents) {
        const intentBolts = bolts.filter(b => b.intent === intent.number || b.intent === intent.name);
        const hasActiveBolts = intentBolts.some(b =>
            b.status === ArtifactStatus.InProgress || b.status === ArtifactStatus.Draft
        );

        if (!hasActiveBolts && intent.status !== ArtifactStatus.Complete) {
            const pendingStoryCount = intent.units.reduce(
                (sum, u) => sum + u.stories.filter(s => s.status !== ArtifactStatus.Complete).length,
                0
            );

            if (pendingStoryCount > 0) {
                actions.push({
                    type: 'create-bolt',
                    priority: 4,
                    title: 'Create Bolt for Pending Work',
                    description: `${intent.name} has ${pendingStoryCount} pending stories without assigned bolts`,
                    targetId: intent.number,
                    targetName: intent.name,
                    metadata: { pendingStories: pendingStoryCount }
                });
            }
        }
    }

    // Check if all work is complete
    const allBoltsComplete = bolts.length > 0 && bolts.every(b => b.status === ArtifactStatus.Complete);
    const allIntentsComplete = intents.length > 0 && intents.every(i => i.status === ArtifactStatus.Complete);

    if (allBoltsComplete && allIntentsComplete) {
        actions.push({
            type: 'celebrate',
            priority: 1,
            title: 'All Work Complete!',
            description: 'Congratulations! All bolts and intents are complete.',
            metadata: {
                totalBolts: bolts.length,
                totalIntents: intents.length
            }
        });
    }

    // Sort by priority (lowest number = highest priority)
    return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * Gets the single highest-priority next action.
 */
export function selectTopNextAction(bolts: Bolt[], intents: Intent[]): NextAction | null {
    const actions = selectNextActions(bolts, intents);
    return actions.length > 0 ? actions[0] : null;
}

// ============================================================================
// Activity Feed
// ============================================================================

/**
 * Builds and filters the activity feed.
 */
export function selectActivityFeed(bolts: Bolt[], filter: ActivityFilter = 'all'): ActivityEvent[] {
    const events = buildActivityFeed(bolts);

    if (filter === 'all') {
        return events;
    }

    return events.filter(event => {
        if (filter === 'stages') {
            return event.tag === 'stage';
        }
        if (filter === 'bolts') {
            return event.tag === 'bolt';
        }
        return true;
    });
}

// ============================================================================
// Progress Metrics
// ============================================================================

/**
 * Computes overall progress metrics.
 */
export function selectProgressMetrics(
    intents: Intent[],
    units: Unit[],
    stories: Story[],
    bolts: Bolt[]
): ProgressMetrics {
    const totalStories = stories.length;
    const completedStories = stories.filter(s => s.status === ArtifactStatus.Complete).length;

    const totalBolts = bolts.length;
    const completedBolts = bolts.filter(b => b.status === ArtifactStatus.Complete).length;

    // Overall percent based on story completion
    const overallPercent = totalStories > 0
        ? Math.round((completedStories / totalStories) * 100)
        : 0;

    return {
        totalIntents: intents.length,
        totalUnits: units.length,
        totalStories,
        totalBolts,
        completedStories,
        completedBolts,
        overallPercent
    };
}

// ============================================================================
// Specs Tree Filtering
// ============================================================================

/**
 * Filters intents based on specs filter.
 */
export function selectFilteredIntents(
    intents: Intent[],
    filter: 'all' | 'active' | 'complete' | 'pending'
): Intent[] {
    if (filter === 'all') {
        return intents;
    }

    return intents.filter(intent => {
        switch (filter) {
            case 'active':
                return intent.status === ArtifactStatus.InProgress;
            case 'complete':
                return intent.status === ArtifactStatus.Complete;
            case 'pending':
                return intent.status === ArtifactStatus.Draft || intent.status === ArtifactStatus.Unknown;
            default:
                return true;
        }
    });
}

// ============================================================================
// Main Computation Function
// ============================================================================

/**
 * Configuration for computed state calculation.
 * Allows injecting different strategies (Dependency Inversion).
 */
export interface ComputeConfig {
    intentSelector: IntentSelectionStrategy;
    boltSelector: BoltSelectionStrategy;
}

/**
 * Default compute configuration.
 */
export const DEFAULT_COMPUTE_CONFIG: ComputeConfig = {
    intentSelector: selectCurrentIntentDefault,
    boltSelector: selectActiveBoltsDefault
};

/**
 * Computes all derived state from raw entities.
 * This is the main entry point for state computation.
 */
export function computeState(
    intents: Intent[],
    units: Unit[],
    stories: Story[],
    bolts: Bolt[],
    config: ComputeConfig = DEFAULT_COMPUTE_CONFIG
): ComputedState {
    // First, ensure bolt dependencies are computed
    const boltsWithDeps = computeBoltDependencies(bolts);

    // Compute current intent with context
    const { intent: currentIntent, context: currentIntentContext } = selectCurrentIntentWithContext(intents, boltsWithDeps);

    // Compute other derived values
    const activeBolts = config.boltSelector(boltsWithDeps);
    const pendingBolts = selectPendingBolts(boltsWithDeps);
    const completedBolts = selectCompletedBolts(boltsWithDeps);
    const activityFeed = selectActivityFeed(boltsWithDeps);
    const overallProgress = selectProgressMetrics(intents, units, stories, boltsWithDeps);
    const boltStats = selectBoltStats(boltsWithDeps);
    const nextActions = selectNextActions(boltsWithDeps, intents);

    return {
        currentIntent,
        currentIntentContext,
        activeBolts,
        pendingBolts,
        completedBolts,
        activityFeed,
        overallProgress,
        boltStats,
        nextActions
    };
}

// ============================================================================
// Entity Lookup Helpers
// ============================================================================

/**
 * Creates a Map from an array of entities with an ID property.
 */
export function indexById<T extends { id?: string; name?: string }>(
    entities: T[],
    keyFn: (e: T) => string = (e) => e.id || e.name || ''
): Map<string, T> {
    const map = new Map<string, T>();
    for (const entity of entities) {
        const key = keyFn(entity);
        if (key) {
            map.set(key, entity);
        }
    }
    return map;
}

/**
 * Creates indexed maps for intents using number as key.
 */
export function indexIntents(intents: Intent[]): Map<string, Intent> {
    return indexById(intents, i => `${i.number}-${i.name}`);
}

/**
 * Creates indexed maps for units using intentName/unitName as key.
 */
export function indexUnits(units: Unit[]): Map<string, Unit> {
    return indexById(units, u => `${u.intentName}/${u.name}`);
}

/**
 * Creates indexed maps for stories using full path as key.
 */
export function indexStories(stories: Story[]): Map<string, Story> {
    return indexById(stories, s => s.id);
}

/**
 * Creates indexed maps for bolts using id as key.
 */
export function indexBolts(bolts: Bolt[]): Map<string, Bolt> {
    return indexById(bolts, b => b.id);
}

/**
 * Creates indexed maps for standards using name as key.
 */
export function indexStandards(standards: Standard[]): Map<string, Standard> {
    return indexById(standards, s => s.name);
}
