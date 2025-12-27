---
id: vscode-extension-story-wlm-029
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
completed: 2025-12-27
---

# Story: Implement Typed IPC Messaging

## User Story

**As a** developer
**I want** type-safe message passing between webview and extension
**So that** I catch message format errors at compile time

## Problem

Current message passing is untyped:
- `vscode.postMessage({ type: 'tabChange', tab: 'bolts' })` - no type checking
- Extension handler uses `switch (message.type)` with string literals
- Easy to misspell message types or forget required fields
- No autocomplete for message payloads

## Acceptance Criteria

- [ ] **Given** message types defined, **When** sending message, **Then** TypeScript validates payload
- [ ] **Given** invalid message, **When** compiled, **Then** TypeScript error shown
- [ ] **Given** extension receives message, **When** handling, **Then** type narrowing works
- [ ] **Given** webview receives message, **When** handling, **Then** type narrowing works
- [ ] **Given** message sent, **When** received, **Then** payload matches expected type

## Technical Implementation

### 1. Define Shared Message Types
```typescript
// src/shared/messages.ts
// This file is imported by both extension and webview code

// Messages from Webview to Extension
export type WebviewToExtensionMessage =
    | { type: 'ready' }
    | { type: 'tabChange'; tab: 'bolts' | 'specs' | 'overview' }
    | { type: 'openFile'; path: string }
    | { type: 'startBolt'; boltId: string }
    | { type: 'executeAction'; command: string }
    | { type: 'openResource'; url: string; resourceType: 'internal' | 'external' }
    | { type: 'toggleFocusCard' }
    | { type: 'setActivityFilter'; filter: 'all' | 'stages' | 'bolts' }
    | { type: 'searchSpecs'; query: string }
    | { type: 'toggleFolder'; path: string };

// Messages from Extension to Webview
export type ExtensionToWebviewMessage =
    | { type: 'updateData'; data: WebviewData }
    | { type: 'setTab'; tab: 'bolts' | 'specs' | 'overview' }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setError'; error: string | null }
    | { type: 'boltStarted'; boltId: string }
    | { type: 'fileOpened'; path: string };

// Full webview data structure
export interface WebviewData {
    bolts: BoltsData;
    specs: SpecsData;
    overview: OverviewData;
}

export interface BoltsData {
    activeBolt: ActiveBoltData | null;
    upNextQueue: QueuedBoltData[];
    activityEvents: ActivityEventData[];
    stats: BoltStats;
    currentIntent: IntentData | null;
}

export interface SpecsData {
    tree: SpecTreeNode[];
}

export interface OverviewData {
    project: ProjectData;
    quickActions: QuickAction[];
    resources: ResourceLink[];
    showGettingStarted: boolean;
    gettingStartedSteps: GettingStartedStep[];
}

// Supporting types
export interface ActiveBoltData {
    id: string;
    name: string;
    stages: StageData[];
    stories: StoryData[];
}

export interface QueuedBoltData {
    id: string;
    name: string;
    unitName: string;
    reason: string;
}

export interface ActivityEventData {
    id: string;
    type: 'stage' | 'bolt' | 'story';
    action: string;
    target: string;
    timestamp: number;
    path?: string;
}

export interface BoltStats {
    active: number;
    queued: number;
    done: number;
}

export interface IntentData {
    number: string;
    name: string;
}

export interface StageData {
    name: string;
    status: 'complete' | 'active' | 'pending';
}

export interface StoryData {
    id: string;
    title: string;
    status: 'complete' | 'in-progress' | 'pending';
}

export interface SpecTreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: SpecTreeNode[];
}

export interface ProjectData {
    name: string;
    intentsCount: number;
    boltsCount: number;
    specsCount: number;
}

export interface QuickAction {
    icon: string;
    label: string;
    command: string;
}

export interface ResourceLink {
    icon: string;
    label: string;
    url: string;
    type: 'internal' | 'external';
}

export interface GettingStartedStep {
    title: string;
    description: string;
    completed: boolean;
}
```

### 2. Create Typed Webview API Wrapper
```typescript
// src/webview/messaging.ts
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '../shared/messages.js';

declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

const vscodeApi = acquireVsCodeApi();

export const messaging = {
    send(message: WebviewToExtensionMessage): void {
        vscodeApi.postMessage(message);
    },

    onMessage(handler: (message: ExtensionToWebviewMessage) => void): () => void {
        const listener = (event: MessageEvent) => {
            handler(event.data as ExtensionToWebviewMessage);
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    },

    getState<T>(): T | undefined {
        return vscodeApi.getState() as T | undefined;
    },

    setState<T>(state: T): void {
        vscodeApi.setState(state);
    }
};
```

