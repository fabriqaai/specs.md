# Skill: Status

Display current FIRE project status.

---

## Trigger

- User runs `/fire status`
- User asks "what's the status?"

---

## Workflow

```xml
<skill name="status">

  <step n="1" title="Read State">
    <action>Read .specs-fire/state.yaml</action>
  </step>

  <step n="2" title="Display Status">
    <output>
      # FIRE Status

      **Project**: {project.name}
      **Workspace**: {workspace.type} / {workspace.structure}
      **Autonomy**: {workspace.autonomy_bias}

      ## Intents

      {for each intent}
      ### {intent.title} [{intent.status}]

      | Work Item | Status | Complexity | Mode |
      |-----------|--------|------------|------|
      {for each work_item}
      | {title} | {status} | {complexity} | {mode} |
      {/for}

      {/for}

      ## Active Run

      {if active_run}
      - **Run**: {active_run.id}
      - **Work Item**: {active_run.work_item}
      - **Started**: {active_run.started}
      - **Mode**: {active_run.mode}
      {else}
      No active run.
      {/if}

      ## Quick Stats

      - Intents: {total_intents} ({completed_intents} completed)
      - Work Items: {total_work_items} ({completed_work_items} completed)
      - Runs: {total_runs}
    </output>
  </step>

</skill>
```

---

## Example Output

```
# FIRE Status

**Project**: my-saas-app
**Workspace**: brownfield / monolith
**Autonomy**: balanced

## Intents

### User Authentication [in_progress]

| Work Item | Status | Complexity | Mode |
|-----------|--------|------------|------|
| login-endpoint | completed | medium | confirm |
| session-management | in_progress | medium | confirm |
| password-reset | pending | high | validate |

## Active Run

- **Run**: run-002
- **Work Item**: session-management
- **Started**: 2026-01-19T10:30:00Z
- **Mode**: confirm

## Quick Stats

- Intents: 1 (0 completed)
- Work Items: 3 (1 completed)
- Runs: 2
```
