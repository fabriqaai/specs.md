---
id: 004-integrity-validator
title: Integrity validation and drift reconciliation
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: 2026-08-09
---

# Integrity validation and drift reconciliation

With state distributed across frontmatter, drift detection is the safety net. Merge FIRE's interactive integrity skill (15 issue types, severity, auto-fixability, fix-all/review-each modes) with v1 AI-DLC's `status-integrity.cjs` cascade rules.

## Acceptance criteria

- Detects: status-cascade violations, orphaned bolts/work items, stale in-progress bolts, frontmatter schema violations, dangling `depends_on`, ID/filename mismatches.
- Never auto-fixes without asking; fixes logged to a maintenance log.
- Runnable both as CLI (`--json`, `--fix` for CI) and interactively via the status skill.
