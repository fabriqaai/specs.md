# Skill: Work Item Decompose

Break an intent into discrete, executable work items.

---

## Trigger

- Intent exists without work items
- User wants to plan execution

---

## Degrees of Freedom

**MEDIUM** — Follow decomposition patterns but adapt to the specific intent.

---

## Workflow

```xml
<skill name="work-item-decompose">

  <mandate>
    Each work item MUST be completable in a single run.
    Each work item MUST have clear acceptance criteria.
    Dependencies MUST be explicit and validated.
  </mandate>

  <step n="1" title="Load Intent">
    <action>Read intent brief from .specs-fire/intents/{intent-id}/brief.md</action>
    <action>Understand goal, users, success criteria</action>
  </step>

  <step n="2" title="Identify Deliverables">
    <action>Break intent into discrete deliverables</action>
    <action>Each deliverable should be independently valuable</action>

    <guidelines>
      - Prefer vertical slices over horizontal layers
      - Start with foundation pieces (models, schemas)
      - End with integration pieces (API, UI)
      - Keep each item focused on ONE concern
    </guidelines>
  </step>

  <step n="3" title="Assess Complexity">
    <action>For each work item, assess RAW complexity:</action>

    <complexity level="low">
      - Single file or few files
      - Well-understood pattern
      - No external dependencies
      - Examples: bug fix, config change, simple utility
    </complexity>

    <complexity level="medium">
      - Multiple files
      - Standard patterns with some decisions
      - May touch existing code
      - Examples: new endpoint, new component, feature addition
    </complexity>

    <complexity level="high">
      - Architectural decisions required
      - Security or data implications
      - Core system changes
      - Examples: auth system, payment flow, database migration
    </complexity>
  </step>

  <step n="3b" title="Apply Autonomy Bias">
    <action>Read workspace.autonomy_bias from state.yaml</action>
    <action>Apply bias to determine final execution mode:</action>

    <bias-table>
      | Raw Complexity | autonomous | balanced | controlled |
      |----------------|------------|----------|------------|
      | low            | autopilot  | autopilot| confirm    |
      | medium         | autopilot  | confirm  | validate   |
      | high           | confirm    | validate | validate   |
    </bias-table>

    <note>
      This allows user preference to shift thresholds:
      - autonomous: trusts AI more, fewer checkpoints
      - balanced: standard behavior (default)
      - controlled: more human oversight
    </note>
  </step>

  <step n="4" title="Define Acceptance Criteria">
    <action>For each work item, define:</action>
    <substep>What must be true when complete</substep>
    <substep>How to verify it works</substep>
    <substep>Any edge cases to handle</substep>
  </step>

  <step n="5" title="Validate Dependencies">
    <action>Check for circular dependencies</action>
    <action>Ensure dependencies exist or will be created first</action>
    <action>Order work items by dependency</action>

    <check if="circular dependency detected">
      <output>
        Warning: Circular dependency detected between {item-a} and {item-b}.
        Suggest splitting into smaller items or reordering.
      </output>
    </check>
  </step>

  <step n="6" title="Present Plan">
    <output>
      ## Work Items for "{intent-title}"

      **Total**: {count} work items
      **Estimated**: {low} autopilot, {medium} confirm, {high} validate

      **Work Item Details**:

      {for each item}
      {n}. **{title}** ({mode}) — {description}
      {/for}

      ---

      Approve this plan? [Y/n/edit]
    </output>
  </step>

  <step n="7" title="Save Work Items">
    <check if="approved">
      <action>Create .specs-fire/intents/{intent-id}/work-items/</action>
      <action>For each work item, save to {work-item-id}.md</action>
      <action>Update state.yaml with work items list</action>
    </check>
  </step>

  <step n="8" title="Transition">
    <output>
      **{count} work items created** for "{intent-title}".

      ---

      Ready to plan execution scope? [Y/n]
    </output>
    <check if="response == y">
      <route-to>builder-agent (run-plan)</route-to>
    </check>
  </step>

</skill>
```

---

## Output

**Work Item** (`.specs-fire/intents/{intent-id}/work-items/{id}.md`):

```markdown
---
id: {work-item-id}
title: {title}
intent: {intent-id}
complexity: low | medium | high
mode: autopilot | confirm | validate
status: pending
depends_on: [{dependency-ids}]
created: {timestamp}
---

# Work Item: {title}

## Description

{What this work item delivers}

## Acceptance Criteria

- [ ] {criterion-1}
- [ ] {criterion-2}
- [ ] {criterion-3}

## Technical Notes

{Any implementation hints or constraints}

## Dependencies

{List of work items this depends on}
```
