# Skill: Answer Question

---

## Role

Knowledge retrieval skill to answer questions by querying memory bank artifacts.

**NO Checkpoint** - Answering questions is informational, not a decision point.

---

## Goal

Answer user questions about the project by querying the Memory Bank artifacts.

---

## Input

- **Required**: User's question
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Parse the Question

Identify what type of information is being requested:

- **Status of intent/unit/bolt** → Check respective artifact files
- **Configuration/settings** → `{schema.standards}/`
- **Requirements** → `{intent}/requirements.md`
- **Architecture decisions** → `{unit}/ddd-02-technical-design.md` or `standards/system-architecture.md`
- **Deployment info** → `{unit}/deployment/`
- **Story details** → `{unit}/stories/`

### 2. Search Logic

1. **Extract keywords** from the question
2. **Locate artifacts** using schema paths from `.specsmd/aidlc/memory-bank.yaml`
3. **Read relevant files** to find the answer
4. **Cite sources** in your response

### 3. Formulate Answer

**If found**:

```markdown
## Answer

{Direct answer to the question}

**Source**: `{path/to/file.md}`
```

**If not found**:

```markdown
## Answer

I couldn't find information about "{topic}" in the memory bank.

**Searched**:
- `{path1}` - not found
- `{path2}` - not found

**Suggestions**:
- Would you like to create this artifact?
- Is this information stored elsewhere?
```

---

## Common Questions & Sources

- **"What is the status of {bolt}?"** → `{schema.bolts}` - check `status` field
- **"What requirements do we have?"** → `{schema.intents}/{intent}/requirements.md`
- **"What units are in {intent}?"** → `{schema.intents}/{intent}/units.md`
- **"What stories are in {unit}?"** → `{schema.stories}` directory
- **"What's the tech stack?"** → `{schema.standards}/tech-stack.md`
- **"What are our coding standards?"** → `{schema.standards}/coding-standards.md`
- **"What's the system architecture?"** → `{schema.standards}/system-architecture.md`
- **"When was {unit} deployed?"** → `{schema.units}/{unit}/deployment/history.md`

---

## Output

```markdown
## {Question Rephrased}

{Clear, direct answer}

### Details
{Supporting information if relevant}

### Source
- `{path/to/source/file.md}`

### Related Information
- {Other relevant artifacts if any}

### Actions

1 - **more**: Get more details
2 - **action**: Take action based on this information
3 - **another**: Ask another question

### Suggested Next Step
→ **more** - Learn more about {specific aspect}

**Type a number or press Enter for suggested action.**
```

---

## Human Validation Point

> "Does this answer your question? Would you like more details about {specific aspect}?"

---

## Transition

After answering:

- → **Route Request** (`.specsmd/skills/master/route-request.md`) - if user wants to take action
- → **Analyze Context** (`.specsmd/skills/master/analyze-context.md`) - if user wants overall status
- → Stay in Q&A mode if user has more questions

---

## Test Contract

```yaml
input: User question
output: Answer with source citations or acknowledgment of not found
checkpoints: 0 (informational only)
```
