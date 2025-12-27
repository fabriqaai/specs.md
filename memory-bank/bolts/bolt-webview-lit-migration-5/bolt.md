---
id: bolt-webview-lit-migration-5
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 028-state-context
  - 029-ipc-typed-messaging
created: 2025-12-26T19:00:00Z
started: 2025-12-26T23:10:00Z
completed: 2025-12-27T00:15:00Z
current_stage: complete
stages_completed:
  - plan: 2025-12-26T23:15:00Z
  - implement: 2025-12-27T00:00:00Z
  - test: 2025-12-27T00:15:00Z

requires_bolts:
  - bolt-webview-lit-migration-4
enables_bolts: []
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-webview-lit-migration-5

## Overview

Infrastructure bolt that adds Lit context for centralized state management and type-safe messaging between the webview and VS Code extension. This completes the migration with proper architecture.

## Objective

Implement @lit/context for state management to eliminate prop drilling, and create typed message contracts that catch errors at compile time instead of runtime.

## Stories Included

- **028-state-context**: Lit context provider, reducer, and consumer mixin for state (Must)
- **029-ipc-typed-messaging**: TypeScript discriminated unions for all webview ↔ extension messages (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-4 (all view components ready for state integration)

### Enables
- None (final bolt - enables production deployment)

## Success Criteria

### State Context
- [ ] @lit/context installed and configured
- [ ] `<state-provider>` wraps app and provides state
- [ ] `withState()` mixin gives components access to state
- [ ] State updates trigger only affected component re-renders
- [ ] Reducer handles all state actions
- [ ] VS Code messages update context state

### Typed Messaging
- [ ] `src/shared/messages.ts` defines all message types
- [ ] `WebviewToExtensionMessage` union type covers all outbound
- [ ] `ExtensionToWebviewMessage` union type covers all inbound
- [ ] `messaging.send()` validates message at compile time
- [ ] Switch statements get exhaustive checking
- [ ] IDE autocomplete works for message fields

## Notes

- This is the architectural capstone of the migration
- All components should be refactored to use context instead of props
- Message types shared between extension and webview builds
- Consider adding runtime validation for development mode
