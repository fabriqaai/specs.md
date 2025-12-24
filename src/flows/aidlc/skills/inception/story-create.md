# Skill: Create Stories

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
    - [ ] Stories  ← this skill
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

Define atomic, testable User Stories for each Unit that will guide Construction.

---

## Input

- **Required**: Unit name and `unit-brief.md`
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: Requirements to reference

---

## Process

### 0. Gap Analysis (Internal)

Before creating stories, analyze existing state internally:

1. **Read story-index.md** if it exists
2. **Scan story folders** for existing `.md` files
3. **Identify gaps** - missing files, unmarked stories

**Auto-proceed**: Create missing stories and update markers. Do not stop for user input.

---

### 1. Analyze Unit Brief

Review the unit-brief.md to understand:

- **Assigned Requirements** - FRs mapped to this unit (stories come from these)
- Purpose and scope
- Key entities and operations
- Dependencies
- Success criteria

**IMPORTANT**: Stories are created from the unit's **Assigned Requirements** section, NOT directly from intent requirements.md. The FR-to-unit mapping happened during unit decomposition.

### 2. Generate Stories

For each feature in the unit:

1. **Identify User Actions**: What can users do?
2. **Break Down**: One story per testable behavior
3. **Format**: Use standard user story format
4. **Size**: Each story should be completable in one bolt stage

**Story Format**:

```markdown
## Story: {story-id}

### User Story
As a {role}
I want to {action}
So that {benefit}

### Acceptance Criteria
- [ ] Given {context}, When {action}, Then {outcome}
- [ ] Given {context}, When {action}, Then {outcome}

### Technical Notes
- {implementation hints if any}

### Dependencies
- {other stories this depends on}
```

### 3. Apply INVEST Criteria

Validate each story against:

- [ ] **I**ndependent: Can be developed without other stories? (Preferred)
- [ ] **N**egotiable: Details can be refined during bolt? (Required)
- [ ] **V**aluable: Delivers value to user? (Required)
- [ ] **E**stimable: Scope is clear enough to plan? (Required)
- [ ] **S**mall: Fits in a single bolt stage? (Required)
- [ ] **T**estable: Acceptance criteria are binary? (Required)

### 4. Group by Priority

Organize stories for bolt planning:

- **Must**: Core functionality (Authentication, core CRUD)
- **Should**: Important but not blocking (Error handling, validation)
- **Could**: Nice to have (Advanced features, optimizations)

### 5. Document Stories

1. **Read Path**: Check `schema.stories` from `.specsmd/aidlc/memory-bank.yaml`
   *(Default: `memory-bank/intents/{intent-name}/units/{unit-name}/stories/`)*

2. **Create Directory**:
   Ensure `.../units/{unit-name}/stories/` exists

3. **Create Story Files** (IMPORTANT - ONE FILE PER STORY):

   **Read naming convention from `.specsmd/aidlc/memory-bank.yaml`**

   Format: `{SSS}-{title-slug}.md`
   - `{SSS}` = 3-digit story number (e.g., `001`, `002`)
   - `{title-slug}` = Kebab-case story title (e.g., `user-can-login`)

   **DO NOT** create a single `stories.md` file with all stories

   Use template: `.specsmd/aidlc/templates/inception/story-template.md`

   **Example for intent `001-user-authentication`, unit `auth-service` with 6 stories:**

   ```text
   001-user-authentication/
   └── units/
       └── auth-service/
           ├── unit-brief.md
           └── stories/
               ├── 001-user-signup.md
               ├── 002-user-login.md
               ├── 003-user-logout.md
               ├── 004-invite-members.md
               ├── 005-remove-members.md
               └── 006-change-roles.md
   ```

   **Global uniqueness** comes from the full path:
   `memory-bank/intents/001-user-authentication/units/auth-service/stories/001-user-signup.md`

4. **Link to Unit**:
   Update unit's story index if one exists

### 6. Update Unit Brief with Story Summary

**CRITICAL**: After creating stories, update the unit-brief.md with a story summary.

Add/update this section in the unit's `unit-brief.md`:

```markdown
---

## Story Summary

- **Total Stories**: {n}
- **Must Have**: {n}
- **Should Have**: {n}
- **Could Have**: {n}

### Stories

- [ ] **AUTH-001**: User signup - Must - Planned
- [ ] **AUTH-002**: User login - Must - Planned
```

This ensures each unit-brief shows its story count at a glance.

### 7. Update Global Story Index

**CRITICAL**: After creating EACH story, IMMEDIATELY update the index.

**DO NOT** batch index updates - mark each story right after creating its file.

1. **Read Configuration**: Check `story-index` settings in `.specsmd/aidlc/memory-bank.yaml`

2. **Mark each story as generated:**

   **Format - add ✅ GENERATED marker immediately after filename:**

   ```markdown
   ### 001-user-signup.md ✅ GENERATED
   **Title**: User Registration with Password Hashing
   ```

   **Status markers:**
   - No marker = Planned (not yet created)
   - `✅ GENERATED` = File created
   - `✅ COMPLETED` = Implemented in Construction

3. **Based on mode**:

   **Option 1: single-file** (default)
   - Path: `memory-bank/story-index.md`
   - Add all stories to the central index with full paths

   **Option 2: per-intent**
   - Path: `memory-bank/intents/{intent-name}/story-index.md`
   - Create/update per-intent story indices

   **Option 3: aggregate**
   - No file to update (computed from unit stories on demand)

4. **Story Index Format**:

   ```markdown
   # Global Story Index

   ## Overview
   - **Total stories**: {count}
   - **Generated**: {count with ✅ GENERATED}
   - **Last updated**: {date}

   ---

   ## Stories by Intent

   ### {intent-name}

   - [ ] **001-intent-AUTH-001** (auth): User signup - Must - Planned
   - [x] **001-intent-AUTH-002** (auth): User login - Must - ✅ GENERATED
   - [x] **001-intent-TASKS-001** (tasks): Create task - Must - ✅ COMPLETED

   ---

   ## Stories by Status

   - **Planned**: {n}
   - **Generated**: {n}
   - **In Progress**: {n}
   - **Completed**: {n}
   ```

5. **Verification after batch generation:**

   After generating all stories for a unit, verify:

   ```markdown
   ### Verification: {unit-name}
   - Stories planned: {n}
   - Stories created: {n}
   - Index updated: {n} marked ✅ GENERATED
   - Gaps: {list any missing}
   ```

---

## Output

```markdown
## Stories Created: {unit-name}

### Story Summary

- [ ] **S1**: User can register - Must - No dependencies
- [ ] **S2**: User can login - Must - Requires S1
- [ ] **S3**: User can reset password - Should - Requires S1
- [ ] **S4**: User can enable MFA - Could - Requires S2

### Acceptance Criteria Count
- **Total criteria**: {n}
- **Must-have stories**: {n}
- **Should-have stories**: {n}
- **Could-have stories**: {n}

### Artifacts Created (one file per story)
✅ `{unit-path}/stories/001-{title-slug}.md`
✅ `{unit-path}/stories/002-{title-slug}.md`
✅ `{unit-path}/stories/003-{title-slug}.md`

### Estimated Bolt Coverage
- Stories can be grouped into ~{n} bolts
- Suggested grouping provided in bolt-plan
```

**No menu** - Skill complete, return to agent.

---

## Test Contract

```yaml
input: Unit brief, requirements
output: Individual story files with acceptance criteria
checkpoints: 0 (part of Checkpoint 3 batch)
```
