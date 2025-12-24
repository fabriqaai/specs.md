# Unit Decomposition: 003-memory-bank-system

## Overview

The Memory Bank System intent is decomposed into units for configuration, storage, and context management.

---

## Units Created

| Unit | Purpose | Dependencies |
|------|---------|--------------|
| `configuration-schema` | YAML config definition and parsing | None |
| `artifact-storage` | File-based artifact persistence | `configuration-schema` |
| `context-loader` | Memory Bank reading on agent activation | `configuration-schema`, `artifact-storage` |

---

## Dependency Graph

```
┌─────────────────────┐
│ configuration-schema│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   artifact-storage  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    context-loader   │
└─────────────────────┘
```

---

## Unit Details

### Unit: configuration-schema

**Purpose**: Define and manage the `memory-bank.yaml` configuration that all agents read.

**Responsibility**:
- Provide schema definition for artifact paths
- Define structure and schema sections
- Define agent ownership boundaries
- Support path template resolution with variables

**Dependencies**: None

**Interface**: `.specsmd/memory-bank.yaml` configuration file

---

### Unit: artifact-storage

**Purpose**: Store and retrieve markdown artifacts in the filesystem.

**Responsibility**:
- Write artifacts following schema paths
- Read artifacts from resolved paths
- Create directories on-demand
- Maintain git-friendly file structure

**Dependencies**: `configuration-schema` (for path templates)

**Interface**: File system operations

---

### Unit: context-loader

**Purpose**: Load relevant context from Memory Bank when agents activate.

**Responsibility**:
- Read `memory-bank.yaml` on agent activation
- Resolve path templates to actual paths
- Load phase-relevant artifacts
- Provide context to agent skills

**Dependencies**: `configuration-schema`, `artifact-storage`

**Interface**: Context object provided to agents

---

## Artifacts Created

- `003-memory-bank-system/units.md` (this file)
- `003-memory-bank-system/units/configuration-schema/unit-brief.md`
- `003-memory-bank-system/units/artifact-storage/unit-brief.md`
- `003-memory-bank-system/units/context-loader/unit-brief.md`
