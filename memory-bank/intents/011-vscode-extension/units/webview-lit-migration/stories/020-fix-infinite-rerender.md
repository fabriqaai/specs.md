---
id: vscode-extension-story-wlm-020
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
implemented: true
priority: must
created: 2025-12-26
---

# Story: Fix Infinite Re-render Loop

## User Story

**As a** extension user
**I want** the sidebar to respond to clicks
**So that** I can navigate between tabs and interact with the UI

## Problem

The webview is being re-rendered in an infinite loop (200+ times per second), which:
1. Destroys DOM elements with their event listeners
2. Creates new DOM elements
3. Attaches new event listeners
4. Immediately destroys them again

Console evidence:
```
VM10:5 [SpecsMD] Scripts initializing...
VM16:5 [SpecsMD] Scripts initializing...
VM22:5 [SpecsMD] Scripts initializing...
... (hundreds more)
```

## Root Cause Analysis

Likely causes to investigate:

1. **StateStore Subscription Loop**
   - `_updateWebview()` triggers state change
   - State change triggers subscription
   - Subscription calls `_updateWebview()`
   - Infinite loop

2. **FileWatcher Triggering Refresh**
   - File changes trigger `scanMemoryBank()`
   - Which triggers `loadFromModel()`
   - Which triggers store update
   - Which triggers `_updateWebview()`

3. **Ready Message Loop**
   - Script sends `ready` message
   - Provider calls `refresh()`
   - Refresh re-renders webview
   - New script sends `ready` again

## Acceptance Criteria

- [ ] **Given** webview is visible, **When** loaded, **Then** scripts initialize exactly once
- [ ] **Given** webview is rendered, **When** user clicks tab, **Then** click handler fires
- [ ] **Given** StateStore changes, **When** not from webview init, **Then** webview updates once
- [ ] **Given** file changes, **When** debounce completes, **Then** single refresh occurs

## Technical Implementation

### 1. Add Re-render Guard
```typescript
// webviewProvider.ts
private _isUpdating = false;
private _pendingUpdate = false;

private _updateWebview(): void {
    if (this._isUpdating) {
        this._pendingUpdate = true;
        return;
    }

    this._isUpdating = true;
    try {
        // ... render logic
    } finally {
        this._isUpdating = false;
        if (this._pendingUpdate) {
            this._pendingUpdate = false;
            this._updateWebview();
        }
    }
}
```

### 2. Debounce Store Updates
```typescript
// Only update webview on actual data changes
this._unsubscribe = this._store.subscribe(() => {
    // Compare previous state hash to avoid unnecessary re-renders
    const newHash = this._computeStateHash();
    if (newHash !== this._lastStateHash) {
        this._lastStateHash = newHash;
        this._updateWebview();
    }
});
```

### 3. Fix Ready Message Handler
```typescript
case 'ready':
    // Only refresh if not already loaded
    if (!this._initialLoadComplete) {
        this._initialLoadComplete = true;
        await this.refresh();
    }
    break;
```

### 4. Add Render Counter for Debugging
```typescript
private _renderCount = 0;

private _updateWebview(): void {
    this._renderCount++;
    console.log(`[SpecsMD Provider] Render #${this._renderCount}`);
    // ... rest of method
}
```

## Files to Modify

- `src/sidebar/webviewProvider.ts` - Add re-render guards
- `src/state/stateStore.ts` - Add state comparison
- `src/webview/scripts.ts` - Add initialization guard

## Testing

- Manual: Open DevTools, verify single initialization
- Manual: Click tabs, verify `[SpecsMD] Tab clicked:` appears
- Unit: Mock store subscription, verify single render per change

## Dependencies

### Requires
- None (bug fix)

### Blocks
- All other webview-lit-migration stories
