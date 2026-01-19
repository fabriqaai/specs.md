---
id: run-execute-skill
title: Run Execution Skill
complexity: high
status: pending
depends_on: [builder-agent]
tags: [skill, builder, phase-2]
---

# Run Execution Skill

## Description

Create the run-execute skill that handles the actual execution of work items. This is the core skill for the Builder agent. It manages the three execution modes (Autopilot, Confirm, Validate) and coordinates state updates, file tracking, and run log management.

## Acceptance Criteria

- [ ] Create `SKILL.md` with mode-specific workflows
- [ ] Create mode reference docs: `autopilot.md`, `confirm.md`, `validate.md`
- [ ] Create run log template
- [ ] Create scripts: `run-create.ts`, `run-update.ts`, `run-finalize.ts`
- [ ] Skill enforces checkpoints per mode (0, 1, or 2)
- [ ] Skill tracks files created/modified during execution
- [ ] Skill integrates with state-management for status updates
- [ ] Skill triggers walkthrough generation on completion

## SKILL.md Content (Detailed)

```xml
---
name: run-execute
description: Execute work items with appropriate oversight level
version: 1.0.0
---

<skill name="run-execute">

  <objective>
    Execute work items from the current run, following the appropriate
    execution mode and tracking all changes for traceability.
  </objective>

  <principles>
    <principle priority="critical">Follow execution mode strictly</principle>
    <principle priority="critical">Update state via scripts, never manually</principle>
    <principle priority="critical">Track all file changes</principle>
    <principle priority="high">Generate walkthrough after completion</principle>
    <principle priority="high">Respect brownfield rules in existing codebases</principle>
  </principles>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- EXECUTION MODES                                                 -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <execution-modes>

    <mode name="autopilot" checkpoints="0">
      <description>
        Full autonomy for simple, well-understood tasks.
        Execute and inform - no approval needed.
      </description>
      <when-to-use>
        - Low complexity work items
        - Clear requirements, no ambiguity
        - Similar patterns exist in codebase
        - No security/payment code involved
        - User explicitly requested autopilot
      </when-to-use>
      <workflow>
        1. Announce: "Executing {item} in Autopilot mode"
        2. Implement solution
        3. Run tests
        4. Report: files created, tests added, summary
        5. Update state → mark complete
        6. Trigger walkthrough generation
      </workflow>
      <see-reference>./autopilot.md</see-reference>
    </mode>

    <mode name="confirm" checkpoints="1">
      <description>
        Plan approval before execution.
        User sees what will happen, approves, then AI executes.
      </description>
      <when-to-use>
        - Medium complexity work items
        - Some design decisions needed
        - Multiple files involved
        - User wants visibility
      </when-to-use>
      <workflow>
        1. Announce: "Planning {item} in Confirm mode"
        2. Analyze requirements
        3. Create plan summary:
           - Approach overview
           - Files to create/modify
           - Key decisions
        4. CHECKPOINT: "Proceed with this plan? [Y/n/modify]"
        5. If approved → implement
        6. Run tests
        7. Report: changes made, tests passing
        8. Update state → mark complete
        9. Trigger walkthrough generation
      </workflow>
      <see-reference>./confirm.md</see-reference>
    </mode>

    <mode name="validate" checkpoints="2">
      <description>
        Design approval + implementation review.
        For complex or high-risk work items.
      </description>
      <when-to-use>
        - High complexity work items
        - Architectural decisions required
        - Security or payment code
        - Many files (8+)
        - User explicitly requested validate
      </when-to-use>
      <workflow>
        1. Announce: "Designing {item} in Validate mode"
        2. Create design document:
           - Summary
           - Key decisions table
           - Domain model (if applicable)
           - Technical approach
           - Risks & mitigations
        3. CHECKPOINT 1: "Approve design? [Y/n/modify]"
        4. If approved → implement
        5. Run tests
        6. Create implementation summary:
           - Files created/modified
           - Tests added
           - Coverage
           - Key changes
        7. CHECKPOINT 2: "Review implementation? [Y/n/see diff]"
        8. If approved → update state → mark complete
        9. Trigger walkthrough generation
      </workflow>
      <see-reference>./validate.md</see-reference>
    </mode>

  </execution-modes>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- BROWNFIELD RULES                                                -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <brownfield-rules priority="critical">
    <rule id="search-before-create">
      Before creating any file, check if similar functionality exists.
      Extend existing modules rather than creating duplicates.
    </rule>
    <rule id="respect-patterns">
      Follow existing naming conventions, folder structures, and patterns.
      Don't introduce new patterns unless explicitly approved.
    </rule>
    <rule id="minimal-changes">
      Make targeted edits. Avoid rewriting files when small changes suffice.
      Git blame should show focused, intentional changes.
    </rule>
    <rule id="preserve-tests">
      Never delete or modify existing tests without explicit approval.
      Add new tests, don't replace.
    </rule>
  </brownfield-rules>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- FILE TRACKING                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <file-tracking>
    <description>
      Track all file operations during execution for:
      - Run log accuracy
      - Walkthrough generation
      - Rollback capability (future)
    </description>
    <track>
      <created>New files created during this work item</created>
      <modified>Existing files modified</modified>
      <deleted>Files removed (rare, requires approval)</deleted>
    </track>
    <on-complete>
      Include in run log and pass to walkthrough-generate skill
    </on-complete>
  </file-tracking>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- WORKFLOW                                                        -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  <workflow>
    <step n="1" title="Initialize Run">
      <check>Is there an active run?</check>
      <if-no>
        <action script="run-create.ts">Create new run</action>
        <action script="state-set-active-run.ts">Set active in state</action>
      </if-no>
      <if-yes>
        <output>Resuming Run {id}</output>
      </if-yes>
    </step>

    <step n="2" title="Select Work Item">
      <check>User specified item, or suggest next?</check>
      <if-suggest>
        Analyze dependencies, suggest unblocked items with priority order
      </if-suggest>
      <action script="state-update-work-item.ts">
        Mark item as in_progress
      </action>
    </step>

    <step n="3" title="Determine Mode">
      <check>User override? Use that mode</check>
      <check>Otherwise, use suggested_mode from work item</check>
      <output>Announce mode to user</output>
    </step>

    <step n="4" title="Execute Per Mode">
      <branch mode="autopilot">
        <invoke-reference>./autopilot.md</invoke-reference>
      </branch>
      <branch mode="confirm">
        <invoke-reference>./confirm.md</invoke-reference>
      </branch>
      <branch mode="validate">
        <invoke-reference>./validate.md</invoke-reference>
      </branch>
    </step>

    <step n="5" title="Update Run Log">
      <action script="run-update.ts">
        Add work item result to run log:
        - status
        - mode used
        - files created/modified
        - tests added
        - decisions made
      </action>
    </step>

    <step n="6" title="Update State">
      <action script="state-update-work-item.ts">
        Mark work item as done, link to run
      </action>
      <action script="state-recalculate-summary.ts">
        Update summary counts
      </action>
    </step>

    <step n="7" title="Generate Walkthrough">
      <invoke-skill>walkthrough-generate</invoke-skill>
    </step>

    <step n="8" title="Continue or End">
      <prompt>
        {item} complete.

        Next options:
        - Continue with {next-suggested-item}?
        - Pick different item?
        - End this run?
      </prompt>
      <if-continue>Go to step 2</if-continue>
      <if-end>
        <action script="run-finalize.ts">Finalize run</action>
        <action script="state-set-active-run.ts">Clear active run</action>
      </if-end>
    </step>
  </workflow>

  <templates>
    <template name="run-log" path="./templates/run-log.yaml.hbs"/>
  </templates>

  <scripts>
    <script name="run-create" path="./scripts/run-create.ts">
      Creates new run with next sequential ID
    </script>
    <script name="run-update" path="./scripts/run-update.ts">
      Adds work item result to run log
    </script>
    <script name="run-finalize" path="./scripts/run-finalize.ts">
      Marks run complete, calculates duration
    </script>
  </scripts>

</skill>
```

