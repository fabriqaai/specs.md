# FIRE Flow Gaps: Patterns to Adopt from AIDLC

This document captures quality-increasing patterns from AIDLC that should be adopted in FIRE to improve artifact quality and agent guidance.

> **Important:** These patterns are for **AI guidance**, not human-in-the-loop checkpoints. They help the LLM maintain context, follow critical steps, and produce higher-quality output. FIRE's existing checkpoint model (autopilot/confirm/validate) should NOT be changed.

---

## P0 - Critical (High Impact)

### 1. Progress Display Blocks ✅ DONE

**AIDLC Pattern:**
Every skill starts with a visual progress indicator showing where the agent is in the workflow.

```text
### Builder Progress
- [x] Run initialized
- [x] Context loaded
- [ ] Plan generated  ← current
- [ ] Implementation
- [ ] Tests
- [ ] Code review
- [ ] Walkthrough
```

**Why it works:** Gives LLM context on where it is in the flow, reduces "lost context" drift.

**Files to update:**
- `src/flows/fire/agents/builder/skills/run-execute/SKILL.md`
- `src/flows/fire/agents/builder/skills/run-plan/SKILL.md`
- `src/flows/fire/agents/planner/skills/work-item-decompose/SKILL.md`

---

### 2. ⛔ HARD GATE Markers (AI Guidance, NOT Human Checkpoint) ✅ DONE

**AIDLC Pattern:**
Critical steps use ASCII art boxes to break attention and emphasize mandatory actions **for the AI**.

```text
⛔ HARD GATE - SCRIPT EXECUTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You CANNOT proceed without:
1. Running complete-run.cjs script
2. Verifying the output

If you skip this, state becomes inconsistent.
```

**Why it works:** ASCII art visually breaks the text flow in the prompt, making critical instructions harder for the LLM to skip. This is **not** a human checkpoint - the AI should execute the gate automatically.

**Files to update:**
- `src/flows/fire/agents/builder/skills/run-execute/SKILL.md` (for script execution)
- `src/flows/fire/agents/builder/skills/walkthrough-generate/SKILL.md` (for mandatory generation)

---

### 3. Enhanced Walkthrough Template ✅ DONE

**Current FIRE walkthrough sections:**
- Summary
- Structure Overview
- Files Changed (Created/Modified)
- Key Implementation Details
- Decisions Made
- Deviations from Plan
- Dependencies Added
- How to Verify
- Test Coverage
- Developer Notes

**Missing sections from AIDLC DDD templates:**

#### a. Domain Model (conditional)
```markdown
## Domain Model (if applicable)

### Entities Created/Modified
| Entity | Properties | Business Rules |
|--------|------------|----------------|
| User | id, email, passwordHash | Email must be unique |

### Value Objects
| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| Email | value | Valid email format |
```

#### b. Architecture Context
```markdown
## Architecture

### Pattern Used
{Pattern and rationale - e.g., Repository pattern, Service layer, MVC}

### Layer Structure
```text
┌─────────────────────────────┐
│      Presentation           │  API/UI
├─────────────────────────────┤
│      Application            │  Use Cases
├─────────────────────────────┤
│        Domain               │  Business Logic
├─────────────────────────────┤
│     Infrastructure          │  Database/External
└─────────────────────────────┘
```
```

#### c. Security Considerations
```markdown
## Security Considerations

| Concern | Approach |
|---------|----------|
| Authentication | JWT tokens with 24h expiry |
| Input validation | Zod schema on all API inputs |
| Data encryption | Sensitive fields encrypted at rest |
```

#### d. Performance Considerations
```markdown
## Performance Considerations

| Requirement | Implementation |
|-------------|----------------|
| Response time | Indexed queries, connection pooling |
| Scalability | Stateless handlers, horizontal scaling ready |
```

#### e. Ready for Review Checklist
```markdown
## Ready for Review

- [x] All acceptance criteria met
- [x] Tests passing
- [x] Code coverage > 80%
- [x] No critical security issues
- [x] Documentation updated
- [x] Developer notes captured
```

**Files to update:**
- `src/flows/fire/agents/builder/skills/walkthrough-generate/SKILL.md`
- `src/flows/fire/agents/builder/skills/walkthrough-generate/templates/walkthrough.md.hbs`

---

### 4. Checkpoint Tables (Document Existing, Don't Add New)

**AIDLC Pattern:**
Each skill documents which checkpoints exist and what they're for.

```markdown
## Checkpoints in This Skill

| Mode | Checkpoints | Purpose |
|------|-------------|---------|
| autopilot | 0 | No stops, execute fully |
| confirm | 1 | Plan approval |
| validate | 2 | Design + Plan approval |
```

**Why it works:** Documents FIRE's existing checkpoint behavior explicitly - does NOT add new human stops. Helps LLM understand the current mode's expectations.

**Note:** This is documentation of FIRE's existing behavior, not adding checkpoints.

**Files to update:** Skills that have mode-dependent behavior

---

### 5. Test Contracts

**AIDLC Pattern:**
Each skill ends with a test contract defining input/output/checkpoints.

```yaml
## Test Contract

input: work item with design doc
output: plan.md, implementation, test-report.md
checkpoints: 1 (confirm mode), 2 (validate mode)
```

