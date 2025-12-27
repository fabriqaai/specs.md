import * as assert from 'assert';
import {
    buildActivityFeed,
    filterActivityEvents,
    limitActivityEvents,
    formatRelativeTime
} from '../../parser/activityFeed';
import { Bolt, ArtifactStatus, Stage, ActivityEvent } from '../../parser/types';

/**
 * Creates a minimal mock bolt for testing.
 */
function createMockBolt(overrides: Partial<Bolt>): Bolt {
    return {
        id: 'bolt-test-1',
        unit: 'test-unit',
        intent: 'test-intent',
        type: 'simple-construction-bolt',
        status: ArtifactStatus.Draft,
        currentStage: null,
        stages: [],
        stagesCompleted: [],
        stories: [],
        path: '/test/path',
        filePath: '/test/path/bolt.md',
        requiresBolts: [],
        enablesBolts: [],
        isBlocked: false,
        blockedBy: [],
        unblocksCount: 0,
        ...overrides
    };
}

suite('Activity Feed Test Suite', () => {

    suite('buildActivityFeed', () => {

        test('should create bolt-created event from createdAt', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    createdAt: new Date('2025-01-15T10:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].type, 'bolt-created');
            assert.strictEqual(events[0].targetId, 'bolt-1');
            assert.ok(events[0].text.includes('Created'));
        });

        test('should create bolt-start event from startedAt', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    startedAt: new Date('2025-01-15T11:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].type, 'bolt-start');
            assert.ok(events[0].text.includes('Started'));
        });

        test('should create stage-complete events from stage timestamps', () => {
            const stages: Stage[] = [
                { name: 'plan', order: 1, status: ArtifactStatus.Complete, completedAt: new Date('2025-01-15T12:00:00Z') },
                { name: 'implement', order: 2, status: ArtifactStatus.Complete, completedAt: new Date('2025-01-15T14:00:00Z') }
            ];
            const bolts = [createMockBolt({ id: 'bolt-1', stages })];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 2);
            const stageEvents = events.filter(e => e.type === 'stage-complete');
            assert.strictEqual(stageEvents.length, 2);
            assert.ok(stageEvents.some(e => e.text.includes('plan')));
            assert.ok(stageEvents.some(e => e.text.includes('implement')));
        });

        test('should create bolt-complete event from completedAt', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    completedAt: new Date('2025-01-15T16:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].type, 'bolt-complete');
            assert.ok(events[0].text.includes('Completed'));
        });

        test('should sort events by timestamp descending (most recent first)', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    createdAt: new Date('2025-01-15T10:00:00Z'),
                    startedAt: new Date('2025-01-15T11:00:00Z'),
                    completedAt: new Date('2025-01-15T16:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 3);
            assert.strictEqual(events[0].type, 'bolt-complete');
            assert.strictEqual(events[1].type, 'bolt-start');
            assert.strictEqual(events[2].type, 'bolt-created');
        });

        test('should return empty array for bolts without timestamps', () => {
            const bolts = [createMockBolt({ id: 'bolt-1' })];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 0);
        });

        test('should handle multiple bolts', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    createdAt: new Date('2025-01-15T10:00:00Z')
                }),
                createMockBolt({
                    id: 'bolt-2',
                    createdAt: new Date('2025-01-15T09:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].targetId, 'bolt-1'); // More recent first
            assert.strictEqual(events[1].targetId, 'bolt-2');
        });

        test('should set correct tags for events', () => {
            const stages: Stage[] = [
                { name: 'plan', order: 1, status: ArtifactStatus.Complete, completedAt: new Date('2025-01-15T12:00:00Z') }
            ];
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    createdAt: new Date('2025-01-15T10:00:00Z'),
                    stages
                })
            ];
            const events = buildActivityFeed(bolts);

            const boltEvent = events.find(e => e.type === 'bolt-created');
            const stageEvent = events.find(e => e.type === 'stage-complete');

            assert.strictEqual(boltEvent?.tag, 'bolt');
            assert.strictEqual(stageEvent?.tag, 'stage');
        });

        test('should include icon and iconClass for each event', () => {
            const bolts = [
                createMockBolt({
                    id: 'bolt-1',
                    createdAt: new Date('2025-01-15T10:00:00Z')
                })
            ];
            const events = buildActivityFeed(bolts);

            assert.ok(events[0].icon);
            assert.ok(events[0].iconClass);
        });
    });

    suite('filterActivityEvents', () => {

        const mockEvents: ActivityEvent[] = [
            { id: 'e1', type: 'bolt-created', timestamp: new Date(), icon: '+', iconClass: 'bolt-created', text: 'Created bolt-1', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'bolt' },
            { id: 'e2', type: 'stage-complete', timestamp: new Date(), icon: '✓', iconClass: 'stage-complete', text: 'Completed plan', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'stage' },
            { id: 'e3', type: 'bolt-complete', timestamp: new Date(), icon: '✔', iconClass: 'bolt-complete', text: 'Completed bolt-1', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'bolt' }
        ];

        test('should return all events when tag is "all"', () => {
            const result = filterActivityEvents(mockEvents, 'all');
            assert.strictEqual(result.length, 3);
        });

        test('should filter to bolt events only', () => {
            const result = filterActivityEvents(mockEvents, 'bolt');
            assert.strictEqual(result.length, 2);
            assert.ok(result.every(e => e.tag === 'bolt'));
        });

        test('should filter to stage events only', () => {
            const result = filterActivityEvents(mockEvents, 'stage');
            assert.strictEqual(result.length, 1);
            assert.ok(result.every(e => e.tag === 'stage'));
        });
    });

    suite('limitActivityEvents', () => {

        const mockEvents: ActivityEvent[] = [
            { id: 'e1', type: 'bolt-created', timestamp: new Date(), icon: '+', iconClass: 'bolt-created', text: 'Created bolt-1', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'bolt' },
            { id: 'e2', type: 'bolt-start', timestamp: new Date(), icon: '▶', iconClass: 'bolt-start', text: 'Started bolt-1', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'bolt' },
            { id: 'e3', type: 'bolt-complete', timestamp: new Date(), icon: '✔', iconClass: 'bolt-complete', text: 'Completed bolt-1', targetId: 'bolt-1', targetName: 'bolt-1', tag: 'bolt' }
        ];

        test('should limit to specified count', () => {
            const result = limitActivityEvents(mockEvents, 2);
            assert.strictEqual(result.length, 2);
        });

        test('should return all events if limit exceeds count', () => {
            const result = limitActivityEvents(mockEvents, 10);
            assert.strictEqual(result.length, 3);
        });

        test('should return empty array for limit of 0', () => {
            const result = limitActivityEvents(mockEvents, 0);
            assert.strictEqual(result.length, 0);
        });
    });

    suite('formatRelativeTime', () => {

        test('should return "Just now" for timestamps within 60 seconds', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-15T09:59:30Z');

            assert.strictEqual(formatRelativeTime(timestamp, now), 'Just now');
        });

        test('should return minutes for timestamps within an hour', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-15T09:45:00Z');

            assert.strictEqual(formatRelativeTime(timestamp, now), '15m ago');
        });

        test('should return hours for timestamps within a day', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-15T07:00:00Z');

            assert.strictEqual(formatRelativeTime(timestamp, now), '3h ago');
        });

        test('should return "Yesterday" for timestamps from previous day', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-14T10:00:00Z');

            assert.strictEqual(formatRelativeTime(timestamp, now), 'Yesterday');
        });

        test('should return days for timestamps within a week', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-12T10:00:00Z');

            assert.strictEqual(formatRelativeTime(timestamp, now), '3d ago');
        });

        test('should return date for timestamps older than a week', () => {
            const now = new Date('2025-01-15T10:00:00Z');
            const timestamp = new Date('2025-01-01T10:00:00Z');

            const result = formatRelativeTime(timestamp, now);
            // Should be a date string, not a relative time
            assert.ok(result.includes('/') || result.includes('-'));
        });
    });
});
