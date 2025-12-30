# Construction Log Template

Use this template to track construction progress and replanning decisions for a unit.

---

## Location

`{intents-path}/{intent}/units/{unit}/construction-log.md`

---

## Template

```markdown
---
unit: {UUU}-{unit-name}
intent: {NNN}-{intent-name}
created: {YYYY-MM-DDTHH:MM:SSZ}
last_updated: {YYYY-MM-DDTHH:MM:SSZ}
---

# Construction Log: {unit-name}

## Original Plan

**From Inception**: {number} bolts planned
**Planned Date**: {inception-date}

| Bolt ID | Stories | Type |
|---------|---------|------|
| {bolt-1} | {stories} | {type} |
| {bolt-2} | {stories} | {type} |

## Replanning History

| Date | Action | Change | Reason | Approved |
|------|--------|--------|--------|----------|

## Current Bolt Structure

| Bolt ID | Stories | Status | Changed |
|---------|---------|--------|---------|
| {bolt-1} | {stories} | ✅ completed | - |
| {bolt-2} | {stories} | ⏳ in-progress | - |
| {bolt-3} | {stories} | [ ] planned | Split from bolt-2 |

## Execution History

| Date | Bolt | Event | Details |
|------|------|-------|---------|
| {date} | {bolt-id} | started | Stage 1: {stage-name} |
| {date} | {bolt-id} | stage-complete | {stage} → {next-stage} |
| {date} | {bolt-id} | completed | All {n} stages done |

## Execution Summary

| Metric | Value |
|--------|-------|
| Original bolts planned | {n} |
| Current bolt count | {n} |
| Bolts completed | {n} |
| Bolts in progress | {n} |
| Bolts remaining | {n} |
| Replanning events | {n} |

## Notes

{Any additional observations or decisions made during construction}
```

---

## When to Create

Create this file when:

1. First bolt for a unit starts (initialize with original plan)
2. Any replanning action occurs (append, split, reorder)

---

## When to Update

Update this file when:

1. A bolt starts (add to Execution History, update Current Bolt Structure)
2. A stage completes (add to Execution History)
3. A bolt completes (add to Execution History, update Current Bolt Structure, update Execution Summary)
4. A replanning action occurs (add to Replanning History, update Current Bolt Structure)
5. Construction completes (add final summary to Notes)

---

## Replanning History Actions

| Action | Description |
|--------|-------------|
| `append` | New bolt(s) added to plan |
| `split` | Existing bolt split into multiple |
| `reorder` | Execution order changed |
| `scope-change` | Stories added/removed from bolt |

---

## Example Entries

### Replanning History Example

```markdown
| Date | Action | Change | Reason | Approved |
|------|--------|--------|--------|----------|
| 2025-12-07 | split | bolt-2 → bolt-2, bolt-3 | Scope too large for single bolt | Yes |
| 2025-12-08 | append | Added bolt-4 | New stories from feedback | Yes |
| 2025-12-09 | reorder | bolt-4 before bolt-3 | Dependency discovered | Yes |
```

### Execution History Example

```markdown
| Date | Bolt | Event | Details |
|------|------|-------|---------|
| 2025-12-07 | bolt-auth-1 | started | Stage 1: Model |
| 2025-12-07 | bolt-auth-1 | stage-complete | Model → Design |
| 2025-12-07 | bolt-auth-1 | stage-complete | Design → Implement |
| 2025-12-08 | bolt-auth-1 | stage-complete | Implement → Test |
| 2025-12-08 | bolt-auth-1 | completed | All 4 stages done |
| 2025-12-08 | bolt-auth-2 | started | Stage 1: Model |
```
