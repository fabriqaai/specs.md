# Units: Versioning Strategy

## Unit Breakdown

| Unit | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| **tag-based-publish** | Modify workflow to publish on tags only | Critical | None |
| **prerelease-support** | Add npm tag handling for pre-releases | High | tag-based-publish |
| **release-documentation** | Document release process for contributors | High | tag-based-publish |
| **changelog-automation** | Auto-generate changelog (Phase 2) | Low | prerelease-support |

---

## Unit 1: tag-based-publish

### Responsibility
Modify GitHub Actions workflow to stop auto-publishing on push to main and instead publish only when version tags are pushed.

### Stories
1. As a maintainer, I need pushes to main to NOT trigger npm publish
2. As a maintainer, I need tags matching `v*` pattern to trigger npm publish
3. As a maintainer, I need the version to be extracted from the tag (not package.json)
4. As a maintainer, I need tests to run before publish
5. As a maintainer, I need the workflow to fail gracefully if version already exists
6. As a maintainer, I need workflow_dispatch to remain available for emergencies

### Implementation Changes

**File: `.github/workflows/publish.yml`**

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'  # Only trigger on version tags
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (e.g., 1.2.3)'
        required: true
        type: string

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    defaults:
      run:
        working-directory: src
    steps:
      - uses: actions/checkout@v4

      - name: Extract version from tag
        if: github.event_name == 'push'
        run: |
          # Remove 'v' prefix from tag
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "VERSION=$VERSION" >> $GITHUB_ENV

      - name: Use manual version
        if: github.event_name == 'workflow_dispatch'
        run: echo "VERSION=${{ inputs.version }}" >> $GITHUB_ENV

      - name: Validate version format
        run: |
          if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
            echo "Invalid version format: $VERSION"
            exit 1
          fi

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci --ignore-scripts || npm install

      - name: Run tests
        run: npm test

      - name: Update package.json version
        run: npm version $VERSION --no-git-tag-version --allow-same-version

      - name: Copy README
        run: cp ../README.md ./README.md

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        if: github.event_name == 'push'
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

### Acceptance Criteria
- Push to main does NOT trigger publish
- Tag `v1.2.3` triggers publish with version 1.2.3
- Invalid tag format fails validation
- Tests run before publish
- GitHub release created on tag

---

## Unit 2: prerelease-support

### Responsibility
Add support for pre-release versions with appropriate npm tags.

### Stories
1. As a maintainer, I need pre-release tags (`v1.0.0-beta.1`) to publish with npm tag `next`
2. As a maintainer, I need stable versions to publish with npm tag `latest`
3. As a user, I need to install pre-releases via `npm install specsmd@next`
4. As a maintainer, I need GitHub releases to be marked as pre-release

### Implementation Changes

Add to publish workflow:

```yaml
- name: Determine npm tag
  run: |
    if [[ "$VERSION" == *"-"* ]]; then
      echo "NPM_TAG=next" >> $GITHUB_ENV
      echo "PRERELEASE=true" >> $GITHUB_ENV
    else
      echo "NPM_TAG=latest" >> $GITHUB_ENV
      echo "PRERELEASE=false" >> $GITHUB_ENV
    fi

- name: Publish to npm
  run: npm publish --access public --tag $NPM_TAG
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

- name: Create GitHub Release
  uses: softprops/action-gh-release@v1
  with:
    generate_release_notes: true
    prerelease: ${{ env.PRERELEASE }}
```

### Acceptance Criteria
- `v1.0.0` publishes with `latest` tag
- `v1.0.0-beta.1` publishes with `next` tag
- Pre-releases marked as such on GitHub

---

## Unit 3: release-documentation

### Responsibility
Document the release process for maintainers and contributors.

### Stories
1. As a contributor, I need to understand the branching strategy
2. As a maintainer, I need step-by-step release instructions
3. As a maintainer, I need to know how to create pre-releases
4. As a contributor, I need to understand version number meanings

### Deliverables

**File: `RELEASING.md`**

```markdown
# Releasing specsmd

## Overview

specsmd uses tag-based releases. Pushing to `main` does NOT
automatically publish to npm. Releases happen when version tags
are pushed.

## Creating a Release

### 1. Ensure main is ready
- All tests passing
- PR reviews complete
- Changes documented

### 2. Update version
cd src
npm version patch  # or minor, or major
cd ..

### 3. Commit and tag
git add src/package.json src/package-lock.json
git commit -m "chore: release v$(node -p "require('./src/package.json').version")"
git tag v$(node -p "require('./src/package.json').version")

### 4. Push
git push origin main --tags

GitHub Actions will automatically:
- Run tests
- Publish to npm
- Create a GitHub release

## Pre-releases

For beta/alpha releases:
cd src
npm version prerelease --preid=beta  # Creates x.y.z-beta.1
cd ..
git add src/package.json src/package-lock.json
git commit -m "chore: release v$(node -p "require('./src/package.json').version")"
git tag v$(node -p "require('./src/package.json').version")
git push origin main --tags

Pre-releases publish to npm with the `next` tag:
npm install @specs.md/specsmd@next

## Emergency Releases

If you need to publish without creating a tag:
1. Go to Actions → Publish to npm
2. Click "Run workflow"
3. Enter the version number
4. Click "Run workflow"

## Version Guidelines

- MAJOR: Breaking changes to CLI or agent behavior
- MINOR: New features, new agents, new flows
- PATCH: Bug fixes, documentation updates
```

### Acceptance Criteria
- RELEASING.md exists in repo root
- README references RELEASING.md
- Instructions are accurate and complete

---

## Unit 4: changelog-automation

### Responsibility
Automatically generate changelog from commit history (Phase 2, post-1.0).

### Stories
1. As a maintainer, I need changelog entries generated from commits
2. As a user, I need to see what changed between versions
3. As a maintainer, I need commits to follow conventional format

### Options to Evaluate

| Tool | Approach | Effort |
|------|----------|--------|
| **Release Please** | Bot creates release PRs, generates changelog | Medium |
| **semantic-release** | Fully automated releases based on commits | High |
| **conventional-changelog** | CLI tool, manual trigger | Low |
| **Manual** | Write changelog by hand | Lowest |

### Recommendation
Start with manual CHANGELOG.md, evaluate Release Please for 1.0 release.

### Acceptance Criteria (Future)
- CHANGELOG.md maintained in repo
- Changelog entries auto-generated from commits
- GitHub releases include changelog excerpt

---

## Dependency Graph

```
┌────────────────────┐
│ tag-based-publish  │ ← Must be done first
└─────────┬──────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────────┐  ┌───────────────────────┐
│ prerelease │  │ release-documentation │
│  -support  │  │                       │
└─────┬──────┘  └───────────────────────┘
      │
      ▼
┌─────────────────────┐
│ changelog-automation│ ← Phase 2
└─────────────────────┘
```

---

## Implementation Priority

1. **Phase 1 (Now)**: tag-based-publish + release-documentation
2. **Phase 2 (Pre-1.0)**: prerelease-support
3. **Phase 3 (Post-1.0)**: changelog-automation
