import * as assert from 'assert';
import {
    createRootNodes,
    createIntentNodes,
    createIntentNode,
    createUnitNodes,
    createStoryNodes,
    createBoltNodes,
    createStandardNodes,
    getChildNodes
} from '../../sidebar/treeBuilder';
import { MemoryBankModel, Intent, Unit, ArtifactStatus } from '../../parser/types';

suite('Tree Builder Test Suite', () => {

    suite('createRootNodes', () => {

        test('should create three root nodes', () => {
            const roots = createRootNodes();
            assert.strictEqual(roots.length, 3);
        });

        test('should create Intents root first', () => {
            const roots = createRootNodes();
            assert.strictEqual(roots[0].kind, 'root-intents');
            assert.strictEqual(roots[0].label, 'Intents');
            assert.strictEqual(roots[0].id, 'root-intents');
        });

        test('should create Bolts root second', () => {
            const roots = createRootNodes();
            assert.strictEqual(roots[1].kind, 'root-bolts');
            assert.strictEqual(roots[1].label, 'Bolts');
            assert.strictEqual(roots[1].id, 'root-bolts');
        });

        test('should create Standards root third', () => {
            const roots = createRootNodes();
            assert.strictEqual(roots[2].kind, 'root-standards');
            assert.strictEqual(roots[2].label, 'Standards');
            assert.strictEqual(roots[2].id, 'root-standards');
        });
    });

    suite('createIntentNode', () => {

        test('should create intent node with correct label', () => {
            const intent: Intent = {
                name: 'test-feature',
                number: '001',
                path: '/test/path',
                status: ArtifactStatus.Draft,
                units: []
            };

            const node = createIntentNode(intent);

            assert.strictEqual(node.kind, 'intent');
            assert.ok(node.label.includes('001-test-feature'));
            assert.strictEqual(node.data, intent);
        });

        test('should include status indicator for complete', () => {
            const intent: Intent = {
                name: 'complete-feature',
                number: '002',
                path: '/test/path',
                status: ArtifactStatus.Complete,
                units: []
            };

            const node = createIntentNode(intent);
            assert.ok(node.label.includes('\u2713'), 'Should include checkmark');
        });

        test('should include status indicator for in-progress', () => {
            const intent: Intent = {
                name: 'wip-feature',
                number: '003',
                path: '/test/path',
                status: ArtifactStatus.InProgress,
                units: []
            };

            const node = createIntentNode(intent);
            assert.ok(node.label.includes('\u25CF'), 'Should include filled circle');
        });
    });

    suite('createIntentNodes', () => {

        test('should create nodes for all intents', () => {
            const model: MemoryBankModel = {
                intents: [
                    { name: 'a', number: '001', path: '/a', status: ArtifactStatus.Draft, units: [] },
                    { name: 'b', number: '002', path: '/b', status: ArtifactStatus.Draft, units: [] }
                ],
                bolts: [],
                standards: [],
                isProject: true
            };

            const nodes = createIntentNodes(model);
            assert.strictEqual(nodes.length, 2);
            assert.ok(nodes[0].label.includes('001-a'));
            assert.ok(nodes[1].label.includes('002-b'));
        });
    });

    suite('createUnitNodes', () => {

        test('should create nodes for all units in intent', () => {
            const intent: Intent = {
                name: 'test',
                number: '001',
                path: '/test',
                status: ArtifactStatus.Draft,
                units: [
                    { name: 'unit-a', intentName: '001-test', path: '/a', status: ArtifactStatus.Draft, stories: [] },
                    { name: 'unit-b', intentName: '001-test', path: '/b', status: ArtifactStatus.Complete, stories: [] }
                ]
            };

            const nodes = createUnitNodes(intent);
            assert.strictEqual(nodes.length, 2);
            assert.ok(nodes[0].label.includes('unit-a'));
            assert.ok(nodes[1].label.includes('unit-b'));
        });
    });

    suite('createStoryNodes', () => {

        test('should create nodes for all stories in unit', () => {
            const unit: Unit = {
                name: 'test-unit',
                intentName: '001-test',
                path: '/test',
                status: ArtifactStatus.Draft,
                stories: [
                    { id: '001', title: 'first-story', unitName: 'test-unit', intentName: '001-test', path: '/s1', status: ArtifactStatus.Complete, priority: 'must' },
                    { id: '002', title: 'second-story', unitName: 'test-unit', intentName: '001-test', path: '/s2', status: ArtifactStatus.Draft, priority: 'should' }
                ]
            };

            const nodes = createStoryNodes(unit);
            assert.strictEqual(nodes.length, 2);
            assert.ok(nodes[0].label.includes('001-first-story'));
            assert.ok(nodes[1].label.includes('002-second-story'));
        });
    });

    suite('createBoltNodes', () => {

        test('should create nodes for all bolts', () => {
            const model: MemoryBankModel = {
                intents: [],
                bolts: [
                    {
                        id: 'bolt-test-1',
                        unit: 'test-unit',
                        intent: 'test-intent',
                        type: 'simple-construction-bolt',
                        status: ArtifactStatus.Complete,
                        currentStage: null,
                        stages: [],
                        stagesCompleted: ['plan', 'implement', 'test'],
                        stories: [],
                        path: '/bolt1',
                        filePath: '/bolt1/bolt.md',
                        requiresBolts: [],
                        enablesBolts: [],
                        isBlocked: false,
                        blockedBy: [],
                        unblocksCount: 0
                    }
                ],
                standards: [],
                isProject: true
            };

            const nodes = createBoltNodes(model);
            assert.strictEqual(nodes.length, 1);
            assert.ok(nodes[0].label.includes('bolt-test-1'));
        });

        test('should show current stage for in-progress bolts', () => {
            const model: MemoryBankModel = {
                intents: [],
                bolts: [
                    {
                        id: 'bolt-wip-1',
                        unit: 'test-unit',
                        intent: 'test-intent',
                        type: 'simple-construction-bolt',
                        status: ArtifactStatus.InProgress,
                        currentStage: 'implement',
                        stages: [],
                        stagesCompleted: ['plan'],
                        stories: [],
                        path: '/bolt1',
                        filePath: '/bolt1/bolt.md',
                        requiresBolts: [],
                        enablesBolts: [],
                        isBlocked: false,
                        blockedBy: [],
                        unblocksCount: 0
                    }
                ],
                standards: [],
                isProject: true
            };

            const nodes = createBoltNodes(model);
            assert.ok(nodes[0].label.includes('(implement)'), 'Should show current stage');
        });
    });

    suite('createStandardNodes', () => {

        test('should create nodes for all standards', () => {
            const model: MemoryBankModel = {
                intents: [],
                bolts: [],
                standards: [
                    { name: 'coding-standards', path: '/std1' },
                    { name: 'tech-stack', path: '/std2' }
                ],
                isProject: true
            };

            const nodes = createStandardNodes(model);
            assert.strictEqual(nodes.length, 2);
            assert.strictEqual(nodes[0].label, 'coding-standards');
            assert.strictEqual(nodes[1].label, 'tech-stack');
        });
    });

    suite('getChildNodes', () => {

        const testModel: MemoryBankModel = {
            intents: [
                {
                    name: 'feature',
                    number: '001',
                    path: '/intent',
                    status: ArtifactStatus.Draft,
                    units: [
                        {
                            name: 'unit1',
                            intentName: '001-feature',
                            path: '/unit',
                            status: ArtifactStatus.Draft,
                            stories: [
                                { id: '001', title: 'story1', unitName: 'unit1', intentName: '001-feature', path: '/story', status: ArtifactStatus.Draft, priority: 'must' }
                            ]
                        }
                    ]
                }
            ],
            bolts: [
                {
                    id: 'bolt-1',
                    unit: 'unit1',
                    intent: '001-feature',
                    type: 'simple-construction-bolt',
                    status: ArtifactStatus.Draft,
                    currentStage: null,
                    stages: [],
                    stagesCompleted: [],
                    stories: [],
                    path: '/bolt',
                    filePath: '/bolt/bolt.md',
                    requiresBolts: [],
                    enablesBolts: [],
                    isBlocked: false,
                    blockedBy: [],
                    unblocksCount: 0
                }
            ],
            standards: [{ name: 'standard1', path: '/std' }],
            isProject: true
        };

        test('should return intents for root-intents', () => {
            const children = getChildNodes({ kind: 'root-intents', label: 'Intents', id: 'root-intents' }, testModel);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].kind, 'intent');
        });

        test('should return bolts for root-bolts', () => {
            const children = getChildNodes({ kind: 'root-bolts', label: 'Bolts', id: 'root-bolts' }, testModel);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].kind, 'bolt');
        });

        test('should return standards for root-standards', () => {
            const children = getChildNodes({ kind: 'root-standards', label: 'Standards', id: 'root-standards' }, testModel);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].kind, 'standard');
        });

        test('should return units for intent', () => {
            const intentNode = createIntentNode(testModel.intents[0]);
            const children = getChildNodes(intentNode, testModel);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].kind, 'unit');
        });

        test('should return stories for unit', () => {
            const unitNode = createUnitNodes(testModel.intents[0])[0];
            const children = getChildNodes(unitNode, testModel);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].kind, 'story');
        });

        test('should return empty array for story', () => {
            const storyNode = createStoryNodes(testModel.intents[0].units[0])[0];
            const children = getChildNodes(storyNode, testModel);
            assert.strictEqual(children.length, 0);
        });

        test('should return empty array for bolt without stages/stories', () => {
            const boltNode = createBoltNodes(testModel)[0];
            const children = getChildNodes(boltNode, testModel);
            // Bolt has no stages or stories, so no child groups
            assert.strictEqual(children.length, 0);
        });
    });
});
