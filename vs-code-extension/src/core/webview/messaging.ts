/**
 * Webview Messaging - Shared message types for extension <-> webview communication.
 *
 * This module defines:
 * - Message types for extension to webview
 * - Message types for webview to extension
 * - Type guards for message validation
 * - Message factories
 *
 * See: MULTI_FLOW_ARCHITECTURE.md for full documentation.
 */

import { FlowId, FlowInfo, WebviewData } from '../types';

// ============================================================================
// Extension → Webview Messages
// ============================================================================

/**
 * Base message from extension to webview.
 */
export interface ExtensionMessage {
    type: string;
}

/**
 * Set the complete webview data.
 */
export interface SetDataMessage extends ExtensionMessage {
    type: 'setData';
    data: WebviewData;
}

/**
 * Update the active tab.
 */
export interface SetTabMessage extends ExtensionMessage {
    type: 'setTab';
    tab: string;
}

/**
 * Switch to a different flow.
 */
export interface SwitchFlowMessage extends ExtensionMessage {
    type: 'switchFlow';
    flowId: FlowId;
    data: WebviewData;
}

/**
 * Update available flows (e.g., when detection changes).
 */
export interface UpdateFlowsMessage extends ExtensionMessage {
    type: 'updateFlows';
    availableFlows: FlowInfo[];
    activeFlowId: FlowId;
}

/**
 * Show loading state.
 */
export interface SetLoadingMessage extends ExtensionMessage {
    type: 'setLoading';
    loading: boolean;
    message?: string;
}

/**
 * Show error message.
 */
export interface SetErrorMessage extends ExtensionMessage {
    type: 'setError';
    error: string | null;
}

/**
 * Partial data update (for efficiency).
 */
export interface UpdateDataMessage extends ExtensionMessage {
    type: 'updateData';
    updates: Partial<WebviewData>;
}

/**
 * Union of all extension to webview messages.
 */
export type ToWebviewMessage =
    | SetDataMessage
    | SetTabMessage
    | SwitchFlowMessage
    | UpdateFlowsMessage
    | SetLoadingMessage
    | SetErrorMessage
    | UpdateDataMessage;

// ============================================================================
// Webview → Extension Messages
// ============================================================================

/**
 * Base message from webview to extension.
 */
export interface WebviewMessage {
    type: string;
}

/**
 * Webview is ready and requests initial data.
 */
export interface ReadyMessage extends WebviewMessage {
    type: 'ready';
}

/**
 * Request data refresh.
 */
export interface RefreshMessage extends WebviewMessage {
    type: 'refresh';
}

/**
 * User changed tab.
 */
export interface TabChangeMessage extends WebviewMessage {
    type: 'tabChange';
    tab: string;
}

/**
 * User requested flow switch.
 */
export interface FlowSwitchMessage extends WebviewMessage {
    type: 'switchFlow';
    flowId: FlowId;
}

/**
 * Open an artifact file.
 */
export interface OpenArtifactMessage extends WebviewMessage {
    type: 'openArtifact';
    path: string;
    kind?: string;
}

/**
 * Open external URL.
 */
export interface OpenExternalMessage extends WebviewMessage {
    type: 'openExternal';
    url: string;
}

/**
 * Reveal file in explorer.
 */
export interface RevealFileMessage extends WebviewMessage {
    type: 'revealFile';
    path: string;
}

/**
 * Copy text to clipboard.
 */
export interface CopyToClipboardMessage extends WebviewMessage {
    type: 'copyToClipboard';
    text: string;
}

/**
 * UI state change (for persistence).
 */
export interface UIStateChangeMessage extends WebviewMessage {
    type: 'uiStateChange';
    key: string;
    value: unknown;
}

/**
 * Generic action message (flow-specific actions).
 */
export interface ActionMessage extends WebviewMessage {
    type: 'action';
    action: string;
    payload?: Record<string, unknown>;
}

