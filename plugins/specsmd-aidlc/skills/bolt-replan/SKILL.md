---
name: bolt-replan
description: Use when the user asks to change the bolt plan during the AI-DLC Construction phase - add bolts for new or uncovered stories, split a bolt that is too large, or reorder bolts. Updates bolt files and their dependency graph.
license: MIT
metadata:
  version: "1.0.0"
  flow: aidlc
  phase: construction
disable-model-invocation: true
---

# Replan Bolts (Construction Context)

---

## Role

Utility skill to modify bolt plans during Construction - add, split, or reorder bolts.

**NO Checkpoint** - Replanning is a utility operation. Changes are validated through normal bolt execution checkpoints.

---

## Goal

Replan bolts during Construction phase - add new bolts, split existing ones, or reorder based on learnings during execution.

---

## Input

- **Required**: `--unit` - The unit to replan bolts for
- **Required**: the memory-bank schema (`references/memory-bank.yaml` in the `bolt-start` skill) - artifact schema
- **Optional**: `--action` - One of: `status`, `append`, `split`, `reorder`

---

## Process

### 1. Read Existing Bolts

**CRITICAL**: Always start by reading all existing bolts for the unit.

```markdown
## Current Bolt Status: {unit-name}

- ✅ **001-auth-service** ({bolt-type}): 001-user-signup, 002-user-login - completed - No dependencies
- ⏳ **002-auth-service** ({bolt-type}): 003-password-reset, 004-email-verify - in-progress - requires 001-auth-service
- [ ] **003-auth-service** ({bolt-type}): 005-mfa-setup - planned - requires 002-auth-service

### Summary

- **Completed**: 1
- **In Progress**: 1
- **Planned**: 1
- **Total Stories Covered**: 5
```

### 2. Determine Action

Ask user what they want to do:

```markdown
## Replanning Options

What would you like to do?

1. **View Status** - See current bolt plan and progress
2. **Append Bolts** - Add new bolts for uncovered stories or new work
3. **Split Bolt** - Break a large planned bolt into smaller ones
4. **Reorder** - Change execution order or adjust dependencies

Select an option (1-4):
```

---

## Resolving Bolt Type

Whenever this skill creates a bolt, resolve its type the same way initial bolt planning does. **Never assume a type.**

1. **Check the unit's `unit-brief.md` frontmatter** for `default_bolt_type`:

   ```yaml
   ---
   unit: 001-expense-tracker-ui
   unit_type: frontend
   default_bolt_type: simple-construction-bolt
   ---
   ```

2. **If not specified**, use defaults based on unit type:
   - `unit_type: frontend` → `simple-construction-bolt`
   - `unit_type: cli` → `simple-construction-bolt`
   - `unit_type: backend` or unspecified → `ddd-construction-bolt`

3. **If splitting an existing bolt**, the new bolts inherit the `type` of the bolt being split.

