# System Context: Standards System

## Overview

This document defines the boundaries and integration points for the Standards System.

---

## System Boundary

```
┌────────────────────────────────────────────────────────────────────┐
│                         Agent Layer                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Master Agent                             │    │
│  │              (project-init skill creates standards)         │    │
│  └─────────────────────────┬──────────────────────────────────┘    │
│                            │                                        │
│  ┌────────────┐  ┌─────────▼────────┐  ┌──────────────────────┐   │
│  │ Inception  │  │  Construction    │  │    Operations        │   │
│  │   Agent    │  │     Agent        │  │      Agent           │   │
│  │            │  │ (reads standards)│  │  (reads standards)   │   │
│  └────────────┘  └──────────────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                                │
                    Reads/Writes│
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Standards System                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                memory-bank/standards/                        │   │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐  │   │
│  │  │ tech-stack.md│  │coding-standards.md│  │system-arch.md│  │   │
│  │  └──────────────┘  └──────────────────┘  └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               .specsmd/standards-catalog.yaml                │   │
│  │                 (Available standards definitions)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               .specsmd/aidlc/templates/standards/                  │   │
│  │                 (Templates for each standard)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## External Systems

### Project Codebase
- **Type**: User's software project
- **Interface**: File system
- **Constraint**: Standards must be compatible with existing project

---

## Internal Components

### Standards Catalog
- **Location**: `.specsmd/standards-catalog.yaml`
- **Purpose**: Define available standards and their metadata
- **Format**:
```yaml
standards:
  - id: tech-stack
    name: Technology Stack
    description: Document technology choices
    required: true
  - id: coding-standards
    name: Coding Standards
    description: Code style and quality conventions
    required: true
  - id: system-architecture
    name: System Architecture
    description: Architectural patterns and decisions
    required: true
```

### Standard Files
- **Location**: `memory-bank/standards/`
- **Purpose**: Project-specific standard documentation
- **Format**: Markdown files following templates

### Standard Templates
- **Location**: `.specsmd/aidlc/templates/standards/`
- **Purpose**: Boilerplate for creating standard files
- **Examples**: `tech-stack-template.md`, `coding-standards-template.md`

---

## Data Flow

### Project Initialization
```
User runs project-init
    │
    ▼
Master Agent reads standards-catalog.yaml
    │
    ▼
For each required standard:
    │
    ├─▶ Read template from .specsmd/aidlc/templates/standards/
    │
    └─▶ Create standard file in memory-bank/standards/
    │
    ▼
Standards ready for agents to consume
```

### Agent Standards Consumption
```
Construction Agent starts bolt
    │
    ▼
Read memory-bank/standards/tech-stack.md
    │
    ▼
Read memory-bank/standards/coding-standards.md
    │
    ▼
Apply standards during implementation
```

---

## Integration Contracts

### Standard File Format
- Markdown with clear sections
- Human-readable and editable
- No required frontmatter (optional YAML frontmatter allowed)

### Catalog Format
- YAML format
- Each standard has: id, name, description, required flag
- Templates referenced by convention: `{id}-template.md`

---

## Constraints

- Standards must be human-readable
- Standards must be editable by project team
- Standards must be git-safe
- Standards apply project-wide (not per-intent or per-unit)
