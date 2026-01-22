---
id: standards-init-skill
title: Standards Initialization Skill
complexity: medium
status: pending
depends_on: [workspace-detect-skill]
tags: [skill, planner, phase-4]
---

# Standards Initialization Skill

## Description

Create the standards-init skill that handles project standards initialization for both greenfield and brownfield projects. For greenfield, offers AI-suggested standards or manual Q&A. For brownfield, automatically analyzes existing code to infer standards.

## Acceptance Criteria

- [ ] Create `SKILL.md` with initialization workflow
- [ ] Create greenfield.md reference for AI-suggested flow
- [ ] Create brownfield.md reference for auto-detection flow
- [ ] Create templates for all standard documents
- [ ] Implement standards catalog (questions, options, defaults)
- [ ] Generate: tech-stack.md, coding-standards.md, folder-structure.md
- [ ] For brownfield: generate system-context.md, project-summary.md

## SKILL.md Content

```xml
---
name: standards-init
description: Initialize project standards for greenfield or brownfield projects
version: 1.0.0
---

<skill name="standards-init">

  <objective>
    Initialize project standards that guide AI code generation.
    Adapts approach based on workspace type (greenfield vs brownfield).
  </objective>

  <quick_start>
    1. Run workspace-detect first (or auto-detected)
    2. Skill routes to greenfield or brownfield flow
    3. For greenfield: describe project → get AI suggestions → approve
    4. For brownfield: auto-analyze → review → confirm
    5. Standards saved to .specs-fire/standards/
  </quick_start>

  <essential_principles>
    <principle priority="critical">NEVER assume tech choices - always confirm</principle>
    <principle priority="critical">For brownfield: infer from existing code, don't impose</principle>
    <principle priority="high">Standards must be actionable by AI agents</principle>
  </essential_principles>

  <intake>
    <check if="workspace.type not detected">
      <invoke-skill>workspace-detect</invoke-skill>
    </check>
  </intake>

  <routing>
    <route if="workspace.type == greenfield" reference="./greenfield.md"/>
    <route if="workspace.type == brownfield" reference="./brownfield.md"/>
  </routing>

  <standards_catalog>
    <standard id="tech-stack" required="true" order="1">
      <name>Tech Stack</name>
      <questions>
        <question id="language">
          What programming language?
          <options>
            <option value="typescript" default_for="saas,web,api">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python" default_for="ml,data">Python</option>
            <option value="go" default_for="cli,infra">Go</option>
          </options>
        </question>
        <question id="framework" depends_on="language">
          What framework?
          <options_by_language>
            <typescript>Next.js, Remix, Express, Fastify, NestJS</typescript>
            <python>FastAPI, Django, Flask</python>
            <go>Gin, Echo, Fiber</go>
          </options_by_language>
        </question>
        <question id="database">
          What database?
          <options>
            <option value="postgresql" default="true">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
            <option value="sqlite">SQLite</option>
          </options>
        </question>
      </questions>
    </standard>

    <standard id="coding-standards" required="true" order="2">
      <name>Coding Standards</name>
      <questions>
        <question id="formatter">Code formatter?</question>
        <question id="linter">Linting strictness?</question>
        <question id="test_framework">Testing framework?</question>
        <question id="coverage">Coverage requirement?</question>
      </questions>
    </standard>

    <standard id="folder-structure" required="true" order="3">
      <name>Folder Structure</name>
      <infer_from>Existing project layout or framework conventions</infer_from>
    </standard>
  </standards_catalog>

  <greenfield_flow>
    <step n="1" title="Choose Approach">
      <ask>
        How would you like to define standards?

        [1] AI Suggests (Recommended) - Describe your project, get smart defaults
        [2] Manual Setup - Answer each question individually
      </ask>
    </step>

    <step n="2a" title="AI Suggested" if="approach == ai_suggests">
      <ask>
        What do you want to build? Tell me about:
        - What the project does
        - Target users
        - Key features
      </ask>
      <action>Analyze description, suggest standards</action>
      <iterate over="standards_catalog" as="standard">
        <output>
          ## {{standard.name}}
          [Suggested values with rationale]

          Accept? [Y/n/modify]
        </output>
      </iterate>
    </step>

    <step n="2b" title="Manual Setup" if="approach == manual">
      <iterate over="standards_catalog" as="standard">
        <iterate over="standard.questions" as="question">
          <ask>{{question.text}}</ask>
        </iterate>
      </iterate>
    </step>

    <step n="3" title="Generate Standards Files">
      <action script="generate-standards.ts">
        Generate all standard documents from answers
      </action>
    </step>
  </greenfield_flow>

  <brownfield_flow>
    <step n="1" title="Inform User">
      <output>
        Existing project detected. We'll analyze your codebase to infer standards.
        This helps AI agents generate code that matches your existing patterns.

        Start analysis? [Y/n]
      </output>
    </step>

    <step n="2" title="Analyze Codebase">
      <action script="analyze-tech-stack.ts">Detect languages, frameworks, dependencies</action>
      <action script="analyze-coding-patterns.ts">Infer coding conventions</action>
      <action script="analyze-folder-structure.ts">Document project layout</action>
      <action script="analyze-system-context.ts">Detect external integrations</action>
    </step>

    <step n="3" title="Present Findings">
      <output>
        Here's what we found:

        ## Tech Stack
        [Detected technologies]

        ## Coding Standards
        [Inferred patterns]

        ## System Context
        [External integrations]

        Does this look accurate? [Y/n/edit]
      </output>
    </step>

    <step n="4" title="Generate Standards Files">
      <action script="generate-standards.ts">
        Generate standards documents from analysis
      </action>
      <output>
        Standards generated:
        - .specs-fire/standards/tech-stack.md
        - .specs-fire/standards/coding-standards.md
        - .specs-fire/standards/folder-structure.md
        - .specs-fire/standards/system-context.md
        - .specs-fire/standards/project-summary.md
      </output>
    </step>
  </brownfield_flow>

  <templates>
    <template name="tech-stack" path="./templates/tech-stack.md.hbs"/>
    <template name="coding-standards" path="./templates/coding-standards.md.hbs"/>
    <template name="folder-structure" path="./templates/folder-structure.md.hbs"/>
    <template name="system-context" path="./templates/system-context.md.hbs"/>
    <template name="project-summary" path="./templates/project-summary.md.hbs"/>
  </templates>

  <scripts>
    <script name="suggest-standards" path="./scripts/suggest-standards.ts"/>
    <script name="generate-standards" path="./scripts/generate-standards.ts"/>
    <script name="analyze-tech-stack" path="./scripts/analyze-tech-stack.ts"/>
    <script name="analyze-coding-patterns" path="./scripts/analyze-coding-patterns.ts"/>
    <script name="analyze-folder-structure" path="./scripts/analyze-folder-structure.ts"/>
    <script name="analyze-system-context" path="./scripts/analyze-system-context.ts"/>
  </scripts>

  <success_criteria>
    <criterion>All required standards files generated</criterion>
    <criterion>User confirmed standards are accurate</criterion>
    <criterion>Standards are actionable for AI agents</criterion>
  </success_criteria>

</skill>
```

## File Location

```
fire/agents/planner/skills/standards-init/
├── SKILL.md
├── greenfield.md           # Detailed greenfield flow
├── brownfield.md           # Detailed brownfield flow
├── templates/
│   ├── tech-stack.md.hbs
│   ├── coding-standards.md.hbs
│   ├── folder-structure.md.hbs
│   ├── system-context.md.hbs
│   └── project-summary.md.hbs
└── scripts/
    ├── suggest-standards.ts
    ├── generate-standards.ts
    ├── analyze-tech-stack.ts
    ├── analyze-coding-patterns.ts
    ├── analyze-folder-structure.ts
    └── analyze-system-context.ts
```

## Dependencies

- workspace-detect-skill: Must know if greenfield/brownfield first
- planner-agent: This skill is owned by planner
