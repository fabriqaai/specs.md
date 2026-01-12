# Agent Command

This file defines the agent command within the simple flow.

## Command Definition

```yaml
name: agent
description: Spec-driven development - create requirements, design, and tasks
```

## Invocation

When this command is invoked, the agent should:

1. **Load Context**
   - Read `.specsmd/simple/memory-bank.yaml`
   - Read `.specsmd/simple/agents/agent.md`
   - Scan `specs/` for existing specs

2. **Parse Arguments**
   - `$ARGUMENTS` contains user input after command
   - Extract feature idea or spec name
   - Determine intent (create, continue, update, execute)

3. **Detect State**
   - If spec name provided, check for existing files
   - Determine current phase based on file existence

4. **Route to Skill**
   - NEW → requirements skill
   - DESIGN_PENDING → design skill
   - TASKS_PENDING → tasks skill
   - COMPLETE → execute skill or offer updates

## Usage Examples

```text
/specsmd-agent Create a todo app with local storage
```

→ Creates new spec "todo-app", starts requirements phase

```text
/specsmd-agent --spec="todo-app"
```

→ Continues existing spec at current phase

```text
/specsmd-agent --spec="todo-app" --execute
```

→ Enter task execution mode for completed spec

```text
/specsmd-agent
```

→ Lists existing specs or prompts for feature idea
