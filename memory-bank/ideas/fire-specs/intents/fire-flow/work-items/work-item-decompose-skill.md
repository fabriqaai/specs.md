---
id: work-item-decompose-skill
title: Work Item Decomposition Skill
complexity: medium
status: pending
depends_on: [planner-agent]
tags: [skill, planner, phase-2]
---

# Work Item Decomposition Skill

## Description

Create the work-item-decompose skill that takes an approved intent and breaks it into atomic, actionable work items. This skill is more structured than intent-capture because decomposition follows patterns and has clear criteria for "good" work items.

## Acceptance Criteria

- [ ] Create `SKILL.md` with decomposition workflow
- [ ] Define complexity assessment criteria
- [ ] Define dependency identification rules
- [ ] Create Handlebars template for work items
- [ ] Create script to generate work items batch
- [ ] Skill suggests execution modes based on complexity
- [ ] Skill validates no circular dependencies
- [ ] Skill integrates with state-management to register work items

## SKILL.md Content (Detailed)

```xml
---
name: work-item-decompose
description: Decompose approved intent into atomic work items
version: 1.0.0
---

<skill name="work-item-decompose">

  <objective>
    Break down an approved Intent into atomic Work Items, each representing
    a single deliverable that can be completed in one Run.
  </objective>

  <principles>
    <principle priority="critical">Each work item = one deliverable</principle>
    <principle priority="critical">Work items must be independently testable</principle>
    <principle priority="high">Identify dependencies explicitly</principle>
    <principle priority="high">Assess complexity honestly</principle>
    <principle priority="medium">Order by dependency graph, not preference</principle>
  </principles>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- DECOMPOSITION RULES - These are MEDIUM FREEDOM (structured)     -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <decomposition-rules>
    <rule id="atomic">
      <name>Atomic Deliverable</name>
      <description>
        A work item should produce ONE tangible output:
        - A working feature
        - An API endpoint
        - A component
        - A migration
        - A configuration
      </description>
      <test>Can you demo/test this independently?</test>
      <anti-pattern>
        "Set up authentication" - too vague, multiple deliverables
      </anti-pattern>
      <good-example>
        "User registration endpoint" - one endpoint, testable
      </good-example>
    </rule>

    <rule id="vertical-slice">
      <name>Vertical Slice</name>
      <description>
        Prefer vertical slices (full stack for one feature) over
        horizontal slices (all backend, then all frontend).
      </description>
      <anti-pattern>
        1. Create all database tables
        2. Create all API endpoints
        3. Create all UI components
      </anti-pattern>
      <good-example>
        1. User registration (DB + API + UI)
        2. User login (DB + API + UI)
        3. Password reset (DB + API + UI)
      </good-example>
    </rule>

    <rule id="size-guideline">
      <name>Size Guideline</name>
      <description>
        A work item should be completable in hours to 1-2 days.
        If longer, consider splitting.
      </description>
      <split-signals>
        - More than 10 files to create/modify
        - Multiple unrelated concerns
        - "and" in the title (do X AND Y)
      </split-signals>
    </rule>

    <rule id="dependency-direction">
      <name>Dependency Direction</name>
      <description>
        Dependencies flow: Data → Backend → Frontend → Polish
      </description>
      <order>
        1. Database/Schema changes
        2. Core business logic
        3. API endpoints
        4. UI components
        5. Integration/Polish
      </order>
    </rule>
  </decomposition-rules>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- COMPLEXITY ASSESSMENT - LOW FREEDOM (deterministic criteria)    -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <complexity-assessment>
    <level name="low">
      <criteria>
        - Clear, well-defined requirements
        - No architectural decisions needed
        - Single component/file focus
        - Similar patterns exist in codebase
        - Estimated: 1-3 files, few hours
      </criteria>
      <suggested-mode>autopilot</suggested-mode>
      <examples>
        - Add logout button
        - Create simple CRUD endpoint
        - Add form validation
        - Fix typo/bug with obvious solution
      </examples>
    </level>

    <level name="medium">
      <criteria>
        - Some design decisions needed
        - Multiple files involved (3-8)
        - May touch multiple layers (API + UI)
        - Requirements mostly clear
        - Estimated: 1 day
      </criteria>
      <suggested-mode>confirm</suggested-mode>
      <examples>
        - User registration with email verification
        - Search functionality with filters
        - File upload with validation
        - Dashboard with multiple data sources
      </examples>
    </level>

    <level name="high">
      <criteria>
        - Architectural decisions required
        - Many files (8+) or new patterns
        - Touches core business logic
        - Security/payment implications
        - Integration with external services
        - Estimated: 1-2+ days
      </criteria>
      <suggested-mode>validate</suggested-mode>
      <examples>
        - OAuth2 multi-provider integration
        - Payment processing flow
        - Real-time collaboration features
        - Permission/RBAC system
        - Database migration with data transform
      </examples>
    </level>
  </complexity-assessment>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- WORKFLOW                                                        -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <workflow>
    <step n="1" title="Load Intent">
      <action>Read intent brief from .specs-fire/intents/{id}/brief.md</action>
      <action>Parse requirements and success criteria</action>
    </step>

    <step n="2" title="Identify Natural Boundaries">
      <prompt>
        Looking at this intent, what are the natural boundaries?
        Consider:
        - User-facing features
        - Data entities
        - External integrations
        - Configuration/setup needs
      </prompt>
      <output>List of potential work items (draft)</output>
    </step>

    <step n="3" title="Apply Decomposition Rules">
      <action>For each draft item, validate against rules:</action>
      <checklist>
        <check rule="atomic">Is this one deliverable?</check>
        <check rule="vertical-slice">Is this a vertical slice?</check>
        <check rule="size-guideline">Is this 1-2 days or less?</check>
        <check rule="dependency-direction">Are dependencies correct?</check>
      </checklist>
      <if-fails>Split the item and re-check</if-fails>
    </step>

    <step n="4" title="Assess Complexity">
      <action>For each work item:</action>
      <checklist>
        <check>Evaluate against complexity criteria</check>
        <check>Assign: low | medium | high</check>
        <check>Suggest execution mode</check>
      </checklist>
    </step>

    <step n="5" title="Map Dependencies">
      <action>For each work item, identify:</action>
      <checklist>
        <check>What must exist before this can start?</check>
        <check>What does this enable?</check>
      </checklist>
      <validation script="validate-no-cycles.ts">
        Ensure no circular dependencies
      </validation>
    </step>

    <step n="6" title="Present for Approval">
      <output format="table">
        | # | Work Item | Complexity | Mode | Depends On |
        |---|-----------|------------|------|------------|
        | 1 | ... | low | autopilot | - |
        | 2 | ... | medium | confirm | 1 |
        | 3 | ... | high | validate | 1, 2 |
      </output>

      <checkpoint>
        Does this breakdown look right?
        [Y] Approve and generate files
        [n] Let me adjust
        [+] Add another work item
        [-] Remove a work item
        [~] Change complexity/mode
      </checkpoint>
    </step>

    <step n="7" title="Generate Work Item Files">
      <action script="generate-work-items.ts">
        Generate work item markdown files from template
      </action>
      <action script="state-update-intent.ts">
        Update state.yaml with work items
      </action>
      <output>
        Created {N} work items in .specs-fire/intents/{intent}/work-items/
        State updated.

        Ready to start a run? First suggested: {first-unblocked-item}
      </output>
    </step>
  </workflow>

  <anti-patterns>
    <avoid>Creating horizontal slices (all DB, all API, all UI)</avoid>
    <avoid>Underestimating complexity to look good</avoid>
    <avoid>Circular dependencies</avoid>
    <avoid>Work items with "and" in the title</avoid>
    <avoid>Vague items like "Set up X" or "Handle Y"</avoid>
  </anti-patterns>

  <templates>
    <template name="work-item" path="./templates/work-item.md.hbs"/>
  </templates>

  <scripts>
    <script name="generate-work-items" path="./scripts/generate-work-items.ts">
      Batch generates work item files from structured data
    </script>
    <script name="validate-no-cycles" path="./scripts/validate-no-cycles.ts">
      Validates dependency graph has no cycles
    </script>
  </scripts>

</skill>
```

