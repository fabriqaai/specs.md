---
story: 004-track-categorize-errors
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
priority: should
status: complete
created: 2025-01-08T12:35:00.000Z
implemented: true
---

# Story: Track and Categorize Errors

## User Story

**As a** specsmd maintainer
**I want** to track errors with proper categorization
**So that** I can identify and fix issues affecting users

## Acceptance Criteria

- [ ] `extension_error` event captures errors with category, code, component
- [ ] Error categories: activation, parse, file_op, webview, command
- [ ] Error codes are generic (no file paths or user content)
- [ ] Component identifies where error occurred
- [ ] `recoverable` boolean indicates if extension continued working
- [ ] Error messages sanitized (no paths, stack traces with user code)
- [ ] trackError() method available for use throughout extension

## Technical Notes

```typescript
type ErrorCategory = 'activation' | 'parse' | 'file_op' | 'webview' | 'command';

interface ErrorEvent {
  error_category: ErrorCategory;
  error_code: string;
  component: string;
  recoverable: boolean;
}

// Usage example
try {
  await scanMemoryBank(workspacePath);
} catch (error) {
  analytics.trackError({
    error_category: 'parse',
    error_code: 'SCAN_FAILED',
    component: 'artifactParser',
    recoverable: true
  });
  // Continue with fallback behavior
}
```

Error code examples:
- SCAN_FAILED, YAML_INVALID, FRONTMATTER_ERROR (parse)
- FILE_NOT_FOUND, PERMISSION_DENIED, READ_ERROR (file_op)
- LOAD_FAILED, MESSAGE_ERROR (webview)
- CLIPBOARD_FAILED, TERMINAL_FAILED (command)

## Estimate

**Size**: M
