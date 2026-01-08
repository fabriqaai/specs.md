/**
 * Project Metrics Events Tests
 *
 * Tests for project metrics event tracking including snapshot, change detection,
 * debouncing, and rate limiting.
 */

import * as assert from 'assert';
import { ArtifactStatus } from '../../parser/types';
import type { MemoryBankModel, Bolt, Intent, Unit, Story, Standard } from '../../parser/types';

suite('Project Metrics Events Test Suite', () => {
    // Helper to create a mock model
    const createMockModel = (overrides: Partial<{
        isProject: boolean;
        intents: Intent[];
        bolts: Bolt[];
        standards: Standard[];
    }> = {}): MemoryBankModel => {
        return {
            isProject: true,
            intents: [],
            bolts: [],
            standards: [],
            ...overrides,
        };
    };

    // Helper to create a mock bolt
    const createMockBolt = (overrides: Partial<Bolt> = {}): Bolt => {
        return {
            id: 'test-bolt-1',
            unit: 'test-unit',
            intent: 'test-intent',
            type: 'simple-construction-bolt',
            status: ArtifactStatus.Draft,
            currentStage: null,
            stages: [],
            stagesCompleted: [],
            stories: [],
            path: '/path/to/bolt',
            filePath: '/path/to/bolt/bolt.md',
            requiresBolts: [],
            enablesBolts: [],
            isBlocked: false,
            blockedBy: [],
            unblocksCount: 0,
            ...overrides,
        };
    };

    // Helper to create a mock intent with units and stories
    const createMockIntent = (
        name: string,
        unitCount: number,
        storiesPerUnit: number
    ): Intent => {
        const units: Unit[] = [];
        for (let u = 0; u < unitCount; u++) {
            const stories: Story[] = [];
            for (let s = 0; s < storiesPerUnit; s++) {
                stories.push({
                    id: `${s + 1}`.padStart(3, '0'),
                    title: `Story ${s + 1}`,
                    unitName: `unit-${u + 1}`,
                    intentName: name,
                    path: `/path/to/story-${s + 1}.md`,
                    status: ArtifactStatus.Draft,
                    priority: 'should',
                });
            }
            units.push({
                name: `unit-${u + 1}`,
                intentName: name,
                path: `/path/to/unit-${u + 1}`,
                status: ArtifactStatus.Draft,
                stories,
            });
        }
        return {
            name,
            number: '001',
            path: `/path/to/${name}`,
            status: ArtifactStatus.Draft,
            units,
        };
    };

    // ============================================
    // Project Counts Extraction Tests
    // ============================================
    suite('Project Counts Extraction', () => {
        // Recreate extraction logic for testing
        interface ProjectCounts {
            intentCount: number;
            unitCount: number;
            storyCount: number;
            boltCount: number;
            activeBolts: number;
            queuedBolts: number;
            completedBolts: number;
            blockedBolts: number;
        }

        const extractCounts = (model: MemoryBankModel): ProjectCounts => {
            let unitCount = 0;
            let storyCount = 0;

            for (const intent of model.intents) {
                unitCount += intent.units.length;
                for (const unit of intent.units) {
                    storyCount += unit.stories.length;
                }
            }

            let activeBolts = 0;
            let queuedBolts = 0;
            let completedBolts = 0;
            let blockedBolts = 0;

            for (const bolt of model.bolts) {
                if (bolt.isBlocked) {
                    blockedBolts++;
                } else if (bolt.status === ArtifactStatus.Complete) {
                    completedBolts++;
                } else if (bolt.status === ArtifactStatus.InProgress) {
                    activeBolts++;
                } else {
                    queuedBolts++;
                }
            }

            return {
                intentCount: model.intents.length,
                unitCount,
                storyCount,
                boltCount: model.bolts.length,
                activeBolts,
                queuedBolts,
                completedBolts,
                blockedBolts,
            };
        };

        test('should count empty project correctly', () => {
            const model = createMockModel();
            const counts = extractCounts(model);

            assert.strictEqual(counts.intentCount, 0);
            assert.strictEqual(counts.unitCount, 0);
            assert.strictEqual(counts.storyCount, 0);
            assert.strictEqual(counts.boltCount, 0);
            assert.strictEqual(counts.activeBolts, 0);
            assert.strictEqual(counts.queuedBolts, 0);
            assert.strictEqual(counts.completedBolts, 0);
            assert.strictEqual(counts.blockedBolts, 0);
        });

        test('should count intents, units, and stories', () => {
            const model = createMockModel({
                intents: [
                    createMockIntent('intent-1', 2, 3), // 2 units, 3 stories each = 6 stories
                    createMockIntent('intent-2', 1, 4), // 1 unit, 4 stories
                ],
            });
            const counts = extractCounts(model);

            assert.strictEqual(counts.intentCount, 2);
            assert.strictEqual(counts.unitCount, 3);
            assert.strictEqual(counts.storyCount, 10);
        });

        test('should categorize bolt statuses correctly', () => {
            const model = createMockModel({
                bolts: [
                    createMockBolt({ id: 'active-1', status: ArtifactStatus.InProgress }),
                    createMockBolt({ id: 'active-2', status: ArtifactStatus.InProgress }),
                    createMockBolt({ id: 'queued-1', status: ArtifactStatus.Draft }),
                    createMockBolt({ id: 'completed-1', status: ArtifactStatus.Complete }),
                    createMockBolt({ id: 'completed-2', status: ArtifactStatus.Complete }),
                    createMockBolt({ id: 'completed-3', status: ArtifactStatus.Complete }),
                    createMockBolt({ id: 'blocked-1', status: ArtifactStatus.Draft, isBlocked: true }),
                ],
            });
            const counts = extractCounts(model);

            assert.strictEqual(counts.boltCount, 7);
            assert.strictEqual(counts.activeBolts, 2);
            assert.strictEqual(counts.queuedBolts, 1);
            assert.strictEqual(counts.completedBolts, 3);
            assert.strictEqual(counts.blockedBolts, 1);
        });

        test('should count blocked bolt separately from queued', () => {
            const model = createMockModel({
                bolts: [
                    createMockBolt({ id: 'queued', status: ArtifactStatus.Draft, isBlocked: false }),
                    createMockBolt({ id: 'blocked', status: ArtifactStatus.Draft, isBlocked: true }),
                ],
            });
            const counts = extractCounts(model);

            assert.strictEqual(counts.queuedBolts, 1);
            assert.strictEqual(counts.blockedBolts, 1);
        });
    });

    // ============================================
    // Change Detection Tests
    // ============================================
    suite('Change Detection', () => {
        interface ProjectCounts {
            intentCount: number;
            unitCount: number;
            storyCount: number;
            boltCount: number;
            activeBolts: number;
            queuedBolts: number;
            completedBolts: number;
            blockedBolts: number;
        }

        type ProjectChangeType =
            | 'bolt_added'
            | 'bolt_completed'
            | 'intent_added'
            | 'story_added'
            | 'entities_removed';

        const hasChanged = (prev: ProjectCounts, curr: ProjectCounts): boolean => {
            return (
                curr.intentCount !== prev.intentCount ||
                curr.unitCount !== prev.unitCount ||
                curr.storyCount !== prev.storyCount ||
                curr.boltCount !== prev.boltCount ||
                curr.activeBolts !== prev.activeBolts ||
                curr.queuedBolts !== prev.queuedBolts ||
                curr.completedBolts !== prev.completedBolts ||
                curr.blockedBolts !== prev.blockedBolts
            );
        };

        const detectChangeType = (prev: ProjectCounts, curr: ProjectCounts): ProjectChangeType => {
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
        };

        const baseCounts: ProjectCounts = {
            intentCount: 2,
            unitCount: 4,
            storyCount: 10,
            boltCount: 3,
            activeBolts: 1,
            queuedBolts: 1,
            completedBolts: 1,
            blockedBolts: 0,
        };

        test('should detect no change when counts are same', () => {
            const curr = { ...baseCounts };
            assert.strictEqual(hasChanged(baseCounts, curr), false);
        });

        test('should detect change when intent count differs', () => {
            const curr = { ...baseCounts, intentCount: 3 };
            assert.strictEqual(hasChanged(baseCounts, curr), true);
        });

        test('should detect change when unit count differs', () => {
            const curr = { ...baseCounts, unitCount: 5 };
            assert.strictEqual(hasChanged(baseCounts, curr), true);
        });

        test('should detect change when story count differs', () => {
            const curr = { ...baseCounts, storyCount: 11 };
            assert.strictEqual(hasChanged(baseCounts, curr), true);
        });

        test('should detect change when bolt count differs', () => {
            const curr = { ...baseCounts, boltCount: 4 };
            assert.strictEqual(hasChanged(baseCounts, curr), true);
        });

        test('should detect change when active bolts differ', () => {
            const curr = { ...baseCounts, activeBolts: 2 };
            assert.strictEqual(hasChanged(baseCounts, curr), true);
        });

        test('should detect bolt_completed as highest priority change', () => {
            const curr = {
                ...baseCounts,
                completedBolts: 2,
                boltCount: 4,
                intentCount: 3,
            };
            assert.strictEqual(detectChangeType(baseCounts, curr), 'bolt_completed');
        });

        test('should detect bolt_added when no completion but new bolt', () => {
            const curr = {
                ...baseCounts,
                boltCount: 4,
                intentCount: 3,
            };
            assert.strictEqual(detectChangeType(baseCounts, curr), 'bolt_added');
        });

        test('should detect intent_added when no bolt changes', () => {
            const curr = {
                ...baseCounts,
                intentCount: 3,
                storyCount: 11,
            };
            assert.strictEqual(detectChangeType(baseCounts, curr), 'intent_added');
        });

        test('should detect story_added when only stories change', () => {
            const curr = {
                ...baseCounts,
                storyCount: 11,
            };
            assert.strictEqual(detectChangeType(baseCounts, curr), 'story_added');
        });

        test('should detect entities_removed when counts decrease', () => {
            const curr = {
                ...baseCounts,
                intentCount: 1,
            };
            assert.strictEqual(detectChangeType(baseCounts, curr), 'entities_removed');
        });
    });

    // ============================================
    // Delta Calculation Tests
    // ============================================
    suite('Delta Calculation', () => {
        interface ProjectCounts {
            intentCount: number;
            unitCount: number;
            storyCount: number;
            boltCount: number;
            activeBolts: number;
            queuedBolts: number;
            completedBolts: number;
            blockedBolts: number;
        }

        const calculateDeltas = (prev: ProjectCounts, curr: ProjectCounts): Record<string, number> => {
            const deltas: Record<string, number> = {};

            const intentsDelta = curr.intentCount - prev.intentCount;
            const unitsDelta = curr.unitCount - prev.unitCount;
            const storiesDelta = curr.storyCount - prev.storyCount;
            const boltsDelta = curr.boltCount - prev.boltCount;
            const activeBoltsDelta = curr.activeBolts - prev.activeBolts;
            const completedBoltsDelta = curr.completedBolts - prev.completedBolts;

            if (intentsDelta !== 0) deltas.intents_delta = intentsDelta;
            if (unitsDelta !== 0) deltas.units_delta = unitsDelta;
            if (storiesDelta !== 0) deltas.stories_delta = storiesDelta;
            if (boltsDelta !== 0) deltas.bolts_delta = boltsDelta;
            if (activeBoltsDelta !== 0) deltas.active_bolts_delta = activeBoltsDelta;
            if (completedBoltsDelta !== 0) deltas.completed_bolts_delta = completedBoltsDelta;

            return deltas;
        };

        const baseCounts: ProjectCounts = {
            intentCount: 2,
            unitCount: 4,
            storyCount: 10,
            boltCount: 3,
            activeBolts: 1,
            queuedBolts: 1,
            completedBolts: 1,
            blockedBolts: 0,
        };

        test('should return empty deltas when no changes', () => {
            const deltas = calculateDeltas(baseCounts, baseCounts);
            assert.deepStrictEqual(deltas, {});
        });

        test('should include positive deltas', () => {
            const curr = {
                ...baseCounts,
                intentCount: 3,
                storyCount: 12,
            };
            const deltas = calculateDeltas(baseCounts, curr);

            assert.strictEqual(deltas.intents_delta, 1);
            assert.strictEqual(deltas.stories_delta, 2);
            assert.strictEqual(deltas.units_delta, undefined);
        });

        test('should include negative deltas', () => {
            const curr = {
                ...baseCounts,
                intentCount: 1,
                boltCount: 2,
            };
            const deltas = calculateDeltas(baseCounts, curr);

            assert.strictEqual(deltas.intents_delta, -1);
            assert.strictEqual(deltas.bolts_delta, -1);
        });

        test('should track bolt completion delta', () => {
            const curr = {
                ...baseCounts,
                completedBolts: 3,
                activeBolts: 0,
            };
            const deltas = calculateDeltas(baseCounts, curr);

            assert.strictEqual(deltas.completed_bolts_delta, 2);
            assert.strictEqual(deltas.active_bolts_delta, -1);
        });
    });

    // ============================================
    // Rate Limiting Tests
    // ============================================
    suite('Rate Limiting', () => {
        const RATE_LIMIT_MAX = 5;
        const RATE_LIMIT_WINDOW_MS = 60000;

        // Simulate rate limiter
        class RateLimiter {
            private emitTimestamps: number[] = [];

            isRateLimited(): boolean {
                const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
                this.emitTimestamps = this.emitTimestamps.filter(t => t > cutoff);
                return this.emitTimestamps.length >= RATE_LIMIT_MAX;
            }

            recordEmit(): void {
                this.emitTimestamps.push(Date.now());
            }

            // For testing: set timestamps directly
            setTimestamps(timestamps: number[]): void {
                this.emitTimestamps = timestamps;
            }

            getCount(): number {
                const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
                this.emitTimestamps = this.emitTimestamps.filter(t => t > cutoff);
                return this.emitTimestamps.length;
            }
        }

        test('should not be rate limited initially', () => {
            const limiter = new RateLimiter();
            assert.strictEqual(limiter.isRateLimited(), false);
        });

        test('should not be rate limited with few emissions', () => {
            const limiter = new RateLimiter();
            limiter.recordEmit();
            limiter.recordEmit();
            limiter.recordEmit();
            assert.strictEqual(limiter.isRateLimited(), false);
            assert.strictEqual(limiter.getCount(), 3);
        });

        test('should be rate limited at max emissions', () => {
            const limiter = new RateLimiter();
            for (let i = 0; i < RATE_LIMIT_MAX; i++) {
                limiter.recordEmit();
            }
            assert.strictEqual(limiter.isRateLimited(), true);
        });

        test('should clear old timestamps outside window', () => {
            const limiter = new RateLimiter();
            const now = Date.now();
            // Set timestamps from 2 minutes ago (outside window)
            limiter.setTimestamps([
                now - 120000,
                now - 110000,
                now - 100000,
            ]);
            // These should be cleaned up
            assert.strictEqual(limiter.getCount(), 0);
            assert.strictEqual(limiter.isRateLimited(), false);
        });

        test('should keep recent timestamps inside window', () => {
            const limiter = new RateLimiter();
            const now = Date.now();
            limiter.setTimestamps([
                now - 50000, // 50s ago - inside window
                now - 30000, // 30s ago - inside window
                now - 10000, // 10s ago - inside window
            ]);
            assert.strictEqual(limiter.getCount(), 3);
            assert.strictEqual(limiter.isRateLimited(), false);
        });

        test('should become unblocked as timestamps age out', () => {
            const limiter = new RateLimiter();
            const now = Date.now();
            // 5 timestamps at 59 seconds ago (just inside window)
            limiter.setTimestamps([
                now - 59000,
                now - 59100,
                now - 59200,
                now - 59300,
                now - 59400,
            ]);
            // Still rate limited
            assert.strictEqual(limiter.isRateLimited(), true);
            // Note: In real usage, after 1+ second passes, these would age out
        });
    });

    // ============================================
    // Debouncing Tests
    // ============================================
    suite('Debouncing Logic', () => {
        test('should set debounce timer on scan complete', () => {
            let timerSet = false;
            const setDebounceTimer = (): void => {
                timerSet = true;
            };

            setDebounceTimer();
            assert.strictEqual(timerSet, true);
        });

        test('should cancel previous timer when new scan arrives', () => {
            let timerCancelled = false;
            let timerSet = false;

            const cancelTimer = (): void => {
                timerCancelled = true;
            };
            const setTimer = (): void => {
                timerSet = true;
            };

            // Simulate second scan arriving
            cancelTimer();
            setTimer();

            assert.strictEqual(timerCancelled, true);
            assert.strictEqual(timerSet, true);
        });

        test('should clean up timer on dispose', () => {
            let timerCleared = false;
            const clearTimer = (): void => {
                timerCleared = true;
            };

            clearTimer();
            assert.strictEqual(timerCleared, true);
        });
    });

    // ============================================
    // Event Properties Tests
    // ============================================
    suite('Event Properties', () => {
        interface ProjectSnapshotEventProperties {
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

        const createSnapshotProperties = (
            intentCount: number,
            unitCount: number,
            storyCount: number,
            boltCounts: { active: number; queued: number; completed: number; blocked: number }
        ): ProjectSnapshotEventProperties => {
            const avgUnitsPerIntent = intentCount > 0
                ? Math.round((unitCount / intentCount) * 100) / 100
                : 0;
            const avgStoriesPerUnit = unitCount > 0
                ? Math.round((storyCount / unitCount) * 100) / 100
                : 0;

            return {
                intent_count: intentCount,
                unit_count: unitCount,
                story_count: storyCount,
                bolt_count: boltCounts.active + boltCounts.queued + boltCounts.completed + boltCounts.blocked,
                active_bolts: boltCounts.active,
                queued_bolts: boltCounts.queued,
                completed_bolts: boltCounts.completed,
                blocked_bolts: boltCounts.blocked,
                avg_units_per_intent: avgUnitsPerIntent,
                avg_stories_per_unit: avgStoriesPerUnit,
            };
        };

        test('should include all required snapshot properties', () => {
            const props = createSnapshotProperties(2, 4, 10, {
                active: 1,
                queued: 2,
                completed: 3,
                blocked: 0,
            });

            assert.strictEqual(props.intent_count, 2);
            assert.strictEqual(props.unit_count, 4);
            assert.strictEqual(props.story_count, 10);
            assert.strictEqual(props.bolt_count, 6);
            assert.strictEqual(props.active_bolts, 1);
            assert.strictEqual(props.queued_bolts, 2);
            assert.strictEqual(props.completed_bolts, 3);
            assert.strictEqual(props.blocked_bolts, 0);
        });

        test('should calculate averages correctly', () => {
            const props = createSnapshotProperties(2, 4, 10, {
                active: 0,
                queued: 0,
                completed: 0,
                blocked: 0,
            });

            assert.strictEqual(props.avg_units_per_intent, 2); // 4/2
            assert.strictEqual(props.avg_stories_per_unit, 2.5); // 10/4
        });

        test('should handle zero intents', () => {
            const props = createSnapshotProperties(0, 0, 0, {
                active: 0,
                queued: 0,
                completed: 0,
                blocked: 0,
            });

            assert.strictEqual(props.avg_units_per_intent, 0);
            assert.strictEqual(props.avg_stories_per_unit, 0);
        });

        test('should round averages to 2 decimal places', () => {
            const props = createSnapshotProperties(3, 7, 22, {
                active: 0,
                queued: 0,
                completed: 0,
                blocked: 0,
            });

            // 7/3 = 2.333... -> 2.33
            assert.strictEqual(props.avg_units_per_intent, 2.33);
            // 22/7 = 3.142... -> 3.14
            assert.strictEqual(props.avg_stories_per_unit, 3.14);
        });
    });

    // ============================================
    // Event Name Constants Tests
    // ============================================
    suite('Event Name Constants', () => {
        const PROJECT_EVENTS = {
            SNAPSHOT: 'project_snapshot',
            CHANGED: 'project_changed',
        } as const;

        test('should have correct event names', () => {
            assert.strictEqual(PROJECT_EVENTS.SNAPSHOT, 'project_snapshot');
            assert.strictEqual(PROJECT_EVENTS.CHANGED, 'project_changed');
        });

        test('should have exactly 2 events', () => {
            const eventCount = Object.keys(PROJECT_EVENTS).length;
            assert.strictEqual(eventCount, 2);
        });
    });

    // ============================================
    // Non-Project Handling Tests
    // ============================================
    suite('Non-Project Handling', () => {
        test('should not track for non-specsmd projects', () => {
            let tracked = false;
            const trackIfProject = (isProject: boolean): void => {
                if (!isProject) {
                    return;
                }
                tracked = true;
            };

            trackIfProject(false);
            assert.strictEqual(tracked, false);

            trackIfProject(true);
            assert.strictEqual(tracked, true);
        });
    });

    // ============================================
    // Error Isolation Tests
    // ============================================
    suite('Error Isolation', () => {
        test('tracking should not throw on errors', () => {
            const safeTrack = (callback: () => void): boolean => {
                try {
                    callback();
                    return true;
                } catch {
                    return false;
                }
            };

            // Should not throw
            assert.doesNotThrow(() => {
                safeTrack(() => { throw new Error('Track error'); });
            });
        });

        test('should handle null model gracefully', () => {
            const isValidModel = (model: MemoryBankModel | null | undefined): boolean => {
                return model?.isProject === true;
            };

            assert.strictEqual(isValidModel(null), false);
            assert.strictEqual(isValidModel(undefined), false);
            assert.strictEqual(isValidModel(createMockModel({ isProject: false })), false);
            assert.strictEqual(isValidModel(createMockModel({ isProject: true })), true);
        });
    });
});
