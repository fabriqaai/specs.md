/**
 * Tests for state selectors.
 */

import * as assert from 'assert';
import {
    selectCurrentIntentDefault,
    selectCurrentIntentByPendingBolts,
    selectActiveBoltDefault,
    selectActiveBoltsDefault,
    selectPendingBolts,
    selectCompletedBolts,
    selectBoltStats,
    selectActivityFeed,
    selectProgressMetrics,
    selectFilteredIntents,
    computeState,
    indexBolts,
    indexIntents
} from '../../state/selectors';
import { Intent, Bolt, Story, Unit, ArtifactStatus } from '../../parser/types';

suite('State Selectors Test Suite', () => {

    // ========================================================================
    // Test Data Factories
    // ========================================================================

    function createIntent(overrides: Partial<Intent> = {}): Intent {
        return {
            name: 'test-intent',
            number: '001',
            path: '/test/intents/001-test-intent',
            status: ArtifactStatus.Draft,
            units: [],
            ...overrides
        };
    }

    function createBolt(overrides: Partial<Bolt> = {}): Bolt {
        return {
            id: 'bolt-test-1',
            unit: 'test-unit',
            intent: '001',
            type: 'ddd-construction-bolt',
            status: ArtifactStatus.Draft,
            currentStage: null,
            stages: [],
            stagesCompleted: [],
            stories: [],
            path: '/test/bolts/bolt-test-1',
            filePath: '/test/bolts/bolt-test-1/bolt.md',
            requiresBolts: [],
            enablesBolts: [],
            isBlocked: false,
            blockedBy: [],
            unblocksCount: 0,
            ...overrides
        };
    }

    function createStory(overrides: Partial<Story> = {}): Story {
        return {
            id: '001-test-story',
            title: 'Test Story',
            unitName: 'test-unit',
            intentName: '001-test-intent',
            path: '/test/stories/001-test-story.md',
            status: ArtifactStatus.Draft,
            priority: 'must',
            ...overrides
        };
    }

    function createUnit(overrides: Partial<Unit> = {}): Unit {
        return {
            name: 'test-unit',
            intentName: '001-test-intent',
            path: '/test/units/test-unit',
            status: ArtifactStatus.Draft,
            stories: [],
            ...overrides
        };
    }

    // ========================================================================
    // Intent Selection Tests
    // ========================================================================

    suite('selectCurrentIntentDefault', () => {

        test('should return null for empty intents', () => {
            const result = selectCurrentIntentDefault([], []);
            assert.strictEqual(result, null);
        });

        test('should return null when no active or queued bolts', () => {
            const intents = [
                createIntent({ number: '001', name: 'first' }),
                createIntent({ number: '002', name: 'second' })
            ];
            const result = selectCurrentIntentDefault(intents, []);
            // New behavior: return null when no active/queued work, not first intent
            assert.strictEqual(result, null);
        });

        test('should return intent with active bolt', () => {
            const intents = [
                createIntent({ number: '001', name: 'first' }),
                createIntent({ number: '002', name: 'second' })
            ];
            const bolts = [
                createBolt({ id: 'bolt-1', intent: '002', status: ArtifactStatus.InProgress })
            ];
            const result = selectCurrentIntentDefault(intents, bolts);
            assert.strictEqual(result?.name, 'second');
        });

        test('should return intent with queued bolt when no active bolt', () => {
            const intents = [
                createIntent({ number: '001', name: 'first' }),
                createIntent({ number: '002', name: 'second' })
            ];
            // Draft bolt (queued) for second intent
            const bolts = [
                createBolt({ id: 'bolt-1', intent: '002', status: ArtifactStatus.Draft, isBlocked: false })
            ];
            const result = selectCurrentIntentDefault(intents, bolts);
            assert.strictEqual(result?.name, 'second');
        });
    });

    suite('selectCurrentIntentByPendingBolts', () => {

        test('should return intent with most pending bolts', () => {
            const intents = [
                createIntent({ number: '001', name: 'few-bolts' }),
                createIntent({ number: '002', name: 'many-bolts' })
            ];
            const bolts = [
                createBolt({ id: 'bolt-1', intent: '001', status: ArtifactStatus.Draft }),
                createBolt({ id: 'bolt-2', intent: '002', status: ArtifactStatus.Draft }),
                createBolt({ id: 'bolt-3', intent: '002', status: ArtifactStatus.Draft }),
                createBolt({ id: 'bolt-4', intent: '002', status: ArtifactStatus.InProgress })
            ];
            const result = selectCurrentIntentByPendingBolts(intents, bolts);
            assert.strictEqual(result?.name, 'many-bolts');
        });
    });

    // ========================================================================
    // Bolt Selection Tests
    // ========================================================================

    suite('selectActiveBoltDefault', () => {

        test('should return null for empty bolts', () => {
            const result = selectActiveBoltDefault([]);
            assert.strictEqual(result, null);
        });

        test('should return null when no in-progress bolts', () => {
            const bolts = [
                createBolt({ status: ArtifactStatus.Draft }),
                createBolt({ status: ArtifactStatus.Complete })
            ];
            const result = selectActiveBoltDefault(bolts);
            assert.strictEqual(result, null);
        });

        test('should return first in-progress bolt', () => {
            const bolts = [
                createBolt({ id: 'bolt-1', status: ArtifactStatus.Draft }),
                createBolt({ id: 'bolt-2', status: ArtifactStatus.InProgress }),
                createBolt({ id: 'bolt-3', status: ArtifactStatus.InProgress })
            ];
            const result = selectActiveBoltDefault(bolts);
            assert.strictEqual(result?.id, 'bolt-2');
        });
    });

    suite('selectActiveBoltsDefault', () => {

        test('should return all in-progress bolts sorted by most recent', () => {
            const now = new Date();
            const earlier = new Date(now.getTime() - 3600000); // 1 hour ago

            const bolts = [
                createBolt({ id: 'older', status: ArtifactStatus.InProgress, startedAt: earlier }),
                createBolt({ id: 'newer', status: ArtifactStatus.InProgress, startedAt: now }),
                createBolt({ id: 'draft', status: ArtifactStatus.Draft })
            ];
            const result = selectActiveBoltsDefault(bolts);
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].id, 'newer'); // Most recent first
            assert.strictEqual(result[1].id, 'older');
        });

        test('should return empty array when no in-progress bolts', () => {
            const bolts = [
                createBolt({ status: ArtifactStatus.Draft }),
                createBolt({ status: ArtifactStatus.Complete })
            ];
            const result = selectActiveBoltsDefault(bolts);
            assert.strictEqual(result.length, 0);
        });
    });

    // ========================================================================
    // Bolt Categorization Tests
    // ========================================================================

    suite('selectPendingBolts', () => {

        test('should return only draft and blocked bolts', () => {
            const bolts = [
                createBolt({ id: 'draft', status: ArtifactStatus.Draft }),
                createBolt({ id: 'in-progress', status: ArtifactStatus.InProgress }),
                createBolt({ id: 'complete', status: ArtifactStatus.Complete }),
                createBolt({ id: 'blocked', status: ArtifactStatus.Blocked })
            ];
            const result = selectPendingBolts(bolts);
            const ids = result.map(b => b.id);
            assert.ok(ids.includes('draft'));
            assert.ok(!ids.includes('in-progress'));
            assert.ok(!ids.includes('complete'));
        });
    });

    suite('selectCompletedBolts', () => {

        test('should return only complete bolts', () => {
            const bolts = [
                createBolt({ id: 'draft', status: ArtifactStatus.Draft }),
                createBolt({ id: 'complete-1', status: ArtifactStatus.Complete }),
                createBolt({ id: 'complete-2', status: ArtifactStatus.Complete })
            ];
            const result = selectCompletedBolts(bolts);
            assert.strictEqual(result.length, 2);
            assert.ok(result.every(b => b.status === ArtifactStatus.Complete));
        });
    });

    suite('selectBoltStats', () => {

        test('should calculate correct statistics', () => {
            const bolts = [
                createBolt({ status: ArtifactStatus.InProgress }),
                createBolt({ status: ArtifactStatus.InProgress }),
                createBolt({ status: ArtifactStatus.Draft }),
                createBolt({ status: ArtifactStatus.Complete }),
                createBolt({ status: ArtifactStatus.Blocked })
            ];
            const stats = selectBoltStats(bolts);
            assert.strictEqual(stats.active, 2);
            assert.strictEqual(stats.queued, 1);
            assert.strictEqual(stats.done, 1);
            assert.strictEqual(stats.blocked, 1);
        });

        test('should return zeros for empty bolts', () => {
            const stats = selectBoltStats([]);
            assert.strictEqual(stats.active, 0);
            assert.strictEqual(stats.queued, 0);
            assert.strictEqual(stats.done, 0);
            assert.strictEqual(stats.blocked, 0);
        });
    });

    // ========================================================================
    // Activity Feed Tests
    // ========================================================================

    suite('selectActivityFeed', () => {

        test('should return all events with filter "all"', () => {
            const now = new Date();
            const bolts = [
                createBolt({
                    id: 'bolt-1',
                    createdAt: now,
                    startedAt: now
                })
            ];
            const result = selectActivityFeed(bolts, 'all');
            // Should have both created and started events
            assert.ok(result.length >= 2);
        });

        test('should filter to stage events only', () => {
            const now = new Date();
            const bolts = [
                createBolt({
                    id: 'bolt-1',
                    createdAt: now,
                    startedAt: now,
                    stages: [{ name: 'model', order: 1, status: ArtifactStatus.Complete, completedAt: now }],
                    stagesCompleted: ['model']
                })
            ];
            const result = selectActivityFeed(bolts, 'stages');
            assert.ok(result.every(e => e.tag === 'stage'));
        });

        test('should filter to bolt events only', () => {
            const now = new Date();
            const bolts = [
                createBolt({
                    id: 'bolt-1',
                    createdAt: now,
                    startedAt: now,
                    stages: [{ name: 'model', order: 1, status: ArtifactStatus.Complete, completedAt: now }],
                    stagesCompleted: ['model']
                })
            ];
            const result = selectActivityFeed(bolts, 'bolts');
            assert.ok(result.every(e => e.tag === 'bolt'));
        });
    });

    // ========================================================================
    // Progress Metrics Tests
    // ========================================================================

    suite('selectProgressMetrics', () => {

        test('should calculate correct metrics', () => {
            const intents = [createIntent(), createIntent({ number: '002' })];
            const units = [createUnit(), createUnit({ name: 'unit-2' })];
            const stories = [
                createStory({ status: ArtifactStatus.Complete }),
                createStory({ id: '002', status: ArtifactStatus.Complete }),
                createStory({ id: '003', status: ArtifactStatus.Draft })
            ];
            const bolts = [
                createBolt({ status: ArtifactStatus.Complete }),
                createBolt({ id: 'bolt-2', status: ArtifactStatus.Draft })
            ];

            const metrics = selectProgressMetrics(intents, units, stories, bolts);

            assert.strictEqual(metrics.totalIntents, 2);
            assert.strictEqual(metrics.totalUnits, 2);
            assert.strictEqual(metrics.totalStories, 3);
            assert.strictEqual(metrics.totalBolts, 2);
            assert.strictEqual(metrics.completedStories, 2);
            assert.strictEqual(metrics.completedBolts, 1);
            assert.strictEqual(metrics.overallPercent, 67); // 2/3 = 66.67 rounded
        });

        test('should return 0 percent for empty stories', () => {
            const metrics = selectProgressMetrics([], [], [], []);
            assert.strictEqual(metrics.overallPercent, 0);
        });
    });

    // ========================================================================
    // Specs Filter Tests
    // ========================================================================

    suite('selectFilteredIntents', () => {

        test('should return all intents with filter "all"', () => {
            const intents = [
                createIntent({ status: ArtifactStatus.Draft }),
                createIntent({ number: '002', status: ArtifactStatus.InProgress }),
                createIntent({ number: '003', status: ArtifactStatus.Complete })
            ];
            const result = selectFilteredIntents(intents, 'all');
            assert.strictEqual(result.length, 3);
        });

        test('should filter to active intents', () => {
            const intents = [
                createIntent({ status: ArtifactStatus.Draft }),
                createIntent({ number: '002', status: ArtifactStatus.InProgress }),
                createIntent({ number: '003', status: ArtifactStatus.Complete })
            ];
            const result = selectFilteredIntents(intents, 'active');
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].number, '002');
        });

        test('should filter to complete intents', () => {
            const intents = [
                createIntent({ status: ArtifactStatus.Draft }),
                createIntent({ number: '002', status: ArtifactStatus.Complete })
            ];
            const result = selectFilteredIntents(intents, 'complete');
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].number, '002');
        });

        test('should filter to pending intents', () => {
            const intents = [
                createIntent({ status: ArtifactStatus.Draft }),
                createIntent({ number: '002', status: ArtifactStatus.InProgress })
            ];
            const result = selectFilteredIntents(intents, 'pending');
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].status, ArtifactStatus.Draft);
        });
    });

    // ========================================================================
    // Compute State Tests
    // ========================================================================

    suite('computeState', () => {

        test('should compute all derived values', () => {
            const intents = [createIntent({ status: ArtifactStatus.InProgress })];
            const units = [createUnit()];
            const stories = [createStory({ status: ArtifactStatus.Complete })];
            const bolts = [
                createBolt({ status: ArtifactStatus.InProgress }),
                createBolt({ id: 'bolt-2', status: ArtifactStatus.Draft })
            ];

            const computed = computeState(intents, units, stories, bolts);

            assert.ok(computed.currentIntent !== null);
            assert.ok(computed.activeBolts.length > 0);
            assert.ok(computed.pendingBolts.length > 0);
            assert.strictEqual(computed.boltStats.active, 1);
            assert.strictEqual(computed.boltStats.queued, 1);
            assert.strictEqual(computed.overallProgress.completedStories, 1);
        });
    });

    // ========================================================================
    // Indexing Tests
    // ========================================================================

    suite('indexBolts', () => {

        test('should create map indexed by id', () => {
            const bolts = [
                createBolt({ id: 'bolt-a' }),
                createBolt({ id: 'bolt-b' })
            ];
            const map = indexBolts(bolts);
            assert.strictEqual(map.size, 2);
            assert.ok(map.has('bolt-a'));
            assert.ok(map.has('bolt-b'));
        });
    });

    suite('indexIntents', () => {

        test('should create map indexed by number-name', () => {
            const intents = [
                createIntent({ number: '001', name: 'first' }),
                createIntent({ number: '002', name: 'second' })
            ];
            const map = indexIntents(intents);
            assert.strictEqual(map.size, 2);
            assert.ok(map.has('001-first'));
            assert.ok(map.has('002-second'));
        });
    });
});
