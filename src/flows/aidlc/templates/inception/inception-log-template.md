# Inception Log Template

Use this template to track inception progress and decisions for an intent.

---

## Location

`{intents-path}/{intent}/inception-log.md`

---

## Template

```markdown
---
intent: {NNN}-{intent-name}
created: {YYYY-MM-DDTHH:MM:SSZ}
completed: {YYYY-MM-DDTHH:MM:SSZ or null}
status: {in-progress | complete}
---

# Inception Log: {intent-name}

## Overview

**Intent**: {brief description}
**Type**: {green-field | brown-field | defect-fix | refactoring}
**Created**: {date}

## Artifacts Created

| Artifact | Status | File |
|----------|--------|------|
| Requirements | ✅ | requirements.md |
| System Context | ✅ | system-context.md |
| Units | ✅ | units/{unit-name}/unit-brief.md |
| Stories | ✅ | units/{unit-name}/stories/*.md |
| Bolt Plan | ✅ | memory-bank/bolts/bolt-*.md |

## Summary

| Metric | Count |
|--------|-------|
| Functional Requirements | {n} |
| Non-Functional Requirements | {n} |
| Units | {n} |
| Stories | {n} |
| Bolts Planned | {n} |

## Units Breakdown

| Unit | Stories | Bolts | Priority |
|------|---------|-------|----------|
| {unit-1} | {n} | {n} | Must |
| {unit-2} | {n} | {n} | Should |

## Decision Log

| Date | Decision | Rationale | Approved |
|------|----------|-----------|----------|

## Scope Changes

| Date | Change | Reason | Impact |
|------|--------|--------|--------|

## Ready for Construction

**Checklist**:
- [ ] All requirements documented
- [ ] System context defined
- [ ] Units decomposed
- [ ] Stories created for all units
- [ ] Bolts planned
- [ ] Human review complete

## Next Steps

1. Begin Construction Phase
2. Start with Unit: {first-unit}
3. Execute: `/specsmd-construction-agent --unit="{first-unit}"`

## Dependencies

{Execution order based on unit dependencies}
```

---

## When to Create

Create this file when:

1. Intent is created (intent-create skill)
2. Initialize with basic metadata and empty sections

---

## When to Update

Update this file when:

1. An artifact is completed (update Artifacts Created table)
2. A decision is made during inception (add to Decision Log)
3. Scope changes (add to Scope Changes)
4. Inception completes (mark status complete, fill summary)

---

## Decision Log Examples

```markdown
## Decision Log

| Date | Decision | Rationale | Approved |
|------|----------|-----------|----------|
| 2025-12-07 | Split auth into 2 units | Separation of concerns | Yes |
| 2025-12-07 | Use JWT over sessions | Stateless API requirement | Yes |
| 2025-12-08 | Add MFA to scope | Security requirement from review | Yes |
```

---

## Scope Changes Examples

```markdown
## Scope Changes

| Date | Change | Reason | Impact |
|------|--------|--------|--------|
| 2025-12-08 | Added MFA stories | Security requirement | +2 stories, +1 bolt |
| 2025-12-09 | Removed social login | Out of scope for MVP | -3 stories, -1 bolt |
```
