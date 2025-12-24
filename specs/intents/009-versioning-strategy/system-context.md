# System Context: Versioning Strategy

## Boundaries

### In Scope
- Release workflow configuration (GitHub Actions)
- Version number management
- npm publish triggers
- Pre-release handling
- Branch protection recommendations
- Changelog generation (future)

### Out of Scope
- Feature development workflow
- Code review process
- Testing strategy (separate intent)
- npm package configuration beyond versioning

---

## Actors

### Primary Actors

#### Maintainer
- Decides when to release
- Creates version tags
- Writes release notes
- Reviews PRs before release

#### Contributor
- Creates feature branches
- Opens PRs to main
- Follows commit conventions

#### End User
- Installs specsmd via npm/npx
- Depends on stable versions
- Reads changelog for updates

### System Actors

#### GitHub Actions
- Detects release triggers (tags)
- Executes publish workflow
- Updates GitHub releases

#### npm Registry
- Hosts published packages
- Manages version tags (latest, next)
- Enforces version uniqueness

---

## External Systems

### GitHub
- **Interface**: Git push, tags, releases API
- **Data Exchange**: Code, tags, release notes
- **Dependency**: Source code hosting, CI/CD

### npm Registry
- **Interface**: npm publish command
- **Data Exchange**: Package tarball, metadata
- **Dependency**: Package distribution

### Git
- **Interface**: CLI commands
- **Data Exchange**: Commits, tags, branches
- **Dependency**: Version control

---

## Integration Points

### Git ↔ GitHub Actions
```
Tag pushed (v*)
  → GitHub detects tag event
  → Triggers publish workflow
  → Extracts version from tag
  → Publishes to npm
  → Creates GitHub release
```

### GitHub Actions ↔ npm
```
Publish step
  → Authenticate with NPM_TOKEN
  → Check version doesn't exist
  → npm publish with appropriate tag
  → Confirm publication
```

---

## Context Diagram

```
                    ┌─────────────────────┐
                    │     Maintainer      │
                    └──────────┬──────────┘
                               │ creates tag
                               ▼
                    ┌──────────────────────┐
                    │       Git/GitHub     │
                    │                      │
                    │  main branch         │
                    │  tags: v1.0.0, etc   │
                    └──────────┬──────────┘
                               │ tag event
                               ▼
                    ┌──────────────────────┐
                    │   GitHub Actions     │
                    │                      │
                    │  - Detect tag        │
                    │  - Validate version  │
                    │  - Run tests         │
                    │  - npm publish       │
                    │  - Create release    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  npm Registry   │  │ GitHub Releases │  │    End User     │
│                 │  │                 │  │                 │
│  - latest tag   │  │  - Release notes│  │  - npm install  │
│  - next tag     │  │  - Assets       │  │  - npx command  │
│  - versions     │  │  - Changelog    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Current vs Proposed Flow

### Current Flow (Auto-Publish)
```
Developer pushes to main
       │
       ▼
GitHub Actions triggers
       │
       ▼
Version bumped (patch)
       │
       ▼
npm publish
       │
       ▼
Version commit pushed
```

**Problem**: Every push = release

### Proposed Flow (Tag-Based)
```
Developer pushes to main
       │
       ▼
GitHub Actions runs tests (no publish)
       │
       ▼
... more commits ...
       │
       ▼
Maintainer creates tag (v1.2.3)
       │
       ▼
GitHub Actions triggers on tag
       │
       ▼
npm publish with version from tag
       │
       ▼
GitHub release created
```

**Benefit**: Explicit release decision

---

## Constraints

### Technical Constraints
- npm versions are immutable once published
- Tags should not be force-pushed (breaks references)
- package.json version must match npm version

### Process Constraints
- Small team = lightweight process preferred
- Pre-1.0 = more flexibility, post-1.0 = more rigor
- Backward compatibility expectations grow with adoption

### Organizational Constraints
- Single maintainer currently (may grow)
- Open source = public releases visible to all

---

## Version Number Semantics

### Semantic Versioning (SemVer)
```
MAJOR.MINOR.PATCH[-PRERELEASE]

MAJOR: Breaking changes
MINOR: New features, backward compatible
PATCH: Bug fixes, backward compatible
PRERELEASE: Pre-release identifier (alpha, beta, rc)
```

### specsmd Versioning Guidelines

| Version | Meaning |
|---------|---------|
| `0.x.y` | Pre-1.0, API may change |
| `1.0.0` | Stable API, production ready |
| `x.y.0` | New features added |
| `x.y.z` | Bug fixes only |
| `x.y.z-beta.n` | Pre-release for testing |

### npm Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `latest` | Stable release, default install | `npm install specsmd` |
| `next` | Pre-release, opt-in | `npm install specsmd@next` |

---

## Quality Attributes

### Predictability
- Users know what to expect from version numbers
- Release timing is intentional, not accidental

### Traceability
- Every release traceable to git tag
- Every tag traceable to commits

### Reversibility
- Can deprecate bad releases
- Can publish patch releases quickly

### Transparency
- Public changelog
- GitHub releases with notes
- Clear communication of changes
