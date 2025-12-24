# Intent: Smart Unit Decomposition

## Overview

Enable the Inception Agent to intelligently decompose intents into appropriate units based on project type, creating both backend and frontend units for full-stack applications instead of only backend services.

**Problem Statement**: Currently, the `units` skill only applies DDD decomposition, creating backend service units. For full-stack web apps, this results in no frontend units being created, leading to only backend code being generated during construction.

---

## Functional Requirements

### FR-1: Project Type Awareness

- FR-1.1: Units skill SHALL read `project_type` from `memory-bank/project.yaml`
- FR-1.2: Units skill SHALL read unit structure configuration from `catalog.yaml`
- FR-1.3: Project type configuration SHALL define which unit types are enabled (backend, frontend, cli)

### FR-2: Project Type Configuration

- FR-2.1: `catalog.yaml` SHALL define `unit_structure` for each project type
- FR-2.2: Unit structure SHALL specify: enabled (boolean), decomposition strategy, default bolt type
- FR-2.3: Supported project types SHALL include: `full-stack-web`, `backend-api`, `frontend-app`, `cli-tool`, `library`

### FR-3: Backend Unit Decomposition

- FR-3.1: When backend is enabled, units skill SHALL apply domain-driven decomposition
- FR-3.2: Backend units SHALL use `ddd-construction-bolt` as default bolt type
- FR-3.3: Backend decomposition SHALL identify bounded contexts, aggregates, services

### FR-4: Frontend Unit Decomposition

- FR-4.1: When frontend is enabled, units skill SHALL create a frontend unit
- FR-4.2: Frontend unit SHALL be named `{intent}-ui` or `{app-name}-ui`
- FR-4.3: Frontend units SHALL use `simple-construction-bolt` as default bolt type
- FR-4.4: Frontend unit SHALL depend on all backend service units
- FR-4.5: Frontend unit SHALL be assigned all user-facing requirements

### FR-5: Simple Construction Bolt

- FR-5.1: System SHALL provide `simple-construction-bolt` for non-DDD work
- FR-5.2: Simple bolt SHALL have 3 stages: Spec, Implement, Test
- FR-5.3: Simple bolt SHALL NOT require domain model or technical design artifacts
- FR-5.4: Simple bolt SHALL be suitable for: UI work, integrations, utilities, scripts

### FR-6: Smart Bolt Type Selection

- FR-6.1: Bolt plan skill SHALL read default bolt type from `catalog.yaml` based on unit type
- FR-6.2: Bolt plan skill SHALL NOT hardcode bolt type
- FR-6.3: Bolt type selection SHALL be overridable per unit in unit-brief.md

---

## Non-Functional Requirements

### NFR-1: Single Source of Truth

- Project type definitions SHALL be managed in one place (`catalog.yaml`)
- Adding a new project type SHALL NOT require modifying skill files

### NFR-2: Backward Compatibility

- Existing projects without `project.yaml` SHALL default to `backend-api` behavior
- Existing bolt files with `type: ddd-construction-bolt` SHALL continue to work

### NFR-3: Extensibility

- New unit types (e.g., `mobile`, `embedded`) SHALL be addable via catalog
- New bolt types SHALL be registerable in catalog

---

## Acceptance Criteria

### AC-1: Full-Stack Project Creates Frontend Unit

- GIVEN a project with `project_type: full-stack-web` in project.yaml
- WHEN Inception Agent executes units skill
- THEN a frontend unit is created alongside backend service units

### AC-2: Frontend Unit Has Correct Dependencies

- GIVEN a full-stack project with backend units: auth-service, expense-service
- WHEN frontend unit `expense-tracker-ui` is created
- THEN it lists auth-service and expense-service as dependencies

### AC-3: Frontend Bolts Use Simple Bolt Type

- GIVEN a frontend unit with stories
- WHEN bolt-plan skill creates bolts for the unit
- THEN bolts have `type: simple-construction-bolt`

### AC-4: Backend-Only Project Has No Frontend

- GIVEN a project with `project_type: backend-api`
- WHEN Inception Agent executes units skill
- THEN no frontend unit is created

### AC-5: Catalog Defines Project Structure

- GIVEN `catalog.yaml` with `project_types.full-stack-web.unit_structure`
- WHEN units skill reads the configuration
- THEN it knows to create both backend and frontend units

---

## Out of Scope

- Mobile app unit type (future intent)
- Automatic frontend component generation from API specs
- Design system / UI kit selection during inception