**Why it works:** Clear contract for skill behavior, useful for debugging and validation.

**Files to update:** All SKILL.md files

---

## P1 - High (Quality Improvement)

### 6. Transition Sections

**AIDLC Pattern:**
Explicit routing after skill completion.

```markdown
## Transition

After run completion:
- → **walkthrough-generate** - Generate walkthrough
- → **run-plan** - If more pending work items
- → **planner-agent** - If no more work items
```

**Files to update:** All SKILL.md and agent.md files

---

### 7. Gap Resolution Pattern

**AIDLC Pattern:**
Detect and offer resolution for missing prerequisites.

```markdown
## Gaps Identified

- 🚫 **Missing acceptance criteria** → Add criteria before continuing
- 🚫 **No design doc for validate mode** → Generate design doc first

### Recommended Actions
1 - **fix-criteria**: Add missing acceptance criteria
2 - **generate-design**: Create design doc

**Type a number to fix the gap.**
```

**Files to update:**
- `src/flows/fire/agents/builder/skills/run-plan/SKILL.md`
- `src/flows/fire/agents/planner/skills/work-item-decompose/SKILL.md`

---

### 8. Actions Menu Format

**AIDLC Pattern:**
Numbered options with suggested next action.

```markdown
### Actions

1 - **next**: Start next work item
2 - **status**: View current status
3 - **done**: Return to orchestrator

### Suggested Next Step
→ **next** - Continue with next work item

**Type a number or press Enter for suggested action.**
```

**Files to update:** All agent.md files

---

### 9. Testability Transformation

**AIDLC Pattern:**
Transform vague requirements into measurable criteria.

```text
❌ "Fast response" → ✅ "Response < 200ms p95"
❌ "Secure" → ✅ "OAuth 2.0 with MFA"
❌ "Scalable" → ✅ "Support 10K concurrent users"
```

**Files to update:**
- `src/flows/fire/agents/planner/skills/work-item-decompose/SKILL.md` (acceptance criteria)
- `src/flows/fire/agents/planner/skills/intent-capture/SKILL.md` (success criteria)

---

## P2 - Medium (Consistency)

### 10. References Index

**AIDLC-inspired (FIRE already has this partially):**
Extract large reference content to separate files with load conditions.

```xml
<references_index>
  <reference name="review-categories" path="references/review-categories.md" load_when="analyzing code"/>
  <reference name="testing-patterns" path="references/testing-patterns.md" load_when="writing tests"/>
</references_index>
```

**Files to update:** Skills with embedded large reference content

---

### 11. Critical Clarifications Section

**FIRE already has this in run-plan! Example:**

```xml
<critical_clarifications>
  <clarification title="Dependencies Mean Sequential Execution, NOT Separate Runs">
    When work items have dependencies:
    - They execute sequentially within the SAME run
    - They do NOT require separate runs
  </clarification>
</critical_clarifications>
```

**Adopt in more skills** where common misconceptions occur.

---

### 12. Completion Criteria Checklists

**AIDLC Pattern:**
Explicit checklist before marking complete.

```markdown
## Completion Checklist

- [ ] Bolt file updated: status: complete
- [ ] All stories updated: implemented: true
- [ ] Unit status cascade checked
- [ ] Construction log updated
```

**Files to update:**
- `src/flows/fire/agents/builder/skills/run-execute/SKILL.md` (before complete-run.cjs)

---

## Summary: What FIRE Can Learn from AIDLC

> **Note:** All patterns below are **AI guidance** to improve output quality. None add human checkpoints.

| Pattern | AIDLC Location | FIRE Priority | Type |
|---------|----------------|---------------|------|
| Progress display blocks | Every skill | P0 | AI context |
| ⛔ HARD GATE markers | bolt-start.md | P0 | AI guidance |
| Domain model in walkthrough | ddd-01-domain-model-template.md | P0 | Output quality |
| Architecture in walkthrough | ddd-02-technical-design-template.md | P0 | Output quality |
| Security/Performance sections | ddd templates | P0 | Output quality |
| Ready for Review checklist | ddd-03-test-report-template.md | P0 | Output quality |
| Test contracts | All skills | P1 | AI guidance |
| Transition sections | All skills | P1 | AI context |
| Gap resolution | review.md, bolt-plan.md | P1 | AI guidance |
| Actions menu format | All agents | P1 | Output quality |
| Testability transformation | requirements.md | P2 | Output quality |
| Completion checklists | bolt-start.md | P2 | AI guidance |

---

## What AIDLC Can Learn from FIRE

For completeness, these FIRE patterns could benefit AIDLC:

| Pattern | FIRE Location | Benefit |
|---------|---------------|---------|
| Degrees of freedom | All skills | Clearer autonomy guidance |
| File system reconciliation | run-plan | More robust state tracking |
| Execution modes (autopilot/confirm/validate) | run-execute | Flexible checkpoint counts |
| Autonomy bias | state.yaml | User preference for oversight |
| Code review skill | code-review | Catch issues before completion |
| Critical clarifications | run-plan | Disambiguation of common mistakes |

---

*Created: 2026-01-25*
*Source: Analysis of AIDLC patterns for FIRE adoption*
