# Skill: Bolt Status

---

## Role

Informational skill to display detailed status of a specific bolt.

**NO Checkpoint** - This is a read-only status skill, not a decision point.

---

## Goal

Display detailed status of a specific bolt instance including stage progress, artifacts created, and blockers.

---

## Input

- **Required**: `--bolt-id` - The bolt instance ID
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Load Bolt File

Read bolt file from path defined by `schema.bolts`:

- Parse frontmatter for metadata
- Extract: status, type, current_stage, stages_completed, stories

### 2. Load Bolt Type Definition

Read the bolt type from `.specsmd/aidlc/templates/construction/bolt-types/{bolt_type}.md`:

- Get total stages for this bolt type
- Get stage names and expected outputs

### 3. Verify Artifacts

For each completed stage, verify artifacts exist based on bolt type definition:

- ✅ **{stage-1-name}**: `{artifact-from-bolt-type}` - Found
- ✅ **{stage-2-name}**: `{artifact-from-bolt-type}` - Found
- ⏳ **{current-stage}**: {expected-output} - In Progress

*Note: Artifact names come from the bolt type definition, not hardcoded here.*

### 4. Calculate Metrics

```markdown
### Progress Metrics
- **Stages**: {completed}/{total} ({percentage}%)
- **Stories**: {stories covered}
- **Started**: {start date}
- **Elapsed**: {time since start}
```

### 5. Identify Blockers

Check for issues:

- Missing prerequisite bolts
- Failed tests
- Unresolved design decisions
- External dependencies

---

## Output

```markdown
## Bolt Status: {bolt-id}

### Overview

- **ID**: `{bolt-id}`
- **Unit**: `{unit-name}`
- **Intent**: `{intent-name}`
- **Type**: {bolt-type}
- **Status**: {planned|in-progress|completed|blocked}

### Progress
[██████████░░░░░░░░░░] 50% (2/4 stages)

### Stage Breakdown

- ✅ **1. {stage-1}**: Complete → `{artifact-1}`
- ✅ **2. {stage-2}**: Complete → `{artifact-2}`
- ⏳ **3. {stage-3}**: Current ← working
- [ ] **4. {stage-4}**: Pending

*Stage names and artifacts are read from the bolt type definition.*

### Stories Covered

- ✅ **{SSS}-{story-slug}**: {story-title} - Implemented
- ⏳ **{SSS}-{story-slug}**: {story-title} - In Progress

### Artifacts Created

- `memory-bank/bolts/{bolt-id}/{artifact-1}` (from bolt type)
- `memory-bank/bolts/{bolt-id}/{artifact-2}` (from bolt type)
- `src/{unit}/...` (implementation files)

### Current Stage Details
**Stage**: {current_stage}
**Activities**:
- {activity 1}
- {activity 2}

**Expected Output**:
- {output 1}

### Blockers
{None | List of blockers with details}

### Next Action
→ Continue with {current_stage} stage
→ Command: `bolt-start --bolt-id="{bolt-id}"`
```

---

## Output (Completed Bolt)

```markdown
## Bolt Status: {bolt-id}

### Overview

- **Status**: ✅ **COMPLETED**
- **Completed**: {date}
- **Duration**: {time}

### All Stages Complete

- ✅ **1. {stage-1}**: {date} → `{artifact-1}`
- ✅ **2. {stage-2}**: {date} → `{artifact-2}`
- ✅ **3. {stage-3}**: {date} → {output-3}
- ✅ **4. {stage-4}**: {date} → {output-4}

*Stage names and artifacts are read from the bolt type definition.*

### Stories Delivered

- ✅ **{SSS}-{story-slug}**: {story-title} - All criteria passed
- ✅ **{SSS}-{story-slug}**: {story-title} - All criteria passed

### Summary
All {n} stories implemented and tested.

### Next Action
→ Start next bolt: `bolt-start --bolt-id="{next-bolt}"`
→ Or proceed to Operations if all bolts complete
```

---

## Human Validation Point

> "Bolt `{bolt-id}` is {status}. {summary}. Would you like to continue working on it or view another bolt?"

---

## Transition

After viewing status:

- → **Bolt Start** (`.specsmd/skills/construction/bolt-start.md`) - continue the bolt
- → **Bolt List** (`.specsmd/skills/construction/bolt-list.md`) - view other bolts
- → **Operations Agent** - if all bolts for unit are complete

---

## Test Contract

```yaml
input: Bolt ID
output: Detailed status with stage progress, artifacts, blockers
checkpoints: 0 (informational only)
```
