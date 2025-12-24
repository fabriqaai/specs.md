# Intent: Versioning Strategy

## Overview

Define and implement a versioning strategy that provides stability for users while maintaining development velocity. The current setup auto-publishes every push to main, which will cause churn for users once the project gains adoption.

---

## Current State Analysis

### Current Workflow
```
Push to main → Auto version bump (patch) → npm publish
```

**Problems with current approach:**
1. Every commit to main triggers a release
2. No distinction between "ready for users" and "work in progress"
3. Users may receive incomplete features or experimental changes
4. No release notes or changelog
5. No ability to batch related changes into coherent releases
6. Semantic versioning not meaningfully applied

### Current Files
- `.github/workflows/publish.yml` - Auto-publishes on push to main
- `src/package.json` - Package version (currently 0.2.x)

---

## Goals

1. **Stability for users**: Users should be able to depend on releases being well-tested and complete
2. **Development velocity**: Maintainers should be able to iterate quickly without worrying about breaking users
3. **Clear communication**: Users should understand what changed between versions
4. **Semantic meaning**: Version numbers should communicate the nature of changes

---

## Versioning Strategy Options

### Option A: Git-Flow Style (Recommended for Production)

```
feature/* ─────┬─────► develop ─────► release/* ─────► main ─────► npm publish
               │                           │
bugfix/*  ─────┘                      (testing)
```

**Workflow:**
- `main` = stable releases only
- `develop` = integration branch for features
- Feature branches merge to `develop`
- Release branches cut from `develop` for stabilization
- Only `main` triggers npm publish

**Pros:** Battle-tested, clear separation, stable main
**Cons:** More ceremony, slower releases, more branches to manage

---

### Option B: Trunk-Based with Release Tags (Recommended for Current Stage)

```
feature/* ─────► main (no auto-publish) ─────► Tag v1.2.3 ─────► npm publish
```

**Workflow:**
- All work merges to `main` via PRs
- `main` is always deployable but NOT auto-published
- Releases happen via git tags: `git tag v1.2.3 && git push --tags`
- Only tags trigger npm publish

**Pros:** Simple, single branch, explicit releases, good for small teams
**Cons:** Requires discipline, main may have unreleased changes

---

### Option C: Release Please / Conventional Commits

```
feature/* ─────► main ─────► Release Please Bot ─────► Release PR ─────► npm publish
```

**Workflow:**
- All commits follow Conventional Commits format (`feat:`, `fix:`, `chore:`)
- Release Please bot automatically creates release PRs
- Merging release PR triggers npm publish
- Changelog auto-generated from commits

**Pros:** Automated, enforced conventions, auto-changelog
**Cons:** Requires commit discipline, adds bot dependency

---

### Option D: Manual Workflow Dispatch Only

```
main ─────► Manual trigger (GitHub UI) ─────► npm publish
```

**Workflow:**
- Remove auto-publish on push
- Use existing `workflow_dispatch` trigger exclusively
- Maintainer explicitly chooses when to release

**Pros:** Maximum control, simple change, no new tooling
**Cons:** Easy to forget, no process enforcement

---

## Recommendation

**For current stage (pre-1.0, small team): Option B (Trunk-Based with Release Tags)**

Rationale:
- Minimal change to current workflow
- No new tooling or bots
- Explicit release decision
- Works well with small teams
- Easy to upgrade to Option A or C later

**For post-1.0 (user adoption): Option C (Release Please)**

Rationale:
- Automated changelog generation
- Enforced commit conventions
- Professional release process
- Less manual work at scale

---

## Functional Requirements

### FR-1: Release Trigger Change

- FR-1.1: System SHALL NOT auto-publish on push to main
- FR-1.2: System SHALL publish on git tag matching `v*` pattern
- FR-1.3: System SHALL support `workflow_dispatch` for emergency releases
- FR-1.4: System SHALL validate tag matches semver format

### FR-2: Version Management

