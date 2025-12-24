# Skill: Inception Navigator

---

## Role

Entry point for Inception Agent. Routes to appropriate skill based on state.

**NO Checkpoint** - Navigator is a routing skill, not a decision point.

---

## Goal

Present the Inception Agent's skills and guide the user to the appropriate next action.

---

## Input

- **Optional**: Current intent (from `--intent` parameter)
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Determine Context

If intent is specified, load its current state:

- Check which artifacts exist
- Identify current progress stage
- Determine logical next step

### 2. Present Menu

Build menu dynamically using the Output sections below based on current state.

### 3. Context-Aware Suggestions

Scan artifacts **in order** - first missing item is the suggested next step:

| Check (in order)              | If missing → Suggest     |
|-------------------------------|--------------------------|
| No intent folder exists       | Create Intent            |
| `requirements.md`             | Gather Requirements      |
| `system-context.md`           | Define Context           |
| `units.md`                    | Decompose Units          |
| `story-index.md`              | Create Stories           |
| `bolt-plan.md`                | Plan Bolts               |
| All complete                  | Review & Complete        |

**CRITICAL**: The suggested step becomes **Option 1** in the menu.

### 4. Handle Selection

When user selects an option:

1. Acknowledge the selection
2. Load the corresponding skill file
3. Execute with current intent context

---

## Output (No Active Intent)

```markdown
## Inception Agent

### No Active Intent

### Get Started

1 - **Create Intent** ← Start here

### Other Actions

2 - List Intents
3 - Return to Main Menu

---

**Type 1 to continue, or a number for other actions.**
```

---

## Output (With Active Intent)

**Option 1 is determined by Context-Aware Suggestions table above.**

```markdown
## Inception Agent

### Active Intent: `{intent-name}`
**Goal**: {intent goal}

### Progress
- {✅ or [ ]} Requirements gathered {← current if next step}
- {✅ or [ ]} System context defined {← current if next step}
- {✅ or [ ]} Units decomposed {← current if next step}
- {✅ or [ ]} Stories created {← current if next step}
- {✅ or [ ]} Bolts planned {← current if next step}
- [ ] Review complete {← current if all above done}

---

### Continue This Intent

1 - **{Next step from table}** ← Next step
{N} - Revisit {completed steps...}

### Other Actions

{N} - Create New Intent
{N} - List All Intents
{N} - Return to Main Menu

---

**Type 1 to continue, or a number for other actions.**
```

**Example: Requirements done, context missing**

```markdown
## Inception Agent

### Active Intent: `user-auth`
**Goal**: Implement user authentication with OAuth

### Progress
- ✅ Requirements gathered
- [ ] System context defined ← current
- [ ] Units decomposed
- [ ] Stories created
- [ ] Bolts planned
- [ ] Review complete

---

### Continue This Intent

1 - **Define Context** ← Next step
2 - Revisit Requirements

### Other Actions

3 - Create New Intent
4 - List All Intents
5 - Return to Main Menu

---

**Type 1 to continue, or a number for other actions.**
```

---

## Output (Inception Complete)

```markdown
## Inception Agent

### Intent Complete: `{intent-name}`

All inception artifacts have been created:

- ✅ Requirements gathered
- ✅ System context defined
- ✅ Units decomposed
- ✅ Stories created
- ✅ Bolts planned
- ✅ Review complete

### Summary
- Units defined: {n}
- Stories created: {n}
- Bolts planned: {n}
- Ready for Construction

### Next Step
→ Proceed to Construction: `/specsmd-construction-agent --intent="{intent-name}"`

Or create another intent.
```

---

## Transition

After user selection:

- → Load selected skill
- → Skill contains the Checkpoint markers
- → Execute skill process

---

## Test Contract

```yaml
input: Intent state (optional)
output: Menu with dynamic Option 1 based on state
checkpoints: 0 (routing only)
```
