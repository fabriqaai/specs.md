# Skill: Build Deployment Artifacts

---

## Progress Display

Show at start of this skill:

```text
### Operations Progress
- [ ] Build approval  ← current
- [ ] Staging deploy
- [ ] Production deploy
- [ ] Monitoring setup
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 1 | Build approval | User confirmation |

---

## Goal

Create deployable packages (containers, functions, bundles) for a Unit and document the build metadata.

---

## Input

- **Required**: `--unit` - The unit to build
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--version` - Explicit version tag (default: auto-generate)

---

## Process

### 1. Verify Prerequisites

Check construction completion:

- [ ] **All bolts complete**: Path from `schema.bolts` (Required)
- [ ] **Tests passing**: Last bolt test stage (Required)
- [ ] **Code exists**: Unit source directory (Required)

### 2. Detect Build Type

Analyze unit structure to determine build strategy:

- `Dockerfile` → **Container** → `docker build`
- `serverless.yml` → **Serverless** → Framework deploy
- `package.json` → **Node.js** → `npm run build`
- `Cargo.toml` → **Rust** → `cargo build --release`
- `go.mod` → **Go** → `go build`

### 3. Determine Version

Generate semantic version:

```markdown
## Version Calculation

Base: {major}.{minor}.{patch}
Commit: {short-sha}
Tag: v{version}-{commit}

Example: v1.2.0-abc123
```

### 4. Execute Build

Run appropriate build commands:

1. **Pre-build**: Install dependencies
2. **Build**: Compile/bundle
3. **Test**: Run final verification
4. **Package**: Create deployable artifact
5. **Tag**: Apply version tag

### 5. Push to Registry

Upload artifact to configured registry:

- Container → Container registry
- Package → Package registry
- Function → Function storage

### 6. Document Build

Create/update `deployment/build.md`:

```markdown
---
version: {version}
commit: {sha}
built: {timestamp}
status: success
---

## Build: {version}

### Artifact
- **Type**: {container|function|package}
- **Tag**: `{registry}/{unit}:{version}`
- **Size**: {size}
- **SHA**: {artifact-sha}

### Build Environment
- OS: {os}
- Runtime: {runtime-version}
- Builder: {tool-version}

### Dependencies

- **{dep1}**: {ver}
- **{dep2}**: {ver}

### Build Log Summary
{key events from build}
```

---

## Output

````markdown
## Build Complete: {unit-name}

### Artifact Created

- **Version**: `{version}`
- **Tag**: `{registry}/{unit}:{version}`
- **Built**: {timestamp}
- **Size**: {size}

### Build Summary
- Dependencies: {count} packages
- Build time: {duration}
- Tests: ✅ All passing

### Artifact Location
```text
{registry-url}/{unit}:{version}
```

### Documentation Updated

- `{unit-path}/deployment/build.md`

### Actions

1 - **deploy**: Deploy to dev environment
2 - **menu**: Return to operations menu

### Suggested Next Step

→ **deploy** - Deploy `{version}` to dev environment

**Type a number or press Enter for suggested action.**
````

---

## Output (Build Failed)

````markdown
## Build Failed: {unit-name}

### Error
```text
{error message}
```

### Failure Point

- **Stage**: {compile|test|package}
- **Exit Code**: {code}

### Logs

{relevant log excerpt}

### Suggested Actions

1. Fix the build error in source code
2. Re-run build: `build --unit="{unit}"`

### No Artifacts Created

Build must succeed before deployment.
````

---

## Build Confirmation

**Checkpoint 1**: Ask user to confirm build:

```text
Ready to build v{version}?

This will:
1. Verify all tests pass
2. Create deployable artifact
3. Tag with version {version}
4. Push to registry

Proceed with build?
1 - Yes, build
2 - Cancel
```

**Wait for user response.**

---

## Transition

After build approved and completed:

- → **Deploy** - deploy to dev environment

---

## Test Contract

```yaml
input: Unit name, version
output: Deployable artifact, build.md documentation
checkpoints: 1
  - Checkpoint 1: Build approved by user
```