## Mode Reference: autopilot.md

```markdown
# Autopilot Mode

## Behavior

Execute with full autonomy. No checkpoints - just inform.

## Flow

1. **Announce**
   ```
   Executing "{work_item}" in Autopilot mode (high confidence, low complexity)
   ```

2. **Implement**
   - Follow brownfield rules if existing codebase
   - Write clean, tested code
   - Follow project coding standards

3. **Test**
   - Run existing tests (ensure no regressions)
   - Add new tests for new functionality

4. **Report**
   ```
   Done. Here's what I did:

   Changes:
   • Created src/components/LogoutButton.tsx
   • Modified src/components/Navbar.tsx
   • Added 3 unit tests

   Files: 1 created, 1 modified
   Tests: 3 added, all passing
   ```

## When to Elevate

If during execution you discover:
- More complexity than expected
- Architectural decisions needed
- Security implications

Then STOP and say:
```
I started in Autopilot but this is more complex than expected.
Switching to Confirm mode. Here's my plan: [...]
```
```

## Mode Reference: confirm.md

```markdown
# Confirm Mode

## Behavior

Show plan, get approval, then execute.

## Flow

1. **Plan**
   ```
   Planning "{work_item}" in Confirm mode

   PLAN:
   ┌─────────────────────────────────────────────────┐
   │ Approach: [Brief description]                   │
   │                                                 │
   │ Will create:                                    │
   │ • src/services/authService.ts                   │
   │ • src/routes/auth.ts                            │
   │                                                 │
   │ Will modify:                                    │
   │ • src/app.ts (register routes)                  │
   │                                                 │
   │ Key decisions:                                  │
   │ • JWT expiry: 24 hours                          │
   │ • Token storage: HTTP-only cookie               │
   └─────────────────────────────────────────────────┘

   Proceed? [Y/n/modify]
   ```

2. **CHECKPOINT** - Wait for approval

3. **Execute** - Implement the plan

4. **Report**
   ```
   Done.

   Files created: 2
   Files modified: 1
   Tests added: 8
   All tests passing.
   ```
```

## File Location

```
fire/agents/builder/skills/run-execute/
├── SKILL.md
├── autopilot.md
├── confirm.md
├── validate.md
├── templates/
│   └── run-log.yaml.hbs
└── scripts/
    ├── run-create.ts
    ├── run-update.ts
    └── run-finalize.ts
```

## Dependencies

- builder-agent: This skill is owned by builder
- state-management: For all state updates
- walkthrough-generate: Triggered after work item completion
