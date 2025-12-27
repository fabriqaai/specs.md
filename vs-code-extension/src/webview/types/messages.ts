/**
 * Message type re-exports for webview code.
 *
 * These types are defined in the extension code (sidebar/webviewMessaging.ts)
 * and re-exported here for use in webview components.
 */

// Note: We can't directly import from extension code in webview
// because of different build targets (Node vs Browser).
// Instead, we define compatible types here.

import type { BoltsViewData } from '../components/bolts/bolts-view.js';
import type { ActivityFilter } from '../components/bolts/activity-feed.js';

/**
 * Tab identifiers.
 */
export type TabId = 'bolts' | 'specs' | 'overview';

/**
 * Messages from webview to extension.
 */
export type WebviewToExtensionMessage =
    | { type: 'ready' }
    | { type: 'tabChange'; tab: TabId }
    | { type: 'openArtifact'; kind: string; path: string }
    | { type: 'refresh' }
    | { type: 'toggleFocus'; expanded: boolean }
    | { type: 'activityFilter'; filter: ActivityFilter }
    | { type: 'activityResize'; height: number }
    | { type: 'startBolt'; boltId: string }
    | { type: 'openExternal'; url: string };

/**
 * Messages from extension to webview.
 */
export type ExtensionToWebviewMessage =
    | { type: 'setData'; activeTab: TabId; boltsData: BoltsViewData; specsHtml: string; overviewHtml: string }
    | { type: 'setBoltsData'; boltsData: BoltsViewData }
    | { type: 'setTab'; activeTab: TabId };
