# Unit Brief: Agent Behavior Evaluation

## Overview

Non-deterministic testing for LLM-driven agent outputs using multiple evaluation strategies. This unit addresses the unique challenge of testing systems where outputs vary between executions.

**See**: `specs/research/test_strategy/promptfoo-tutorial.md` for detailed Promptfoo guide.

---

## Scope

### In Scope
- Mocking LLM responses for deterministic CI runs
- LLM-as-judge evaluation with configurable rubrics
- Semantic similarity testing against golden examples
- Behavioral assertions (property checks, not exact matches)
- Test flakiness handling for non-deterministic outputs

### Out of Scope
- Schema validation (handled by Specification Contract Testing unit)
- CLI command testing (handled by CLI/Installer Testing unit)
- Golden dataset curation (handled by Golden Dataset Management unit)

---

## Technical Context

### Entry Points
- `promptfoo eval` - Run agent evaluation
- `promptfoo eval --cache` - Run with cached results (faster)
- `promptfoo view` - Open web UI to review results
- `npm run eval:agents` - Run quick agent evaluation (wrapper)
- `npm run eval:full` - Run full golden dataset evaluation

### Dependencies
- **Promptfoo** (primary evaluation framework) - Declarative YAML config
- **OpenRouter Free Tier** (LLM-as-judge provider)
  - `x-ai/grok-4.1-fast:free` - Coding agents, release validation (2M context)
  - `qwen/qwen3-coder:free` - Code-specialized evaluation
  - `meta-llama/llama-3.3-70b-instruct:free` - Reasoning
- vcrpy/responses (for LLM mocking)

**Cost**: $0 using OpenRouter free tier models.

### Outputs
- Evaluation scores per agent
- Regression reports
- Quality dashboards (via `promptfoo view`)

---

## Components

### 1. LLM Response Mocking

**Purpose**: Record and replay LLM responses for deterministic CI

**Location**: `__tests__/fixtures/mock-responses/`

**Structure**:
```
__tests__/fixtures/mock-responses/
├── inception-agent/
│   ├── intent-create-feature.json
│   ├── intent-create-bugfix.json
│   ├── requirements-elicitation.json
│   └── unit-decomposition.json
├── construction-agent/
│   ├── bolt-plan-ddd.json
│   ├── bolt-plan-tdd.json
│   └── stage-execution.json
├── operations-agent/
│   └── deployment-verification.json
└── master-agent/
    ├── routing-to-inception.json
    ├── routing-to-construction.json
    └── project-state-analysis.json
```

**Recording Strategy**:
```typescript
// Record new response
const recorder = new LLMRecorder('__tests__/fixtures/mock-responses');
const response = await agent.execute(prompt);
recorder.save('inception-agent/intent-create-feature', { prompt, response });

// Replay in tests
const replayer = new LLMReplayer('__tests__/fixtures/mock-responses');
replayer.mock('inception-agent/intent-create-feature');
const response = await agent.execute(prompt); // Uses recorded response
```

### 2. LLM-as-Judge Evaluation

**Purpose**: Use LLM to evaluate agent output quality against rubrics

**Location**: `__tests__/evaluation/rubrics/`

**Rubric Files**:
```yaml
# rubrics/intent-quality.yaml
name: Intent Quality Evaluation
description: Evaluates the quality of generated intent artifacts

criteria:
  - id: completeness
    name: Completeness
    description: Intent contains all required sections
    weight: 0.25
    prompt: |
      Evaluate if the intent contains:
      - Clear problem statement
      - Measurable success criteria
      - Defined acceptance criteria
      Score 1-5 where 5 is fully complete.

  - id: clarity
    name: Clarity
    description: Requirements are clear and unambiguous
    weight: 0.25
    prompt: |
      Evaluate if the requirements are:
      - Specific and measurable
      - Free of ambiguous language
      - Testable
      Score 1-5 where 5 is perfectly clear.

  - id: testability
    name: Testability
    description: Acceptance criteria are testable
    weight: 0.25
    prompt: |
      Evaluate if the acceptance criteria:
      - Follow GIVEN/WHEN/THEN format
      - Are specific enough to verify
      - Cover key scenarios
      Score 1-5 where 5 is fully testable.

  - id: scope_appropriateness
    name: Scope Appropriateness
    description: Scope is well-defined and reasonable
    weight: 0.25
    prompt: |
      Evaluate if the scope:
      - Is neither too broad nor too narrow
      - Has clear boundaries
      - Is achievable
      Score 1-5 where 5 is perfectly scoped.

threshold: 0.80  # Minimum passing score (weighted average)
```

