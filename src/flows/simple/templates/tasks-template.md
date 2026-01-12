# Tasks Template

Use this template when generating tasks.md for a feature spec.

---

```markdown
# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for [components]
  - Define core interfaces and types
  - Set up testing framework if not present
  - _Requirements: [X.Y]_

- [ ] 2. Implement [Component Group Name]
- [ ] 2.1 Create [specific component/module]
  - [Implementation detail 1]
  - [Implementation detail 2]
  - _Requirements: [X.Y, X.Z]_

- [ ]* 2.2 Write unit tests for [component]
  - Create test file
  - Test [specific behavior]
  - _Requirements: [X.Y]_

- [ ] 2.3 Implement [next component]
  - [Details]
  - _Requirements: [X.Y]_

- [ ] 3. Implement [Next Component Group]
- [ ] 3.1 Create [component]
  - [Details]
  - _Requirements: [X.Y]_

- [ ] 3.2 Wire components together
  - Connect [A] to [B]
  - [Integration details]
  - _Requirements: [X.Y, X.Z]_

- [ ] 4. Checkpoint - Verify all tests pass
  - Run test suite
  - Address any failures before continuing

- [ ] 5. [Continue with remaining components...]

- [ ] N. Final Checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all requirements are covered
  - Review implementation against design
```

---

## Task Format Rules

### Checkbox Format

- `- [ ]` - Pending task
- `- [x]` - Completed task
- `- [ ]*` - Optional task (nice-to-have, not blocking)

### Numbering Rules

- Top-level tasks: `1.`, `2.`, `3.`
- Sub-tasks: `2.1`, `2.2`, `2.3`
- Maximum 2 levels (no `2.1.1`)
- Parent tasks with sub-tasks are GROUP HEADERS (not directly executed)
  - Mark parent complete only when ALL sub-tasks are done
- Tasks without sub-tasks are directly executable
- Use sub-tasks when a feature has 3+ related implementation steps

### Requirement References

- Always include: `_Requirements: X.Y, X.Z_`
- Reference specific acceptance criteria numbers
- Every requirement should be covered by at least one task

### Task Content

Each task should include:

1. **Clear objective** - What to implement
2. **Implementation details** - Sub-bullets with specifics
3. **Requirement reference** - Traceability

## Guidelines

1. **Coding tasks ONLY** - No deployment, user testing, documentation
2. **Incremental progress** - Each task builds on previous
3. **Test-driven where appropriate** - Mark test tasks with `*` if optional
4. **Include checkpoints** - Periodic verification that tests pass
5. **Reference requirements** - Every task traces to requirement(s)
6. **Actionable by AI** - Tasks should be specific enough for code generation

## Excluded Task Types (Do NOT include)

- User acceptance testing
- Deployment to environments
- Performance metrics gathering
- User training
- Documentation creation (unless code comments)
- Business process changes
- Marketing activities
