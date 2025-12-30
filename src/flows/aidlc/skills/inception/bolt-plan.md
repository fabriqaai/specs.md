# Skill: Plan Bolts

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [x] Intent created
- [x] Requirements gathered
- [ ] Generating artifacts...  ← current
    - [x] System Context
    - [x] Units
    - [x] Stories
    - [ ] Bolt Plan  ← this skill
- [ ] Artifacts reviewed (Checkpoint 3)
- [ ] Ready for Construction
```

---

## Checkpoints in This Skill

**NO INDIVIDUAL Checkpoint** - This skill is part of the batched artifact generation.

All artifacts (Context, Units, Stories, Bolts) are reviewed together at **Checkpoint 3** in the `review` skill.

---

## Goal

Group User Stories into logical Bolts (execution sessions) that will guide the Construction Phase.

---

## Input

- **Required**: Unit name
- **Required**: `unit-brief.md` for the unit (contains `default_bolt_type` if specified)
- **Required**: Stories for the unit (`stories/*.md`)
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Required**: `.specsmd/aidlc/templates/standards/catalog.yaml` - project type definitions

---

## Process

### 1. Analyze Stories

Review all stories to understand:

- Dependencies between stories
- Complexity and effort estimates
- Logical groupings by domain/feature

### 2. Determine Bolt Type

**Read bolt type from unit-brief.md or use default based on unit type.**

1. **Check unit-brief.md frontmatter** for `default_bolt_type`:

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

3. **Bolt type templates** are located at:
   `.specsmd/aidlc/templates/construction/bolt-types/{bolt-type}.md`

**Available bolt types**:

- `ddd-construction-bolt` - For domain-heavy backend work (5 stages)
- `simple-construction-bolt` - For UI, integrations, utilities (3 stages)

### 3. Assess Story Complexity

For each story, evaluate these factors:

| Factor | Question | Low (1) | Medium (2) | High (3) |
|--------|----------|---------|------------|----------|
| **Complexity** | How intricate is the logic? | CRUD, known patterns | Business rules, validation | Novel algorithms, complex logic |
| **Uncertainty** | How clear are requirements? | Fully specified | Some ambiguity | Many unknowns (→ spike) |
| **Dependencies** | What external things does it need? | Self-contained | Internal APIs/units | External systems, 3rd party |
| **Testing** | What validation is needed? | Unit tests | Integration tests | E2E + manual validation |

### 4. Group Stories into Bolts

**Grouping rules:**

1. **Cohesion**: Stories for same domain concept → same bolt
2. **Dependencies**: Story A needs Story B → same or adjacent bolt
3. **Balance**: Mix high + low complexity stories
4. **Limit**: Max 5-6 stories per bolt
5. **Risk**: Any story with High (3) Uncertainty → spike bolt first

**Suggested groupings:**

- **Bolt 1**: Setup & Core Entities (foundational stories)
- **Bolt 2**: Primary Operations (main CRUD/business logic)
- **Bolt 3**: Integration & Edge Cases (advanced stories)

### 5. Analyze Dependencies

**CRITICAL**: Before defining sequence, analyze ALL dependencies:

#### 5a. Story Dependencies (within bolt)

For each story, check:

- Does it depend on another story's output?
- Does it require data/models from another story?

#### 5b. Bolt Dependencies (within unit)

For each bolt, determine:

- `requires_bolts`: Which bolts must complete first?
- `enables_bolts`: Which bolts are waiting on this one?

#### 5c. Unit Dependencies (cross-unit)

For each bolt, check if it depends on another unit:

- `requires_units`: Which units must be complete?
- Example: `api-bolt-1` may require `auth-service` unit to be complete

**Dependency Analysis Output**:

```markdown
## Dependency Analysis

### Within-Unit Dependencies

- **bolt-auth-2** requires bolt-auth-1 (Needs User entity)
- **bolt-auth-3** requires bolt-auth-2 (Needs Auth service)

### Cross-Unit Dependencies

- **bolt-api-1** requires auth-service unit (Needs auth tokens)
- **bolt-payment-1** requires user-service unit (Needs user data)

### Dependency Warnings
- ⚠️ bolt-api-1 blocked until auth-service unit complete
- ⚠️ Circular dependency detected: {if any}
```

### 6. Define Bolt Sequence

Establish execution order based on dependencies:

```markdown
## Bolt Sequence

```text

[Bolt 1] ──► [Bolt 2] ──► [Bolt 3]
   │            │
   ▼            ▼
 Entity      API Layer
 Setup       Implementation

```

## Cross-Unit Dependencies

```text

[auth-service] ──► [api-service]
                        │
                        ▼
                   [payment-service]

```

### 7. Create Bolt Instance Files (CRITICAL)

**⚠️ YOU MUST CREATE INDIVIDUAL BOLT DIRECTORIES WITH bolt.md FILES**
**⚠️ DO NOT CREATE A SUMMARY DOCUMENT CALLED "bolt-plan.md"**

1. **Read Path**: Check `schema.bolts` from `.specsmd/aidlc/memory-bank.yaml`
   *(Default: `memory-bank/bolts/{bolt-id}/`)*

2. **Determine Bolt ID**:
   - List all directories in `memory-bank/bolts/`
   - Extract the 3-digit prefix from each (e.g., `015` from `015-auth-service`)
   - Find the highest number
   - Next bolt uses the next available number (e.g., if highest is `015`, next is `016`)

   **⚠️ CRITICAL**: The `{BBB}` prefix is a **GLOBAL** sequence across ALL bolts in `memory-bank/bolts/`, NOT per-unit.

3. **Create Directory + File Per Bolt**:
   For EACH bolt in the plan:
   - Create directory: `memory-bank/bolts/{BBB}-{unit-name}/`
   - Create file inside: `memory-bank/bolts/{BBB}-{unit-name}/bolt.md`
   - Use template: `.specsmd/aidlc/templates/construction/bolt-template.md`

   **Naming Convention** (from `memory-bank.yaml`):
   - Format: `{BBB}-{unit-name}/` where BBB is a **GLOBAL** 3-digit sequence
   - The number is global across ALL bolts in `memory-bank/bolts/` (not per-unit)
   - Example sequence: `001-auth-service/`, `002-auth-service/`, `003-payment-service/`, `004-auth-service/`

   **Example**: Planning bolts across multiple units (global numbering):

   ```text
   memory-bank/bolts/
   ├── 001-auth-service/bolt.md     ← First bolt ever created
   ├── 002-auth-service/bolt.md     ← Second bolt (same unit, continues sequence)
   ├── 003-payment-service/bolt.md  ← Third bolt (different unit)
   ├── 004-auth-service/bolt.md     ← Fourth bolt (back to auth-service)
   └── 005-api-gateway/bolt.md      ← Fifth bolt (another unit)
   ```

   **Stage artifacts will be added to same directory during construction:**

   ```text
   memory-bank/bolts/001-auth-service/
   ├── bolt.md                      ← You create this now
   └── {stage-artifacts}            ← Created during construction (varies by bolt type)
   ```

   *Note: Artifact names depend on bolt type (e.g., DDD bolts create `ddd-01-domain-model.md`, simple bolts create `implementation-plan.md`).*

4. **Bolt File Structure** (CRITICAL: Include all dependencies in frontmatter):

   ```markdown
   ---
   id: {BBB}-{unit-name}
   unit: {UUU}-{unit-name}
   intent: {NNN}-{intent-name}
   type: {bolt-type}  # From unit-brief.md or default (ddd-construction-bolt, simple-construction-bolt)
   status: planned
   stories: [story-1, story-2]
   created: {date}

   # Dependency Tracking (REQUIRED)
   requires_bolts: [001-auth-service]       # Bolts that must complete first
   enables_bolts: [003-auth-service, 001-api-service] # Bolts that depend on this
   requires_units: [auth-service]           # Units that must be complete
   blocks: false                            # true if waiting on dependency

   # Complexity Assessment (aggregate of included stories)
   complexity:
     avg_complexity: 2        # 1=Low, 2=Medium, 3=High
     avg_uncertainty: 1       # 1=Low, 2=Medium, 3=High
     max_dependencies: 2      # Highest dependency score among stories
     testing_scope: 2         # 1=Unit, 2=Integration, 3=E2E
   ---

   ## Bolt: {BBB}-{unit-name}

   ### Objective
   {What this bolt will accomplish}

   ### Stories Included

   - [ ] **{story-id}**: {description} - Priority: {priority}

   ### Expected Outputs
   - {artifact 1}
   - {artifact 2}

   ### Dependencies

   #### Bolt Dependencies (within intent)

   - **001-auth-service** (Required): Completed
   - **002-auth-service** (Optional): In Progress

   #### Unit Dependencies (cross-unit)

   - **auth-service**: Needs auth tokens - Completed

   #### Enables (other bolts waiting on this)
   - 003-auth-service
   - 001-api-service
   ```

### 9. Validate Plan

Check the plan against:

**Frontmatter Validation (CRITICAL - check each bolt.md)**:

- [ ] `id` - Bolt identifier present
- [ ] `unit` - Parent unit ID present
- [ ] `intent` - Parent intent ID present
- [ ] `type` - Bolt type specified (`ddd-construction-bolt` or `simple-construction-bolt`)
- [ ] `status` - Set to `planned`
- [ ] `stories` - **Array of story IDs included** (NOT just in body, MUST be in frontmatter)
- [ ] `created` - Timestamp present
- [ ] `requires_bolts` - Dependency array present (can be empty `[]`)
- [ ] `enables_bolts` - Enables array present (can be empty `[]`)
- [ ] `complexity` - Complexity block with all 4 fields

**Content Validation**:

- [ ] All stories are assigned to bolts
- [ ] Dependencies are respected (bolt-to-bolt AND unit-to-unit)
- [ ] Each bolt has clear outputs
- [ ] No bolt is too large (max 5-6 stories)
- [ ] No circular dependencies exist
- [ ] Cross-unit dependencies are explicit

---

## Output

### Directories & Files Created (REQUIRED)

**⚠️ YOU MUST CREATE THESE DIRECTORIES AND FILES:**

```text
memory-bank/bolts/{BBB}-{unit-name}/bolt.md  ← CREATE THIS DIRECTORY AND FILE
```

**Naming Convention** (from `memory-bank.yaml`):

- Format: `{BBB}-{unit-name}/` where BBB is a global 3-digit sequence
- Example: `001-auth-service/`, `002-auth-service/`, `016-analytics-tracker/`

**⚠️ DO NOT CREATE:**

- `bolt-plan.md` (summary doc)
- `README.md` files
- Flat files like `001-auth-service.md` (must be in directory)
- Old format like `bolt-{unit}-1/` (incorrect)

### Summary (displayed to user)

```markdown
## Bolt Plan Complete: {unit-name}

### Bolts Created

- [ ] **001-auth-service** ({bolt-type}): 001-user-signup, 002-user-login
- [ ] **002-auth-service** ({bolt-type}): 003-password-reset, 004-email-verify
- [ ] **003-auth-service** ({bolt-type}): 005-mfa-setup

### Dependency Graph
001-auth-service ──► 002-auth-service ──► 003-auth-service

### Directories Created
✅ `memory-bank/bolts/001-auth-service/bolt.md`
✅ `memory-bank/bolts/002-auth-service/bolt.md`
✅ `memory-bank/bolts/003-auth-service/bolt.md`

### Total
- {n} bolts created
- {n} stories covered
```

**No menu** - Skill complete, return to agent.

---

## Test Contract

```yaml
input: Stories for unit
output: Bolt directories with bolt.md files
checkpoints: 0 (part of Checkpoint 3 batch)
```
