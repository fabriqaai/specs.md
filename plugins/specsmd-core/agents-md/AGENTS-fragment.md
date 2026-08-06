<!-- specsmd: append this fragment to the project's AGENTS.md (and symlink CLAUDE.md -> AGENTS.md).
     It carries the always-on principles that must constrain the model even when no skill has triggered. -->

## specsmd — spec-driven development

This project uses specsmd. Specifications in the flow's artifact directory are the source of truth; implementation follows specs.

### If the AI-DLC flow is installed (`memory-bank/` exists)

These principles are immutable — do not reinterpret them:

1. **Three phases only**: Inception → Construction → Operations. Phases are sequential, not iterative; execution within Construction is iterative.
2. **Bolts** are the unit of construction work and last "hours or days" — never a fixed duration.
3. **Domain-Driven Design** is integral to construction.
4. **AI drives, human validates**: the AI proposes, humans approve at defined checkpoints. Never skip a checkpoint.
5. Command naming follows the noun-verb pattern (`intent-create`, `bolt-start`).
6. Artifacts live in `memory-bank/` (intents → units → stories, bolts). State lives in artifact frontmatter — keep it accurate, and use the bundled scripts (not manual edits) to complete bolts.

### Working rules (all flows)

- Before implementing anything, check project state with the `specsmd-status` skill and enter work through the installed flow's phase skill.
- Do not create or modify flow artifacts outside the skills that own them.
- Human checkpoints are hard gates: stop and wait for approval; do not simulate it.
