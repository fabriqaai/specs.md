---
name: intent-list
description: Use when the user asks what intents exist, which features are in progress, or what to work on next in an AI-DLC project. Lists every intent in `memory-bank/intents/` with its status and phase.
license: MIT
metadata:
  version: "1.0.0"
  flow: aidlc
  phase: inception
disable-model-invocation: true
---

# List Intents

## Role

Utility skill to view all intents and their status.

**NO Checkpoint** - This is an informational/navigation skill.

---

## Goal

Display all intents in the memory bank with their current status and suggest next actions.

---

## Input

- **Required**: Intents at `memory-bank/intents/` (full schema: `references/memory-bank.yaml` in the `inception` skill)

---

## Process

### 1. Locate Intents

Intents live at `memory-bank/intents/{NNN}-{intent-name}/`; bolts live at `memory-bank/bolts/{BBB}-{unit-name}/`.

### 2. Scan Intents

For each intent directory:

1. Read `requirements.md` frontmatter for metadata
2. Check for existence of key artifacts:
   - `requirements.md` - requirements defined?
   - `system-context.md` - context mapped?
   - `units.md` - decomposed?
   - `units/*/stories/` - stories created?
3. Check `memory-bank/bolts/` for planned bolts

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

- → invoke the `intent-create` skill - if user wants a new intent
- → invoke the `requirements` skill - if user picks an intent in early inception
- → invoke the `construction` skill - if the selected intent is ready for construction

---

## Test Contract

```yaml
input: Memory bank path
output: List of intents with status, suggested actions
checkpoints: 0 (informational only)
```
