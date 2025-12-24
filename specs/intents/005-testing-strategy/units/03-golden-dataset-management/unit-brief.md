# Unit Brief: Golden Dataset Management

## Overview

Curated test cases with known-good outputs for regression testing. This unit manages the collection, versioning, and baseline tracking of reference examples used to evaluate agent quality over time.

**See**: `specs/research/test_strategy/promptfoo-specsmd-tutorial.md` for detailed golden dataset guide and test fixtures.

---

## Scope

### In Scope
- Curating input/output examples per agent
- Tracking baseline quality scores
- Detecting regressions from baseline
- Versioning golden datasets with code
- Generating evaluation reports

### Out of Scope
- Evaluation logic (handled by Agent Behavior Evaluation unit)
- LLM-as-judge implementation (handled by Agent Behavior Evaluation unit)
- CI/CD pipeline configuration (handled by CI/CD Integration unit)

---

## Technical Context

### Entry Points
- `npm run golden:add -- --agent=inception` - Add new golden example
- `npm run golden:update-baseline` - Update baseline scores
- `npm run golden:report` - Generate coverage report

### Dependencies
- File system for dataset storage
- YAML parser for rubric files
- Git for versioning
- Evaluation framework (via Agent Behavior Evaluation unit)

### Outputs
- Golden dataset files (inputs/outputs)
- Baseline score files
- Coverage reports
- Regression alerts

---

## Components

### 1. Dataset Structure

**Purpose**: Organized storage of golden examples

**Location**: `__tests__/evaluation/golden-datasets/`

**Structure**:
```
__tests__/evaluation/golden-datasets/
├── README.md                    # Dataset documentation
├── metadata.yaml                # Dataset versioning info
│
├── inception/
│   ├── metadata.yaml            # Agent-specific metadata
│   ├── inputs/
│   │   ├── 001-simple-feature.txt
│   │   ├── 002-complex-system.txt
│   │   ├── 003-refactoring-task.txt
│   │   ├── 004-bugfix-request.txt
│   │   ├── 005-api-integration.txt
│   │   ├── 006-database-migration.txt
│   │   ├── 007-performance-optimization.txt
│   │   ├── 008-security-feature.txt
│   │   ├── 009-ui-redesign.txt
│   │   └── 010-microservice-extraction.txt
│   └── outputs/
│       ├── 001-simple-feature-intent.md
│       ├── 002-complex-system-intent.md
│       └── ... (matching outputs)
│
├── construction/
│   ├── metadata.yaml
│   ├── inputs/
│   │   ├── 001-ddd-bolt-plan.txt
│   │   ├── 002-tdd-bolt-plan.txt
│   │   ├── 003-bdd-bolt-plan.txt
│   │   ├── 004-spike-bolt.txt
│   │   ├── 005-multi-story-bolt.txt
│   │   ├── 006-stage-execution-domain.txt
│   │   ├── 007-stage-execution-implementation.txt
│   │   ├── 008-bolt-completion.txt
│   │   ├── 009-bolt-replanning.txt
│   │   └── 010-cross-unit-dependency.txt
│   └── outputs/
│       └── ... (matching outputs)
│
├── operations/
│   ├── metadata.yaml
│   ├── inputs/
│   │   ├── 001-build-artifact.txt
│   │   ├── 002-deploy-staging.txt
│   │   ├── 003-deploy-production.txt
│   │   ├── 004-verify-deployment.txt
│   │   └── 005-monitoring-setup.txt
│   └── outputs/
│       └── ... (matching outputs)
│
└── master/
    ├── metadata.yaml
    ├── inputs/
    │   ├── 001-route-to-inception.txt
    │   ├── 002-route-to-construction.txt
    │   ├── 003-route-to-operations.txt
    │   ├── 004-project-init-fresh.txt
    │   ├── 005-project-init-existing.txt
    │   ├── 006-explain-aidlc.txt
    │   ├── 007-answer-question-phase.txt
    │   ├── 008-answer-question-process.txt
    │   ├── 009-analyze-context-empty.txt
    │   ├── 010-analyze-context-inception.txt
    │   ├── 011-analyze-context-construction.txt
    │   ├── 012-analyze-context-operations.txt
    │   ├── 013-ambiguous-request.txt
    │   ├── 014-multi-intent-request.txt
    │   ├── 015-invalid-request.txt
    │   ├── 016-help-request.txt
    │   ├── 017-status-request.txt
    │   ├── 018-progress-request.txt
    │   ├── 019-blocker-request.txt
    │   └── 020-recommendation-request.txt
    └── outputs/
        └── ... (matching outputs)
```

