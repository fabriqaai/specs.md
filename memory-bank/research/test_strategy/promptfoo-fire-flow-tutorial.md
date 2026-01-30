# Testing FIRE Flow Agents with Promptfoo

A practical guide to testing FIRE (Fast Intent-Run Engineering) flow agents using Promptfoo, including test setup, golden datasets, fixtures, and free model recommendations.

---

## Table of Contents

1. [FIRE Flow Overview](#fire-flow-overview)
2. [Golden Datasets for FIRE](#golden-datasets-for-fire)
3. [Test Fixtures](#test-fixtures)
4. [Testing Each Agent](#testing-each-agent)
5. [Free Model Recommendations](#free-model-recommendations)
6. [Reusable Rubrics](#reusable-rubrics)
7. [Complete Example Configuration](#complete-example-configuration)

---

## FIRE Flow Overview

FIRE (Fast Intent-Run Engineering) is a simplified AI-native development methodology with three agents:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FIRE FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ORCHESTRATOR                                                               │
│   └── Routes based on state.yaml + file system                              │
│   └── Skills: project-init, route, status                                   │
│                                                                              │
│   PLANNER                                                                    │
│   └── Captures intent, decomposes into work items                           │
│   └── Skills: intent-capture, work-item-decompose, design-doc-generate      │
│                                                                              │
│   BUILDER                                                                    │
│   └── Executes work items with mode-appropriate checkpoints                 │
│   └── Skills: run-plan, run-execute, run-status, code-review,               │
│               walkthrough-generate                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Execution Modes

| Mode | Checkpoints | Complexity | Flow |
|------|-------------|-----------|------|
| **Autopilot** | 0 | Low | Plan → Execute → Test → Review → Walkthrough |
| **Confirm** | 1 | Medium | Plan → (CP1) → Execute → Test → Review → Walkthrough |
| **Validate** | 2 | High | Design (CP1) → Plan → (CP2) → Execute → Test → Review → Walkthrough |

---

## Golden Datasets for FIRE

### What to Capture as Golden Examples

For FIRE flow, golden datasets should capture:

| Agent | Golden Outputs | Why |
|-------|----------------|-----|
| **Orchestrator** | Routing decisions, status reports | Ensures consistent state-based routing |
| **Planner** | Intent briefs, work item decompositions | Validates decomposition quality |
| **Builder** | Implementation plans, test reports, walkthroughs | Ensures consistent artifact quality |

### Golden Dataset Structure

```text
__tests__/
├── golden-datasets/
│   ├── orchestrator-agent/
│   │   ├── inputs/
│   │   │   ├── 001-fresh-project-request.txt
│   │   │   ├── 002-continue-planning.txt
│   │   │   └── 003-execute-work-item.txt
│   │   ├── outputs/
│   │   │   ├── 001-fresh-project-route.md
│   │   │   ├── 002-continue-planning-route.md
│   │   │   └── 003-execute-work-item-route.md
│   │   └── context/
│   │       ├── 001-empty-project/
│   │       ├── 002-intent-started/
│   │       └── 003-work-items-ready/
│   │
│   ├── planner-agent/
│   │   ├── inputs/
│   │   │   ├── 001-simple-feature-request.txt
│   │   │   ├── 002-complex-feature-request.txt
│   │   │   └── 003-security-critical-request.txt
│   │   ├── outputs/
│   │   │   ├── 001-simple-intent-brief.md
│   │   │   ├── 002-complex-work-items.md
│   │   │   └── 003-security-design-doc.md
│   │   └── context/
│   │       ├── 001-initialized-project/
│   │       └── 002-intent-created/
│   │
│   └── builder-agent/
│       ├── inputs/
│       │   ├── 001-autopilot-run-request.txt
│       │   ├── 002-confirm-run-request.txt
│       │   └── 003-batch-run-request.txt
│       ├── outputs/
│       │   ├── 001-autopilot-plan.md
│       │   ├── 002-confirm-plan.md
│       │   └── 003-batch-plan.md
│       └── context/
│           ├── 001-single-work-item/
│           ├── 002-medium-work-item/
│           └── 003-multiple-work-items/
```

### Building Golden Examples

**Step 1**: Run the agent with a representative input

```bash
# Capture planner output
promptfoo eval -c planner-capture.yaml --output captured/
```

**Step 2**: Human review checklist

For **Intent Briefs**:
- [ ] Problem statement is specific?
- [ ] Success criteria are measurable?
- [ ] Constraints are clearly stated?

For **Work Item Decomposition**:
- [ ] Items are vertical slices?
- [ ] Complexity ratings match content?
- [ ] Dependencies are logical?

For **Implementation Plans**:
- [ ] Steps are actionable?
- [ ] Tests are specified?
- [ ] Follows project standards?

**Step 3**: Promote to golden

```bash
cp captured/output.md __tests__/golden-datasets/planner-agent/outputs/001-simple-intent.md
```

---

## Test Fixtures

### Project State Fixtures

FIRE agents rely heavily on project state. Here are the required fixtures:

```text
__tests__/
└── fixtures/
    └── fire-states/
        │
        ├── 01-empty-workspace/                 # Before project-init
        │   └── (empty or minimal files)
        │
        ├── 02-initialized-project/             # After project-init
        │   └── .specs-fire/
        │       ├── state.yaml                  # Project metadata
        │       └── standards/
        │           ├── constitution.md
        │           ├── tech-stack.md
        │           ├── coding-standards.md
        │           └── testing-standards.md
        │
        ├── 03-intent-captured/                 # Intent created, no work items
        │   └── .specs-fire/
        │       ├── state.yaml
        │       ├── standards/
        │       └── intents/
        │           └── intent-001-user-auth/
        │               └── brief.md
        │
        ├── 04-work-items-ready/                # Work items decomposed
        │   └── .specs-fire/
        │       ├── state.yaml                  # includes work_items array
        │       ├── standards/
        │       └── intents/
        │           └── intent-001-user-auth/
        │               ├── brief.md
        │               └── work-items/
        │                   ├── wi-001-setup-auth.md      # low complexity
        │                   ├── wi-002-login-flow.md      # medium complexity
        │                   └── wi-003-mfa-integration.md # high complexity
        │
        ├── 05-validate-mode-ready/             # High-complexity with design doc
        │   └── .specs-fire/
        │       ├── state.yaml
        │       ├── standards/
        │       └── intents/
        │           └── intent-001-user-auth/
        │               ├── brief.md
        │               └── work-items/
        │                   ├── wi-003-mfa-integration.md
        │                   └── wi-003-mfa-integration-design.md  # CP1 passed
        │
        ├── 06-run-in-progress/                 # Active run
        │   └── .specs-fire/
        │       ├── state.yaml                  # runs.active has entry
        │       ├── standards/
        │       ├── intents/
        │       └── runs/
        │           └── run-001/
        │               ├── run.md              # From init-run.cjs
        │               └── plan.md             # Implementation plan
        │
        ├── 07-run-completed/                   # Full artifacts
        │   └── .specs-fire/
        │       ├── state.yaml
        │       ├── standards/
        │       ├── intents/
        │       └── runs/
        │           └── run-001/
        │               ├── run.md
        │               ├── plan.md
        │               ├── test-report.md
        │               ├── review-report.md
        │               └── walkthrough.md
        │
        └── 08-batch-run-in-progress/           # Multi-item run
            └── .specs-fire/
                ├── state.yaml
                ├── standards/
                ├── intents/
                └── runs/
                    └── run-002/
                        ├── run.md              # scope: batch, multiple items
                        └── plan.md             # Current item plan
```

### State.yaml Examples

**02-initialized-project/state.yaml**:
```yaml
project:
  name: my-project
  fire_version: "1.0"
  created: "2025-01-28T10:00:00Z"

workspace:
  type: greenfield
  structure: monolith
  autonomy_bias: balanced

intents: []
runs:
  active: []
  completed: []
```

**04-work-items-ready/state.yaml**:
```yaml
project:
  name: my-project
  fire_version: "1.0"
  created: "2025-01-28T10:00:00Z"

workspace:
  type: greenfield
  structure: monolith
  autonomy_bias: balanced
  run_scope_preference: null
  run_scope_history: []

intents:
  - id: intent-001-user-auth
    title: User Authentication
    status: in_progress
    work_items:
      - id: wi-001-setup-auth
        title: Setup Auth Infrastructure
        status: pending
        complexity: low
        mode: autopilot
      - id: wi-002-login-flow
        title: Login Flow Implementation
        status: pending
        complexity: medium
        mode: confirm
        depends_on: [wi-001-setup-auth]
      - id: wi-003-mfa-integration
        title: MFA Integration
        status: pending
        complexity: high
        mode: validate
        depends_on: [wi-002-login-flow]

runs:
  active: []
  completed: []
```

**06-run-in-progress/state.yaml**:
```yaml
project:
  name: my-project
  fire_version: "1.0"
  created: "2025-01-28T10:00:00Z"

workspace:
  type: greenfield
  structure: monolith
  autonomy_bias: balanced
  run_scope_preference: single
  run_scope_history: [single]

intents:
  - id: intent-001-user-auth
    title: User Authentication
    status: in_progress
    work_items:
      - id: wi-001-setup-auth
        title: Setup Auth Infrastructure
        status: in_progress
        complexity: low
        mode: autopilot

runs:
  active:
    - id: run-001
      intent_id: intent-001-user-auth
      work_items: [wi-001-setup-auth]
      scope: single
      current_item: wi-001-setup-auth
      current_phase: execute
      started: "2025-01-28T11:00:00Z"
  completed: []
```

---

## Testing Each Agent

### Testing Orchestrator Agent

**State Required**: Varies - tests routing decisions

```yaml
# orchestrator-agent-tests.yaml
description: "FIRE Orchestrator Routing Tests"

prompts:
  - file://prompts/orchestrator-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

defaultTest:
  assert:
    - type: not-contains
      value: "ERROR"

tests:
  # Route to project-init when fresh project
  - description: "Routes to project-init for fresh workspace"
    vars:
      state_yaml: null  # No state.yaml exists
      file_system_scan: "No .specs-fire/ directory found"
      request: "I want to start a new project"
    assert:
      - type: contains
        value: "project-init"
      - type: llm-rubric
        value: "Does the agent correctly identify this as a fresh project needing initialization?"

  # Route to Planner when no intents
  - description: "Routes to Planner when no intents exist"
    vars:
      state_yaml: file://fixtures/fire-states/02-initialized-project/.specs-fire/state.yaml
      file_system_scan: "No intents/ directory or empty"
      request: "I want to build a new feature"
    assert:
      - type: contains
        value: "Planner"
      - type: contains
        value: "intent"

  # Route to Builder when work items ready
  - description: "Routes to Builder when work items exist"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      file_system_scan: "Found 3 work items in intent-001-user-auth"
      request: "Let's start building"
    assert:
      - type: contains
        value: "Builder"
      - type: contains
        value: "run"

  # Resume active run
  - description: "Resumes active run"
    vars:
      state_yaml: file://fixtures/fire-states/06-run-in-progress/.specs-fire/state.yaml
      request: "Continue working"
    assert:
      - type: contains
        value: "run-001"
      - type: llm-rubric
        value: "Does the agent correctly identify and offer to resume the active run?"

  # Status command shows integrity
  - description: "Status skill validates integrity"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "status"
    assert:
      - type: contains
        value: "Intent"
      - type: contains
        value: "work item"
      - type: llm-rubric
        value: |
          Check that status output includes:
          1. Project name
          2. Intent status
          3. Work item counts
          4. Next suggested action
          Return PASS if comprehensive status shown.
```

### Testing Planner Agent

**State Required**: Initialized project

```yaml
# planner-agent-tests.yaml
description: "FIRE Planner Agent Tests"

prompts:
  - file://prompts/planner-system.txt

providers:
  - openrouter:meta-llama/llama-3.3-70b-instruct:free

tests:
  # Intent Capture
  - description: "Captures intent through guided dialogue"
    vars:
      state_yaml: file://fixtures/fire-states/02-initialized-project/.specs-fire/state.yaml
      skill: "intent-capture"
      request: "I want to add user authentication with OAuth"
    assert:
      # Asks clarifying questions (HIGH degrees of freedom)
      - type: llm-rubric
        value: |
          The agent should ask clarifying questions to fully understand intent.
          Check for questions about:
          - Target users
          - OAuth providers needed
          - Security requirements
          - Integration constraints
          Return PASS if agent elicits context first.

  - description: "Generates well-structured intent brief"
    vars:
      state_yaml: file://fixtures/fire-states/02-initialized-project/.specs-fire/state.yaml
      skill: "intent-capture"
      request: |
        Create intent for user auth with OAuth.
        Context: B2B SaaS, Google/GitHub OAuth, need MFA for admin users.
    assert:
      # Structure checks
      - type: contains
        value: "## Goal"
      - type: contains
        value: "## Success Criteria"
      - type: contains
        value: "## Constraints"
      # Quality checks
      - type: llm-rubric
        value: |
          Evaluate the intent brief:
          1. Is the goal specific and actionable?
          2. Are success criteria measurable?
          3. Are constraints reasonable?
          Return PASS if brief is high quality.

  # Work Item Decomposition
  - description: "Decomposes into vertical slices"
    vars:
      state_yaml: file://fixtures/fire-states/03-intent-captured/.specs-fire/state.yaml
      skill: "work-item-decompose"
      intent_id: "intent-001-user-auth"
    assert:
      # Check for vertical slices
      - type: llm-rubric
        value: |
          Check that work items are vertical slices (not horizontal layers).
          GOOD: "Implement Google OAuth login" (full feature)
          BAD: "Create auth database tables" (horizontal layer)
          Return PASS if items are vertical slices.
      # Check complexity ratings
      - type: llm-rubric
        value: |
          Verify complexity ratings match content:
          - Low: Simple, well-understood, minimal risk
          - Medium: Some complexity, standard patterns
          - High: Complex, security-critical, new patterns
          Return PASS if ratings are appropriate.
      # Check dependencies
      - type: llm-rubric
        value: |
          Check dependencies are logical:
          - No circular dependencies
          - Dependencies flow naturally
          - Optional dependencies are marked
          Return PASS if dependency graph is valid.

  # Autonomy Bias Application
  - description: "Applies autonomy bias to mode selection"
    vars:
      state_yaml: |
        workspace:
          autonomy_bias: autonomous
        # Other fields...
      skill: "work-item-decompose"
      complexity: "medium"
    assert:
      - type: llm-rubric
        value: |
          With autonomy_bias=autonomous:
          - Low complexity → autopilot
          - Medium complexity → autopilot (biased up)
          - High complexity → confirm (biased up from validate)
          Check that mode matches bias. Return PASS if correct.

  - description: "Controlled bias uses more checkpoints"
    vars:
      state_yaml: |
        workspace:
          autonomy_bias: controlled
      skill: "work-item-decompose"
      complexity: "medium"
    assert:
      - type: llm-rubric
        value: |
          With autonomy_bias=controlled:
          - Low complexity → confirm (biased down from autopilot)
          - Medium complexity → validate (biased down)
          - High complexity → validate
          Check that mode matches bias. Return PASS if correct.

  # Design Doc Generation
  - description: "Generates design doc for validate mode"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "design-doc-generate"
      work_item_id: "wi-003-mfa-integration"
    assert:
      - type: contains
        value: "## Domain Model"
      - type: contains
        value: "## Technical Approach"
      - type: contains
        value: "## Risks"
      - type: llm-rubric
        value: |
          Design doc should include:
          1. Key decisions with rationale
          2. Domain model (entities, value objects)
          3. Risk mitigations
          4. Implementation checklist
          Return PASS if comprehensive.
```

### Testing Builder Agent

**State Required**: Work items ready for execution

```yaml
# builder-agent-tests.yaml
description: "FIRE Builder Agent Tests"

prompts:
  - file://prompts/builder-system.txt

providers:
  # Use coding-focused model
  - openrouter:x-ai/grok-4.1-fast:free

tests:
  # Run Plan Skill
  - description: "run-plan discovers work items from file system"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      file_system_scan: |
        Found:
        - intents/intent-001-user-auth/work-items/wi-001-setup-auth.md
        - intents/intent-001-user-auth/work-items/wi-002-login-flow.md
        - intents/intent-001-user-auth/work-items/wi-003-mfa-integration.md
      skill: "run-plan"
    assert:
      # Must offer scope options
      - type: contains
        value: "single"
      - type: contains
        value: "batch"
      - type: contains
        value: "wide"
      - type: llm-rubric
        value: |
          Check that run-plan:
          1. Reconciles state.yaml with file system
          2. Presents three scope options with explanations
          3. Groups items correctly for batch scope
          4. Shows dependency order
          Return PASS if all scope options presented correctly.

  # Run Execute - Autopilot Mode
  - description: "Autopilot executes without checkpoints"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "run-execute"
      work_item_id: "wi-001-setup-auth"
      mode: "autopilot"
    assert:
      # Must create plan.md first
      - type: llm-rubric
        value: |
          Even in autopilot mode, agent MUST:
          1. Create plan.md BEFORE implementation
          2. Execute implementation
          3. Run tests
          4. Create test-report.md
          5. Invoke code-review
          Return PASS if plan.md created first.
      # No checkpoint prompts
      - type: not-contains
        value: "Checkpoint"
      - type: not-contains
        value: "approval required"

  # Run Execute - Confirm Mode
  - description: "Confirm mode stops at checkpoint 1"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "run-execute"
      work_item_id: "wi-002-login-flow"
      mode: "confirm"
    assert:
      # Creates plan then stops
      - type: contains
        value: "plan.md"
      - type: llm-rubric
        value: |
          Confirm mode (1 checkpoint):
          1. Creates plan.md
          2. STOPS and presents plan for review
          3. Waits for user approval
          4. Does NOT auto-continue to implementation
          Return PASS if checkpoint enforced.
      # Shows approval prompt
      - type: contains
        value: "proceed"

  # Run Execute - Validate Mode
  - description: "Validate mode requires design doc approval"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "run-execute"
      work_item_id: "wi-003-mfa-integration"
      mode: "validate"
    assert:
      - type: llm-rubric
        value: |
          Validate mode (2 checkpoints):
          1. CP1: Design doc must be approved first
          2. CP2: Plan must be approved before implementation
          Check that agent:
          - References design doc
          - Verifies CP1 passed
          - Creates plan
          - Waits at CP2
          Return PASS if both checkpoints exist.

  # Batch Run Execution
  - description: "Batch run loops through items"
    vars:
      state_yaml: file://fixtures/fire-states/04-work-items-ready/.specs-fire/state.yaml
      skill: "run-execute"
      scope: "batch"
      items: ["wi-001-setup-auth", "wi-002-login-flow"]  # Same mode group
    assert:
      - type: llm-rubric
        value: |
          Batch run should:
          1. Execute items sequentially (respecting dependencies)
          2. Complete one item fully before starting next
          3. Use complete-item to mark progress
          4. Continue to next item automatically
          Return PASS if batch looping works correctly.

  # Artifact Creation Order
  - description: "Creates artifacts in correct order"
    vars:
      state_yaml: file://fixtures/fire-states/06-run-in-progress/.specs-fire/state.yaml
      skill: "run-execute"
      work_item_id: "wi-001-setup-auth"
      mode: "autopilot"
    assert:
      - type: llm-rubric
        value: |
          Artifact creation order MUST be:
          1. plan.md (BEFORE implementation)
          2. Implementation (code files)
          3. test-report.md (AFTER tests pass)
          4. review-report.md (from code-review skill)
          5. walkthrough.md (final documentation)
          Check that order is correct. Return PASS if order followed.

  # Code Review Skill
  - description: "Code review is conservative"
    vars:
      state_yaml: file://fixtures/fire-states/06-run-in-progress/.specs-fire/state.yaml
      skill: "code-review"
      run_id: "run-001"
    assert:
      - type: llm-rubric
        provider: openrouter:qwen/qwen3-coder:free
        value: |
          Code review should be CONSERVATIVE:
          1. Only auto-fix mechanical issues (formatting, unused imports)
          2. Present semantic suggestions for user approval
          3. Run linters if available
          4. Re-run tests after fixes
          5. NEVER break working code
          Return PASS if conservative approach followed.

  # Walkthrough Generation
  - description: "Generates comprehensive walkthrough"
    vars:
      state_yaml: file://fixtures/fire-states/07-run-completed/.specs-fire/state.yaml
      skill: "walkthrough-generate"
      run_id: "run-001"
    assert:
      - type: contains
        value: "## Structure Overview"
      - type: contains
        value: "## Domain Model"
      - type: contains
        value: "## Key Implementation Details"
      - type: llm-rubric
        value: |
          Walkthrough should include:
          1. High-level structure (no code dumps)
          2. Architecture pattern if multi-component
          3. Domain model documentation
          4. Deviations from plan with explanations
          5. Developer notes and gotchas
          6. Verification steps
          7. "Ready for Review" checklist
          Return PASS if comprehensive.
```

---

## Free Model Recommendations

### For FIRE Flow Testing

| Model | Best For | Speed | Context |
|-------|----------|-------|---------|
| `x-ai/grok-4.1-fast:free` | Builder (coding), routing | Very Fast | 2M |
| `meta-llama/llama-3.3-70b-instruct:free` | Planner (reasoning), quality eval | Medium | 128k |
| `qwen/qwen3-coder:free` | Code review assertions | Fast | 256k |
| `google/gemma-3-27b-it:free` | Fast format validation | Fast | 128k |

### Provider Configuration

```yaml
# __tests__/evaluation/fire/providers.yaml

# PRIMARY: For most tests (fast, free, good at code)
- id: openrouter:x-ai/grok-4.1-fast:free
  label: grok-fast
  config:
    temperature: 0
    headers:
      HTTP-Referer: https://specs.md

# REASONING: For complex planning/decomposition tests
- id: openrouter:meta-llama/llama-3.3-70b-instruct:free
  label: llama-70b
  config:
    temperature: 0

# CODE REVIEW: For code quality assertions
- id: openrouter:qwen/qwen3-coder:free
  label: qwen-coder
  config:
    temperature: 0

# FAST JUDGE: For simple format checks
- id: openrouter:google/gemma-3-27b-it:free
  label: gemma-fast
  config:
    temperature: 0
```

### Model Selection by Test Type

```yaml
# Use appropriate model for each test type
tests:
  # Routing tests - use fast model
  - description: "Route to correct agent"
    providers: [grok-fast]

  # Intent quality - use reasoning model
  - description: "Intent brief quality"
    providers: [llama-70b]

  # Code generation - use coding model
  - description: "Code follows standards"
    providers: [qwen-coder]

  # Format validation - use fast model
  - description: "Has required sections"
    providers: [gemma-fast]
```

---

## Reusable Rubrics

### Output Formatting

```yaml
# __tests__/evaluation/fire/rubrics/output-formatting.yaml

- name: fire-artifact-structure
  assert:
    # No ASCII tables (FIRE rule)
    - type: not-contains
      value: "|---|"
    - type: not-contains
      value: "+---+"
    # Has status indicators
    - type: javascript
      value: |
        const indicators = ['✅', '⏳', '[ ]', '🚫', '→'];
        return indicators.some(i => output.includes(i)) || output.length < 100;

- name: numbered-options
  assert:
    - type: llm-rubric
      provider: openrouter:google/gemma-3-27b-it:free
      value: "Are options presented as numbered lists (1., 2., 3.) not tables?"
```

### Checkpoint Enforcement

```yaml
# __tests__/evaluation/fire/rubrics/checkpoints.yaml

- name: autopilot-no-checkpoints
  assert:
    - type: not-contains
      value: "Checkpoint"
    - type: not-contains
      value: "awaiting approval"
    - type: not-contains
      value: "Please confirm"

- name: confirm-one-checkpoint
  assert:
    - type: llm-rubric
      value: |
        Confirm mode has exactly 1 checkpoint:
        - Creates plan.md
        - Stops and waits for approval
        - Shows plan for review
        Return PASS if exactly 1 checkpoint.

- name: validate-two-checkpoints
  assert:
    - type: llm-rubric
      value: |
        Validate mode has 2 checkpoints:
        - CP1: Design doc approval
        - CP2: Plan approval
        Return PASS if 2 checkpoints present.
```

### Artifact Ordering

```yaml
# __tests__/evaluation/fire/rubrics/artifact-order.yaml

- name: plan-before-implementation
  assert:
    - type: llm-rubric
      value: |
        CRITICAL: plan.md must be created BEFORE any implementation.
        Check that:
        1. Agent mentions creating plan.md
        2. Plan creation happens before code changes
        3. Plan is not skipped in any mode
        Return PASS if plan comes first.

- name: test-report-after-tests
  assert:
    - type: llm-rubric
      value: |
        test-report.md must be created AFTER tests pass.
        Check that:
        1. Tests are run first
        2. Test results are captured
        3. Report is created with actual results
        Return PASS if order is correct.
```

### File System Awareness

```yaml
# __tests__/evaluation/fire/rubrics/file-system.yaml

- name: reconciles-with-filesystem
  assert:
    - type: llm-rubric
      value: |
        Agent MUST scan file system (disk is source of truth):
        1. Glob for intents: .specs-fire/intents/**/brief.md
        2. Glob for work items: .specs-fire/intents/**/work-items/*.md
        3. Reconcile with state.yaml
        4. Report discrepancies
        Return PASS if file system is scanned.

- name: detects-orphaned-artifacts
  assert:
    - type: llm-rubric
      value: |
        Agent should detect orphaned artifacts:
        - On disk but not in state.yaml
        - In state.yaml but not on disk
        Return PASS if discrepancies reported.
```

---

## Complete Example Configuration

### Directory Structure

```text
specsmd/
├── __tests__/
│   ├── evaluation/
│   │   └── fire/
│   │       ├── promptfoo.yaml              # Main config
│   │       ├── providers.yaml              # Model definitions
│   │       │
│   │       ├── agents/                     # Per-agent tests
│   │       │   ├── orchestrator-agent.yaml
│   │       │   ├── planner-agent.yaml
│   │       │   └── builder-agent.yaml
│   │       │
│   │       ├── rubrics/                    # Reusable assertions
│   │       │   ├── output-formatting.yaml
│   │       │   ├── checkpoints.yaml
│   │       │   ├── artifact-order.yaml
│   │       │   └── file-system.yaml
│   │       │
│   │       └── prompts/                    # Agent system prompts
│   │           ├── orchestrator-system.txt
│   │           ├── planner-system.txt
│   │           └── builder-system.txt
│   │
│   ├── golden-datasets/
│   │   └── fire/
│   │       ├── orchestrator-agent/
│   │       ├── planner-agent/
│   │       └── builder-agent/
│   │
│   └── fixtures/
│       └── fire-states/
│           ├── 01-empty-workspace/
│           ├── 02-initialized-project/
│           ├── 03-intent-captured/
│           ├── 04-work-items-ready/
│           ├── 05-validate-mode-ready/
│           ├── 06-run-in-progress/
│           ├── 07-run-completed/
│           └── 08-batch-run-in-progress/
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
  - file://agents/orchestrator-agent.yaml
  - file://agents/planner-agent.yaml
  - file://agents/builder-agent.yaml

# Shared assertions for all FIRE tests
defaultTest:
  assert:
    # FIRE formatting rules
    - type: not-contains
      value: "|---|"
      description: "No ASCII tables"
    # Must not auto-proceed without approval
    - type: not-contains
      value: "Proceeding automatically"
    # Should have suggested next step
    - type: javascript
      value: |
        // Short outputs exempt, longer ones should have next step
        return output.length < 200 ||
               output.includes('→') ||
               output.includes('Next') ||
               output.includes('Suggested');
```

### Package.json Scripts

```json
{
  "scripts": {
    "eval:fire": "cd __tests__/evaluation/fire && promptfoo eval",
    "eval:fire:orchestrator": "cd __tests__/evaluation/fire && promptfoo eval -c agents/orchestrator-agent.yaml",
    "eval:fire:planner": "cd __tests__/evaluation/fire && promptfoo eval -c agents/planner-agent.yaml",
    "eval:fire:builder": "cd __tests__/evaluation/fire && promptfoo eval -c agents/builder-agent.yaml",
    "eval:fire:view": "cd __tests__/evaluation/fire && promptfoo view",
    "eval:fire:ci": "cd __tests__/evaluation/fire && promptfoo eval --ci",
    "eval:fire:baseline": "cd __tests__/evaluation/fire && promptfoo eval --output baseline.json"
  }
}
```

---

## Key Behaviors to Test

| Category | Tests | Priority |
|----------|-------|----------|
| **Routing** | State-based routing, active run detection | High |
| **File System** | Glob patterns, reconciliation, orphan detection | High |
| **Checkpoints** | Mode-appropriate checkpoint enforcement | Critical |
| **Artifact Order** | plan.md first, test-report after tests | Critical |
| **Autonomy Bias** | Complexity-to-mode mapping | Medium |
| **Batch Runs** | Sequential execution, looping, dependencies | Medium |
| **Code Review** | Conservative fixes, no breaking changes | High |
| **Standards** | Monorepo inheritance, constitution always included | Medium |

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

# 5. Run specific agent
npm run eval:fire:builder
```

---

*Document created: 2025-01-28*
*Status: Tutorial / Reference*
*Related: promptfoo-tutorial.md, promptfoo-specsmd-tutorial.md*
