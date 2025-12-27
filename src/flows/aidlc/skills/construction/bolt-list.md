# Skill: List Bolts

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 1 | Which bolt to work on? | User selection |

---

## Goal

Display all bolt instances with their status, optionally filtered by unit or intent.

---

## Input

- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--unit` - filter by unit name
- **Optional**: `--intent` - filter by intent name

---

## Process

### 1. Load Schema

Read `.specsmd/aidlc/memory-bank.yaml` to get the `bolts` path.
*(Default: `memory-bank/bolts/`)*

### 2. Scan Bolt Files

For each bolt directory in `memory-bank/bolts/`:

1. Read `bolt.md` frontmatter for metadata
2. Extract: id, unit, intent, bolt_type, status, current_stage, stories
3. The `bolt_type` field indicates which bolt type definition to use for stage information

### 3. Apply Filters

If `--unit` or `--intent` provided:

- Filter bolts to match the specified criteria
- Show "No bolts found" if none match

### 4. Calculate Progress

For each bolt, determine progress:

- **planned**: 0% - Not started
- **in-progress**: `stages_completed / total_stages`
- **completed**: 100%
- **blocked**: Show blocker reason

### 5. Display Results

Sort bolts by:

1. In-progress first (active work)
2. Planned (upcoming)
3. Blocked (needs attention)
4. Completed (historical)

---

## Output

```markdown
## Bolts Overview

### Active Bolts

- ⏳ **002-auth-service** (auth-service, {bolt-type}) - Stage: {current-stage}, 2/4 (50%) ← working

### Planned Bolts

- [ ] **003-auth-service** (auth-service) - Stories: 005-*, 006-* - Ready ✅
- [ ] **004-payment-api** (payment-api) - Stories: 001-*, 002-*, 003-* - Ready ✅

### Blocked Bolts

- 🚫 **005-api-gateway** - Waiting for auth (since 2024-12-04)

### Completed Bolts

- ✅ **001-auth-service** (auth-service) - Completed 2024-12-05 (4 hours)

### Summary
- **Total**: {n} bolts
- **In Progress**: {n}
- **Planned**: {n}
- **Completed**: {n}
- **Blocked**: {n}

### Actions

1 - **Continue active bolt**: Resume `002-auth-service`
2 - **Start planned bolt**: Begin `003-auth-service`
3 - **View bolt status**: Check detailed status
4 - **Plan new bolts**: Create additional bolts

**Type a number or bolt ID to continue.**
```

---

## Output (Filtered)

```markdown
## Bolts for Unit: {unit-name}

- ✅ **001-{unit-name}** ({bolt-type}) - Completed 100% - Stories: 001-*, 002-*
- ⏳ **002-{unit-name}** ({bolt-type}) - In progress 50% - Stories: 003-*, 004-* ← current
- [ ] **003-{unit-name}** ({bolt-type}) - Planned 0% - Stories: 005-*

### Quick Actions

1 - **Continue 002-{unit-name}**: Resume current work
2 - **View 001-{unit-name} status**: Review completed bolt

**Type a number to continue.**
```

---

## Bolt Selection

**Checkpoint 1**: Ask user which bolt to work on:

```text
### Available Bolts

1 - 001-{unit-name} (planned) - Stories: 001-*, 002-*
2 - 002-{unit-name} (planned) - Stories: 003-*, 004-*

Which bolt would you like to work on?
```

**Wait for user response.**

**CRITICAL**: Never auto-select a bolt. Always ask which bolt.

---

## Transition

After user selects bolt at Checkpoint 1:

- → **Bolt Start** - execute selected bolt

---

## Test Contract

```yaml
input: Unit name or intent filter
output: List of bolts with status
checkpoints: 1
  - Checkpoint 1: User selects which bolt to work on
```