- FR-2.1: System SHALL use semantic versioning (MAJOR.MINOR.PATCH)
- FR-2.2: System SHALL keep package.json version in sync with tags
- FR-2.3: System SHALL block publish if version already exists on npm

### FR-3: Pre-release Support

- FR-3.1: System SHALL support pre-release tags (`v1.0.0-beta.1`)
- FR-3.2: System SHALL publish pre-releases to `next` npm tag
- FR-3.3: System SHALL publish stable releases to `latest` npm tag

### FR-4: Changelog

- FR-4.1: System SHOULD maintain CHANGELOG.md
- FR-4.2: System SHOULD create GitHub releases with notes
- FR-4.3: Changelog MAY be auto-generated from commits (Phase 2)

### FR-5: Branch Protection

- FR-5.1: Main branch SHOULD require PR reviews
- FR-5.2: Main branch SHOULD require status checks to pass
- FR-5.3: Tags SHOULD be protected (only maintainers can push)

---

## Non-Functional Requirements

### NFR-1: Simplicity

- Process should be understandable by new contributors
- Minimal new tooling or bots
- Clear documentation

### NFR-2: Reliability

- Releases should be atomic (succeed or fail completely)
- Failed releases should not leave partial state
- Idempotent release process

### NFR-3: Auditability

- Release history should be visible in git
- npm versions should match git tags
- Clear trail of who released what

---

## Migration Plan

### Phase 1: Stop Auto-Publish (Immediate)
1. Modify `publish.yml` to trigger on tags only (not push)
2. Update workflow to extract version from tag
3. Document release process in README

### Phase 2: Add Pre-release Support
1. Add npm tag logic (latest vs next)
2. Add version format validation
3. Add protection against duplicate publishes

### Phase 3: Add Changelog (Post-1.0)
1. Evaluate Release Please vs manual
2. Implement chosen solution
3. Backfill CHANGELOG.md

---

## Proposed Workflow (Post-Implementation)

### Regular Development
```bash
# Work on feature
git checkout -b feature/new-thing
# ... make changes ...
git commit -m "feat: add new thing"
git push origin feature/new-thing
# Create PR, get review, merge to main
```

### Creating a Release
```bash
# Ensure main is up to date
git checkout main
git pull

# Update version in package.json (in src/)
cd src
npm version patch  # or minor, or major
cd ..

# Commit and tag
git add src/package.json src/package-lock.json
git commit -m "chore: release v0.3.0"
git tag v0.3.0
git push origin main --tags
# GitHub Actions publishes to npm
```

### Creating a Pre-release
```bash
cd src
npm version prerelease --preid=beta
cd ..
git add src/package.json src/package-lock.json
git commit -m "chore: release v0.3.0-beta.1"
git tag v0.3.0-beta.1
git push origin main --tags
# Publishes to npm with 'next' tag
```

---

## Success Criteria

- Zero accidental releases from routine commits
- Users can pin to stable versions with confidence
- Maintainers can batch related changes into releases
- Clear process documented for contributors
- Release history visible in GitHub releases

---

## Acceptance Criteria

### AC-1: No Auto-Publish on Push
- GIVEN a commit pushed to main
- WHEN GitHub Actions runs
- THEN no npm publish occurs

### AC-2: Tag Triggers Publish
- GIVEN a tag `v1.2.3` pushed
- WHEN GitHub Actions runs
- THEN npm publish occurs with version 1.2.3

### AC-3: Pre-release Tag
- GIVEN a tag `v1.2.3-beta.1` pushed
- WHEN GitHub Actions runs
- THEN npm publish occurs with tag `next`

### AC-4: Invalid Tag Blocked
- GIVEN a tag `release-1.2.3` (wrong format) pushed
- WHEN GitHub Actions runs
- THEN no npm publish occurs

### AC-5: Duplicate Version Blocked
- GIVEN version 1.2.3 already exists on npm
- WHEN tag `v1.2.3` pushed
- THEN publish fails gracefully with clear error
