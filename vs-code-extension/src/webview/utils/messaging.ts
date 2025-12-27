/**
 * Type-safe messaging utilities for webview.
 *
 * Provides compile-time validation for messages sent to the extension.
 */

import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '../types/messages.js';
import { vscode } from '../vscode-api.js';

/**
 * Send a type-safe message to the extension.
 *
 * @example
 * ```typescript
 * sendMessage({ type: 'tabChange', tab: 'bolts' });
 * sendMessage({ type: 'startBolt', boltId: 'my-bolt' });
 * ```
 */
export function sendMessage(message: WebviewToExtensionMessage): void {
    vscode.postMessage(message);
}

/**
 * Subscribe to messages from the extension.
 *
 * @returns Cleanup function to unsubscribe
 *
 * @example
 * ```typescript
 * const unsubscribe = onMessage((msg) => {
 *     if (msg.type === 'setData') {
 *         // TypeScript knows msg has activeTab, boltsData, etc.
 *     }
 * });
 * ```
 */
export function onMessage(
    handler: (message: ExtensionToWebviewMessage) => void
): () => void {
    const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
        handler(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
}

/**
 * Type guard for extension messages.
 */
export function isExtensionMessage(data: unknown): data is ExtensionToWebviewMessage {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        typeof (data as { type: unknown }).type === 'string'
    );
}
