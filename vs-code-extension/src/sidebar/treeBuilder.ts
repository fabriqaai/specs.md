/**
 * Tree building functions for converting parsed artifacts to tree nodes.
 */

import { MemoryBankModel, Intent, Unit, Story, Bolt, Standard, ArtifactStatus } from '../parser/types';
import {
    TreeNode,
    RootIntentsNode,
    RootBoltsNode,
    RootStandardsNode,
    IntentNode,
    UnitNode,
    StoryNode,
    BoltNode,
    BoltStagesGroupNode,
    BoltStageNode,
    BoltStoriesGroupNode,
    BoltStoryNode,
    StandardNode,
    STATUS_INDICATORS
} from './types';

/**
 * Creates root section nodes.
 */
export function createRootNodes(): TreeNode[] {
    const intentsRoot: RootIntentsNode = {
        kind: 'root-intents',
        label: 'Intents',
        id: 'root-intents'
    };

    const boltsRoot: RootBoltsNode = {
        kind: 'root-bolts',
        label: 'Bolts',
        id: 'root-bolts'
    };

    const standardsRoot: RootStandardsNode = {
        kind: 'root-standards',
        label: 'Standards',
        id: 'root-standards'
    };

    return [intentsRoot, boltsRoot, standardsRoot];
}

/**
 * Formats a label with status indicator.
 */
function formatLabelWithStatus(label: string, status: ArtifactStatus): string {
    const indicator = STATUS_INDICATORS[status];
    return indicator ? `${label} ${indicator}` : label;
}

/**
 * Creates intent nodes from model.
 */
export function createIntentNodes(model: MemoryBankModel): IntentNode[] {
    return model.intents.map(intent => createIntentNode(intent));
}

/**
 * Creates a single intent node.
 */
export function createIntentNode(intent: Intent): IntentNode {
    const label = `${intent.number}-${intent.name}`;
    return {
        kind: 'intent',
        label: formatLabelWithStatus(label, intent.status),
        id: `intent-${intent.number}-${intent.name}`,
        data: intent
    };
}

/**
 * Creates unit nodes from an intent.
 */
export function createUnitNodes(intent: Intent): UnitNode[] {
    return intent.units.map(unit => createUnitNode(unit));
}

/**
 * Creates a single unit node.
 */
export function createUnitNode(unit: Unit): UnitNode {
    return {
        kind: 'unit',
        label: formatLabelWithStatus(unit.name, unit.status),
        id: `unit-${unit.intentName}-${unit.name}`,
        data: unit
    };
}

/**
 * Creates story nodes from a unit.
 */
export function createStoryNodes(unit: Unit): StoryNode[] {
    return unit.stories.map(story => createStoryNode(story));
}

/**
 * Creates a single story node.
 */
export function createStoryNode(story: Story): StoryNode {
    const label = `${story.id}-${story.title}`;
    return {
        kind: 'story',
        label: formatLabelWithStatus(label, story.status),
        id: `story-${story.intentName}-${story.unitName}-${story.id}`,
        data: story
    };
}

/**
 * Creates bolt nodes from model.
 */
export function createBoltNodes(model: MemoryBankModel): BoltNode[] {
    return model.bolts.map(bolt => createBoltNode(bolt));
}

/**
 * Creates a single bolt node.
 */
export function createBoltNode(bolt: Bolt): BoltNode {
    let label = bolt.id;

    // Add current stage info for in-progress bolts
    if (bolt.status === ArtifactStatus.InProgress && bolt.currentStage) {
        label = `${bolt.id} (${bolt.currentStage})`;
    }

    return {
        kind: 'bolt',
        label: formatLabelWithStatus(label, bolt.status),
        id: `bolt-${bolt.id}`,
        data: bolt
    };
}

/**
 * Creates standard nodes from model.
 */
export function createStandardNodes(model: MemoryBankModel): StandardNode[] {
    return model.standards.map(standard => createStandardNode(standard));
}

/**
 * Creates a single standard node.
 */
