# Intent: Memory Bank System

## Overview
Provide a configuration-driven artifact storage system where all agents discover artifact paths and structure by reading a central `memory-bank.yaml` configuration file.

---

## Core Concept

The Memory Bank is NOT a database - it's a file-based storage system with a YAML configuration that serves as the source of truth for all agents. Every agent reads `.specsmd/memory-bank.yaml` on activation to understand where artifacts are stored and how they're organized.

---

## Functional Requirements

### FR-1: Central Configuration File

The `memory-bank.yaml` file is the single source of truth for artifact structure.

**Location**: `.specsmd/memory-bank.yaml`

**Structure**:
```yaml
# Memory Bank Configuration for AI-DLC Flow
# Defines the directory structure and required folders for project context

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

# Schema Definition (Source of Truth for Agents)
schema:
  intents: "memory-bank/intents/{intent-name}/"
  units: "memory-bank/intents/{intent-name}/units/{unit-name}/"
  stories: "memory-bank/intents/{intent-name}/units/{unit-name}/stories/{story-id}.md"
  bolts: "memory-bank/bolts/{bolt-id}.md"
  story-index: "memory-bank/story-index.md"  # Global story index

  # Agent Ownership
  ownership:
    inception: [intents, units, stories, story-index]
    construction: [units, bolts]
    operations: [operations]

# Global Story Index Options
story-index:
  enabled: true
  mode: "single-file"  # Options: single-file, per-intent, aggregate
  path: "memory-bank/story-index.md"
```

- FR-1.1: System SHALL provide a `memory-bank.yaml` configuration file at `.specsmd/memory-bank.yaml`
- FR-1.2: Configuration SHALL define `structure` section listing all directory paths and descriptions
- FR-1.3: Configuration SHALL define `schema` section with path templates for each artifact type
- FR-1.4: Configuration SHALL define `ownership` mapping agents to artifact types they manage

### FR-2: Configuration Sections

#### `structure` Section
Defines the conceptual organization of the Memory Bank:
| Path | Description | Purpose |
|------|-------------|---------|
| `intents/` | Intents (Features/Capabilities) | High-level feature definitions |
| `intents/units/` | Units of Work (Services/Components) | Decomposed work elements |
| `intents/units/stories/` | Individual User Stories | Implementation-level tasks |
| `bolts/` | Execution Instances (Bolt Sessions) | Tracking bolt progress |
| `standards/` | Project Standards | Tech stack, coding standards |
| `operations/` | Operations Context | Deployment and monitoring |

#### `schema` Section
Provides path templates agents use to locate artifacts:
| Key | Template | Example |
|-----|----------|---------|
| `intents` | `memory-bank/intents/{intent-name}/` | `memory-bank/intents/001-user-auth/` |
| `units` | `memory-bank/intents/{intent-name}/units/{unit-name}/` | `memory-bank/intents/001-user-auth/units/auth-service/` |
| `stories` | `memory-bank/intents/{intent-name}/units/{unit-name}/stories/{story-id}.md` | `...stories/001-user-auth-AUTH-001.md` |
| `bolts` | `memory-bank/bolts/{bolt-id}.md` | `memory-bank/bolts/bolt-auth-service-1.md` |

#### `ownership` Section
Maps agents to the artifact types they create and manage:
| Agent | Owned Artifacts | Permissions |
|-------|-----------------|-------------|
| `inception` | intents, units, stories | Create/Update |
| `construction` | units, bolts | Update/Create |
| `operations` | operations | Create/Update |

### FR-3: Agent Configuration Reading
- FR-3.1: Agents SHALL read `memory-bank.yaml` on activation
- FR-3.2: Agents SHALL use schema templates to resolve artifact paths
- FR-3.3: Agents SHALL respect ownership boundaries (only modify owned artifact types)
- FR-3.4: Agents SHALL create directories on-demand following schema paths

### FR-4: Artifact Storage
- FR-4.1: All artifacts SHALL be stored as markdown files
- FR-4.2: Artifacts SHALL follow templates from `.specsmd/aidlc/templates/`
- FR-4.3: Artifacts SHALL be human-readable and editable
- FR-4.4: Artifacts SHALL be version-controllable via git

### FR-5: Context Persistence
- FR-5.1: Artifacts SHALL persist across agent sessions
- FR-5.2: Fresh agent invocations SHALL load state from Memory Bank
- FR-5.3: No in-memory caching between sessions (agents are stateless)

---

## Non-Functional Requirements

### NFR-1: Performance
- Configuration read SHALL complete in under 100ms
- Artifact read/write SHALL be filesystem operations only (no database)

### NFR-2: Usability
- Configuration SHALL use human-readable YAML format
- Artifacts SHALL be viewable in any text editor
- Structure SHALL be intuitive for developers

### NFR-3: Reliability
- System SHALL not corrupt artifacts on partial write
- System SHALL handle missing directories gracefully (create on demand)
- Configuration errors SHALL provide clear error messages

---

## Default Values

The `memory-bank.yaml` ships with sensible defaults:

| Setting | Default Value |
|---------|---------------|
| Base directory | `memory-bank/` |
| Intent path | `memory-bank/intents/{intent-name}/` |
| Unit path | Nested under intent |
| Story path | Nested under unit |
| Bolt path | `memory-bank/bolts/` |
| Standards path | `memory-bank/standards/` |
| Operations path | `memory-bank/operations/` |

---

## Acceptance Criteria

### AC-1: Configuration Discovery
- GIVEN an agent activates
- WHEN agent reads `.specsmd/memory-bank.yaml`
- THEN agent knows all artifact paths from `schema` section
- AND agent knows its ownership boundaries from `ownership` section

### AC-2: Path Resolution
- GIVEN schema template `memory-bank/intents/{intent-name}/`
- WHEN Inception Agent creates intent `001-user-auth`
- THEN agent resolves path to `memory-bank/intents/001-user-auth/`

### AC-3: Cross-Session Persistence
- GIVEN Inception Agent creates a user story
- WHEN Construction Agent activates in a new session
- THEN Construction Agent reads same `memory-bank.yaml`
- AND can locate the story using schema templates

### AC-4: Ownership Enforcement
- GIVEN Construction Agent is active
- WHEN Construction Agent attempts to create an intent
- THEN action is blocked (intents owned by Inception)
