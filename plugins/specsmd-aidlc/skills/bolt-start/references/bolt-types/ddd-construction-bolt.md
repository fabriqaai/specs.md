# Bolt Type: DDD Construction

## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)

## Success Metrics

- ✅ Activities presented as numbered lists (not tables)
- ✅ Stage progress shown with status indicators
- ✅ Human checkpoints clearly marked

## Failure Modes

- ❌ Using ASCII table for activities
- ❌ Auto-advancing without human confirmation
- ❌ Skipping stages

---

## ⛔ CRITICAL: Stage Execution Sequence

**Stages MUST be executed in this exact order:**

```text
Stage 1: Domain Model → Stage 2: Technical Design → Stage 3: ADR Analysis (optional) → Stage 4: Implement → Stage 5: Test
```

**Stage Overview:**

- ✅/[ ] **1. Domain Model** (Required) → `ddd-01-domain-model.md`
- ✅/[ ] **2. Technical Design** (Required) → `ddd-02-technical-design.md`
- ✅/[ ] **3. ADR Analysis** (Optional) → `adr-{n}-{slug}.md` (zero or more)
- ✅/[ ] **4. Implement** (Required) → Source code
- ✅/[ ] **5. Test** (Required) → Tests + `ddd-03-test-report.md`

**Rules**:

- Each stage MUST be completed before the next begins
- Stage 3 can be skipped if no ADR-worthy decisions are identified
- **⛔ Human validation is MANDATORY at each stage checkpoint - STOP and WAIT for approval**
- NEVER skip to implementation without completing Domain Model and Technical Design
- NEVER auto-advance to next stage without explicit user confirmation

---

## Metadata

```yaml
bolt_type: ddd-construction-bolt
name: DDD Construction Bolt
description: Domain-Driven Design construction with modeling, design, implementation, and testing
version: 2.0.0
suitable_for:
  - Domain-heavy business logic
  - Complex entity relationships
  - Services requiring clear bounded contexts
stages_count: 5
```

---

## Overview

This bolt type implements Domain-Driven Design (DDD) methodology through five sequential stages. Each stage builds upon the previous, ensuring complete design before implementation.

**Best For**:

- Business logic with complex domain rules
- Systems requiring clear entity boundaries
- Services with rich domain models
- Applications needing ubiquitous language alignment

---

## Stages

### Stage 1: Domain Model

**Objective**: Create a static domain model using DDD principles

**Duration**: Hours (typically 1-4 hours depending on complexity)

**⛔ CONSTRAINTS**:

- **FORBIDDEN**: Reading, analyzing, or modifying ANY source code files
- **ONLY OUTPUT**: Documentation artifact (`ddd-01-domain-model.md`)

**Activities**:

1 - **Identify domain entities**: Document entities and their properties
2 - **Define value objects**: Capture immutable objects with equality by value
3 - **Model aggregates**: Define aggregate roots and their boundaries
4 - **Capture domain events**: Document events triggered by domain operations
5 - **Define domain services**: Design services for complex cross-entity operations
6 - **Design repository interfaces**: Define contracts for data access
7 - **Document ubiquitous language**: Create glossary of domain terms

**Artifact**: `ddd-01-domain-model.md`
**Template**: `references/bolt-types/ddd-construction-bolt/ddd-01-domain-model-template.md` (bundled with the `bolt-start` skill)
**Location**: Path defined by `schema.bolts` in the memory-bank schema (`references/memory-bank.yaml` in the `bolt-start` skill)
*(Default: `memory-bank/bolts/{bolt-id}/ddd-01-domain-model.md`)*

**Template Structure**:

```markdown
---
stage: model
bolt: {bolt-id}
created: {YYYY-MM-DDTHH:MM:SSZ}
---

## Static Model: {unit-name}

### Entities

- **{Entity Name}**: {Properties} - {Business Rules}
- **{Entity Name}**: {Properties} - {Business Rules}

### Value Objects

- **{Value Object}**: {Properties} - {Constraints}

### Aggregates

- **{Aggregate Root}**: Members: {list} - Invariants: {rules}

### Domain Events

- **{Event Name}**: Trigger: {condition} - Payload: {data}

### Domain Services

- **{Service Name}**: Operations: {list} - Dependencies: {list}

### Repository Interfaces

- **{Repository Name}**: Entity: {type} - Methods: {list}

### Ubiquitous Language

- **{Term}**: {Definition}
```

**Completion Criteria**:

- [ ] All domain entities identified and documented
- [ ] Business rules captured for each entity
- [ ] Aggregate boundaries defined
- [ ] Domain events specified
- [ ] Repository interfaces defined
- [ ] All stories covered by domain model

