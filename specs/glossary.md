# specsmd Glossary

Core terminology used throughout specsmd and AI-DLC.

---

## AI-DLC Core Concepts

### Intent
A high-level statement of purpose that encapsulates what needs to be achieved - whether a business goal, feature, or technical outcome. Intents serve as the starting point for AI-driven decomposition into actionable tasks.

### Unit
A cohesive, self-contained work element derived from an Intent. Units are designed to deliver measurable value and are loosely coupled, enabling autonomous development and independent deployment. Analogous to Subdomains in DDD or Epics in Scrum.

### Bolt
The smallest iteration in AI-DLC, designed for rapid implementation of a Unit or a set of tasks within a Unit. Bolts emphasize intense focus and high-velocity delivery, with build-validation cycles measured in hours or days rather than weeks. Analogous to Sprints in Scrum.

### User Story
A well-defined contract that aligns human and AI understanding of what needs to be built. Stories articulate functional scope and include acceptance criteria.

---

## AI-DLC Phases

### Inception Phase
The phase focused on capturing Intents and translating them into Units for development. Uses "Mob Elaboration" ritual. Outputs include PRFAQs, User Stories, NFRs, Risk descriptions, and Suggested Bolts.

### Construction Phase
The phase encompassing iterative execution of tasks, transforming Units into tested, operations-ready Deployment Units. Progresses through Domain Design → Logical Design → Code → Test.

### Operations Phase
The phase centered on deployment, observability, and maintenance of systems. AI analyzes telemetry, detects patterns, and proposes actionable recommendations.

---

## AI-DLC Rituals

### Mob Elaboration
A collaborative requirements elaboration and decomposition ritual in the Inception Phase. AI proposes breakdown of Intent into Stories and Units; humans (the mob) refine and validate.

### Mob Construction
A collaborative development ritual in the Construction Phase. Teams collocate, exchange integration specifications, make decisions, and deliver bolts.

---

## AI-DLC Artifacts

### Domain Design
An artifact that models the core business logic of a Unit independently of infrastructure. Uses DDD principles: aggregates, value objects, entities, domain events, repositories, factories.

### Logical Design
An artifact that translates Domain Designs by extending them to meet non-functional requirements using appropriate architectural patterns (CQRS, Circuit Breakers, etc.).

### Deployment Unit
Operational artifacts encompassing packaged executable code (containers, serverless functions), configurations (Helm Charts), and infrastructure components (Terraform, CloudFormation) that are tested for functional acceptance, security, and NFRs.

### PRFAQ
Press Release / FAQ document that summarizes business intent, functionality, and expected benefits.

### NFR (Non-Functional Requirement)
Requirements covering Performance, Scalability, Security, Reliability, Maintainability, and Observability.

---

## Bolt Types

### DDD Construction Bolt
A bolt type using Domain-Driven Design principles. Stages: Model (domain design) → Design (logical design) → Code → Test.

### TDD Construction Bolt
A bolt type using Test-Driven Development approach. Write tests first, then implementation.

### BDD Construction Bolt
A bolt type using Behavior-Driven Development approach. Define behavior scenarios first.

### Spike Bolt
A bolt type for research and exploration when facing unknowns.

---

## specsmd Architecture

### Agent
A specialized AI persona with defined responsibilities, skills, and workflows. specsmd has four agents: Master (orchestrator, router, and project initializer), Inception, Construction, Operations.

### Skill
A focused capability within an agent. Skills are invoked to perform specific tasks (e.g., creating intents, gathering requirements, starting bolts).

### Memory Bank
File-based storage system for all project artifacts. Maintains context across agent sessions and provides traceability.

### Slash Command
Commands invocable in agentic coding tools that activate agents (e.g., `/specsmd-master-agent`, `/specsmd-inception-agent`).

### Template
Markdown templates used to create consistent artifacts (requirements, stories, unit briefs, etc.).

### Facilitation Guide
Documents that guide conversations for establishing standards (tech-stack, coding standards, etc.).

### Mandatory Output Rules
Formatting rules embedded at the top of every skill file. These rules ensure consistent output across all agents. Key rules include: no ASCII tables, numbered list format for options, and standard status indicators.

### Status Indicators
Visual markers used consistently across all agent outputs to show progress:
- `✅` - Completed/done
- `⏳` - In progress/current
- `[ ]` - Not started/pending
- `🚫` - Blocked/requires decision
- `⚠️` - Warning/needs attention

### Suggested Next Step
A pattern used at the end of every skill output that presents available actions and recommends the most logical next action. Format: `→ **option** - Description`

### Human Validation Point
A checkpoint in agent workflows where the AI pauses and explicitly requests human approval before proceeding. Used to enforce the "Human Oversight as Loss Function" principle.

---

## Standards

### Tech Stack
Standard defining technology choices: languages, frameworks, databases, ORMs, authentication, infrastructure, package managers.

### Coding Standards
Standard defining code quality: formatting, linting, naming conventions, file organization, testing strategy, error handling, logging.

### System Architecture
Standard defining high-level design: architecture style, API design, state management, caching, security patterns.

### UX Guide
Standard defining UI/UX patterns: design system, styling approach, accessibility, responsive strategy.

### API Conventions
Standard defining API design: API style, versioning, response format, error format, pagination.

---

## Agentic Coding Tool Integrations

### Claude Code
Anthropic's CLI tool for Claude. specsmd installs commands to `.claude/commands/`.

### Cursor
AI-powered code editor with agentic capabilities. specsmd installs commands to `.cursor/commands/`.

### GitHub Copilot
GitHub's AI pair programmer. specsmd installs commands to `.github/copilot/commands/`.

---

## Key Principles

### Human Oversight as Loss Function
The principle that human validation at each step catches and corrects errors early before they snowball downstream.

### AI Drives, Human Validates
AI proposes plans, decompositions, and implementations; humans approve, validate, and confirm decisions.

### Semantically Rich Context
Each artifact builds context for the next step, ensuring AI has accurate information throughout the lifecycle.
