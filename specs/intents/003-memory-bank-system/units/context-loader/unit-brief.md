# Unit Brief: Context Loader

## Overview

The Context Loader unit handles reading the memory-bank.yaml configuration and loading relevant artifacts when an agent activates. This provides agents with the context they need to understand project state.

---

## Scope

### In Scope
- Reading memory-bank.yaml on agent activation
- Resolving path templates
- Loading phase-relevant artifacts
- Providing context to agent skills
- Determining project state (phase, progress)

### Out of Scope
- Schema definition (handled by configuration-schema)
- Actual file I/O (handled by artifact-storage)

---

## Technical Context

### Activation Point
Every agent reads context at activation before executing any skill.

### Agent Activation Pattern
```
User invokes /specsmd-{agent}
         │
         ▼
Agent activates
         │
         ▼
Context Loader reads memory-bank.yaml
         │
         ▼
Context Loader loads relevant artifacts
         │
         ▼
Agent receives context object
         │
         ▼
Agent executes skill with context
```

---

## Implementation Details

### Context Object Structure

```javascript
{
  // Configuration
  config: {
    schema: { /* from memory-bank.yaml */ },
    structure: [ /* from memory-bank.yaml */ ],
    ownership: { /* from memory-bank.yaml */ }
  },

  // Project State
  project: {
    hasIntents: boolean,
    hasUnits: boolean,
    hasBolts: boolean,
    hasStandards: boolean,
    phase: "none" | "inception" | "construction" | "operations"
  },

  // Loaded Artifacts (varies by agent)
  artifacts: {
    intents: [ /* list of intent objects */ ],
    currentIntent: { /* if working on specific intent */ },
    currentUnit: { /* if working on specific unit */ },
    standards: { /* loaded standards */ },
    // ... more as needed
  }
}
```

### Phase Determination Logic

```
function determinePhase(memoryBank):
    IF no intents exist:
        return "none"  // Need to start inception

    IF intents exist but no units with stories:
        return "inception"  // Still in inception

    IF stories exist but no completed bolts:
        return "construction"  // Ready for construction

    IF completed bolts exist:
        return "operations"  // Ready for deployment
```

### Agent-Specific Loading

Each agent loads different context based on its phase:

**Master Agent**:
- All intents (names, status)
- All bolts (status)
- Standards (if exist)
- Determines overall project phase

**Inception Agent**:
- All intents with details
- Current intent's requirements, context, units
- Story status per unit

**Construction Agent**:
- Current unit brief
- Stories for current unit
- Active bolts
- Standards (tech-stack, coding-standards)

**Operations Agent**:
- Completed bolts
- Deployment context
- Standards

### Context Loading Algorithm

```
function loadContext(agentType):
    // 1. Read config
    config = readYAML(".specsmd/memory-bank.yaml")

    // 2. Determine project state
    project = analyzeProjectState(config)

    // 3. Load agent-specific artifacts
    artifacts = {}

    IF agentType == "master":
        artifacts.intents = listAllIntents()
        artifacts.standards = loadStandards()

    ELSE IF agentType == "inception":
        artifacts.intents = listAllIntents()
        artifacts.currentIntent = loadCurrentIntent()

    ELSE IF agentType == "construction":
        artifacts.currentUnit = loadCurrentUnit()
        artifacts.standards = loadStandards()
        artifacts.bolts = listActiveBolts()

    ELSE IF agentType == "operations":
        artifacts.completedBolts = listCompletedBolts()
        artifacts.deploymentContext = loadDeploymentContext()

    // 4. Return context
    return { config, project, artifacts }
```

### Artifact Loading Functions

```javascript
function listAllIntents():
    // List directories in memory-bank/intents/
    // For each, load requirements.md header
    // Return array of { name, status, path }

function loadCurrentIntent(intentName):
    // Load from memory-bank/intents/{intentName}/
    // Include: requirements.md, system-context.md, units.md
    // Return structured object

function loadStandards():
    // Load from memory-bank/standards/
    // Return { techStack, codingStandards, architecture }

function listActiveBolts():
    // List files in memory-bank/bolts/
    // Filter by status != "completed"
    // Return array of bolt summaries
```

---

## Caching Policy

**No caching between sessions**. Agents are stateless, so context is loaded fresh each time.

Rationale:
- Memory bank may change between invocations
- User may have manually edited files
- Fresh state ensures accuracy

---

## Error Handling

| Error Case | Handling |
|------------|----------|
| memory-bank.yaml missing | Create default config |
| memory-bank/ empty | Return phase="none" |
| Corrupt YAML | Surface error, suggest fix |
| Missing artifact | Skip, note in context |

---

## Acceptance Criteria

### AC-1: Fresh Context on Activation
- GIVEN agent was invoked 5 minutes ago
- WHEN agent is invoked again
- THEN fresh context is loaded from disk
- AND changes made since last invocation are reflected

### AC-2: Phase Detection
- GIVEN memory bank with intents but no bolts
- WHEN Master Agent loads context
- THEN project.phase equals "inception" or "construction"
- AND routing recommendations match phase

### AC-3: Agent-Specific Loading
- GIVEN Construction Agent activates
- WHEN context is loaded
- THEN standards are included (for code generation)
- AND only construction-relevant artifacts loaded

### AC-4: Graceful Degradation
- GIVEN partially populated memory bank
- WHEN context is loaded
- THEN missing sections are null/empty
- AND agent can still function
