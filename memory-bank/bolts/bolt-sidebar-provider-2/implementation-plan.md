---
stage: plan
bolt: bolt-sidebar-provider-2
created: 2025-12-25T20:30:00Z
---

## Implementation Plan: sidebar-provider (Part 2)

### Objective

Enhance the sidebar with expandable bolt tree showing stages/stories, colored status icons, and optional branding footer.

### Deliverables

- Expandable bolt nodes with stages and stories as children
- Stage and story child nodes for bolts
- Colored status icons for all artifact types
- Bolt type badges (DDD, Simple)
- Optional pixel logo footer (using TreeView description)

### Dependencies

- bolt-sidebar-provider-1: Base tree implementation
- VS Code ThemeIcon API for colored icons

### Technical Approach

#### 003: Bolt Tree Enhancement

1. Add `BoltStageNode` and `BoltStoryNode` types
2. Make bolt nodes expandable (collapsibleState = Collapsed)
3. Implement `createBoltStageNodes()` and `createBoltStoryNodes()`
4. Update `getChildNodes()` to return stages/stories for bolt nodes
5. Display bolt format: `bolt-name [Type] (stage)`

#### 004: Status Icons

1. Use VS Code ThemeColor with ThemeIcon for colored icons
2. Color mapping:
   - Complete: `$(check)` green
   - In Progress: `$(sync~spin)` yellow
   - Draft: `$(circle-outline)` gray
   - Unknown: `$(question)` gray
3. Apply to all node types via `getTreeItem()`

#### 005: Pixel Logo Footer

1. Use TreeView `message` property for footer (simpler than webview)
2. Show only when tree is not empty
3. Link to specs.md website (if message supports links)
4. Fallback: Show "Powered by specs.md" text

### File Changes

```
src/sidebar/
├── types.ts          # Add BoltStageNode, BoltStoryNode types
├── treeBuilder.ts    # Add bolt child node creation
├── treeProvider.ts   # Add icon colors, footer message
└── iconHelper.ts     # NEW: Status icon helper
```

### Acceptance Criteria

- [ ] Bolts section with proper sorting (in-progress first)
- [ ] Bolt type badges visible
- [ ] Expandable stages under bolts
- [ ] Stories listed under bolts
- [ ] Colored status icons working
- [ ] Footer/branding element present
- [ ] Unit tests for new functionality

### Icon Mapping

| Status | Icon | Color |
|--------|------|-------|
| Complete | check | green |
| In Progress | sync~spin | yellow |
| Draft | circle-outline | default |
| Unknown | question | gray |

### Bolt Display Format

```
🔧 bolt-artifact-parser-1 [Simple] ✓
  └─ Stages
     ├─ plan ✓
     ├─ implement ✓
     └─ test ✓
  └─ Stories
     ├─ 001-memory-bank-schema
     └─ 002-frontmatter-parsing
```
