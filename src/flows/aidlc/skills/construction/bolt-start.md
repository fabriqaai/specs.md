# Skill: Start/Continue Bolt

---

## Bolt Type Execution

Stages, activities, outputs, and checkpoints come from the bolt type definition:
`.specsmd/aidlc/templates/construction/bolt-types/{bolt_type}.md`

**ALWAYS read bolt type first. Never assume stages or checkpoints.**

---

## Goal

Execute a bolt instance through its defined stages, producing artifacts with human validation at checkpoints defined by the bolt type.

---

## Input

- **Required**: `--bolt-id` - The bolt instance ID
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--stage` - Specific stage to execute (for resuming)

---

## Process

### 1. Load Bolt Context

Read bolt file from path defined by `schema.bolts`:

- Verify bolt exists and is not completed
- Extract: bolt_type, unit, intent, stories, current_stage

### 2. Load Bolt Type Definition (CRITICAL)

**Using the bolt_type extracted in Step 1**, load the bolt type definition:

**Location**: `.specsmd/aidlc/templates/construction/bolt-types/{bolt_type}.md`

**This step is NON-NEGOTIABLE. You MUST:**

1. Read the bolt type file COMPLETELY before any stage execution
2. Extract and understand:
   - **Stages**: Names, sequence, count
   - **Activities**: What to do in each stage
   - **Outputs**: Artifacts to produce
   - **Constraints**: Forbidden actions per stage
   - **Completion Criteria**: How to know a stage is done
   - **Checkpoints**: Where to pause for human validation

**The bolt type IS the execution plan. Follow it exactly.**

```text
┌────────────────────────────────────────────────────────────┐
│  bolt instance defines bolt_type                           │
│  bolt_type definition dictates stages and execution        │
│  bolt-start does NOT define stages or checkpoints          │
└────────────────────────────────────────────────────────────┘
```

### 3. Load Unit Context (CRITICAL)

**After extracting the unit from the bolt file, load its brief for context.**

Load `{intent}/units/{unit}/unit-brief.md` which contains:

- **Purpose and scope**: What the unit is responsible for
- **Key entities**: Domain concepts to work with
- **Technical constraints**: Specific limitations
- **Dependencies**: Other units this depends on
- **Unit type and bolt type**: Frontend vs backend, DDD vs simple

This context is essential for understanding what you're building.

### 4. Load Agent Context

Load context as defined in `.specsmd/aidlc/context-config.yaml` for the `construction` agent:

```yaml
agents:
  construction:
    required_context:
      - path: standards/tech-stack.md
      - path: standards/coding-standards.md
    optional_context:
      - path: standards/system-architecture.md
      - path: standards/api-conventions.md
```

1. Load all `required_context` files (warn if missing with `critical: true`)
2. Load `optional_context` files if they exist

**Note**: This is agent-level context. Bolt-type-specific context loading may be added later.

### 5. Determine Current Stage

Based on bolt state:

- **planned** → Start with first stage, update bolt file immediately (see Step 6)
- **in-progress** → Continue from `current_stage`
- **completed** → Inform user bolt is done
- **blocked** → Show blocker, ask how to resolve

### 6. Update Bolt File on Start (CRITICAL - DO FIRST)

**⚠️ BEFORE any stage work begins, update the bolt file IMMEDIATELY.**

When transitioning from `planned` to `in-progress`:

```yaml
---
status: in-progress          # was: planned
started: {ISO-8601-timestamp} # was: null
current_stage: {first-stage}  # was: null (e.g., "domain-model")
---
```

**This is NON-NEGOTIABLE.** The bolt file must reflect that work has begun before any stage activities start. This ensures:

1. Progress is tracked even if execution is interrupted
2. Other tools/agents see accurate status
3. Resumption works correctly

**Also update construction log** (see "Update Construction Log" section below).

### 7. Execute Stage

For the current stage, follow the bolt type definition:

1. **Present Stage Context**:

   ```markdown
   ## Stage: {stage-name}

   ### Objective
   {From bolt type definition}

   ### Activities
   {From bolt type definition}

   ### Expected Output
   {From bolt type definition}

   ### Stories in Scope
   {From bolt instance}
   ```

2. **Perform Activities**:
   - Follow bolt type's activity instructions exactly
   - Create artifacts as specified
   - Respect constraints (e.g., "no code in this stage")

3. **Generate Outputs**:
   - Create specified output artifacts
   - Use templates if specified by bolt type
   - Place in correct paths per schema

### 8. Handle Checkpoints (As Defined by Bolt Type)

The bolt type definition specifies:

- **Which stages have checkpoints**
- **What to present at each checkpoint**
- **What approval means**

If the current stage has a checkpoint:

```text
## Stage Complete: {stage-name}

{Present summary as specified by bolt type}

Ready to proceed?
1 - Approve and continue
2 - Need changes (specify)
```

**Wait for user response before proceeding.**

If the bolt type specifies automatic validation criteria, follow those rules.

### 8b. Final Stage Checkpoint (CRITICAL RE-READ)

**⚠️ If this is the FINAL stage of the bolt**, before presenting completion:

1. **STOP** and re-read **Step 10** from this skill
2. This step is often skipped due to context distance - re-reading prevents this
3. Do NOT report bolt as complete until you have executed Step 10

```text
┌─────────────────────────────────────────────────────────────┐
│  FINAL STAGE DETECTED                                       │
│  → Re-read Step 10 NOW                                     │
│  → You MUST run: node .specsmd/aidlc/scripts/bolt-complete.js │
│  → Do NOT manually edit story files                        │
└─────────────────────────────────────────────────────────────┘
```

### 9. Update Bolt File on Stage Completion

**Trigger**: After EACH stage completion (not just final stage).

After each stage completion:

- Add stage to `stages_completed` with timestamp
- Update `current_stage` to next stage

**⚠️ TIMESTAMP FORMAT**: See `memory-bank.yaml` → `conventions.timestamps`

```yaml
---
status: in-progress
current_stage: {next-stage-from-bolt-type}
stages_completed:
  - name: {stage-name}
    completed: {timestamp}
    artifact: {artifact-filename}
