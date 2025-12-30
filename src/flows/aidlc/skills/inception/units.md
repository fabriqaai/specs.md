# Skill: Decompose into Units

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [x] Intent created
- [x] Requirements gathered
- [ ] Generating artifacts...  ← current
    - [x] System Context
    - [ ] Units  ← this skill
    - [ ] Stories
    - [ ] Bolt Plan
- [ ] Artifacts reviewed (Checkpoint 3)
- [ ] Ready for Construction
```

---

## Checkpoints in This Skill

**NO INDIVIDUAL Checkpoint** - This skill is part of the batched artifact generation.

All artifacts (Context, Units, Stories, Bolts) are reviewed together at **Checkpoint 3** in the `review` skill.

---

## Goal

Break the Intent into independently deployable Units of Work based on project type configuration.

---

## Input

- **Required**: Intent name
- **Required**: `requirements.md` for the intent
- **Required**: `system-context.md` for the intent
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Required**: `memory-bank/project.yaml` - project configuration (for project_type)
- **Required**: `.specsmd/aidlc/templates/standards/catalog.yaml` - project type definitions

---

## Process

### 1. Load Project Type Configuration

**CRITICAL**: Before decomposing, understand what types of units to create.

1. **Read project type** from `memory-bank/project.yaml`:

   ```yaml
   project_type: full-stack-web  # or backend-api, frontend-app, cli-tool, library
   ```

2. **Read unit structure** from `catalog.yaml` under `project_types.{project_type}.unit_structure`:

   ```yaml
   unit_structure:
     backend:
       enabled: true
       decomposition: domain-driven
       default_bolt_type: ddd-construction-bolt
     frontend:
       enabled: true
       decomposition: feature-based
       default_bolt_type: simple-construction-bolt
       naming_pattern: "{intent}-ui"
   ```

3. **Determine which unit types to create**:
   - If `backend.enabled: true` → Create backend service units using domain-driven decomposition
   - If `frontend.enabled: true` → Create a frontend unit for UI work
   - If `cli.enabled: true` → Create CLI command units

**If project.yaml doesn't exist**, default to `backend-api` behavior (backend only).

---

### 2. Analyze Domain (Backend Units)

**Skip this step if `backend.enabled: false`.**

Review requirements and context to identify:

- **Bounded Contexts**: "What distinct domains exist?"
- **Aggregates**: "What are the core entities and their boundaries?"
- **Services**: "What operations span multiple entities?"
- **Integration Points**: "Where do contexts communicate?"

### 3. Apply Decomposition Criteria (Backend Units)

**Skip this step if `backend.enabled: false`.**

For each potential unit, verify:

- [ ] **Single Responsibility**: Does it do one thing well? (Required)
- [ ] **Independence**: Can it be built/tested separately? (Required)
- [ ] **Deployability**: Can it be deployed independently? (Preferred)
- [ ] **Clear Interface**: Are inputs/outputs well-defined? (Required)
- [ ] **Cohesion**: Do its parts belong together? (Required)

### 4. Map Requirements to Units

**CRITICAL**: Each FR from requirements.md must be assigned to exactly one unit.

```markdown
## Requirement-to-Unit Mapping

- **FR-1**: {description} → `{unit-name}`
- **FR-2**: {description} → `{unit-name}`
- **FR-3**: {description} → `{unit-name}`
```

This mapping ensures:

- Every FR is accounted for
- Units have clear scope based on assigned FRs
- Stories will be created from unit's assigned FRs (not directly from intent)

### 5. Create Frontend Unit (if enabled)

**Skip this step if `frontend.enabled: false`.**

When `frontend.enabled: true` in the project type configuration, create a frontend unit:

```markdown
### Unit N: {intent}-ui

