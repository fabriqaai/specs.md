# Skill: Execute Tasks

## Purpose

Execute implementation tasks from an approved tasks.md file. This is the post-spec execution phase.

## Preconditions

- All three spec files exist:
  - `memory-bank/specs/{feature}/requirements.md`
  - `memory-bank/specs/{feature}/design.md`
  - `memory-bank/specs/{feature}/tasks.md`
- Tasks have been approved by user

## Trigger Conditions

- User requests to execute a specific task
- User asks "what's next" or to continue implementation
- User references the spec and asks to implement

## Workflow

### Before ANY Task Execution

1. **ALWAYS read ALL three spec files**:
   - requirements.md - Understand what to build
   - design.md - Understand how to build it
   - tasks.md - Understand current progress
2. **Parse tasks.md** to identify:
   - Completed tasks `- [x]`
   - Pending tasks `- [ ]`
   - Next logical task to execute

### Task Selection

If user specifies a task:
- Execute that specific task

If user asks for recommendation ("what's next?", "continue", etc.):
- Use the Task Recommendation Algorithm below
- Present the recommended task to user for confirmation

### Task Recommendation Algorithm

1. Parse all tasks from tasks.md
2. Build task list with status (complete/incomplete)
3. For each incomplete task in order:
   - If task has sub-tasks, check if all previous sub-tasks are complete
   - If task has no sub-tasks, check if all previous numbered tasks are complete
   - Skip optional tasks (`*`) unless user specifically asks
4. Return first incomplete task with all prerequisites met
5. If no incomplete tasks remain, announce completion (see Output section)

### Task Execution

1. **Read task details**:
   - Task description and sub-bullets
   - Requirement references
2. **Review relevant design sections**:
   - Components mentioned
   - Interfaces to implement
   - Data models involved
3. **Implement the task**:
   - Write MINIMAL code needed to satisfy the task
   - Follow design specifications
   - Match coding standards if defined
4. **Verify implementation**:
   - Check code satisfies referenced requirements
   - Run relevant tests if they exist for this component
   - If tests fail, fix before proceeding
5. **Mark task complete**:
   - Update tasks.md: `- [ ]` → `- [x]`
   - Only mark complete AFTER verification passes
6. **Recommend next task**:
   - Parse remaining incomplete tasks
   - Identify next task with all prerequisites met
   - If no tasks remain, announce completion
7. **STOP and wait for user review**

## Critical Rules

1. **ONE TASK AT A TIME**
   - Execute only the single requested task
   - Never automatically proceed to next task
   - Always stop for user review

2. **READ ALL SPECS FIRST**
   - Never execute without reading requirements + design + tasks
   - Context from all three files is essential

3. **VERIFY AGAINST REQUIREMENTS**
   - Implementation must satisfy referenced requirements
   - Check acceptance criteria are met

4. **UPDATE TASK STATUS**
   - Mark task `[x]` only when truly complete
   - If blocked, leave unchecked and explain

5. **WAIT FOR USER**
   - After completing task, pause
   - User decides when to continue
   - Do NOT auto-advance

## Output

After task completion:
```
Task [X.Y] complete: [Task description]

Changes made:
- [File 1]: [What was done]
- [File 2]: [What was done]

Verification:
- Requirements [X.Y, X.Z]: ✓ Satisfied
- Tests: ✓ Passing (or N/A if no tests for this component)

Next recommended task: [X.Z] - [Task description]

Ready for the next task? Or would you like to review the changes first?
```

When ALL tasks are complete:
```
All tasks complete!

Summary:
- [X] tasks executed
- All requirements covered
- Tests passing

The feature implementation is complete. Consider:
- Manual testing of the feature
- Code review before merging
```

## Task Execution Checklist

Before executing:
- [ ] Read requirements.md
- [ ] Read design.md
- [ ] Read tasks.md
- [ ] Identify specific task to execute
- [ ] Review requirement references
- [ ] Review relevant design sections

After executing:
- [ ] Code changes complete
- [ ] Verification passed (requirements + tests)
- [ ] Task marked `[x]` in tasks.md
- [ ] Next task recommended (or completion announced)
- [ ] Summary provided to user
- [ ] STOPPED - waiting for user

## Handling Blocked Tasks

If task cannot be completed:
1. Do NOT mark as complete
2. Explain the blocker
3. Suggest resolution:
   - Missing dependency → Execute prerequisite first
   - Design gap → Return to design phase
   - Requirement unclear → Return to requirements phase

## Handling Repeated Failures

If implementation fails twice on the same task:
1. STOP attempting the same approach
2. Explain what has been tried and why it failed
3. Suggest alternatives:
   - Different implementation approach
   - Breaking task into smaller sub-tasks
   - Returning to design for clarification
4. Ask user for guidance before proceeding

## Sub-task Handling

For tasks with sub-tasks (e.g., 2.1, 2.2, 2.3):
- Execute sub-tasks in order
- Each sub-task is ONE execution
- Parent task (e.g., 2.) marked complete only when all sub-tasks done
