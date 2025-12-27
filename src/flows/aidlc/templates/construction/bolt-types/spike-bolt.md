# Bolt Type: Spike (Research)

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
- ❌ Exceeding time-box without approval

---

## Metadata

```yaml
bolt_type: spike-bolt
name: Spike Bolt
description: Research and proof-of-concept for unknown areas
version: 1.0.0
suitable_for:
  - Technical research
  - Proof of concept
  - Evaluating technologies
  - Risk mitigation
stages_count: 2
```

---

## Overview

This bolt type is for research and proof-of-concept work when there are unknowns that need investigation before committing to implementation.

**Best For**:

- Evaluating new technologies
- Proof of concept for risky approaches
- Research before estimation
- Validating assumptions
- Learning and experimentation

**Important**: Spike bolts produce **knowledge**, not production code. The output is documentation, not deployable software.

---

## Stages

### Stage 1: explore

**Objective**: Investigate the unknown area and document findings

**Duration**: Time-boxed (hours to days, strictly limited)

**Activities**:

1 - **Define research questions**: List what needs to be answered
2 - **Investigate options**: Research and document alternatives
3 - **Build throwaway prototypes**: Create proof-of-concept code
4 - **Test assumptions**: Validate or invalidate beliefs
5 - **Identify risks**: Document potential issues
6 - **Evaluate trade-offs**: Compare options

**Artifact**: `spike-exploration.md`
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/spike-exploration.md`)*

**Template Structure**:

```markdown
---
stage: explore
bolt: {bolt-id}
created: {YYYY-MM-DDTHH:MM:SSZ}
time_box: {hours}
---

## Spike Exploration: {topic}

### Research Questions
1. {question 1}
2. {question 2}

### Options Investigated

- **{Option}**: {Description} - Pros: {list} - Cons: {list}

### Prototype Notes
{What was built, what was learned}

### Assumptions Tested

- **{Assumption}**: Valid: {yes/no} - Evidence: {details}

### Risks Identified

- **{Risk}**: Likelihood: {H/M/L} - Impact: {H/M/L} - Mitigation: {approach}
```

**Completion Criteria**:

- [ ] All research questions addressed
- [ ] Options evaluated
- [ ] Prototypes built (if applicable)
- [ ] Assumptions validated or invalidated
- [ ] Risks documented

**⛔ HUMAN Checkpoint**: Present exploration summary and **STOP**. Wait for user to confirm before proceeding to Stage 2.

---

### Stage 2: document

**Objective**: Consolidate findings into actionable recommendations

**Duration**: Hours (typically 1-2 hours)

**Activities**:

1 - **Summarize findings**: Create high-level summary
2 - **Make recommendations**: Propose best approach
3 - **Estimate implementation**: Provide effort estimates
4 - **Identify next bolts**: Suggest follow-up work
5 - **Present to team**: Share knowledge

**Artifact**: `spike-report.md`
**Location**: Path defined by `schema.units` in `.specsmd/aidlc/memory-bank.yaml`
*(Default: `{intents-path}/{intent}/units/{unit}/spike-report.md`)*

**Template Structure**:

```markdown
---
stage: document
bolt: {bolt-id}
created: {YYYY-MM-DDTHH:MM:SSZ}
---

## Spike Report: {topic}

### Summary
{High-level summary of what was learned}

### Key Findings
1. {finding 1}
2. {finding 2}

### Recommendation
**Recommended Approach**: {option}

**Rationale**: {why this option}

### Implementation Estimate

- **{Component}**: Effort: {estimate} - Confidence: {H/M/L}

### Risks to Monitor

- **{Risk}**: Mitigation: {strategy}

### Suggested Next Steps
1. {Create bolt for...}
2. {Update requirements with...}
3. {Add story for...}

### Artifacts to Archive
- [ ] Prototype code (if reusable): {location}
- [ ] Research notes: {location}
```

**Completion Criteria**:

- [ ] Findings documented
- [ ] Clear recommendation made
- [ ] Estimates provided
- [ ] Next steps identified
- [ ] Knowledge shared with team

**⛔ HUMAN Checkpoint**: Present spike report and **STOP**. Wait for user to confirm bolt completion.

---

## Stage Execution

### Sequence

```text
explore → document
```

### Time-Boxing

Spikes **MUST** be time-boxed:

- Define maximum duration upfront
- Stop when time-box expires
- Document whatever was learned
- Don't extend without explicit approval

### State Tracking

```yaml
---
current_stage: document
stages_completed:
  - name: explore
    completed: 2024-12-05T16:00:00Z
    time_spent: 4h
status: in-progress
time_box: 8h
time_remaining: 4h
---
```

---

## Important Notes

### Spike Output

- **NOT** production code
- **NOT** deployable software
- **IS** knowledge and documentation
- **IS** input for real construction bolts

### After a Spike

1. Review findings with team
2. Update requirements if needed
3. Create real construction bolts
4. Archive or delete prototype code
