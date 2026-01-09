---
stage: plan
bolt: 017-construction-log-display
created: 2026-01-09T12:35:00Z
---

## Implementation Plan: construction-log-display

### Objective

Add construction log file access to the VS Code extension's completed bolt section. When users expand a completed bolt, they will see a "Unit Artifacts" section with a link to the unit's construction-log.md file.

### Deliverables

- Add `constructionLogPath?: string` field to the `Bolt` interface in `types.ts`
- Resolve construction log path in `parseBolt()` function in `artifactParser.ts`
- Add `constructionLogPath?: string` field to `CompletedBoltData` interface
- Display "Unit Artifacts" section in `completion-item.ts` when path exists

### Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| fs module | Internal | Check file existence |
| path module | Internal | Build file paths |
| Existing open-file event | Internal | File opening mechanism |

### Technical Approach

**1. Type Extension (types.ts)**
- Add `constructionLogPath?: string` to `Bolt` interface
- Field is optional - undefined when construction log doesn't exist

**2. Path Resolution (artifactParser.ts)**
- In `parseBolt()`, after extracting `unit` and `intent` from frontmatter
- Build path: `memory-bank/intents/${intent}/units/${unit}/construction-log.md`
- Check if file exists using `fs.existsSync()` (sync is acceptable here since we're already doing file I/O)
- Set `constructionLogPath` only if file exists

**3. Data Mapping**
- When building `CompletedBoltData` objects, pass through `constructionLogPath` if present
- Need to find where this mapping happens (likely in command center or bolts view)

**4. UI Display (completion-item.ts)**
- Add `constructionLogPath?: string` to `CompletedBoltData` interface
- After the existing "Artifacts" section, add a conditional "Unit Artifacts" section
- Display only when `constructionLogPath` is set
- Use clipboard icon (📋) and "construction-log" type badge
- Reuse existing `_handleFileClick` for file opening

### Acceptance Criteria

- [ ] `Bolt` interface includes `constructionLogPath?: string`
- [ ] `CompletedBoltData` interface includes `constructionLogPath?: string`
- [ ] Path resolved correctly: `memory-bank/intents/{intent}/units/{unit}/construction-log.md`
- [ ] File existence checked - path only set if file exists
- [ ] UI shows "Unit Artifacts" section when `constructionLogPath` is set
- [ ] Clicking construction log opens file in VS Code editor
- [ ] No "Unit Artifacts" section shown when log is missing
- [ ] Tests pass

### Files to Modify

| File | Change |
|------|--------|
| `vs-code-extension/src/parser/types.ts` | Add `constructionLogPath` to `Bolt` |
| `vs-code-extension/src/parser/artifactParser.ts` | Resolve path in `parseBolt()` |
| `vs-code-extension/src/sidebar/webviewMessaging.ts` | Add `constructionLogPath` to `CompletedBoltData` |
| `vs-code-extension/src/sidebar/webviewProvider.ts` | Pass `constructionLogPath` in `_transformCompletedBolt()` |
| `vs-code-extension/src/webview/components/bolts/completion-item.ts` | Add UI section, remove duplicate interface |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bolt missing unit field | `constructionLogPath` is undefined |
| Bolt missing intent field | `constructionLogPath` is undefined |
| Unit folder doesn't exist | `constructionLogPath` is undefined |
| File deleted after parse | Click shows VS Code "file not found" error |

### Notes

- Use existing patterns from completion-item.ts for the new section
- File existence check is synchronous but acceptable given parsing context
- No new external dependencies required