// ============================================================================
// AIDLC-Specific Messages
// ============================================================================

/**
 * Start a bolt.
 */
export interface StartBoltMessage extends WebviewMessage {
    type: 'startBolt';
    boltId: string;
}

/**
 * Continue working on a bolt.
 */
export interface ContinueBoltMessage extends WebviewMessage {
    type: 'continueBolt';
    boltId: string;
    boltName?: string;
}

/**
 * View bolt files.
 */
export interface ViewBoltFilesMessage extends WebviewMessage {
    type: 'viewBoltFiles';
    boltId: string;
}

/**
 * Open bolt.md file.
 */
export interface OpenBoltMdMessage extends WebviewMessage {
    type: 'openBoltMd';
    boltId: string;
}

/**
 * Toggle focus card expansion.
 */
export interface ToggleFocusMessage extends WebviewMessage {
    type: 'toggleFocus';
    expanded: boolean;
}

/**
 * Change activity filter.
 */
export interface ActivityFilterMessage extends WebviewMessage {
    type: 'activityFilter';
    filter: 'all' | 'stages' | 'bolts';
}

/**
 * Change specs filter.
 */
export interface SpecsFilterMessage extends WebviewMessage {
    type: 'specsFilter';
    filter: string;
}

/**
 * Resize activity section.
 */
export interface ActivityResizeMessage extends WebviewMessage {
    type: 'activityResize';
    height: number;
}

// ============================================================================
// FIRE-Specific Messages
// ============================================================================

/**
 * Start a new run.
 */
export interface StartRunMessage extends WebviewMessage {
    type: 'startRun';
    workItemIds: string[];
    scope?: 'single' | 'batch' | 'wide';
}

/**
 * Continue current run.
 */
export interface ContinueRunMessage extends WebviewMessage {
    type: 'continueRun';
    runId: string;
}

/**
 * View run plan.
 */
export interface ViewPlanMessage extends WebviewMessage {
    type: 'viewPlan';
    runId: string;
}

/**
 * View test report.
 */
export interface ViewTestReportMessage extends WebviewMessage {
    type: 'viewTestReport';
    runId: string;
}

/**
 * View walkthrough.
 */
export interface ViewWalkthroughMessage extends WebviewMessage {
    type: 'viewWalkthrough';
    runId: string;
}

/**
 * Open work item file.
 */
export interface OpenWorkItemMessage extends WebviewMessage {
    type: 'openWorkItem';
    workItemId: string;
    intentId: string;
}

/**
 * Open intent brief.
 */
export interface OpenIntentBriefMessage extends WebviewMessage {
    type: 'openIntentBrief';
    intentId: string;
}

/**
 * Change runs filter.
 */
export interface RunsFilterMessage extends WebviewMessage {
    type: 'runsFilter';
    filter: 'all' | 'active' | 'completed';
}

/**
 * Change intents filter.
 */
export interface IntentsFilterMessage extends WebviewMessage {
    type: 'intentsFilter';
    filter: 'all' | 'pending' | 'in_progress' | 'completed';
}

/**
 * Expand/collapse an intent.
 */
export interface ExpandIntentMessage extends WebviewMessage {
    type: 'expandIntent';
    intentId: string;
    expanded: boolean;
}

/**
 * Select a run.
 */
export interface SelectRunMessage extends WebviewMessage {
    type: 'selectRun';
    runId: string | null;
}

/**
 * View run files in explorer.
 */
