# Intent: Brownfield Application Support

## Overview

Add support for brownfield application development workflows in specsmd. This enables working with existing codebases - enhancements, migrations, modernization, defect fixes, and refactoring.

Currently specsmd only supports greenfield (new application) workflows. This intent adds:
1. Level 1 Plan generation based on intent type
2. Elevation phase (code archaeology → living specification)
3. Different workflow paths for non-greenfield scenarios

---

## Related Research

- `/specs/research/unified-modernization-model.md` - Core model: UNDERSTAND → EXTRACT → CRYSTALLIZE → EVOLVE
- `/specs/research/vibe-to-production-academic-research.md` - Academic foundation (40+ papers)
- `/specs/research/vibe-to-spec-flow-options.md` - Flow options analysis

---

## Background: Level 1 Plan (AI-DLC Concept)

Per AI-DLC specification:
> "Given a business intent (ex. Green-Field development, Brown-Field enhancement, modernization, or defect fixing), AI-DLC begins by prompting AI to generate a **Level 1 Plan** that outlines the workflow to implement the intent."

### Intent Types and Their Level 1 Plans

| Intent Type | Level 1 Plan Workflow |
|-------------|----------------------|
| **Green-Field** | Inception → Construction → Operations |
| **Brown-Field Enhancement** | Elevation → Inception → Construction → Operations |
| **Defect Fix** | Elevation (targeted) → Construction bolt |
| **Refactoring** | Elevation → Construction bolt(s) |
| **Migration/Modernization** | Elevation → Inception → Construction → Operations |
| **Vibe-to-Spec Conversion** | Elevation → Inception → Construction → Operations |

### Key Insight from Research

> "Legacy modernization and vibe-coding-to-spec conversion are fundamentally the SAME problem: existing code with embedded knowledge that needs to be preserved while adopting spec-driven development."

---

## The Unified Model: Elevation Phase

From `/specs/research/unified-modernization-model.md`:

```
ANY Existing Codebase (Legacy OR Vibe-Coded)
                ↓
    [1. UNDERSTAND] - Code Archaeology
                ↓
    [2. EXTRACT] - Specification Mining
                ↓
    [3. CRYSTALLIZE] - Living Specification
                ↓
    [4. EVOLVE] - Incremental AI-DLC Adoption
```

### Elevation = UNDERSTAND + EXTRACT + CRYSTALLIZE

The Elevation phase combines these three steps to prepare existing code for AI-DLC:

1. **UNDERSTAND**: Analyze codebase structure, behavior, and domain knowledge
2. **EXTRACT**: Mine specifications from code (user stories, contracts, tests)
3. **CRYSTALLIZE**: Transform into AI-DLC compatible artifacts

---

## Functional Requirements

### FR-1: Intent Type Classification

- FR-1.1: System SHALL classify user intent into: Green-Field, Brown-Field Enhancement, Defect Fix, Refactoring, Migration, Vibe-to-Spec
- FR-1.2: Classification SHALL happen when user describes their intent
- FR-1.3: Classification SHALL be confirmed with user before proceeding
- FR-1.4: For Green-Field, Level 1 Plan is implicit (always Inception → Construction → Operations)

### FR-2: Level 1 Plan Generation (Non-Greenfield Only)

- FR-2.1: System SHALL generate Level 1 Plan only for non-greenfield intents
- FR-2.2: Level 1 Plan SHALL outline workflow phases specific to intent type
- FR-2.3: Level 1 Plan SHALL be presented to user for validation
- FR-2.4: Level 1 Plan SHALL be stored in memory-bank/intents/{intent}/level-1-plan.md

### FR-3: Elevation Phase

- FR-3.1: System SHALL support Elevation phase for brownfield intents
- FR-3.2: Elevation SHALL be divided into: UNDERSTAND, EXTRACT, CRYSTALLIZE sub-phases
- FR-3.3: UNDERSTAND SHALL produce: structure analysis, behavior analysis, knowledge map
- FR-3.4: EXTRACT SHALL produce: intent, requirements, contracts, golden tests
- FR-3.5: CRYSTALLIZE SHALL produce: AI-DLC compatible specifications with traceability
- FR-3.6: Each sub-phase output SHALL be validated by human before proceeding

