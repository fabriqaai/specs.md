import * as assert from 'assert';
import {
    computeBoltDependencies,
    getUpNextBolts,
    isBoltBlocked,
    getBlockingBolts,
    countUnblocks
} from '../../parser/dependencyComputation';
import { Bolt, ArtifactStatus } from '../../parser/types';

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

suite('Dependency Computation Test Suite', () => {

    suite('computeBoltDependencies', () => {

        test('should compute isBlocked=false for bolt with no dependencies', () => {
            const bolts = [createMockBolt({ id: 'bolt-1' })];
            const result = computeBoltDependencies(bolts);

            assert.strictEqual(result[0].isBlocked, false);
            assert.deepStrictEqual(result[0].blockedBy, []);
        });

        test('should compute isBlocked=true when required bolt is incomplete', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-dep'] })
            ];
            const result = computeBoltDependencies(bolts);

            const mainBolt = result.find(b => b.id === 'bolt-main');
            assert.strictEqual(mainBolt?.isBlocked, true);
            assert.deepStrictEqual(mainBolt?.blockedBy, ['bolt-dep']);
        });

        test('should compute isBlocked=false when required bolt is complete', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-dep'] })
            ];
            const result = computeBoltDependencies(bolts);

            const mainBolt = result.find(b => b.id === 'bolt-main');
            assert.strictEqual(mainBolt?.isBlocked, false);
            assert.deepStrictEqual(mainBolt?.blockedBy, []);
        });

        test('should compute unblocksCount correctly', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-foundation', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-a', requiresBolts: ['bolt-foundation'] }),
                createMockBolt({ id: 'bolt-b', requiresBolts: ['bolt-foundation'] }),
                createMockBolt({ id: 'bolt-c', requiresBolts: ['bolt-foundation'] })
            ];
            const result = computeBoltDependencies(bolts);

            const foundationBolt = result.find(b => b.id === 'bolt-foundation');
            assert.strictEqual(foundationBolt?.unblocksCount, 3);
        });

        test('should set status to Blocked when draft bolt is blocked', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-main', status: ArtifactStatus.Draft, requiresBolts: ['bolt-dep'] })
            ];
            const result = computeBoltDependencies(bolts);

            const mainBolt = result.find(b => b.id === 'bolt-main');
            assert.strictEqual(mainBolt?.status, ArtifactStatus.Blocked);
        });

        test('should not change status for complete bolt even if requirements incomplete', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-main', status: ArtifactStatus.Complete, requiresBolts: ['bolt-dep'] })
            ];
            const result = computeBoltDependencies(bolts);

            const mainBolt = result.find(b => b.id === 'bolt-main');
            assert.strictEqual(mainBolt?.status, ArtifactStatus.Complete);
            assert.strictEqual(mainBolt?.isBlocked, false);
        });

        test('should handle non-existent required bolt as blocking', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-nonexistent'] })
            ];
            const result = computeBoltDependencies(bolts);

            assert.strictEqual(result[0].isBlocked, true);
            assert.deepStrictEqual(result[0].blockedBy, ['bolt-nonexistent']);
        });

        test('should handle multiple dependencies with mixed statuses', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-a', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-b', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-c', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-a', 'bolt-b', 'bolt-c'] })
            ];
            const result = computeBoltDependencies(bolts);

            const mainBolt = result.find(b => b.id === 'bolt-main');
            assert.strictEqual(mainBolt?.isBlocked, true);
            assert.deepStrictEqual(mainBolt?.blockedBy, ['bolt-b']);
        });
    });

    suite('getUpNextBolts', () => {

        test('should return only draft and blocked bolts', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-complete', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-wip', status: ArtifactStatus.InProgress }),
                createMockBolt({ id: 'bolt-draft', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-blocked', status: ArtifactStatus.Blocked })
            ];
            const result = getUpNextBolts(bolts);

            assert.strictEqual(result.length, 2);
            const ids = result.map(b => b.id);
            assert.ok(ids.includes('bolt-draft'));
            assert.ok(ids.includes('bolt-blocked'));
        });

        test('should sort unblocked bolts before blocked bolts', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-blocked', status: ArtifactStatus.Draft, isBlocked: true }),
                createMockBolt({ id: 'bolt-unblocked', status: ArtifactStatus.Draft, isBlocked: false })
            ];
            const result = getUpNextBolts(bolts);

            assert.strictEqual(result[0].id, 'bolt-unblocked');
            assert.strictEqual(result[1].id, 'bolt-blocked');
        });

        test('should sort by unblocksCount within unblocked bolts', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-low', status: ArtifactStatus.Draft, isBlocked: false, unblocksCount: 1 }),
                createMockBolt({ id: 'bolt-high', status: ArtifactStatus.Draft, isBlocked: false, unblocksCount: 5 }),
                createMockBolt({ id: 'bolt-mid', status: ArtifactStatus.Draft, isBlocked: false, unblocksCount: 3 })
            ];
            const result = getUpNextBolts(bolts);

            assert.strictEqual(result[0].id, 'bolt-high');
            assert.strictEqual(result[1].id, 'bolt-mid');
            assert.strictEqual(result[2].id, 'bolt-low');
        });

        test('should sort by id for equal priority', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-z', status: ArtifactStatus.Draft, isBlocked: false, unblocksCount: 0 }),
                createMockBolt({ id: 'bolt-a', status: ArtifactStatus.Draft, isBlocked: false, unblocksCount: 0 })
            ];
            const result = getUpNextBolts(bolts);

            assert.strictEqual(result[0].id, 'bolt-a');
            assert.strictEqual(result[1].id, 'bolt-z');
        });

        test('should return empty array for all complete bolts', () => {
            const bolts = [
                createMockBolt({ id: 'bolt-1', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-2', status: ArtifactStatus.Complete })
            ];
            const result = getUpNextBolts(bolts);

            assert.strictEqual(result.length, 0);
        });
    });

    suite('isBoltBlocked', () => {

        test('should return false for complete bolt', () => {
            const bolt = createMockBolt({ status: ArtifactStatus.Complete, requiresBolts: ['bolt-incomplete'] });
            const allBolts = [
                bolt,
                createMockBolt({ id: 'bolt-incomplete', status: ArtifactStatus.Draft })
            ];

            assert.strictEqual(isBoltBlocked(bolt, allBolts), false);
        });

        test('should return false for bolt with no requirements', () => {
            const bolt = createMockBolt({ requiresBolts: [] });

            assert.strictEqual(isBoltBlocked(bolt, [bolt]), false);
        });

        test('should return true when any required bolt is incomplete', () => {
            const bolt = createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-dep'] });
            const allBolts = [
                bolt,
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Draft })
            ];

            assert.strictEqual(isBoltBlocked(bolt, allBolts), true);
        });

        test('should return false when all required bolts are complete', () => {
            const bolt = createMockBolt({ id: 'bolt-main', requiresBolts: ['bolt-dep'] });
            const allBolts = [
                bolt,
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Complete })
            ];

            assert.strictEqual(isBoltBlocked(bolt, allBolts), false);
        });
    });

    suite('getBlockingBolts', () => {

        test('should return empty array for complete bolt', () => {
            const bolt = createMockBolt({ status: ArtifactStatus.Complete, requiresBolts: ['bolt-dep'] });
            const allBolts = [
                bolt,
                createMockBolt({ id: 'bolt-dep', status: ArtifactStatus.Draft })
            ];

            assert.deepStrictEqual(getBlockingBolts(bolt, allBolts), []);
        });

        test('should return IDs of incomplete required bolts', () => {
            const bolt = createMockBolt({
                id: 'bolt-main',
                requiresBolts: ['bolt-a', 'bolt-b', 'bolt-c']
            });
            const allBolts = [
                bolt,
                createMockBolt({ id: 'bolt-a', status: ArtifactStatus.Complete }),
                createMockBolt({ id: 'bolt-b', status: ArtifactStatus.Draft }),
                createMockBolt({ id: 'bolt-c', status: ArtifactStatus.InProgress })
            ];

            const result = getBlockingBolts(bolt, allBolts);
            assert.strictEqual(result.length, 2);
            assert.ok(result.includes('bolt-b'));
            assert.ok(result.includes('bolt-c'));
        });
    });

    suite('countUnblocks', () => {

        test('should count bolts that require this bolt', () => {
            const allBolts = [
                createMockBolt({ id: 'bolt-foundation' }),
                createMockBolt({ id: 'bolt-a', requiresBolts: ['bolt-foundation'] }),
                createMockBolt({ id: 'bolt-b', requiresBolts: ['bolt-foundation'] }),
                createMockBolt({ id: 'bolt-c', requiresBolts: ['bolt-other'] })
            ];

            assert.strictEqual(countUnblocks('bolt-foundation', allBolts), 2);
        });

        test('should return 0 for bolt with no dependents', () => {
            const allBolts = [
                createMockBolt({ id: 'bolt-leaf' }),
                createMockBolt({ id: 'bolt-other' })
            ];

            assert.strictEqual(countUnblocks('bolt-leaf', allBolts), 0);
        });
    });
});
