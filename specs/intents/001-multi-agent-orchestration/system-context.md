# System Context: Multi-Agent Orchestration

## Boundaries

### In Scope
- Agent definitions and personas
- Skill system and execution
- Agent routing and orchestration
- Memory Bank integration
- Template-based artifact generation
- Human validation workflows

### Out of Scope
- Tool-specific implementation (handled by Agentic Coding Tool Integration intent)
- Artifact storage mechanism (handled by Memory Bank intent)
- Standards definition (handled by Standards System intent)

---

## Actors

### Primary Actors

#### AI-Native Engineer (Developer)
- Invokes agents via slash commands
- Provides intent descriptions and requirements
- Validates AI-generated artifacts
- Makes decisions at validation points
- Executes construction bolts

#### Product Owner
- Provides business intent
- Validates requirements and stories
- Approves bolt plans
- Participates in Mob Elaboration

### System Actors

#### Agentic Coding Tool (Claude Code / Cursor / Copilot)
- Hosts slash commands
- Provides context to agents
- Displays agent output

#### Memory Bank
- Stores project artifacts
- Provides context on agent activation
- Maintains traceability

---

## External Systems

### Memory Bank System
- **Interface**: File system paths defined in `memory-bank.yaml`
- **Data Exchange**: Read/write markdown artifacts
- **Dependency**: Agents read state on activation

### Standards System
- **Interface**: Standards catalog and facilitation guides
- **Data Exchange**: Read standards for project context
- **Dependency**: Construction Agent loads standards during execution

### Template System
- **Interface**: Markdown templates in `.specsmd/aidlc/templates/`
- **Data Exchange**: Read templates, write artifacts
- **Dependency**: Skills use templates for artifact generation

---

## Integration Points

### Agent ↔ Memory Bank
```
Agent activates
  → Reads memory-bank.yaml schema
  → Checks artifact paths for state
  → Loads relevant artifacts
  → Executes skill
  → Writes artifacts to Memory Bank
```

### Agent ↔ Templates
```
Skill executes
  → Loads template from templates/{phase}/
  → Fills template with context
  → Writes artifact to Memory Bank
```

### Agent ↔ Standards
```
Construction Agent executes
  → Loads tech-stack.md
  → Loads coding-standards.md
  → Applies standards to code generation
```

---

## Context Diagram

```
                    ┌─────────────────────┐
                    │   AI-Native Engineer │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Agentic Coding Tool│
                    │ (Claude Code/Cursor/│
                    │  Copilot)           │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐     │     ┌──────────▼─────────┐
    │   Slash Commands  │     │     │   Memory Bank      │
    │   (/specsmd-*)    │     │     │   (File System)    │
    └─────────┬─────────┘     │     └──────────▲─────────┘
              │               │                │
              │     ┌─────────▼─────────┐      │
              └────►│  Agent System     │◄─────┘
                    │                   │
                    │  ┌─────────────┐  │
                    │  │   Master    │  │
                    │  ├─────────────┤  │
                    │  │  Inception  │  │
                    │  ├─────────────┤  │
                    │  │Construction │  │
                    │  ├─────────────┤  │
                    │  │ Operations  │  │
                    │  └─────────────┘  │
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Template System  │
                    │  Standards System │
                    └───────────────────┘
```

---

## Constraints

### Technical Constraints
- Agents are stateless per invocation
- Context must be read from Memory Bank each time
- Agentic coding tool provides limited context window

### Process Constraints
- Human validation required at each phase boundary
- Three phases (Inception → Construction → Operations) with iterative refinement
- Bolt stages must complete before next stage
