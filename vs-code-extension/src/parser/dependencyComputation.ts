/**
 * Bolt dependency computation functions.
 * Computes isBlocked, blockedBy, and unblocksCount for each bolt.
 */

import { Bolt, ArtifactStatus } from './types';

/**
 * Computes dependency state for all bolts.
 * This must be called after all bolts are parsed to correctly determine
 * blocked status based on the complete set of bolts.
 *
 * @param bolts - Array of parsed bolts (with requiresBolts and enablesBolts set)
 * @returns Array of bolts with computed isBlocked, blockedBy, and unblocksCount
 */
export function computeBoltDependencies(bolts: Bolt[]): Bolt[] {
    // Create a status lookup map for O(1) access
    const boltStatusMap = new Map<string, ArtifactStatus>(
        bolts.map(b => [b.id, b.status])
    );

    // Compute unblocksCount for each bolt (how many bolts require this one)
    const unblocksCountMap = new Map<string, number>();
    for (const bolt of bolts) {
        for (const reqId of bolt.requiresBolts) {
            const current = unblocksCountMap.get(reqId) || 0;
            unblocksCountMap.set(reqId, current + 1);
        }
    }

    return bolts.map(bolt => {
        // Already completed bolts are never blocked
        if (bolt.status === ArtifactStatus.Complete) {
            return {
                ...bolt,
                isBlocked: false,
                blockedBy: [],
                unblocksCount: unblocksCountMap.get(bolt.id) || 0
            };
        }

        // Check which required bolts are incomplete
        const blockedBy = bolt.requiresBolts.filter(reqId => {
            const status = boltStatusMap.get(reqId);
            // If bolt doesn't exist or isn't complete, it's a blocker
            return status !== ArtifactStatus.Complete;
        });

        const isBlocked = blockedBy.length > 0;

        return {
            ...bolt,
            isBlocked,
            blockedBy,
            unblocksCount: unblocksCountMap.get(bolt.id) || 0,
            // Update status to Blocked if appropriate
            status: isBlocked && bolt.status === ArtifactStatus.Draft
                ? ArtifactStatus.Blocked
                : bolt.status
        };
    });
}

/**
 * Gets pending bolts ordered by priority for the "Up Next" queue.
 *
 * Priority order:
 * 1. Unblocked bolts first (can start immediately)
 * 2. Among unblocked, prioritize by unblocksCount (enables more work)
 * 3. Blocked bolts last
 *
 * @param bolts - Array of bolts with computed dependencies
 * @returns Array of pending/blocked bolts sorted by priority
 */
export function getUpNextBolts(bolts: Bolt[]): Bolt[] {
    return bolts
        .filter(b =>
            b.status === ArtifactStatus.Draft ||
            b.status === ArtifactStatus.Blocked
        )
        .sort((a, b) => {
            // Unblocked first
            if (!a.isBlocked && b.isBlocked) {
                return -1;
            }
            if (a.isBlocked && !b.isBlocked) {
                return 1;
            }

            // Then by unblocksCount (more impact first)
            if (b.unblocksCount !== a.unblocksCount) {
                return b.unblocksCount - a.unblocksCount;
            }

            // Finally by ID for stable sorting
            return a.id.localeCompare(b.id);
        });
}

/**
 * Checks if a specific bolt is blocked.
 *
 * @param bolt - The bolt to check
 * @param allBolts - All bolts for status lookup
 * @returns true if any required bolts are incomplete
 */
export function isBoltBlocked(bolt: Bolt, allBolts: Bolt[]): boolean {
    if (bolt.status === ArtifactStatus.Complete) {
        return false;
    }

    if (bolt.requiresBolts.length === 0) {
        return false;
    }

    const boltStatusMap = new Map<string, ArtifactStatus>(
        allBolts.map(b => [b.id, b.status])
    );

    return bolt.requiresBolts.some(reqId => {
        const status = boltStatusMap.get(reqId);
        return status !== ArtifactStatus.Complete;
    });
}

/**
 * Gets the list of bolts blocking a specific bolt.
 *
 * @param bolt - The bolt to check
 * @param allBolts - All bolts for status lookup
 * @returns Array of IDs of incomplete required bolts
 */
export function getBlockingBolts(bolt: Bolt, allBolts: Bolt[]): string[] {
    if (bolt.status === ArtifactStatus.Complete) {
        return [];
    }

    const boltStatusMap = new Map<string, ArtifactStatus>(
        allBolts.map(b => [b.id, b.status])
    );

    return bolt.requiresBolts.filter(reqId => {
        const status = boltStatusMap.get(reqId);
        return status !== ArtifactStatus.Complete;
    });
}

/**
 * Counts how many bolts a specific bolt enables (unblocks).
 *
 * @param boltId - ID of the bolt
 * @param allBolts - All bolts to check
 * @returns Number of bolts that require this bolt
 */
export function countUnblocks(boltId: string, allBolts: Bolt[]): number {
    return allBolts.filter(b => b.requiresBolts.includes(boltId)).length;
}
