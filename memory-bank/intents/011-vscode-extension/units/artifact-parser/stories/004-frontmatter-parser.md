---
id: vscode-extension-story-ap-004
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Frontmatter Parser

## User Story

**As a** artifact parser component
**I want** to extract YAML frontmatter from markdown files
**So that** I can determine artifact status and metadata

## Acceptance Criteria

- [ ] **Given** a markdown file with YAML frontmatter, **When** parseFrontmatter() is called, **Then** return parsed object with all fields
- [ ] **Given** frontmatter with `status: draft`, **When** normalizeStatus() is called, **Then** return ArtifactStatus.Draft
- [ ] **Given** frontmatter with `status: in-progress`, **When** normalizeStatus() is called, **Then** return ArtifactStatus.InProgress
- [ ] **Given** frontmatter with `status: complete`, **When** normalizeStatus() is called, **Then** return ArtifactStatus.Complete
- [ ] **Given** a file without frontmatter, **When** parseFrontmatter() is called, **Then** return null (not error)
- [ ] **Given** invalid YAML in frontmatter, **When** parseFrontmatter() is called, **Then** return null and log warning
- [ ] **Given** frontmatter with `status: completed`, **When** normalizeStatus() is called, **Then** return ArtifactStatus.Complete (handle variations)

## Technical Notes

- Use js-yaml or gray-matter for parsing
- Frontmatter is delimited by `---` at start of file
- Status normalization should handle common variations:
  - draft, pending → Draft
  - in-progress, in_progress, inprogress → InProgress
  - complete, completed, done → Complete
  - anything else → Unknown

## Dependencies

### Requires
- None (utility function)

### Enables
- 003-artifact-parsing

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty file | Return null |
| Only frontmatter, no content | Return parsed frontmatter |
| Nested YAML objects | Parse correctly |
| Unicode in values | Handle correctly |
| Very large frontmatter | Parse without issue |

## Out of Scope

- Frontmatter validation against schema
- Writing/updating frontmatter
