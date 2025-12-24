# Term Mappings

Mapping between AI-DLC terminology and traditional Agile/Scrum terminology.

---

## AI-DLC ↔ Agile/Scrum

| AI-DLC Term | Agile/Scrum Equivalent | Key Difference |
|-------------|------------------------|----------------|
| **Intent** | Epic / Initiative | Intent is AI's starting point for decomposition |
| **Unit** | Epic / Subdomain | Units are loosely coupled for independent deployment |
| **Bolt** | Sprint | Bolts are hours/days, not weeks |
| **User Story** | User Story | Same concept, retained for familiarity |
| **Acceptance Criteria** | Acceptance Criteria | Same concept |
| **Mob Elaboration** | Sprint Planning / Backlog Refinement | Single room, AI-led, condenses weeks into hours |
| **Mob Construction** | Pair Programming / Mob Programming | Teams collocated, AI assists |
| **Domain Design** | (DDD) Domain Modeling | Integrated into methodology, not optional |
| **Logical Design** | Architecture / Technical Design | AI recommends patterns, humans validate |
| **Deployment Unit** | Release / Deployable | Packaged, tested artifacts |
| **Memory Bank** | (None) | File-based artifact storage for AI context |

---

## AI-DLC ↔ DDD (Domain-Driven Design)

| AI-DLC Term | DDD Equivalent | Notes |
|-------------|----------------|-------|
| **Intent** | Business Capability | High-level goal |
| **Unit** | Subdomain / Bounded Context | Cohesive, loosely coupled |
| **Domain Design** | Strategic + Tactical Design | Aggregates, entities, value objects |
| **Logical Design** | Application/Infrastructure Layer | Patterns, services, repositories |

---

## Phases Comparison

| AI-DLC Phase | Agile Equivalent | Notes |
|--------------|------------------|-------|
| **Inception** | Discovery / Sprint 0 / Planning | AI elaborates, humans validate |
| **Construction** | Sprint Execution | Rapid bolts, DDD stages |
| **Operations** | Release / Support | Deployment, monitoring |

---

## Rituals Comparison

| AI-DLC Ritual | Agile Ritual | Notes |
|---------------|--------------|-------|
| **Mob Elaboration** | Sprint Planning + Refinement | AI proposes, mob refines |
| **Mob Construction** | Sprint Execution + Standups | Continuous, not daily |
| **(None)** | Daily Standup | Not needed with rapid cycles |
| **(None)** | Retrospective | Not needed with rapid cycles |

---

## Roles Comparison

| AI-DLC Role | Agile Role | Notes |
|-------------|------------|-------|
| **Developer** | Developer | Validates AI output, makes decisions |
| **Product Owner** | Product Owner | Same concept |
| **AI Agent** | (None) | New role - drives workflow |
| **(None)** | Scrum Master | Not needed - AI orchestrates |

---

## Artifacts Comparison

| AI-DLC Artifact | Agile Equivalent | Notes |
|-----------------|------------------|-------|
| **Intent** | Epic | Starting point |
| **Requirements (FR/NFR)** | Product Backlog Items | Structured capture |
| **System Context** | Architecture Overview | Boundaries, actors |
| **Unit** | Epic breakdown | Deployment-focused |
| **User Story** | User Story | Same format |
| **Bolt Plan** | Sprint Backlog | Hours/days scope |
| **Domain Design** | (None standard) | DDD integrated |
| **Logical Design** | Technical Spec | Patterns, ADRs |
| **PRFAQ** | Product Vision | Press release format |
| **Risk Register** | Risk Log | Mapped to org framework |

---

## Key Conceptual Differences

### Iteration Duration
- **Agile**: Weeks (2-4 week sprints)
- **AI-DLC**: Hours or days (bolts)

### Driver
- **Agile**: Human-driven (developers lead)
- **AI-DLC**: AI-driven (AI proposes, humans validate)

### Design Integration
- **Agile**: Design techniques out of scope
- **AI-DLC**: DDD, TDD, BDD integrated into core

### Phase Structure
- **Agile**: Iterative sprints with fixed duration
- **AI-DLC**: Inherently iterative with three phases (Inception, Construction, Operations) allowing continuous refinement and adaptation

### Estimation
- **Agile**: Story points, velocity, day-based estimates
- **AI-DLC**: Dual estimates (AI implements, human validates)
  - **AI Implementation Time**: Time for AI agent to generate code/artifacts
  - **Human Validation Time**: Time for human to review, test, approve
  - Simple bolt (1-3 stories): ~45 min AI + ~45 min human = ~1.5 hours total
  - Medium bolt (3-5 stories): ~1.5 hours AI + ~1.5 hours human = ~3 hours total
  - Complex bolt (5-8 stories): ~2.5 hours AI + ~3 hours human = ~5.5 hours total
  - Only use day estimates for genuinely complex work (unknown tech, heavy integration)

### Workflow
- **Agile**: Human-initiated conversations with AI (AI-Assisted)
- **AI-DLC**: AI-initiated conversations with humans (AI-Driven)