**Implementation**:
```typescript
import { DeepEval, GEvalMetric } from 'deepeval';

const intentQualityMetric = new GEvalMetric({
  name: 'Intent Quality',
  criteria: loadRubric('intent-quality.yaml'),
  model: 'gpt-4-turbo'
});

async function evaluateIntentQuality(generatedIntent: string): Promise<EvalResult> {
  const result = await intentQualityMetric.evaluate(generatedIntent);
  return {
    score: result.score,
    passed: result.score >= 0.80,
    breakdown: result.criteriaScores
  };
}
```

### 3. Semantic Similarity Testing

**Purpose**: Compare outputs to reference examples using embeddings

**Location**: `__tests__/evaluation/semantic/`

**Implementation**:
```typescript
import { embed, cosineSimilarity } from './embedding-utils';

async function testSemanticSimilarity(
  generated: string,
  reference: string,
  threshold: number = 0.85
): Promise<SimilarityResult> {
  const [genEmbedding, refEmbedding] = await Promise.all([
    embed(generated),
    embed(reference)
  ]);

  const similarity = cosineSimilarity(genEmbedding, refEmbedding);

  return {
    similarity,
    passed: similarity >= threshold,
    message: similarity >= threshold
      ? 'Output semantically matches reference'
      : `Similarity ${similarity.toFixed(3)} below threshold ${threshold}`
  };
}
```

**Test Example**:
```typescript
describe('Inception Agent Semantic Similarity', () => {
  it('generates semantically similar intent for user auth feature', async () => {
    const prompt = 'Create an intent for user authentication with email and password';
    const reference = loadGoldenExample('inception/outputs/user-auth-intent.md');

    const generated = await inceptionAgent.createIntent(prompt);
    const result = await testSemanticSimilarity(generated, reference, 0.85);

    expect(result.passed).toBe(true);
  });
});
```

### 4. Behavioral Assertions

**Purpose**: Test properties of outputs, not exact content

**Location**: `__tests__/evaluation/behavioral/`

**Assertion Library**:
```typescript
// behavioral-assertions.ts

export function assertHasRequiredSections(
  content: string,
  sections: string[]
): AssertionResult {
  const missing = sections.filter(s => !content.includes(s));
  return {
    passed: missing.length === 0,
    message: missing.length === 0
      ? 'All required sections present'
      : `Missing sections: ${missing.join(', ')}`
  };
}

export function assertReasonableLength(
  content: string,
  min: number,
  max: number
): AssertionResult {
  const length = content.length;
  return {
    passed: length >= min && length <= max,
    message: length >= min && length <= max
      ? `Length ${length} within bounds`
      : `Length ${length} outside bounds [${min}, ${max}]`
  };
}

export function assertProfessionalTone(content: string): AssertionResult {
  const unprofessionalPatterns = [
    /\b(lol|omg|wtf)\b/i,
    /!{3,}/,
    /\?{3,}/
  ];
  const violations = unprofessionalPatterns.filter(p => p.test(content));
  return {
    passed: violations.length === 0,
    message: violations.length === 0
      ? 'Professional tone maintained'
      : 'Unprofessional language detected'
  };
}

export function assertContainsConcept(
  content: string,
  concept: string
): AssertionResult {
  // Use embedding similarity for concept detection
  const conceptPresent = detectConcept(content, concept);
  return {
    passed: conceptPresent,
    message: conceptPresent
      ? `Concept "${concept}" detected`
      : `Concept "${concept}" not found`
  };
}
```

