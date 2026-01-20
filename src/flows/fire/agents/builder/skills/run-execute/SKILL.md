# Skill: Run Execute

Execute work items based on their assigned mode (autopilot, confirm, validate).
Supports both single-item and multi-item (batch/wide) runs.

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
- Batch of work items passed from run-plan

---

## Degrees of Freedom

**Varies by mode**:
- Autopilot: LOW — Execute standard patterns decisively
- Confirm: MEDIUM — Present plan, adjust based on feedback
- Validate: LOW — Follow approved design precisely

---

## Critical Requirements

### MUST Use Scripts - Never Bypass

**CRITICAL**: You MUST call the scripts. DO NOT use mkdir or manual file creation.

| Action | CORRECT | WRONG |
|--------|---------|-------|
| Initialize run | `node scripts/init-run.js ...` | `mkdir .specs-fire/runs/run-001` |
| Complete item | `node scripts/complete-run.js ... --complete-item` | Manual state editing |
| Complete run | `node scripts/complete-run.js ... --complete-run` | Manual state editing |

The scripts:
- Create run folder AND run.md together
- Update state.yaml atomically
- Track run history in runs.completed
- Handle batch run state transitions

### Batch Run Execution Flow

For runs with multiple work items:

```
1. Call init-run.js ONCE at start (creates run.md with ALL items)
2. Execute each work item sequentially:
   - Load item context
   - Execute based on mode (autopilot/confirm/validate)
   - Call complete-run.js --complete-item after each
3. Call complete-run.js --complete-run after final item
```

---

## Workflow

