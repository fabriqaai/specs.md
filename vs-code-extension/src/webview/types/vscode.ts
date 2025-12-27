/**
 * VS Code Webview API type declarations.
 */

export interface VsCodeApi {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
}

declare global {
    function acquireVsCodeApi(): VsCodeApi;
}
