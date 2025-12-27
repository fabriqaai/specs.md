---
id: 007-privacy-story-2
unit: privacy-documentation
intent: 007-installer-analytics
status: ready
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: bolt-privacy-documentation-1
implemented: false
---

# Story: Add Analytics Section to README

## User Story

**As a** user reading the README
**I want** to see a brief note about analytics
**So that** I am aware of data collection before installing

## Acceptance Criteria

- [ ] **Given** user reads README.md, **When** they scroll to bottom, **Then** they see an "Analytics" section
- [ ] **Given** user sees Analytics section, **When** they read it, **Then** it states no personal info is collected
- [ ] **Given** user sees Analytics section, **When** they want to opt-out, **Then** quick command is shown
- [ ] **Given** user wants more details, **When** they look for link, **Then** PRIVACY.md is linked

## Technical Notes

Add to README.md at the bottom (before license section if exists):

```markdown
## Analytics

specsmd collects anonymous usage analytics to improve the product. No personal information is collected.

To disable: `SPECSMD_TELEMETRY_DISABLED=1 npx specsmd@latest install`

See [PRIVACY.md](./PRIVACY.md) for details.
```

## Dependencies

### Requires

- 001-create-privacy-md (PRIVACY.md must exist to link to)

### Enables

- None

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| README has no license section | Add at very bottom |
| README has license section | Add before license |

## Out of Scope

- Detailed data listing (that's in PRIVACY.md)
- Multiple language support
