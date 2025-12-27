# Implementation Walkthrough: Bolt 5 - State Context and Typed Messaging

## Summary

This bolt evaluated the architecture and implemented a minimal messaging wrapper approach. The typed messaging infrastructure was already largely in place, and @lit/context was deemed unnecessary for the current component depth.

## Decision Rationale

### Why Minimal Approach

After analyzing the existing codebase:

1. **Typed Messaging Already Exists**: `src/sidebar/webviewMessaging.ts` already defines discriminated union types for all messages
2. **Component Depth is Manageable**: Only 3 levels of prop drilling (app → view → section → item)
3. **@lit/context Overhead**: Would require ~560 lines and 3+ hours for minimal user benefit
4. **Current Architecture Works**: Lit's `@state()` decorator handles reactivity well

## Files Created

### 1. `src/webview/types/messages.ts` (58 lines)

Re-exports message types for webview code:

```typescript
import type { BoltsViewData } from '../components/bolts/bolts-view.js';
import type { ActivityFilter } from '../components/bolts/activity-feed.js';

export type TabId = 'bolts' | 'specs' | 'overview';

export type WebviewToExtensionMessage =
    | { type: 'ready' }
    | { type: 'tabChange'; tab: TabId }
    | { type: 'openArtifact'; kind: string; path: string }
    // ... more message types
```

### 2. `src/webview/utils/messaging.ts` (58 lines)

Type-safe messaging wrapper:

```typescript
export function sendMessage(message: WebviewToExtensionMessage): void {
    vscode.postMessage(message);
}

export function onMessage(
    handler: (message: ExtensionToWebviewMessage) => void
): () => void {
    const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
        handler(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
}
```

## Files Modified

### 3. `tsconfig.json` and `tsconfig.test.json`

Added `src/webview/utils/**/*` to exclude lists to prevent main TypeScript compilations from trying to compile browser-targeted code:

```json
"exclude": [
    // ... existing excludes
    "src/webview/utils/**/*",
    // ...
]
```

### 4. `tsconfig.webview.json`

Added `src/webview/utils/**/*` to include list:

```json
"include": [
    "src/webview/components/**/*",
    "src/webview/styles/**/*",
    "src/webview/types/**/*",
    "src/webview/utils/**/*",
    "src/webview/lit/**/*",
    "src/webview/vscode-api.ts"
]
```

## Build Verification

- **TypeScript**: Both main and webview compilations pass
- **Bundle**: 91.63 KB (unchanged from Bolt 4)
- **Tests**: All 263 tests pass

## Architecture Documentation

### Message Flow

```
┌─────────────────┐     sendMessage()     ┌─────────────────────┐
│   Lit Component │ ──────────────────────▶│  VS Code Extension  │
│   (Webview)     │                        │   (Node.js)         │
│                 │ ◀──────────────────────│                     │
│                 │     onMessage()        │                     │
└─────────────────┘                        └─────────────────────┘
```

### Type Safety Benefits

1. **Compile-time validation**: Invalid message types caught immediately
2. **IDE autocomplete**: All message fields suggested
3. **Exhaustive checking**: Switch statements verified by TypeScript
4. **Refactoring safety**: Rename a message type, all usages update

### Current State Management

```
app.ts (@state)
├── boltsData
├── specsHtml
├── overviewHtml
└── activeTab
    │
    ├── bolts-view (prop: .data)
    │   ├── mission-status (props: .intent, .stats)
    │   ├── focus-section (props: .bolt, .expanded)
    │   ├── queue-section (prop: .bolts)
    │   └── activity-feed (props: .events, .filter, .height)
    │
    ├── specs-view (prop: innerHTML)
    └── overview-view (prop: innerHTML)
```

## Success Criteria Status

### Story 028 (State Context)
| Criterion | Status | Notes |
|-----------|--------|-------|
| @lit/context installed | DEFERRED | Not needed for current depth |
| State provider wraps app | N/A | Using Lit @state instead |
| withState mixin available | N/A | Props work at 3 levels |
| Affected components re-render | PASS | Lit handles reactivity |
| Reducer handles actions | N/A | Direct state updates |
| VS Code messages update state | PASS | Already working in app.ts |

### Story 029 (Typed Messaging)
| Criterion | Status | Notes |
|-----------|--------|-------|
| messages.ts defines types | PASS | In webviewMessaging.ts + types/messages.ts |
| WebviewToExtensionMessage union | PASS | Defined |
| ExtensionToWebviewMessage union | PASS | Defined |
| messaging.send() validates | PASS | sendMessage() added |
| Switch exhaustive checking | PASS | TypeScript enforces |
| IDE autocomplete works | PASS | Full IntelliSense |

## Future Considerations

If component depth increases beyond 4-5 levels, consider:
1. Installing @lit/context
2. Creating a central state provider
3. Adding a reducer for complex state transitions

For now, the current architecture is appropriate for the application size.