## Template: work-item.md.hbs

```handlebars
---
id: {{id}}
title: {{title}}
complexity: {{complexity}}
status: pending
{{#if depends_on}}
depends_on: [{{#each depends_on}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}]
{{/if}}
{{#if tags}}
tags: [{{#each tags}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}]
{{/if}}
suggested_mode: {{suggested_mode}}
---

# {{title}}

## Description

{{description}}

## Acceptance Criteria

{{#each acceptance_criteria}}
- [ ] {{this}}
{{/each}}

{{#if technical_notes}}
## Technical Notes

{{technical_notes}}
{{/if}}

{{#if depends_on}}
## Dependencies

{{#each depends_on}}
- Requires: {{this}}
{{/each}}
{{/if}}
```

## Script: generate-work-items.ts

```typescript
import { parseArgs } from 'util';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import Handlebars from 'handlebars';

const { values } = parseArgs({
  options: {
    intent: { type: 'string' },
    data: { type: 'string' }  // JSON file with work items array
  }
});

const template = Handlebars.compile(
  readFileSync('./templates/work-item.md.hbs', 'utf8')
);

const workItems = JSON.parse(readFileSync(values.data!, 'utf8'));
const outputDir = `.specs-fire/intents/${values.intent}/work-items`;

mkdirSync(outputDir, { recursive: true });

const created: string[] = [];

for (const item of workItems) {
  const output = template(item);
  const filePath = `${outputDir}/${item.id}.md`;
  writeFileSync(filePath, output);
  created.push(filePath);
}

console.log(JSON.stringify({
  success: true,
  intent: values.intent,
  work_items_created: created.length,
  files: created
}));
```

