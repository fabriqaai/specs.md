# Unit Brief: Configuration Schema

## Overview

The Configuration Schema unit defines the `memory-bank.yaml` file structure that serves as the single source of truth for all agents. Every agent reads this file on activation to understand where artifacts are stored.

---

## Scope

### In Scope
- YAML schema definition for memory bank structure
- Path template syntax and resolution
- Agent ownership boundaries
- Default configuration values

### Out of Scope
- Actual artifact storage (handled by artifact-storage unit)
- Agent reading logic (handled by context-loader unit)

---

## Technical Context

### File Location
`.specsmd/memory-bank.yaml`

---

## Implementation Details

### Full Configuration Schema

```yaml
# Memory Bank Configuration for AI-DLC Flow
# Defines the directory structure and required folders for project context

# Structure Section
# Describes the conceptual organization of artifacts
structure:
  - path: intents/
    description: "Intents (Features/Capabilities)"
  - path: intents/units/
    description: "Units of Work (Services/Components)"
  - path: intents/units/stories/
    description: "Individual User Stories"
  - path: bolts/
    description: "Execution Instances (Bolt Sessions)"
  - path: standards/
    description: "Project Standards (Architecture, Tech Stack)"
  - path: operations/
    description: "Operations Context (Deployment, Monitoring)"

# Schema Section
# Path templates for each artifact type
# Variables in {} are resolved at runtime
schema:
  intents: "memory-bank/intents/{intent-name}/"
  units: "memory-bank/intents/{intent-name}/units/{unit-name}/"
  stories: "memory-bank/intents/{intent-name}/units/{unit-name}/stories/{story-id}.md"
  bolts: "memory-bank/bolts/{bolt-id}.md"
  story-index: "memory-bank/story-index.md"
  standards: "memory-bank/standards/"
  operations: "memory-bank/operations/"

  # Agent Ownership
  # Defines which agent can create/modify which artifact types
  ownership:
    inception: [intents, units, stories, story-index]
    construction: [units, bolts]
    operations: [operations]

# Global Story Index Configuration
story-index:
  enabled: true
  # Options:
  #   1. single-file: One story-index.md at memory-bank root (recommended for small projects)
  #   2. per-intent: One story-index.md per intent folder (recommended for large projects)
  #   3. aggregate: Auto-generated from unit-level stories (computed, not stored)
  mode: "single-file"
  path: "memory-bank/story-index.md"
```

### Configuration Sections

#### 1. `structure` Section

Describes the conceptual hierarchy of the memory bank. Used by installer to create initial directory structure.

| Path | Description | Created By |
|------|-------------|------------|
| `intents/` | High-level features | Inception Agent |
| `intents/units/` | Decomposed work elements | Inception Agent |
| `intents/units/stories/` | Implementation tasks | Inception Agent |
| `bolts/` | Execution sessions | Construction Agent |
| `standards/` | Project standards | Master Agent (project-init) |
| `operations/` | Deployment context | Operations Agent |

#### 2. `schema` Section

Path templates with variable placeholders. Agents resolve these to actual paths.

**Variable Syntax**: `{variable-name}`

**Resolution Example**:
```
Template: memory-bank/intents/{intent-name}/
Variables: { intent-name: "001-user-auth" }
Resolved:  memory-bank/intents/001-user-auth/
```

**Schema Keys**:
| Key | Template | Example Resolved Path |
|-----|----------|----------------------|
| `intents` | `memory-bank/intents/{intent-name}/` | `memory-bank/intents/001-user-auth/` |
| `units` | `memory-bank/intents/{intent-name}/units/{unit-name}/` | `memory-bank/intents/001-user-auth/units/auth-service/` |
| `stories` | `.../stories/{story-id}.md` | `.../stories/001-user-auth-AUTH-001.md` |
| `bolts` | `memory-bank/bolts/{bolt-id}.md` | `memory-bank/bolts/bolt-auth-service-1.md` |
| `standards` | `memory-bank/standards/` | `memory-bank/standards/` |
| `operations` | `memory-bank/operations/` | `memory-bank/operations/` |

#### 3. `ownership` Section

Maps agents to artifact types they can create/modify.

| Agent | Owned Artifacts | Permissions |
|-------|-----------------|-------------|
| `inception` | intents, units, stories | Create, Update |
| `construction` | units (update only), bolts | Update, Create |
| `operations` | operations | Create, Update |

**Note**: Master Agent reads everything but doesn't own artifacts (except standards via project-init).

---

## Path Resolution Algorithm

```
function resolvePath(templateKey, variables):
    1. Get template from schema[templateKey]
    2. For each variable in template:
       - Find {variable-name} pattern
       - Replace with variables[variable-name]
    3. Return resolved path
```

**Example**:
```javascript
// Input
templateKey = "units"
variables = { "intent-name": "001-user-auth", "unit-name": "auth-service" }

// Processing
template = "memory-bank/intents/{intent-name}/units/{unit-name}/"
// Replace {intent-name} → "001-user-auth"
// Replace {unit-name} → "auth-service"

// Output
"memory-bank/intents/001-user-auth/units/auth-service/"
```

---

## Default Values

When memory-bank.yaml is installed, these are the defaults:

| Setting | Default |
|---------|---------|
| Root directory | `memory-bank/` |
| Config location | `.specsmd/memory-bank.yaml` |
| Intent folder | `{NNN}-{intent-name}` (e.g., `001-user-authentication`) |
| Unit folder | `{unit-name}` (e.g., `auth-service`) |
| Story file | `{SSS}-{unit-name}.md` (e.g., `001-auth-service.md`) |
| Bolt file | `bolt-{unit-name}-{N}.md` (e.g., `bolt-auth-service-1.md`) |

---

## Acceptance Criteria

### AC-1: Schema Completeness
- GIVEN a freshly installed specsmd
- WHEN agent reads memory-bank.yaml
- THEN all artifact types have defined paths in schema section
- AND all paths use consistent variable syntax

### AC-2: Path Resolution
- GIVEN schema template `memory-bank/intents/{intent-name}/`
- WHEN resolved with `{ "intent-name": "001-test" }`
- THEN result is `memory-bank/intents/001-test/`

### AC-3: Ownership Validation
- GIVEN Construction Agent
- WHEN attempting to create an intent
- THEN operation is blocked (intents owned by inception)
