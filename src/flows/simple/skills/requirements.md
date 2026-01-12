# Skill: Generate Requirements

## Purpose

Generate a requirements document for a feature using EARS (Easy Approach to Requirements Syntax) format. This is Phase 1 of the spec-driven development workflow.

## Trigger Conditions

- User provides a new feature idea
- User requests updates to existing requirements
- User provides feedback on requirements document

## Workflow

### Initial Generation (New Spec)

1. **Parse feature idea** from user input
2. **Derive feature name** in kebab-case (e.g., "user-authentication")
3. **Create directory** at `specs/{feature-name}/`
4. **Generate requirements.md** following the template:
   - Introduction (2-3 sentences)
   - Glossary (3-10 domain terms)
   - Requirements (3-7 user stories with EARS acceptance criteria)
5. **Write file** to `specs/{feature-name}/requirements.md`
6. **Ask for approval**: "Do the requirements look good? If so, we can move on to the design."

### Update Flow (Existing Spec)

1. **Read existing** `requirements.md`
2. **Apply user feedback** - modify specific sections as requested
3. **Write updated file**
4. **Ask for approval again**

## Critical Rules

1. **Generate FIRST, ask questions LATER**
   - Do NOT ask clarifying questions before generating
   - Create a draft document as starting point for discussion
   - User feedback refines the document iteratively

2. **EARS Format is Mandatory**
   - Every acceptance criterion MUST use an EARS pattern
   - Patterns: WHEN/THE SHALL, WHILE/THE SHALL, IF/THEN THE SHALL, WHERE/THE SHALL

3. **Approval Gate**
   - Do NOT proceed to Design phase without explicit approval
   - Approval keywords: "yes", "approved", "looks good", "let's continue", "move on"
   - Any feedback = revise and ask again

4. **Glossary Consistency**
   - Define system names and domain terms in glossary
   - Use glossary terms consistently in acceptance criteria

## Output

- **File**: `specs/{feature-name}/requirements.md`
- **Approval Prompt**: "Do the requirements look good? If so, we can move on to the design."

## Example Generation

For input: "Create a todo app with local storage"

```markdown
# Requirements Document

## Introduction

A simple todo application that allows users to manage their daily tasks through a clean interface. The system enables users to add, view, complete, and remove tasks while maintaining data persistence across sessions using browser local storage.

## Glossary

- **Todo_System**: The complete todo application including user interface and data management
- **Task**: A single todo item with a description and completion status
- **Task_List**: The collection of all tasks managed by the system
- **Local_Storage**: Browser-based persistent storage mechanism

## Requirements

### Requirement 1

**User Story:** As a user, I want to add new tasks to my todo list, so that I can capture things I need to accomplish.

#### Acceptance Criteria

1. WHEN a user types a task description and presses Enter, THE Todo_System SHALL create a new task and add it to the Task_List
2. WHEN a user attempts to add an empty task, THE Todo_System SHALL prevent the addition and maintain the current state
3. WHEN a new task is added, THE Todo_System SHALL persist the task to Local_Storage immediately

[... continue with more requirements ...]
```

## Template Reference

See `.specsmd/simple/templates/requirements-template.md` for full template structure.
