# Testing specsmd Agents with Promptfoo

A practical guide to testing AI-DLC agents using Promptfoo, including test setup, golden datasets, and free model recommendations.

---

## Table of Contents

1. [Golden Datasets Explained](#golden-datasets-explained)
2. [Test Setup & Fixtures](#test-setup--fixtures)
3. [Free Coding Models on OpenRouter](#free-coding-models-on-openrouter)
4. [Testing Each Agent](#testing-each-agent)
5. [Complete Example Configuration](#complete-example-configuration)

---

## Golden Datasets Explained

### What is a Golden Dataset?

A **golden dataset** is a curated collection of **known-good input/output pairs** that serve as your quality baseline. Think of it as "these are examples of what correct agent behavior looks like."

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOLDEN DATASET                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   INPUT (What user asks)          OUTPUT (What agent should produce)    │
│   ─────────────────────           ─────────────────────────────────     │
│                                                                         │
│   "Create an intent for     →     # Intent: User Authentication         │
│    user authentication"           ## Problem Statement                  │
│                                   Users need secure login...            │
│                                   ## Success Criteria                   │
│                                   - 99.9% uptime...                     │
│                                                                         │
│   This is a GOLDEN EXAMPLE - we verified this is high quality          │
│   Future outputs are compared against this baseline                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Golden Datasets Matter

| Problem | How Golden Datasets Solve It |
|---------|------------------------------|
| LLM outputs vary each run | Compare to known-good baseline using similarity |
| "Is this output good?" is subjective | Golden examples define what "good" looks like |
| Regressions are hard to detect | If similarity drops, something broke |
| New team members don't know quality bar | Golden examples document expectations |

### Golden Dataset Structure

```
__tests__/
├── golden-datasets/
│   ├── inception-agent/
│   │   ├── inputs/
│   │   │   ├── 001-simple-auth.txt           # User request
│   │   │   ├── 002-payment-system.txt
│   │   │   └── 003-refactoring-legacy.txt
│   │   ├── outputs/
│   │   │   ├── 001-simple-auth.md            # Expected output
│   │   │   ├── 002-payment-system.md
│   │   │   └── 003-refactoring-legacy.md
│   │   └── context/                          # Required state (fixtures)
│   │       ├── 001-simple-auth/
│   │       │   └── memory-bank/              # Memory bank state for test
│   │       └── 002-payment-system/
│   │
│   ├── construction-agent/
│   │   ├── inputs/
│   │   ├── outputs/
│   │   └── context/                          # Pre-populated memory bank
│   │       ├── 001-start-bolt/
│   │       │   └── memory-bank/
│   │       │       ├── intents/
│   │       │       │   └── 001-user-auth/
│   │       │       ├── bolts/
│   │       │       │   └── bolt-auth-1.md
│   │       │       └── standards/
│   │       └── 002-continue-bolt/
│   │
│   └── master-agent/
│       ├── inputs/
│       ├── outputs/
│       └── context/
```

### Building Golden Examples

**Step 1: Run the agent and capture output**
```bash
# Run agent, save output
promptfoo eval --output captured.json
```

**Step 2: Human review**
- Is this output high quality?
- Does it follow our formatting rules?
- Would we be happy if users saw this?

**Step 3: If yes, promote to golden**
```bash
# Save as golden example
cp captured-output.md __tests__/golden-datasets/inception-agent/outputs/001-auth.md
```

**Step 4: Use in regression tests**
```yaml
# promptfoo.yaml
tests:
  - vars:
      request: file://golden-datasets/inception-agent/inputs/001-auth.txt
    assert:
      - type: similar
        value: file://golden-datasets/inception-agent/outputs/001-auth.md
        threshold: 0.85  # 85% similarity required
```

### Similarity Thresholds

| Threshold | Meaning | When to Use |
|-----------|---------|-------------|
| 0.95+ | Nearly identical | Exact format matters (templates) |
| 0.85-0.95 | Same content, minor variations | Most agent tests |
| 0.75-0.85 | Same concepts, different wording | Creative outputs |
| <0.75 | Significant difference | Likely a regression |

---

## Test Setup & Fixtures

### The Problem: Agents Need State

Each agent expects the memory bank to be in a specific state:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENT STATE REQUIREMENTS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MASTER AGENT                                                           │
│  └── Needs: memory-bank.yaml exists                                    │
│  └── Can work with: empty project OR existing intents                  │
│                                                                         │
│  INCEPTION AGENT                                                        │
│  └── Needs: memory-bank.yaml, standards/ (optional)                    │
│  └── Can work with: new intent OR continue existing                    │
│                                                                         │
│  CONSTRUCTION AGENT  ← Most state requirements                         │
│  └── Needs: memory-bank.yaml                                           │
│  └── Needs: intents/{intent}/ with requirements, units                 │
│  └── Needs: bolts/{bolt-id}/ with bolt files                          │
│  └── Needs: standards/ (tech-stack, coding-standards)                  │
│                                                                         │
│  OPERATIONS AGENT                                                       │
│  └── Needs: completed bolts                                            │
│  └── Needs: deployment config                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Solution: Test Fixtures

**Fixtures** are pre-configured memory bank states that tests can load before running.

```
__tests__/
└── fixtures/
    └── memory-bank-states/
        │
        ├── 01-empty-project/           # Fresh install
        │   └── .specsmd/
        │       └── aidlc/
        │           └── memory-bank.yaml
        │
        ├── 02-initialized-project/     # After project-init
        │   └── memory-bank/
        │       ├── standards/
        │       │   ├── tech-stack.md
        │       │   └── coding-standards.md
        │       └── project.yaml
        │
        ├── 03-inception-started/       # Intent created, no units
        │   └── memory-bank/
        │       ├── standards/
        │       └── intents/
        │           └── 001-user-auth/
        │               ├── requirements.md
        │               └── system-context.md
        │
        ├── 04-inception-complete/      # Ready for Construction
        │   └── memory-bank/
        │       ├── standards/
        │       ├── intents/
        │       │   └── 001-user-auth/
        │       │       ├── requirements.md
        │       │       ├── system-context.md
        │       │       ├── units.md
        │       │       └── units/
        │       │           └── auth-service/
        │       │               ├── unit-brief.md
        │       │               └── stories/
        │       │                   ├── 001-auth-service.md
        │       │                   └── 002-auth-service.md
        │       └── bolts/
        │           ├── bolt-auth-service-1/
        │           │   └── bolt.md     # status: planned
        │           └── bolt-auth-service-2/
        │               └── bolt.md     # status: planned
        │
        ├── 05-construction-in-progress/  # Bolt partially complete
        │   └── memory-bank/
        │       ├── ... (all above)
        │       └── bolts/
        │           └── bolt-auth-service-1/
        │               ├── bolt.md     # status: in-progress, stage: design
        │               └── ddd-01-domain-model.md  # Completed artifact
        │
        └── 06-construction-complete/    # Ready for Operations
            └── memory-bank/
                ├── ... (all above)
                └── bolts/
                    └── bolt-auth-service-1/
                        ├── bolt.md     # status: completed
                        ├── ddd-01-domain-model.md
                        ├── ddd-02-technical-design.md
                        └── ddd-03-test-report.md
```

### Using Fixtures in Tests

#### Option 1: Copy Fixture Before Test (Recommended)

```yaml
# promptfoo.yaml
tests:
  - description: "Construction agent continues bolt"
    setup: |
      # Copy fixture to test directory
      rm -rf ./test-workspace
      cp -r ./__tests__/fixtures/memory-bank-states/05-construction-in-progress ./test-workspace
    vars:
      workspace: ./test-workspace
      command: "bolt-start --bolt-id=bolt-auth-service-1"
    assert:
      - type: contains
        value: "Stage: design"
```

#### Option 2: Include State in Prompt Context

```yaml
# promptfoo.yaml
prompts:
  - |
    You are the Construction Agent.

    ## Current Memory Bank State
    {{memory_bank_state}}

    ## User Request
    {{request}}

tests:
  - description: "Construction agent with pre-loaded state"
    vars:
      memory_bank_state: file://fixtures/memory-bank-states/05-construction-in-progress/state.md
      request: "Continue bolt-auth-service-1"
```

#### Option 3: JavaScript Setup/Teardown

```javascript
// promptfoo.config.js
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  prompts: ['file://prompts/construction-agent.txt'],

  providers: ['openrouter:meta-llama/llama-3.3-70b-instruct:free'],

  tests: [
    {
      description: 'Start bolt from inception-complete state',

      // Setup: Copy fixture before test
      setup: async () => {
        const fixture = path.join(__dirname, 'fixtures/memory-bank-states/04-inception-complete');
        const workspace = path.join(__dirname, 'test-workspace');
        await fs.remove(workspace);
        await fs.copy(fixture, workspace);
        return { workspace };
      },

      // Teardown: Clean up after test
      teardown: async ({ workspace }) => {
        await fs.remove(workspace);
      },

      vars: {
        command: 'bolt-start --bolt-id=bolt-auth-service-1',
      },

      assert: [
        { type: 'contains', value: 'Stage 1: Domain Model' },
        { type: 'contains', value: '## Activities' },
      ],
    },
  ],
};
```

### State Transition Testing

Test that agents correctly transition between states:

```yaml
# state-transition-tests.yaml
tests:
  # Test: Inception creates correct state for Construction
  - description: "Inception → Construction transition"
    vars:
      initial_state: file://fixtures/03-inception-started/
      command: "bolt-plan"
    assert:
      - type: llm-rubric
        value: |
          The output should create bolt files that Construction Agent can execute.
          Check:
          1. Bolt files have correct frontmatter (id, unit, type, status: planned)
          2. Stories are assigned to bolts
          3. Dependencies are specified
          Return PASS if Construction Agent could start these bolts.

  # Test: Construction completes to Operations-ready state
  - description: "Construction → Operations transition"
    vars:
      initial_state: file://fixtures/05-construction-in-progress/
      command: "bolt-start --bolt-id=bolt-auth-service-1"
      # Simulate completing all stages
    assert:
      - type: llm-rubric
        value: |
          After bolt completion, verify:
          1. Bolt status is "completed"
          2. All stage artifacts exist
          3. Test report shows passing tests
          Return PASS if Operations Agent could deploy this.
```

---

## Free Coding Models on OpenRouter

Since specsmd agents are used by coding AI tools, here are the best **free** models for agent testing and as LLM-as-judge:

### Recommended Free Models

| Model ID | Context | Best For | Speed |
|----------|---------|----------|-------|
| `x-ai/grok-4.1-fast:free` | 2M | **Coding, tool calling, agentic** | Very Fast |
| `meta-llama/llama-4-maverick:free` | 1M | General + coding, multimodal | Fast |
| `meta-llama/llama-3.3-70b-instruct:free` | 128k | High quality reasoning | Medium |
| `qwen/qwen3-coder:free` | 256k | **Code-specialized** | Fast |
| `qwen/qwen3-235b-a22b:free` | 128k | Large MoE, general | Medium |
| `google/gemma-3-27b-it:free` | 128k | Good quality, fast | Fast |
| `mistralai/mistral-small-3.1-24b-instruct:free` | 128k | Balanced | Fast |

### Coding-Focused Recommendations

```yaml
# For testing coding agents (Construction Agent)
providers:
  # Best free coding model - xAI optimized for agentic coding
  - id: openrouter:x-ai/grok-4.1-fast:free
    label: grok-coding-free
    config:
      temperature: 0

  # Qwen's code-specialized model
  - id: openrouter:qwen/qwen3-coder:free
    label: qwen-coder-free
    config:
      temperature: 0

  # Llama 4 Maverick - huge context, good at code
  - id: openrouter:meta-llama/llama-4-maverick:free
    label: llama4-maverick-free
    config:
      temperature: 0
```

### Model Selection by Test Type

```yaml
# evaluation-config.yaml
model_selection:

  # Structure/format checks - use fast model
  format_validation:
    model: openrouter:google/gemma-3-27b-it:free
    reason: "Fast, good at pattern matching"

  # Code quality evaluation - use coding model
  code_review:
    model: openrouter:x-ai/grok-4.1-fast:free
    reason: "Optimized for code understanding"

  # Reasoning/logic checks - use large model
  reasoning_validation:
    model: openrouter:meta-llama/llama-3.3-70b-instruct:free
    reason: "Best reasoning in free tier"

  # General quality - balanced choice
  general_quality:
    model: openrouter:qwen/qwen3-235b-a22b:free
    reason: "Large MoE, good all-around"
```

### Provider Configuration

```yaml
# promptfoo.yaml - Full provider setup
providers:
  # PRIMARY: For most tests (fast, free, good at code)
  - id: openrouter:x-ai/grok-4.1-fast:free
    label: primary-free
    config:
      temperature: 0
      headers:
        HTTP-Referer: https://specs.md

  # JUDGE: For LLM-as-judge evaluations
  - id: openrouter:meta-llama/llama-3.3-70b-instruct:free
    label: judge-free
    config:
      temperature: 0
      headers:
        HTTP-Referer: https://specs.md

  # CODING: For code-specific tests
  - id: openrouter:qwen/qwen3-coder:free
    label: coding-free
    config:
      temperature: 0
      headers:
        HTTP-Referer: https://specs.md

  # FALLBACK: If primary is rate-limited
  - id: openrouter:google/gemma-3-27b-it:free
    label: fallback-free
    config:
      temperature: 0
```

---

## Testing Each Agent

### Testing Master Agent

**State Required**: Minimal - just memory-bank.yaml

```yaml
# master-agent-tests.yaml
description: "Master Agent Routing Tests"

prompts:
  - file://prompts/master-agent-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

defaultTest:
  assert:
    - type: not-contains
      value: "ERROR"

tests:
  # Routing to Inception
  - description: "Routes new feature to Inception"
    vars:
      project_state: file://fixtures/02-initialized-project/state-summary.md
      request: "I want to add user authentication"
    assert:
      - type: contains
        value: "Inception"
      - type: llm-rubric
        value: "Does the response correctly identify this needs Inception phase?"

  # Routing to Construction
  - description: "Routes to Construction when bolts exist"
    vars:
      project_state: file://fixtures/04-inception-complete/state-summary.md
      request: "Let's start building"
    assert:
      - type: contains
        value: "Construction"
      - type: contains
        value: "bolt"

  # Routing to Operations
  - description: "Routes to Operations when ready to deploy"
    vars:
      project_state: file://fixtures/06-construction-complete/state-summary.md
      request: "Deploy to staging"
    assert:
      - type: contains
        value: "Operations"
```

### Testing Inception Agent

**State Required**: Initialized project with standards

```yaml
# inception-agent-tests.yaml
description: "Inception Agent Tests"

prompts:
  - file://prompts/inception-agent-system.txt

providers:
  - openrouter:meta-llama/llama-3.3-70b-instruct:free

tests:
  # Intent Creation
  - description: "Creates well-structured intent"
    vars:
      project_state: file://fixtures/02-initialized-project/state-summary.md
      skill: "intent-create"
      request: "User authentication with OAuth and MFA"
    assert:
      # Structure checks
      - type: contains
        value: "## Problem Statement"
      - type: contains
        value: "## Success Criteria"
      # No ASCII tables (our formatting rule)
      - type: not-contains
        value: "|---|"
      # Quality check
      - type: llm-rubric
        provider: openrouter:x-ai/grok-4.1-fast:free
        value: |
          Evaluate this intent:
          1. Is the problem statement specific (not vague)?
          2. Are success criteria measurable?
          3. Does it follow numbered list format for options?
          Return PASS if all criteria met.

  # Requirements Gathering
  - description: "Asks clarifying questions first"
    vars:
      project_state: file://fixtures/03-inception-started/state-summary.md
      skill: "requirements"
      request: "Add the requirements for auth"
    assert:
      - type: llm-rubric
        value: |
          The agent should ask clarifying questions before generating requirements.
          Check if output contains questions like:
          - Authentication method preference?
          - Security requirements?
          - Integration needs?
          Return PASS if agent seeks clarification first.
```

### Testing Construction Agent

**State Required**: Complete inception with planned bolts

```yaml
# construction-agent-tests.yaml
description: "Construction Agent Tests"

prompts:
  - file://prompts/construction-agent-system.txt

providers:
  # Use coding-focused model
  - openrouter:x-ai/grok-4.1-fast:free

tests:
  # Bolt Start
  - description: "Starts bolt with correct stage"
    vars:
      project_state: file://fixtures/04-inception-complete/state-summary.md
      bolt_state: file://fixtures/04-inception-complete/memory-bank/bolts/bolt-auth-service-1/bolt.md
      skill: "bolt-start"
      bolt_id: "bolt-auth-service-1"
    assert:
      - type: contains
        value: "Stage 1"
      - type: contains
        value: "Domain Model"
      # Check it reads bolt type
      - type: llm-rubric
        value: "Does the agent reference the bolt type definition for stage activities?"

  # Stage Completion
  - description: "Stops at human gate after stage"
    vars:
      project_state: file://fixtures/05-construction-in-progress/state-summary.md
      skill: "bolt-start"
      bolt_id: "bolt-auth-service-1"
    assert:
      # Must stop and wait
      - type: contains
        value: "Human Validation"
      - type: llm-rubric
        value: |
          Check that the agent:
          1. Presents stage completion summary
          2. Asks for confirmation before proceeding
          3. Does NOT auto-advance to next stage
          Return PASS if human gate is enforced.

  # Code Generation Quality
  - description: "Generates code following standards"
    vars:
      project_state: file://fixtures/05-construction-in-progress/state-summary.md
      standards: file://fixtures/05-construction-in-progress/memory-bank/standards/
      skill: "bolt-start"
      stage: "implement"
    assert:
      - type: llm-rubric
        provider: openrouter:qwen/qwen3-coder:free  # Use code model for code review
        value: |
          Evaluate the generated code:
          1. Does it follow the tech-stack standards?
          2. Is naming consistent with coding-standards?
          3. Is error handling included?
          4. Are there appropriate comments?
          Return PASS if code quality is acceptable.
```

### Testing Operations Agent

**State Required**: Completed construction with all bolts done

```yaml
# operations-agent-tests.yaml
description: "Operations Agent Tests"

prompts:
  - file://prompts/operations-agent-system.txt

providers:
  - openrouter:x-ai/grok-4.1-fast:free

tests:
  # Deployment Progression
  - description: "Enforces dev → staging → prod progression"
    vars:
      project_state: file://fixtures/06-construction-complete/state-summary.md
      skill: "deploy"
      request: "Deploy to production"
    assert:
      - type: llm-rubric
        value: |
          Agent should NOT allow direct production deployment.
          Check that it:
          1. Asks about dev/staging deployment status
          2. Requires progression through environments
          3. Warns about skipping stages
          Return PASS if it blocks direct prod deployment.

  # Production Approval Gate
  - description: "Requires explicit approval for production"
    vars:
      project_state: file://fixtures/06-construction-complete/state-summary.md
      deployment_state: "dev: deployed, staging: deployed, verified"
      skill: "deploy"
      request: "Deploy to production"
    assert:
      - type: contains
        value: "APPROVAL"
      - type: contains
        value: "yes/no"
      - type: llm-rubric
        value: "Does the agent require explicit human approval before production deployment?"
```

---

## Complete Example Configuration

### Directory Structure

```
specsmd/
├── __tests__/
│   ├── evaluation/
│   │   ├── promptfoo.yaml              # Main config
│   │   ├── providers.yaml              # Model definitions
│   │   │
│   │   ├── agents/                     # Per-agent tests
│   │   │   ├── master-agent.yaml
│   │   │   ├── inception-agent.yaml
│   │   │   ├── construction-agent.yaml
│   │   │   └── operations-agent.yaml
│   │   │
│   │   ├── rubrics/                    # Reusable assertions
│   │   │   ├── output-formatting.yaml
│   │   │   ├── human-gates.yaml
│   │   │   └── code-quality.yaml
│   │   │
│   │   └── prompts/                    # Agent system prompts
│   │       ├── master-agent-system.txt
│   │       ├── inception-agent-system.txt
│   │       ├── construction-agent-system.txt
│   │       └── operations-agent-system.txt
│   │
│   ├── golden-datasets/                # Known-good examples
│   │   ├── inception-agent/
│   │   ├── construction-agent/
│   │   └── master-agent/
│   │
│   └── fixtures/                       # Test state setup
│       └── memory-bank-states/
│           ├── 01-empty-project/
│           ├── 02-initialized-project/
│           ├── 03-inception-started/
│           ├── 04-inception-complete/
│           ├── 05-construction-in-progress/
│           └── 06-construction-complete/
│
└── package.json
```

### Main Configuration

```yaml
# __tests__/evaluation/promptfoo.yaml
description: "specsmd Agent Evaluation Suite"

# Import providers
providers: file://providers.yaml

# Import all agent tests
tests:
  - file://agents/master-agent.yaml
  - file://agents/inception-agent.yaml
  - file://agents/construction-agent.yaml
  - file://agents/operations-agent.yaml

# Shared assertions for all tests
defaultTest:
  assert:
    # Output formatting rules (embedded in every test)
    - type: not-contains
      value: "|---|"
      description: "No ASCII tables"
    - type: javascript
      value: |
        // Check for status indicators
        const hasIndicators =
          output.includes('✅') ||
          output.includes('⏳') ||
          output.includes('[ ]');
        return hasIndicators || output.length < 100;  // Short outputs exempt
```

### Provider Configuration

```yaml
# __tests__/evaluation/providers.yaml

# Fast coding model - primary choice
- id: openrouter:x-ai/grok-4.1-fast:free
  label: grok-fast
  config:
    temperature: 0
    headers:
      HTTP-Referer: https://specs.md

# High-quality reasoning - for complex tests
- id: openrouter:meta-llama/llama-3.3-70b-instruct:free
  label: llama-70b
  config:
    temperature: 0

# Code specialist - for code review assertions
- id: openrouter:qwen/qwen3-coder:free
  label: qwen-coder
  config:
    temperature: 0

# Fast fallback
- id: openrouter:google/gemma-3-27b-it:free
  label: gemma-fast
  config:
    temperature: 0
```

### Reusable Rubrics

```yaml
# __tests__/evaluation/rubrics/output-formatting.yaml
- name: no-ascii-tables
  assert:
    - type: not-contains
      value: "|---|"
    - type: not-contains
      value: "+---+"

- name: numbered-list-format
  assert:
    - type: llm-rubric
      provider: openrouter:google/gemma-3-27b-it:free
      value: "Are options presented as numbered lists (1 - **Option**: Description) not tables?"

- name: status-indicators
  assert:
    - type: javascript
      value: |
        const indicators = ['✅', '⏳', '[ ]', '🚫'];
        return indicators.some(i => output.includes(i));

- name: suggested-next-step
  assert:
    - type: contains
      value: "Suggested Next Step"
    - type: contains
      value: "→"
```

```yaml
# __tests__/evaluation/rubrics/human-gates.yaml
- name: stops-at-validation
  assert:
    - type: llm-rubric
      value: |
        Check that the agent stops and waits for human input.
        Signs of proper human gate:
        - Contains "Validation Required" or "Approval Required"
        - Asks a question and waits
        - Does NOT auto-continue to next step
        Return PASS if human gate is enforced.

- name: does-not-auto-advance
  assert:
    - type: not-contains
      value: "Proceeding to"
    - type: not-contains
      value: "Moving on to"
    - type: not-contains
      value: "Automatically"
```

### Package.json Scripts

```json
{
  "scripts": {
    "eval": "cd __tests__/evaluation && promptfoo eval",
    "eval:master": "cd __tests__/evaluation && promptfoo eval -c agents/master-agent.yaml",
    "eval:inception": "cd __tests__/evaluation && promptfoo eval -c agents/inception-agent.yaml",
    "eval:construction": "cd __tests__/evaluation && promptfoo eval -c agents/construction-agent.yaml",
    "eval:operations": "cd __tests__/evaluation && promptfoo eval -c agents/operations-agent.yaml",
    "eval:view": "cd __tests__/evaluation && promptfoo view",
    "eval:ci": "cd __tests__/evaluation && promptfoo eval --ci",
    "eval:baseline": "cd __tests__/evaluation && promptfoo eval --output baseline.json"
  }
}
```

---

## Quick Start

```bash
# 1. Install promptfoo
npm install -g promptfoo

# 2. Set API key (free!)
export OPENROUTER_API_KEY=sk-or-...

# 3. Run all tests
npm run eval

# 4. View results
npm run eval:view

# 5. Run specific agent
npm run eval:construction
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| **Golden Dataset** | Known-good input/output pairs for regression testing |
| **Fixtures** | Pre-configured memory bank states for test setup |
| **LLM-as-Judge** | Use free models to evaluate output quality |
| **Free Coding Models** | Grok 4.1 Fast, Qwen Coder, Llama 3.3 70B |

---

*Document created: 2025-12-10*
*Status: Tutorial / Reference*
