# Skill: Generate Tasks

## Purpose

Generate an implementation plan with coding tasks based on the approved design. This is Phase 3 of the spec-driven development workflow.

## Preconditions

- `requirements.md` exists and is approved
- `design.md` exists and is approved

## Trigger Conditions

- Design phase completed and approved
- User requests updates to existing tasks
- User provides feedback on tasks document

## Workflow

### Initial Generation

1. **Read both documents**:
   - `memory-bank/specs/{feature}/requirements.md`
   - `memory-bank/specs/{feature}/design.md`
2. **Convert design into tasks**:
   - Create incremental coding steps
   - Each task builds on previous
   - Reference specific requirements
   - Include test tasks (mark optional with *)
3. **Generate tasks.md** following the template:
   - Numbered checkbox list
   - Max 2 levels of hierarchy
   - Requirement references for traceability
4. **Write file** to `memory-bank/specs/{feature}/tasks.md`
5. **Ask for approval**: "Do the tasks look good?"

### Update Flow

1. **Read all three** spec documents
2. **Apply user feedback** - add, remove, or modify tasks
3. **Write updated file**
4. **Ask for approval again**

## Critical Rules

1. **CODING TASKS ONLY**
   - Write, modify, or test code
   - NO deployment, user testing, documentation, performance gathering

2. **Requirement Traceability**
   - Every task references requirement(s): `_Requirements: X.Y, X.Z_`
   - Every requirement covered by at least one task

3. **Incremental Progress**
   - Tasks build on previous tasks
   - No orphaned code that isn't integrated
   - Include "Checkpoint" tasks to verify tests pass

4. **Task Format**
   - `- [ ]` for pending, `- [x]` for done
   - `- [ ]*` for optional tasks

5. **Numbering Rules**
   - Top-level tasks: `1.`, `2.`, `3.`
   - Sub-tasks: `2.1`, `2.2`, `2.3`
   - Maximum 2 levels (no `2.1.1`)
   - Parent tasks with sub-tasks are GROUP HEADERS (not directly executed)
     - Mark parent complete only when ALL sub-tasks are done
   - Tasks without sub-tasks are directly executable
   - Use sub-tasks when a feature has 3+ related implementation steps

6. **Approval Gate**
   - Workflow COMPLETE when tasks approved
   - Inform user they can now execute tasks

## Output

- **File**: `memory-bank/specs/{feature-name}/tasks.md`
- **Approval Prompt**: "Do the tasks look good?"

## Task Types (Include)

- Set up project structure
- Create interfaces/types
- Implement classes/modules
- Write unit tests
- Write integration tests
- Wire components together
- Checkpoint tasks (verify tests pass)

## Task Types (Exclude)

- User acceptance testing
- Deployment to any environment
- Performance metrics gathering
- User training or documentation
- Business process changes
- Marketing activities
- Running the app manually

## Completion Message

When tasks are approved:
```
The spec is complete. You now have:
- requirements.md - What to build
- design.md - How to build it
- tasks.md - Step-by-step implementation plan

You can start executing tasks by asking me to work on a specific task,
or I can recommend the next task to work on.
```

## Phase Transitions

**Backward**: If user identifies gaps:
- Design changes → Return to design skill
- Requirement changes → Return to requirements skill

**Forward**: On approval:
- Workflow complete
- User can now request task execution

## Template Reference

See `.specsmd/simple/templates/tasks-template.md` for full template structure.
