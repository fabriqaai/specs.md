---
status: complete
completed: 2025-12-25
note: "Implemented before specsmd dogfooding. Stories not tracked in AI-DLC."
---

# Intent: Multi-Agent Orchestration

## Overview

Implement a multi-agent system that orchestrates the AI-DLC workflow through specialized agents, each responsible for a specific phase of the development lifecycle.

**Related Research**: See `research/approval-gates-simplification.md` for approval gates analysis and simplification proposal.

---

## Functional Requirements

### FR-1: Agent System

- FR-1.1: System SHALL provide four specialized agents: Master, Inception, Construction, Operations
- FR-1.2: Each agent SHALL have a defined persona, responsibilities, and skills
- FR-1.3: Agents SHALL be invocable via slash commands in agentic coding tools
- FR-1.4: Agents SHALL read project context from Memory Bank on activation

### FR-2: Master Agent

- FR-2.1: Master Agent SHALL analyze project state from Memory Bank artifacts
- FR-2.2: Master Agent SHALL determine current AI-DLC phase based on artifact state
- FR-2.3: Master Agent SHALL route users to appropriate specialist agents
- FR-2.4: Master Agent SHALL provide project health dashboard
- FR-2.5: Master Agent SHALL facilitate project initialization via standards setup

### FR-3: Inception Agent

- FR-3.1: Inception Agent SHALL create and manage intents
- FR-3.2: Inception Agent SHALL gather functional and non-functional requirements
- FR-3.3: Inception Agent SHALL define system context and boundaries
- FR-3.4: Inception Agent SHALL decompose intents into units using DDD principles
- FR-3.5: Inception Agent SHALL create user stories with acceptance criteria
- FR-3.6: Inception Agent SHALL plan bolts for execution
- FR-3.7: Inception Agent SHALL validate outputs with human before proceeding

### FR-4: Construction Agent

- FR-4.1: Construction Agent SHALL execute bolts through defined stages
- FR-4.2: Construction Agent SHALL load bolt type definitions (DDD, TDD, BDD, Spike)
- FR-4.3: Construction Agent SHALL execute stages as defined in bolt type (never assume)
- FR-4.4: Construction Agent SHALL validate stage completion before advancing
- FR-4.5: Construction Agent SHALL load project standards during execution
- FR-4.6: Construction Agent SHALL generate artifacts using templates

### FR-5: Operations Agent

- FR-5.1: Operations Agent SHALL verify construction completion before deployment
- FR-5.2: Operations Agent SHALL build deployment artifacts
- FR-5.3: Operations Agent SHALL deploy to environments (Dev → Staging → Prod)
- FR-5.4: Operations Agent SHALL verify deployment success
- FR-5.5: Operations Agent SHALL setup monitoring and observability

### FR-6: Skill System

- FR-6.1: Each agent SHALL have a defined set of skills
- FR-6.2: Skills SHALL be defined in markdown files
- FR-6.3: Skills SHALL be invocable by agent based on context
- FR-6.4: Skills SHALL produce artifacts using templates

---

## Non-Functional Requirements

### NFR-1: Performance

- Agents SHALL activate within agentic coding tool response time limits
- Skills SHALL execute without blocking user interaction

### NFR-2: Usability

- Agent personas SHALL be consistent and clear
- Skill outputs SHALL be structured and predictable
- Human validation points SHALL be clearly communicated

### NFR-3: Maintainability

- Agent definitions SHALL be in markdown format
- Skill definitions SHALL be modular and independent
- Template system SHALL allow customization

### NFR-4: Extensibility

- New agents SHALL be addable without modifying core system
- New skills SHALL be addable to existing agents
- New bolt types SHALL be definable via templates

### NFR-5: Minimal Approval Gates

- Human approval gates SHALL be minimized to essential decision points
- Related artifacts SHALL be batched for single review where possible
- Auto-validation SHALL be used when objective criteria exist (e.g., tests pass)
- Progress display SHALL show workflow position at each gate
- Agents SHALL be lightweight routers; skills SHALL contain complete behavior

---

## Acceptance Criteria

### AC-1: Agent Invocation

- GIVEN a user in an agentic coding tool with specsmd installed
- WHEN user invokes `/specsmd-master-agent`
- THEN Master Agent activates and analyzes project state

### AC-2: Phase Routing

- GIVEN a project with completed inception artifacts
- WHEN Master Agent analyzes state
- THEN Master Agent recommends Construction Agent with correct unit

### AC-3: Skill Execution

- GIVEN Inception Agent is active
- WHEN user requests requirements gathering
- THEN Agent executes requirements skill and produces artifacts

### AC-4: Stage Validation

- GIVEN Construction Agent executing a DDD bolt
- WHEN domain design stage completes
- THEN Agent validates completion criteria before advancing to logical design
