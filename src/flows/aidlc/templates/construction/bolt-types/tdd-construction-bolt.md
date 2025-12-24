# Bolt Type: TDD Construction

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
bolt_type: tdd-construction-bolt
name: TDD Construction Bolt
description: Test-Driven Development with red-green-refactor cycle
version: 1.0.0
suitable_for:
  - Algorithm implementation
  - Utility functions
  - Pure logic without external dependencies
  - Libraries and reusable components
stages_count: 3
```

---

## Overview

This bolt type implements Test-Driven Development (TDD) methodology through the classic red-green-refactor cycle: write failing tests, make them pass, then refactor.

**Best For**:

- Algorithm and logic implementation
- Utility functions and helpers
- Pure functions without side effects
- Libraries and SDKs
- Components with clear inputs/outputs

---

## Stages

### Stage 1: test-first

**Objective**: Write failing tests that specify expected behavior

**Duration**: Hours (typically 1-3 hours)

**Activities**:

1 - **Analyze requirements**: Identify test cases and edge cases
2 - **Write unit tests**: Create tests for core functionality (failing)
3 - **Write edge case tests**: Cover boundary conditions
4 - **Write error tests**: Cover error conditions
5 - **Run tests**: Confirm they fail (RED state)

**Artifact**: `test-spec.md` and test files
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/test-spec.md`)*

**Template Structure**:

```markdown
---
stage: test-first
bolt: {bolt-id}
created: {timestamp}
---

## Test Specification: {unit-name}

### Test Cases

#### Core Functionality

- **{Test name}**: Input: {input} → Expected: {output}
- **{Test name}**: Input: {input} → Expected: {output}

#### Edge Cases

- **{Test name}**: Input: {input} → Expected: {output}

#### Error Conditions

- **{Test name}**: Input: {input} → Expected Error: {error}

### Test Run (RED)
- Total tests: {n}
- Passing: 0
- Failing: {n}

Status: 🔴 RED (all tests failing as expected)
```

**Completion Criteria**:

- [ ] All functionality has tests
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] All tests compile/parse
- [ ] All tests fail (RED state)

**⛔ HUMAN Checkpoint**: Present test specification and **STOP**. Wait for user to confirm before proceeding to Stage 2.

---

### Stage 2: implement

**Objective**: Write minimal code to make tests pass

**Duration**: Hours (varies by complexity)

**Activities**:

1 - **Implement first test**: Write simplest code that passes
2 - **Iterate through tests**: Make each test pass in turn
3 - **Run full suite**: Confirm all tests pass
4 - **Review implementation**: Check for issues

**Artifact**: Source code
**Location**: `src/{unit}/`

**Approach**:

```text
for each failing test:
    1. Write simplest code that passes the test
    2. Run tests
    3. Commit if green
    4. Move to next test
```

**Completion Criteria**:

- [ ] All tests passing (GREEN state)
- [ ] Implementation is minimal
- [ ] No over-engineering
- [ ] All acceptance criteria met

**⛔ HUMAN Checkpoint**: Present implementation summary and **STOP**. Wait for user to confirm before proceeding to Stage 3.

---

### Stage 3: refactor

**Objective**: Improve code quality while keeping tests green

**Duration**: Hours (typically 1-2 hours)

**Activities**:

1 - **Review code**: Identify improvement opportunities
2 - **Remove duplication**: Apply DRY principle
3 - **Improve naming**: Make names clear and descriptive
4 - **Extract functions**: Create clean, focused functions
5 - **Optimize if needed**: Improve performance where necessary
6 - **Run tests after each change**: Maintain green state

**Artifact**: `refactor-report.md`
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/refactor-report.md`)*

**Template Structure**:

```markdown
---
stage: refactor
bolt: {bolt-id}
created: {timestamp}
---

## Refactor Report: {unit-name}

### Improvements Made

- **{Change}**: Before: {old} → After: {new} - Reason: {why}

### Code Quality Metrics

- **Cyclomatic Complexity**: Before: {n} → After: {n}
- **Lines of Code**: Before: {n} → After: {n}
- **Test Coverage**: Before: {n}% → After: {n}%

### Test Status
- All tests: ✅ PASSING
- Coverage: {n}%

### Final State
Status: 🟢 GREEN (refactored and tested)
```

**Completion Criteria**:

- [ ] All tests still passing
- [ ] Code is clean and readable
- [ ] No duplication
- [ ] Functions are small and focused
- [ ] Naming is clear

**⛔ HUMAN Checkpoint**: Present refactor report and **STOP**. Wait for user to confirm bolt completion.

---

## Stage Execution

### Sequence

```text
test-first (RED) → implement (GREEN) → refactor (REFACTOR)
```

### The TDD Cycle

```text
    ┌──────────┐
    │   RED    │  Write failing test
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  GREEN   │  Make it pass
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ REFACTOR │  Improve code
    └────┬─────┘
         │
         └──────► Next test case
```

### State Tracking

```yaml
---
current_stage: refactor
stages_completed:
  - name: test-first
    completed: 2024-12-05T10:00:00Z
    tests_written: 15
  - name: implement
    completed: 2024-12-05T12:00:00Z
    tests_passing: 15
status: in-progress
---
```
