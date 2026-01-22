---
id: design-doc-generate-skill
title: Design Document Generation Skill
complexity: medium
status: pending
depends_on: [planner-agent]
tags: [skill, planner, phase-2]
---

# Design Document Generation Skill

## Description

Create the design-doc-generate skill that produces design documents for Validate mode work items. Design docs capture architectural decisions, domain model, technical approach, and risks before implementation begins. This is the first checkpoint in Validate mode.

## Acceptance Criteria

- [ ] Create `SKILL.md` with design doc generation workflow
- [ ] Create Handlebars template for design documents
- [ ] Capture key decisions with rationale
- [ ] Include domain model section (entities, value objects, events)
- [ ] Include technical approach with diagrams
- [ ] Include risks and mitigations
- [ ] Include implementation checklist

## SKILL.md Content

```xml
---
name: design-doc-generate
description: Generate design documents for Validate mode work items before implementation
version: 1.0.0
---

<skill name="design-doc-generate">

  <objective>
    Create comprehensive design documents that capture architectural decisions,
    domain model, and technical approach for complex work items. Used as the
    first checkpoint in Validate execution mode.
  </objective>

  <essential_principles>
    <principle priority="critical">Design doc MUST be approved before implementation</principle>
    <principle priority="critical">Document decisions with RATIONALE, not just choices</principle>
    <principle priority="high">Keep concise - enough detail to implement, no more</principle>
    <principle priority="high">Include risks upfront - don't hide complexity</principle>
  </essential_principles>

  <when_to_use>
    <trigger>Work item has complexity: high</trigger>
    <trigger>Work item has suggested_mode: validate</trigger>
    <trigger>User explicitly requests design review</trigger>
    <trigger>Work item touches security, payments, or core architecture</trigger>
  </when_to_use>

  <workflow>
    <step n="1" title="Analyze Work Item">
      <action>Read work item brief and acceptance criteria</action>
      <action>Identify key design decisions needed</action>
      <action>Assess domain modeling needs</action>
      <action>Identify integration points</action>
    </step>

    <step n="2" title="Gather Context">
      <action>Review relevant standards (tech-stack, coding-standards)</action>
      <action>Check existing codebase patterns (if brownfield)</action>
      <action>Identify similar implementations to reference</action>
    </step>

    <step n="3" title="Draft Key Decisions">
      <action>For each decision point:</action>
      <substep n="3a">Identify options considered</substep>
      <substep n="3b">Evaluate trade-offs</substep>
      <substep n="3c">Select recommended choice</substep>
      <substep n="3d">Document rationale</substep>

      <template-output section="decisions">
        | Decision | Choice | Rationale |
        |----------|--------|-----------|
        | ... | ... | ... |
      </template-output>
    </step>

    <step n="4" title="Define Domain Model" if="has_domain_complexity">
      <action>Identify entities (things with identity)</action>
      <action>Identify value objects (immutable values)</action>
      <action>Identify domain events (if event-driven)</action>
      <action>Map relationships</action>

      <template-output section="domain_model">
        ### Entities
        - **User**: [description]

        ### Value Objects
        - **Email**: [description]

        ### Events
        - **UserRegistered**: [description]
      </template-output>
    </step>

    <step n="5" title="Design Technical Approach">
      <action>Create component diagram</action>
      <action>Define API contracts (if applicable)</action>
      <action>Specify database changes (if applicable)</action>
      <action>Document data flow</action>

      <template-output section="technical_approach">
        ### Component Diagram
        ```
        [ASCII diagram]
        ```

        ### API Endpoints
        - `POST /api/...` - [description]

        ### Database Changes
        ```sql
        CREATE TABLE ...
        ```
      </template-output>
    </step>

    <step n="6" title="Identify Risks">
      <action>List potential risks</action>
      <action>Assess impact (high/medium/low)</action>
      <action>Propose mitigations</action>

      <template-output section="risks">
        | Risk | Impact | Mitigation |
        |------|--------|------------|
        | ... | ... | ... |
      </template-output>
    </step>

    <step n="7" title="Create Implementation Checklist">
      <action>Break down into implementation steps</action>
      <action>Order by dependency</action>
      <action>Estimate relative size</action>

      <template-output section="checklist">
        - [ ] Create database migration
        - [ ] Implement domain model
        - [ ] Create API endpoints
        - [ ] Add unit tests
        - [ ] Add integration tests
      </template-output>
    </step>

    <step n="8" title="Generate Design Document">
      <action script="render-design-doc.ts">
        Compile all sections into design document
      </action>
      <action>
        Save to: intents/{intent}/work-items/{work_item}-design.md
      </action>

      <checkpoint message="Design document ready for review">
        <output>
          Design document generated. This is Checkpoint 1 of Validate mode.

          Approve design? [Y/n/modify]
        </output>
      </checkpoint>
    </step>
  </workflow>

  <design_doc_sections>
    <section name="summary" required="true">
      Brief description of what will be built and why.
    </section>

    <section name="key_decisions" required="true">
      Table of decisions with choices and rationale.
    </section>

    <section name="domain_model" required="false">
      Entities, value objects, events. Only for domain-heavy work.
    </section>

    <section name="technical_approach" required="true">
      Component diagram, API contracts, database changes.
    </section>

    <section name="risks" required="true">
      Risks with impact assessment and mitigations.
    </section>

    <section name="implementation_checklist" required="true">
      Ordered list of implementation steps.
    </section>
  </design_doc_sections>

  <templates>
    <template name="design-doc" path="./templates/design-doc.md.hbs"/>
  </templates>

  <scripts>
    <script name="render-design-doc" path="./scripts/render-design-doc.ts">
      Renders design document from structured sections
    </script>
  </scripts>

  <success_criteria>
    <criterion>Design document saved to work-items directory</criterion>
    <criterion>All required sections present</criterion>
    <criterion>Decisions include rationale</criterion>
    <criterion>User approved design before implementation</criterion>
  </success_criteria>

</skill>
```

