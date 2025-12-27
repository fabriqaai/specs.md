---
stage: plan
bolt: bolt-sidebar-provider-5
created: 2025-12-26T18:15:00Z
---

## Implementation Plan: StateStore Integration & UI Enhancements

### Objective

Complete the StateStore integration by:
1. Wiring FileWatcher to auto-refresh StateStore on file changes
2. Displaying computed next actions in the Overview tab
3. Enabling bolt lifecycle actions (Start Bolt)
4. Adding smart intent selection with multiple strategies
5. Persisting expanded state across sessions
6. Implementing bolt filtering by intent/status/type

### Deliverables

**Story 011 - FileWatcher → StateStore Integration:**
- [ ] `src/extension.ts` - Create FileWatcher and connect to WebviewProvider.refresh()
- [ ] `src/sidebar/webviewProvider.ts` - Ensure refresh() properly updates StateStore

**Story 012 - Next Actions UI:**
- [ ] `src/webview/tabs/overview.ts` - Add "Suggested Actions" section
- [ ] `src/webview/components/nextActionCard.ts` - Create action card component
- [ ] `src/sidebar/webviewMessaging.ts` - Add NextAction data types

**Story 013 - Start Bolt Action:**
- [ ] `src/sidebar/webviewProvider.ts` - Implement `startBolt` message handler
- [ ] `src/parser/boltWriter.ts` - Create utility to update bolt.md frontmatter
- [ ] Update queue item UI to show Start button

**Story 014 - Intent Selection Strategies:**
- [ ] `src/state/selectors.ts` - Add `selectIntentByCompletion` strategy
- [ ] `src/state/types.ts` - Add `selectedIntentId` to UIState for manual override

**Story 015 - Persist Expanded State:**
- [ ] `src/sidebar/webviewMessaging.ts` - Add storage keys and types
- [ ] `src/sidebar/webviewProvider.ts` - Restore/persist expanded sets
- [ ] `src/state/types.ts` - Add `expandedIntents`, `expandedUnits` to UIState

**Story 016 - Bolt Filtering:**
- [ ] `src/state/types.ts` - Add `BoltFilters` interface to UIState
- [ ] `src/state/selectors.ts` - Add `selectFilteredBolts` selector
- [ ] Update Bolts tab UI with filter dropdown

### Dependencies

**External:**
- VS Code FileSystemWatcher API (existing)
- VS Code workspaceState API (existing)

**Internal:**
- StateStore (`src/state/`) - already implemented
- FileWatcher (`src/watcher/`) - already implemented
- WebviewProvider (`src/sidebar/`) - already implemented

### Technical Approach

#### 1. FileWatcher → StateStore Connection

```
extension.ts:
  const provider = createWebviewProvider(context, workspacePath);
  const watcher = createFileWatcher(workspacePath, () => provider.refresh());
  context.subscriptions.push(watcher);
```

The chain is already mostly wired:
- FileWatcher calls onChange callback (debounced)
- WebviewProvider.refresh() calls scanMemoryBank()
- scanMemoryBank() returns MemoryBankModel
- StateStore.loadFromModel() updates state
- StateStore notifies subscribers
- WebviewProvider re-renders

**Gap**: Extension.ts needs to create FileWatcher and connect to provider.

#### 2. Next Actions in Overview Tab

The selectors already compute `nextActions` with priority. UI needs to render them:
- Show section header "Suggested Actions"
- List top 3-5 actions with icon, title, description
- Each action is clickable → sends message to extension

#### 3. Start Bolt Message Handler

Current handler just shows info message. Need to:
1. Read bolt.md
2. Update frontmatter: `status: in-progress`, `started: <now>`
3. Write bolt.md
4. Let FileWatcher detect change → refresh automatically

#### 4. Intent Selection Enhancement

Add to existing priority chain:
1. Manual selection (new)
2. Active bolt (existing)
3. Recent activity (existing)
4. In-progress stories (existing)
5. **Lowest completion** (new)
6. First intent (existing)

#### 5. Expanded State Persistence

Storage keys:
- `specsmd.expandedIntents` → Set<string> serialized as array
- `specsmd.expandedUnits` → Set<string> serialized as array

On webview message `toggleIntent`/`toggleUnit`:
- Update UIState.expandedIntents/expandedUnits
- Persist to workspaceState
- Re-render to reflect change

#### 6. Bolt Filtering

Add `BoltFilters` to UIState:
```typescript
interface BoltFilters {
  intentId: string | null;
  status: ArtifactStatus | 'all';
  type: string | 'all';
}
```

Add `selectFilteredBolts(bolts, filters)` selector.
UI: dropdown menu in Bolts tab header.

### Acceptance Criteria

- [ ] **011**: File changes trigger auto-refresh within 100ms debounce
- [ ] **012**: Overview tab shows "Suggested Actions" with clickable items
- [ ] **013**: Start button on queue items updates bolt.md and refreshes
- [ ] **014**: Current intent follows priority chain including completion %
- [ ] **015**: Expanded nodes persist across VS Code restarts
- [ ] **016**: Bolt filter dropdown filters visible bolts

### Risk Assessment

| Risk | Mitigation |
|------|------------|
| Circular dependency (FileWatcher → Provider → StateStore → FileWatcher) | FileWatcher only triggers refresh, doesn't read state |
| Performance on large projects | Debouncing already in place; selectors are O(n) |
| Race condition on rapid edits | Debounce prevents rapid fire; StateStore is synchronous |
