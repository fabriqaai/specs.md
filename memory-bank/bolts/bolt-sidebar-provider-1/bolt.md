---
id: bolt-sidebar-provider-1
unit: sidebar-provider
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 001-tree-data-provider
  - 002-intent-unit-story-tree
created: 2025-12-25T17:00:00Z
started: 2025-12-25T20:00:00Z
completed: 2025-12-25T20:20:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-25T20:00:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T20:10:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T20:20:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-artifact-parser-1
enables_bolts:
  - bolt-sidebar-provider-2
  - bolt-extension-core-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: bolt-sidebar-provider-1

## Overview

First sidebar bolt implementing the basic TreeDataProvider and Intent/Unit/Story hierarchy.

## Objective

Create the foundational tree view with the Intents section showing nested intents, units, and stories.

## Stories Included

- **001-tree-data-provider**: TreeDataProvider setup with root sections (Must)
- **002-intent-unit-story-tree**: Intent → Unit → Story nested hierarchy (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- bolt-artifact-parser-1 (needs parsed artifact data)

### Enables
- bolt-sidebar-provider-2 (builds on tree foundation)
- bolt-extension-core-1 (registers tree provider)

## Success Criteria

- [ ] TreeDataProvider registered and working
- [ ] Root sections: Intents, Bolts, Standards
- [ ] Intents sorted by number prefix
- [ ] Units nested under intents
- [ ] Stories nested under units
- [ ] Expand/collapse working
- [ ] Unit tests for tree building

## Notes

- Implement vscode.TreeDataProvider<TreeNode>
- Use EventEmitter for onDidChangeTreeData
- TreeItem.collapsibleState for expand/collapse
