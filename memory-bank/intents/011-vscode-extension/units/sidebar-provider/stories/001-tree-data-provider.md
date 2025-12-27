---
id: vscode-extension-story-sp-001
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Tree Data Provider Setup

## User Story

**As a** VS Code user
**I want** a tree view in the sidebar
**So that** I can see my memory-bank artifacts organized hierarchically

## Acceptance Criteria

- [ ] **Given** extension activates, **When** TreeDataProvider is registered, **Then** sidebar shows tree view
- [ ] **Given** TreeDataProvider, **When** getTreeItem() is called with a node, **Then** return properly configured TreeItem
- [ ] **Given** TreeDataProvider, **When** getChildren() is called with null, **Then** return root sections (Intents, Bolts, Standards)
- [ ] **Given** TreeDataProvider, **When** onDidChangeTreeData fires, **Then** tree view refreshes
- [ ] **Given** TreeDataProvider, **When** refresh() is called, **Then** onDidChangeTreeData event is emitted

## Technical Notes

- Implement vscode.TreeDataProvider<TreeNode>
- Use vscode.EventEmitter for onDidChangeTreeData
- Root sections are: "Intents", "Bolts", "Standards"
- Each section is collapsible

## Dependencies

### Requires
- artifact-parser (for data)

### Enables
- 002-intent-unit-story-tree
- 003-bolt-tree

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No artifacts | Show empty sections |
| Very long tree | VS Code handles virtualization |
| Rapid refresh calls | Debounced by file-watcher |

## Out of Scope

- Custom tree item rendering
- Drag and drop
