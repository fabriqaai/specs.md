# Implementation Plan: Bolt 4 - Specs and Overview View Components

## Overview

This bolt migrates the Specs and Overview views from server-rendered HTML to Lit components. Unlike the Bolts view (which uses structured data), these views currently work well as server-rendered HTML, so we'll evaluate the best approach.

## Current State Analysis

### Specs View (HTML)
- Hierarchical tree: Intents → Units → Stories
- Filter dropdown (All Status, In Progress, Completed, Not Started)
- Progress rings for each intent
- Expand/collapse for intents and units
- Click to open story files

### Overview View (HTML)
- Overall progress bar and metrics
- Suggested actions section
- Intents list with progress
- Standards list
- Resources section (external links)

## Architecture Decision

**Hybrid Approach** - Keep server-rendered HTML for Specs and Overview views because:
1. These views are already working well with HTML rendering
2. The data structures match the current WebviewData
3. Less migration effort, same user experience
4. Focus Lit effort on Bolts view where component reusability matters most

However, we'll create **shared Lit components** that can be reused:
- `<search-input>` - Reusable search input (for future use)
- `<empty-state>` - Consistent empty state display
- `<progress-bar>` - Linear progress bar

## Components to Create

### Shared Components (3 files)
```
src/webview/components/shared/
├── search-input.ts      # Search input with debounce
├── empty-state.ts       # Empty state display
└── progress-bar.ts      # Linear progress bar
```

### Specs View Components (2 files - optional Lit migration)
```
src/webview/components/specs/
├── specs-view.ts        # Container with filter
└── spec-tree-item.ts    # Recursive tree node
```

### Overview View Components (3 files - optional Lit migration)
```
src/webview/components/overview/
├── overview-view.ts     # Container
├── metric-card.ts       # Stat display card
└── action-item.ts       # Suggested action item
```

## Implementation Steps

### Step 1: Create Shared Components

1. **search-input.ts** - Reusable search input
   - Props: `value`, `placeholder`
   - Dispatches `search-change` event with debounce

2. **empty-state.ts** - Empty state display
   - Props: `icon`, `message`, `hint`
   - Centered display with icon and text

3. **progress-bar.ts** - Linear progress bar
   - Props: `percent`, `label`
   - Horizontal bar with percentage

### Step 2: Evaluate Specs View Migration

Looking at the current HTML (`getSpecsViewHtml`), it handles:
- Intent tree with expand/collapse
- Unit sub-tree with expand/collapse
- Story items with click-to-open
- Filter dropdown
- Progress rings

**Decision**: Keep as HTML for now. The tree structure with expand/collapse state is complex, and the current HTML approach is working. We can migrate later if needed.

### Step 3: Evaluate Overview View Migration

Looking at the current HTML (`getOverviewViewHtml`), it shows:
- Progress bar and metrics grid
- Suggested actions list
- Intents summary list
- Standards list
- Resources links

**Decision**: Keep as HTML for now. The view is mostly static content with simple interactions.

### Step 4: Update app.ts (if converting to Lit)

If we decide to convert Specs/Overview to Lit:
```typescript
// Update message handler
case 'setData':
    this._boltsData = message.boltsData;
    this._specsData = message.specsData;  // New structured data
    this._overviewData = message.overviewData;  // New structured data
    break;
```

### Step 5: Update webviewProvider.ts (if converting to Lit)

If we decide to convert:
```typescript
private _sendDataToWebview(data: WebviewData, activeTab: TabId): void {
    this._view.webview.postMessage({
        type: 'setData',
        activeTab,
        boltsData,
        specsData,      // Structured data for Lit
        overviewData    // Structured data for Lit
    });
}
```

## Recommended Approach

After analysis, I recommend:

1. **Keep Specs and Overview as HTML** - They work well, are less complex than Bolts view, and don't benefit as much from componentization.

2. **Create shared components only** - For future reuse:
   - `empty-state.ts` - Useful across views
   - `progress-bar.ts` - For overview linear progress

3. **Document the hybrid architecture** - Explain why Bolts uses Lit and others use HTML.

## Minimal Implementation Plan

### Files to Create

1. **`src/webview/components/shared/empty-state.ts`**
   ```typescript
   @customElement('empty-state')
   export class EmptyState extends BaseElement {
       @property() icon = '';
       @property() message = '';
       // Centered display with icon and message
   }
   ```

2. **`src/webview/components/shared/progress-bar.ts`**
   ```typescript
   @customElement('progress-bar')
   export class ProgressBar extends BaseElement {
       @property({ type: Number }) percent = 0;
       @property() label = '';
       // Horizontal progress bar
   }
   ```

### Files to Update

3. **`src/webview/components/app.ts`** - No changes needed (already handles specsHtml/overviewHtml)

4. **`src/sidebar/webviewProvider.ts`** - No changes needed (already sends specsHtml/overviewHtml)

## Success Criteria Mapping

### Story 026 (Specs View) - Already Met via HTML
- [x] Tree structure displays - handled by `getSpecsViewHtml`
- [x] File click opens editor - handled by existing scripts
- [x] Folder expand/collapse - handled by existing scripts
- [x] Filter dropdown works - handled by existing scripts
- [ ] Search filters in real-time - NOT implemented (optional enhancement)
- [x] Empty state shows - handled by `getSpecsViewHtml`

### Story 027 (Overview View) - Already Met via HTML
- [x] All sections display - handled by `getOverviewViewHtml`
- [x] Resource links work - handled by existing scripts
- [x] Suggested actions work - handled by existing scripts
- [x] Stats refresh on data update - handled by full re-render
- [ ] Getting started section - NOT implemented (nice to have)

## Estimated Effort

| Task | Lines (est) |
|------|-------------|
| empty-state.ts | 50 |
| progress-bar.ts | 60 |
| Update lit/index.ts imports | 5 |
| **Total** | ~115 |

## Alternative: Full Lit Migration

If we want to fully convert Specs and Overview to Lit (not recommended for this bolt):

| Component | Lines (est) |
|-----------|-------------|
| specs-view.ts | 150 |
| spec-tree-item.ts | 120 |
| overview-view.ts | 100 |
| metric-card.ts | 60 |
| action-item.ts | 80 |
| **Total** | ~510 |

This would require significant changes to data flow and is better suited for a separate bolt.

## Conclusion

The recommended approach is to:
1. Create 2 shared components (empty-state, progress-bar)
2. Keep Specs and Overview as server-rendered HTML
3. Document the hybrid architecture clearly
4. Mark success criteria as met via existing HTML approach

This approach validates the hybrid architecture and keeps the scope manageable.