export interface ViewRunFilesMessage extends WebviewMessage {
    type: 'viewRunFiles';
    runId: string;
    folderPath: string;
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union of all webview to extension messages.
 */
export type FromWebviewMessage =
    // Common
    | ReadyMessage
    | RefreshMessage
    | TabChangeMessage
    | FlowSwitchMessage
    | OpenArtifactMessage
    | OpenExternalMessage
    | RevealFileMessage
    | CopyToClipboardMessage
    | UIStateChangeMessage
    | ActionMessage
    // AIDLC
    | StartBoltMessage
    | ContinueBoltMessage
    | ViewBoltFilesMessage
    | OpenBoltMdMessage
    | ToggleFocusMessage
    | ActivityFilterMessage
    | SpecsFilterMessage
    | ActivityResizeMessage
    // FIRE
    | StartRunMessage
    | ContinueRunMessage
    | ViewPlanMessage
    | ViewTestReportMessage
    | ViewWalkthroughMessage
    | OpenWorkItemMessage
    | OpenIntentBriefMessage
    | RunsFilterMessage
    | IntentsFilterMessage
    | ExpandIntentMessage
    | SelectRunMessage
    | ViewRunFilesMessage;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if message is a specific type.
 */
export function isMessageType<T extends WebviewMessage>(
    message: WebviewMessage,
    type: T['type']
): message is T {
    return message.type === type;
}

/**
 * Check if message is ready message.
 */
export function isReadyMessage(message: WebviewMessage): message is ReadyMessage {
    return message.type === 'ready';
}

/**
 * Check if message is tab change message.
 */
export function isTabChangeMessage(message: WebviewMessage): message is TabChangeMessage {
    return message.type === 'tabChange';
}

/**
 * Check if message is flow switch message.
 */
export function isFlowSwitchMessage(message: WebviewMessage): message is FlowSwitchMessage {
    return message.type === 'switchFlow';
}

/**
 * Check if message is open artifact message.
 */
export function isOpenArtifactMessage(message: WebviewMessage): message is OpenArtifactMessage {
    return message.type === 'openArtifact';
}

/**
 * Check if message is action message.
 */
export function isActionMessage(message: WebviewMessage): message is ActionMessage {
    return message.type === 'action';
}

// ============================================================================
// Message Factories
// ============================================================================

/**
 * Create a setData message.
 */
export function createSetDataMessage(data: WebviewData): SetDataMessage {
    return { type: 'setData', data };
}

/**
 * Create a setTab message.
 */
export function createSetTabMessage(tab: string): SetTabMessage {
    return { type: 'setTab', tab };
}

/**
 * Create a switchFlow message.
 */
export function createSwitchFlowMessage(flowId: FlowId, data: WebviewData): SwitchFlowMessage {
    return { type: 'switchFlow', flowId, data };
}

/**
 * Create an updateFlows message.
 */
export function createUpdateFlowsMessage(
    availableFlows: FlowInfo[],
    activeFlowId: FlowId
): UpdateFlowsMessage {
    return { type: 'updateFlows', availableFlows, activeFlowId };
}

/**
 * Create a setLoading message.
 */
export function createSetLoadingMessage(loading: boolean, message?: string): SetLoadingMessage {
    return { type: 'setLoading', loading, message };
}

/**
 * Create a setError message.
 */
export function createSetErrorMessage(error: string | null): SetErrorMessage {
    return { type: 'setError', error };
}

/**
 * Create an updateData message.
 */
export function createUpdateDataMessage(updates: Partial<WebviewData>): UpdateDataMessage {
    return { type: 'updateData', updates };
}

// ============================================================================
// Message Handler Types
// ============================================================================

/**
 * Handler function for webview messages.
 */
export type MessageHandler<T extends WebviewMessage = WebviewMessage> = (
    message: T
) => Promise<void> | void;

/**
 * Map of message types to handlers.
 */
export type MessageHandlerMap = {
    [K in FromWebviewMessage['type']]?: MessageHandler<
        Extract<FromWebviewMessage, { type: K }>
    >;
};

/**
 * Create a message router from a handler map.
 */
export function createMessageRouter(handlers: MessageHandlerMap): MessageHandler {
    return async (message: WebviewMessage) => {
        const handler = handlers[message.type as keyof MessageHandlerMap];
        if (handler) {
            await (handler as MessageHandler)(message);
        } else {
            console.warn(`No handler for message type: ${message.type}`);
        }
    };
}
