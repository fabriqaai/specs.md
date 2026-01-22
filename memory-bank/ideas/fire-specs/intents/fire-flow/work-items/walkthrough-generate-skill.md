---
id: walkthrough-generate-skill
title: Walkthrough Generation Skill
complexity: medium
status: pending
depends_on: [builder-agent]
tags: [skill, builder, phase-2]
---

# Walkthrough Generation Skill

## Description

Create the walkthrough-generate skill that produces implementation walkthroughs after each work item completion. Walkthroughs are essential for human review - they document what was built, why decisions were made, and how to verify the changes.

## Acceptance Criteria

- [ ] Create `SKILL.md` with walkthrough generation workflow
- [ ] Create Handlebars template for walkthroughs
- [ ] Capture files created/modified during implementation
- [ ] Document key decisions made during execution
- [ ] Include verification steps (how to test)
- [ ] Include test coverage summary
- [ ] Script generates walkthrough from structured data

## SKILL.md Content

```xml
---
name: walkthrough-generate
description: Generate implementation walkthroughs for human review after work item completion
version: 1.0.0
---

<skill name="walkthrough-generate">

  <objective>
    Generate comprehensive implementation walkthroughs that enable effective
    human review and provide audit trail for completed work items.
  </objective>

  <essential_principles>
    <principle priority="critical">ALWAYS generate walkthrough after work item completion</principle>
    <principle priority="critical">Document DECISIONS, not just changes</principle>
    <principle priority="high">Include verification steps - how to test this works</principle>
    <principle priority="high">Be concise but complete</principle>
  </essential_principles>

  <workflow>
    <step n="1" title="Gather Implementation Data">
      <action>Collect from run context:</action>
      <substep n="1a">Work item details (id, title, intent)</substep>
      <substep n="1b">Files created during implementation</substep>
      <substep n="1c">Files modified during implementation</substep>
      <substep n="1d">Decisions made (from run log)</substep>
      <substep n="1e">Tests added and coverage</substep>
    </step>

    <step n="2" title="Analyze Implementation">
      <action>For each file created/modified:</action>
      <substep n="2a">Identify purpose of the file</substep>
      <substep n="2b">Summarize key changes (for modified files)</substep>
      <substep n="2c">Note any patterns or approaches used</substep>
    </step>

    <step n="3" title="Document Key Details">
      <action>Extract implementation highlights:</action>
      <substep n="3a">Main flow/algorithm implemented</substep>
      <substep n="3b">Security considerations (if applicable)</substep>
      <substep n="3c">Performance considerations (if applicable)</substep>
      <substep n="3d">Integration points with existing code</substep>
    </step>

    <step n="4" title="Create Verification Steps">
      <action>Generate how-to-verify section:</action>
      <substep n="4a">Commands to run the feature</substep>
      <substep n="4b">Expected behavior/output</substep>
      <substep n="4c">Manual test scenarios</substep>
    </step>

    <step n="5" title="Generate Walkthrough">
      <action script="render-walkthrough.ts">
        Render template with gathered data
      </action>
      <action>
        Save to: .specs-fire/walkthroughs/{run_id}-{work_item_id}.md
      </action>
      <output>
        Walkthrough generated: .specs-fire/walkthroughs/{run_id}-{work_item_id}.md
      </output>
    </step>
  </workflow>

  <walkthrough_sections>
    <section name="summary" required="true">
      Brief (2-3 sentences) description of what was implemented.
    </section>

    <section name="files_changed" required="true">
      Tables of files created and modified with purposes.
    </section>

    <section name="implementation_details" required="true">
      Key implementation highlights - the "how" and "why".
    </section>

    <section name="decisions" required="false">
      Table of decisions made with rationale (if any non-trivial decisions).
    </section>

    <section name="verification" required="true">
      Step-by-step guide to verify the implementation works.
    </section>

    <section name="test_coverage" required="true">
      Tests added, coverage percentage, status.
    </section>
  </walkthrough_sections>

  <templates>
    <template name="walkthrough" path="./templates/walkthrough.md.hbs"/>
  </templates>

  <scripts>
    <script name="render-walkthrough" path="./scripts/render-walkthrough.ts">
      Renders walkthrough from structured implementation data
    </script>
  </scripts>

  <success_criteria>
    <criterion>Walkthrough saved to walkthroughs/ directory</criterion>
    <criterion>All required sections present</criterion>
    <criterion>Verification steps are actionable</criterion>
    <criterion>Decisions documented with rationale</criterion>
  </success_criteria>

</skill>
```

## Template: walkthrough.md.hbs

```handlebars
---
work_item: {{work_item}}
intent: {{intent}}
run: {{run_id}}
generated: {{generated}}
mode: {{mode}}
---

# Implementation Walkthrough: {{title}}

## Summary

{{summary}}

## Files Changed

### Created

| File | Purpose |
|------|---------|
{{#each files_created}}
| `{{path}}` | {{purpose}} |
{{/each}}

{{#if files_modified}}
### Modified

| File | Changes |
|------|---------|
{{#each files_modified}}
| `{{path}}` | {{changes}} |
{{/each}}
{{/if}}

## Key Implementation Details

{{#each implementation_details}}
### {{add @index 1}}. {{title}}

{{content}}

{{/each}}

{{#if decisions}}
## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
{{#each decisions}}
| {{decision}} | {{choice}} | {{rationale}} |
{{/each}}
{{/if}}

## How to Verify

{{#each verification_steps}}
{{add @index 1}}. **{{title}}**
   {{#if command}}
   ```bash
   {{command}}
   ```
   {{/if}}
   {{description}}
   {{#if expected}}
   Expected: {{expected}}
   {{/if}}

{{/each}}

## Test Coverage

- Tests added: {{tests_added}}
- Coverage: {{coverage}}%
- Status: {{test_status}}

---
*Generated by fabriqa FIRE Run {{run_id}}*
```

## File Location

```
fire/agents/builder/skills/walkthrough-generate/
├── SKILL.md
├── templates/
│   └── walkthrough.md.hbs
└── scripts/
    └── render-walkthrough.ts
```

## Dependencies

- builder-agent: This skill is owned by builder
- run-execute-skill: Triggered after work item completion