**Test Example**:
```typescript
describe('Agent Output Behavioral Tests', () => {
  it('generates valid intent structure', async () => {
    const generated = await inceptionAgent.createIntent(prompt);

    expect(assertHasRequiredSections(generated, [
      '## Overview',
      '## Functional Requirements',
      '## Non-Functional Requirements',
      '## Acceptance Criteria'
    ])).toHaveProperty('passed', true);

    expect(assertReasonableLength(generated, 500, 10000))
      .toHaveProperty('passed', true);

    expect(assertProfessionalTone(generated))
      .toHaveProperty('passed', true);
  });
});
```

### 5. Flakiness Handling

**Purpose**: Manage non-deterministic test behavior

**Strategies**:

**Retry with Tolerance**:
```typescript
import { retryTest } from './test-utils';

// Run 3 times, pass if 2+ succeed
test('agent generates valid output', retryTest(async () => {
  const output = await agent.execute(prompt);
  expect(evaluateQuality(output).score).toBeGreaterThan(0.80);
}, { maxRuns: 3, minPasses: 2 }));
```

**Temperature Control**:
```typescript
// Set temperature to 0 for deterministic tests
beforeEach(() => {
  agent.setTemperature(0);
});
```

**Score Averaging**:
```typescript
async function evaluateWithAveraging(
  agent: Agent,
  prompt: string,
  runs: number = 3
): Promise<number> {
  const scores = await Promise.all(
    Array(runs).fill(null).map(() =>
      agent.execute(prompt).then(evaluateQuality)
    )
  );
  return scores.reduce((a, b) => a + b, 0) / runs;
}
```

---

## Implementation Notes

### Evaluation Framework: Promptfoo + OpenRouter

**Why Promptfoo**: Declarative YAML config, CLI-first, free model support via OpenRouter.

```yaml
# promptfoo.yaml
prompts:
  - file://prompts/inception-agent.md

providers:
  # Free models for CI/CD
  - id: openrouter:x-ai/grok-4.1-fast:free
    config:
      temperature: 0
  # Code-specialized for code quality
  - id: openrouter:qwen/qwen3-coder:free
    config:
      temperature: 0

tests:
  - description: Creates valid intent for feature request
    vars:
      input: "Add user authentication with OAuth"
    assert:
      - type: llm-rubric
        value: "Output contains problem statement, requirements, and acceptance criteria"
      - type: contains
        value: "## Acceptance Criteria"
      - type: javascript
        value: output.length > 500 && output.length < 10000
```

**Run Tests**:
```bash
# Set OpenRouter API key
export OPENROUTER_API_KEY=sk-or-...

# Run evaluation
promptfoo eval

# View results in web UI
promptfoo view
```

### Cost Management

- **$0 total cost** using OpenRouter free tier models
- Use `x-ai/grok-4.1-fast:free` for all evaluations (2M context handles full outputs)
- Use `qwen/qwen3-coder:free` for code-specialized assertions
- Cache embeddings for repeated reference comparisons
- Limit full golden dataset runs to nightly

---

## Acceptance Criteria

### AC-1: Mock Response Testing
- GIVEN recorded LLM responses
- WHEN tests run in CI
- THEN responses are replayed deterministically
- AND tests produce consistent results
- AND no external API calls are made

### AC-2: LLM-as-Judge Evaluation
- GIVEN an evaluation rubric
- WHEN agent output is evaluated
- THEN scores are computed per criterion
- AND overall score reflects weighted average
- AND threshold determines pass/fail

### AC-3: Semantic Similarity
- GIVEN a golden reference output
- WHEN generated output is compared
- THEN similarity score is computed
- AND threshold of 0.85 determines pass/fail
- AND similar meaning passes even with different words

### AC-4: Behavioral Assertions
- GIVEN behavioral assertion tests
- WHEN agent output is validated
- THEN required sections are checked
- AND length bounds are enforced
- AND tone/style is validated
- AND concepts are detected semantically
