# Promptfoo Tutorial: LLM Testing for AI-Native Engineers

A comprehensive guide to Promptfoo - the open-source tool for evaluating and testing LLM outputs.

---

## What is Promptfoo?

Promptfoo is an open-source CLI and library for **testing and evaluating LLM outputs**. Think of it as "Jest for LLMs" - it lets you write test cases for your prompts and automatically evaluate whether outputs meet your quality standards.

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROMPTFOO                                │
│                                                                  │
│   Prompts + Test Cases  →  LLM Provider  →  Assertions  →  Pass/Fail │
│                                                                  │
│   "Does my prompt produce good outputs consistently?"            │
└─────────────────────────────────────────────────────────────────┘
```

**GitHub**: https://github.com/promptfoo/promptfoo
**Docs**: https://promptfoo.dev/docs

---

## The Problem Promptfoo Solves

### The LLM Testing Challenge

Traditional software testing relies on **determinism**:
- Input X always produces Output Y
- You can assert `expect(add(2,2)).toBe(4)`

LLMs are **non-deterministic**:
- Same prompt can produce different outputs
- "Good" vs "bad" is subjective
- Outputs are natural language, not structured data

### Without Promptfoo

```python
# Manual testing - tedious and inconsistent
def test_prompt():
    output = llm.generate("Summarize this article...")

    # How do you test this?
    assert "summary" in output.lower()  # Fragile
    assert len(output) < 500            # Arbitrary
    # ... manual review for quality?
```

**Problems**:
- No systematic way to test prompts
- Can't catch regressions when prompts change
- No comparison between different models
- Manual quality review doesn't scale

### With Promptfoo

```yaml
# promptfoo.yaml - Declarative, systematic testing
prompts:
  - "Summarize this article: {{article}}"

providers:
  - openai:gpt-4o-mini
  - openrouter:meta-llama/llama-3.1-8b-instruct:free

tests:
  - vars:
      article: "Long article text..."
    assert:
      - type: contains
        value: "key point"
      - type: llm-rubric
        value: "Is this a coherent summary under 200 words?"
      - type: javascript
        value: output.length < 1000
```

**Benefits**:
- Systematic, repeatable testing
- Compare multiple models side-by-side
- LLM-as-judge for quality evaluation
- CI/CD integration
- Regression detection

---

## Core Concepts

### 1. Prompts

Templates with variables that get filled in during testing:

```yaml
prompts:
  # Simple string
  - "Translate to French: {{text}}"

  # File reference
  - file://prompts/summarize.txt

  # Chat format
  - role: system
    content: "You are a helpful assistant"
  - role: user
    content: "{{user_input}}"
```

### 2. Providers

The LLM services that will execute your prompts:

```yaml
providers:
  # OpenAI
  - openai:gpt-4o
  - openai:gpt-4o-mini

  # OpenRouter (includes free models!)
  - openrouter:meta-llama/llama-3.1-8b-instruct:free
  - openrouter:google/gemma-2-9b-it:free
  - openrouter:anthropic/claude-sonnet-4-20250514

  # Anthropic
  - anthropic:claude-sonnet-4-20250514

  # Azure OpenAI
  - azureopenai:my-deployment

  # Custom HTTP endpoint
  - id: my-api
    config:
      url: https://my-api.com/generate
```

### 3. Tests

Test cases with variables and assertions:

```yaml
tests:
  - description: "Basic translation test"
    vars:
      text: "Hello, world!"
    assert:
      - type: contains
        value: "Bonjour"

  - description: "Complex test with multiple assertions"
    vars:
      text: "The quick brown fox"
    assert:
      - type: contains
        value: "renard"           # French for fox
      - type: not-contains
        value: "ERROR"
      - type: llm-rubric
        value: "Is this grammatically correct French?"