**Available bolt types** (definitions live at `references/bolt-types/{bolt-type}.md` in the `bolt-start` skill's directory):

- `ddd-construction-bolt` - For domain-heavy backend work
- `simple-construction-bolt` - For UI, integrations, utilities
- `spike-bolt` - For time-boxed investigation of high-uncertainty work

---

## Action: Append New Bolts

### When to Use

- New stories added during construction
- Discovered work not covered by existing bolts
- Need additional bolts for edge cases

### Process

1. **Check uncovered stories**:

   ```markdown
   ## Uncovered Stories

   Stories not assigned to any bolt:

   - [ ] **006-session-mgmt**: Session management - Should
   - [ ] **007-api-keys**: API key generation - Could
   ```

2. **Determine next bolt ID**:
   - List all directories in `memory-bank/bolts/`
   - Extract the 3-digit prefix from each (e.g., `015` from `015-auth-service`)
   - Find the highest number
   - Next bolt: `{next-BBB}-{unit-name}` (e.g., if highest is `015`, next is `016-auth-service`)

3. **Create new bolt(s)**:
   - Use template: `references/bolt-template.md` in this skill's directory
   - Resolve the bolt type per **Resolving Bolt Type** above
   - Set `requires_bolts` based on dependencies
   - Include complexity assessment (aggregate of included stories)
   - Update `enables_bolts` on existing bolts if needed

4. **Output**:

   ```markdown
   ## Bolts Appended

   Created 1 new bolt:

   - [ ] **004-auth-service** ({bolt-type}): 006-session-mgmt, 007-api-keys - requires 003-auth-service

   Updated dependency graph:
   001-auth-service → 002-auth-service → 003-auth-service → 004-auth-service (NEW)

   File created: `memory-bank/bolts/004-auth-service/bolt.md`
   ```

---

## Action: Split Bolt

### When to Use

- Bolt is taking too long
- Bolt scope creep discovered
- Need to parallelize work

### Rules

- 🛑 **Cannot split completed bolts**
- ⚠️ **Splitting in-progress bolt requires confirmation** (will mark current as completed at current stage)
- ✅ **Can freely split planned bolts**

### Process

1. **Select bolt to split**:

   ```markdown
   ## Select Bolt to Split

   Splittable bolts (planned or in-progress):

   - ⏳ **002-auth-service** ({bolt-type}): 003-password-reset, 004-email-verify, 005-mfa-setup - in-progress - ⚠️ Confirm to split
   - [ ] **003-auth-service** ({bolt-type}): 006-session-mgmt, 007-api-keys, 008-rate-limit - planned - ✅ Can split

   Enter bolt ID to split:
   ```

2. **Propose split**:

   ```markdown
   ## Split Proposal: 003-auth-service

   Current: 3 stories (006-session-mgmt, 007-api-keys, 008-rate-limit)

   Proposed split:

   - **003-auth-service**: 006-session-mgmt - Core feature
   - **004-auth-service**: 007-api-keys, 008-rate-limit - Related edge cases

   Accept this split? (yes/no/customize)
   ```

3. **Execute split**:
   - Archive or update original bolt file
   - Create new bolt files with next sequence number, carrying the original bolt's `type`
   - Update dependencies on dependent bolts
   - Update `enables_bolts` on prerequisite bolts

4. **Output**:

   ```markdown
   ## Bolt Split Complete

   Original: 003-auth-service (updated)

   Created:

   - [ ] **003-auth-service** ({bolt-type}): 006-session-mgmt - requires 002-auth-service
   - [ ] **004-auth-service** ({bolt-type}): 007-api-keys, 008-rate-limit - requires 003-auth-service

   Updated files:
   - `memory-bank/bolts/003-auth-service/bolt.md` (updated)
   - `memory-bank/bolts/004-auth-service/bolt.md` (created)
   - `memory-bank/bolts/002-auth-service/bolt.md` (updated enables_bolts)
   ```

---

## Action: Reorder Bolts

### When to Use

- Dependencies changed during construction
- Need to prioritize different bolt
- Discovered blocking dependency

### Rules

- 🛑 **Cannot reorder completed bolts**
- 🛑 **Cannot move bolt before its dependencies**
- ⚠️ **Reordering in-progress bolt pauses it**

### Process

1. **Show current order**:

   ```markdown
   ## Current Execution Order

   001-auth-service (completed) → 002-auth-service (in-progress) → 003-auth-service (planned) → 004-auth-service (planned)

   - 1 - **001-auth-service**: completed - ❌ Cannot move
   - 2 - **002-auth-service**: in-progress - ⚠️ Will pause if moved
   - 3 - **003-auth-service**: planned - ✅ Can move
   - 4 - **004-auth-service**: planned - ✅ Can move
   ```

2. **Get new order**:

   ```markdown
   Enter new order for planned bolts (comma-separated IDs):
   Example: 004-auth-service, 003-auth-service

   This will execute 004-auth-service before 003-auth-service.
   ```

3. **Validate dependencies**:
   - Check if new order violates any `requires_bolts`
   - Warn if dependency issue found

4. **Execute reorder**:
   - Update `requires_bolts` and `enables_bolts` in affected bolt files
   - Recalculate execution sequence

5. **Output**:

   ```markdown
   ## Reorder Complete

   New execution order:

   001-auth-service (completed) → 002-auth-service (in-progress) → 004-auth-service (planned) → 003-auth-service (planned)

   Updated files:
   - `memory-bank/bolts/003-auth-service/bolt.md` (requires_bolts updated)
   - `memory-bank/bolts/004-auth-service/bolt.md` (requires_bolts updated)
   ```

---

## Dependency Management

When modifying bolts, always update dependencies:

### Frontmatter Fields

```yaml
---
id: 003-auth-service
type: ddd-construction-bolt
requires_bolts: [002-auth-service]
enables_bolts: [004-auth-service]
requires_units: []
complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 2
---
```

The `type` value above is an example. Set it from **Resolving Bolt Type**.

Note: Do NOT use comments inside YAML frontmatter. Keep it clean.

See full template: `references/bolt-template.md` in this skill's directory.

### Validation Rules

1. **No circular dependencies**: A → B → C → A is invalid
2. **No orphaned bolts**: Every bolt (except first) must have `requires_bolts`
3. **Consistent enables/requires**: If A enables B, then B requires A

---

## Human Validation Point

> "I've analyzed the current bolt plan for `{unit-name}`. There are {n} bolts: {completed} completed, {in_progress} in progress, {planned} planned. What would you like to do? (1) View status, (2) Append bolts, (3) Split a bolt, (4) Reorder bolts"

---

## Construction Log

**IMPORTANT**: After ANY replanning action, update the construction log.

### Location

`{unit-path}/construction-log.md`

### On First Replan

If construction log doesn't exist, create it using `references/construction-log-template.md` in this skill's directory.

Initialize with:

- Original bolt plan from inception
- First replanning entry

### On Every Replan

Add entry to Replanning History:

```markdown
| {today} | {action} | {change description} | {reason} | Yes |
```

Update Current Bolt Structure to reflect changes.

### Example

After splitting 002-auth-service:

```markdown
## Replanning History

- **2025-12-07**: split - 002-auth-service → 002-auth-service, 003-auth-service - Scope too large - ✅ Approved
```

---

## Transition

After replanning:

- → invoke the `bolt-start` skill - continue execution
- → invoke the `bolt-status` skill - verify changes
- → return to Inception - if major scope change requires new stories

---

## Test Contract

```yaml
input: Unit name, action (status|append|split|reorder)
output: Updated bolt plan with dependency graph
checkpoints: 0 (utility operation)
```
