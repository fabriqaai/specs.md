# Skill: Verify Deployment

---

## Role

Post-deployment validation skill. Runs health checks and smoke tests.

**NO Checkpoint** - Verification is an automated check, not a decision point.

Verification happens after each deploy skill checkpoint. If verification fails, recommend rollback.

---

## Goal

Confirm that a deployment is healthy, functional, and meeting acceptance criteria before proceeding to next environment.

---

## Input

- **Required**: `--unit` - The unit to verify
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--env` - Target environment (default: last deployed)
- **Optional**: `--version` - Specific version (default: currently deployed)

---

## Process

### 1. Load Deployment Context

From `deployment/history.md`:

- Current deployed version
- Deployment timestamp
- Previous version (for comparison)

### 2. Execute Health Checks

- [ ] **Endpoint Health**: GET `/health` → 200 OK
- [ ] **Readiness**: GET `/ready` → 200 OK
- [ ] **Database**: Connection test → Connected
- [ ] **Cache**: Connection test → Connected
- [ ] **External APIs**: Connectivity check → Reachable

### 3. Run Smoke Tests

Execute critical path tests:

- [ ] **Authentication**: Login flow works (if applicable)
- [ ] **Core CRUD**: Basic operations work (required)
- [ ] **API Endpoints**: Key endpoints respond (required)
- [ ] **Error Handling**: Errors handled gracefully (required)

### 4. Check Metrics

Verify operational metrics are within bounds:

- [ ] **Response Time**: < SLA (p95 latency)
- [ ] **Error Rate**: < 1% (4xx/5xx responses)
- [ ] **CPU**: < 80% (resource utilization)
- [ ] **Memory**: < 80% (resource utilization)

### 5. Compare to Baseline

If previous version exists:

- Error rate comparison
- Latency comparison
- Resource usage comparison

### 6. Document Results

Create `deployment/verification-{version}.md`:

```markdown
---
version: {version}
environment: {env}
verified: {timestamp}
status: passed|failed
---

## Verification Report: {version}

### Health Checks

- ✅ **Endpoint**: 200 OK, 15ms
- ✅ **Database**: Connected
- ✅ **Cache**: Connected

### Smoke Tests

- ✅ **Login Flow**: 234ms
- ✅ **Create Item**: 156ms
- ✅ **API Health**: 12ms

### Metrics

- ✅ **p95 Latency**: 145ms (threshold: <200ms)
- ✅ **Error Rate**: 0.02% (threshold: <1%)

### Baseline Comparison

- **p95 Latency**: 142ms → 145ms (+2%)
- **Error Rate**: 0.01% → 0.02% (+0.01%)

### Conclusion
{passed|failed}: {summary}
```

---

## Output (Verification Passed)

```markdown
## Verification Passed: {unit-name}

### Status: ✅ VERIFIED

### Results Summary

- ✅ **Health Checks**: {n}/{n} passed
- ✅ **Smoke Tests**: {n}/{n} passed
- ✅ **Metric Checks**: {n}/{n} passed

### Key Metrics

- ✅ **Response Time (p95)**: {value}ms
- ✅ **Error Rate**: {value}%
- ✅ **Uptime**: 100%

### Environment Status

- ✅ **{env}**: `{version}` - Verified

### Documentation Created
- `{unit-path}/deployment/verification-{version}.md`

### Actions

1 - **monitor**: Setup monitoring for this unit
2 - **deploy**: Deploy to next environment
3 - **menu**: Return to operations menu

### Suggested Next Step
→ **monitor** - Setup monitoring for `{unit-name}`

**Type a number or press Enter for suggested action.**
```

---

## Output (Verification Failed)

```markdown
## Verification Failed: {unit-name}

### Status: ❌ FAILED

### Failed Checks

- ❌ **{check1}**: Expected {expected}, got {actual}
- ❌ **{check2}**: Expected {expected}, got {actual}

### Error Details
{error messages or logs}

### Impact Assessment

- **Severity**: {critical|high|medium|low}
- **Affected**: {what's broken}

### Recommended Action
⚠️ **ROLLBACK RECOMMENDED**

Previous stable version: `{prev-version}`

Rollback command:
deploy --unit="{unit}" --env="{env}" --version="{prev-version}"

### Actions

1 - **rollback**: Rollback to previous version
2 - **investigate**: Investigate root cause
3 - **menu**: Return to operations menu

### Suggested Next Step
→ **rollback** - Restore `{prev-version}` immediately

**Type a number or press Enter for suggested action.**
```

---

## Human Validation Point

On success:
> "Verification passed for `{unit}` v`{version}` in {env}. All {n} checks passed. Ready to proceed to {next-action}?"

On failure:
> "⚠️ Verification FAILED for `{unit}` v`{version}`. {n} checks failed. Recommend rollback to `{prev-version}`. Proceed with rollback?"

---

## Transition

After verification:

- → **Monitor** (`.specsmd/skills/operations/monitor.md`) - if verified and final environment
- → **Deploy** (`.specsmd/skills/operations/deploy.md`) - to next environment if verified
- → **Rollback** - if verification fails (deploy previous version)

---

## Test Contract

```yaml
input: Unit name, environment, version
output: Verification report with health checks, smoke tests, metrics
checkpoints: 0 (automated validation only)
```