```

### 4. Assertions

Different ways to validate outputs:

```yaml
assert:
  # Exact/partial string matching
  - type: equals
    value: "exact match"
  - type: contains
    value: "partial"
  - type: not-contains
    value: "forbidden word"

  # Regex
  - type: regex
    value: "\\d{4}-\\d{2}-\\d{2}"  # Date pattern

  # JSON validation
  - type: is-json
  - type: contains-json
    value:
      key: "expected_value"

  # Length constraints
  - type: javascript
    value: output.length < 500

  # Cost constraints
  - type: cost
    threshold: 0.01  # Max $0.01 per call

  # Latency
  - type: latency
    threshold: 2000  # Max 2 seconds

  # LLM-as-Judge (most powerful!)
  - type: llm-rubric
    value: |
      Evaluate if this output:
      1. Is professional in tone
      2. Addresses the question directly
      3. Provides actionable advice
      Score PASS if all criteria met.

  # Model-graded with custom provider
  - type: llm-rubric
    provider: openrouter:meta-llama/llama-3.1-8b-instruct:free
    value: "Is this response helpful?"

  # Semantic similarity
  - type: similar
    value: "The expected output content"
    threshold: 0.8
```

---

## Installation & Setup

### Install Promptfoo

```bash
# npm (recommended)
npm install -g promptfoo

# Or use npx without installing
npx promptfoo@latest init
```

### Initialize a Project

```bash
# Create promptfoo.yaml in current directory
promptfoo init
```

### Set API Keys

```bash
# OpenRouter (recommended - has free models)
export OPENROUTER_API_KEY=sk-or-...

# OpenAI (if using)
export OPENAI_API_KEY=sk-...

# Anthropic (if using)
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## Your First Test

### Step 1: Create Configuration

```yaml
# promptfoo.yaml
description: "My first prompt test"

prompts:
  - "You are a helpful assistant. Answer this question: {{question}}"

providers:
  - openrouter:meta-llama/llama-3.1-8b-instruct:free

tests:
  - vars:
      question: "What is 2 + 2?"
    assert:
      - type: contains
        value: "4"

  - vars:
      question: "What is the capital of France?"
    assert:
      - type: contains
        value: "Paris"
```

### Step 2: Run Tests

```bash
promptfoo eval
```

### Step 3: View Results

```bash
# Terminal output
promptfoo eval

# Web UI (recommended)
promptfoo view
```

---

## Practical Examples

### Example 1: Testing Agent Output Quality

For specsmd agent outputs:

```yaml
# promptfoo.yaml
description: "Inception Agent Quality Tests"

prompts:
  - file://test-prompts/create-intent.txt

providers:
  - openrouter:meta-llama/llama-3.1-8b-instruct:free

tests:
  - description: "Intent has required sections"
    vars:
      feature: "user authentication with OAuth"
    assert:
      # Structure checks
      - type: contains
        value: "## Problem Statement"
      - type: contains
        value: "## Success Criteria"
      - type: contains
        value: "## Acceptance Criteria"

      # Quality check via LLM judge
      - type: llm-rubric
        value: |
          Evaluate this intent document:
          1. Is the problem statement clear and specific?
          2. Are success criteria measurable?
          3. Are acceptance criteria testable?
          Return PASS if all criteria score 7/10 or higher.

  - description: "Intent follows professional tone"
    vars:
      feature: "payment processing"
    assert:
      - type: llm-rubric
        value: "Is this written in professional, technical language without casual phrases?"
      - type: not-contains
        value: "gonna"
      - type: not-contains
        value: "stuff"
```

### Example 2: Comparing Models

```yaml
# compare-models.yaml
description: "Compare model quality for summarization"

prompts:
  - |
    Summarize this article in 3 bullet points:
    {{article}}

providers:
  # Free models
  - id: llama-free
    label: "Llama 3.1 8B (Free)"
    config:
      provider: openrouter:meta-llama/llama-3.1-8b-instruct:free

  - id: gemma-free
    label: "Gemma 2 9B (Free)"
    config:
      provider: openrouter:google/gemma-2-9b-it:free

  # Paid models for comparison
  - id: gpt4o-mini
    label: "GPT-4o Mini"
    config:
      provider: openai:gpt-4o-mini

tests:
  - vars:
      article: |
        Long article text here...
    assert:
      - type: llm-rubric
        value: "Are there exactly 3 bullet points?"
      - type: llm-rubric
        value: "Does this capture the key points of the article?"
      - type: javascript
        value: output.split('\n').filter(l => l.startsWith('-')).length === 3
```