**⛔ HUMAN Checkpoint**: Present completion summary and **STOP**. Wait for user to confirm before proceeding to Stage 2.

---

### Stage 2: Technical Design

**Objective**: Transform static model into technical architecture

**Duration**: Hours (typically 2-4 hours)

**⛔ CONSTRAINTS**:

- **FORBIDDEN**: Reading, analyzing, or modifying ANY source code files
- **ONLY OUTPUT**: Documentation artifact (`ddd-02-technical-design.md`)

**Activities**:

1 - **Select architectural pattern**: Choose and document architecture decision
2 - **Design layer structure**: Define responsibilities for each layer
3 - **Design API contracts**: Create OpenAPI/GraphQL specifications
4 - **Design data persistence**: Plan schema and migrations
5 - **Apply security patterns**: Document security approach
6 - **Design for NFRs**: Plan performance and scalability approach
7 - **Plan integrations**: Document integration points

**Artifact**: `ddd-02-technical-design.md`
**Template**: `references/bolt-types/ddd-construction-bolt/ddd-02-technical-design-template.md` (bundled with the `bolt-start` skill)
**Location**: Path defined by `schema.bolts` in the memory-bank schema (`references/memory-bank.yaml` in the `bolt-start` skill)
*(Default: `memory-bank/bolts/{bolt-id}/ddd-02-technical-design.md`)*

**Template Structure**:

```markdown
---
stage: design
bolt: {bolt-id}
created: {YYYY-MM-DDTHH:MM:SSZ}
---

## Technical Design: {unit-name}

### Architecture Pattern
{Selected pattern and rationale}

### Layer Structure
​```text

┌─────────────────────────────┐
│      Presentation           │  API/UI
├─────────────────────────────┤
│      Application            │  Use Cases
├─────────────────────────────┤
│        Domain               │  Business Logic
├─────────────────────────────┤
│     Infrastructure          │  Database/External
└─────────────────────────────┘

​```

### API Design

- **{Endpoint}**: {Method} - Request: {schema} - Response: {schema}

### Data Model

- **{Table}**: Columns: {list} - Relationships: {list}

### Security Design

- **{Concern}**: {Approach}

### NFR Implementation

- **{Requirement}**: {Design Approach}
```

**Completion Criteria**:

- [ ] Architecture pattern selected and documented
- [ ] All layers designed with responsibilities
- [ ] API contracts defined
- [ ] Database schema designed
- [ ] NFRs addressed in design
- [ ] Security patterns applied

**⛔ HUMAN Checkpoint**: Present completion summary and **STOP**. Wait for user to confirm before proceeding to Stage 3.

---

### Stage 3: ADR Analysis (Optional)

**Objective**: Capture significant architectural decisions before implementation

**Duration**: Minutes to hours (depends on complexity and number of ADRs)

**⛔ CONSTRAINTS**:

- **OPTIONAL**: This stage can be skipped if no ADR-worthy decisions are identified
- **REQUIRED**: Must have completed `Domain Model` and `Technical Design` stages first
- **OUTPUT**: ADR documents (if any created)

**When to Create ADRs**:

Suggest an ADR when you identify:

- **New architectural pattern not in standards**: CQRS, event sourcing, saga → Not in standards, affects future development
- **Technology choice not covered by tech-stack**: New library or service → Team should understand the rationale
- **Trade-off decision**: Performance vs simplicity, consistency vs availability → Documents "why" for future reference
- **Security/compliance approach**: Auth strategy, data handling → Critical decisions need justification
- **Integration pattern**: API design, event contracts → Affects other systems/teams
- **Intentional deviation from standards**: Exception with reasoning → Prevents confusion, documents reasoning

**Activities**:

1 - **Review domain model and technical design**: Understand decisions made
2 - **Compare against project standards**: Identify gaps
3 - **Identify ADR-worthy decisions**: Create decision list
4 - **Present opportunities to user**: Get user selection
5 - **Create ADR documents**: Generate selected ADRs
6 - **Update decision index**: Add entries to `memory-bank/standards/decision-index.md`

**Artifact**: `adr-{number}-{slug}.md` (zero or more)
**Template**: `references/bolt-types/ddd-construction-bolt/adr-template.md` (bundled with the `bolt-start` skill)
**Location**: `memory-bank/bolts/{bolt-id}/adr-{number}-{slug}.md`

**ADR Analysis Process**:

1. Review stories, domain model, and technical design
2. Compare against loaded project standards
3. If decision-worthy patterns detected, present opportunities to user
4. Handle user response (create selected ADRs or skip)
5. Update decision index (if ADRs created) and proceed to checkpoint

**Step 3 Output Format**:

```markdown
## Potential ADR Opportunities

Based on this bolt's scope, I identified decisions that may benefit from an ADR:

1 - **{decision description}**: {why this warrants an ADR}
2 - **{decision description}**: {why this warrants an ADR}

Would you like to create ADRs for any of these? (Enter numbers, "all", or "skip")
```

**Step 4 Decision Handling**:

- **User selects numbers or "all"** → Generate ADRs using template, then update decision index
- **User selects "skip"** → Proceed to checkpoint with "No ADRs created"
- **No ADR opportunities identified** → Auto-proceed to checkpoint with "No ADR-worthy decisions found"

**Step 5 Decision Index Update**:

For each ADR created, add an entry to `memory-bank/standards/decision-index.md`:

1. If `decision-index.md` doesn't exist, create it from template: `references/standards/decision-index-template.md` in the `aidlc-init` skill directory
2. Add entry for each ADR in the following format:

```markdown
### ADR-{n}: {title}
- **Status**: {status from ADR frontmatter}
- **Date**: {YYYY-MM-DD from ADR created timestamp}
- **Bolt**: {bolt-id} ({unit-name})
- **Path**: `bolts/{bolt-id}/adr-{n}-{slug}.md`
- **Summary**: {First sentence from Context section}. {First sentence from Decision section}.
- **Read when**: {Generate guidance based on the ADR's domain - describe scenarios when agents should read this ADR}
```

Update frontmatter: increment `total_decisions`, update `last_updated` timestamp

**"Read when" Guidance Examples**:

- "Working on authentication flows or session management"
- "Implementing caching strategies or data persistence patterns"
- "Designing API contracts or integration points"
- "Handling error cases or implementing retry logic"

**Example ADR**:

```markdown
# ADR-001: Use CQRS for Task Queries

## Context
Task list requires complex filtering and sorting that doesn't align with write model.

## Decision
Implement CQRS pattern with separate read models for task queries.

## Rationale
- Write model optimized for domain invariants
- Read model optimized for query performance
- Allows independent scaling

## Consequences
- Additional complexity in sync
- Need event-driven updates to read model
```

**Completion Criteria**:

- [ ] Domain model and technical design reviewed for decisions
- [ ] Project standards compared
- [ ] User presented with ADR opportunities (if any)
- [ ] Selected ADRs created (or explicitly skipped)
- [ ] Decision index updated (if ADRs were created)

**Important**: Do not force ADRs. Only suggest when there's genuine value. Simple bolts with straightforward decisions don't need ADRs.

**⛔ HUMAN Checkpoint**: Present ADR summary (created or skipped) and **STOP**. Wait for user to confirm before proceeding to Stage 4.

---

### Stage 4: Implement

**Objective**: Generate production-ready code from designs

**Duration**: Hours to days (varies by complexity)

**⛔ CONSTRAINTS**:

- **REQUIRED**: Must have completed `model` and `design` stages first
- **REQUIRED**: Load all bolt folder artifacts (see Bolt Context Loading section)
- **OUTPUT**: Source code based on design docs

**Activities**:

1 - **Setup project structure**: Create scaffolding
2 - **Implement domain entities/value objects**: Create domain code
3 - **Implement domain services**: Build service layer
4 - **Implement application layer**: Create use cases
5 - **Implement infrastructure**: Build repository implementations
6 - **Implement presentation layer**: Create API endpoints
7 - **Add validation and error handling**: Implement guards and handlers
8 - **Add logging and instrumentation**: Add observability code

**Artifact**: Source code in unit directory
**Location**: `src/{unit}/` or as defined in project structure

**Project Structure**:

```text
src/{unit}/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── events/
├── application/
│   ├── use-cases/
│   └── dto/
├── infrastructure/
│   ├── repositories/
│   └── external/
└── presentation/
    ├── controllers/
    └── middleware/
```

**Completion Criteria**:

- [ ] All domain models implemented
- [ ] All use cases implemented
- [ ] All API endpoints implemented
- [ ] Database connectivity working
- [ ] Validation and error handling in place
- [ ] Code documented
- [ ] Linting passing

**⛔ HUMAN Checkpoint**: Present implementation summary and **STOP**. Wait for user to confirm before proceeding to Stage 5.

---

### Stage 5: Test

**Objective**: Ensure quality through comprehensive testing

**Duration**: Hours (typically 2-6 hours)

**⛔ CONSTRAINTS**:

- **REQUIRED**: Must have completed `Implement` stage first
- **REQUIRED**: Load all bolt folder artifacts (see Bolt Context Loading section)
- **OUTPUT**: Tests + documentation artifact (`ddd-03-test-report.md`)

**Activities**:

