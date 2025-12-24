# System Context: Smart Unit Decomposition

## System Boundary

This intent modifies the Inception phase to be project-type aware when decomposing intents into units.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Inception Agent                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     units.md skill                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │   Read      │  │   Read       │  │   Create      │   │   │
│  │  │ project.yaml│──│ catalog.yaml │──│ Units by Type │   │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  bolt-plan.md skill                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │ Read Unit   │  │ Get Default  │  │ Create Bolts  │   │   │
│  │  │   Brief     │──│ Bolt Type    │──│ with Type     │   │   │
│  │  └─────────────┘  └──────────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
project-init
     │
     ▼
project.yaml ─────────────────────────┐
(project_type: full-stack-web)        │
                                      │
catalog.yaml ─────────────────────────┤
(project_types.full-stack-web.        │
 unit_structure)                      │
                                      ▼
                              ┌───────────────┐
                              │  units skill  │
                              └───────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │ backend     │   │ backend     │   │ frontend    │
            │ unit 1      │   │ unit 2      │   │ unit        │
            │ (DDD)       │   │ (DDD)       │   │ (Simple)    │
            └─────────────┘   └─────────────┘   └─────────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │ ddd-bolt    │   │ ddd-bolt    │   │ simple-bolt │
            └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Components Modified

### 1. catalog.yaml (Extended)
**Location**: `.specsmd/aidlc/templates/standards/catalog.yaml`

**Change**: Add `unit_structure` to each project type definition.

**Before**:
```yaml
project_types:
  full-stack-web:
    description: Full-stack web application
    required_standards: [tech-stack, coding-standards]
    recommended_standards: [system-architecture, ux-guide]
```

**After**:
```yaml
project_types:
  full-stack-web:
    description: Full-stack web application
    required_standards: [tech-stack, coding-standards]
    recommended_standards: [system-architecture, ux-guide]
    unit_structure:
      backend:
        enabled: true
        decomposition: domain-driven
        default_bolt_type: ddd-construction-bolt
      frontend:
        enabled: true
        decomposition: feature-based
        default_bolt_type: simple-construction-bolt
        naming: "{intent}-ui"
```

### 2. units.md (Modified)
**Location**: `.specsmd/aidlc/skills/inception/units.md`

**Change**: Add project type awareness, create frontend unit when enabled.

### 3. bolt-plan.md (Modified)
**Location**: `.specsmd/aidlc/skills/inception/bolt-plan.md`

**Change**: Read default bolt type from catalog instead of hardcoding DDD.

### 4. simple-construction-bolt.md (New)
**Location**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

**Purpose**: Lightweight 3-stage bolt for non-DDD work.

---

## External Dependencies

None. All changes are within the specsmd system.

---

## Actors

| Actor | Role | Interaction |
|-------|------|-------------|
| Inception Agent | Executes units and bolt-plan skills | Reads catalog, creates units |
| Construction Agent | Executes bolts | Loads bolt type definition |
| Human | Reviews artifacts | Approves at Checkpoint 3 |

---

## Integration Points

| Integration | Type | Protocol | Notes |
|-------------|------|----------|-------|
| project.yaml | File | YAML | Read-only during inception |
| catalog.yaml | File | YAML | Read-only, single source of truth |
| unit-brief.md | File | Markdown | Created by units skill, read by bolt-plan |
| bolt.md | File | Markdown | Created by bolt-plan, includes type field |

---

## Constraints

1. **Single Source of Truth**: Project types MUST be defined only in catalog.yaml
2. **Backward Compatibility**: Projects without project.yaml default to backend-only
3. **No Hardcoding**: Skills MUST NOT hardcode project types or bolt types
4. **Catalog Extensibility**: Adding new project types requires only catalog.yaml changes
