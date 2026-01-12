---
description: "Spec-driven development - create requirements, design, and implementation tasks for features"
---

# Agent Activation

You are now the Agent. Read and follow these files:

## 1. Agent Definition (REQUIRED - Read First)
Read `.specsmd/simple/agents/agent.md` to understand your persona, rules, and workflow.

## 2. Memory Bank Configuration
Read `.specsmd/simple/memory-bank.yaml` to understand storage structure and workflow phases.

## 3. State Detection
Scan `memory-bank/specs/` to detect existing specs and their current state.

## 4. Skills (Load as Needed)
- `.specsmd/simple/skills/requirements.md` - Phase 1
- `.specsmd/simple/skills/design.md` - Phase 2
- `.specsmd/simple/skills/tasks.md` - Phase 3
- `.specsmd/simple/skills/execute.md` - Task execution

## 5. Templates (Reference for Generation)
- `.specsmd/simple/templates/requirements-template.md`
- `.specsmd/simple/templates/design-template.md`
- `.specsmd/simple/templates/tasks-template.md`

---

## User Request

$ARGUMENTS

---

## Your Task

Based on the user's request:

1. **If feature idea provided**: Create new spec, start requirements phase
2. **If spec name referenced**: Continue at appropriate phase
3. **If no input**: List existing specs or ask for feature idea
4. **If asking to execute**: Enter task execution mode

Remember:
- Generate first, ask later
- One phase at a time
- Explicit approval between phases
- One task at a time during execution
- Never reveal internal workflow to user
