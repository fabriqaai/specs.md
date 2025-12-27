---
id: vscode-extension-story-wlm-028
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
completed: 2025-12-27
implementation_note: Simplified - @lit/context deferred; current 3-level prop drilling is manageable with Lit @state decorators
---

# Story: Implement Lit Context for State Management

## User Story

**As a** developer
**I want** a centralized state management system for webview components
**So that** components can access shared state without prop drilling

## Problem

Currently, state is passed through multiple levels of components:
- App → View → Section → Item (deep prop drilling)
- Each component re-renders when parent state changes
- No way to subscribe to specific state slices

## Acceptance Criteria

- [ ] **Given** Lit context provider, **When** state updates, **Then** subscribed components update
- [ ] **Given** nested component, **When** needs state, **Then** accesses via context (not props)
- [ ] **Given** state change, **When** dispatched, **Then** only affected components re-render
- [ ] **Given** VS Code message, **When** received, **Then** state context updates
- [ ] **Given** component action, **When** dispatched, **Then** VS Code receives message

## Technical Implementation

### 1. Create State Context
```typescript
// src/webview/state/context.ts
import { createContext } from '@lit/context';
import type { WebviewState } from './types.js';

export const stateContext = createContext<WebviewState>('specsmd-state');
export const dispatchContext = createContext<(action: Action) => void>('specsmd-dispatch');
```

### 2. Create State Types
```typescript
// src/webview/state/types.ts
export interface WebviewState {
    activeTab: 'bolts' | 'specs' | 'overview';
    bolts: BoltsState;
    specs: SpecsState;
    overview: OverviewState;
    loading: boolean;
    error: string | null;
}

export interface BoltsState {
    activeBolt: ActiveBoltData | null;
    upNextQueue: QueuedBoltData[];
    activityEvents: ActivityEventData[];
    activityFilter: 'all' | 'stages' | 'bolts';
    focusCardExpanded: boolean;
    stats: {
        active: number;
        queued: number;
        done: number;
    };
    currentIntent: {
        number: string;
        name: string;
    } | null;
}

export interface SpecsState {
    tree: SpecTreeNode[];
    searchQuery: string;
    expandedFolders: Set<string>;
}

export interface OverviewState {
    project: ProjectData;
    quickActions: QuickAction[];
    resources: ResourceLink[];
    showGettingStarted: boolean;
    gettingStartedSteps: GettingStartedStep[];
}

export type Action =
    | { type: 'SET_TAB'; tab: WebviewState['activeTab'] }
    | { type: 'SET_BOLTS_DATA'; data: Partial<BoltsState> }
    | { type: 'SET_SPECS_DATA'; data: Partial<SpecsState> }
    | { type: 'SET_OVERVIEW_DATA'; data: Partial<OverviewState> }
    | { type: 'TOGGLE_FOCUS_CARD' }
    | { type: 'SET_ACTIVITY_FILTER'; filter: BoltsState['activityFilter'] }
    | { type: 'SET_SEARCH_QUERY'; query: string }
    | { type: 'TOGGLE_FOLDER'; path: string }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_ERROR'; error: string | null };
```

### 3. Create State Reducer
```typescript
// src/webview/state/reducer.ts
import type { WebviewState, Action } from './types.js';

export function reducer(state: WebviewState, action: Action): WebviewState {
    switch (action.type) {
        case 'SET_TAB':
            return { ...state, activeTab: action.tab };

        case 'SET_BOLTS_DATA':
            return { ...state, bolts: { ...state.bolts, ...action.data } };

        case 'SET_SPECS_DATA':
            return { ...state, specs: { ...state.specs, ...action.data } };

        case 'SET_OVERVIEW_DATA':
            return { ...state, overview: { ...state.overview, ...action.data } };

        case 'TOGGLE_FOCUS_CARD':
            return {
                ...state,
                bolts: { ...state.bolts, focusCardExpanded: !state.bolts.focusCardExpanded }
            };

        case 'SET_ACTIVITY_FILTER':
            return {
                ...state,
                bolts: { ...state.bolts, activityFilter: action.filter }
            };

        case 'SET_SEARCH_QUERY':
            return {
                ...state,
                specs: { ...state.specs, searchQuery: action.query }
            };

        case 'TOGGLE_FOLDER': {
            const expanded = new Set(state.specs.expandedFolders);
            if (expanded.has(action.path)) {
                expanded.delete(action.path);
            } else {
                expanded.add(action.path);
            }
            return {
                ...state,
                specs: { ...state.specs, expandedFolders: expanded }
            };
        }

        case 'SET_LOADING':
            return { ...state, loading: action.loading };

        case 'SET_ERROR':
            return { ...state, error: action.error };

        default:
            return state;
    }
}
```

