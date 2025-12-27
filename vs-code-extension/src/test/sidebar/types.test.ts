import * as assert from 'assert';
import {
    TreeNode,
    TreeNodeKind,
    NODE_ICONS,
    STATUS_INDICATORS,
    CollapsibleState,
    getCollapsibleState,
    isRootNode,
    isIntentNode,
    isUnitNode
} from '../../sidebar/types';
import { ArtifactStatus } from '../../parser/types';

suite('Sidebar Types Test Suite', () => {

    suite('NODE_ICONS', () => {

        test('should have icon for all node kinds', () => {
            const kinds: TreeNodeKind[] = [
                'root-intents',
                'root-bolts',
                'root-standards',
                'intent',
                'unit',
                'story',
                'bolt',
                'bolt-stages-group',
                'bolt-stage',
                'bolt-stories-group',
                'bolt-story',
                'standard'
            ];

            for (const kind of kinds) {
                assert.ok(NODE_ICONS[kind], `Missing icon for ${kind}`);
            }
        });

        test('should use folder-library for intents root', () => {
            assert.strictEqual(NODE_ICONS['root-intents'], 'folder-library');
        });

        test('should use tools for bolts root', () => {
            assert.strictEqual(NODE_ICONS['root-bolts'], 'tools');
        });

        test('should use law for standards root', () => {
            assert.strictEqual(NODE_ICONS['root-standards'], 'law');
        });
    });

    suite('STATUS_INDICATORS', () => {

        test('should have indicator for complete status', () => {
            assert.strictEqual(STATUS_INDICATORS[ArtifactStatus.Complete], '\u2713');
        });

        test('should have indicator for in-progress status', () => {
            assert.strictEqual(STATUS_INDICATORS[ArtifactStatus.InProgress], '\u25CF');
        });

        test('should have indicator for draft status', () => {
            assert.strictEqual(STATUS_INDICATORS[ArtifactStatus.Draft], '\u25CB');
        });

        test('should have empty indicator for unknown status', () => {
            assert.strictEqual(STATUS_INDICATORS[ArtifactStatus.Unknown], '');
        });
    });

    suite('getCollapsibleState', () => {

        test('should return Expanded for root-intents', () => {
            const node: TreeNode = {
                kind: 'root-intents',
                label: 'Intents',
                id: 'root-intents'
            };
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.Expanded);
        });

        test('should return Expanded for root-bolts', () => {
            const node: TreeNode = {
                kind: 'root-bolts',
                label: 'Bolts',
                id: 'root-bolts'
            };
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.Expanded);
        });

        test('should return Collapsed for intent with units', () => {
            const node: TreeNode = {
                kind: 'intent',
                label: '001-test-intent',
                id: 'intent-001-test-intent',
                data: {
                    name: 'test-intent',
                    number: '001',
                    path: '/test/path',
                    status: ArtifactStatus.Draft,
                    units: [{ name: 'unit1', intentName: '001-test-intent', path: '/test', status: ArtifactStatus.Draft, stories: [] }]
                }
            };
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.Collapsed);
        });

        test('should return None for intent without units', () => {
            const node: TreeNode = {
                kind: 'intent',
                label: '001-test-intent',
                id: 'intent-001-test-intent',
                data: {
                    name: 'test-intent',
                    number: '001',
                    path: '/test/path',
                    status: ArtifactStatus.Draft,
                    units: []
                }
            };
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.None);
        });

        test('should return None for story', () => {
            const node: TreeNode = {
                kind: 'story',
                label: '001-test-story',
                id: 'story-001-test-story',
                data: {
                    id: '001',
                    title: 'test-story',
                    unitName: 'test-unit',
                    intentName: 'test-intent',
                    path: '/test/path',
                    status: ArtifactStatus.Draft,
                    priority: 'must'
                }
            };
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.None);
        });

        test('should return Collapsed for bolt (always expandable)', () => {
            const node: TreeNode = {
                kind: 'bolt',
                label: 'bolt-test-1',
                id: 'bolt-bolt-test-1',
                data: {
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
                    unblocksCount: 0
                }
            };
            // Bolts are always Collapsed to show stages/stories groups
            assert.strictEqual(getCollapsibleState(node), CollapsibleState.Collapsed);
        });
    });

    suite('Type Guards', () => {

        test('isRootNode should return true for root-intents', () => {
            const node: TreeNode = {
                kind: 'root-intents',
                label: 'Intents',
                id: 'root-intents'
            };
            assert.strictEqual(isRootNode(node), true);
        });

        test('isRootNode should return true for root-bolts', () => {
            const node: TreeNode = {
                kind: 'root-bolts',
                label: 'Bolts',
                id: 'root-bolts'
            };
            assert.strictEqual(isRootNode(node), true);
        });

        test('isRootNode should return false for intent', () => {
            const node: TreeNode = {
                kind: 'intent',
                label: '001-test',
                id: 'intent-001-test',
                data: {
                    name: 'test',
                    number: '001',
                    path: '/test',
                    status: ArtifactStatus.Draft,
                    units: []
                }
            };
            assert.strictEqual(isRootNode(node), false);
        });

        test('isIntentNode should return true for intent', () => {
            const node: TreeNode = {
                kind: 'intent',
                label: '001-test',
                id: 'intent-001-test',
                data: {
                    name: 'test',
                    number: '001',
                    path: '/test',
                    status: ArtifactStatus.Draft,
                    units: []
                }
            };
            assert.strictEqual(isIntentNode(node), true);
        });

        test('isUnitNode should return true for unit', () => {
            const node: TreeNode = {
                kind: 'unit',
                label: 'test-unit',
                id: 'unit-001-test-test-unit',
                data: {
                    name: 'test-unit',
                    intentName: '001-test',
                    path: '/test',
                    status: ArtifactStatus.Draft,
                    stories: []
                }
            };
            assert.strictEqual(isUnitNode(node), true);
        });
    });
});
