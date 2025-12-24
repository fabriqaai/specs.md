# Unit Brief: Artifact Storage

## Overview

The Artifact Storage unit handles the actual reading and writing of markdown artifacts to the filesystem following the schema defined in memory-bank.yaml.

---

## Scope

### In Scope
- Creating directories on-demand
- Writing markdown artifacts following templates
- Reading artifacts from resolved paths
- Maintaining git-friendly file structure

### Out of Scope
- Schema definition (handled by configuration-schema)
- Agent context loading (handled by context-loader)

---

## Technical Context

### Storage Location
`memory-bank/` directory in project root

### File Format
All artifacts are stored as markdown files (.md) with optional YAML frontmatter.

---

## Implementation Details

### Directory Structure

After full usage, the memory bank looks like:

```
memory-bank/
├── intents/
│   ├── 001-user-auth/
│   │   ├── requirements.md
│   │   ├── system-context.md
│   │   ├── inception-summary.md
│   │   └── units/
│   │       ├── auth-service/
│   │       │   ├── unit-brief.md
│   │       │   └── stories/
│   │       │       ├── US-001.md
│   │       │       └── US-002.md
│   │       └── user-service/
│   │           └── unit-brief.md
│   └── 002-payment/
│       └── requirements.md
├── bolts/
│   ├── BOLT-2024-001-auth-registration.md
│   └── BOLT-2024-002-auth-login.md
├── standards/
│   ├── tech-stack.md
│   ├── coding-standards.md
│   └── system-architecture.md
└── operations/
    └── deployment-context.md
```

### Artifact Types and Templates

Each artifact type has a corresponding template in `.specsmd/aidlc/templates/`.

| Artifact | Template Location | Created By |
|----------|-------------------|------------|
| Intent requirements | `templates/inception/requirements-template.md` | Inception Agent |
| Intent inception summary | `templates/inception/inception-summary-template.md` | Inception Agent |
| System context | `templates/inception/context-template.md` | Inception Agent |
| Unit brief | `templates/inception/unit-brief-template.md` | Inception Agent |
| Story | `templates/inception/story-template.md` | Inception Agent |
| Bolt | `templates/construction/bolt-template.md` | Construction Agent |
| Standards | `templates/standards/{standard}-template.md` | Master Agent |

### Artifact File Format

Standard artifact format with optional frontmatter:

```markdown
---
# Optional YAML frontmatter for metadata
status: draft
created: 2024-01-15
updated: 2024-01-16
---

# Artifact Title

## Section 1

Content...

## Section 2

Content...
```

### Write Operation

```
function writeArtifact(templateKey, variables, content):
    1. Resolve path using schema template + variables
    2. Ensure parent directories exist (fs.ensureDir)
    3. If template exists:
       - Read template from templates/
       - Merge content into template
    4. Write content to resolved path
    5. Return success/failure
```

### Read Operation

```
function readArtifact(templateKey, variables):
    1. Resolve path using schema template + variables
    2. Check if file exists
    3. If exists: read and return content
    4. If not exists: return null or throw
```

### List Operation

```
function listArtifacts(templateKey):
    1. Get base path from schema (without variables)
    2. List all directories/files under path
    3. Return list of artifact identifiers
```

---

## Git-Friendliness Requirements

1. **No binary files** - All artifacts are text/markdown
2. **No large files** - Artifacts should be concise
3. **No secrets** - Sensitive data never stored in memory bank
4. **Line-based diffs** - Markdown format enables clean diffs
5. **UTF-8 encoding** - Consistent encoding for all files

---

## Error Handling

| Error Case | Handling |
|------------|----------|
| Directory doesn't exist | Create on-demand |
| File doesn't exist (read) | Return null, let agent handle |
| Permission error | Surface error to agent |
| Template not found | Use default content structure |
| Invalid path characters | Reject, suggest correction |

---

## Acceptance Criteria

### AC-1: Directory Creation
- GIVEN path `memory-bank/intents/001-new-feature/`
- WHEN artifact is written and directory doesn't exist
- THEN directory is created automatically
- AND parent directories are created if needed

### AC-2: Artifact Write
- GIVEN Inception Agent creates requirements.md
- WHEN write operation completes
- THEN file exists at `memory-bank/intents/{intent}/requirements.md`
- AND content matches template + provided data

### AC-3: Artifact Read
- GIVEN existing artifact at path
- WHEN read operation is performed
- THEN content is returned correctly
- AND frontmatter is parsed if present

### AC-4: Git Safety
- GIVEN any artifact in memory bank
- WHEN committed to git
- THEN no merge conflicts from encoding
- AND diffs are readable
