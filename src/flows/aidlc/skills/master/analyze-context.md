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

### Current State Details
{Specific details about what exists and what's missing}

### Actions

1 - **proceed**: Execute suggested action
2 - **explain**: Learn more about current phase
3 - **different**: Work on something else

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
