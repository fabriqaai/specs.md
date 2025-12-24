# Intent: Testing Strategy

## Overview
Implement a comprehensive testing framework for specsmd that addresses the unique challenges of testing CLI tools combined with markdown-based agentic workflows, handling both deterministic and non-deterministic components.

---

## Research Documents

Detailed research, tutorials, and implementation guides are available in:

| Document | Path | Description |
|----------|------|-------------|
| **Testing Strategy** | `specs/research/test_strategy/testing-strategy.md` | Core strategy with 6-layer pyramid, developer workflows, CI/CD integration |
| **Promptfoo Tutorial** | `specs/research/test_strategy/promptfoo-tutorial.md` | General Promptfoo guide, comparisons, assertions |
| **specsmd Tutorial** | `specs/research/test_strategy/promptfoo-specsmd-tutorial.md` | specsmd-specific testing guide, golden datasets, test fixtures |

---

## Technology Decisions

Based on research, the following technologies have been selected:

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Unit Tests** | Vitest | Fast, TypeScript-native, Jest-compatible |
| **Schema/Contract** | JSON Schema (Ajv) + markdownlint | Validates YAML/MD structure without LLM |
| **Integration** | BATS | Tests CLI commands in real shell |
| **E2E Workflow** | Custom Node.js harness | Orchestrates multi-agent flows |
| **Agent Behavior** | Promptfoo + OpenRouter Free | Declarative LLM testing, $0 cost |
| **Release Validation** | Promptfoo + Grok 4.1 Fast + Human | High-quality eval, $0 cost |

### LLM-as-Judge Models (All Free)

| Model | Use Case |
|-------|----------|
| `x-ai/grok-4.1-fast:free` | Coding agents, release validation (2M context) |
| `qwen/qwen3-coder:free` | Code-specialized evaluation |
| `meta-llama/llama-3.3-70b-instruct:free` | High-quality reasoning |

**Cost**: Entire testing stack is **$0** using OpenRouter free tier.

---

## Problem Statement

specsmd has three distinct layers requiring different testing approaches:
1. **CLI Tool Layer** - Deterministic commands, installers, file operations
2. **Markdown Specification Layer** - Schema validation, structure compliance
3. **Agent Behavior Layer** - Non-deterministic LLM-driven outputs

Traditional testing approaches fail for agent behaviors due to LLM non-determinism. A multi-layer strategy combining specification-driven testing, behavioral assertions, and LLM-as-judge evaluation is required.

---

## Functional Requirements

### FR-1: Specification Contract Testing
- FR-1.1: System SHALL validate `memory-bank.yaml` schema against JSON Schema
- FR-1.2: System SHALL validate intent artifacts contain required sections
- FR-1.3: System SHALL validate unit briefs follow template structure
- FR-1.4: System SHALL validate bolt templates conform to type definitions
- FR-1.5: System SHALL enforce markdown structure via linting rules

### FR-2: CLI & Installer Testing
- FR-2.1: System SHALL provide unit tests for all installer components
- FR-2.2: System SHALL provide integration tests for slash commands via BATS
- FR-2.3: System SHALL provide snapshot tests for generated file content
- FR-2.4: System SHALL provide property-based tests for Memory Bank CRUD operations

### FR-3: Agent Behavior Testing
- FR-3.1: System SHALL support mocking LLM responses for CI/CD pipelines
- FR-3.2: System SHALL support LLM-as-judge evaluation with configurable rubrics
- FR-3.3: System SHALL support semantic similarity testing against golden datasets
- FR-3.4: System SHALL support behavioral assertions (property checks, not exact matches)
- FR-3.5: System SHALL handle test flakiness due to LLM non-determinism

### FR-4: End-to-End Workflow Testing
- FR-4.1: System SHALL test complete AI-DLC flows (Inception → Construction → Operations)
- FR-4.2: System SHALL test multi-agent coordination scenarios
- FR-4.3: System SHALL test partial completion and state recovery
- FR-4.4: System SHALL support pre-seeded Memory Bank states for reproducibility

### FR-5: Golden Dataset Management
- FR-5.1: System SHALL maintain curated input/output examples per agent
- FR-5.2: System SHALL support baseline comparison for regression detection
- FR-5.3: System SHALL support evaluation rubrics in YAML format
- FR-5.4: System SHALL track quality scores over time

### FR-6: CI/CD Integration
- FR-6.1: System SHALL run deterministic tests on every PR
- FR-6.2: System SHALL run agent evaluation tests on merge to main
- FR-6.3: System SHALL run comprehensive evaluation nightly
- FR-6.4: System SHALL support human approval gates at phase transitions
- FR-6.5: System SHALL block releases when quality thresholds are not met

---

## Non-Functional Requirements

### NFR-1: Performance
- Deterministic tests SHALL complete in under 2 minutes per PR
- Agent evaluation tests SHALL complete in under 5 minutes for quick eval
- Full golden dataset evaluation SHALL complete in under 30 minutes

### NFR-2: Reliability
- Test suite SHALL be reproducible across environments
- Mock responses SHALL be versioned and deterministic
- Golden dataset baselines SHALL be immutable per version

### NFR-3: Maintainability
- Test fixtures SHALL be organized by test layer and agent
- Evaluation rubrics SHALL be human-readable YAML
- Test configuration SHALL support environment overrides

### NFR-4: Observability
- Test results SHALL be reportable as metrics
- Quality scores SHALL be trackable over time
- Regression trends SHALL be visualizable in dashboards

### NFR-5: Extensibility
- New agents SHALL be testable without modifying test framework
- New evaluation metrics SHALL be addable via configuration
- Custom rubrics SHALL be definable per project

---

## Success Criteria

- 100% of specification contracts are validated automatically
- 100% of CLI commands have integration test coverage
- All agents have minimum 10 golden dataset examples
- Agent quality scores maintain > 0.85 threshold
- Regression from baseline is detected within 1 CI run
- Zero production bugs escape to users due to untested agent behaviors

---

## Acceptance Criteria

### AC-1: Schema Validation
- GIVEN a memory-bank.yaml file
- WHEN schema validation runs
- THEN all required fields are validated against JSON Schema

### AC-2: CLI Testing
- GIVEN an installed specsmd instance
- WHEN BATS tests execute slash commands
- THEN commands produce expected file system state

### AC-3: Agent Mock Testing
- GIVEN a mocked LLM response fixture
- WHEN agent tests run in CI
- THEN tests are deterministic and reproducible

### AC-4: Golden Dataset Evaluation
- GIVEN a golden dataset with 10+ examples per agent
- WHEN evaluation runs against current prompts
- THEN quality scores are compared to baseline with threshold checks

### AC-5: Regression Detection
- GIVEN a baseline quality score of 0.90
- WHEN prompt changes cause score to drop to 0.82
- THEN CI pipeline fails and alerts are triggered

### AC-6: E2E Workflow
- GIVEN a pre-seeded Memory Bank state
- WHEN full AI-DLC workflow executes
- THEN all phase transitions produce valid artifacts
