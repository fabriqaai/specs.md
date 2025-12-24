# Bolt Type: Simple Construction

## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)

## Success Metrics

- ✅ Activities presented as numbered lists (not tables)
- ✅ Stage progress shown with status indicators
- ✅ Human checkpoints clearly marked

## Failure Modes

- ❌ Using ASCII table for activities
- ❌ Auto-advancing without human confirmation
- ❌ Skipping stages

---

## ⛔ CRITICAL: Stage Execution Sequence

**Stages MUST be executed in this exact order:**

```text
Stage 1: Spec → Stage 2: Implement → Stage 3: Test
```

**Stage Overview:**

- ✅/[ ] **1. Spec** (Required) → `spec.md`
- ✅/[ ] **2. Implement** (Required) → Source code
- ✅/[ ] **3. Test** (Required) → Tests + `test-report.md`

**Rules**:

- Each stage MUST be completed before the next begins
- **⛔ Human validation is MANDATORY at each stage checkpoint - STOP and WAIT for approval**
- NEVER auto-advance to next stage without explicit user confirmation

---

## Metadata

```yaml
bolt_type: simple-construction-bolt
name: Simple Construction Bolt
description: Lightweight construction for UI, integrations, utilities, and non-DDD work
version: 1.0.0
suitable_for:
  - Frontend pages and components
  - Simple backend endpoints
  - Integrations with external APIs
  - Utilities and helper modules
  - Scripts and automation
  - CLI commands
stages_count: 3
```

---

## Overview

This bolt type provides a lightweight construction process for work that doesn't need full domain modeling. It's ideal for UI work, integrations, utilities, and any code where the design is straightforward.

**Best For**:

- Frontend pages, components, layouts
- Simple CRUD endpoints without complex business logic
- Third-party API integrations
- Utility functions and helpers
- CLI commands and scripts
- Configuration and setup tasks

**NOT For** (use `ddd-construction-bolt` instead):

- Complex domain logic with business rules
- Systems requiring bounded contexts
- Services with rich domain models

---

## Stages

### Stage 1: Spec

**Objective**: Define what to build with clear requirements

**Duration**: Minutes to hours (typically 15-60 minutes)

**Activities**:

1 - **Review stories**: Understand what needs to be built
2 - **Define scope**: List specific deliverables
3 - **Identify dependencies**: External APIs, other units, libraries
4 - **Define acceptance criteria**: How will we know it's done?
5 - **Note technical approach**: High-level implementation notes

**Artifact**: `spec.md`
**Location**: `memory-bank/bolts/{bolt-id}/spec.md`

**Template Structure**:

```markdown
---
stage: spec
bolt: {bolt-id}
created: {timestamp}
---

## Spec: {unit-name}

### Objective
{What this bolt will accomplish}

### Deliverables
- {Deliverable 1}
- {Deliverable 2}

### Dependencies
- {Dependency 1}: {why needed}

### Technical Approach
{Brief notes on how to implement}

### Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
```

**Completion Criteria**:

- [ ] Stories reviewed and understood
- [ ] Deliverables clearly defined
- [ ] Dependencies identified
- [ ] Acceptance criteria documented

**⛔ HUMAN Checkpoint**: Present spec summary and **STOP**. Wait for user to confirm before proceeding to Stage 2.

---

### Stage 2: Implement

**Objective**: Write the code

**Duration**: Hours (varies by complexity)

**Activities**:

1 - **Setup structure**: Create files and folders
2 - **Implement core functionality**: Build the main features
3 - **Handle edge cases**: Error handling, validation
4 - **Add documentation**: Code comments, JSDoc/docstrings
5 - **Run linting**: Ensure code style compliance

**Artifact**: Source code
**Location**: As defined in project structure (e.g., `src/`, `app/`, `pages/`)

**Completion Criteria**:

- [ ] All deliverables from spec implemented
- [ ] Code follows project coding standards
- [ ] Linting passes
- [ ] Code is documented

**⛔ HUMAN Checkpoint**: Present implementation summary and **STOP**. Wait for user to confirm before proceeding to Stage 3.

---

### Stage 3: Test

**Objective**: Verify the implementation works correctly

**Duration**: Minutes to hours (typically 30-120 minutes)

**Activities**:

1 - **Write unit tests**: Test individual functions/components
2 - **Write integration tests**: Test API endpoints or component interactions
3 - **Run test suite**: Execute all tests
4 - **Verify acceptance criteria**: Check against spec
5 - **Document results**: Create test report

**Artifact**: `test-report.md`
**Location**: `memory-bank/bolts/{bolt-id}/test-report.md`

**Template Structure**:

```markdown
---
stage: test
bolt: {bolt-id}
created: {timestamp}
---

## Test Report: {unit-name}

### Summary

- **Tests**: {passed}/{total} passed
- **Coverage**: {percentage}%

### Acceptance Criteria Validation

- ✅/❌ **{Criterion}**: {Status}

### Issues Found
{Any issues discovered during testing}

### Notes
{Additional observations}
```

**Completion Criteria**:

- [ ] All tests passing
- [ ] Acceptance criteria verified
- [ ] Test report created

**⛔ HUMAN Checkpoint**: Present test report and **STOP**. Wait for user to confirm bolt completion.

---

## State Tracking

Bolt instance tracks progress:

```yaml
---
current_stage: implement
stages_completed:
  - name: spec
    completed: 2024-12-05T10:00:00Z
    artifact: spec.md
status: in-progress
---
```

---

## Bolt Context Loading

For Stage 2 (Implement) and Stage 3 (Test), load all artifacts from the bolt folder:

**Location**: `memory-bank/bolts/{bolt-id}/`

**Load all files in this folder**, which may include:

- `bolt.md` - Bolt instance metadata
- `spec.md` - Spec from Stage 1

This ensures implementation and test stages have context from the spec.

---

## Usage by Construction Agent

1. **Load bolt instance** from path defined by `schema.bolts`
2. **Read `bolt_type` field** (e.g., `simple-construction-bolt`)
3. **Load this definition** from `.specsmd/aidlc/templates/construction/bolt-types/`
4. **Check `current_stage`** in bolt instance
5. **Load bolt folder artifacts** if stage requires previous context
6. **Execute stage** following activities defined here
7. **Create artifacts** as specified
8. **⛔ STOP and present completion summary** - DO NOT continue automatically
9. **Wait for user confirmation** - user must explicitly approve
10. **Only after approval**: Update bolt state and advance to next stage

**⛔ CRITICAL**: Steps 8-9 are MANDATORY. Never skip the human checkpoint. Never auto-advance.

The Construction Agent is **bolt-type agnostic** - it reads stages from this file and executes them.
