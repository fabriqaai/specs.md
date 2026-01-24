# Testing FIRE Flow Agents with Promptfoo

A practical guide to testing FIRE (Fast Intent-Run Engineering) agents using Promptfoo, including test setup, golden datasets, and mode-based checkpoint validation.

---

## Table of Contents

1. [FIRE Flow Overview](#fire-flow-overview)
2. [Golden Datasets for FIRE](#golden-datasets-for-fire)
3. [Test Fixtures and States](#test-fixtures-and-states)
4. [Testing Each Agent](#testing-each-agent)
5. [Mode-Based Checkpoint Testing](#mode-based-checkpoint-testing)
6. [Hierarchical Standards Testing](#hierarchical-standards-testing)
7. [Script-Based State Management Testing](#script-based-state-management-testing)
8. [Complete Example Configuration](#complete-example-configuration)

---

## FIRE Flow Overview

### What is FIRE?

**FIRE** (Fast Intent-Run Engineering) is a simplified AI-native development methodology that reduces checkpoints from 10-26 (AI-DLC) to just 0-2.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRE HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   INTENT                    What the user wants to achieve              │
│      ↓                                                                  │
│   WORK ITEMS               Discrete, executable units                   │
│      ↓                                                                  │
│   RUNS                     Execution sessions with artifacts            │
│                                                                         │
│   Flat structure: NO epics, sprints, or story points                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### FIRE's Three Agents

| Agent | Role | Degrees of Freedom |
|-------|------|-------------------|
| **Orchestrator** | Routes users to appropriate agent based on project state | N/A (routing logic) |
| **Planner** | Captures intent, decomposes into work items | HIGH (exploratory) |
| **Builder** | Executes work items with mode-appropriate checkpoints | LOW (precise execution) |

### Execution Modes

| Mode | Checkpoints | Complexity | Behavior |
|------|-------------|------------|----------|
| **Autopilot** | 0 | Low | AI acts autonomously |
| **Confirm** | 1 | Medium | Human approves plan |
| **Validate** | 2 | High | Human reviews design + approves plan |

---

## Golden Datasets for FIRE

### Structure

```text
__tests__/
├── golden-datasets/
│   └── fire/
│       ├── orchestrator/
│       │   ├── inputs/
│       │   │   ├── 001-new-project.txt
│       │   │   ├── 002-initialized-no-intents.txt
│       │   │   ├── 003-intent-no-work-items.txt
│       │   │   ├── 004-pending-work-items.txt
│       │   │   └── 005-active-run.txt
│       │   ├── outputs/
│       │   │   ├── 001-routes-to-planner-init.md
│       │   │   ├── 002-routes-to-planner-capture.md
│       │   │   ├── 003-routes-to-planner-decompose.md
│       │   │   ├── 004-routes-to-builder-execute.md
│       │   │   └── 005-routes-to-builder-resume.md
│       │   └── context/
│       │
│       ├── planner/
│       │   ├── inputs/
│       │   │   ├── 001-capture-auth-intent.txt
│       │   │   ├── 002-decompose-auth-intent.txt
│       │   │   └── 003-generate-design-doc.txt
│       │   ├── outputs/
│       │   │   ├── 001-auth-intent-brief.md
│       │   │   ├── 002-auth-work-items.md
│       │   │   └── 003-auth-design-doc.md
│       │   └── context/
│       │       ├── 001-capture-auth/
│       │       │   └── .specs-fire/
│       │       └── 002-decompose-auth/
│       │           └── .specs-fire/
│       │
│       └── builder/
│           ├── inputs/
│           │   ├── 001-plan-run-single.txt
│           │   ├── 002-execute-autopilot.txt
│           │   ├── 003-execute-confirm.txt
│           │   └── 004-execute-validate.txt
│           ├── outputs/
│           │   ├── 001-run-plan-single.md
│           │   ├── 002-autopilot-no-checkpoints.md
│           │   ├── 003-confirm-one-checkpoint.md
│           │   └── 004-validate-two-checkpoints.md
│           └── context/
│               ├── 001-plan-run/
│               │   └── .specs-fire/
│               └── 002-execute/
│                   └── .specs-fire/
```

### Building Golden Examples for FIRE

**Step 1: Capture real agent outputs**

```bash
# Run FIRE agent and capture output
promptfoo eval --output captured-fire.json
```

**Step 2: Validate quality**

- Does the intent brief capture goal, users, problem, constraints?
- Are work items properly decomposed with complexity assessment?
- Does mode assignment respect autonomy_bias?
- Are checkpoints enforced correctly per mode?

**Step 3: Promote to golden**

```bash
cp captured-output.md __tests__/golden-datasets/fire/planner/outputs/001-auth-intent-brief.md
```

---

## Test Fixtures and States

### FIRE State Progression

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIRE STATE REQUIREMENTS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ORCHESTRATOR                                                           │
│  └── Needs: Check for .specs-fire/state.yaml                           │
│  └── Routes based on: active run, pending items, intent status         │
│                                                                         │
│  PLANNER                                                                │
│  └── intent-capture: initialized project, no active intent             │
│  └── work-item-decompose: intent with brief.md, no work items          │
│  └── design-doc-generate: work item with validate mode                 │
│                                                                         │
│  BUILDER                                                                │
│  └── run-plan: pending work items exist                                │
│  └── run-execute: planned run with work items assigned                 │
│  └── run-status: active run in progress                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fixture Directory Structure

```text
__tests__/
└── fixtures/
    └── fire-states/
        │
        ├── 01-empty-project/              # No .specs-fire directory
        │   └── README.md                  # Just a placeholder
        │
        ├── 02-initialized-project/        # After project-init
        │   └── .specs-fire/
        │       ├── state.yaml             # Basic project config
        │       └── standards/
        │           ├── constitution.md
        │           ├── tech-stack.md
        │           └── coding-standards.md
        │
        ├── 03-intent-captured/            # Intent exists, no work items
        │   └── .specs-fire/
        │       ├── state.yaml             # intent status: in_progress
        │       ├── standards/
        │       └── intents/
        │           └── INT-001-user-auth/
        │               └── brief.md
        │
        ├── 04-work-items-decomposed/      # Ready for Builder
        │   └── .specs-fire/
        │       ├── state.yaml             # work items: pending
        │       ├── standards/
        │       └── intents/
        │           └── INT-001-user-auth/
        │               ├── brief.md
        │               └── work-items/
        │                   ├── WI-001-login-form.md      # mode: autopilot
        │                   ├── WI-002-oauth-integration.md # mode: confirm
        │                   └── WI-003-session-management.md # mode: validate
        │
        ├── 05-run-in-progress/            # Active run
        │   └── .specs-fire/
        │       ├── state.yaml             # run status: in_progress
        │       ├── standards/
        │       ├── intents/
        │       │   └── INT-001-user-auth/
        │       │       ├── brief.md
        │       │       └── work-items/
        │       └── runs/
        │           └── RUN-001/
        │               ├── run.md         # Created by init-run.js
        │               └── plan.md        # Implementation plan
        │
        ├── 06-run-completed/              # All artifacts present
        │   └── .specs-fire/
        │       ├── state.yaml             # run status: completed
        │       ├── standards/
        │       ├── intents/
        │       └── runs/
        │           └── RUN-001/
        │               ├── run.md
        │               ├── plan.md
        │               ├── test-report.md
        │               ├── review-report.md
        │               └── walkthrough.md
        │
        └── 07-monorepo-project/           # Hierarchical standards
            └── .specs-fire/
                ├── state.yaml
                ├── standards/             # Root standards
                │   ├── constitution.md    # NEVER overridden
                │   ├── tech-stack.md
                │   └── coding-standards.md
                └── intents/
            └── packages/
                └── api/
                    └── .specs-fire/
                        └── standards/     # Module overrides
                            └── tech-stack.md  # API-specific stack
```

### State.yaml Fixture Examples

**02-initialized-project/state.yaml**:

```yaml
project:
  name: test-project
  description: Test project for FIRE evaluation
  created: 2025-01-15T10:00:00Z
  fireVersion: "1.0"

workspace:
  type: greenfield
  structure: monolith
  autonomyBias: balanced
  runScopePreference: null
  runScopeHistory: []

intents: []
runs: []
```

**04-work-items-decomposed/state.yaml**:

```yaml
project:
  name: test-project
  description: Test project for FIRE evaluation
  created: 2025-01-15T10:00:00Z
  fireVersion: "1.0"

workspace:
  type: greenfield
  structure: monolith
  autonomyBias: balanced
  runScopePreference: null
  runScopeHistory: []

intents:
  - id: INT-001-user-auth
    title: User Authentication System
    status: in_progress
    workItems:
      - id: WI-001-login-form
        status: pending
        mode: autopilot
        complexity: low
      - id: WI-002-oauth-integration
        status: pending
        mode: confirm
        complexity: medium
      - id: WI-003-session-management
        status: pending
        mode: validate
        complexity: high

runs: []
```

---

## Testing Each Agent

### Testing Orchestrator Agent

**Purpose**: Verify correct routing based on project state

```yaml
# orchestrator-agent-tests.yaml
description: "FIRE Orchestrator Routing Tests"

prompts:
  - file://prompts/fire/orchestrator-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

defaultTest:
  assert:
    - type: not-contains
      value: "ERROR"

tests:
  # Route to Planner for new project
  - description: "Routes new project to Planner for init"
    vars:
      project_state: "No .specs-fire directory found"
      request: "I want to build a new feature"
    assert:
      - type: contains
        value: "Planner"
      - type: llm-rubric
        value: "Does the response suggest initializing the project first?"

  # Route to Planner for intent capture
  - description: "Routes initialized project to Planner for intent capture"
    vars:
      project_state: file://fixtures/fire-states/02-initialized-project/state-summary.md
      request: "I want to add user authentication"
    assert:
      - type: contains
        value: "Planner"
      - type: contains
        value: "intent"

  # Route to Planner for work item decomposition
  - description: "Routes intent without work items to Planner"
    vars:
      project_state: file://fixtures/fire-states/03-intent-captured/state-summary.md
      request: "Let's break this down"
    assert:
      - type: contains
        value: "Planner"
      - type: contains
        value: "work item"

  # Route to Builder for execution
  - description: "Routes pending work items to Builder"
    vars:
      project_state: file://fixtures/fire-states/04-work-items-decomposed/state-summary.md
      request: "Let's start building"
    assert:
      - type: contains
        value: "Builder"
      - type: llm-rubric
        value: "Does the response mention run planning or execution?"

  # Route to Builder for resume
  - description: "Routes active run to Builder for resume"
    vars:
      project_state: file://fixtures/fire-states/05-run-in-progress/state-summary.md
      request: "Continue where we left off"
    assert:
      - type: contains
        value: "Builder"
      - type: llm-rubric
        value: "Does the response indicate resuming an existing run?"
```

### Testing Planner Agent

**Purpose**: Verify HIGH degrees-of-freedom conversational quality

```yaml
# planner-agent-tests.yaml
description: "FIRE Planner Agent Tests"

prompts:
  - file://prompts/fire/planner-system.txt

providers:
  - openrouter:meta-llama/llama-3.3-70b-instruct:free

tests:
  # Intent Capture - Conversational Quality
  - description: "Asks clarifying questions during intent capture"
    vars:
      project_state: file://fixtures/fire-states/02-initialized-project/state-summary.md
      skill: "intent-capture"
      request: "I want to add authentication"
    assert:
      - type: llm-rubric
        value: |
          The Planner should ask clarifying questions about:
          1. Goal - What specifically should authentication achieve?
          2. Users - Who will use this feature?
          3. Problem - What problem does this solve?
          4. Success criteria - How do we know it's working?
          5. Constraints - Any technical or business constraints?
          Return PASS if at least 3 of these areas are explored.

  # Intent Brief Quality
  - description: "Generates well-structured intent brief"
    vars:
      project_state: file://fixtures/fire-states/02-initialized-project/state-summary.md
      skill: "intent-capture"
      request: "OAuth-based user authentication with Google and GitHub providers"
    assert:
      - type: contains
        value: "## Goal"
      - type: contains
        value: "## Users"
      - type: contains
        value: "## Success Criteria"
      - type: llm-rubric
        value: "Is this intent brief specific enough to decompose into work items?"

  # Work Item Decomposition
  - description: "Decomposes intent into properly structured work items"
    vars:
      project_state: file://fixtures/fire-states/03-intent-captured/state-summary.md
      skill: "work-item-decompose"
      intent_brief: file://fixtures/fire-states/03-intent-captured/.specs-fire/intents/INT-001-user-auth/brief.md
    assert:
      - type: llm-rubric
        value: |
          Verify work items have:
          1. Clear title and description
          2. Complexity assessment (low/medium/high)
          3. Execution mode (autopilot/confirm/validate)
          4. Acceptance criteria
          5. Dependencies (if any)
          Return PASS if all work items meet these criteria.
      - type: javascript
        value: |
          // Verify at least 2 work items created
          const workItemMatches = output.match(/WI-\d{3}/g) || [];
          return workItemMatches.length >= 2;

  # Complexity Assessment
  - description: "Assigns complexity correctly based on criteria"
    vars:
      project_state: file://fixtures/fire-states/03-intent-captured/state-summary.md
      skill: "work-item-decompose"
      request: |
        Break down into work items:
        - Simple form styling fix
        - Payment processing integration
        - Database schema migration
    assert:
      - type: llm-rubric
        provider: openrouter:x-ai/grok-4.1-fast:free
        value: |
          Verify complexity assignments:
          - Form styling fix → should be LOW complexity
          - Payment processing → should be HIGH complexity
          - Database migration → should be MEDIUM or HIGH
          Return PASS if complexity matches expected levels.

  # Autonomy Bias Influence
  - description: "Mode assignment respects autonomy_bias=controlled"
    vars:
      project_state: |
        workspace:
          autonomyBias: controlled
      skill: "work-item-decompose"
      request: "Create work item for simple button styling change"
    assert:
      - type: llm-rubric
        value: |
          With autonomyBias=controlled:
          - LOW complexity should map to CONFIRM mode (not autopilot)
          - The response should reflect more human checkpoints
          Return PASS if mode assignment respects controlled bias.

  # Dependency Validation
  - description: "Catches circular dependencies"
    vars:
      project_state: file://fixtures/fire-states/03-intent-captured/state-summary.md
      skill: "work-item-decompose"
      request: |
        Create work items:
        - WI-001 depends on WI-002
        - WI-002 depends on WI-003
        - WI-003 depends on WI-001
    assert:
      - type: llm-rubric
        value: "Does the agent identify and reject the circular dependency?"
      - type: contains
        value: "circular"
```

### Testing Builder Agent

**Purpose**: Verify LOW degrees-of-freedom execution precision

```yaml
# builder-agent-tests.yaml
description: "FIRE Builder Agent Tests"

prompts:
  - file://prompts/fire/builder-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

tests:
  # Run Plan - File System Discovery
  - description: "Discovers work items via file system scan"
    vars:
      project_state: file://fixtures/fire-states/04-work-items-decomposed/state-summary.md
      skill: "run-plan"
    assert:
      - type: llm-rubric
        value: |
          Verify run-plan:
          1. Lists all pending work items from file system
          2. Shows scope options (single/batch/wide)
          3. Respects dependencies in suggested order
          Return PASS if all criteria met.

  # Run Plan - Scope Options
  - description: "Presents scope options correctly"
    vars:
      project_state: file://fixtures/fire-states/04-work-items-decomposed/state-summary.md
      skill: "run-plan"
    assert:
      - type: contains
        value: "single"
      - type: contains
        value: "batch"
      - type: llm-rubric
        value: "Are all three scope options (single/batch/wide) explained?"

  # Plan Creation Before Execution
  - description: "Creates plan.md BEFORE implementation"
    vars:
      project_state: file://fixtures/fire-states/04-work-items-decomposed/state-summary.md
      skill: "run-execute"
      work_item: "WI-001-login-form"
      mode: "autopilot"
    assert:
      - type: llm-rubric
        value: |
          Even in autopilot mode, the Builder MUST:
          1. Create plan.md before any implementation
          2. Document the approach in the plan
          3. Only then proceed to implementation
          Return PASS if plan is created first.

  # Resume Detection
  - description: "Detects and resumes interrupted run"
    vars:
      project_state: file://fixtures/fire-states/05-run-in-progress/state-summary.md
      skill: "run-execute"
      run_id: "RUN-001"
    assert:
      - type: llm-rubric
        value: |
          Verify resume behavior:
          1. Detects existing run artifacts (run.md, plan.md)
          2. Identifies current stage (where it left off)
          3. Does NOT re-do completed work
          4. Continues from appropriate step
          Return PASS if resume works correctly.

  # Code Review Invocation
  - description: "Invokes code-review skill after implementation"
    vars:
      project_state: file://fixtures/fire-states/05-run-in-progress/state-summary.md
      skill: "run-execute"
      stage: "post-implementation"
    assert:
      - type: llm-rubric
        value: |
          After implementation, Builder must:
          1. Run tests first
          2. Invoke code-review skill
          3. Report findings in review-report.md
          4. Auto-fix issues if possible
          Return PASS if code review is performed.

  # Walkthrough Generation
  - description: "Generates walkthrough after completion"
    vars:
      project_state: file://fixtures/fire-states/05-run-in-progress/state-summary.md
      skill: "walkthrough-generate"
      run_id: "RUN-001"
    assert:
      - type: contains
        value: "## Overview"
      - type: llm-rubric
        value: |
          Walkthrough should include:
          1. What was built
          2. Key decisions made
          3. Files created/modified
          4. How to test/verify
          Return PASS if walkthrough is comprehensive.
```

---

## Mode-Based Checkpoint Testing

### The Core FIRE Promise

FIRE reduces checkpoints from 10-26 to 0-2 based on execution mode. This is the most critical test area.

```yaml
# checkpoint-enforcement-tests.yaml
description: "FIRE Mode-Based Checkpoint Enforcement"

prompts:
  - file://prompts/fire/builder-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

defaultTest:
  vars:
    project_state: file://fixtures/fire-states/04-work-items-decomposed/state-summary.md

tests:
  # ═══════════════════════════════════════════════════════════════════
  # AUTOPILOT MODE - 0 Checkpoints
  # ═══════════════════════════════════════════════════════════════════

  - description: "Autopilot: ZERO human checkpoints"
    vars:
      skill: "run-execute"
      work_item: "WI-001-login-form"
      mode: "autopilot"
    assert:
      - type: llm-rubric
        value: |
          AUTOPILOT MODE (0 checkpoints):
          The agent should:
          1. Generate plan WITHOUT asking for approval
          2. Execute implementation WITHOUT pausing
          3. Run tests WITHOUT human confirmation
          4. Complete code review WITHOUT stopping
          5. Generate walkthrough WITHOUT checkpoint

          The agent should NOT:
          - Ask "Should I proceed?"
          - Wait for confirmation
          - Present plan for approval
          - Request human review at any stage

          Return PASS only if ZERO checkpoints are present.
      - type: not-contains
        value: "approve"
      - type: not-contains
        value: "confirm"
      - type: not-contains
        value: "proceed?"

  # ═══════════════════════════════════════════════════════════════════
  # CONFIRM MODE - 1 Checkpoint
  # ═══════════════════════════════════════════════════════════════════

  - description: "Confirm: EXACTLY ONE checkpoint at plan approval"
    vars:
      skill: "run-execute"
      work_item: "WI-002-oauth-integration"
      mode: "confirm"
    assert:
      - type: llm-rubric
        value: |
          CONFIRM MODE (1 checkpoint):
          The agent MUST:
          1. Generate implementation plan
          2. STOP and present plan for approval ← CHECKPOINT
          3. Wait for human confirmation
          4. Only after approval: execute, test, review, walkthrough

          The agent should NOT:
          - Auto-execute without plan approval
          - Add additional checkpoints beyond plan approval
          - Ask for confirmation at testing or review stages

          Return PASS only if EXACTLY 1 checkpoint at plan approval.

  - description: "Confirm: Blocks until human approves plan"
    vars:
      skill: "run-execute"
      work_item: "WI-002-oauth-integration"
      mode: "confirm"
    assert:
      - type: contains
        value: "plan"
      - type: llm-rubric
        value: |
          Verify the agent:
          1. Presents the implementation plan clearly
          2. Asks for explicit approval
          3. Does NOT proceed to implementation
          Return PASS if execution is blocked awaiting approval.

  # ═══════════════════════════════════════════════════════════════════
  # VALIDATE MODE - 2 Checkpoints
  # ═══════════════════════════════════════════════════════════════════

  - description: "Validate: EXACTLY TWO checkpoints (design + plan)"
    vars:
      skill: "run-execute"
      work_item: "WI-003-session-management"
      mode: "validate"
      has_design_doc: true
    assert:
      - type: llm-rubric
        value: |
          VALIDATE MODE (2 checkpoints):
          The agent MUST:
          1. Present design document for review ← CHECKPOINT 1
          2. Wait for design approval
          3. Generate implementation plan
          4. Present plan for approval ← CHECKPOINT 2
          5. Wait for plan approval
          6. Only after both approvals: execute, test, review, walkthrough

          The agent should NOT:
          - Skip design review
          - Auto-approve either checkpoint
          - Add more than 2 checkpoints

          Return PASS only if EXACTLY 2 checkpoints are enforced.

  - description: "Validate: Requires design doc before execution"
    vars:
      skill: "run-execute"
      work_item: "WI-003-session-management"
      mode: "validate"
      has_design_doc: false
    assert:
      - type: llm-rubric
        value: |
          Without a design document:
          - Agent should NOT proceed to implementation
          - Agent should request design document creation
          - Agent should route to Planner for design-doc-generate
          Return PASS if agent blocks execution without design doc.
```

### Autonomy Bias Override Testing

```yaml
# autonomy-bias-tests.yaml
description: "Autonomy Bias Influence on Mode Selection"

tests:
  # Autonomous bias - fewer checkpoints
  - description: "Autonomous bias: low→autopilot, medium→autopilot, high→confirm"
    vars:
      autonomy_bias: "autonomous"
      complexities: ["low", "medium", "high"]
    assert:
      - type: llm-rubric
        value: |
          With autonomyBias=autonomous:
          - LOW complexity → AUTOPILOT (0 checkpoints)
          - MEDIUM complexity → AUTOPILOT (0 checkpoints)
          - HIGH complexity → CONFIRM (1 checkpoint)
          Return PASS if mode assignments match.

  # Balanced bias - standard checkpoints
  - description: "Balanced bias: low→autopilot, medium→confirm, high→validate"
    vars:
      autonomy_bias: "balanced"
      complexities: ["low", "medium", "high"]
    assert:
      - type: llm-rubric
        value: |
          With autonomyBias=balanced:
          - LOW complexity → AUTOPILOT (0 checkpoints)
          - MEDIUM complexity → CONFIRM (1 checkpoint)
          - HIGH complexity → VALIDATE (2 checkpoints)
          Return PASS if mode assignments match.

  # Controlled bias - more checkpoints
  - description: "Controlled bias: low→confirm, medium→validate, high→validate"
    vars:
      autonomy_bias: "controlled"
      complexities: ["low", "medium", "high"]
    assert:
      - type: llm-rubric
        value: |
          With autonomyBias=controlled:
          - LOW complexity → CONFIRM (1 checkpoint)
          - MEDIUM complexity → VALIDATE (2 checkpoints)
          - HIGH complexity → VALIDATE (2 checkpoints)
          Return PASS if mode assignments match.
```

---

## Hierarchical Standards Testing

### Monorepo Standards Resolution

```yaml
# standards-resolution-tests.yaml
description: "Hierarchical Standards Resolution for Monorepos"

prompts:
  - file://prompts/fire/builder-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

tests:
  # Constitution NEVER overridden
  - description: "Constitution always from root, never module override"
    vars:
      project_state: file://fixtures/fire-states/07-monorepo-project/state-summary.md
      workspace: "monorepo"
      editing_file: "packages/api/src/handler.ts"
    assert:
      - type: llm-rubric
        value: |
          When editing a module file in a monorepo:
          - Constitution MUST come from root .specs-fire/standards/
          - Even if packages/api/.specs-fire/standards/constitution.md exists
          - Constitution is NEVER overridden at module level
          Return PASS if root constitution is used.

  # Module-specific standards override
  - description: "Module tech-stack overrides root when editing module files"
    vars:
      project_state: file://fixtures/fire-states/07-monorepo-project/state-summary.md
      workspace: "monorepo"
      editing_file: "packages/api/src/handler.ts"
      root_tech_stack: "React, TypeScript, Jest"
      module_tech_stack: "Express, TypeScript, Supertest"
    assert:
      - type: llm-rubric
        value: |
          When editing packages/api/src/handler.ts:
          - Should use packages/api/.specs-fire/standards/tech-stack.md
          - Should reference Express, NOT React
          - Should reference Supertest, NOT Jest
          Return PASS if module-specific tech stack is used.

  # Fallback to root when module standard missing
  - description: "Falls back to root when module standard missing"
    vars:
      project_state: file://fixtures/fire-states/07-monorepo-project/state-summary.md
      workspace: "monorepo"
      editing_file: "packages/api/src/handler.ts"
      module_has_coding_standards: false
    assert:
      - type: llm-rubric
        value: |
          When module lacks coding-standards.md:
          - Should fall back to root .specs-fire/standards/coding-standards.md
          - Should NOT fail or skip coding standards
          Return PASS if fallback resolution works.

  # Root standards used for root-level files
  - description: "Root standards used when editing root-level files"
    vars:
      project_state: file://fixtures/fire-states/07-monorepo-project/state-summary.md
      workspace: "monorepo"
      editing_file: "scripts/deploy.ts"
    assert:
      - type: llm-rubric
        value: |
          When editing root-level files (not in any module):
          - Should use root .specs-fire/standards/ exclusively
          - Should NOT attempt module resolution
          Return PASS if root standards are used.
```

### Brownfield Rules Testing

```yaml
# brownfield-rules-tests.yaml
description: "Brownfield Codebase Rules"

tests:
  - description: "READ existing code before modifying"
    vars:
      workspace_type: "brownfield"
      skill: "run-execute"
      request: "Update the authentication middleware"
    assert:
      - type: llm-rubric
        value: |
          In brownfield projects, Builder MUST:
          1. Read existing authentication code first
          2. Understand current patterns before proposing changes
          3. Reference existing code in the plan
          Return PASS if read-before-modify is followed.

  - description: "MATCH existing naming conventions"
    vars:
      workspace_type: "brownfield"
      existing_pattern: "camelCase function names, PascalCase classes"
    assert:
      - type: llm-rubric
        value: |
          Generated code should:
          - Use camelCase for functions (not snake_case)
          - Use PascalCase for classes
          - Match existing patterns in the codebase
          Return PASS if naming conventions match.

  - description: "PRESERVE existing tests"
    vars:
      workspace_type: "brownfield"
      skill: "run-execute"
    assert:
      - type: llm-rubric
        value: |
          Builder MUST:
          1. Run existing tests before changes
          2. Ensure existing tests still pass after changes
          3. Add new tests, not replace existing ones
          Return PASS if existing tests are preserved.
```

---

## Script-Based State Management Testing

### Unit Tests for Scripts (Vitest)

These complement Promptfoo tests with deterministic script testing.

```typescript
// __tests__/unit/fire/init-run.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initRun } from '../../../src/flows/fire/agents/builder/skills/run-execute/scripts/init-run';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('init-run.js', () => {
  const testDir = path.join(__dirname, 'test-workspace');

  beforeEach(async () => {
    // Setup test fixture
    await fs.copy(
      path.join(__dirname, '../../fixtures/fire-states/04-work-items-decomposed'),
      testDir
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('creates run folder with correct structure', async () => {
    const result = await initRun({
      workspaceDir: testDir,
      workItems: ['WI-001-login-form'],
      scope: 'single'
    });

    expect(result.runId).toMatch(/^RUN-\d{3}$/);
    expect(await fs.pathExists(path.join(testDir, '.specs-fire/runs', result.runId))).toBe(true);
    expect(await fs.pathExists(path.join(testDir, '.specs-fire/runs', result.runId, 'run.md'))).toBe(true);
  });

  it('creates run.md with correct metadata', async () => {
    const result = await initRun({
      workspaceDir: testDir,
      workItems: ['WI-001-login-form', 'WI-002-oauth-integration'],
      scope: 'batch'
    });

    const runMd = await fs.readFile(
      path.join(testDir, '.specs-fire/runs', result.runId, 'run.md'),
      'utf-8'
    );

    expect(runMd).toContain('scope: batch');
    expect(runMd).toContain('WI-001-login-form');
    expect(runMd).toContain('WI-002-oauth-integration');
    expect(runMd).toMatch(/created: \d{4}-\d{2}-\d{2}/);
  });

  it('updates state.yaml with active run', async () => {
    const result = await initRun({
      workspaceDir: testDir,
      workItems: ['WI-001-login-form'],
      scope: 'single'
    });

    const stateYaml = await fs.readFile(
      path.join(testDir, '.specs-fire/state.yaml'),
      'utf-8'
    );

    expect(stateYaml).toContain(result.runId);
    expect(stateYaml).toContain('status: in_progress');
  });
});
```

```typescript
// __tests__/unit/fire/complete-run.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { completeRun } from '../../../src/flows/fire/agents/builder/skills/run-execute/scripts/complete-run';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('complete-run.js', () => {
  const testDir = path.join(__dirname, 'test-workspace');

  beforeEach(async () => {
    await fs.copy(
      path.join(__dirname, '../../fixtures/fire-states/05-run-in-progress'),
      testDir
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('updates state.yaml with completion info', async () => {
    await completeRun({
      workspaceDir: testDir,
      runId: 'RUN-001',
      completedWorkItems: ['WI-001-login-form']
    });

    const stateYaml = await fs.readFile(
      path.join(testDir, '.specs-fire/state.yaml'),
      'utf-8'
    );

    expect(stateYaml).toContain('status: completed');
    expect(stateYaml).toMatch(/completed: \d{4}-\d{2}-\d{2}/);
  });

  it('marks work items as completed', async () => {
    await completeRun({
      workspaceDir: testDir,
      runId: 'RUN-001',
      completedWorkItems: ['WI-001-login-form']
    });

    const stateYaml = await fs.readFile(
      path.join(testDir, '.specs-fire/state.yaml'),
      'utf-8'
    );

    // Work item should be marked completed
    expect(stateYaml).toMatch(/id: WI-001-login-form[\s\S]*?status: completed/);
  });

  it('handles batch completion with multiple work items', async () => {
    await completeRun({
      workspaceDir: testDir,
      runId: 'RUN-001',
      completedWorkItems: ['WI-001-login-form', 'WI-002-oauth-integration']
    });

    const stateYaml = await fs.readFile(
      path.join(testDir, '.specs-fire/state.yaml'),
      'utf-8'
    );

    expect(stateYaml).toMatch(/id: WI-001-login-form[\s\S]*?status: completed/);
    expect(stateYaml).toMatch(/id: WI-002-oauth-integration[\s\S]*?status: completed/);
  });
});
```

### Promptfoo Tests for Script Invocation

```yaml
# script-invocation-tests.yaml
description: "Builder Agent Script Invocation"

tests:
  - description: "Builder uses init-run.js to create runs"
    vars:
      skill: "run-execute"
      action: "start new run"
    assert:
      - type: llm-rubric
        value: |
          Builder MUST:
          1. Invoke init-run.js script to create run
          2. NOT directly write to state.yaml
          3. NOT manually create run.md
          Return PASS if script is used for run creation.

  - description: "Builder uses complete-run.js to finalize"
    vars:
      skill: "run-execute"
      action: "complete run"
    assert:
      - type: llm-rubric
        value: |
          Builder MUST:
          1. Invoke complete-run.js script to finalize
          2. NOT directly edit state.yaml
          3. Pass completed work items to script
          Return PASS if script is used for completion.

  - description: "Builder NEVER directly edits state.yaml"
    vars:
      skill: "run-execute"
    assert:
      - type: not-contains
        value: "edit state.yaml"
      - type: not-contains
        value: "modify state.yaml"
      - type: not-contains
        value: "update state.yaml directly"
```

---

## Complete Example Configuration

### Directory Structure

```text
specsmd/
├── __tests__/
│   ├── evaluation/
│   │   └── fire/                          # FIRE-specific Promptfoo tests
│   │       ├── promptfoo.yaml             # Main config
│   │       ├── providers.yaml             # Model definitions
│   │       │
│   │       ├── agents/                    # Per-agent tests
│   │       │   ├── orchestrator.yaml
│   │       │   ├── planner.yaml
│   │       │   └── builder.yaml
│   │       │
│   │       ├── rubrics/                   # Reusable assertions
│   │       │   ├── checkpoint-enforcement.yaml
│   │       │   ├── standards-resolution.yaml
│   │       │   └── output-quality.yaml
│   │       │
│   │       └── prompts/                   # Agent system prompts
│   │           ├── orchestrator-system.txt
│   │           ├── planner-system.txt
│   │           └── builder-system.txt
│   │
│   ├── golden-datasets/
│   │   └── fire/                          # FIRE golden examples
│   │       ├── orchestrator/
│   │       ├── planner/
│   │       └── builder/
│   │
│   ├── fixtures/
│   │   └── fire-states/                   # FIRE state fixtures
│   │       ├── 01-empty-project/
│   │       ├── 02-initialized-project/
│   │       ├── 03-intent-captured/
│   │       ├── 04-work-items-decomposed/
│   │       ├── 05-run-in-progress/
│   │       ├── 06-run-completed/
│   │       └── 07-monorepo-project/
│   │
│   └── unit/
│       └── fire/                          # Vitest unit tests
│           ├── init-run.test.ts
│           └── complete-run.test.ts
│
└── package.json
```

### Main Configuration

```yaml
# __tests__/evaluation/fire/promptfoo.yaml
description: "FIRE Flow Agent Evaluation Suite"

# Import providers
providers: file://providers.yaml

# Import all agent tests
tests:
  - file://agents/orchestrator.yaml
  - file://agents/planner.yaml
  - file://agents/builder.yaml

# Shared assertions for all tests
defaultTest:
  assert:
    - type: not-contains
      value: "ERROR"
    - type: not-contains
      value: "|---|"
      description: "No ASCII tables"
```

### Provider Configuration

```yaml
# __tests__/evaluation/fire/providers.yaml

# Fast coding model - primary choice for Builder
- id: openrouter:x-ai/grok-4.1-fast:free
  label: grok-fast
  config:
    temperature: 0
    headers:
      HTTP-Referer: https://specs.md

# High-quality reasoning - for Planner tests
- id: openrouter:meta-llama/llama-3.3-70b-instruct:free
  label: llama-70b
  config:
    temperature: 0

# Code specialist - for code review assertions
- id: openrouter:qwen/qwen3-coder:free
  label: qwen-coder
  config:
    temperature: 0

# Fast fallback
- id: openrouter:google/gemma-3-27b-it:free
  label: gemma-fast
  config:
    temperature: 0
```

### Reusable Rubrics

```yaml
# __tests__/evaluation/fire/rubrics/checkpoint-enforcement.yaml

- name: autopilot-no-checkpoints
  assert:
    - type: llm-rubric
      value: "Verify ZERO human checkpoints in autopilot mode execution."
    - type: not-contains
      value: "approve"
    - type: not-contains
      value: "confirm"

- name: confirm-one-checkpoint
  assert:
    - type: llm-rubric
      value: "Verify EXACTLY ONE checkpoint at plan approval in confirm mode."
    - type: contains
      value: "plan"

- name: validate-two-checkpoints
  assert:
    - type: llm-rubric
      value: "Verify EXACTLY TWO checkpoints (design + plan) in validate mode."
```

```yaml
# __tests__/evaluation/fire/rubrics/standards-resolution.yaml

- name: constitution-from-root
  assert:
    - type: llm-rubric
      value: "Constitution must ALWAYS come from root, never module override."

- name: module-override-respected
  assert:
    - type: llm-rubric
      value: "Module-specific standards override root when editing module files."

- name: fallback-to-root
  assert:
    - type: llm-rubric
      value: "Falls back to root standards when module standard is missing."
```

### Package.json Scripts

```json
{
  "scripts": {
    "eval:fire": "cd __tests__/evaluation/fire && promptfoo eval",
    "eval:fire:orchestrator": "cd __tests__/evaluation/fire && promptfoo eval -c agents/orchestrator.yaml",
    "eval:fire:planner": "cd __tests__/evaluation/fire && promptfoo eval -c agents/planner.yaml",
    "eval:fire:builder": "cd __tests__/evaluation/fire && promptfoo eval -c agents/builder.yaml",
    "eval:fire:view": "cd __tests__/evaluation/fire && promptfoo view",
    "eval:fire:ci": "cd __tests__/evaluation/fire && promptfoo eval --ci",
    "test:fire:unit": "vitest run __tests__/unit/fire/",
    "test:fire": "npm run test:fire:unit && npm run eval:fire"
  }
}
```

---

## Quick Start

```bash
# 1. Install promptfoo
npm install -g promptfoo

# 2. Set API key (free!)
export OPENROUTER_API_KEY=sk-or-...

# 3. Run all FIRE tests
npm run eval:fire

# 4. View results
npm run eval:fire:view

# 5. Run specific agent tests
npm run eval:fire:builder

# 6. Run unit tests for scripts
npm run test:fire:unit

# 7. Run full test suite (unit + promptfoo)
npm run test:fire
```

---

## Summary

| Concept | FIRE-Specific Application |
|---------|--------------------------|
| **Golden Dataset** | Input/output pairs for Orchestrator routing, Planner conversations, Builder execution |
| **Fixtures** | 7 states from empty project to completed run, including monorepo variant |
| **Mode Testing** | Autopilot (0), Confirm (1), Validate (2) checkpoint enforcement |
| **Autonomy Bias** | Tests for autonomous/balanced/controlled mode mapping |
| **Standards Resolution** | Hierarchical resolution with constitution never overridden |
| **Script Testing** | Unit tests (Vitest) + invocation tests (Promptfoo) for init-run.js, complete-run.js |

### Key Differences from AI-DLC Testing

| Aspect | AI-DLC | FIRE |
|--------|--------|------|
| Phases | Inception → Construction → Operations | Intent → Work Items → Runs |
| Checkpoints | Phase-based | Mode-based (0/1/2) |
| Agents | 4 (Master, Inception, Construction, Operations) | 3 (Orchestrator, Planner, Builder) |
| State Fixtures | 6 states | 7 states (includes monorepo) |
| Standards | Flat | Hierarchical (monorepo support) |
| State Management | Direct | Script-based (init-run.js, complete-run.js) |

---

*Document created: 2025-01-24*
*Status: Tutorial / Reference*