### 3. Create Typed Extension Message Handler
```typescript
// src/sidebar/webviewMessaging.ts
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '../shared/messages.js';
import * as vscode from 'vscode';

export class WebviewMessaging {
    constructor(private webview: vscode.Webview) {}

    send(message: ExtensionToWebviewMessage): void {
        this.webview.postMessage(message);
    }

    onMessage(handler: (message: WebviewToExtensionMessage) => void): vscode.Disposable {
        return this.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
            handler(message);
        });
    }

    handleMessage(message: WebviewToExtensionMessage): void {
        // Type narrowing works here!
        switch (message.type) {
            case 'ready':
                // TypeScript knows this is { type: 'ready' }
                this._handleReady();
                break;
            case 'tabChange':
                // TypeScript knows message.tab exists and is typed
                this._handleTabChange(message.tab);
                break;
            case 'openFile':
                // TypeScript knows message.path exists
                this._handleOpenFile(message.path);
                break;
            case 'startBolt':
                this._handleStartBolt(message.boltId);
                break;
            case 'executeAction':
                this._handleExecuteAction(message.command);
                break;
            case 'openResource':
                this._handleOpenResource(message.url, message.resourceType);
                break;
            // ... other handlers
        }
    }

    private _handleReady(): void {
        // Send initial data
    }

    private _handleTabChange(tab: 'bolts' | 'specs' | 'overview'): void {
        // Update tab state
    }

    private _handleOpenFile(path: string): void {
        vscode.workspace.openTextDocument(path)
            .then(doc => vscode.window.showTextDocument(doc));
    }

    private _handleStartBolt(boltId: string): void {
        // Show quick pick or execute command
    }

    private _handleExecuteAction(command: string): void {
        vscode.commands.executeCommand(command);
    }

    private _handleOpenResource(url: string, type: 'internal' | 'external'): void {
        if (type === 'external') {
            vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            vscode.workspace.openTextDocument(url)
                .then(doc => vscode.window.showTextDocument(doc));
        }
    }
}
```

### 4. Usage in State Provider
```typescript
// src/webview/state/state-provider.ts
import { messaging } from '../messaging.js';
import type { ExtensionToWebviewMessage } from '../../shared/messages.js';

@customElement('state-provider')
export class StateProvider extends LitElement {
    private _unsubscribe?: () => void;

    connectedCallback() {
        super.connectedCallback();
        this._unsubscribe = messaging.onMessage(this._handleMessage);
        messaging.send({ type: 'ready' }); // Type-checked!
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unsubscribe?.();
    }

    private _handleMessage = (message: ExtensionToWebviewMessage) => {
        switch (message.type) {
            case 'updateData':
                // TypeScript knows message.data is WebviewData
                this._dispatch({ type: 'SET_BOLTS_DATA', data: message.data.bolts });
                this._dispatch({ type: 'SET_SPECS_DATA', data: message.data.specs });
                this._dispatch({ type: 'SET_OVERVIEW_DATA', data: message.data.overview });
                break;
            case 'setTab':
                this._dispatch({ type: 'SET_TAB', tab: message.tab });
                break;
            case 'setLoading':
                this._dispatch({ type: 'SET_LOADING', loading: message.loading });
                break;
            case 'setError':
                this._dispatch({ type: 'SET_ERROR', error: message.error });
                break;
        }
    };
}
```

### 5. Usage in Components
```typescript
// Example: Sending typed messages from a component
import { messaging } from '../../messaging.js';

@customElement('queue-item')
export class QueueItem extends LitElement {
    @property({ type: Object }) bolt!: QueuedBoltData;

    private _handleStart() {
        // TypeScript validates this message!
        messaging.send({ type: 'startBolt', boltId: this.bolt.id });
    }

    private _handleOpenFile() {
        // TypeScript error if we forget 'path'!
        messaging.send({ type: 'openFile', path: `/path/to/bolt/${this.bolt.id}` });
    }
}
```

## Files to Create

- `src/shared/messages.ts` - Shared message type definitions
- `src/webview/messaging.ts` - Typed webview API wrapper

## Files to Modify

- `src/sidebar/webviewMessaging.ts` - Use typed message handler
- `src/sidebar/webviewProvider.ts` - Use WebviewMessaging class
- `src/webview/state/state-provider.ts` - Use typed messaging
- All components using `vscode.postMessage` - Use `messaging.send`

## TypeScript Configuration

Ensure `src/shared/` is included in both extension and webview builds:

```json
// tsconfig.json
{
    "include": ["src/**/*"]
}
```

```javascript
// esbuild.webview.mjs
{
    entryPoints: ['src/webview/index.ts'],
    // shared/ types will be bundled automatically
}
```

## Testing

- Compile: No TypeScript errors
- Manual: Messages sent with correct payloads
- Manual: Extension receives and handles messages correctly
- Manual: Webview receives and handles messages correctly
- IDE: Autocomplete works for message types

## Dependencies

### Requires
- 028-state-context

### Enables
- Final integration testing
- Production deployment