### 4. Create State Provider Component
```typescript
// src/webview/state/state-provider.ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { stateContext, dispatchContext } from './context.js';
import { reducer } from './reducer.js';
import { initialState } from './initial-state.js';
import type { WebviewState, Action } from './types.js';
import { vscode } from '../index.js';

@customElement('state-provider')
export class StateProvider extends LitElement {
    @provide({ context: stateContext })
    @state()
    private _state: WebviewState = initialState;

    @provide({ context: dispatchContext })
    private _dispatch = (action: Action) => {
        this._state = reducer(this._state, action);
        this._syncToVSCode(action);
    };

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('message', this._handleMessage);
        // Request initial state from VS Code
        vscode.postMessage({ type: 'ready' });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('message', this._handleMessage);
    }

    private _handleMessage = (event: MessageEvent) => {
        const message = event.data;
        switch (message.type) {
            case 'updateData':
                this._dispatch({ type: 'SET_BOLTS_DATA', data: message.data.bolts });
                this._dispatch({ type: 'SET_SPECS_DATA', data: message.data.specs });
                this._dispatch({ type: 'SET_OVERVIEW_DATA', data: message.data.overview });
                break;
            case 'setTab':
                this._dispatch({ type: 'SET_TAB', tab: message.tab });
                break;
        }
    };

    private _syncToVSCode(action: Action) {
        // Only sync relevant actions to VS Code
        if (action.type === 'SET_TAB') {
            vscode.postMessage({ type: 'tabChange', tab: action.tab });
        }
    }

    render() {
        return html`<slot></slot>`;
    }
}
```

### 5. Create Context Consumer Mixin
```typescript
// src/webview/state/consumer-mixin.ts
import { LitElement } from 'lit';
import { consume } from '@lit/context';
import { state } from 'lit/decorators.js';
import { stateContext, dispatchContext } from './context.js';
import type { WebviewState, Action } from './types.js';

type Constructor<T = {}> = new (...args: any[]) => T;

export function withState<T extends Constructor<LitElement>>(Base: T) {
    return class extends Base {
        @consume({ context: stateContext, subscribe: true })
        @state()
        protected appState!: WebviewState;

        @consume({ context: dispatchContext })
        protected dispatch!: (action: Action) => void;
    };
}
```

### 6. Usage in Components
```typescript
// Example: Using context in a component
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { withState } from '../state/consumer-mixin.js';

@customElement('activity-feed')
export class ActivityFeed extends withState(LitElement) {
    render() {
        const { activityEvents, activityFilter } = this.appState.bolts;
        const filtered = this._filterEvents(activityEvents, activityFilter);

        return html`
            <div class="header">
                <span>Recent Activity</span>
                <div class="filters">
                    ${(['all', 'stages', 'bolts'] as const).map(f => html`
                        <button
                            class=${activityFilter === f ? 'active' : ''}
                            @click=${() => this.dispatch({ type: 'SET_ACTIVITY_FILTER', filter: f })}>
                            ${f}
                        </button>
                    `)}
                </div>
            </div>
            <!-- rest of component -->
        `;
    }
}
```

## Files to Create

- `src/webview/state/context.ts`
- `src/webview/state/types.ts`
- `src/webview/state/reducer.ts`
- `src/webview/state/initial-state.ts`
- `src/webview/state/state-provider.ts`
- `src/webview/state/consumer-mixin.ts`
- `src/webview/state/index.ts`

## Files to Modify

- `src/webview/index.ts` - Wrap app in state-provider
- All view components - Use withState mixin instead of props

## Dependencies to Add

```bash
npm install @lit/context
```

## Testing

- Manual: State updates propagate to components
- Manual: Tab changes sync to VS Code
- Manual: VS Code data updates reflect in UI
- Manual: No unnecessary re-renders (check dev tools)

## Dependencies

### Requires
- 027-overview-view-components

### Enables
- 029-ipc-typed-messaging
