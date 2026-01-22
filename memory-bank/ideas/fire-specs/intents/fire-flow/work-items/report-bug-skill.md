---
id: report-bug-skill
title: Bug Report Skill
complexity: low
status: pending
depends_on: [orchestrator-agent]
tags: [skill, shared, phase-5, meta]
---

# Bug Report Skill

## Description

Create the report-bug skill that helps users capture and report issues with FIRE. Gathers context automatically, allows user to describe expected vs actual behavior, and optionally creates an anonymized version for sharing on Discord or GitHub.

## Acceptance Criteria

- [ ] Create `SKILL.md` with bug capture workflow
- [ ] Automatically capture FIRE context (state, run, agent actions)
- [ ] Create detailed bug report with timestamp
- [ ] Create anonymized version on request
- [ ] Point user to Discord (#bug-reports) and GitHub Issues
- [ ] Copy report to clipboard for easy sharing
- [ ] Store reports in `.specs-fire/bug-reports/`

## SKILL.md Content

```xml
---
name: report-bug
description: Capture and report FIRE issues with automatic context gathering
version: 1.0.0
---

<skill name="report-bug">

  <objective>
    Help users report FIRE issues by capturing context automatically
    and creating structured bug reports for easy sharing.
  </objective>

  <quick_start>
    1. Run /fire-feedback when something goes wrong
    2. Describe what you expected vs what happened
    3. Review generated report
    4. Optionally create anonymized version
    5. Share on Discord or GitHub
  </quick_start>

  <essential_principles>
    <principle priority="critical">NEVER include secrets, API keys, or credentials</principle>
    <principle priority="high">Capture enough context to reproduce</principle>
    <principle priority="high">Make anonymization thorough but preserve bug context</principle>
  </essential_principles>

  <workflow>
    <step n="1" title="Capture Context">
      <action script="capture-fire-context.ts">
        Automatically gather:
        - FIRE version, specs.md version
        - Current state.yaml snapshot
        - Active run (if any)
        - Recent agent actions (last 10)
        - Environment (OS, Node.js version, AI tool)
      </action>
    </step>

    <step n="2" title="Gather User Input">
      <ask>What were you trying to do?</ask>
      <ask>What did you expect to happen?</ask>
      <ask>What actually happened?</ask>
      <ask>Any error messages? (paste or describe)</ask>
    </step>

    <step n="3" title="Generate Bug Report">
      <action script="bug-report-create.ts">
        Generate report using template:
        - ID: {YYYY-MM-DD}-{sequence}
        - Environment section
        - Context section
        - User description
        - State snapshot
        - Recent actions
        - Steps to reproduce (if identifiable)
      </action>
      <output>
        Bug report created: .specs-fire/bug-reports/{id}-bug-report.md
      </output>
    </step>

    <step n="4" title="Offer Anonymization">
      <ask>
        Would you like to create an anonymized version for sharing?
        This removes project-specific names, file paths, and business logic.
        [Y/n]
      </ask>
      <check if="response == y">
        <action script="bug-report-anonymize.ts">
          Create anonymized version:
          - Project name → "ProjectX"
          - Intent names → "intent-001", "intent-002"
          - Work items → "work-item-A", "work-item-B"
          - File paths → patterns (src/[module]/[file].ts)
          - Business terms → removed
          - Preserve: errors, structure, versions, timing
        </action>
        <output>
          Anonymized report: .specs-fire/bug-reports/{id}-bug-report-anon.md

          Please review to ensure no sensitive information remains.
        </output>
      </check>
    </step>

    <step n="5" title="Share Instructions">
      <output>
        To share this bug report:

        **Discord (Recommended):**
        1. Join: https://discord.specs.md
        2. Go to #bug-reports channel
        3. Create a new post
        4. Paste the report contents

        **GitHub:**
        https://github.com/fabriqaai/specsmd/issues/new

        Copy report to clipboard? [Y/n]
      </output>
      <check if="response == y">
        <action script="clipboard-copy.ts">
          Copy {anonymized ? anonymized_report : full_report} to clipboard
        </action>
        <output>Copied to clipboard. Thank you for helping improve FIRE!</output>
      </check>
    </step>
  </workflow>

  <anonymization_rules>
    <rule category="must_remove">
      <item>API keys and secrets</item>
      <item>Passwords and credentials</item>
      <item>Personal names and emails</item>
      <item>Company names</item>
      <item>Proprietary business logic descriptions</item>
    </rule>

    <rule category="should_anonymize">
      <item>Project name → "ProjectX"</item>
      <item>Intent names → "intent-001", "intent-002"</item>
      <item>Work item names → "work-item-A", "work-item-B"</item>
      <item>File paths → generalized patterns</item>
      <item>Custom domain terms → generic placeholders</item>
    </rule>

    <rule category="must_preserve">
      <item>Error messages (critical for debugging)</item>
      <item>State structure (schema issues)</item>
      <item>Agent action sequence (workflow issues)</item>
      <item>Version numbers (compatibility)</item>
      <item>OS/environment info (platform issues)</item>
      <item>Timing information (race conditions)</item>
    </rule>
  </anonymization_rules>

  <templates>
    <template name="bug-report" path="./templates/bug-report.md.hbs"/>
    <template name="bug-report-anon" path="./templates/bug-report-anon.md.hbs"/>
  </templates>

  <scripts>
    <script name="capture-fire-context" path="./scripts/capture-fire-context.ts"/>
    <script name="bug-report-create" path="./scripts/bug-report-create.ts"/>
    <script name="bug-report-anonymize" path="./scripts/bug-report-anonymize.ts"/>
    <script name="clipboard-copy" path="./scripts/clipboard-copy.ts"/>
  </scripts>

  <success_criteria>
    <criterion>Bug report saved to .specs-fire/bug-reports/</criterion>
    <criterion>User's description captured</criterion>
    <criterion>Context automatically gathered</criterion>
    <criterion>Anonymized version created if requested</criterion>
    <criterion>User informed how to share</criterion>
  </success_criteria>

</skill>
```

## Template: bug-report.md.hbs

```handlebars
---
id: {{id}}
created: {{created}}
fire_version: {{fire_version}}
specsmd_version: {{specsmd_version}}
anonymized: false
---

# Bug Report: {{title}}

## Environment

- OS: {{environment.os}}
- AI Tool: {{environment.ai_tool}}
- Node.js: {{environment.node_version}}

## Context

- Current phase: {{context.phase}}
{{#if context.run_id}}
- Active run: {{context.run_id}}
{{/if}}
{{#if context.intent}}
- Current intent: {{context.intent}}
{{/if}}
{{#if context.work_item}}
- Current work item: {{context.work_item}}
{{/if}}

## What I Was Doing

{{what_doing}}

## What I Expected

{{expected}}

## What Actually Happened

{{actual}}

{{#if error_message}}
## Error Message

```
{{error_message}}
```
{{/if}}

## Relevant State (at time of issue)

```yaml
{{state_snapshot}}
```

{{#if recent_actions}}
## Recent Agent Actions

{{#each recent_actions}}
{{add @index 1}}. {{agent}}: {{action}}
{{/each}}
{{/if}}

{{#if steps_to_reproduce}}
## Steps to Reproduce

{{#each steps_to_reproduce}}
{{add @index 1}}. {{this}}
{{/each}}
{{/if}}

{{#if additional_notes}}
## Additional Notes

{{additional_notes}}
{{/if}}

---
*Share at: https://discord.specs.md #bug-reports or https://github.com/fabriqaai/specsmd/issues*
```

## File Location

```
fire/skills/report-bug/
├── SKILL.md
├── templates/
│   ├── bug-report.md.hbs
│   └── bug-report-anon.md.hbs
└── scripts/
    ├── capture-fire-context.ts
    ├── bug-report-create.ts
    ├── bug-report-anonymize.ts
    └── clipboard-copy.ts
```

## Dependencies

- orchestrator-agent: Can be invoked from any agent context
- state-management: To read current state for context capture