Run with comparison view:
```bash
promptfoo eval --output comparison.html
```

### Example 3: Regression Testing

```yaml
# regression-tests.yaml
description: "Agent output regression tests"

prompts:
  - file://agents/inception-agent.md

providers:
  - openrouter:meta-llama/llama-3.1-8b-instruct:free

defaultTest:
  assert:
    # These assertions run on ALL tests
    - type: not-contains
      value: "ERROR"
    - type: javascript
      value: output.length > 100  # Minimum response length

tests:
  # Golden dataset - known good inputs/outputs
  - description: "auth-intent-001"
    vars:
      request: "Create an intent for user authentication"
    assert:
      - type: similar
        value: file://golden/auth-intent-001-expected.md
        threshold: 0.8

  - description: "payment-intent-001"
    vars:
      request: "Create an intent for payment processing"
    assert:
      - type: similar
        value: file://golden/payment-intent-001-expected.md
        threshold: 0.8
```

### Example 4: Using Variables from Files

```yaml
# promptfoo.yaml
prompts:
  - file://prompts/analyze.txt

providers:
  - openrouter:meta-llama/llama-3.1-8b-instruct:free

tests:
  # Load test cases from CSV
  - vars: file://test-data/inputs.csv

  # Or from JSON
  - vars: file://test-data/inputs.json
```

`test-data/inputs.csv`:
```csv
input,expected_contains
"What is Python?","programming language"
"Explain REST APIs","HTTP"
```

---

## LLM-as-Judge Deep Dive

The most powerful feature for testing AI agents.

### How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                        LLM-as-Judge Flow                         │
│                                                                  │
│  Test Case → Agent Under Test → Output → Judge LLM → Pass/Fail  │
│                                                                  │
│  "Create intent"  →  GPT-4  →  "# Intent..."  →  Llama Judge    │
│                                                    ↓             │
│                                              "PASS: meets        │
│                                               all criteria"      │
└──────────────────────────────────────────────────────────────────┘
```

### Basic LLM-Rubric

```yaml
assert:
  - type: llm-rubric
    value: "Is this response helpful and accurate?"
```

### Detailed Rubric

```yaml
assert:
  - type: llm-rubric
    value: |
      Evaluate this agent output on the following criteria:

      1. COMPLETENESS (0-10): Does it address all parts of the request?
      2. ACCURACY (0-10): Is the information correct?
      3. CLARITY (0-10): Is it well-structured and easy to understand?
      4. ACTIONABILITY (0-10): Can the user take action based on this?

      Calculate average score. Return PASS if average >= 7, FAIL otherwise.

      Format your response as:
      COMPLETENESS: X/10 - reasoning
      ACCURACY: X/10 - reasoning
      CLARITY: X/10 - reasoning
      ACTIONABILITY: X/10 - reasoning
      AVERAGE: X/10
      RESULT: PASS/FAIL
```

### Custom Judge Provider

Use a different (cheaper/free) model as judge:

```yaml
assert:
  - type: llm-rubric
    provider: openrouter:meta-llama/llama-3.1-8b-instruct:free
    value: "Is this response professional?"
```

### Model-Graded Closedqa

For factual correctness:

```yaml
assert:
  - type: model-graded-closedqa
    value: "The capital of France is Paris"
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/prompt-tests.yml
name: Prompt Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install promptfoo
        run: npm install -g promptfoo

      - name: Run prompt tests
        run: promptfoo eval --ci
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: promptfoo-results
          path: promptfoo-output.json