### 2. Metadata Schema

**Purpose**: Track dataset versioning and quality metrics

**Location**: `__tests__/evaluation/golden-datasets/metadata.yaml`

**Schema**:
```yaml
# metadata.yaml
version: 1.0.0
created: 2025-01-15
last_updated: 2025-03-20
maintainer: team@specs.md

statistics:
  total_examples: 45
  by_agent:
    master: 20
    inception: 10
    construction: 10
    operations: 5

quality_thresholds:
  minimum_score: 0.80
  regression_alert: 0.05  # Alert if score drops by 5%

baselines:
  - version: 1.0.0
    date: 2025-01-15
    scores:
      master: 0.92
      inception: 0.88
      construction: 0.85
      operations: 0.90
      overall: 0.89

  - version: 1.1.0
    date: 2025-02-10
    scores:
      master: 0.94
      inception: 0.90
      construction: 0.87
      operations: 0.91
      overall: 0.91
```

**Agent Metadata**:
```yaml
# inception/metadata.yaml
agent: inception
skill_coverage:
  intent-create: 4   # Examples covering this skill
  requirements: 2
  context: 1
  units: 2
  story-create: 1

scenario_coverage:
  simple_feature: 2
  complex_system: 2
  refactoring: 1
  bugfix: 1
  api_integration: 1
  database: 1
  performance: 1
  security: 1

last_verified: 2025-03-15
verification_notes: "All examples manually reviewed and approved"
```

### 3. Baseline Management

**Purpose**: Track quality scores over time for regression detection

**Location**: `__tests__/evaluation/regression/baselines/`

**Structure**:
```
__tests__/evaluation/regression/
├── baselines/
│   ├── v1.0.0.json
│   ├── v1.1.0.json
│   └── current.json
└── reports/
    ├── 2025-03-20-nightly.json
    ├── 2025-03-21-nightly.json
    └── latest.json
```

**Baseline File Format**:
```json
{
  "version": "1.1.0",
  "timestamp": "2025-02-10T14:30:00Z",
  "commit": "abc123def",
  "scores": {
    "master": {
      "overall": 0.94,
      "by_skill": {
        "analyze-context": 0.96,
        "route-request": 0.92,
        "explain-flow": 0.95,
        "answer-question": 0.93,
        "project-init": 0.94
      }
    },
    "inception": {
      "overall": 0.90,
      "by_skill": {
        "intent-create": 0.92,
        "requirements": 0.88,
        "context": 0.91,
        "units": 0.89,
        "story-create": 0.90
      }
    },
    "construction": {
      "overall": 0.87,
      "by_skill": {
        "bolt-plan": 0.88,
        "bolt-start": 0.86,
        "bolt-status": 0.89,
        "bolt-list": 0.85
      }
    },
    "operations": {
      "overall": 0.91,
      "by_skill": {
        "build": 0.92,
        "deploy": 0.90,
        "verify": 0.91,
        "monitor": 0.91
      }
    }
  }
}
```

### 4. Regression Detection

**Purpose**: Identify quality degradation from baseline

