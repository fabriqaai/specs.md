# Skill: Operations Navigator

---

## Role

Entry point for Operations Agent. Routes to appropriate skill based on state.

**NO Checkpoint** - Navigator is a routing skill, not a decision point.

---

## Progress Display

Show workflow position with checkpoint markers:

```text
### Operations Workflow (4 Checkpoints)

[Prerequisites] Construction complete?
      |
[Checkpoint 1] Build approval --> build skill
      |
[Build + Deploy to Dev]
      |
[Checkpoint 2] Staging deploy --> deploy skill
      |
[Deploy to Staging + Verify]
      |
[Checkpoint 3] Production deploy --> deploy skill
      |
[Deploy to Production + Verify]
      |
[Checkpoint 4] Monitoring setup --> monitor skill
      |
[Operations Complete]
```

---

## Goal

Present the Operations Agent's skills and guide the user through the deployment and monitoring workflow.

---

## Input

- **Required**: `--unit` - The unit to operate on
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema

---

## Process

### 1. Determine Context

Load current operations state:

**Prerequisites** (must pass before proceeding):

- **Unit exists** - Path from `schema.units` (Required)
- **All bolts complete** - Path from `schema.bolts` (Required)
- **Tests passing** - Bolt completion status (Required)

**Deployment Status** (from `deployment/` artifacts):

- Build status and version
- Deployment history per environment
- Verification status
- Monitoring status

### 2. Present Menu

Build menu dynamically using the Output sections below based on current state.

### 3. Context-Aware Suggestions

Based on deployment state:

- **No build** → Build artifacts
- **Build done, not deployed** → Deploy to dev
- **Deployed to dev, not verified** → Verify dev
- **Dev verified, not in staging** → Deploy to staging
- **Staging verified, not in prod** → Deploy to production
- **Prod deployed, not verified** → Verify production
- **Prod verified, no monitoring** → Setup monitoring
- **All complete** → Operations complete

### 4. Handle Selection

When user selects an option:

1. Acknowledge the selection
2. Load the corresponding skill file
3. Execute with current context

---

## Output (Ready for Operations)

```markdown
## Operations Agent

### Unit: `{unit-name}`
**Construction Status**: ✅ Complete ({n} bolts)
**Stories Delivered**: {n}

### Deployment Status

- [ ] Development: Not deployed
- [ ] Staging: Not deployed
- [ ] Production: Not deployed

### Quick Actions

1 - **Build artifacts**: Create deployment package (`build --unit="{unit}"`)
2 - **View build history**: See previous builds (`build --unit="{unit}" --history`)

### Workflow
Build → Dev → Verify → Staging → Verify → Prod → Verify → Monitor

### Suggested Next Step
→ **Build deployment artifacts** to start the deployment pipeline

**Type a number to continue.**
```

---

## Output (Partially Deployed)

```markdown
## Operations Agent

### Unit: `{unit-name}`
**Latest Build**: `v{version}`

### Deployment Status

- ✅ Development: `v{version}` - Deployed, Verified
- ⏳ Staging: `v{version}` - Deployed, Pending verification ← current
- ⚠️ Production: `v{prev}` - Outdated, Verified

### Quick Actions

1 - **Verify staging**: Validate deployment (`verify --unit="{unit}" --env="staging"`)
2 - **Deploy to prod**: Promote to production (`deploy --unit="{unit}" --env="prod"`)
3 - **View history**: See deployment history (`history --unit="{unit}"`)

### Suggested Next Step
→ **Verify staging deployment** before promoting to production

**Type a number to continue.**
```

---

## Output (Fully Deployed)

```markdown
## Operations Agent

### Unit: `{unit-name}`
**Status**: ✅ FULLY OPERATIONAL

### All Environments

- ✅ Development: `v{version}` - Verified, Monitored
- ✅ Staging: `v{version}` - Verified, Monitored
- ✅ Production: `v{version}` - Verified, Monitored

### Resources
- Dashboard: {dashboard-url}
- Logs: {logs-url}
- Alerts: {alerts-url}

### Available Actions

1 - **View metrics**: Open monitoring dashboard
2 - **View logs**: Open log aggregator
3 - **Rollback**: Deploy previous version
4 - **Deploy new version**: When code changes

### Unit Complete
✅ Unit `{unit-name}` is fully deployed and monitored.

**Type a number or return to Master Agent.**
```

---

## Transition

After user selection:

- → Load selected skill
- → Skill contains the Checkpoint markers
- → Execute skill process

---

## Test Contract

```yaml
input: Unit state, deployment status
output: Menu with skill options, suggested next step
checkpoints: 0 (routing only)
```
