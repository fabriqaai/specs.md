---
id: 007-navigator-status
title: Navigator/status skill — suggested-next and phase lenses
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: 2026-08-09
---

# Navigator/status skill

The single model-invocable routing surface. Scans frontmatter across `docs/specsmd/`, reports state through the **phase lenses** (shaping / building / shipping), and computes "suggested next" — recommendations, never mandates.

## Acceptance criteria

- Status output grouped by lens: intents/items without bolts (shaping), active bolts with stage + checkpoint (building), completed awaiting ops (shipping).
- Suggested-next derives from state: pending items → suggest bolt-start; active bolt → suggest resume; nothing → suggest intent-capture. Always phrased as options, option 1 = computed best next step (v1 navigator convention).
- Embeds the integrity check (work item 004) as its health section.
- This skill plus the bootstrap are the only model-invocable descriptions in the plugin.