## Script: validate-no-cycles.ts

```typescript
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    data: { type: 'string' }  // JSON with work items and dependencies
  }
});

interface WorkItem {
  id: string;
  depends_on?: string[];
}

const workItems: WorkItem[] = JSON.parse(
  require('fs').readFileSync(values.data!, 'utf8')
);

// Build adjacency list
const graph = new Map<string, string[]>();
for (const item of workItems) {
  graph.set(item.id, item.depends_on || []);
}

// DFS cycle detection
function hasCycle(): string[] | null {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    path.pop();
    recStack.delete(node);
    return false;
  }

  for (const [node] of graph) {
    if (!visited.has(node)) {
      if (dfs(node)) return path;
    }
  }
  return null;
}

const cycle = hasCycle();

console.log(JSON.stringify({
  success: cycle === null,
  error: cycle ? `Circular dependency detected: ${cycle.join(' → ')}` : undefined
}));

process.exit(cycle ? 1 : 0);
```

## Granularity Comparison

| Aspect | intent-capture | work-item-decompose |
|--------|----------------|---------------------|
| Freedom Level | HIGH | MEDIUM |
| Structure | Conversational phases | Rule-based checklist |
| Questions | Open-ended elicitation | Validation checks |
| Output Format | Flexible narrative | Structured table |
| Scripts | Validation only | Generation + validation |

**Intent capture** is exploratory - we don't know what we'll find.

**Decomposition** is analytical - we apply known patterns to break things down.

## File Location

```
fire/agents/planner/skills/work-item-decompose/
├── SKILL.md
├── templates/
│   └── work-item.md.hbs
└── scripts/
    ├── generate-work-items.ts
    └── validate-no-cycles.ts
```

## Dependencies

- planner-agent: This skill is owned by planner
- intent-capture: Work items come from approved intents
- state-management: For registering work items in state.yaml
