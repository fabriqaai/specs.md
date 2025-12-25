# Development & Release Guide

## Branch Structure

```mermaid
gitGraph
    commit id: "initial"
    branch dev
    checkout dev
    commit id: "feat: parser"
    commit id: "fix: bug"
    checkout main
    merge dev id: "auto v0.1.0" tag: "v0.1.0"
    checkout dev
    commit id: "feat: new feature"
    commit id: "fix: another bug"
    checkout main
    merge dev id: "auto v0.1.1" tag: "v0.1.1"
```

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Active development. Push freely. CI validates every push. |
| `main` | Production. Merge here to deploy. Version auto-bumped from commits. |

---

## How Auto-Versioning Works

Semantic-release reads your commit messages and determines the version:

| Commit Prefix | Version Bump | Example |
|---------------|--------------|---------|
| `fix:` | Patch | 0.0.32 → 0.0.33 |
| `feat:` | Minor | 0.0.32 → 0.1.0 |
| `feat!:` or `BREAKING CHANGE:` | Major | 0.0.32 → 1.0.0 |
| `chore:`, `docs:`, `style:` | No release | - |

```mermaid
flowchart LR
    A[Commit Message] --> B{Prefix?}
    B -->|fix:| C[Patch +0.0.1]
    B -->|feat:| D[Minor +0.1.0]
    B -->|feat!: or BREAKING| E[Major +1.0.0]
    B -->|chore: docs:| F[No Release]
```

---

## Workflow Overview

```mermaid
flowchart LR
    subgraph dev[dev branch]
        D1[Code] --> D2[Commit with prefix]
        D2 --> D3[Push]
        D3 --> D4{CI}
        D4 -->|Pass| D5[Ready]
        D4 -->|Fail| D1
    end

    subgraph main[main branch]
        M1[Merge from dev] --> M2{CI}
        M2 -->|Pass| M3[semantic-release]
        M3 --> M4[Auto version bump]
        M4 --> M5[npm publish]
        M5 --> M6[GitHub Release]
    end

    D5 --> M1
```

---

## Daily Workflow

### 1. Start New Work (Sync with main)

```bash
git checkout dev
git fetch origin
git rebase origin/main
```

This ensures dev has all changes from main before starting new work.

### 2. Development

```bash
git checkout dev
# ... make changes ...
git add .
git commit -m "feat: add new parser feature"
git push
```

**Use these commit prefixes:**

- `feat:` - New feature (bumps minor)
- `fix:` - Bug fix (bumps patch)
- `feat!:` - Breaking change (bumps major)
- `docs:` - Documentation only (no release)
- `chore:` - Maintenance (no release)
- `refactor:` - Code refactor (no release)

CI runs automatically on push.

### 3. Deploy

```bash
git checkout main
git merge dev
git push
```

This triggers:

1. CI runs (lint, test, build)
2. semantic-release analyzes commits
3. Auto-bumps version based on commit prefixes
4. Publishes to npm
5. Creates GitHub release with changelog

---

## Release Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant DevB as dev branch
    participant MainB as main branch
    participant CI as GitHub Actions
    participant SR as semantic-release
    participant NPM as npm Registry
    participant GH as GitHub Releases

    Dev->>DevB: git commit -m "feat: new feature"
    Dev->>DevB: git push
    DevB->>CI: Run tests
    CI-->>Dev: Tests pass
    Dev->>MainB: git merge dev
    Dev->>MainB: git push
    MainB->>CI: Run tests
    CI->>SR: Analyze commits
    SR->>SR: Detect "feat:" → minor bump
    SR->>SR: 0.0.32 → 0.1.0
    SR->>NPM: npm publish v0.1.0
    SR->>GH: Create release v0.1.0
    SR->>MainB: Commit version bump
    GH-->>Dev: Release notes generated
```

---

## Quick Reference

### Start New Work (Always Do This First)

```bash
git checkout dev
git fetch origin
git rebase origin/main
```

### Commit Examples

```bash
# Bug fix → patch release (0.0.32 → 0.0.33)
git commit -m "fix: resolve memory leak in watcher"

# New feature → minor release (0.0.32 → 0.1.0)
git commit -m "feat: add YAML validation support"

# Breaking change → major release (0.0.32 → 1.0.0)
git commit -m "feat!: change CLI argument format"

# No release
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### Deploy to Production

```bash
git checkout main
git merge dev
git push
# → Auto version, publish, release
```

### Check CI Status

```bash
gh run list
gh run watch
```

### View Published Version

```bash
npm view specsmd version
```

---

## CI/CD Pipeline

```mermaid
flowchart TD
    subgraph trigger[Triggers]
        T1[Push to dev]
        T2[Push to main]
    end

    subgraph ci[CI Jobs]
        C1[Lint] --> C2[Test]
        C2 --> C3[Build]
    end

    subgraph cd[Release - main only]
        CD1[semantic-release]
        CD2[Analyze commits]
        CD3[Bump version]
        CD4[npm publish]
        CD5[GitHub Release]
        CD1 --> CD2 --> CD3 --> CD4 --> CD5
    end

    T1 --> ci
    T2 --> ci
    ci -->|main only| cd
```

### On Push to `dev`

- Lint check
- Run tests
- Build validation

### On Push to `main`

- Lint check
- Run tests
- Build validation
- **semantic-release:**
  - Analyze commit messages since last release
  - Determine version bump (patch/minor/major)
  - Update package.json
  - Publish to npm
  - Create GitHub release with auto-generated changelog

---

## Secrets Required

| Secret | Purpose | Where to Set |
|--------|---------|--------------|
| `NPM_TOKEN` | Publish to npm registry | GitHub → Settings → Secrets → Actions |

### Generate NPM Token

```bash
npm login
npm token create --read-only=false
```

Copy token to GitHub repository secrets.

---

## Troubleshooting

```mermaid
flowchart TD
    A[Problem?] --> B{CI Failed on main?}
    B -->|Yes| C[Fix on dev]
    C --> D[Re-merge to main]

    B -->|No| E{No release created?}
    E -->|Yes| F[Check commit prefixes]
    F --> G[Use fix: or feat:]

    E -->|No| H{Publish failed?}
    H -->|Yes| I[Check NPM_TOKEN secret]
    I --> J[Re-run workflow]

    H -->|No| K[Check workflow logs]
```

### No Release Created

- Commits need `fix:` or `feat:` prefix
- `chore:`, `docs:`, `style:` don't trigger releases
- Check if commits are reachable from main

### CI Failed on Main

- Fix issues on dev, re-merge

### Check Workflow Logs

```bash
gh run list --branch main
gh run view <run-id> --log
```

---

## Setup Checklist

- [ ] Create `dev` branch: `git checkout -b dev`
- [ ] Add `NPM_TOKEN` secret in GitHub repo settings
- [ ] Run `npm install` in `src/` to install semantic-release
- [ ] Push both branches
- [ ] Start committing with `fix:` and `feat:` prefixes
