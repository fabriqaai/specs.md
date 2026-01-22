---
id: intent-capture-skill
title: Intent Capture Skill
complexity: medium
status: pending
depends_on: [planner-agent]
tags: [skill, planner, phase-2]
---

# Intent Capture Skill

## Description

Create the intent-capture skill that guides the Fire Planner through a structured conversation to capture the user's product vision. The skill emphasizes listening over assuming and validates understanding before documenting.

## Acceptance Criteria

- [ ] Create `SKILL.md` with conversation workflow
- [ ] Define elicitation questions for each section
- [ ] Create Handlebars template for intent brief
- [ ] Create validation script for intent structure
- [ ] Skill handles both quick capture and deep exploration modes
- [ ] Each section requires explicit user confirmation
- [ ] Skill integrates with state-management to register new intent

## SKILL.md Content (Detailed)

```xml
---
name: intent-capture
description: Capture user's product vision through structured conversation
version: 1.0.0
---

<skill name="intent-capture">

  <objective>
    Capture the user's product vision, producing a validated Intent Document
    saved to .specs-fire/intents/{id}/brief.md
  </objective>

  <principles>
    <principle priority="critical">Listen more than assume</principle>
    <principle priority="critical">Ask clarifying questions before documenting</principle>
    <principle priority="high">Validate understanding at each step</principle>
    <principle priority="high">Offer elicitation help when user is stuck</principle>
    <principle priority="medium">Keep language simple, avoid jargon</principle>
  </principles>

  <workflow>
    <step n="1" title="Open-Ended Vision">
      <prompt>
        What do you want to build? Tell me in your own words -
        don't worry about structure yet.
      </prompt>
      <listen-for>
        - Core problem being solved
        - Target users (explicit or implied)
        - Key functionality mentioned
        - Success indicators
      </listen-for>
      <checkpoint>
        Before moving on, let me make sure I understand:
        [Summarize in 2-3 sentences]
        Is this accurate? [Y/n/clarify]
      </checkpoint>
    </step>

    <step n="2" title="Requirements Elicitation">
      <prompt>
        Now let's get specific about what this needs to do.
      </prompt>

      <elicitation-questions>
        <question category="functional">
          What are the main things a user should be able to DO with this?
        </question>
        <question category="functional">
          Walk me through the happy path - what's the ideal user journey?
        </question>
        <question category="functional">
          What should happen when things go wrong? (errors, edge cases)
        </question>
        <question category="non-functional">
          Any performance requirements? (speed, scale, availability)
        </question>
        <question category="non-functional">
          Any security or compliance requirements?
        </question>
        <question category="constraints">
          Any technical constraints I should know about?
          (must use X, can't use Y, integrate with Z)
        </question>
      </elicitation-questions>

      <if-user-stuck>
        Let me help. For a [type of system], common requirements include:
        [Provide 3-5 examples relevant to their domain]
        Do any of these apply? What would you add or change?
      </if-user-stuck>

      <checkpoint>
        Here are the requirements I've captured:

        **Functional:**
        [List requirements]

        **Non-Functional:**
        [List requirements]

        Anything missing or incorrect? [Y/n/add more]
      </checkpoint>
    </step>

    <step n="3" title="Success Criteria">
      <prompt>
        How will we know when this is "done"? What does success look like?
      </prompt>

      <elicitation-questions>
        <question>
          If this ships and works perfectly, what would users be able to do
          that they couldn't before?
        </question>
        <question>
          What metrics would indicate success? (optional)
        </question>
        <question>
          What's the minimum viable version vs the ideal version?
        </question>
      </elicitation-questions>

      <checkpoint>
        Success criteria:
        [List as checkboxes]

        Does this capture what "done" means? [Y/n/refine]
      </checkpoint>
    </step>

    <step n="4" title="Generate Intent Document">
      <action>
        Use template to generate intent brief:
        - id: kebab-case from title
        - title: concise name
        - overview: 2-3 sentence summary
        - functional_requirements: from step 2
        - non_functional_requirements: from step 2
        - success_criteria: from step 3
      </action>

      <action script="validate-intent.ts">
        Validate the generated intent structure
      </action>

      <action script="state-update-intent.ts">
        Register intent in state.yaml with status: pending
      </action>

      <output>
        Intent document created: .specs-fire/intents/{id}/brief.md

        Ready to decompose into work items? [Y/n]
        If yes → invoke work-item-decompose skill
      </output>
    </step>
  </workflow>

  <anti-patterns>
    <avoid>Jumping straight to documenting without understanding</avoid>
    <avoid>Assuming requirements the user didn't state</avoid>
    <avoid>Using technical jargon the user hasn't used</avoid>
    <avoid>Creating overly detailed requirements for simple asks</avoid>
    <avoid>Skipping confirmation checkpoints</avoid>
  </anti-patterns>

  <templates>
    <template name="intent-brief" path="./templates/intent-brief.md.hbs"/>
  </templates>

  <scripts>
    <script name="validate-intent" path="./scripts/validate-intent.ts">
      Validates intent brief has all required fields
    </script>
  </scripts>

</skill>
```

## Template: intent-brief.md.hbs

```handlebars
---
id: {{id}}
title: {{title}}
status: pending
priority: {{priority}}
created: {{created}}
---

# {{title}}

## Overview

{{overview}}

## Requirements

### Functional
{{#each functional_requirements}}
- {{this}}
{{/each}}

### Non-Functional
{{#each non_functional_requirements}}
- {{this}}
{{/each}}

## Success Criteria

{{#each success_criteria}}
- [ ] {{this}}
{{/each}}

{{#if notes}}
## Notes

{{notes}}
{{/if}}
```

## Script: validate-intent.ts

```typescript
import { parseArgs } from 'util';
import { readFileSync } from 'fs';
import matter from 'gray-matter';

const { values } = parseArgs({
  options: {
    file: { type: 'string' }
  }
});

const content = readFileSync(values.file!, 'utf8');
const { data, content: body } = matter(content);

const errors: string[] = [];

// Required frontmatter fields
if (!data.id) errors.push('Missing: id');
if (!data.title) errors.push('Missing: title');
if (!data.status) errors.push('Missing: status');

// Required sections
if (!body.includes('## Overview')) errors.push('Missing section: Overview');
if (!body.includes('## Requirements')) errors.push('Missing section: Requirements');
if (!body.includes('## Success Criteria')) errors.push('Missing section: Success Criteria');

// ID format validation
if (data.id && !/^[a-z0-9-]+$/.test(data.id)) {
  errors.push('Invalid id format: must be kebab-case');
}

console.log(JSON.stringify({
  success: errors.length === 0,
  errors: errors.length > 0 ? errors : undefined,
  intent_id: data.id
}));

process.exit(errors.length > 0 ? 1 : 0);
```

## Granularity Notes

**This skill is HIGH FREEDOM** because:
- Intent capture is conversational and creative
- Users express ideas differently
- Rigid scripts feel robotic

**But has structure through:**
- Defined phases (vision → requirements → success criteria)
- Elicitation questions as prompts, not mandates
- Checkpoints after each phase
- Clear output format (template)

## File Location

```
fire/agents/planner/skills/intent-capture/
├── SKILL.md
├── templates/
│   └── intent-brief.md.hbs
└── scripts/
    └── validate-intent.ts
```

## Dependencies

- planner-agent: This skill is owned by planner
- state-management: For registering new intent in state.yaml
