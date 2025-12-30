# Skill: Setup Monitoring

---

## Progress Display

Show at start of this skill:

```text
### Operations Progress
- [x] Build approval
- [x] Staging deploy
- [x] Production deploy
- [ ] Monitoring setup  ← current
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 4 | Monitoring setup approval | User confirmation |

---

## Goal

Configure observability (metrics, logging, alerting) for the unit and document operational runbooks.

---

## Input

- **Required**: `--unit` - The unit to monitor
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--env` - Specific environment (default: all)

---

## Process

### 1. Identify Key Metrics

Implement RED method (Rate, Errors, Duration):

- **Rate**: Requests/sec → Traffic patterns
- **Errors**: Error rate, error types → Health indicator
- **Duration**: Latency percentiles → Performance
- **Saturation**: CPU, Memory, Connections → Capacity

### 2. Define SLIs/SLOs

Service Level Indicators and Objectives:

- **Availability**: 99.9% (measured by uptime)
- **Latency**: p95 < 200ms (measured by response time)
- **Error Rate**: < 0.1% (measured by 5xx responses)
- **Throughput**: > 1000 req/s (measured by requests per second)

### 3. Configure Alerting

Set up alerts for SLO violations:

- **High Error Rate**: > 1% for 5min → Critical → Page on-call
- **High Latency**: p95 > 500ms for 10min → Warning → Investigate
- **Service Down**: Health check failing → Critical → Page on-call
- **Resource Exhaustion**: CPU/Memory > 90% → Warning → Scale up

### 4. Setup Logging

Configure structured logging:

```markdown
### Log Configuration

**Format**: JSON structured logs
**Fields**:
- timestamp
- level
- service
- trace_id
- message
- context

**Aggregation**: {log service}
**Retention**: {days}
```

### 5. Create Dashboards

Dashboard layout recommendation:

```markdown
### Dashboard Sections

1. **Overview Panel**
   - Request rate
   - Error rate
   - p50/p95/p99 latency
   - Active instances

2. **Errors Panel**
   - Error breakdown by type
   - Error rate trend
   - Recent error logs

3. **Performance Panel**
   - Latency distribution
   - Throughput trend
   - Slow endpoints

4. **Resources Panel**
   - CPU usage
   - Memory usage
   - Connection pools
```

### 6. Document Runbooks

Create operational runbooks:

```markdown
### Runbook: High Error Rate

**Trigger**: Error rate > 1% for 5 minutes

**Steps**:
1. Check recent deployments
2. Review error logs for patterns
3. Check external dependencies
4. If deployment-related: rollback
5. If external: check status pages

**Escalation**: If unresolved in 15 min, escalate to {team}
```

### 7. Document Configuration

Create/update `deployment/monitoring.md`:

```markdown
---
unit: {UUU}-{unit-name}
configured: {timestamp}
---

## Monitoring Configuration: {unit-name}

### Dashboards

- **Overview**: {url} - General health
- **Errors**: {url} - Error analysis
- **Performance**: {url} - Latency tracking

### Alerts

- **High Error Rate**: > 1% → PagerDuty
- **High Latency**: p95 > 500ms → Slack
- **Service Down**: Health failing → PagerDuty

### SLOs

- **Availability**: 99.9% (30-day window)
- **Latency (p95)**: < 200ms (30-day window)

### Logs

- **Location**: {log aggregator URL}
- **Query**: `service="{unit}"`
- **Retention**: {days}

### Runbooks

- **High Error Rate**: `runbook/high-error-rate.md`
- **Performance Degradation**: `runbook/performance.md`
- **Service Recovery**: `runbook/recovery.md`
```

---

## Output

```markdown
## Monitoring Configured: {unit-name}

### Status: ✅ COMPLETE

### Observability Stack

- ✅ **Metrics**: Configured at {metrics-url}
- ✅ **Logging**: Configured at {logs-url}
- ✅ **Alerting**: Configured at {alerts-url}
- ✅ **Dashboards**: Created at {dashboard-url}

### Alert Channels

- **Critical**: PagerDuty
- **Warning**: Slack
- **Info**: Email

### SLOs Defined

- **Availability**: 99.9%
- **Latency (p95)**: < 200ms
- **Error Rate**: < 0.1%

### Documentation Created
- `{unit-path}/deployment/monitoring.md`

### Operations Complete
✅ Unit `{unit-name}` is now fully operational with monitoring.

### Actions

1 - **adjust**: Fine-tune alert thresholds
2 - **runbook**: Create additional runbooks
3 - **menu**: Return to operations menu

### Suggested Next Step
→ **menu** - Monitor for 24-48 hours, then return for adjustments

**Type a number or press Enter for suggested action.**
```

---

## Monitoring Setup Confirmation

**Checkpoint 4**: Ask user to confirm monitoring setup:

```text
Ready to configure monitoring?

This will set up:
1. Dashboards (Overview, Errors, Performance)
2. Alerts (Error rate, Latency, Health)
3. SLOs (Availability, Latency targets)
4. Runbooks (Incident response)

Proceed with monitoring setup?
1 - Yes, configure monitoring
2 - Skip (not recommended for production)
```

**Wait for user response.**

---

## Transition

After monitoring approved and completed:

- → **Operations Complete** - unit is fully deployed and monitored

---

## Test Contract

```yaml
input: Unit name, environment
output: Dashboards, alerts, SLOs, runbooks, monitoring.md
checkpoints: 1
  - Checkpoint 4: Monitoring setup approved by user
```