1 - **Write unit tests**: Test domain logic
2 - **Write integration tests**: Test API endpoints
3 - **Write security tests**: Validate security controls
4 - **Write performance tests**: Load and stress tests
5 - **Run all tests**: Execute test suite
6 - **Measure coverage**: Generate coverage report
7 - **Verify acceptance criteria**: Validate against stories

**Artifact**: `ddd-03-test-report.md`
**Template**: `references/bolt-types/ddd-construction-bolt/ddd-03-test-report-template.md` (bundled with the `bolt-start` skill)
**Location**: Path defined by `schema.bolts` in the memory-bank schema (`references/memory-bank.yaml` in the `bolt-start` skill)
*(Default: `memory-bank/bolts/{bolt-id}/ddd-03-test-report.md`)*

**Test Structure**:

```text
tests/
├── unit/           # Domain logic tests
├── integration/    # API tests
├── security/       # Security tests
└── performance/    # Load tests
```

**Template Structure**:

```markdown
---
stage: test
bolt: {bolt-id}
created: {YYYY-MM-DDTHH:MM:SSZ}
---

## Test Report: {unit-name}

### Summary

- **Unit Tests**: {passed}/{total} passed, {coverage}% coverage
- **Integration Tests**: {passed}/{total} passed
- **Security Tests**: {passed}/{total} passed
- **Performance Tests**: {passed}/{total} passed

### Acceptance Criteria Validation

- ✅/❌ **{Story}**: {Criteria} - {Status}

### Issues Found
{Any issues discovered during testing}

### Recommendations
{Improvements or follow-ups needed}
```

**Completion Criteria**:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security tests passing
- [ ] Performance tests meet targets
- [ ] Code coverage > 80%
- [ ] All acceptance criteria met

**⛔ HUMAN Checkpoint**: Present test report and **STOP**. Wait for user to confirm bolt completion.

---

## State Tracking

Bolt instance tracks progress:

```yaml
---
current_stage: design
stages_completed:
  - name: model
    completed: 2024-12-05T10:00:00Z
    artifact: ddd-01-domain-model.md
status: in-progress
---
```

---

## Bolt Context Loading

### Prior Decision Lookup (All Stages)

**Before starting any stage**, scan the decision index for relevant prior ADRs:

1. Read `memory-bank/standards/decision-index.md` (if it exists)
2. Match the current bolt's domain/scope against "Read when" fields
3. Load full ADRs for any matching entries
4. Consider these decisions as constraints or guidance for the current work

**Example**: If working on a bolt for "user-service" and the decision index contains:

```text
### ADR-001: Use JWT for Authentication
- **Read when**: Working on authentication flows or user services
```

→ Load and consider `ADR-001` before starting design work.

**Present relevant ADRs to user** at bolt start:

```text
## Relevant Prior Decisions

Found {n} ADR(s) that may apply to this bolt:
- ADR-001: Use JWT for Authentication → [View](bolts/001-auth-service/adr-001-jwt-auth.md)

These decisions may constrain or guide your approach. Proceed? (y/n)
```

### Bolt Folder Artifacts (Stages 4-5)

For stages that build on previous work (Stage 4: Implement, Stage 5: Test), load all artifacts from the bolt folder:

**Location**: `memory-bank/bolts/{bolt-id}/`

**Load all files in this folder**, which may include:

- `bolt.md` - Bolt instance metadata
- `ddd-01-domain-model.md` - Domain model from Stage 1
- `ddd-02-technical-design.md` - Technical design from Stage 2
- `adr-*.md` - Any ADRs from Stage 3

This ensures the implementation and test stages have full context from earlier design work.

---

## Usage by the `bolt-start` Skill

1. **Load bolt instance** from path defined by `schema.bolts`
2. **Read `bolt_type` field** (e.g., `ddd-construction-bolt`)
3. **Load this definition** from `references/bolt-types/` in the `bolt-start` skill directory
4. **Scan decision index** for relevant prior ADRs (see Prior Decision Lookup)
5. **Present relevant ADRs** to user if any found, get confirmation to proceed
6. **Check `current_stage`** in bolt instance
7. **Load bolt folder artifacts** if stage requires previous context (see Bolt Folder Artifacts)
8. **Execute stage** following activities defined here
9. **Create artifacts** using templates
10. **⛔ STOP and present completion summary** - DO NOT continue automatically
11. **Wait for user confirmation** - user must explicitly approve (e.g., "continue", "proceed", "next")
12. **Only after approval**: Update bolt state and advance to next stage

**⛔ CRITICAL**: Steps 10-11 are MANDATORY. Never skip the human checkpoint. Never auto-advance.

The `bolt-start` skill is **bolt-type agnostic** - it reads stages from this file and executes them.