export function createStandardNode(standard: Standard): StandardNode {
    return {
        kind: 'standard',
        label: standard.name,
        id: `standard-${standard.name}`,
        data: standard
    };
}

/**
 * Creates child nodes for a bolt (stages group and stories group).
 */
export function createBoltChildNodes(bolt: Bolt): TreeNode[] {
    const children: TreeNode[] = [];

    // Add stages group if bolt has stages
    if (bolt.stages && bolt.stages.length > 0) {
        const stagesGroup: BoltStagesGroupNode = {
            kind: 'bolt-stages-group',
            label: 'Stages',
            id: `bolt-${bolt.id}-stages`,
            boltId: bolt.id,
            data: bolt
        };
        children.push(stagesGroup);
    }

    // Add stories group if bolt has stories
    if (bolt.stories && bolt.stories.length > 0) {
        const storiesGroup: BoltStoriesGroupNode = {
            kind: 'bolt-stories-group',
            label: 'Stories',
            id: `bolt-${bolt.id}-stories`,
            boltId: bolt.id,
            data: bolt
        };
        children.push(storiesGroup);
    }

    return children;
}

/**
 * Creates stage nodes for a bolt.
 */
export function createBoltStageNodes(bolt: Bolt): BoltStageNode[] {
    if (!bolt.stages) {
        return [];
    }

    return bolt.stages.map(stage => ({
        kind: 'bolt-stage' as const,
        label: formatLabelWithStatus(stage.name, stage.status),
        id: `bolt-${bolt.id}-stage-${stage.name}`,
        boltId: bolt.id,
        stageName: stage.name,
        stageOrder: stage.order,
        status: stage.status
    }));
}

/**
 * Finds a story's status from the model by matching file path.
 * Uses bolt's unit/intent to construct expected story path.
 */
function findStoryStatus(storyId: string, bolt: Bolt, model: MemoryBankModel): ArtifactStatus {
    // Find the unit this bolt belongs to
    for (const intent of model.intents) {
        // Match by intent folder name (e.g., "001-admin-panel")
        const intentMatch = intent.path.endsWith(bolt.intent) ||
                           `${intent.number}-${intent.name}` === bolt.intent;

        if (intentMatch) {
            for (const unit of intent.units) {
                if (unit.name === bolt.unit) {
                    // Found the unit - now find the story by path ending
                    for (const story of unit.stories) {
                        // Match by story filename (e.g., "001-create-role.md")
                        if (story.path.endsWith(`${storyId}.md`)) {
                            return story.status;
                        }
                    }
                }
            }
        }
    }

    return ArtifactStatus.Unknown;
}

/**
 * Creates story nodes for a bolt.
 */
export function createBoltStoryNodes(bolt: Bolt, model: MemoryBankModel): BoltStoryNode[] {
    if (!bolt.stories) {
        return [];
    }

    return bolt.stories.map(storyId => {
        const status = findStoryStatus(storyId, bolt, model);
        return {
            kind: 'bolt-story' as const,
            label: formatLabelWithStatus(storyId, status),
            id: `bolt-${bolt.id}-story-${storyId}`,
            boltId: bolt.id,
            storyId: storyId,
            status: status
        };
    });
}

/**
 * Gets children for a tree node.
 */
export function getChildNodes(node: TreeNode, model: MemoryBankModel): TreeNode[] {
    switch (node.kind) {
        case 'root-intents':
            return createIntentNodes(model);
        case 'root-bolts':
            return createBoltNodes(model);
        case 'root-standards':
            return createStandardNodes(model);
        case 'intent':
            return createUnitNodes(node.data);
        case 'unit':
            return createStoryNodes(node.data);
        case 'bolt':
            return createBoltChildNodes(node.data);
        case 'bolt-stages-group':
            return createBoltStageNodes(node.data);
        case 'bolt-stories-group':
            return createBoltStoryNodes(node.data, model);
        case 'story':
        case 'bolt-stage':
        case 'bolt-story':
        case 'standard':
            return [];
    }
}
