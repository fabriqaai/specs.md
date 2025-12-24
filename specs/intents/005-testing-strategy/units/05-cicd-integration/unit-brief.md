# Unit Brief: CI/CD Integration

## Overview

Pipeline automation for test execution and quality gate enforcement. This unit orchestrates all testing layers and ensures quality standards are met before code reaches production.

**See**: `specs/research/test_strategy/testing-strategy.md` for CI/CD workflows, frequency, and triggers.

---

## Scope

### In Scope
- GitHub Actions workflow configuration
- Tiered test execution (PR, main, nightly, release)
- Quality gate enforcement
- Human approval gates
- Test result reporting
- Dashboard and metrics integration

### Out of Scope
- Test implementation (handled by other testing units)
- Golden dataset curation (handled by Golden Dataset Management unit)
- Evaluation logic (handled by Agent Behavior Evaluation unit)

---

## Technical Context

### Entry Points
- PR opened → Tier 1 tests
- Merge to main → Tier 2 tests
- Scheduled (2 AM) → Tier 3 tests
- Release tag → Tier 4 tests

### Dependencies
- GitHub Actions
- Test runners (Vitest, BATS)
- **Promptfoo** (evaluation framework)
- **OpenRouter Free Tier** (LLM-as-judge)
- Slack/Discord webhooks (for alerts)

**Cost**: $0 using OpenRouter free tier models.

### Outputs
- Test results in PR comments
- Quality dashboards
- Release gates
- Alert notifications

---

## Components

### 1. Tiered Pipeline Structure

**Purpose**: Optimize test execution time vs. coverage tradeoffs

**Tiers**:

| Tier | Trigger | Tests | Duration | Blocking |
|------|---------|-------|----------|----------|
| 1 | Every PR | Schema, CLI, Snapshots | ~2 min | Yes |
| 2 | Merge to main | + Quick agent eval | ~5 min | Yes |
| 3 | Nightly | Full golden dataset | ~30 min | Alert only |
| 4 | Release | Full suite + human review | ~1 hour | Yes |

### 2. Workflow Files

**Location**: `.github/workflows/`

**Tier 1: PR Tests** (`.github/workflows/pr-tests.yml`):
```yaml
name: PR Tests (Tier 1)

on:
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  schema-validation:
    name: Schema Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run schema validation
        run: npm run test:schema

      - name: Run markdown linting
        run: npm run lint:md

  cli-tests:
    name: CLI Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install BATS
        run: npm install -g bats

      - name: Run BATS tests
        run: npm run test:integration

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  snapshot-tests:
    name: Snapshot Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run snapshot tests
        run: npm run test:snapshots

  summary:
    name: PR Check Summary
    needs: [schema-validation, cli-tests, unit-tests, snapshot-tests]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Check results
        run: |
          if [[ "${{ needs.schema-validation.result }}" != "success" ]] || \
             [[ "${{ needs.cli-tests.result }}" != "success" ]] || \
             [[ "${{ needs.unit-tests.result }}" != "success" ]] || \
             [[ "${{ needs.snapshot-tests.result }}" != "success" ]]; then
            echo "One or more tests failed"
            exit 1
          fi
          echo "All tests passed!"
```

**Tier 2: Main Branch Tests** (`.github/workflows/main-tests.yml`):
```yaml
name: Main Branch Tests (Tier 2)

on:
  push:
    branches: [main]

jobs:
  tier-1-tests:
    uses: ./.github/workflows/pr-tests.yml

  agent-evaluation:
    name: Quick Agent Evaluation
    needs: tier-1-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run quick agent evaluation
        run: npm run eval:quick
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Check regression threshold
        run: npm run eval:regression-check

      - name: Upload evaluation results
        uses: actions/upload-artifact@v4
        with:
          name: evaluation-results
          path: __tests__/evaluation/regression/reports/latest.json

  notify-on-failure:
    name: Notify on Failure
    needs: [tier-1-tests, agent-evaluation]
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Main branch tests failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "⚠️ *Main branch tests failed*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Tier 3: Nightly Evaluation** (`.github/workflows/nightly-eval.yml`):
```yaml
name: Nightly Evaluation (Tier 3)

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  full-evaluation:
    name: Full Golden Dataset Evaluation
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run full golden dataset evaluation
        run: npm run eval:full
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Generate evaluation report
        run: npm run eval:report

      - name: Check regression from baseline
        id: regression
        run: |
          result=$(npm run eval:regression-check --silent)
          echo "regression=$result" >> $GITHUB_OUTPUT

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: nightly-evaluation-${{ github.run_number }}
          path: |
            __tests__/evaluation/regression/reports/latest.json
            __tests__/evaluation/regression/reports/dashboard.html
          retention-days: 30

      - name: Alert on regression
        if: steps.regression.outputs.regression == 'true'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Agent quality regression detected in nightly evaluation",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "📉 *Quality Regression Detected*\nNightly evaluation found quality scores below baseline.\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Report>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Tier 4: Release Tests** (`.github/workflows/release-tests.yml`):
