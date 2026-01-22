/**
 * Tests for StateStore.
 */

import * as assert from 'assert';
import {
    StateStore,
    createStateStore,
    createStateStoreFromModel
} from '../../state/stateStore';
import {
    SpecsMDState,
    StateChangeEvent,
    WorkspaceContext,
    ActivityFilter
} from '../../state/types';
import { Intent, Bolt, Story, Unit, Standard, ArtifactStatus, MemoryBankModel } from '../../parser/types';

suite('StateStore Test Suite', () => {

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

    function createStandard(overrides: Partial<Standard> = {}): Standard {
        return {
            name: 'test-standard',
            path: '/test/standards/test-standard.md',
            ...overrides
        };
    }

    function createMemoryBankModel(overrides: Partial<MemoryBankModel> = {}): MemoryBankModel {
        return {
            intents: [],
            bolts: [],
            standards: [],
            isProject: true,
            ...overrides
        };
    }

    // ========================================================================
    // Creation Tests
    // ========================================================================

    suite('createStateStore', () => {

        test('should create store with empty state', () => {
            const store = createStateStore();
            const state = store.getState();

            assert.ok(state);
            assert.strictEqual(state.intents.size, 0);
            assert.strictEqual(state.bolts.size, 0);
            assert.strictEqual(state.workspace.isProject, false);
        });

        test('should have default UI state', () => {
            const store = createStateStore();
            const state = store.getState();

            assert.strictEqual(state.ui.activeTab, 'bolts');
            assert.strictEqual(state.ui.activityFilter, 'all');
            assert.strictEqual(state.ui.activitySectionHeight, 200);
        });
    });

    suite('createStateStoreFromModel', () => {

        test('should load model and compute state', () => {
            const model = createMemoryBankModel({
                intents: [createIntent()],
                bolts: [createBolt({ status: ArtifactStatus.InProgress })],
                isProject: true
            });

            const store = createStateStoreFromModel(model, '/test/workspace');
            const state = store.getState();

            assert.strictEqual(state.workspace.isProject, true);
            assert.strictEqual(state.intents.size, 1);
            assert.strictEqual(state.bolts.size, 1);
            assert.ok(state.computed.activeBolts.length > 0);
        });
    });

    // ========================================================================
    // Workspace Tests
    // ========================================================================

    suite('setWorkspace', () => {

        test('should update workspace context', () => {
            const store = createStateStore();
            const workspace: WorkspaceContext = {
                name: 'my-project',
                path: '/path/to/project',
                memoryBankPath: '/path/to/project/memory-bank',
                isProject: true
            };

            store.setWorkspace(workspace);
            const state = store.getState();

            assert.strictEqual(state.workspace.name, 'my-project');
            assert.strictEqual(state.workspace.isProject, true);
        });

        test('should notify listeners on workspace change', () => {
            const store = createStateStore();
            let notified = false;
            let changedPaths: string[] = [];

            store.subscribe((event) => {
                notified = true;
                changedPaths = event.changedPaths;
            });

            store.setWorkspace({
                name: 'test',
                path: '/test',
                memoryBankPath: '/test/memory-bank',
                isProject: true
            });

            assert.ok(notified);
            assert.ok(changedPaths.includes('workspace'));
        });
    });

    // ========================================================================
    // Entity Tests
    // ========================================================================

    suite('setEntities', () => {

        test('should set intents and index by key', () => {
            const store = createStateStore();
            const intents = [
                createIntent({ number: '001', name: 'first' }),
                createIntent({ number: '002', name: 'second' })
            ];

            store.setEntities({ intents });
            const state = store.getState();

            assert.strictEqual(state.intents.size, 2);
        });

        test('should set bolts and compute dependencies', () => {
            const store = createStateStore();
            const bolts = [
                createBolt({ id: 'bolt-a', status: ArtifactStatus.Complete }),
                createBolt({ id: 'bolt-b', requiresBolts: ['bolt-a'] })
            ];

            store.setEntities({ bolts });
            const state = store.getState();

            assert.strictEqual(state.bolts.size, 2);
            // bolt-b should not be blocked since bolt-a is complete
            const boltB = state.bolts.get('bolt-b');
            assert.ok(boltB);
            assert.strictEqual(boltB.isBlocked, false);
        });

        test('should trigger recomputation when autoRecompute is true', () => {
            const store = createStateStore({ autoRecompute: true });

            store.setEntities({
                bolts: [createBolt({ status: ArtifactStatus.InProgress })]
            });

            const state = store.getState();
            assert.ok(state.computed.activeBolts.length > 0);
            assert.strictEqual(state.computed.boltStats.active, 1);
        });

        test('should notify listeners with changed paths', () => {
            const store = createStateStore();
            let changedPaths: string[] = [];

            store.subscribe((event) => {
                changedPaths = event.changedPaths;
            });

            store.setEntities({
                intents: [createIntent()],
                bolts: [createBolt()]
            });

            assert.ok(changedPaths.includes('intents'));
            assert.ok(changedPaths.includes('bolts'));
            assert.ok(changedPaths.includes('computed'));
        });
    });

    suite('updateBolt', () => {

        test('should update single bolt', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [createBolt({ id: 'bolt-1', status: ArtifactStatus.Draft })]
            });

            store.updateBolt(createBolt({ id: 'bolt-1', status: ArtifactStatus.InProgress }));

            const state = store.getState();
            const bolt = state.bolts.get('bolt-1');
            assert.ok(bolt);
            assert.strictEqual(bolt.status, ArtifactStatus.InProgress);
        });

        test('should recompute after bolt update', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [createBolt({ id: 'bolt-1', status: ArtifactStatus.Draft })]
            });

            assert.strictEqual(store.getActiveBolts().length, 0);

            store.updateBolt(createBolt({ id: 'bolt-1', status: ArtifactStatus.InProgress }));

            assert.ok(store.getActiveBolts().length > 0);
        });
    });

    // ========================================================================
    // UI State Tests
    // ========================================================================

    suite('setUIState', () => {

        test('should update UI state partially', () => {
            const store = createStateStore();

            store.setUIState({ activeTab: 'specs' });
            assert.strictEqual(store.getState().ui.activeTab, 'specs');

            store.setUIState({ activityFilter: 'bolts' });
            assert.strictEqual(store.getState().ui.activityFilter, 'bolts');
            assert.strictEqual(store.getState().ui.activeTab, 'specs'); // preserved
        });

        test('should notify listeners on UI change', () => {
            const store = createStateStore();
            let changedPaths: string[] = [];

            store.subscribe((event) => {
                changedPaths = event.changedPaths;
            });

            store.setUIState({ activeTab: 'overview' });

            assert.ok(changedPaths.includes('ui'));
        });
    });

    // ========================================================================
    // Computed Accessors Tests
    // ========================================================================

    suite('getCurrentIntent', () => {

        test('should return null when no intents', () => {
            const store = createStateStore();
            assert.strictEqual(store.getCurrentIntent(), null);
        });

        test('should return current intent when there is an active bolt', () => {
            const store = createStateStore();
            store.setEntities({
                intents: [createIntent({ name: 'my-intent' })],
                bolts: [createBolt({ status: ArtifactStatus.InProgress })]
            });

            const intent = store.getCurrentIntent();
            assert.ok(intent);
            assert.strictEqual(intent.name, 'my-intent');
        });

        test('should return null when no active or queued bolts', () => {
            const store = createStateStore();
            store.setEntities({
                intents: [createIntent({ name: 'my-intent' })]
            });

            // New behavior: return null when no active/queued work
            const intent = store.getCurrentIntent();
            assert.strictEqual(intent, null);
        });
    });

    suite('getActiveBolts', () => {

        test('should return empty array when no active bolts', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [createBolt({ status: ArtifactStatus.Draft })]
            });
            assert.strictEqual(store.getActiveBolts().length, 0);
        });

        test('should return all in-progress bolts', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [
                    createBolt({ id: 'active-bolt-1', status: ArtifactStatus.InProgress }),
                    createBolt({ id: 'active-bolt-2', status: ArtifactStatus.InProgress })
                ]
            });

            const bolts = store.getActiveBolts();
            assert.strictEqual(bolts.length, 2);
            assert.ok(bolts.some(b => b.id === 'active-bolt-1'));
            assert.ok(bolts.some(b => b.id === 'active-bolt-2'));
        });
    });

    suite('getPendingBolts', () => {

        test('should return draft bolts', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [
                    createBolt({ id: 'draft', status: ArtifactStatus.Draft }),
                    createBolt({ id: 'complete', status: ArtifactStatus.Complete })
                ]
            });

            const pending = store.getPendingBolts();
            assert.strictEqual(pending.length, 1);
            assert.strictEqual(pending[0].id, 'draft');
        });
    });

    suite('getActivityFeed', () => {

        test('should return activity events', () => {
            const store = createStateStore();
            const now = new Date();
            store.setEntities({
                bolts: [createBolt({ createdAt: now, startedAt: now })]
            });

            const feed = store.getActivityFeed();
            assert.ok(feed.length >= 2); // created + started
        });

        test('should filter activity events', () => {
            const store = createStateStore();
            const now = new Date();
            store.setEntities({
                bolts: [createBolt({
                    createdAt: now,
                    startedAt: now,
                    stages: [{ name: 'model', order: 1, status: ArtifactStatus.Complete, completedAt: now }],
                    stagesCompleted: ['model']
                })]
            });

            const boltEvents = store.getActivityFeed('bolts');
            assert.ok(boltEvents.every(e => e.tag === 'bolt'));
        });
    });

    suite('getBoltStats', () => {

        test('should return correct statistics', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [
                    createBolt({ id: 'a', status: ArtifactStatus.InProgress }),
                    createBolt({ id: 'b', status: ArtifactStatus.Draft }),
                    createBolt({ id: 'c', status: ArtifactStatus.Complete })
                ]
            });

            const stats = store.getBoltStats();
            assert.strictEqual(stats.active, 1);
            assert.strictEqual(stats.queued, 1);
            assert.strictEqual(stats.done, 1);
        });
    });

    suite('getProgressMetrics', () => {

        test('should return progress metrics', () => {
            const model = createMemoryBankModel({
                intents: [
                    createIntent({
                        units: [
                            createUnit({
                                stories: [
                                    createStory({ status: ArtifactStatus.Complete }),
                                    createStory({ id: '002', status: ArtifactStatus.Draft })
                                ]
                            })
                        ]
                    })
                ],
                bolts: [createBolt()]
            });

            const store = createStateStoreFromModel(model, '/test');
            const metrics = store.getProgressMetrics();

            assert.strictEqual(metrics.totalIntents, 1);
            assert.strictEqual(metrics.totalStories, 2);
            assert.strictEqual(metrics.completedStories, 1);
            assert.strictEqual(metrics.overallPercent, 50);
        });
    });

    // ========================================================================
    // Subscription Tests
    // ========================================================================

    suite('subscribe', () => {

        test('should return unsubscribe function', () => {
            const store = createStateStore();
            let callCount = 0;

            const unsubscribe = store.subscribe(() => {
                callCount++;
            });

            store.setUIState({ activeTab: 'specs' });
            assert.strictEqual(callCount, 1);

            unsubscribe();

            store.setUIState({ activeTab: 'overview' });
            assert.strictEqual(callCount, 1); // no additional calls
        });

        test('should handle errors in listeners gracefully', () => {
            const store = createStateStore();
            let secondListenerCalled = false;

            store.subscribe(() => {
                throw new Error('Listener error');
            });

            store.subscribe(() => {
                secondListenerCalled = true;
            });

            // Should not throw
            store.setUIState({ activeTab: 'specs' });
            assert.ok(secondListenerCalled);
        });
    });

    // ========================================================================
    // Recompute Tests
    // ========================================================================

    suite('recompute', () => {

        test('should manually trigger recomputation', () => {
            const store = createStateStore({ autoRecompute: false });

            store.setEntities({
                bolts: [createBolt({ status: ArtifactStatus.InProgress })]
            });

            // Without auto-recompute, computed state is stale
            assert.strictEqual(store.getState().computed.boltStats.active, 0);

            store.recompute();

            assert.strictEqual(store.getState().computed.boltStats.active, 1);
        });
    });

    // ========================================================================
    // Webview Snapshot Tests
    // ========================================================================

    suite('getWebviewSnapshot', () => {

        test('should return snapshot with all data', () => {
            const model = createMemoryBankModel({
                intents: [createIntent()],
                bolts: [createBolt({ status: ArtifactStatus.InProgress })],
                standards: [createStandard()],
                isProject: true
            });

            const store = createStateStoreFromModel(model, '/test');
            const snapshot = store.getWebviewSnapshot();

            assert.ok(snapshot.currentIntent !== null);
            assert.ok(snapshot.activeBolts.length > 0);
            assert.strictEqual(snapshot.intents.length, 1);
            assert.strictEqual(snapshot.standards.length, 1);
            assert.strictEqual(snapshot.isProject, true);
            assert.strictEqual(snapshot.ui.activeTab, 'bolts');
        });
    });

    // ========================================================================
    // Disposal Tests
    // ========================================================================

    suite('dispose', () => {

        test('should clear listeners after dispose', () => {
            const store = createStateStore();
            let callCount = 0;

            store.subscribe(() => {
                callCount++;
            });

            store.setUIState({ activeTab: 'specs' });
            assert.strictEqual(callCount, 1);

            store.dispose();

            store.setUIState({ activeTab: 'overview' });
            assert.strictEqual(callCount, 1); // no additional calls
        });

        test('should reset state after dispose', () => {
            const store = createStateStore();
            store.setEntities({
                bolts: [createBolt()]
            });

            store.dispose();

            assert.strictEqual(store.getState().bolts.size, 0);
        });
    });

    // ========================================================================
    // loadFromModel Tests
    // ========================================================================

    suite('loadFromModel', () => {

        test('should extract units and stories from intents', () => {
            const unit = createUnit({
                stories: [
                    createStory({ id: 'story-1' }),
                    createStory({ id: 'story-2' })
                ]
            });
            const intent = createIntent({ units: [unit] });
            const model = createMemoryBankModel({ intents: [intent] });

            const store = createStateStore();
            store.loadFromModel(model, '/test');

            const state = store.getState();
            assert.strictEqual(state.intents.size, 1);
            assert.strictEqual(state.units.size, 1);
            assert.strictEqual(state.stories.size, 2);
        });

        test('should set workspace from path', () => {
            const model = createMemoryBankModel({ isProject: true });

            const store = createStateStore();
            store.loadFromModel(model, '/path/to/my-project');

            const state = store.getState();
            assert.strictEqual(state.workspace.name, 'my-project');
            assert.strictEqual(state.workspace.path, '/path/to/my-project');
            assert.strictEqual(state.workspace.isProject, true);
        });
    });
});
