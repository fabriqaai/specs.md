# Skill: Route Request

---

## Role

Routing skill to direct users to the appropriate specialist agent based on context and request.

**NO Checkpoint** - Routing is a navigation function, not a decision point.

---

## Goal

Direct the user to the appropriate specialist agent based on their current context and request.

---

## Input

- **Required**: Completed context analysis (from `analyze-context.md`)
- **Required**: User's request or intent

---

## Process

### 1. Match State to Agent

Based on project state:

- **No intents / New feature request** → Inception Agent → `/specsmd-inception-agent`
- **Intent exists, needs elaboration** → Inception Agent → `/specsmd-inception-agent --intent="{name}"`
- **Ready for construction** → Construction Agent → `/specsmd-construction-agent --unit="{name}"`
- **Bolt in progress** → Construction Agent → `/specsmd-construction-agent --unit="{name}" --bolt-id="{id}"`
- **Ready for deployment** → Operations Agent → `/specsmd-operations-agent --unit="{name}"`
- **In production, needs monitoring** → Operations Agent → `/specsmd-operations-agent --unit="{name}"`

### 2. Handle Special Cases

**User asks about something different than current state**:
> "I see you're in {current phase}, but you're asking about {different thing}. Let me help you with that instead."

**User is confused about what to do**:
> "Based on your project state, the logical next step is {action}. Would you like me to route you there, or do you have something else in mind?"

**Multiple options available**:
> "You have several options at this point:
>
> 1. {Option 1} → {command}
> 2. {Option 2} → {command}
> Which would you like to pursue?"

### 3. Provide Clear Handoff

Always include:

1. The specific command to run
2. What parameters to include
3. What the agent will help them do
4. What to expect next

---

## Output

````markdown
## Routing Recommendation

Based on your current state ({phase}) and request ({what user wants}):

### Recommended Action
→ **{Agent Name}**: {brief description of what it does}

### Command
```text
{exact command with parameters}
```

### What Happens Next

{Description of what the agent will guide them through}

### Actions

1 - **proceed**: Run the recommended command
2 - **different**: Choose a different option
3 - **explain**: Learn more about the target agent

### Suggested Next Step

→ **proceed** - Run the command above

**Type a number or press Enter for suggested action.**
````

---

## Human Validation Point

> "I'm routing you to the {Agent Name}. This agent will help you {specific task}. Does this match what you're trying to accomplish?"

---

## Transition

After routing:

- User runs the provided command
- Control transfers to the target agent
- Master Agent is no longer active

If user declines routing:

- → **Answer Question** (`.specsmd/skills/master/answer-question.md`) - clarify their needs
- → **Explain Flow** (`.specsmd/skills/master/explain-flow.md`) - explain the methodology

---

## Test Contract

```yaml
input: Context analysis + user request
output: Routing recommendation with exact command
checkpoints: 0 (routing only)
```