```xml
<skill name="run-execute">

  <mandate>
    USE SCRIPTS — Never bypass init-run.js or complete-run.js.
    ALWAYS CREATE plan.md — Create plan BEFORE implementation starts (all modes).
    ALWAYS CREATE test-report.md — Create test report AFTER tests complete.
    TRACK ALL FILE OPERATIONS — Every create, modify must be recorded.
    NEVER skip tests — Tests are mandatory, not optional.
    FOLLOW BROWNFIELD RULES — Read before write, match existing patterns.
  </mandate>

  <artifact-timing critical="true">
    Artifacts MUST be created at these points:
    | Artifact | When Created | Created By |
    |----------|--------------|------------|
    | run.md | Start of run | init-run.js script |
    | plan.md | BEFORE implementation (Step 4) | Agent using template |
    | test-report.md | AFTER tests pass (Step 6) | Agent using template |
    | walkthrough.md | After run completes (Step 8) | walkthrough-generate skill |

    For batch runs: Append each work item's section to plan.md and test-report.md.
  </artifact-timing>

  <step n="1" title="Initialize Run">
    <critical>
      MUST call init-run.js script. DO NOT use mkdir directly.
      The script creates BOTH the folder AND run.md file.
    </critical>

    <action>Prepare work items JSON array:</action>
    <code>
      # For single item:
      node scripts/init-run.js {rootPath} {workItemId} {intentId} {mode}

      # For batch/wide (multiple items):
      node scripts/init-run.js {rootPath} --batch '[
        {"id": "item-1", "intent": "intent-1", "mode": "autopilot"},
        {"id": "item-2", "intent": "intent-1", "mode": "confirm"}
      ]' --scope=batch
    </code>

    <action>Parse script output for runId and runPath</action>
    <action>Verify run.md was created in .specs-fire/runs/{run-id}/</action>

    <check if="run.md not found">
      <error>init-run.js failed to create run.md. Check script output.</error>
    </check>
  </step>

  <step n="2" title="Execute Work Items Loop">
    <note>For batch runs, repeat steps 2-6 for each work item</note>

    <action>Get current_item from state.yaml active_run</action>
    <action>Load work item from .specs-fire/intents/{intent}/work-items/{id}.md</action>
    <action>Read intent brief for broader context</action>
    <action>Load ALL project standards:</action>
    <substep>.specs-fire/standards/tech-stack.md — Technology choices</substep>
    <substep>.specs-fire/standards/coding-standards.md — Code style and patterns</substep>
    <substep>.specs-fire/standards/testing-standards.md — Testing strategy and coverage</substep>
    <substep>.specs-fire/standards/system-architecture.md — Architecture context and constraints</substep>
    <action>Determine execution mode from work item</action>
  </step>

  <step n="3a" title="Autopilot Mode" if="mode == autopilot">
    <output>
      Executing in Autopilot mode (0 checkpoints).
      Work item: {title}
    </output>
    <goto step="4"/>
  </step>

  <step n="3b" title="Confirm Mode" if="mode == confirm">
    <action>Generate implementation plan</action>
    <action>Save plan IMMEDIATELY using template: templates/plan.md.hbs</action>
    <action>Write to: .specs-fire/runs/{run-id}/plan.md</action>
    <output>
      Plan saved to: .specs-fire/runs/{run-id}/plan.md
    </output>
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
      <action>Update plan.md with changes</action>
      <goto step="3b"/>
    </check>
    <goto step="5"/>
  </step>

  <step n="3c" title="Validate Mode" if="mode == validate">
    <action>Load design doc from .specs-fire/intents/{intent}/work-items/{id}-design.md</action>
    <action>Generate implementation plan based on design</action>
    <action>Save plan IMMEDIATELY using template: templates/plan.md.hbs</action>
    <action>Write to: .specs-fire/runs/{run-id}/plan.md</action>
    <action>Include reference to design doc in plan</action>
    <output>
      Plan saved to: .specs-fire/runs/{run-id}/plan.md
    </output>
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
      <action>Update plan.md with changes</action>
      <goto step="3c"/>
    </check>
    <goto step="5"/>
  </step>

  <step n="4" title="Generate Plan (Autopilot Only)" if="mode == autopilot">
    <note>Confirm and Validate modes already saved plan in Step 3b/3c</note>
    <action>Generate implementation plan</action>
    <action>Save plan using template: templates/plan.md.hbs</action>
    <action>Write to: .specs-fire/runs/{run-id}/plan.md</action>
    <output>
      Plan saved to: .specs-fire/runs/{run-id}/plan.md
      (Autopilot mode - continuing without checkpoint)
    </output>
    <note>No checkpoint in autopilot - human can review plan.md while agent works</note>
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
    <action>Load testing standards from .specs-fire/standards/testing-standards.md</action>
    <action>Write tests following testing standards:</action>
    <substep>Unit tests for new/modified functions</substep>
    <substep>Integration tests for API endpoints or workflows</substep>
    <substep>Follow test naming and structure conventions</substep>

    <action>Run test suite</action>
    <check if="tests fail">
      <output>
        Tests failed. Fixing issues...
      </output>
      <action>Fix failing tests</action>
      <action>Re-run tests</action>
    </check>

    <action>Validate acceptance criteria from work item</action>

    <critical>Create test report AFTER tests pass</critical>
    <action>Generate test report using template: templates/test-report.md.hbs</action>
    <action>Write to: .specs-fire/runs/{run-id}/test-report.md</action>
    <action>Include in test report:</action>
    <substep>Test results summary (passed/failed/skipped)</substep>
    <substep>Code coverage percentage</substep>
    <substep>Acceptance criteria validation results</substep>
    <substep>Any test warnings or notes</substep>
    <output>
      Test report saved to: .specs-fire/runs/{run-id}/test-report.md
    </output>
  </step>

  <step n="6b" title="Code Review">
    <critical>ALWAYS run code review after tests pass</critical>
    <output>Running code review...</output>

    <action>Invoke code-review skill with context:</action>
    <code>
      invoke-skill: code-review
      context:
        files_created: {files_created}
        files_modified: {files_modified}
        run_id: {run_id}
        intent_id: {intent_id}
    </code>

    <invoke-skill>code-review</invoke-skill>

    <note>
      Code review skill will:
      1. Review all files created/modified in this work item
      2. Auto-fix no-brainer issues (unused imports, console.log, etc.)
      3. Present suggestions requiring approval
      4. Create review-report.md artifact
    </note>

    <check if="code-review returns suggestions">
      <note>User interaction happens within code-review skill</note>
      <action>Wait for code-review skill to complete</action>
    </check>

    <check if="code-review applied fixes">
      <action>Re-run tests to verify fixes didn't break anything</action>
      <check if="tests fail">
        <output>
          Code review fixes caused test failure. Reverting...
        </output>
        <action>Revert code review changes</action>
        <action>Re-run tests to confirm passing</action>
      </check>
    </check>

    <output>
      Code review complete.
      Review report: .specs-fire/runs/{run-id}/review-report.md
    </output>
  </step>

  <step n="7" title="Complete Current Work Item">
    <critical>
      MUST call complete-run.js script. Check if more items remain.
    </critical>

    <check if="batch run with more items pending">
      <action>Call complete-run.js with --complete-item flag:</action>
      <code>
        node scripts/complete-run.js {rootPath} {runId} --complete-item
      </code>
      <action>Parse output for nextItem</action>
      <output>
        Work item {current_item} complete.
        Next: {nextItem}
      </output>
      <goto step="2">Continue with next work item</goto>
    </check>

    <check if="last item or single item run">
      <action>Call complete-run.js with --complete-run flag:</action>
      <code>
        node scripts/complete-run.js {rootPath} {runId} --complete-run \
          --files-created='[{"path":"...","purpose":"..."}]' \
          --files-modified='[{"path":"...","changes":"..."}]' \
          --tests=5 --coverage=85
      </code>
      <goto step="8"/>
    </check>
  </step>

  <step n="8" title="Generate Walkthrough">
    <invoke-skill>walkthrough-generate</invoke-skill>
  </step>

  <step n="9" title="Report Completion">
    <output>
      Run {run-id} completed.

      Work items completed: {count}
      Files created: {count}
      Files modified: {count}
      Tests added: {count}

      Artifacts:
      - Run Log: .specs-fire/runs/{run-id}/run.md
      - Plan: .specs-fire/runs/{run-id}/plan.md
      - Test Report: .specs-fire/runs/{run-id}/test-report.md
      - Code Review: .specs-fire/runs/{run-id}/review-report.md
      - Walkthrough: .specs-fire/runs/{run-id}/walkthrough.md
    </output>
  </step>

</skill>
```