- **Purpose**: Frontend application (pages, components, state management)
- **Responsibility**: User interface and client-side logic
- **Assigned Requirements**: All user-facing FRs
- **Dependencies**: All backend service units
- **Interface**: Consumes APIs from backend units
- **Unit Type**: frontend
- **Default Bolt Type**: simple-construction-bolt
```

**Frontend unit characteristics**:

- Named using `naming_pattern` from catalog (default: `{intent}-ui`)
- Depends on ALL backend service units
- Uses `simple-construction-bolt` (not DDD)
- Assigned all user-facing requirements (UI, UX, interactions)

**Include in unit-brief.md**:

```yaml
---
unit: {UUU}-{intent}-ui
unit_type: frontend
default_bolt_type: simple-construction-bolt
---
```

**Note**: The `unit` field uses the full folder name including the numeric prefix (e.g., `001-auth-service`, `002-auth-service-ui`). This matches the folder structure and enables direct path construction in scripts.

---

### 6. Propose Unit Structure

Present proposed decomposition with their assigned requirements:

```markdown
## Proposed Units

### Unit 1: {unit-name}
- **Purpose**: {what it does}
- **Responsibility**: {single responsibility}
- **Assigned Requirements**: FR-1, FR-2
- **Dependencies**: {other units it depends on}
- **Interface**: {how other units interact with it}

### Unit 2: {unit-name}
- **Assigned Requirements**: FR-3, FR-4
...

### Unit N: {intent}-ui (if frontend enabled)
- **Purpose**: Frontend application
- **Unit Type**: frontend
- **Dependencies**: All backend units
```

### 7. Document Units

1. **Read Path**: Check `schema.units` from `.specsmd/aidlc/memory-bank.yaml`
   *(Default: `memory-bank/intents/{intent-name}/units.md`)*

2. **Create Central List**:
   Update `units.md` with all units for this intent

3. **Create Unit Directories**:
   For each unit: `{schema.units}/{UUU}-{unit-name}/`

4. **Create Unit Brief** (CRITICAL):
   For each unit, create `{UUU}-{unit-name}/unit-brief.md` using `.specsmd/aidlc/templates/inception/unit-brief-template.md`

   This brief is the **input for Construction Agent**. Include:
   - Purpose and scope
   - Key entities and operations
   - Dependencies on other units
   - Technical constraints
   - Success criteria

   Example frontmatter:

   ```yaml
   ---
   unit: {UUU}-{unit-name}
   intent: {NNN}-{intent-name}
   phase: inception
   status: draft
   ---
   ```

   **Note**: The `unit` field uses the full folder name including the numeric prefix. This matches the folder structure and enables direct path construction in scripts.

   Story naming uses the story title (e.g., `001-user-signup.md`). No prefix field needed.

   **For frontend units**, also include:

   ```yaml
   unit_type: frontend
   default_bolt_type: simple-construction-bolt
   ```

### 8. Validate Independence

For each unit, verify:

- [ ] Can be developed by a separate team
- [ ] Has clear API/interface
- [ ] Failure doesn't cascade to other units
- [ ] Can be deployed without deploying others

---

## Output

```markdown
## Unit Decomposition: {NNN}-{intent-name}

### Units Created

- [ ] **{UUU}-{unit-1}**: {purpose} - Dependencies: None - Stories: ~{n}
- [ ] **{UUU}-{unit-2}**: {purpose} - Dependencies: `{UUU}-{unit-1}` - Stories: ~{n}

### Dependency Graph

    {UUU}-{unit-1} ──► {UUU}-{unit-2} ──► {UUU}-{unit-3}
                    │
                    ▼
                {UUU}-{unit-4}

### Artifacts Created

✅ `{intent-path}/units.md`
✅ `{intent-path}/units/{UUU}-{unit-1}/unit-brief.md`
✅ `{intent-path}/units/{UUU}-{unit-2}/unit-brief.md`

```

**No menu** - Skill complete, return to agent.

---

## Test Contract

```yaml
input: Intent requirements, system context, project.yaml, catalog.yaml
output: units.md, unit-brief.md for each unit (including frontend unit if enabled)
checkpoints: 0 (part of Checkpoint 3 batch)
```