---
```

**If this is the FINAL stage**, proceed to **Step 10** (bolt completion).

**If this is NOT the final stage**, update bolt file and proceed to next stage. Stop here.

---

### 10. Mark Bolt Complete (HARD GATE - MANDATORY ON FINAL STAGE)

**Trigger**: ONLY when this is the FINAL stage.

```text
⛔ HARD GATE - SCRIPT EXECUTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You CANNOT report bolt completion without:
1. Running the bolt-complete.js script
2. Showing the script output to the user

If you skip this, the memory-bank becomes inconsistent.
Do NOT manually edit story files - the script handles everything.
```

**Run this command:**

```bash
node .specsmd/aidlc/scripts/bolt-complete.js {bolt-id}
```

**What this command does (deterministically):**

1. Updates bolt file to `status: complete`
2. Updates ALL stories in bolt's `stories` array to `status: complete, implemented: true`
3. Updates unit status if all bolts for unit are complete
4. Updates intent status if all units for intent are complete

**Example output:**

```text
════════════════════════════════════════
Bolt Completion: 016-analytics-tracker
════════════════════════════════════════

Bolt: 016-analytics-tracker
Intent: 007-installer-analytics
Unit: analytics-tracker
Stories: 12

✓ Bolt status: in-progress → complete

Updating stories:
  ✓ 001-initialize-mixpanel - draft → complete
  ✓ 002-generate-machine-hash - draft → complete
  ...

Stories: 12 updated, 0 skipped, 0 errors

✓ Unit status: in-progress → complete
✓ Intent status: construction → complete

════════════════════════════════════════
✓ Bolt Complete: 016-analytics-tracker
════════════════════════════════════════
```

**Do NOT manually edit story files.** The command handles everything deterministically.

**Verify the script completed successfully:**

After running the command, verify the changes were applied correctly:

- [ ] **Bolt file updated**:
  - [ ] `status: complete`
  - [ ] `current_stage: null`
  - [ ] `completed: {timestamp}` set

- [ ] **Stories updated** (sample 2-3 from the bolt's stories array):
  - [ ] `status: complete`
  - [ ] `implemented: true`

- [ ] **Unit status updated** (if all bolts for this unit are complete):
  - [ ] Check `{intent}/units/{unit}/unit-brief.md` → `status: complete`

- [ ] **Intent status updated** (if all units for this intent are complete):
  - [ ] Check `{intent}/intent.md` → `status: complete`

**If any verification fails**, the script may have encountered an error. Check the console output for error messages.

---

## Update Construction Log

**IMPORTANT**: Update the construction log at key execution points.

### Location

`{unit-path}/construction-log.md`

### On First Bolt Start

If construction log doesn't exist, create it using template:
`.specsmd/aidlc/templates/construction/construction-log-template.md`

### On Bolt Start

```markdown
- **{ISO-8601-timestamp}**: {bolt-id} started - Stage 1: {stage-name}
```

### On Stage Completion

```markdown
- **{ISO-8601-timestamp}**: {bolt-id} stage-complete - {stage-name} → {next-stage}
```

### On Bolt Completion

```markdown
- **{ISO-8601-timestamp}**: {bolt-id} completed - All {n} stages done
```

---

## Output (Stage Execution)

```markdown
## Executing Bolt: {bolt-id}

### Current Stage: {stage-name}
**Type**: {bolt-type}
**Progress**: Stage {n} of {total}

### Activities Performed
1. ✅ {activity 1}
2. ✅ {activity 2}
3. ⏳ {activity 3 - in progress}

### Artifacts Created
- `{path/to/artifact}` - {description}

### Stories Addressed
- ✅ **{SSS}-{story-slug}**: {criteria} - Complete
- ⏳ **{SSS}-{story-slug}**: {criteria} - In Progress

---

### Checkpoint (if defined by bolt type)
> "{checkpoint prompt from bolt type definition}"
```

---

## Output (Bolt Completed)

```markdown
## Bolt Complete: {bolt-id}

### Summary
- **Type**: {bolt-type}
- **Duration**: {time elapsed}
- **Stages Completed**: {all stages from bolt type}

### Artifacts Produced
{List artifacts as defined by bolt type}

### Stories Delivered
- ✅ **{SSS}-{story-slug}**: Complete
- ✅ **{SSS}-{story-slug}**: Complete

### Actions

1 - **next**: Start next bolt
2 - **list**: Review all bolts for this unit
3 - **operations**: Proceed to Operations (if all complete)

**Type a number or press Enter for suggested action.**
```

---

## Bolt Completion Checklist

**Use this checklist to verify all completion tasks are done:**

```text
□ Bolt file updated:
  □ status: complete
  □ completed: {timestamp}
  □ current_stage: null

□ Stories updated (Step 10):
  □ Each story in bolt's stories array:
    □ status: complete
    □ implemented: true

□ Status cascade checked (Step 11):
  □ Unit status updated if all bolts complete
  □ Intent status updated if all units complete

□ Construction log updated:
  □ "{bolt-id} completed" entry added
```

---

## Transition

After bolt completion:

- → **Next Bolt** - if more bolts in unit
- → **Operations Agent** - if all unit bolts complete

---

## Test Contract

```yaml
input: bolt-id, bolt type definition
output: Artifacts as defined by bolt type
checkpoints: As defined by bolt type (0 to N)
```
