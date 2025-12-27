# Skill: Construction Navigator

---

## Role

Entry point for Construction Agent. Routes to appropriate skill based on state.

**NO Checkpoint** - Navigator is a routing skill, not a decision point.

---

## Progress Display

Show workflow position with checkpoint markers:

```text
### Construction Workflow (2 Checkpoints per Bolt)

[Checkpoint 1] Which bolt to work on? --> bolt-list skill
      |
[Domain + Logical Design]
      |
[Checkpoint 2] Design Review --> bolt-start skill
      |
[Code + Tests] --> Auto-validate if tests pass
      |
[What's Next?] --> Next bolt / Done
```

---

## Goal

Present the Construction Agent's skills and guide the user to the appropriate next action.

---

## Input

- **Optional**: `--unit` - Current unit context
- **Optional**: `--bolt-id` - Current bolt context
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Determine Context

Load current construction state:

- Check for in-progress bolts
- Identify which units have planned bolts
- Calculate overall construction progress

### 2. Present Menu

```markdown
## Construction Agent

{Context section if bolt/unit is active}

### Skills

1 - **List Bolts**: View all bolts and status (`bolt-list`)
2 - **Bolt Status**: Detailed status of a bolt (`bolt-status --bolt-id="{id}"`)
3 - **Start/Continue Bolt**: Execute bolt stages (`bolt-start --bolt-id="{id}"`)
4 - **Plan Bolts**: Plan new bolts → Inception (`bolt-plan --unit="{unit}"`)

### Current State
{Show in-progress bolts and overall progress}

### Suggested Next Step
→ {Recommended action based on state}

**Type a number (1-4) or specify a bolt ID to work on.**
```

### 3. Context-Aware Suggestions

Based on construction state, suggest actions:

- **No bolts planned** → Redirect to Inception for planning
- **Bolts planned, none started** → Start first bolt
- **Bolt in-progress** → Continue current bolt
- **Bolt blocked** → Show blocker, suggest resolution
- **All bolts complete for unit** → Proceed to Operations

### 4. Handle Selection

When user selects an option:

1. Acknowledge the selection
2. Load the corresponding skill file
3. Execute with current context

---

## Output (With Active Bolt)

```markdown
## Construction Agent

### Active Bolt: `{bolt-id}`
**Unit**: `{unit-name}`
**Type**: {bolt-type}
**Stage**: {current_stage} ({n}/{total})

### Progress
[████████████░░░░░░░░] 60% (3/5 stages)

### Quick Actions

1 - **Continue Current Bolt**: Resume work (`bolt-start --bolt-id="{bolt-id}"`)
2 - **View Bolt Status**: Detailed status (`bolt-status --bolt-id="{bolt-id}"`)
3 - **List All Bolts**: See all bolts (`bolt-list`)
4 - **Switch Bolt**: Select a different bolt

### Suggested Next Step
→ Continue working on `{bolt-id}` - currently at {stage} stage

**Press Enter to continue or type a number.**
```

---

## Output (No Active Bolt)

```markdown
## Construction Agent

### No Active Bolt

### Available Bolts

- [ ] `001-auth-service` (auth-service, DDD) - planned
- [ ] `002-auth-service` (auth-service, DDD) - planned
- [ ] `003-api-gateway` (api-gateway, Simple) - planned

### Quick Actions

1 - **Start 001-auth-service**: Begin first bolt
2 - **List all bolts**: View with details
3 - **View bolt status**: Check specific bolt

### Suggested Next Step
→ Start construction with `001-auth-service`

**Type a number or enter a bolt ID.**
```

---

## Output (All Bolts Complete)

```markdown
## Construction Agent

### Construction Complete for Unit: `{unit-name}`

All {n} bolts have been completed:

- ✅ `001-{unit-name}` - Completed 2024-12-05 (3h)
- ✅ `005-{unit-name}` - Completed 2024-12-06 (4h)

### Summary
- Stories delivered: {n}
- Tests passing: ✅
- Ready for deployment

### Next Step
→ Proceed to Operations: `/specsmd-operations-agent --unit="{unit}"`

Or work on another unit's bolts.
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
input: Unit/bolt state (optional)
output: Menu with skill options, suggested next step
checkpoints: 0 (routing only)
```
