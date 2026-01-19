# Skill: Project Init

Initialize a new FIRE project by detecting workspace type and setting up standards.

---

## Trigger

- User runs `/fire` on uninitialized project
- No `.specs-fire/state.yaml` exists

---

## Workflow

```xml
<skill name="project-init">

  <step n="1" title="Welcome">
    <output>
      Welcome to FIRE (Fast Intent-Run Engineering).

      Let me analyze your project to get started.
    </output>
  </step>

  <step n="2" title="Detect Workspace">
    <action>Analyze project root for existing code</action>
    <check if="src/ or app/ or main entry points exist">
      <set>workspace.type = brownfield</set>
    </check>
    <check if="minimal files, no source directories">
      <set>workspace.type = greenfield</set>
    </check>
  </step>

  <step n="3a" title="Brownfield Setup" if="workspace.type == brownfield">
    <output>
      Existing project detected. I'll analyze your codebase to infer standards.
    </output>
    <action>Detect tech stack (language, framework, database)</action>
    <action>Detect structure (monolith, monorepo)</action>
    <action>Infer coding patterns</action>
    <output>
      Here's what I found:

      **Tech Stack**: {detected_tech}
      **Structure**: {detected_structure}
      **Patterns**: {detected_patterns}

      Does this look accurate? [Y/n/edit]
    </output>
  </step>

  <step n="3b" title="Greenfield Setup" if="workspace.type == greenfield">
    <ask>
      What do you want to build? Tell me about:
      - What the project does
      - Target users
      - Key features
    </ask>
    <action>Analyze description, suggest tech stack</action>
    <output>
      Based on your description, I suggest:

      **Language**: {suggested_language}
      **Framework**: {suggested_framework}
      **Database**: {suggested_database}

      Accept these suggestions? [Y/n/edit]
    </output>
  </step>

  <step n="4" title="Choose Autonomy Level">
    <output>
      How autonomous should FIRE be when executing work items?

      **[1] Autonomous** — AI executes more freely, fewer checkpoints
           (medium complexity → autopilot, high → confirm)

      **[2] Balanced** — Standard checkpoints based on complexity (Recommended)
           (low → autopilot, medium → confirm, high → validate)

      **[3] Controlled** — More human oversight, more checkpoints
           (low → confirm, medium/high → validate)

      Choose [1/2/3]:
    </output>
    <check if="response == 1">
      <set>workspace.autonomy_bias = autonomous</set>
    </check>
    <check if="response == 2">
      <set>workspace.autonomy_bias = balanced</set>
    </check>
    <check if="response == 3">
      <set>workspace.autonomy_bias = controlled</set>
    </check>
    <note>Can be changed later in .specs-fire/state.yaml</note>
  </step>

  <step n="5" title="Create Structure">
    <action>Create .specs-fire/ directory</action>
    <action>Create .specs-fire/intents/</action>
    <action>Create .specs-fire/runs/</action>
    <action>Create .specs-fire/standards/</action>
    <action>Generate .specs-fire/state.yaml (include autonomy_bias)</action>
    <action>Generate .specs-fire/standards/tech-stack.md</action>
    <action>Generate .specs-fire/standards/coding-standards.md</action>
  </step>

  <step n="6" title="Complete">
    <output>
      FIRE initialized!

      Structure created:
      ```
      .specs-fire/
      ├── state.yaml
      ├── intents/
      ├── runs/
      └── standards/
          ├── tech-stack.md
          └── coding-standards.md
      ```

      Ready to capture your first intent.
      What do you want to build?
    </output>
    <route-to>planner-agent (intent-capture)</route-to>
  </step>

</skill>
```

---

## Output

- `.specs-fire/state.yaml` — Central state file
- `.specs-fire/standards/tech-stack.md` — Technology choices
- `.specs-fire/standards/coding-standards.md` — Coding conventions
