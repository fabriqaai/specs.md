---
name: context
description: Use when an AI-DLC intent needs its system boundaries, actors, external systems, and data flows defined. Writes `system-context.md` with a C4 context diagram for the intent.
license: MIT
metadata:
  version: "1.0.0"
  flow: aidlc
  phase: inception
disable-model-invocation: true
---

# Define System Context

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [x] Intent created
- [x] Requirements gathered
- [ ] Generating artifacts...  ← current
    - [ ] System Context  ← this skill
    - [ ] Units
    - [ ] Stories
    - [ ] Bolt Plan
- [ ] Artifacts reviewed (Checkpoint 3)
- [ ] Ready for Construction
```

---

## Checkpoints in This Skill

**NO INDIVIDUAL Checkpoint** - This skill is part of the batched artifact generation.

All artifacts (Context, Units, Stories, Bolts) are reviewed together at **Checkpoint 3** in the `review` skill.

---

## Goal

Identify system boundaries, actors, and external dependencies to establish the "world" the system lives in.

---

## Input

- **Required**: Intent name
- **Required**: `requirements.md` for the intent
- **Required**: The memory-bank layout - `memory-bank/intents/{intent-name}/` (full schema: `references/memory-bank.yaml` in the `inception` skill)

---

## Process

### 1. Identify Actors

Ask questions to discover all system users:

- **Human Users**: "Who uses this directly?" (Admin, Customer, Support)
- **System Users**: "What systems call this?" (Scheduler, Event Bus)
- **External Systems**: "What third-party services interact?" (payment provider, identity provider)

### 2. Map External Systems

For each external dependency, document:

- **System name**: What is it?
- **Direction**: Inbound/Outbound/Both
- **Data Exchanged**: What data crosses?
- **Protocol**: REST/GraphQL/Event

### 3. Define Data Flows

Document what data crosses the boundary:

**Inbound**:

- What data enters the system?
- What format? (JSON, XML, Binary)
- What validation is needed?

**Outbound**:

- What data leaves the system?
- What consumers expect it?
- What guarantees are needed? (Delivery, ordering)

### 4. Create Context Diagram

Generate a C4 Context diagram (Mermaid):

```markdown
## System Context Diagram

​```mermaid
C4Context
    title System Context - {intent-name}

    Person(user, "User", "Primary user of the system")
    System(sys, "{System Name}", "The system being built")
    System_Ext(ext1, "External System", "Third-party service")

    Rel(user, sys, "Uses")
    Rel(sys, ext1, "Integrates with")
​```
```

### 5. Document Context

1. **Write Path**: `memory-bank/intents/{intent-name}/system-context.md`

2. **Use Template**: `references/system-context-template.md` in this skill's directory

3. **Structure**:

   ```markdown
   ## Actors

   - **{Actor}** ({Type}): {Description}

   ## External Systems

   - **{System}**: {Purpose} - {Integration Type}

   ## Data Flows
   ### Inbound
   ### Outbound

   ## Context Diagram
   {Mermaid diagram}
   ```

### 6. Validate Completeness

Ask:

- "Did I miss any third-party integrations?"
- "Are there legacy systems this needs to work with?"
- "Any planned future integrations to consider?"

---

## Output

```markdown
## System Context: {intent-name}

### Actors Identified

- **Customer** (Human): Web/Mobile UI
- **Admin** (Human): Admin Dashboard
- **Payment Gateway** (System): REST API

### External Dependencies

- **{payment provider}**: Payments - Risk: High
- **{email provider}**: Email - Risk: Medium

### Data Flow Summary
- **Inbound**: User requests, webhook events
- **Outbound**: Transaction records, notifications

### Artifact Created
✅ `{intent-path}/system-context.md`
```

**No menu** - artifact complete.

---

## Transition

**REQUIRED NEXT SKILL**: invoke the `units` skill immediately (do not stop) unless at a checkpoint. This skill has no checkpoint of its own - the batch is reviewed at Checkpoint 3 in the `review` skill.

---

## Test Contract

```yaml
input: Intent requirements
output: system-context.md with actors, systems, data flows
checkpoints: 0 (part of Checkpoint 3 batch)
```
