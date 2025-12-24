# Units: Smart Unit Decomposition

## Overview

This intent decomposes into 3 units that modify the inception flow to be project-type aware.

## Requirement-to-Unit Mapping

- **FR-1** (Project Type Awareness) → `catalog-extension`
- **FR-2** (Project Type Configuration) → `catalog-extension`
- **FR-3** (Backend Unit Decomposition) → `units-skill-enhancement`
- **FR-4** (Frontend Unit Decomposition) → `units-skill-enhancement`
- **FR-5** (Simple Construction Bolt) → `simple-bolt-type`
- **FR-6** (Smart Bolt Type Selection) → `units-skill-enhancement`

---

## Units

### Unit 1: catalog-extension

- **Purpose**: Extend catalog.yaml with unit structure configuration
- **Responsibility**: Define how each project type should decompose into units
- **Assigned Requirements**: FR-1, FR-2
- **Dependencies**: None
- **Interface**: YAML configuration read by skills
- **Entities**: Project type definitions with unit_structure
- **Priority**: Must (foundation for other units)

**Key Changes**:
- Add `unit_structure` to each project type in `catalog.yaml`
- Define: enabled, decomposition strategy, default_bolt_type, naming pattern

---

### Unit 2: units-skill-enhancement

- **Purpose**: Modify units.md skill to read project type and create appropriate units
- **Responsibility**: Project-type aware unit decomposition
- **Assigned Requirements**: FR-3, FR-4, FR-6
- **Dependencies**: `catalog-extension` (needs unit_structure config)
- **Interface**: Skill file read by Inception Agent
- **Priority**: Must (core functionality)

**Key Changes**:
- Add `project.yaml` and `catalog.yaml` to Input requirements
- Add step to load project type configuration
- Add logic to create frontend unit when enabled
- Update bolt-plan.md to read default_bolt_type from catalog

---

### Unit 3: simple-bolt-type

- **Purpose**: Create lightweight bolt type for non-DDD work
- **Responsibility**: Define 3-stage construction process
- **Assigned Requirements**: FR-5
- **Dependencies**: None (standalone template)
- **Interface**: Bolt type definition read by Construction Agent
- **Priority**: Must (needed for frontend bolts)

**Key Changes**:
- Create `simple-construction-bolt.md` with 3 stages: Spec, Implement, Test
- No domain model or technical design artifacts required
- Suitable for UI, integrations, utilities

---

## Dependency Graph

```
catalog-extension (no dependencies)
        │
        ▼
units-skill-enhancement (depends on catalog-extension)
        │
        ├──────────────────┐
        ▼                  ▼
 [creates bolts]    simple-bolt-type (standalone)
```

---

## Execution Order

1. **catalog-extension** - Add unit_structure to catalog.yaml
2. **simple-bolt-type** - Create simple-construction-bolt.md (can be parallel with #1)
3. **units-skill-enhancement** - Modify units.md and bolt-plan.md skills

---

## Story Summary

| Unit | Estimated Stories | Priority |
|------|-------------------|----------|
| catalog-extension | 2 | Must |
| units-skill-enhancement | 4 | Must |
| simple-bolt-type | 2 | Must |
| **Total** | **8** | - |