### FR-4: Defect Fix Workflow

- FR-4.1: System SHALL support streamlined defect fix workflow
- FR-4.2: Defect fix SHALL skip full Inception (no units decomposition needed)
- FR-4.3: Defect fix SHALL perform TARGETED elevation of affected code only
- FR-4.4: Defect fix SHALL execute single targeted construction bolt

### FR-5: Refactoring Workflow

- FR-5.1: System SHALL support refactoring workflow
- FR-5.2: Refactoring SHALL preserve existing behavior (no new features)
- FR-5.3: Refactoring SHALL require golden tests before changes
- FR-5.4: Refactoring SHALL use targeted elevation of affected code

### FR-6: Migration/Modernization Workflow

- FR-6.1: System SHALL support migration workflow
- FR-6.2: Migration SHALL perform full codebase elevation
- FR-6.3: Migration SHALL go through Inception for target architecture
- FR-6.4: Migration SHALL support Strangler Fig pattern for incremental migration

---

## Non-Functional Requirements

### NFR-1: Backwards Compatibility

- Existing greenfield workflows SHALL continue unchanged
- Greenfield SHALL NOT require Level 1 Plan approval (implicit)

### NFR-2: Traceability

- Extracted specifications SHALL trace back to source code locations
- Golden tests SHALL validate behavioral equivalence
- Confidence scores SHALL indicate extraction certainty

### NFR-3: Incremental Adoption

- Elevation SHALL be incremental (can stop and resume)
- Teams SHALL be able to elevate one module at a time
- Progress SHALL be persisted in memory-bank

---

## Acceptance Criteria

### AC-1: Intent Classification

- GIVEN a user describes "fix the login bug"
- WHEN system classifies the intent
- THEN intent type is "Defect Fix" with streamlined Level 1 Plan

### AC-2: Level 1 Plan for Brownfield

- GIVEN a user describes "add payment feature to existing e-commerce app"
- WHEN system generates Level 1 Plan
- THEN plan shows: Elevation → Inception → Construction → Operations

### AC-3: Greenfield No Level 1 Plan

- GIVEN a user describes "build a new todo app from scratch"
- WHEN system classifies as Green-Field
- THEN NO explicit Level 1 Plan is shown (implicit standard workflow)

### AC-4: Elevation Phase Outputs

- GIVEN a brownfield intent with existing codebase
- WHEN Elevation phase completes
- THEN memory-bank contains: understanding/, extracted/, and AI-DLC intent structure

### AC-5: Defect Fix Streamlined

- GIVEN a defect fix intent
- WHEN user proceeds through workflow
- THEN full Inception is skipped, only targeted elevation + construction bolt occur

---

## Memory Bank Extension

```
memory-bank/
├── elevation/                       # NEW: Elevation phase artifacts
│   └── {project-name}/
│       ├── understanding/
│       │   ├── structure-report.md
│       │   ├── behavior-report.md
│       │   └── knowledge-map.md
│       ├── extracted/
│       │   ├── intent.md
│       │   ├── requirements.md
│       │   ├── contracts/
│       │   └── golden-tests/
│       └── traceability/
│           └── matrix.md
│
├── intents/
│   └── {intent}/
│       ├── level-1-plan.md          # NEW: Only for non-greenfield
│       ├── requirements.md
│       └── ...
```

---

## Out of Scope (v1)

- Automated code analysis tools integration (SonarQube, etc.)
- Multi-repository brownfield support
- Legacy language migration (COBOL, etc.)
- Database schema migration tooling

---

## Dependencies

- 001-multi-agent-orchestration (agents must support brownfield workflows)
- 003-memory-bank-system (store elevation artifacts)
- 004-standards-system (elevation templates)
