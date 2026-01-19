# Skill: Route

Analyze project state and route user to the appropriate agent.

---

## Trigger

- User runs `/fire` on initialized project
- After any agent completes its task

---

## Workflow

```xml
<skill name="route">

  <step n="1" title="Discover and Read State">
    <action>Read .specs-fire/state.yaml</action>
    <action>Scan .specs-fire/intents/ for briefs not in state</action>
    <action>Scan .specs-fire/intents/*/work-items/ for items not in state</action>
    <action>Reconcile: add discovered items to state as pending</action>
    <action>Parse current project state</action>
  </step>

  <step n="2" title="Check Active Run">
    <check if="active_run exists and status == in_progress">
      <output>
        Resuming active run: {active_run.id}
        Scope: {active_run.scope}
        Current item: {active_run.current_item}
        Progress: {completed_count}/{total_count} items
      </output>
      <route-to>builder-agent (run-execute)</route-to>
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
        <route-to>builder-agent (run-plan)</route-to>
      </check>
      <stop/>
    </check>
  </step>

  <step n="4" title="Check Active Intent">
    <action>Find intents with status == in_progress</action>
    <check if="active intent has no work items">
      <output>
        Intent "{intent.title}" needs decomposition.
        Routing to Planner to create work items.
      </output>
      <route-to>planner-agent (work-item-decompose)</route-to>
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
    <route-to>planner-agent (intent-capture)</route-to>
  </step>

</skill>
```

---

## Routing Decision Tree

```
state.yaml + file system scan
    │
    ├── active_run? ──────────────> Builder (run-execute, resume)
    │
    ├── pending work items? ──────> Builder (run-plan, then execute)
    │
    ├── intent without work items? > Planner (work-item-decompose)
    │
    └── no active intents ────────> Planner (intent-capture)
```

---

## Context Passed to Agents

**To Planner:**
```yaml
context:
  action: intent-capture | work-item-decompose
  intent_id: {if decomposing}
```

**To Builder:**
```yaml
context:
  action: run-plan | run-execute | resume
  pending_items: [{list of pending work items}]  # for run-plan
  run_id: {if resuming}
```
