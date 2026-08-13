<!-- specsmd: append this fragment to the project's AGENTS.md.
     Always-on principles for the specsmd flow. -->

## specsmd flow

This project uses the **specsmd flow**. Specifications under `docs/specsmd/` are the memory bank and the source of truth; implementation follows specs. Do not write specsmd state to `memory-bank/` or `.specs-fire/`.

1. **Intent → work item → bolt.** Bolts are created when work starts. Draft bolts are optional.
2. **Recipes are data.** Stages come from the recipe recorded on the bolt, not from a hardcoded sequence in a skill.
3. **Recommend, don't enforce.** Skills never require a next skill. They refuse illegal state changes only (missing evidence, illegal status).
4. **Ceremony dial.** Complexity × autonomy bias → autopilot / confirm / validate. The user's choice at bolt start wins.
5. **State in frontmatter.** Skills write status fields following `flow-runtime/references/transitions.md`. There are no state scripts.
6. **nlspec.** Intents and work items describe observable behavior, never mechanism or implementation file names.
7. **Read path.** Read `docs/specsmd/system/`, `docs/specsmd/standards/`, and `docs/specsmd/decisions/index.md` before any change record. Episodic artifacts are history.

Before implementing, invoke the `specsmd-status` skill and enter work through the named skills.
