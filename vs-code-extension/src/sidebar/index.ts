/**
 * Public exports for the sidebar module.
 */

export {
    TreeNode,
    TreeNodeKind,
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
    NODE_ICONS,
    STATUS_INDICATORS,
    CollapsibleState,
    CollapsibleStateValue,
    getCollapsibleState,
    isRootNode,
    isIntentNode,
    isUnitNode,
    isBoltNode
} from './types';

export {
    createRootNodes,
    createIntentNodes,
    createIntentNode,
    createUnitNodes,
    createUnitNode,
    createStoryNodes,
    createStoryNode,
    createBoltNodes,
    createBoltNode,
    createBoltChildNodes,
    createBoltStageNodes,
    createBoltStoryNodes,
    createStandardNodes,
    createStandardNode,
    getChildNodes
} from './treeBuilder';

export {
    MemoryBankTreeProvider,
    createTreeProvider
} from './treeProvider';

export {
    getStatusIcon,
    getNodeIcon,
    getBoltTypeBadge
} from './iconHelper';

// Webview Provider (new tabbed interface)
export {
    SpecsmdWebviewProvider,
    createWebviewProvider
} from './webviewProvider';

export {
    WebviewData,
    TabId,
    DEFAULT_TAB,
    TAB_STATE_KEY,
    WebviewToExtensionMessage,
    ExtensionToWebviewMessage,
    ActiveBoltData,
    QueuedBoltData,
    ActivityEventData,
    IntentData,
    UnitData,
    StoryData,
    StandardData
} from './webviewMessaging';

export {
    getWebviewContent,
    getNonce
} from '../webview';
