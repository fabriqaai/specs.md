# Implementation Plan: Bolt 5 - State Context and Typed Messaging

## Overview

This bolt evaluates the need for @lit/context and typed messaging improvements. After analyzing the current implementation, much of the infrastructure is already in place.

## Current State Analysis

### Typed Messaging (Story 029) - ALREADY IMPLEMENTED

The `src/sidebar/webviewMessaging.ts` already provides:

```typescript
// Outbound messages (webview → extension)
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

// Inbound messages (extension → webview)
export type ExtensionToWebviewMessage =
    | { type: 'update'; data: WebviewData }
    | { type: 'setTab'; tab: TabId };
```

All data interfaces are also defined:
- `WebviewData` - complete data structure
- `ActiveBoltData`, `QueuedBoltData`, `ActivityEventData`
- `IntentData`, `UnitData`, `StoryData`
- `StandardData`, `NextActionData`

### State Management (Story 028) - EVALUATE NEED

Current approach in `app.ts`:
- Uses Lit's `@state()` decorator for reactive state
- Props passed down 2-3 levels (app → view → section → item)
- Works correctly with good performance

The question: Is @lit/context needed?

## Architecture Decision

### Typed Messaging - COMPLETE
The existing types in `webviewMessaging.ts` already satisfy the requirements:
- Discriminated union types for messages
- Type narrowing in switch statements
- IDE autocomplete works
- Compile-time validation

**Action**: No changes needed for typed messaging.

### State Context - NOT NEEDED FOR MVP

Analysis of current prop drilling:
```
app.ts
├── bolts-view (.data)
│   ├── mission-status (.intent, .stats)
│   ├── focus-section (.bolt, .expanded)
│   │   └── focus-card (.bolt, .expanded)
│   ├── queue-section (.bolts)
│   │   └── queue-item (.bolt, .priority)
│   └── activity-feed (.events, .filter, .height)
│       └── activity-item (.event)
```

This is only 3 levels deep - manageable without context.

**Action**: Defer @lit/context to a future bolt if complexity increases.

## Minimal Implementation

Since typed messaging is already complete, focus on:

1. **Documentation** - Document the messaging architecture
2. **Type Export** - Ensure types are importable in webview code
3. **Validation** - Optional runtime validation for development

### Files to Create

1. **`src/webview/types/messages.ts`** - Re-export message types for webview
   ```typescript
   // Re-export from extension for webview use
   export type {
       WebviewToExtensionMessage,
       ExtensionToWebviewMessage,
       WebviewData,
       ActiveBoltData,
       QueuedBoltData,
       ActivityEventData,
       TabId,
       ActivityFilter
   } from '../../sidebar/webviewMessaging.js';
   ```

2. **`src/webview/utils/messaging.ts`** - Type-safe messaging wrapper
   ```typescript
   import type { WebviewToExtensionMessage } from '../types/messages.js';
   import { vscode } from '../vscode-api.js';

   export function sendMessage(message: WebviewToExtensionMessage): void {
       vscode.postMessage(message);
   }
   ```

### Files to Update

3. **`src/webview/components/app.ts`** - Use typed messaging helper
   - Import `sendMessage` instead of direct `vscode.postMessage`
   - Ensures compile-time type checking

## Success Criteria Mapping

### Story 028 (State Context)
| Criterion | Status | Notes |
|-----------|--------|-------|
| @lit/context installed | DEFERRED | Not needed for current complexity |
| State provider wraps app | DEFERRED | Current @state approach works |
| withState mixin available | DEFERRED | Props work fine at 3 levels |
| Affected components re-render | PASS | Lit handles this already |
| Reducer handles actions | N/A | Using direct state updates |
| VS Code messages update state | PASS | Already working in app.ts |

### Story 029 (Typed Messaging)
| Criterion | Status | Notes |
|-----------|--------|-------|
| messages.ts defines types | PASS | In webviewMessaging.ts |
| WebviewToExtensionMessage union | PASS | Already defined |
| ExtensionToWebviewMessage union | PASS | Already defined |
| messaging.send() validates | TODO | Add wrapper function |
| Switch exhaustive checking | PASS | Works in provider |
| IDE autocomplete works | PASS | TypeScript provides this |

## Estimated Effort

| Task | Lines | Time |
|------|-------|------|
| types/messages.ts | 15 | 5 min |
| utils/messaging.ts | 20 | 5 min |
| Update app.ts imports | 5 | 5 min |
| Documentation | 50 | 15 min |
| **Total** | ~90 | ~30 min |

## Alternative: Full @lit/context Implementation

If we decide to implement full state context (not recommended for MVP):

| Task | Lines | Time |
|------|-------|------|
| Install @lit/context | - | 2 min |
| state/context.ts | 20 | 10 min |
| state/types.ts | 80 | 20 min |
| state/reducer.ts | 100 | 30 min |
| state/provider.ts | 120 | 40 min |
| state/consumer-mixin.ts | 40 | 15 min |
| Refactor all components | 200 | 60 min |
| **Total** | ~560 | ~3 hours |

This is significant effort with minimal user-facing benefit.

## Recommendation

1. **Keep current state management** - @state works well for 3-level depth
2. **Add messaging wrapper** - Type-safe sendMessage() function
3. **Document architecture** - Clear explanation of patterns used
4. **Defer @lit/context** - Add if/when complexity requires it

## Conclusion

The typed messaging story (029) is essentially complete. The state context story (028) can be marked as "deferred" or "simplified" since the current architecture is sufficient.

Minimal implementation:
- Create messaging wrapper for type safety
- Document the existing architecture
- Mark success criteria appropriately
