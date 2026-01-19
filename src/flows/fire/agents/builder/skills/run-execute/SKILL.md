# Skill: Run Execute

Execute a work item based on its assigned mode (autopilot, confirm, validate).

---

## Prerequisites

Before executing scripts, ensure required dependencies are installed:

```xml
<prerequisite-check>
  <step n="1" title="Check yaml Package">
    <action>Run: npm list yaml --depth=0 2>/dev/null || echo "NOT_FOUND"</action>
    <check if="output contains NOT_FOUND">
      <output>
        Installing required dependency: yaml
      </output>
      <action>Run: npm install yaml</action>
    </check>
  </step>
</prerequisite-check>
```

**Required packages:**
| Package | Purpose | Install Command |
|---------|---------|-----------------|
| `yaml` | Parse/stringify state.yaml | `npm install yaml` |

---

## Trigger

- Pending work item ready for execution
- Resumed from interrupted run

---

## Degrees of Freedom

**Varies by mode**:
- Autopilot: LOW — Execute standard patterns decisively
- Confirm: MEDIUM — Present plan, adjust based on feedback
- Validate: LOW — Follow approved design precisely

---

## Workflow

```xml
<skill name="run-execute">

  <mandate>
    TRACK ALL FILE OPERATIONS — Every create, modify must be recorded.
    NEVER skip tests — Tests are mandatory, not optional.
    FOLLOW BROWNFIELD RULES — Read before write, match existing patterns.
  </mandate>

  <step n="1" title="Initialize Run">
    <action script="scripts/init-run.ts">Create run record</action>
    <action>Generate run ID: run-{NNN}</action>
    <action>Create folder: .specs-fire/runs/{run-id}/</action>
    <action>Set active_run in state.yaml</action>
  </step>

  <step n="2" title="Load Context">
    <action>Read work item from .specs-fire/intents/{intent}/work-items/{id}.md</action>
    <action>Read intent brief for broader context</action>
    <action>Read project standards (.specs-fire/standards/)</action>
    <action>Determine execution mode from work item</action>
  </step>

  <step n="3a" title="Autopilot Mode" if="mode == autopilot">
    <output>
      Executing in Autopilot mode (0 checkpoints).
      Work item: {title}
    </output>
    <goto step="5"/>
  </step>

  <step n="3b" title="Confirm Mode" if="mode == confirm">
    <action>Generate implementation plan</action>
    <checkpoint>
      <output>
        ## Implementation Plan for "{title}"

        ### Approach
        {describe approach}

        ### Files to Create
        {list files}

        ### Files to Modify
        {list files}

        ### Tests
        {list test files}

        ---
        Approve plan? [Y/n/edit]
      </output>
    </checkpoint>
    <check if="response == edit">
      <ask>What changes to the plan?</ask>
      <action>Adjust plan</action>
      <goto step="3b"/>
    </check>
    <goto step="5"/>
  </step>

  <step n="3c" title="Validate Mode" if="mode == validate">
    <action>Load design doc from .specs-fire/intents/{intent}/work-items/{id}-design.md</action>
    <action>Generate implementation plan based on design</action>
    <checkpoint>
      <output>
        ## Implementation Plan for "{title}"

        Based on approved design document.

        ### Implementation Checklist
        {from design doc}

        ### Files to Create
        {list files}

        ### Files to Modify
        {list files}

        ---
        This is Checkpoint 2 of Validate mode.
        Approve implementation plan? [Y/n/edit]
      </output>
    </checkpoint>
    <check if="response == edit">
      <ask>What changes to the plan?</ask>
      <action>Adjust plan</action>
      <goto step="3c"/>
    </check>
    <goto step="5"/>
  </step>

  <step n="5" title="Execute Implementation">
    <action>For each planned change:</action>
    <substep n="5a">Implement the change</substep>
    <substep n="5b">Track file operation (create/modify)</substep>
    <substep n="5c">Record decisions made</substep>

    <brownfield-rules>
      <rule>READ existing code before modifying</rule>
      <rule>MATCH existing naming conventions</rule>
      <rule>FOLLOW existing patterns in the codebase</rule>
      <rule>PRESERVE existing tests</rule>
    </brownfield-rules>
  </step>

  <step n="6" title="Run Tests">
    <action>Run test suite</action>
    <check if="tests fail">
      <output>
        Tests failed. Fixing issues...
      </output>
      <action>Fix failing tests</action>
      <action>Re-run tests</action>
    </check>
    <action>Record test results and coverage</action>
  </step>

  <step n="7" title="Complete Run">
    <action script="scripts/complete-run.ts">Finalize run record</action>
    <action>Update state.yaml (clear active_run, mark work item complete)</action>
    <action>Generate run log: .specs-fire/runs/{run-id}/run.md</action>
  </step>

  <step n="8" title="Generate Walkthrough">
    <invoke-skill>walkthrough-generate</invoke-skill>
  </step>

  <step n="9" title="Report Completion">
    <output>
      Run {run-id} completed for "{title}".

      Files created: {count}
      Files modified: {count}
      Tests added: {count}
      Coverage: {percentage}%

      Walkthrough: .specs-fire/runs/{run-id}/walkthrough.md

      Continue to next work item? [Y/n]
    </output>
  </step>

</skill>
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/init-run.ts` | Initialize run record and folder |
| `scripts/complete-run.ts` | Finalize run and update state |

---

## File Tracking Format

```yaml
files_created:
  - path: src/auth/login.ts
    purpose: Login endpoint handler

files_modified:
  - path: src/routes/index.ts
    changes: Added login route

decisions:
  - decision: Use JWT for tokens
    rationale: Stateless, works with load balancer
```
