# Skill: Design Doc Generate

Generate design documents for Validate mode work items (Checkpoint 1).

---

## Trigger

- Work item has complexity: high
- Work item has mode: validate
- Design review required before implementation

---

## Degrees of Freedom

**LOW** — Follow the design doc structure precisely. Decisions must have rationale.

---

## Workflow

```xml
<skill name="design-doc-generate">

  <mandate>
    Design doc MUST be approved before implementation.
    Document DECISIONS with RATIONALE, not just choices.
    Keep concise - enough detail to implement, no more.
    Include risks upfront - don't hide complexity.
  </mandate>

  <step n="1" title="Analyze Work Item">
    <action>Read work item from .specs-fire/intents/{intent-id}/work-items/{id}.md</action>
    <action>Identify key design decisions needed</action>
    <action>Assess domain modeling needs</action>
    <action>Identify integration points</action>
  </step>

  <step n="2" title="Gather Context">
    <action>Review project standards (.specs-fire/standards/)</action>
    <action>Check existing codebase patterns</action>
    <action>Identify similar implementations to reference</action>
  </step>

  <step n="3" title="Draft Key Decisions">
    <action>For each decision point:</action>
    <substep>Identify options considered</substep>
    <substep>Evaluate trade-offs</substep>
    <substep>Select recommended choice</substep>
    <substep>Document rationale</substep>

    <output-format>
      | Decision | Choice | Rationale |
      |----------|--------|-----------|
      | ... | ... | ... |
    </output-format>
  </step>

  <step n="4" title="Define Domain Model" if="has_domain_complexity">
    <action>Identify entities (things with identity)</action>
    <action>Identify value objects (immutable values)</action>
    <action>Identify domain events (if event-driven)</action>
    <action>Map relationships</action>
  </step>

  <step n="5" title="Design Technical Approach">
    <action>Create component diagram (ASCII)</action>
    <action>Define API contracts (if applicable)</action>
    <action>Specify database changes (if applicable)</action>
    <action>Document data flow</action>
  </step>

  <step n="6" title="Identify Risks">
    <action>List potential risks</action>
    <action>Assess impact (high/medium/low)</action>
    <action>Propose mitigations</action>

    <output-format>
      | Risk | Impact | Mitigation |
      |------|--------|------------|
      | ... | ... | ... |
    </output-format>
  </step>

  <step n="7" title="Create Implementation Checklist">
    <action>Break down into implementation steps</action>
    <action>Order by dependency</action>
    <action>Keep granular but not excessive</action>
  </step>

  <step n="8" title="Present Design Doc">
    <checkpoint message="Design document ready for review">
      <output>
        # Design: {work-item-title}

        ## Summary
        {brief description}

        ## Key Decisions
        {decisions table}

        ## Technical Approach
        {component diagram, API contracts}

        ## Risks
        {risks table}

        ## Implementation Checklist
        {ordered steps}

        ---
        This is Checkpoint 1 of Validate mode.

        Approve design? [Y/n/edit]
      </output>
    </checkpoint>
  </step>

  <step n="9" title="Handle Response">
    <check if="response == y">
      <action>Save design doc to .specs-fire/intents/{intent-id}/work-items/{id}-design.md</action>
      <action>Mark checkpoint 1 as passed</action>
      <output>
        Design approved. Ready for implementation planning.

        Route to Builder for Checkpoint 2 (implementation plan)? [Y/n]
      </output>
    </check>
    <check if="response == edit">
      <ask>What changes are needed?</ask>
      <action>Incorporate feedback</action>
      <goto step="8"/>
    </check>
    <check if="response == n">
      <output>Design rejected. What concerns need to be addressed?</output>
      <action>Gather feedback, revise approach</action>
      <goto step="3"/>
    </check>
  </step>

</skill>
```

---

## Output

**Design Doc** (`.specs-fire/intents/{intent-id}/work-items/{id}-design.md`):

```markdown
---
work_item: {work-item-id}
intent: {intent-id}
created: {timestamp}
mode: validate
checkpoint_1: approved
---

# Design: {title}

## Summary

{Brief description of what will be built and why}

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| {decision} | {choice} | {why} |

## Domain Model

### Entities
- **{Name}**: {description}

### Value Objects
- **{Name}**: {description}

## Technical Approach

### Component Diagram

```
[ASCII diagram]
```

### API Endpoints

- `POST /api/...` - {description}

### Database Changes

```sql
CREATE TABLE ...
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk} | {impact} | {mitigation} |

## Implementation Checklist

- [ ] {step 1}
- [ ] {step 2}
- [ ] {step 3}

---
*Checkpoint 1 approved: {timestamp}*
```
