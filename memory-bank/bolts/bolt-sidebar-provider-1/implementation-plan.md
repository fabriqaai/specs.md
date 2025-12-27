---
stage: plan
bolt: bolt-sidebar-provider-1
created: 2025-12-25T20:00:00Z
---

## Implementation Plan: sidebar-provider (Part 1)

### Objective

Create the foundational TreeDataProvider that displays memory-bank artifacts in a hierarchical tree view with three root sections: Intents, Bolts, and Standards.

### Deliverables

- TreeNode type definitions for different node kinds
- MemoryBankTreeProvider class implementing vscode.TreeDataProvider
- Tree building logic for Intent → Unit → Story hierarchy
- Root sections: Intents, Bolts, Standards
- Proper sorting (intents by number, units alphabetically)
- Expand/collapse support via collapsibleState

### Dependencies

- bolt-artifact-parser-1: MemoryBankModel, scanMemoryBank()
- VS Code API: TreeDataProvider, TreeItem, EventEmitter

### Technical Approach

1. **TreeNode Types**: Create discriminated union for different node kinds (root, intent, unit, story, bolt, standard)
2. **TreeDataProvider**: Implement getTreeItem() and getChildren() methods
3. **Event Emitter**: Use onDidChangeTreeData for refresh triggers
4. **Root Sections**: Three expandable root nodes that lazily load children
5. **Hierarchy**: Intents contain Units contain Stories
6. **Icons**: Use VS Code codicons for visual distinction
7. **Sorting**: Maintain sort order from parser (intents by number, bolts with in-progress first)

### File Structure

```
src/sidebar/
├── types.ts          # TreeNode types
├── treeProvider.ts   # MemoryBankTreeProvider class
├── treeBuilder.ts    # Tree construction logic
└── index.ts          # Public exports
```

### Acceptance Criteria

- [ ] TreeDataProvider registered and working
- [ ] Root sections: Intents, Bolts, Standards visible
- [ ] Intents sorted by number prefix
- [ ] Units nested under intents
- [ ] Stories nested under units
- [ ] Expand/collapse working correctly
- [ ] Unit tests for tree building

### Icon Mapping

| Node Type | Codicon |
|-----------|---------|
| Intents Root | $(folder-library) |
| Intent | $(package) |
| Unit | $(symbol-module) |
| Story | $(note) |
| Bolts Root | $(tools) |
| Bolt | $(wrench) |
| Standards Root | $(law) |
| Standard | $(file-text) |

### Status Indicators

| Status | Suffix |
|--------|--------|
| Complete | ✓ |
| In Progress | ● |
| Draft | ○ |