```yaml
name: Release Tests (Tier 4)

on:
  push:
    tags:
      - 'v*'

jobs:
  full-test-suite:
    name: Full Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run all deterministic tests
        run: npm run test:all

      - name: Run full agent evaluation
        run: npm run eval:full
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Strict regression check
        run: npm run eval:regression-check -- --strict

      - name: Generate release report
        run: npm run eval:release-report

      - name: Upload release artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-evaluation-${{ github.ref_name }}
          path: __tests__/evaluation/regression/reports/

  human-approval:
    name: Human Approval Gate
    needs: full-test-suite
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Approval required
        run: echo "Waiting for human approval to proceed with release"

  publish:
    name: Publish to npm
    needs: human-approval
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3. Quality Gates

**Purpose**: Enforce minimum quality standards

**Configuration** (`quality-gates.yaml`):
```yaml
# Quality gate thresholds
gates:
  schema_validation:
    threshold: 100%  # All schemas must pass
    blocking: true

  cli_tests:
    threshold: 100%  # All CLI tests must pass
    blocking: true

  unit_test_coverage:
    threshold: 80%
    blocking: true

  agent_quality_score:
    minimum: 0.80
    blocking: true  # For Tier 2+

  regression_from_baseline:
    maximum: 5%  # Alert at 5% drop
    blocking_at: 10%  # Block at 10% drop

  semantic_similarity:
    minimum: 0.85
    blocking: false  # Alert only

metrics_to_track:
  - test_execution_time
  - coverage_percentage
  - agent_quality_scores
  - regression_delta
  - flaky_test_rate
```

### 4. Reporting

**Purpose**: Provide visibility into test results

**PR Comments**:
```typescript
// Generate PR comment with test summary
async function generatePRComment(results: TestResults): string {
  return `
## Test Results Summary

| Category | Status | Details |
|----------|--------|---------|
| Schema Validation | ${results.schema.passed ? '✅' : '❌'} | ${results.schema.summary} |
| CLI Tests | ${results.cli.passed ? '✅' : '❌'} | ${results.cli.summary} |
| Unit Tests | ${results.unit.passed ? '✅' : '❌'} | Coverage: ${results.unit.coverage}% |
| Snapshots | ${results.snapshots.passed ? '✅' : '❌'} | ${results.snapshots.summary} |

${results.allPassed ? '✅ All checks passed!' : '❌ Some checks failed. See details above.'}
`;
}
```

**Dashboard** (`eval:report` generates):
- Quality scores over time chart
- Per-agent score breakdown
- Regression history
- Coverage gaps

### 5. Human Approval Gates

**Purpose**: Require human review for critical transitions

**Environments** (`.github/environments/`):
- `staging`: Auto-deploy, no approval required
- `production`: Requires manual approval

**Implementation**:
```yaml
# In workflow
human-approval:
  runs-on: ubuntu-latest
  environment: production  # Triggers approval requirement
  steps:
    - name: Waiting for approval
      run: echo "Deployment approved"
```

---

## Implementation Notes

### Parallelization Strategy

- Tier 1 tests run in parallel
- Agent evaluations can run in parallel per agent
- Golden dataset tests are batched to manage API costs

### Caching Strategy

```yaml
# Cache node_modules
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Cache evaluation embeddings
- uses: actions/cache@v4
  with:
    path: __tests__/evaluation/.cache
    key: embeddings-${{ hashFiles('__tests__/evaluation/golden-datasets/**') }}
```

### Cost Management

- **$0 total cost** using OpenRouter free tier models
- Use `x-ai/grok-4.1-fast:free` for all evaluations (2M context)
- Use `qwen/qwen3-coder:free` for code-specialized assertions
- Cache embeddings to avoid recomputation

### Alert Channels

- **Slack**: Critical failures, regressions
- **Email**: Daily digest of nightly results
- **GitHub Issues**: Auto-create issues for persistent failures

---

## Acceptance Criteria

### AC-1: Tier 1 Execution
- GIVEN a PR is opened
- WHEN CI triggers
- THEN schema, CLI, unit, and snapshot tests run
- AND results are reported in PR comments
- AND PR is blocked on failure

### AC-2: Tier 2 Execution
- GIVEN a merge to main
- WHEN CI triggers
- THEN Tier 1 + quick agent eval runs
- AND regression check compares to baseline
- AND team is alerted on failure

### AC-3: Tier 3 Execution
- GIVEN 2 AM UTC
- WHEN nightly cron triggers
- THEN full golden dataset evaluation runs
- AND report is generated and archived
- AND alerts are sent on regression

### AC-4: Tier 4 Execution
- GIVEN a release tag is pushed
- WHEN CI triggers
- THEN full suite runs with strict thresholds
- AND human approval is required
- AND publish only proceeds after approval

### AC-5: Quality Gate Enforcement
- GIVEN quality gate thresholds
- WHEN tests complete
- THEN scores are compared to thresholds
- AND blocking gates prevent merge/release
- AND non-blocking gates generate alerts
