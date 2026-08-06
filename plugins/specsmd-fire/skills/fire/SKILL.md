---
name: fire
description: Use when the user wants fast spec-driven development with FIRE (Fast Intent-Run Engineering), asks to start, resume, or check FIRE work, or the project contains a `.specs-fire/` directory. Verifies project state from the file system and routes to the correct FIRE skill for initialization, intent capture, work-item decomposition, run planning, or execution.
license: MIT
metadata:
  version: "1.0.0"
  flow: fire
  phase: orchestrator
---

# FIRE Flow Orchestration

FIRE (Fast Intent-Run Engineering) is a spec-driven flow with three roles: an
orchestrator that routes by verified state, a planner that turns intent into work
items, and a builder that executes work items as runs.

- **Role**: FIRE flow orchestration and session routing.
- **Communication**: Direct and efficient. Route based on state, not assumptions.
- **Principle**: Minimize friction. Get to the right skill fast.

<constraints critical="true">
  <constraint>ALWAYS read `.specs-fire/state.yaml` before routing</constraint>
  <constraint>NEVER assume project state — verify it</constraint>
  <constraint>ALWAYS scan the file system to discover untracked intents/work-items</constraint>
</constraints>

## Context Preflight

Read these before routing. All paths are in the user's project.

| Artifact | Purpose | If missing |
|----------|---------|------------|
| `.specs-fire/state.yaml` | Central state: intents, work items, runs, autonomy bias | Project is uninitialized — invoke the `fire-init` skill |
| `.specs-fire/intents/*/brief.md` | Intents on disk (may not be in state) | Continue; no intents captured yet |
| `.specs-fire/intents/*/work-items/*.md` | Work items on disk (may not be in state) | Continue; intent needs decomposition |
| `.specs-fire/standards/` | Project standards used during execution | Warn and continue; `fire-init` generates them |
| `references/memory-bank.yaml` (this skill's directory) | FIRE artifact schema, paths, execution modes, autonomy bias mapping | Stop — the skill installation is incomplete |

<on_activation>
  <step n="1" title="Load Configuration">
    <action>Read `references/memory-bank.yaml` in this skill's directory for the FIRE schema</action>
  </step>

  <step n="2" title="Check Initialization">
    <action>Check if `.specs-fire/state.yaml` exists</action>
  </step>

  <step n="3" title="Route by State">
    <check if="NOT initialized (new project)">
      <action>Invoke the `fire-init` skill to set up the workspace</action>
    </check>
    <check if="initialized">
      <action>Read `.specs-fire/state.yaml` for current state</action>
      <action>Run the state-verified routing below</action>
    </check>
  </step>
</on_activation>

## Skills in this flow

| Command | Skill | Description |
|---------|-------|-------------|
| `init` | `fire-init` | Initialize a FIRE project (workspace detection, standards) |
| `status` | `status` | Show project status and validate artifact integrity |
| `capture`, `intent` | `intent-capture` | Capture a new intent through conversation |
| `decompose`, `plan` | `work-item-decompose` | Break an intent into work items |
| `design` | `design-doc-generate` | Generate a design doc (Validate mode, Checkpoint 1) |
| `run-plan` | `run-plan` | Plan run scope (discover work, suggest groupings) |
| `run`, `execute` | `run-execute` | Execute a work item run |
| `review` | `code-review` | Review code, auto-fix issues, suggest improvements |
| `walkthrough` | `walkthrough-generate` | Generate an implementation walkthrough |
| `run-status` | `run-status` | Show current run status |

## State-Verified Routing

<llm critical="true">
  <mandate>ALWAYS scan the file system for intents/work-items not in state.yaml</mandate>
  <mandate>FILE SYSTEM is source of truth — state.yaml may be incomplete</mandate>
  <mandate>Route based on VERIFIED state, not assumptions</mandate>
</llm>

<flow>
  <step n="1" title="Discover and Read State">
    <action>Read .specs-fire/state.yaml</action>

    <file_system_scan critical="true">
      Use these EXACT glob patterns:

      <pattern purpose="Find intent briefs">
        .specs-fire/intents/*/brief.md
      </pattern>

      <pattern purpose="Find work items">
        .specs-fire/intents/*/work-items/*.md
      </pattern>

      Work items are {work-item-id}.md files directly in work-items/ folder.
    </file_system_scan>

    <action>Reconcile: add discovered items to state as pending</action>
    <action>Parse current project state</action>
  </step>

  <step n="2" title="Check Active Run">
    <check if="runs.active is not empty">
      <output>
        Resuming active run: {runs.active[0].id}
        Scope: {runs.active[0].scope}
        Current item: {runs.active[0].current_item}
        Progress: {completed_count}/{total_count} items
      </output>
      <route_to>the `run-execute` skill (resume)</route_to>
      <stop/>
    </check>
  </step>

  <step n="3" title="Check Pending Work Items">
    <action>Find work items with status == pending across all intents</action>
    <check if="pending work items exist">
      <output>
        **{pending_count} pending work items** found across {intent_count} intent(s).

        Plan run scope and start execution? [Y/n]
      </output>
      <check if="response == y">
        <route_to>the `run-plan` skill</route_to>
      </check>
      <stop/>
    </check>
  </step>

  <step n="4" title="Check Active Intent">
    <action>Find intents with status == in_progress</action>
    <check if="active intent has no work items">
      <output>
        Intent "{intent.title}" needs decomposition.
        Creating work items.
      </output>
      <route_to>the `work-item-decompose` skill</route_to>
      <stop/>
    </check>
    <check if="all work items completed">
      <action>Mark intent as completed</action>
      <output>
        Intent "{intent.title}" completed!

        Work items delivered:
        {list completed work items}

        Ready for next intent? [Y/n]
      </output>
    </check>
  </step>

  <step n="5" title="No Active Work">
    <output>
      No active work. Ready for a new intent.

      What do you want to build?
    </output>
    <route_to>the `intent-capture` skill</route_to>
  </step>
</flow>

<routing_decision_tree>

  ```
  state.yaml + file system scan
      │
      ├── no state.yaml? ───────────> fire-init
      │
      ├── runs.active? ─────────────> run-execute (resume)
      │
      ├── pending work items? ──────> run-plan, then run-execute
      │
      ├── intent without work items? > work-item-decompose
      │
      └── no active intents ────────> intent-capture
  ```

</routing_decision_tree>

<context_passed_to_skills>
  **To planning skills:**

  ```yaml
  context:
    action: intent-capture | work-item-decompose
    intent_id: {if decomposing}
  ```

  **To building skills:**

  ```yaml
  context:
    action: run-plan | run-execute | resume
    pending_items: [{list of pending work items}]  # for run-plan
    run_id: {if resuming}
  ```

</context_passed_to_skills>

<state_schema>
  FIRE maintains `.specs-fire/state.yaml`:

  ```yaml
  project:
    name: "project-name"
    fire_version: "0.1.8"

  workspace:
    type: brownfield
    structure: monolith
    autonomy_bias: balanced

  intents:
    - id: user-auth
      title: "User Authentication"
      status: in_progress
      work_items:
        - id: login-endpoint
          status: completed
          complexity: medium
          mode: confirm
        - id: session-management
          status: pending
          complexity: medium
          mode: confirm

  runs:
    active: []  # List of active runs (supports multiple parallel runs)
    completed:
      - id: run-fabriqa-2026-001
        work_items:
          - id: login-endpoint
            intent: user-auth
            mode: confirm
            status: completed
        completed: "2026-01-19T12:00:00Z"
  ```

  The full schema, including run artifact paths, execution modes, and the
  autonomy-bias mapping, is in `references/memory-bank.yaml` in this skill's
  directory.

</state_schema>

<handoff_protocol>
  When routing to another skill, state the context:

  <handoff to="planning">
    ```
    Routing to intent-capture.
    Context: No active intent. Ready for new intent capture.
    ```
  </handoff>

  <handoff to="building">
    ```
    Routing to run-execute.
    Context: Work item "session-management" ready for execution.
    Mode: confirm (1 checkpoint)
    ```
  </handoff>
</handoff_protocol>

<success_criteria>
  <criterion>File system scanned for untracked intents/work-items</criterion>
  <criterion>State reconciled with file system</criterion>
  <criterion>Project state correctly identified</criterion>
  <criterion>Correct skill selected based on verified state</criterion>
  <criterion>Context passed to the target skill</criterion>
</success_criteria>
