---
intent: {NNN}-{intent-name}
phase: inception
status: units-decomposed
updated: {YYYY-MM-DDTHH:MM:SSZ}
---

# {Intent Name} - Unit Decomposition

## Units Overview

This intent decomposes into {N} units of work:

### Unit 1: {unit-name}

**Description**: {What this unit does}

**Stories**:

- Story-1: {Title}
- Story-3: {Title}

**Deliverables**:

- {Specific artifacts this unit produces}

**Dependencies**:

- Depends on: {Other units}
- Depended by: {Units that need this}

**Estimated Complexity**: S/M/L/XL

### Unit 2: {unit-name}

...

## Unit Dependency Graph

```text
[Unit A] ──> [Unit B] ──> [Unit D]
   │            │
   └────> [Unit C] ──┘
```

## Execution Order

Based on dependencies:

1. Day 1-2: Unit A (foundation)
2. Day 2-4: Unit B, Unit C (parallel)
3. Day 5-6: Unit D (integration)
