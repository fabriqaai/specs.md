# Bolt Instance Template

## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)

---

Use this template when creating new bolt instances during bolt planning.

**Directory Structure**: Each bolt gets its own directory containing the bolt metadata and stage artifacts:

```text
memory-bank/bolts/{bolt-id}/
├── bolt.md                      # Bolt instance metadata (this template)
├── ddd-01-domain-model.md       # Stage 1 artifact (created during execution)
├── ddd-02-technical-design.md   # Stage 2 artifact (created during execution)
└── ddd-03-test-report.md        # Stage 4 artifact (created during execution)
```

---

## Frontmatter

```yaml
---
id: bolt-{unit}-{sequence}
unit: {UUU}-{unit-name}
intent: {NNN}-{intent-name}
type: ddd-construction-bolt
status: planned
stories:
  - story-1
  - story-2
created: {YYYY-MM-DDTHH:MM:SSZ}
started: null
completed: null
current_stage: null
stages_completed: []

# Bolt Dependencies (for execution ordering)
requires_bolts: []          # Bolts that must complete before this bolt can start
enables_bolts: []           # Bolts that become unblocked when this bolt completes
requires_units: []          # Units that must exist (usually empty)
blocks: false               # Computed: true if any requires_bolts are incomplete

# Complexity Assessment (aggregate of included stories)
complexity:
  avg_complexity: 2        # 1=Low, 2=Medium, 3=High
  avg_uncertainty: 1       # 1=Low, 2=Medium, 3=High
  max_dependencies: 2      # Highest dependency score among stories
  testing_scope: 2         # 1=Unit, 2=Integration, 3=E2E
---
```

---

## Required Frontmatter Fields (VALIDATION CHECKLIST)

Before creating a bolt, verify ALL required fields are present:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | **YES** | Bolt identifier (format: `{BBB}-{unit-name}`) |
| `unit` | **YES** | Parent unit ID |
| `intent` | **YES** | Parent intent ID |
| `type` | **YES** | Bolt type (`ddd-construction-bolt` or `simple-construction-bolt`) |
| `status` | **YES** | Current status (`planned`, `in-progress`, `completed`, `blocked`) |
| `stories` | **YES** | Array of story IDs included in this bolt |
| `created` | **YES** | Creation timestamp |
| `requires_bolts` | **YES** | Array of bolt IDs this depends on (can be empty `[]`) |
| `enables_bolts` | **YES** | Array of bolt IDs waiting on this (can be empty `[]`) |
| `complexity` | **YES** | Complexity assessment block |

**If any required field is missing, the bolt is INVALID.**

---

## Content

```markdown
# Bolt: {bolt-id}

## Overview

{Brief description of what this bolt will accomplish}

## Objective

{Specific goal of this bolt tied to the stories it covers}

## Stories Included

- **{story-1}**: {title} (Must)
- **{story-2}**: {title} (Should)

## Bolt Type

**Type**: {type name}
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/{type}.md`

## Stages

- [ ] **1. {stage-1}**: Pending → {artifact}
- [ ] **2. {stage-2}**: Pending → {artifact}
- [ ] **3. {stage-3}**: Pending → {artifact}
- [ ] **4. {stage-4}**: Pending → {artifact}

## Dependencies

### Requires
- {Previous bolt or None}

### Enables
- {Next bolt or deployment}

## Success Criteria

- [ ] All stories implemented
- [ ] All acceptance criteria met
- [ ] Tests passing
- [ ] Code reviewed

## Notes

{Any additional context or considerations}
```

---

## Status Values

- **planned**: Bolt created, not started
- **in-progress**: Currently being executed
- **completed**: All stages done
- **blocked**: Cannot proceed due to dependency

---

## Stage Status Symbols

- [ ] = Pending
- ⏳ = In Progress
- ✅ = Complete
- 🚫 = Blocked

---

## Example

```yaml
---
id: bolt-auth-service-1
unit: 001-auth-service
intent: 001-user-authentication
type: ddd-construction-bolt
status: in-progress
stories:
  - story-1
  - story-2
created: 2024-12-05
started: 2024-12-05
completed: null
current_stage: design
stages_completed:
  - name: model
    completed: 2024-12-05T10:00:00Z
    artifact: ddd-01-domain-model.md

requires_bolts: []
enables_bolts:
  - bolt-auth-service-2
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-auth-service-1

## Overview

First bolt for authentication service covering user registration and login.

## Objective

Implement core authentication functionality including user registration with email verification and secure login.

## Stories Included

- **story-1**: User can register (Must)
- **story-2**: User can login (Must)

## Bolt Type

**Type**: DDD Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Stages

- ✅ **1. model**: Complete → ddd-01-domain-model.md
- ⏳ **2. design**: In Progress → ddd-02-technical-design.md ← current
- [ ] **3. implement**: Pending → src/auth-service/
- [ ] **4. test**: Pending → ddd-03-test-report.md

## Dependencies

### Requires
- None (first bolt)

### Enables
- bolt-auth-service-2 (MFA implementation)

## Success Criteria

- ✅ Domain model defined
- [ ] API design complete
- [ ] Implementation complete
- [ ] Tests passing
```