## Template: design-doc.md.hbs

```handlebars
---
work_item: {{work_item}}
intent: {{intent}}
created: {{created}}
run: {{run_id}}
mode: validate
---

# Design: {{title}}

## Summary

{{summary}}

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
{{#each decisions}}
| {{decision}} | {{choice}} | {{rationale}} |
{{/each}}

{{#if domain_model}}
## Domain Model

### Entities
{{#each domain_model.entities}}
- **{{name}}**: {{description}}
{{/each}}

{{#if domain_model.value_objects}}
### Value Objects
{{#each domain_model.value_objects}}
- **{{name}}**: {{description}}
{{/each}}
{{/if}}

{{#if domain_model.events}}
### Events
{{#each domain_model.events}}
- **{{name}}**: {{description}}
{{/each}}
{{/if}}
{{/if}}

## Technical Approach

{{#if component_diagram}}
### Component Diagram

```
{{component_diagram}}
```
{{/if}}

{{#if api_endpoints}}
### API Endpoints

{{#each api_endpoints}}
- `{{method}} {{path}}` - {{description}}
{{/each}}
{{/if}}

{{#if database_changes}}
### Database Changes

```sql
{{database_changes}}
```
{{/if}}

{{#if data_flow}}
### Data Flow

{{data_flow}}
{{/if}}

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
{{#each risks}}
| {{risk}} | {{impact}} | {{mitigation}} |
{{/each}}

## Implementation Checklist

{{#each checklist}}
- [ ] {{this}}
{{/each}}

---
*Generated for Run {{run_id}} | Mode: Validate*
```

## File Location

```
fire/agents/planner/skills/design-doc-generate/
├── SKILL.md
├── templates/
│   └── design-doc.md.hbs
└── scripts/
    └── render-design-doc.ts
```

## Dependencies

- planner-agent: This skill is owned by planner
- run-execute-skill: Invoked during Validate mode execution
