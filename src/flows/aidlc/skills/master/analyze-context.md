# Skill: Analyze Context

---

## Role

Diagnostic skill to determine current project state by inspecting memory bank artifacts.

**NO Checkpoint** - Analysis is informational, not a decision point.

---

## Goal

Deduce the current project state and recommend the logical next step by inspecting the memory bank artifacts.

---

## Input

- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Required**: Project artifacts at paths defined in schema

---

## Process

### 1. Load Schema

Read `.specsmd/aidlc/memory-bank.yaml` to understand artifact paths:

- `schema.intents` - where intents are stored
- `schema.units` - where units are stored
- `schema.bolts` - where bolts are stored

### 2. Inspect Intents

List contents of `schema.intents` directory:

- Are there any intent directories?
- For each intent, what artifacts exist?

### 3. Inspect Units (if intents exist)

For recent/active intents:

- Does `units.md` exist?
- Does `units/` directory have content?
- For each unit, are there stories in `stories/`?

### 4. Inspect Bolts (if units exist)

Check `schema.bolts` directory:

- Are there bolt instance files?
- What is their status? (planned, in-progress, completed)
- What stage are in-progress bolts at?

### 5. Determine Phase

Based on evidence found:

- **No intents** → Pre-Inception → Create first intent
- **Intent exists, no requirements.md** → Early Inception → Gather requirements
- **Requirements exist, no units.md** → Mid Inception → Decompose into units
- **Units exist, no stories** → Late Inception → Create stories
- **Stories exist, no bolts** → Inception Complete → Plan bolts
- **Bolts planned** → Ready for Construction → Start first bolt
- **Bolts in-progress** → Construction → Continue current bolt
- **All bolts completed** → Ready for Operations → Deploy unit
- **Deployed to production** → Operations → Monitor and maintain

### 6. Validate Status Integrity

Check for status inconsistencies across the artifact hierarchy. Status must cascade correctly:

```text
Bolt complete → Stories complete → Unit complete (if all bolts done) → Intent complete (if all units done)
```

#### 6.1 Story Status Check

For each completed bolt:

- Read bolt's `stories` array
- Check each story file's `status` field
- **Inconsistency**: Bolt complete but story has `status: draft` or `status: in-progress`

#### 6.2 Unit Status Check

For each unit:

- Find all bolts for unit: `memory-bank/bolts/bolt-{unit}-*/bolt.md`
- Determine expected status:
  - If ANY bolt `in-progress` → unit should be `in-progress`
  - If ALL bolts `complete` → unit should be `complete`
  - If ALL bolts `planned` and at least one story defined → unit should be `stories-defined`
  - If NO bolts exist but stories exist → unit should be `stories-defined`
- **Inconsistency**: Unit status doesn't match expected based on bolt states

#### 6.3 Intent Status Check

For each intent:

- Read all unit-briefs: `{intent}/units/*/unit-brief.md`
- Determine expected status:
  - If ANY unit `in-progress` → intent should be `construction`
  - If ALL units `complete` → intent should be `complete`
  - If units defined but none started → intent should be `units-defined`
- **Inconsistency**: Intent status doesn't match expected based on unit states

#### 6.4 Report Inconsistencies

If inconsistencies found, report them:

```markdown
## ⚠️ Status Inconsistencies Detected

| Artifact | Current Status | Expected Status | Reason |
|----------|----------------|-----------------|--------|
| unit-brief: file-watcher | draft | complete | All bolts complete |
| requirements: 011-vscode-extension | units-defined | construction | Has in-progress units |

### Actions
1 - **fix**: Update all statuses to expected values
2 - **skip**: Continue without fixing
3 - **review**: Show details for each inconsistency

**Type 1 to fix inconsistencies, or 2 to skip.**
```

#### 6.5 Auto-Fix (On User Confirmation)

If user confirms fix:

- Update each artifact's frontmatter `status` field
- Update `updated` timestamp to current date
- Log changes to `memory-bank/maintenance-log.md`
- Report changes made

#### 6.6 Log to Maintenance Log

Append entry to `memory-bank/maintenance-log.md` (create if doesn't exist):

```markdown
## {ISO-8601-timestamp} - Status Sync

**Triggered by**: analyze-context integrity check

| Artifact | Old Status | New Status | Reason |
|----------|------------|------------|--------|
| {path} | {old} | {new} | {reason} |

---
```

**Example**:

```markdown
## 2025-12-26T15:30:00Z - Status Sync

**Triggered by**: analyze-context integrity check

| Artifact | Old Status | New Status | Reason |
|----------|------------|------------|--------|
| 011-vscode-extension/units/file-watcher/unit-brief.md | draft | complete | All bolts complete (1/1) |
| 011-vscode-extension/units/extension-core/unit-brief.md | draft | complete | All bolts complete (1/1) |
| 011-vscode-extension/requirements.md | units-defined | construction | Has in-progress units |

---
```

---

## Output

Provide a structured analysis:

```markdown
## Project State Analysis

### Summary
- **Phase**: {current phase}
- **Active Intent**: {name or "None"}
- **Active Unit**: {name or "None"}
- **Active Bolt**: {id or "None"}

### Evidence
- Intents found: {count} ({list names})
- Units found: {count} for {intent}
- Stories found: {count} for {unit}
- Bolts found: {count} ({status breakdown})

### Status Integrity
- ✅ All statuses consistent (or)
- ⚠️ {N} inconsistencies found (see details below)

### Current State Details
{Specific details about what exists and what's missing}

{If inconsistencies found, include the inconsistency table here}

### Actions

1 - **proceed**: Execute suggested action
2 - **explain**: Learn more about current phase
3 - **different**: Work on something else
{If inconsistencies: 4 - **fix**: Fix status inconsistencies}

### Suggested Next Step
→ **proceed** - {Specific command to run}

**Type a number or press Enter for suggested action.**
```

---

## Human Validation Point

> "Based on my analysis, you're in the {phase} phase. Does this match your understanding? If not, tell me what you're trying to accomplish."

---

## Transition

After analysis, either:

- → **Route Request** (`.specsmd/skills/master/route-request.md`) - to direct user to specialist agent
- → **Answer Question** (`.specsmd/skills/master/answer-question.md`) - if user has questions about state

---

## Test Contract

```yaml
input: Memory bank schema and artifacts
output: Project state analysis with phase, evidence, and suggested next step
checkpoints: 0 (informational only)
```
