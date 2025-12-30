# Skill: Review & Complete Inception

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [x] Intent created
- [x] Requirements gathered
- [ ] Artifacts reviewed  ← current
- [ ] Ready for Construction
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 3 | Artifacts review (Context + Units + Stories + Bolts) | User approval |
| Checkpoint 4 | Ready for Construction | User confirmation |

---

## Goal

Ensure all inception artifacts are complete, consistent, and ready for Construction Phase.

---

## Input

- **Required**: Intent name
- **Required**: All intent artifacts
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Artifact Verification

Check existence and completeness of all required artifacts:

- **Requirements**: `{intent}/requirements.md` - FR, NFR, constraints
- **System Context**: `{intent}/system-context.md` - Actors, external systems, data flows
- **Units**: `{intent}/units.md` - Unit list with purposes
- **Unit Briefs**: `{intent}/units/{unit}/unit-brief.md` - Scope, entities, success criteria
- **Stories**: `{intent}/units/{unit}/stories/*.md` - Acceptance criteria
- **Bolts**: Path from `schema.bolts` - Type, stories, status

### 2. Consistency Check

Verify cross-artifact consistency:

- **Story Coverage**: All requirements traced to stories
- **Unit Independence**: No circular dependencies
- **Bolt Completeness**: All stories assigned to bolts
- **Type Alignment**: Bolt types match story nature

### Step 3: Artifacts Review

**Checkpoint 3**: Present all generated artifacts for review:

```text
### Artifacts Review

**System Context**
- Actors: {list}
- External systems: {list}
- Data flows: {summary}

**Units**
- {unit-1}: {purpose}
- {unit-2}: {purpose}

**Stories** ({n} total)
- {unit-1}: S1, S2, S3
- {unit-2}: S4, S5

**Bolt Plan** ({n} bolts)
- bolt-{unit-1}-1: Stories S1-S3
- bolt-{unit-2}-1: Stories S4-S5

Review the breakdown above. Any changes needed?
1 - Looks good, continue
2 - Need changes (specify what)
```

**Wait for user response.**

---

### Step 4: Gap Resolution

If gaps are found:

```markdown
## Gaps Identified

- 🚫 **Missing NFR** in requirements.md → Add performance criteria
- 🚫 **No stories** for `unit-api` → Create stories for API unit

### Recommended Actions

1 - **requirements**: Add missing NFR
2 - **stories**: Create stories for unit-api

**Type a number to fix the gap.**
```

### 5. Update Inception Log

When all checks pass, update `inception-log.md` (created during intent-create):

- Use template: `.specsmd/aidlc/templates/inception/inception-log-template.md`
- Update `status` to `complete`
- Update `completed` date
- Fill in Summary section with final counts
- Mark all items in "Ready for Construction" checklist as complete

Update these sections:

```markdown
---
intent: {NNN}-{intent-name}
created: {original-date}
completed: {today}
status: complete
---

## Summary

- **Functional Requirements**: {n}
- **Non-Functional Requirements**: {n}
- **Units**: {n}
- **Stories**: {n}
- **Bolts Planned**: {n}

## Ready for Construction

**Checklist**:
- [x] All requirements documented
- [x] System context defined
- [x] Units decomposed
- [x] Stories created for all units
- [x] Bolts planned
- [x] Human review complete

## Next Steps

1 - **construction**: Start building with first bolt

→ `/specsmd-construction-agent --unit="{first-unit}"`
```

### Step 6: Update Intent Status

Update `requirements.md` frontmatter:

```yaml
status: inception-complete
```

---

### Step 7: Ready for Construction

**Checkpoint 4**: Confirm ready to proceed:

```text
### Ready for Construction?

✅ Inception complete for {intent-name}

Summary:
- {n} functional requirements
- {m} non-functional requirements
- {x} units
- {y} stories
- {z} bolts planned

Ready to start construction?
1 - Yes, start with {first-unit}
2 - Yes, start with different unit
3 - Review something first
```

**Wait for user response.**

---

## Output

```markdown
## Inception Review: {intent-name}

### Verification Results

- ✅ Artifacts complete
- ✅ Cross-references valid
- ✅ Stories have acceptance criteria
- ✅ Bolts planned

### Log Updated
- `{schema.intents}/{intent-name}/inception-log.md`

### Ready for Construction
✅ **INCEPTION COMPLETE**

Intent `{intent-name}` is ready for Construction Phase.

### Actions

1 - **construction**: Start building with first bolt

### Suggested Next Step
→ **construction** - Start with `/specsmd-construction-agent --unit="{first-unit}" --bolt-id="{first-bolt}"`

**Type a number or press Enter for suggested action.**
```

---

## Transition

After user confirms at Checkpoint 4:

- → **Construction Agent** - `/specsmd-construction-agent --unit="{unit}"`

If gaps found at Checkpoint 3:

- → Return to appropriate skill to fix

---

## Test Contract

```yaml
input: All inception artifacts (requirements, context, units, stories, bolts)
output: inception-log.md updated, intent status = inception-complete
checkpoints: 2
  - Checkpoint 3: Artifacts reviewed and approved
  - Checkpoint 4: Ready for Construction confirmed
```
