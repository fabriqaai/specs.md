/**
 * Core module exports for multi-flow support.
 *
 * This module provides the shared infrastructure for all flow implementations:
 * - Type definitions
 * - Flow registry
 * - Flow detection
 * - Base state store
 * - Webview messaging
 *
 * Usage:
 * ```typescript
 * import {
 *   FlowRegistry,
 *   FlowAdapter,
 *   FlowId,
 *   detectAllFlows
 * } from './core';
 * ```
 */

// Types
export type {
    FlowId,
    FlowInfo,
    FlowDetectionResult,
    FlowDetector,
    FlowParser,
    ArtifactParseResult,
    FlowStateManager,
    FlowStateListener,
    FlowComputedData,
    FlowUIProvider,
    TabDefinition,
    WebviewData,
    WebviewMessage,
    FlowAdapter,
    FlowChangeEvent,
    FlowChangeListener,
    IFlowRegistry,
    CommonStatus
} from './types';

export {
    normalizeStatus,
    getStatusIcon,
    getStatusClass
} from './types';

// Flow Registry
export {
    FlowRegistry,
    FlowRegistryConfig,
    DEFAULT_REGISTRY_CONFIG,
    createFlowRegistry,
    getGlobalRegistry,
    resetGlobalRegistry
} from './flowRegistry';

// Flow Detection
export {
    FlowConfig,
    FLOW_CONFIGS,
    BaseFlowDetector,
    FireFlowDetector,
    AidlcFlowDetector,
    SimpleFlowDetector,
    detectAllFlows,
    detectAllFlowsAsync,
    getDefaultFlow,
    hasAnyFlow,
    hasFlow,
    createDetector,
    createAllDetectors,
    directoryExists,
    fileExists,
    readFileSafe,
    extractVersion
} from './flowDetector';

// Base State Store
export {
    BaseStateStore,
    BaseStateStoreConfig,
    DEFAULT_BASE_CONFIG,
    StateChangeEvent,
    StateChangeListener,
    indexByKey,
    indexById,
    mapToArray,
    deepClone,
    deepEqual
} from './BaseStateStore';

// Webview Messaging
export type {
    // Extension → Webview
    ExtensionMessage,
    SetDataMessage,
    SetTabMessage,
    SwitchFlowMessage,
    UpdateFlowsMessage,
    SetLoadingMessage,
    SetErrorMessage,
    UpdateDataMessage,
    ToWebviewMessage,
    // Webview → Extension
    ReadyMessage,
    RefreshMessage,
    TabChangeMessage,
    FlowSwitchMessage,
    OpenArtifactMessage,
    OpenExternalMessage,
    RevealFileMessage,
    CopyToClipboardMessage,
    UIStateChangeMessage,
    ActionMessage,
    // AIDLC
    StartBoltMessage,
    ContinueBoltMessage,
    ViewBoltFilesMessage,
    OpenBoltMdMessage,
    ToggleFocusMessage,
    ActivityFilterMessage,
    SpecsFilterMessage,
    ActivityResizeMessage,
    // FIRE
    StartRunMessage,
    ContinueRunMessage,
    ViewPlanMessage,
    ViewTestReportMessage,
    ViewWalkthroughMessage,
    OpenWorkItemMessage,
    OpenIntentBriefMessage,
    FromWebviewMessage,
    MessageHandler,
    MessageHandlerMap
} from './webview/messaging';

export {
    isMessageType,
    isReadyMessage,
    isTabChangeMessage,
    isFlowSwitchMessage,
    isOpenArtifactMessage,
    isActionMessage,
    createSetDataMessage,
    createSetTabMessage,
    createSwitchFlowMessage,
    createUpdateFlowsMessage,
    createSetLoadingMessage,
    createSetErrorMessage,
    createUpdateDataMessage,
    createMessageRouter
} from './webview/messaging';
