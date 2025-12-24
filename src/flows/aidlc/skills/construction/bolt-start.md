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

### 3. Load Agent Context

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

### 4. Determine Current Stage

Based on bolt state:

- **planned** → Start with first stage, set status to `in-progress`
- **in-progress** → Continue from `current_stage`
- **completed** → Inform user bolt is done
- **blocked** → Show blocker, ask how to resolve

### 5. Execute Stage

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

### 6. Handle Checkpoints (As Defined by Bolt Type)

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

### 7. Update Bolt File

After stage completion:

- Add stage to `stages_completed` with timestamp
- Update `current_stage` to next stage
- If final stage, set `status: completed` and `completed` timestamp

**⚠️ TIMESTAMP FORMAT**: See `memory-bank.yaml` → `conventions.timestamps`

```yaml
---
status: in-progress
current_stage: {next-stage-from-bolt-type}
stages_completed:
  - {stage-name}: {timestamp}
---
```

**On bolt completion**, also update:

```yaml
completed: {timestamp}
```

### 8. Continue or Complete

Based on condition:

- **More stages remain** → Proceed to next stage
- **Final stage complete** → Mark bolt complete, suggest next bolt
- **User stops** → Save progress, can resume later

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
