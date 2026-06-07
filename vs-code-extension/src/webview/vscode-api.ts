/**
 * VS Code API instance for webview.
 *
 * This module acquires the VS Code API and exports it for use by components.
 * IMPORTANT: This must only be imported by code running in the webview context.
 */

import type { VsCodeApi } from './types/vscode.js';

/**
 * The VS Code API instance.
 * Acquired once when this module loads in VS Code. In standalone browser hosts,
 * fall back to a small HTTP/EventTarget adapter so shared dashboard UI code can
 * load without acquireVsCodeApi.
 */
function createStandaloneApi(): VsCodeApi {
    let state: unknown = null;
    let eventsConnected = false;

    const connectEvents = (): void => {
        if (eventsConnected || typeof EventSource !== 'function') {
            return;
        }

        eventsConnected = true;
        const events = new EventSource('/events');
        events.addEventListener('message', (event: MessageEvent<string>) => {
            try {
                window.dispatchEvent(new MessageEvent('message', {
                    data: JSON.parse(event.data)
                }));
            } catch {
                // Ignore malformed standalone host messages.
            }
        });
        events.addEventListener('snapshot', (event: MessageEvent<string>) => {
            try {
                window.dispatchEvent(new MessageEvent('message', {
                    data: JSON.parse(event.data)
                }));
            } catch {
                // Ignore malformed standalone host messages.
            }
        });
    };

    connectEvents();

    return {
        postMessage(message: unknown): void {
            fetch('/api/message', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(message)
            }).catch(() => {
                // Standalone transport is best-effort; UI state remains local.
            });
        },
        getState(): unknown {
            return state;
        },
        setState(nextState: unknown): void {
            state = nextState;
        }
    };
}

export const vscode: VsCodeApi = typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : createStandaloneApi();
