import * as assert from 'assert';
import {
    TabId,
    DEFAULT_TAB,
    TAB_STATE_KEY,
    FOCUS_EXPANDED_KEY,
    ACTIVITY_FILTER_KEY,
    ACTIVITY_HEIGHT_KEY,
    DEFAULT_ACTIVITY_FILTER,
    DEFAULT_ACTIVITY_HEIGHT,
    MIN_ACTIVITY_HEIGHT,
    MAX_ACTIVITY_HEIGHT,
    ActivityFilter,
    WebviewData,
    ActiveBoltData,
    QueuedBoltData,
    ActivityEventData
} from '../../sidebar/webviewMessaging';

suite('Webview Messaging Test Suite', () => {

    suite('Constants', () => {

        test('DEFAULT_TAB should be bolts', () => {
            assert.strictEqual(DEFAULT_TAB, 'bolts');
        });

        test('TAB_STATE_KEY should be specsmd.activeTab', () => {
            assert.strictEqual(TAB_STATE_KEY, 'specsmd.activeTab');
        });

        test('FOCUS_EXPANDED_KEY should be specsmd.focusCardExpanded', () => {
            assert.strictEqual(FOCUS_EXPANDED_KEY, 'specsmd.focusCardExpanded');
        });

        test('ACTIVITY_FILTER_KEY should be specsmd.activityFilter', () => {
            assert.strictEqual(ACTIVITY_FILTER_KEY, 'specsmd.activityFilter');
        });

        test('ACTIVITY_HEIGHT_KEY should be specsmd.activityHeight', () => {
            assert.strictEqual(ACTIVITY_HEIGHT_KEY, 'specsmd.activityHeight');
        });

        test('DEFAULT_ACTIVITY_FILTER should be all', () => {
            assert.strictEqual(DEFAULT_ACTIVITY_FILTER, 'all');
        });

        test('DEFAULT_ACTIVITY_HEIGHT should be 200', () => {
            assert.strictEqual(DEFAULT_ACTIVITY_HEIGHT, 200);
        });

        test('MIN_ACTIVITY_HEIGHT should be 120', () => {
            assert.strictEqual(MIN_ACTIVITY_HEIGHT, 120);
        });

        test('MAX_ACTIVITY_HEIGHT should be 500', () => {
            assert.strictEqual(MAX_ACTIVITY_HEIGHT, 500);
        });
    });

    suite('ActivityFilter type', () => {

        test('all should be valid ActivityFilter', () => {
            const filter: ActivityFilter = 'all';
            assert.strictEqual(filter, 'all');
        });

        test('stages should be valid ActivityFilter', () => {
            const filter: ActivityFilter = 'stages';
            assert.strictEqual(filter, 'stages');
        });

        test('bolts should be valid ActivityFilter', () => {
            const filter: ActivityFilter = 'bolts';
            assert.strictEqual(filter, 'bolts');
        });
    });

    suite('TabId type', () => {

        test('bolts should be valid TabId', () => {
            const tab: TabId = 'bolts';
            assert.strictEqual(tab, 'bolts');
        });

        test('specs should be valid TabId', () => {
            const tab: TabId = 'specs';
            assert.strictEqual(tab, 'specs');
        });

        test('overview should be valid TabId', () => {
            const tab: TabId = 'overview';
            assert.strictEqual(tab, 'overview');
        });
    });

    suite('WebviewData interface', () => {

        test('should accept empty data structure', () => {
            const data: WebviewData = {
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

            assert.strictEqual(data.currentIntent, null);
            assert.strictEqual(data.stats.active, 0);
            assert.strictEqual(data.activeBolts.length, 0);
            assert.strictEqual(data.upNextQueue.length, 0);
            assert.strictEqual(data.focusCardExpanded, false);
            assert.strictEqual(data.activityFilter, 'all');
            assert.strictEqual(data.activityHeight, 200);
        });

        test('should track UI state properties', () => {
            const data: WebviewData = {
                currentIntent: null,
                stats: { active: 0, queued: 0, done: 0, blocked: 0 },
                activeBolts: [],
                upNextQueue: [],
                completedBolts: [],
                activityEvents: [],
                intents: [],
                standards: [],
                nextActions: [],
                focusCardExpanded: true,
                activityFilter: 'stages',
                activityHeight: 350,
                specsFilter: 'active',
                availableStatuses: ['draft', 'in-progress', 'complete']
            };

            assert.strictEqual(data.focusCardExpanded, true);
            assert.strictEqual(data.activityFilter, 'stages');
            assert.strictEqual(data.activityHeight, 350);
        });

        test('should accept complete data structure', () => {
            const data: WebviewData = {
                currentIntent: { name: 'Test Intent', number: '001' },
                stats: { active: 1, queued: 3, done: 5, blocked: 2 },
                activeBolts: [{
                    id: 'bolt-1',
                    name: 'Test Bolt',
                    type: 'DDD',
                    currentStage: 'implement',
                    stagesComplete: 2,
                    stagesTotal: 5,
                    storiesComplete: 1,
                    storiesTotal: 3,
                    stages: [
                        { name: 'spec', status: 'complete' },
                        { name: 'implement', status: 'active' }
                    ],
                    stories: [
                        { id: '001', name: 'Story 1', status: 'complete' }
                    ]
                }],
                upNextQueue: [
                    {
                        id: 'bolt-2',
                        name: 'Next Bolt',
                        type: 'Simple',
                        storiesCount: 2,
                        isBlocked: false,
                        blockedBy: [],
                        unblocksCount: 1,
                        stages: [],
                        stories: []
                    }
                ],
                completedBolts: [],
                activityEvents: [
                    {
                        id: 'evt-1',
                        type: 'bolt-start',
                        text: 'Started bolt',
                        target: 'bolt-1',
                        tag: 'bolt',
                        relativeTime: '5m ago',
                        exactTime: 'Thu, Dec 26, 2024, 10:00:00 AM'
                    }
                ],
                intents: [
                    {
                        name: 'Test Intent',
                        number: '001',
                        path: '/test/path',
                        storiesComplete: 3,
                        storiesTotal: 5,
                        units: []
                    }
                ],
                standards: [
                    { name: 'coding-standards', path: '/standards/coding.md' }
                ],
                nextActions: [],
                focusCardExpanded: true,
                activityFilter: 'bolts',
                activityHeight: 300,
                specsFilter: 'complete',
                availableStatuses: ['complete', 'in-progress']
            };

            assert.strictEqual(data.currentIntent?.name, 'Test Intent');
            assert.strictEqual(data.stats.active, 1);
            assert.strictEqual(data.activeBolts[0]?.currentStage, 'implement');
            assert.strictEqual(data.upNextQueue.length, 1);
            assert.strictEqual(data.activityEvents.length, 1);
        });
    });

    suite('ActiveBoltData interface', () => {

        test('should track stage progress', () => {
            const bolt: ActiveBoltData = {
                id: 'bolt-test',
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
                stories: []
            };

            assert.strictEqual(bolt.stagesComplete, 2);
            assert.strictEqual(bolt.stagesTotal, 5);
            assert.strictEqual(bolt.stages.filter(s => s.status === 'complete').length, 2);
            assert.strictEqual(bolt.stages.filter(s => s.status === 'active').length, 1);
        });

        test('should handle null currentStage', () => {
            const bolt: ActiveBoltData = {
                id: 'bolt-test',
                name: 'Test Bolt',
                type: 'Simple',
                currentStage: null,
                stagesComplete: 0,
                stagesTotal: 3,
                storiesComplete: 0,
                storiesTotal: 2,
                stages: [],
                stories: []
            };

            assert.strictEqual(bolt.currentStage, null);
        });
    });

    suite('QueuedBoltData interface', () => {

        test('should track blocked status', () => {
            const bolt: QueuedBoltData = {
                id: 'bolt-blocked',
                name: 'Blocked Bolt',
                type: 'DDD',
                storiesCount: 3,
                isBlocked: true,
                blockedBy: ['bolt-dep-1', 'bolt-dep-2'],
                unblocksCount: 0,
                stages: [],
                stories: []
            };

            assert.strictEqual(bolt.isBlocked, true);
            assert.strictEqual(bolt.blockedBy.length, 2);
            assert.ok(bolt.blockedBy.includes('bolt-dep-1'));
        });

        test('should track unblocks count', () => {
            const bolt: QueuedBoltData = {
                id: 'bolt-key',
                name: 'Key Bolt',
                type: 'Simple',
                storiesCount: 1,
                isBlocked: false,
                blockedBy: [],
                unblocksCount: 5,
                stages: [],
                stories: []
            };

            assert.strictEqual(bolt.unblocksCount, 5);
        });
    });

    suite('ActivityEventData interface', () => {

        test('should accept bolt-created event', () => {
            const event: ActivityEventData = {
                id: 'evt-1',
                type: 'bolt-created',
                text: 'Bolt created',
                target: 'bolt-1',
                tag: 'bolt',
                relativeTime: '2h ago',
                exactTime: 'Thu, Dec 26, 2024, 08:00:00 AM'
            };

            assert.strictEqual(event.type, 'bolt-created');
            assert.strictEqual(event.tag, 'bolt');
        });

        test('should accept stage-complete event', () => {
            const event: ActivityEventData = {
                id: 'evt-2',
                type: 'stage-complete',
                text: 'spec stage completed',
                target: 'bolt-1',
                tag: 'stage',
                relativeTime: '30m ago',
                exactTime: 'Thu, Dec 26, 2024, 09:30:00 AM'
            };

            assert.strictEqual(event.type, 'stage-complete');
            assert.strictEqual(event.tag, 'stage');
        });

        test('should accept all event types', () => {
            const types: ActivityEventData['type'][] = [
                'bolt-created',
                'bolt-start',
                'stage-complete',
                'bolt-complete'
            ];

            for (const type of types) {
                const event: ActivityEventData = {
                    id: `evt-${type}`,
                    type,
                    text: `Event ${type}`,
                    target: 'bolt-1',
                    tag: type.includes('stage') ? 'stage' : 'bolt',
                    relativeTime: 'now',
                    exactTime: 'Thu, Dec 26, 2024, 10:00:00 AM'
                };
                assert.strictEqual(event.type, type);
            }
        });
    });
});
