---
id: 007-navigator-status
title: The navigator — state seen through lenses, suggestions never mandates
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: 2026-08-09
---

# The navigator — state seen through lenses, suggestions never mandates

The navigator is how anyone — user or model — orients. It reads the artifact tree and answers: where are we, what's healthy, what's worth doing next. It recommends; it never gates.

## Behavior

- Status is reported through the three lenses: **shaping** (intents and work items not yet in any bolt), **building** (active bolts with stage and gate state), **shipping** (completed work awaiting whatever comes after). The lenses are views over state — nothing about them restricts what may be invoked.
- Suggested next moves derive from state: pending shaped work suggests starting a bolt; an interrupted bolt suggests resuming it; an empty tree suggests capturing an intent; an awaiting gate suggests reviewing it. Suggestions are presented as options with the computed best first; every option is declinable and the menu never hides capabilities.
- Health is included: the integrity validator's findings appear in status, summarized with severities.
- The navigator and the flow's bootstrap are the only parts of the flow that announce themselves to the model unprompted; everything else activates by name.

## Definition of Done

- [ ] (gating) A tree with one unstarted intent, one active bolt, and one completed bolt reports each under its correct lens.
- [ ] (gating) For each of the four state situations listed, the computed best next move matches, and it is presented as an option, not an action taken.
- [ ] (gating) Integrity findings present in the tree appear in status output.
- [ ] (advisory) A user who ignores every suggestion and invokes any skill directly is never warned, blocked, or nagged by the navigator.
