# Skill: List Intents

---

## Role

Utility skill to view all intents and their status.

**NO Checkpoint** - This is an informational/navigation skill.

---

## Goal

Display all intents in the memory bank with their current status and suggest next actions.

---

## Input

- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Required**: Intents at path defined by `schema.intents`

---

## Process

### 1. Load Schema

Read `.specsmd/aidlc/memory-bank.yaml` to get the `intents` path.

### 2. Scan Intents

For each directory in `schema.intents`:

1. Read `requirements.md` frontmatter for metadata
2. Check for existence of key artifacts:
   - `requirements.md` - requirements defined?
   - `system-context.md` - context mapped?
   - `units.md` - decomposed?
   - `units/*/stories/` - stories created?
3. Check path from `schema.bolts` for planned bolts

### 3. Determine Status

Status progression based on artifacts present:

- Only `requirements.md` (draft) → **Draft** (Early Inception)
- `requirements.md` complete → **Requirements Done** (Inception)
- `system-context.md` exists → **Context Mapped** (Inception)
- `units.md` exists → **Decomposed** (Inception)
- Stories exist → **Stories Done** (Inception)
- Bolts planned → **Ready for Construction** (Inception Complete)
- Bolts in-progress → **Building** (Construction)
- All bolts complete → **Ready for Deployment** (Construction Complete)
- Deployed → **Live** (Operations)

### 4. Display Results

```markdown
## Intents Overview

- ⏳ **{intent-1}**: {status} - {phase} - {x/y} progress
- [ ] **{intent-2}**: {status} - {phase} - {x/y} progress
- ✅ **{intent-3}**: Completed - Operations

### Summary
- **Total**: {count} intents
- **By Phase**: Inception ({n}), Construction ({n}), Operations ({n})
- **Needs Attention**: {list of blocked or stale intents}
```

---

## Output

```markdown
## Project Intents

### Active Intents

- ⏳ **user-authentication**: Construction - Bolt 2/3 in progress (2024-12-05)
- [ ] **payment-integration**: Inception - Stories needed (2024-12-04)

### Completed Intents

- ✅ **core-api**: Completed 2024-11-28 - Production

### Summary
- **Total**: 3 intents
- **Active**: 2
- **Completed**: 1

### Actions

1 - **payment-integration**: Create stories to complete inception
2 - **user-authentication**: Continue bolt execution
3 - **create-intent**: Create a new intent

### Suggested Next Step
→ **payment-integration** - Complete inception by creating stories

**Type a number or press Enter for suggested action.**
```

---

## Transition

After viewing list:

- → **intent-create** - if user wants new intent
- → **requirements** - if user picks intent in early inception
- → **Construction Agent** - if intent is ready for construction

---

## Test Contract

```yaml
input: Memory bank path
output: List of intents with status, suggested actions
checkpoints: 0 (informational only)
```
