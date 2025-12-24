# Skill: Deploy to Environment

---

## Progress Display

Show at start of this skill (varies by environment):

```text
### Operations Progress
- [x] Build approval
- [ ] Staging deploy  ← current (or)
- [ ] Production deploy  ← current
- [ ] Monitoring setup
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 2 | Staging deploy approval | User confirmation |
| Checkpoint 3 | Production deploy approval | User confirmation (⚠️ affects users) |

---

## Goal

Deploy built artifacts to a target environment with progressive validation and rollback capability.

---

## Input

- **Required**: `--unit` - The unit to deploy
- **Required**: `--env` - Target environment (`dev`, `staging`, `prod`)
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--version` - Specific version (default: latest build)

---

## Process

### 1. Verify Prerequisites

- [ ] **Build exists**: Required for all environments
- [ ] **Tests passing**: Required for all environments
- [ ] **Deployed to dev**: Required for staging, prod
- [ ] **Deployed to staging**: Required for prod
- [ ] **Staging verification passed**: Required for prod

### 2. Environment Progression

```markdown
## Deployment Progression

Dev ──────► Staging ──────► Production
 │            │               │
 ▼            ▼               ▼
Fast         Validation      Real users
iteration    required        approval required
```

### 3. Pre-Deployment Checks

For the target environment:

- [ ] **Infrastructure**: Verify resources exist
- [ ] **Secrets**: Confirm secrets configured
- [ ] **Dependencies**: Check external services available
- [ ] **Current version**: Record for rollback

### 4. Execute Deployment

Based on deployment type:

- **Container** → Update container image
- **Serverless** → Deploy function
- **Static** → Sync to CDN/bucket
- **Kubernetes** → Apply manifests

### 5. Wait for Health

Monitor deployment until healthy:

- Health check endpoint responding
- No crash loops
- Readiness probes passing

### 6. Document Deployment

Append to `deployment/history.md`:

```markdown
---
version: {version}
environment: {env}
deployed: {timestamp}
deployed_by: {user}
status: success
---

## Deployment: {version} → {env}

### Details

- **Version**: `{version}`
- **Environment**: {env}
- **Timestamp**: {timestamp}
- **Duration**: {duration}
- **Previous Version**: `{prev-version}`

### Changes
{diff summary from previous version}

### Rollback Command
```text
deploy --unit="{unit}" --env="{env}" --version="{prev-version}"
```

---

## Output

```markdown
## Deployment Complete: {unit-name}

### Status

- **Version**: `{version}`
- **Environment**: {env}
- **Status**: ✅ Deployed
- **Health**: ✅ Healthy

### Deployment Details
- Started: {start-time}
- Completed: {end-time}
- Duration: {duration}

### Environment State

- ✅ **Development**: `{version}` - Active
- ✅ **Staging**: `{version}` - Active
- ⏳ **Production**: `{prev-version}` - Awaiting

### Documentation Updated
- `{unit-path}/deployment/history.md`

### Actions

1 - **verify**: Verify this deployment
2 - **deploy**: Deploy to next environment
3 - **menu**: Return to operations menu

### Suggested Next Step
→ **verify** - Verify deployment in {env}

**Type a number or press Enter for suggested action.**
```

---

## Output (Production Approval Required)

````markdown
## Production Deployment: {unit-name}

### ⚠️ PRODUCTION DEPLOYMENT APPROVAL REQUIRED

This deployment will affect real users.

### Pre-Deployment Checklist
- [x] Staging deployment successful
- [x] Staging verification passed
- [x] All tests passing
- [ ] **Human approval required**

### Deployment Plan

- **Version**: `{version}`
- **Current Production**: `{current-version}`
- **Changes**: {summary}

### Rollback Plan
If issues detected:
```text
deploy --unit="{unit}" --env="prod" --version="{current-version}"
```

### Proceed?
>
> "⚠️ This will deploy to PRODUCTION. All staging checks passed. Approve deployment? (yes/no)"
````

---

## Staging Deploy Confirmation

**Checkpoint 2**: Ask user to confirm staging deploy:

```text
Ready to deploy to staging?

Version: {version}
Environment: Staging (production-like validation)

This will update the staging environment.
1 - Yes, deploy to staging
2 - Cancel
```

**Wait for user response.**

---

## Production Deploy Confirmation

**Checkpoint 3**: Ask user to confirm production deploy (⚠️ CRITICAL):

```text
⚠️ PRODUCTION DEPLOYMENT

This affects real users.

Version: {version}
Current Production: {current-version}
All staging tests: ✅ Passed

Rollback command ready:
  deploy --unit="{unit}" --env="prod" --version="{current-version}"

Proceed with production deployment?
1 - Yes, deploy to PRODUCTION
2 - Cancel
```

**Wait for user response.**

---

## Transition

After deploy approved and completed:

- → **Verify** - verify deployment health
- → **Monitor** - setup monitoring (after production)

---

## Test Contract

```yaml
input: Unit name, version, environment
output: Deployed artifact, history.md documentation
checkpoints: 1-2
  - Checkpoint 2: Staging deploy approved (if staging)
  - Checkpoint 3: Production deploy approved (if production)
```