---

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/init-run.js` | Initialize run record and folder | Creates run.md with all work items |
| `scripts/complete-run.js` | Finalize run and update state | `--complete-item` or `--complete-run` |

### init-run.js Usage

```bash
# Single work item
node scripts/init-run.js /project work-item-id intent-id autopilot

# Batch/wide (multiple items)
node scripts/init-run.js /project --batch '[
  {"id": "wi-1", "intent": "int-1", "mode": "autopilot"},
  {"id": "wi-2", "intent": "int-1", "mode": "confirm"}
]' --scope=batch
```

**Output:**
```json
{
  "success": true,
  "runId": "run-001",
  "runPath": "/project/.specs-fire/runs/run-001",
  "scope": "batch",
  "workItems": [...],
  "currentItem": "wi-1"
}
```

### complete-run.js Usage

```bash
# Complete current item (batch runs - moves to next item)
node scripts/complete-run.js /project run-001 --complete-item

# Complete entire run (single runs or final item in batch)
node scripts/complete-run.js /project run-001 --complete-run \
  --files-created='[{"path":"src/new.ts","purpose":"New feature"}]' \
  --files-modified='[{"path":"src/old.ts","changes":"Added import"}]' \
  --tests=5 --coverage=85
```

**--complete-item Output:**
```json
{
  "success": true,
  "runId": "run-001",
  "completedItem": "wi-1",
  "nextItem": "wi-2",
  "remainingItems": 1,
  "allItemsCompleted": false
}
```

**--complete-run Output:**
```json
{
  "success": true,
  "runId": "run-001",
  "scope": "batch",
  "workItemsCompleted": 2,
  "completedAt": "2026-01-20T..."
}
```

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

---

## Run Folder Structure

After init-run.js creates a run:

```
.specs-fire/runs/run-001/
├── run.md           # Created by init-run.js, updated by complete-run.js
├── plan.md          # Created BEFORE implementation (ALL modes - required)
├── test-report.md   # Created AFTER tests pass (required)
├── review-report.md # Created by code-review skill (Step 6b)
└── walkthrough.md   # Created by walkthrough-generate skill
```

**Artifact Creation Timeline:**
1. `run.md` — Created at run start by init-run.js
2. `plan.md` — Created BEFORE implementation begins (Step 4)
3. `test-report.md` — Created AFTER tests pass (Step 6)
4. `review-report.md` — Created by code-review skill (Step 6b)
5. `walkthrough.md` — Created after run completes (Step 8)

The run.md contains:
- All work items with their statuses
- Current item being executed
- Files created/modified (after completion)
- Decisions made (after completion)
- Summary (after completion)
