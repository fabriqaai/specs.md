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
    const stateKey = 'specsmd:webview-state';
    let state: unknown = null;
    let eventsConnected = false;

    try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(stateKey) : null;
        if (stored !== null) {
            state = JSON.parse(stored);
        }
    } catch {
        state = null;
    }

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
            if (isStandaloneStartRunMessage(message)) {
                window.dispatchEvent(new CustomEvent('specsmd-dashboard-command', {
                    detail: {
                        command: buildFireStartRunCommand(message.workItemIds),
                        workItemIds: message.workItemIds
                    }
                }));
                return;
            }

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
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(stateKey, JSON.stringify(nextState));
                }
            } catch {
                // Persisting standalone state is best-effort only.
            }
        }
    };
}

function isStandaloneStartRunMessage(message: unknown): message is { type: 'startRun'; workItemIds: string[] } {
    return typeof message === 'object' &&
        message !== null &&
        (message as { type?: unknown }).type === 'startRun' &&
        Array.isArray((message as { workItemIds?: unknown }).workItemIds);
}

function buildFireStartRunCommand(workItemIds: string[]): string {
    const ids = workItemIds
        .map(id => String(id).trim())
        .filter(Boolean);

    return ['/specsmd-fire-builder', ...ids].join(' ');
}

export const vscode: VsCodeApi = typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : createStandaloneApi();
