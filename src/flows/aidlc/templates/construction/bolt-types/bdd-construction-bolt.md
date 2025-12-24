# Bolt Type: BDD Construction

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

## Metadata

```yaml
bolt_type: bdd-construction-bolt
name: BDD Construction Bolt
description: Behavior-Driven Development with specification, implementation, and testing
version: 1.0.0
suitable_for:
  - Feature-focused development
  - User story implementation
  - Scenarios with clear Given-When-Then flows
stages_count: 3
```

---

## Overview

This bolt type implements Behavior-Driven Development (BDD) methodology through three stages focused on specifications, implementation, and acceptance testing.

**Best For**:

- Feature-driven development
- User-facing functionality
- Clear user stories with acceptance criteria
- Scenarios that can be expressed in Given-When-Then format

---

## Stages

### Stage 1: specify

**Objective**: Define behavior specifications in Gherkin format

**Duration**: Hours (typically 1-2 hours)

**Activities**:

1 - **Review user stories**: Analyze stories and acceptance criteria
2 - **Write feature files**: Create Gherkin specifications
3 - **Define happy paths**: Document expected successful flows
4 - **Define edge cases**: Document boundary conditions
5 - **Define error scenarios**: Document error handling behaviors
6 - **Review with stakeholders**: Validate specifications

**Artifact**: `specifications.md` and `.feature` files
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/specifications.md`)*

**Template Structure**:

```markdown
---
stage: specify
bolt: {bolt-id}
created: {timestamp}
---

## Behavior Specifications: {unit-name}

### Feature Overview
{Feature description}

### Scenarios

#### Scenario 1: {Happy Path}
​```gherkin
Given {precondition}
When {action}
Then {expected outcome}
​```

#### Scenario 2: {Edge Case}

​```gherkin
Given {precondition}
When {action}
Then {expected outcome}
​```

### Background

{Shared context for all scenarios}

### Data Examples

- **{Field}**: Valid: {examples} - Invalid: {examples}

```

**Completion Criteria**:

- [ ] All user stories have scenarios
- [ ] Happy paths covered
- [ ] Edge cases covered
- [ ] Error handling scenarios defined
- [ ] Scenarios reviewed and approved

**⛔ HUMAN Checkpoint**: Present specification summary and **STOP**. Wait for user to confirm before proceeding to Stage 2.

---

### Stage 2: implement

**Objective**: Implement the specified behaviors

**Duration**: Hours to days (varies by complexity)

**Activities**:

1 - **Setup step definitions**: Create test framework structure
2 - **Implement Given steps**: Build context setup code
3 - **Implement When steps**: Build action code
4 - **Implement Then steps**: Build assertion code
5 - **Implement production code**: Build feature implementation
6 - **Wire specs to implementation**: Connect tests to code

**Artifact**: Source code
**Location**: `src/{unit}/`

**Project Structure**:

```text

src/{unit}/
├── features/
│   └── *.feature          # Gherkin specs
├── steps/
│   └──*_steps.{ext}      # Step definitions
├── src/
│   └── ...                # Production code
└── support/
    └── ...                # Test utilities

```

**Completion Criteria**:

- [ ] All step definitions implemented
- [ ] Production code implements features
- [ ] All scenarios executable
- [ ] Code follows standards

**⛔ HUMAN Checkpoint**: Present implementation summary and **STOP**. Wait for user to confirm before proceeding to Stage 3.

---

### Stage 3: validate

**Objective**: Run acceptance tests and verify behaviors

**Duration**: Hours (typically 1-2 hours)

**Activities**:

1 - **Run all feature tests**: Execute test suite
2 - **Fix any failing scenarios**: Address issues
3 - **Generate living documentation**: Create doc report
4 - **Verify acceptance criteria**: Validate against stories
5 - **Stakeholder sign-off**: Get approval

**Artifact**: `acceptance-report.md`
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/acceptance-report.md`)*

**Template Structure**:

```markdown
---
stage: validate
bolt: {bolt-id}
created: {timestamp}
---

## Acceptance Report: {unit-name}

### Test Results

- **{Feature}**: {scenarios} scenarios - {passed} passed, {failed} failed

### Acceptance Criteria Status

- ✅/❌ **{Story}**: {Criteria} - Scenario: {name} - {Status}

### Living Documentation
{Link to generated docs}

### Sign-off
- [ ] Developer verified
- [ ] Stakeholder approved
```

**Completion Criteria**:

- [ ] All scenarios passing
- [ ] Acceptance criteria met
- [ ] Living documentation generated
- [ ] Stakeholder sign-off received

**⛔ HUMAN Checkpoint**: Present acceptance report and **STOP**. Wait for user to confirm bolt completion.

---

## Stage Execution

### Sequence

```text
specify → implement → validate
```

### State Tracking

```yaml
---
current_stage: implement
stages_completed:
  - name: specify
    completed: 2024-12-05T10:00:00Z
    artifact: specifications.md
status: in-progress
---
```

### Human Validation

Specifications require stakeholder review before implementation.
