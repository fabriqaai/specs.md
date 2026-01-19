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

  <step n="4" title="Create Structure">
    <action>Create .specs-fire/ directory</action>
    <action>Create .specs-fire/intents/</action>
    <action>Create .specs-fire/runs/</action>
    <action>Create .specs-fire/standards/</action>
    <action>Generate .specs-fire/state.yaml</action>
    <action>Generate .specs-fire/standards/tech-stack.md</action>
    <action>Generate .specs-fire/standards/coding-standards.md</action>
  </step>

  <step n="5" title="Complete">
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
