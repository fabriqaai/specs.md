<!-- specsmd: append this fragment to the project's AGENTS.md.
     Always-on principles for the unified bolt flow. -->

## specsmd — unified bolt flow

This project uses specsmd. Specifications under `docs/specsmd/` are the source of truth; implementation follows specs.

1. **Intent → work item → bolt.** Bolts are created when work starts. Draft bolts are optional.
2. **Recipes are data.** Stages come from the recipe recorded on the bolt, not from a hardcoded sequence in a skill.
3. **Recommend, don't enforce.** Skills never require a next skill. Scripts refuse illegal state changes only.
4. **Ceremony dial.** Complexity × autonomy bias → autopilot / confirm / validate. The user's choice at bolt start wins.
5. **State in frontmatter.** Only the flow-runtime scripts write status fields. Do not hand-edit them.
6. **nlspec.** Intents and work items describe observable behavior, never mechanism or implementation file names.

Before implementing, invoke the `specsmd-status` skill and enter work through the named skills.