```

### Exit Codes

- `0` - All tests passed
- `1` - Some tests failed
- `2` - Configuration error

### JSON Output for CI

```bash
promptfoo eval --output results.json --ci
```

---

## Comparison with Alternatives

### Promptfoo vs DeepEval

| Feature | Promptfoo | DeepEval |
|---------|-----------|----------|
| **Language** | TypeScript/CLI | Python |
| **Setup** | YAML config | Python code |
| **LLM-as-Judge** | Built-in | Built-in |
| **Free Models** | Via OpenRouter | Limited |
| **Web UI** | Yes (local) | Yes (cloud) |
| **CI Integration** | Excellent | Good |
| **Learning Curve** | Low | Medium |
| **Best For** | Quick setup, YAML lovers | Python projects, custom metrics |

**Choose Promptfoo if**: You want quick setup, YAML-based config, and don't need Python.

**Choose DeepEval if**: You're in a Python ecosystem and need custom evaluation metrics.

### Promptfoo vs LangSmith

| Feature | Promptfoo | LangSmith |
|---------|-----------|-----------|
| **Type** | Testing tool | Observability platform |
| **Pricing** | Free/OSS | Freemium |
| **Focus** | Pre-deployment testing | Production monitoring |
| **Self-hosted** | Yes | Limited |
| **Best For** | CI/CD testing | Production tracing |

**Use both**: Promptfoo for testing, LangSmith for production monitoring.

### Promptfoo vs Manual Testing

| Aspect | Manual | Promptfoo |
|--------|--------|-----------|
| **Time per test** | 2-5 min | Seconds |
| **Consistency** | Varies by reviewer | 100% consistent |
| **Scale** | 10-20 tests/hour | 1000s of tests |
| **Regression** | Easy to miss | Automatic detection |
| **Cost** | Human time | API calls only |

---

## Best Practices

### 1. Start Simple

```yaml
# Don't over-engineer initially
tests:
  - vars:
      input: "test"
    assert:
      - type: contains
        value: "expected"
```

### 2. Use Free Models for CI

```yaml
providers:
  - openrouter:meta-llama/llama-3.1-8b-instruct:free  # $0
```

### 3. Layer Your Assertions

```yaml
assert:
  # Fast, cheap checks first
  - type: not-contains
    value: "ERROR"
  - type: javascript
    value: output.length > 50

  # Expensive LLM checks last
  - type: llm-rubric
    value: "Is this high quality?"
```

### 4. Build Golden Datasets Gradually

```bash
# Save good outputs as golden examples
promptfoo eval --output golden/
```

### 5. Use Variables for Reusability

```yaml
# promptfoo.yaml
env:
  JUDGE_MODEL: openrouter:meta-llama/llama-3.1-8b-instruct:free

defaultTest:
  assert:
    - type: llm-rubric
      provider: ${JUDGE_MODEL}
      value: "Basic quality check"
```

---

## Troubleshooting

### Common Issues

**"No tests found"**
```bash
# Ensure promptfoo.yaml exists in current directory
ls promptfoo.yaml
```

**"API key not found"**
```bash
# Set environment variable
export OPENROUTER_API_KEY=sk-or-...
```

**"Rate limited"**
```yaml
# Add delay between tests
providers:
  - id: my-provider
    delay: 1000  # 1 second between calls
```

**"Output too long"**
```yaml
providers:
  - openai:gpt-4o
    config:
      max_tokens: 500
```

---

## Quick Reference

### CLI Commands

```bash
# Initialize new config
promptfoo init

# Run evaluation
promptfoo eval

# Run with specific config
promptfoo eval -c my-config.yaml

# View results in web UI
promptfoo view

# Output to file
promptfoo eval --output results.json

# CI mode (exit code based on pass/fail)
promptfoo eval --ci

# Compare two configs
promptfoo eval -c config1.yaml -c config2.yaml

# Cache results (faster re-runs)
promptfoo eval --cache
```

### Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-...     # OpenRouter
OPENAI_API_KEY=sk-...            # OpenAI
ANTHROPIC_API_KEY=sk-ant-...     # Anthropic
PROMPTFOO_CACHE_ENABLED=true     # Enable caching
```

---

## Next Steps

1. **Install**: `npm install -g promptfoo`
2. **Init**: `promptfoo init`
3. **Write first test**: Edit `promptfoo.yaml`
4. **Run**: `promptfoo eval`
5. **View**: `promptfoo view`
6. **Integrate**: Add to CI/CD

---

## References

- [Promptfoo Documentation](https://promptfoo.dev/docs)
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)
- [OpenRouter Models](https://openrouter.ai/models)
- [LLM-as-Judge Research](https://arxiv.org/abs/2306.05685)

---

*Document created: 2025-12-10*
*Status: Tutorial / Reference*