**Implementation**:
```typescript
interface RegressionResult {
  hasRegression: boolean;
  regressions: Regression[];
  improvements: Improvement[];
  summary: string;
}

async function detectRegression(
  current: EvaluationResult,
  baseline: Baseline,
  threshold: number = 0.05
): Promise<RegressionResult> {
  const regressions: Regression[] = [];
  const improvements: Improvement[] = [];

  for (const agent of Object.keys(baseline.scores)) {
    const baselineScore = baseline.scores[agent].overall;
    const currentScore = current.scores[agent].overall;
    const delta = currentScore - baselineScore;

    if (delta < -threshold) {
      regressions.push({
        agent,
        baseline: baselineScore,
        current: currentScore,
        delta,
        severity: delta < -0.10 ? 'critical' : 'warning'
      });
    } else if (delta > threshold) {
      improvements.push({
        agent,
        baseline: baselineScore,
        current: currentScore,
        delta
      });
    }
  }

  return {
    hasRegression: regressions.length > 0,
    regressions,
    improvements,
    summary: generateSummary(regressions, improvements)
  };
}
```

### 5. Golden Example Curation

**Purpose**: Process for adding and validating golden examples

**Workflow**:
```
1. Identify coverage gap (missing skill or scenario)
        │
        ▼
2. Create input file with representative prompt
        │
        ▼
3. Generate output using current agent
        │
        ▼
4. Manual review and refinement of output
        │
        ▼
5. Peer review of input/output pair
        │
        ▼
6. Add to golden dataset
        │
        ▼
7. Update metadata.yaml
        │
        ▼
8. Re-establish baseline (optional)
```

**CLI Tool**:
```bash
# Add new golden example
npm run golden:add -- \
  --agent=inception \
  --skill=intent-create \
  --scenario=api-integration \
  --input="Create an intent for integrating with Stripe payment API"

# This will:
# 1. Generate output using current agent
# 2. Open output for manual review/editing
# 3. Save input and output to golden dataset
# 4. Update metadata.yaml
```

---

## Implementation Notes

### Coverage Requirements

| Agent | Minimum Examples | Target | Current |
|-------|-----------------|--------|---------|
| Master Agent | 20 | 50 | TBD |
| Inception Agent | 10 | 30 | TBD |
| Construction Agent | 10 | 30 | TBD |
| Operations Agent | 5 | 15 | TBD |
| **Total** | **45** | **125** | TBD |

### Scenario Categories

Each agent should have examples covering:
- **Happy Path**: Standard, expected usage
- **Edge Cases**: Boundary conditions, unusual inputs
- **Error Cases**: Invalid inputs, missing context
- **Complex Scenarios**: Multi-step, cross-agent workflows

### Quality Criteria for Golden Examples

1. **Representative**: Reflects real-world usage
2. **Diverse**: Covers different skills and scenarios
3. **Verified**: Manually reviewed and approved
4. **Documented**: Clear description of what it tests
5. **Stable**: Output represents desired quality level

### Versioning Strategy

- Golden datasets are versioned with specsmd releases
- Baselines are tagged with commit hashes
- Breaking changes to agents require new baseline
- Backward compatibility maintained for evaluation

---

## Acceptance Criteria

### AC-1: Dataset Organization
- GIVEN golden dataset structure
- WHEN dataset is accessed
- THEN inputs and outputs are paired correctly
- AND metadata reflects actual content
- AND coverage statistics are accurate

### AC-2: Baseline Tracking
- GIVEN evaluation scores over time
- WHEN baseline is updated
- THEN previous baselines are preserved
- AND new baseline reflects current scores
- AND commit hash is recorded

### AC-3: Regression Detection
- GIVEN current evaluation scores
- WHEN compared to baseline
- THEN regressions > 5% are flagged
- AND improvements > 5% are noted
- AND summary report is generated

### AC-4: Coverage Reporting
- GIVEN golden dataset
- WHEN coverage report is generated
- THEN skill coverage is shown per agent
- AND scenario coverage is shown per agent
- AND gaps are highlighted

### AC-5: Example Curation
- GIVEN new golden example submission
- WHEN curation workflow completes
- THEN input/output are validated
- AND metadata is updated
- AND baseline impact is assessed
