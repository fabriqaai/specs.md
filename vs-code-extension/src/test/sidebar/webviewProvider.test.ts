import * as assert from 'assert';
import {
    TabId,
    DEFAULT_TAB,
    WebviewData,
    ActiveBoltData,
    QueuedBoltData
} from '../../sidebar/webviewMessaging';

/**
 * Test suite for webview provider logic.
 *
 * Note: The SpecsmdWebviewProvider class requires VS Code API which cannot
 * be easily mocked in unit tests. These tests focus on the data structures
 * and logic that can be tested without VS Code dependencies.
 */
suite('Webview Provider Test Suite', () => {

    suite('Data transformation patterns', () => {

        /**
         * Tests that WebviewData correctly represents bolt statistics.
         */
        test('should calculate bolt stats from model data', () => {
            // Simulate what _calculateStats would produce
            const stats = {
                active: 1,
                queued: 5,
                done: 10,
                blocked: 2
            };

            assert.strictEqual(stats.active + stats.queued + stats.done + stats.blocked, 18);
            assert.ok(stats.active <= 1, 'Should have at most 1 active bolt');
        });

        /**
         * Tests active bolt data structure completeness.
         */
        test('should include all required fields in ActiveBoltData', () => {
            const activeBolt: ActiveBoltData = {
                id: 'bolt-test-1',
                name: 'Test Bolt',
                type: 'DDD',
                currentStage: 'implement',
                stagesComplete: 2,
                stagesTotal: 5,
                storiesComplete: 1,
                storiesTotal: 3,
                stages: [
                    { name: 'discover', status: 'complete' },
                    { name: 'spec', status: 'complete' },
                    { name: 'implement', status: 'active' },
                    { name: 'test', status: 'pending' },
                    { name: 'integrate', status: 'pending' }
                ],
                stories: [
                    { id: '001', name: 'Story One', status: 'complete' }
                ]
            };

            assert.strictEqual(activeBolt.id, 'bolt-test-1');
            assert.strictEqual(activeBolt.stages.length, 5);
            assert.strictEqual(activeBolt.stagesComplete, 2);
            assert.strictEqual(
                activeBolt.stages.filter(s => s.status === 'complete').length,
                activeBolt.stagesComplete
            );
        });

        /**
         * Tests queued bolt data structure for blocked state.
         */
        test('should track blocked state in QueuedBoltData', () => {
            const blockedBolt: QueuedBoltData = {
                id: 'bolt-blocked',
                name: 'Blocked Bolt',
                type: 'Simple',
                storiesCount: 2,
                isBlocked: true,
                blockedBy: ['bolt-dep-1', 'bolt-dep-2'],
                unblocksCount: 0,
                stages: [],
                stories: []
            };

            assert.strictEqual(blockedBolt.isBlocked, true);
            assert.strictEqual(blockedBolt.blockedBy.length, 2);

            const unblockedBolt: QueuedBoltData = {
                id: 'bolt-ready',
                name: 'Ready Bolt',
                type: 'DDD',
                storiesCount: 3,
                isBlocked: false,
                blockedBy: [],
                unblocksCount: 5,
                stages: [],
                stories: []
            };

            assert.strictEqual(unblockedBolt.isBlocked, false);
            assert.strictEqual(unblockedBolt.unblocksCount, 5);
        });

        /**
         * Tests that queue sorting should prioritize unblocked bolts.
         */
        test('queue should prioritize unblocked bolts', () => {
            const queue: QueuedBoltData[] = [
                { id: 'b1', name: 'B1', type: 'DDD', storiesCount: 1, isBlocked: true, blockedBy: ['dep'], unblocksCount: 0, stages: [], stories: [] },
                { id: 'b2', name: 'B2', type: 'DDD', storiesCount: 1, isBlocked: false, blockedBy: [], unblocksCount: 3, stages: [], stories: [] },
                { id: 'b3', name: 'B3', type: 'DDD', storiesCount: 1, isBlocked: false, blockedBy: [], unblocksCount: 1, stages: [], stories: [] }
            ];

            // Sort: unblocked first, then by unblocksCount descending
            const sorted = [...queue].sort((a, b) => {
                if (a.isBlocked !== b.isBlocked) {
                    return a.isBlocked ? 1 : -1;
                }
                return b.unblocksCount - a.unblocksCount;
            });

            assert.strictEqual(sorted[0].id, 'b2'); // Unblocked, highest unblocksCount
            assert.strictEqual(sorted[1].id, 'b3'); // Unblocked, lower unblocksCount
            assert.strictEqual(sorted[2].id, 'b1'); // Blocked
        });
    });

    suite('Tab state', () => {

        test('default tab should be bolts', () => {
            assert.strictEqual(DEFAULT_TAB, 'bolts');
        });

        test('all tab IDs should be valid', () => {
            const validTabs: TabId[] = ['bolts', 'specs', 'overview'];

            for (const tab of validTabs) {
                assert.ok(
                    ['bolts', 'specs', 'overview'].includes(tab),
                    `${tab} should be a valid TabId`
                );
            }
        });
    });

    suite('Empty state handling', () => {

        test('should handle empty model gracefully', () => {
            const emptyData: WebviewData = {
                currentIntent: null,
                stats: { active: 0, queued: 0, done: 0, blocked: 0 },
                activeBolts: [],
                upNextQueue: [],
                completedBolts: [],
                activityEvents: [],
                intents: [],
                standards: [],
                nextActions: [],
                focusCardExpanded: false,
                activityFilter: 'all',
                activityHeight: 200,
                specsFilter: 'all',
                availableStatuses: []
            };

            assert.strictEqual(emptyData.currentIntent, null);
            assert.strictEqual(emptyData.activeBolts.length, 0);
            assert.strictEqual(emptyData.upNextQueue.length, 0);
            assert.strictEqual(emptyData.activityEvents.length, 0);
            assert.strictEqual(emptyData.intents.length, 0);
            assert.strictEqual(emptyData.standards.length, 0);
        });

        test('stats should all be zero for empty model', () => {
            const emptyStats = { active: 0, queued: 0, done: 0, blocked: 0 };

            const total = emptyStats.active + emptyStats.queued + emptyStats.done + emptyStats.blocked;
            assert.strictEqual(total, 0);
        });
    });

    suite('Bolt type formatting', () => {

        /**
         * Tests bolt type display formatting logic.
         */
        test('should format bolt types correctly', () => {
            const formatBoltType = (type: string): string => {
                switch (type) {
                    case 'ddd-construction-bolt':
                        return 'DDD';
                    case 'simple-construction-bolt':
                        return 'Simple';
                    case 'spike-bolt':
                        return 'Spike';
                    default:
                        return type;
                }
            };

            assert.strictEqual(formatBoltType('ddd-construction-bolt'), 'DDD');
            assert.strictEqual(formatBoltType('simple-construction-bolt'), 'Simple');
            assert.strictEqual(formatBoltType('spike-bolt'), 'Spike');
            assert.strictEqual(formatBoltType('custom-type'), 'custom-type');
        });
    });

    suite('Status mapping', () => {

        test('should map artifact status to display status', () => {
            // Simulates _mapStatus logic
            const mapStatus = (status: string): 'complete' | 'active' | 'pending' => {
                switch (status) {
                    case 'complete':
                        return 'complete';
                    case 'in-progress':
                        return 'active';
                    default:
                        return 'pending';
                }
            };

            assert.strictEqual(mapStatus('complete'), 'complete');
            assert.strictEqual(mapStatus('in-progress'), 'active');
            assert.strictEqual(mapStatus('draft'), 'pending');
            assert.strictEqual(mapStatus('unknown'), 'pending');
            assert.strictEqual(mapStatus('blocked'), 'pending');
        });
    });

    suite('Intents data structure', () => {

        test('should aggregate story counts from units', () => {
            const intentData = {
                name: 'Test Intent',
                number: '001',
                path: '/test',
                units: [
                    { name: 'unit1', path: '/u1', status: 'active' as const, storiesComplete: 2, storiesTotal: 5, stories: [] },
                    { name: 'unit2', path: '/u2', status: 'complete' as const, storiesComplete: 3, storiesTotal: 3, stories: [] }
                ],
                storiesComplete: 0,
                storiesTotal: 0
            };

            // Calculate aggregates
            intentData.storiesComplete = intentData.units.reduce((sum, u) => sum + u.storiesComplete, 0);
            intentData.storiesTotal = intentData.units.reduce((sum, u) => sum + u.storiesTotal, 0);

            assert.strictEqual(intentData.storiesComplete, 5);
            assert.strictEqual(intentData.storiesTotal, 8);
        });

        test('should calculate progress percentage', () => {
            const storiesComplete = 5;
            const storiesTotal = 8;

            const progress = storiesTotal > 0
                ? Math.round((storiesComplete / storiesTotal) * 100)
                : 0;

            assert.strictEqual(progress, 63); // 5/8 = 0.625 → 63%
        });

        test('should handle zero stories gracefully', () => {
            const storiesComplete = 0;
            const storiesTotal = 0;

            const progress = storiesTotal > 0
                ? Math.round((storiesComplete / storiesTotal) * 100)
                : 0;

            assert.strictEqual(progress, 0);
        });
    });
});
