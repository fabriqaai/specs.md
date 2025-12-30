---
unit: {UUU}-{unit-name}
bolt: {BBB}-{unit-name}
stage: test
status: complete
updated: {YYYY-MM-DDTHH:MM:SSZ}
---

# Test Report - {Unit Name}

## Test Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit | {n} | {n} | {n} | {n}% |
| Integration | {n} | {n} | {n} | {n}% |
| Security | {n} | {n} | {n} | - |
| Performance | {n} | {n} | {n} | - |
| **Total** | {n} | {n} | {n} | {n}% |

## Acceptance Criteria Validation

| Story | Criteria | Status |
|-------|----------|--------|
| {story-id} | {criteria} | ✅/❌ |

## Unit Tests

{Unit test results and notable tests}

## Integration Tests

{Integration test results}

## Security Tests

{Security test results - authentication, authorization, injection, etc.}

## Performance Tests

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Response Time (p95) | {target} | {actual} | ✅/❌ |
| Throughput | {target} | {actual} | ✅/❌ |

## Coverage Report

{Coverage details by module/layer}

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| {issue} | {High/Medium/Low} | {Fixed/Open} |

## Ready for Operations

- [ ] All acceptance criteria met
- [ ] Code coverage > 80%
- [ ] No critical/high severity issues open
- [ ] Performance targets met
- [ ] Security tests passing
