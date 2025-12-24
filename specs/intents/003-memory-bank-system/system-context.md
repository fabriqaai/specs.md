# System Context: Memory Bank System

## Overview

This document defines the boundaries and integration points for the Memory Bank System.

---

## System Boundary

```
┌────────────────────────────────────────────────────────────────────┐
│                         Agent Layer                                 │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌──────────┐  │
│  │   Master   │   │ Inception  │   │Construction│   │Operations│  │
│  │   Agent    │   │   Agent    │   │   Agent    │   │  Agent   │  │
│  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └────┬─────┘  │
│        │                │                │               │         │
│        └────────────────┴───────┬────────┴───────────────┘         │
│                                 │                                   │
│                     Read config │ on activation                     │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Memory Bank System                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               .specsmd/memory-bank.yaml                      │   │
│  │                    (Configuration)                           │   │
│  │  ┌─────────────┐  ┌───────────┐  ┌───────────────────────┐  │   │
│  │  │  structure  │  │  schema   │  │      ownership        │  │   │
│  │  │   section   │  │  section  │  │       section         │  │   │
│  │  └─────────────┘  └───────────┘  └───────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                 │                                   │
│                    Defines paths│for                                │
│                                 ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   memory-bank/ Directory                     │   │
│  │  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌───────────────┐   │   │
│  │  │ intents/ │  │ bolts/ │  │standards│  │  operations/  │   │   │
│  │  │          │  │        │  │         │  │               │   │   │
│  │  │  units/  │  │        │  │         │  │               │   │   │
│  │  └──────────┘  └────────┘  └─────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Stored in
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        File System (Git Repo)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## External Systems

### File System
- **Type**: Local filesystem
- **Interface**: Node.js fs/fs-extra operations
- **Constraint**: Must be git-friendly (no binary files, no large files)

### Git
- **Type**: Version control system
- **Interface**: User's git workflow
- **Constraint**: All Memory Bank files must be safe to commit

---

## Internal Components

### Configuration File (memory-bank.yaml)
- **Location**: `.specsmd/memory-bank.yaml`
- **Purpose**: Single source of truth for artifact paths and agent ownership
- **Consumers**: All agents read this on activation

### Structure Section
Defines the conceptual organization:
```yaml
structure:
  - path: intents/
    description: "Intents (Features/Capabilities)"
  - path: bolts/
    description: "Execution Instances (Bolt Sessions)"
```

### Schema Section
Provides path templates:
```yaml
schema:
  intents: "memory-bank/intents/{intent-name}/"
  units: "memory-bank/intents/{intent-name}/units/{unit-name}/"
  bolts: "memory-bank/bolts/{bolt-id}.md"
```

### Ownership Section
Maps agents to artifact types:
```yaml
ownership:
  inception: [intents, units, stories]
  construction: [units, bolts]
  operations: [operations]
```

---

## Data Flow

### Agent Activation
```
Agent starts
    │
    ▼
Read .specsmd/memory-bank.yaml
    │
    ▼
Parse structure, schema, ownership
    │
    ▼
Resolve path templates to actual paths
    │
    ▼
Load relevant artifacts based on phase
    │
    ▼
Execute skills with context
```

### Artifact Creation
```
Skill needs to create artifact
    │
    ▼
Read schema template from memory-bank.yaml
    │
    ▼
Resolve path with actual values
    │
    ▼
Create directories if needed
    │
    ▼
Write markdown file from template
```

---

## Integration Contracts

### Configuration Format
- YAML format with structure, schema, and ownership sections
- All paths relative to project root
- Path templates use `{variable-name}` syntax

### Artifact Format
- All artifacts are markdown files
- Artifacts may have YAML frontmatter for metadata
- Human-readable and editable

---

## Constraints

- No database (file-based only)
- No caching between sessions (agents are stateless)
- All artifacts must be human-readable
- All artifacts must be git-safe (no secrets)
