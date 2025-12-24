# System Context: Testing Strategy

## Boundaries

### In Scope
- Test framework architecture and organization
- Specification contract validation
- CLI and installer test infrastructure
- Agent behavior evaluation system
- Golden dataset management
- CI/CD pipeline integration
- Quality metrics and dashboards

### Out of Scope
- Agent implementation (handled by Multi-Agent Orchestration intent)
- Memory Bank storage (handled by Memory Bank System intent)
- Standards definitions (handled by Standards System intent)
- Tool-specific installations (handled by Agentic Coding Tool Integration intent)

---

## Actors

### Primary Actors

#### AI-Native Engineer (Developer)
- Writes and maintains tests
- Reviews test results and quality scores
- Curates golden dataset examples
- Defines evaluation rubrics
- Fixes failing tests and regressions

#### QA Engineer
- Designs test strategies
- Validates test coverage
- Reviews golden dataset quality
- Monitors quality dashboards

### System Actors

#### CI/CD Pipeline (GitHub Actions)
- Executes test suites automatically
- Enforces quality gates
- Reports test results
- Blocks releases on failures

#### LLM Evaluation Service
- Evaluates agent outputs against rubrics
- Computes semantic similarity scores
- Provides LLM-as-judge verdicts

---

## External Systems

### Agent System (Multi-Agent Orchestration)
- **Interface**: Agent invocation via slash commands
- **Data Exchange**: Test inputs → Agent outputs
- **Dependency**: Tests validate agent behavior

### Memory Bank System
- **Interface**: File system paths in `memory-bank.yaml`
- **Data Exchange**: Pre-seeded test states, generated artifacts
- **Dependency**: E2E tests require Memory Bank fixtures

### LLM Provider (OpenRouter Free Tier)
- **Interface**: OpenAI-compatible API via OpenRouter
- **Data Exchange**: Evaluation prompts → Scores
- **Dependency**: Agent evaluation requires OpenRouter API key
- **Models Used**:
  - `x-ai/grok-4.1-fast:free` - Coding agents, release validation (2M context)
  - `qwen/qwen3-coder:free` - Code-specialized evaluation
  - `meta-llama/llama-3.3-70b-instruct:free` - Reasoning
- **Cost**: $0 (free tier)

### Evaluation Tools (Promptfoo)
- **Interface**: CLI (`promptfoo eval`) and YAML configuration
- **Data Exchange**: Golden datasets → Evaluation reports
- **Dependency**: Quality scoring infrastructure
- **Why Promptfoo**: Declarative YAML config, CLI-first, free model support via OpenRouter

---

## Integration Points

### Test Framework ↔ Agent System
```
Test executes
  → Invokes agent via slash command
  → Captures agent output
  → Validates against expectations
  → Records quality metrics
```

### Test Framework ↔ Memory Bank
```
E2E test starts
  → Loads pre-seeded Memory Bank state
  → Executes workflow
  → Validates generated artifacts
  → Cleans up test state
```

### Test Framework ↔ CI/CD
```
PR opened
  → CI triggers test suite
  → Deterministic tests run first
  → Agent evaluation runs on main
  → Quality gates enforce thresholds
  → Results reported to PR
```

### Test Framework ↔ LLM Evaluation
```
Golden dataset evaluation
  → Loads test cases
  → Executes agents
  → Sends outputs to evaluator
  → Receives quality scores
  → Compares to baselines
```

---

## Context Diagram

```
                    ┌─────────────────────┐
                    │   AI-Native Engineer │
                    └──────────┬──────────┘
                               │ writes tests, reviews results
                               ▼
                    ┌──────────────────────┐
                    │   Test Framework     │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Schema Tests   │  │
                    │  ├────────────────┤  │
                    │  │ CLI Tests      │  │
                    │  ├────────────────┤  │
                    │  │ Agent Eval     │  │
                    │  ├────────────────┤  │
                    │  │ E2E Tests      │  │
                    │  └────────────────┘  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Agent System   │  │  Memory Bank    │  │  CI/CD Pipeline │
│                 │  │                 │  │ (GitHub Actions)│
│  - Master       │  │  - Fixtures     │  │                 │
│  - Inception    │  │  - States       │  │  - PR triggers  │
│  - Construction │  │  - Artifacts    │  │  - Quality gates│
│  - Operations   │  │                 │  │  - Reporting    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐
│  OpenRouter     │  │   Promptfoo     │
│  Free Tier      │  │                 │
│                 │  │  - YAML config  │
│  - Grok 4.1     │  │  - LLM-rubric   │
│  - Qwen Coder   │  │  - Assertions   │
│  - Llama 3.3    │  │  - Baselines    │
└─────────────────┘  └─────────────────┘
```

---

## Constraints

### Technical Constraints
- LLM outputs are non-deterministic; exact-match testing is not viable
- CI/CD has limited execution time; full evaluation must be tiered
- Mock responses must be maintained and versioned
- Golden datasets require curation effort

### Process Constraints
- Quality thresholds must be agreed upon by team
- Baseline updates require human review
- LLM-as-judge adds cost and latency
- Human approval gates slow down deployment

### Resource Constraints
- ~~LLM API costs for evaluation~~ → **$0** using OpenRouter free tier
- Storage for golden datasets and baselines
- Compute for parallel test execution

---

## Quality Attributes

### Testability
- All components designed with testing in mind
- Clear interfaces for mocking and stubbing
- Deterministic where possible, probabilistic where necessary

### Reproducibility
- Same inputs produce same test outcomes (within tolerance)
- Environment differences handled via configuration
- Random seeds controllable for LLM calls

### Traceability
- Test results linked to code changes
- Quality trends trackable over time
- Regressions traceable to specific commits
