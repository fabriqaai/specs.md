# Flame Report — AI-DLC × FIRE Unification

**Session**: aidlc-fire-unification-20260809
**Method**: rapid composability check + risk scan (ideas compose rather than compete — evaluated as one architecture against alternatives)

## Verdict

All ten ideas (S1-1..S2-5) compose into a single architecture: **FIRE-core mechanics + AI-DLC brand vocabulary, recommend-don't-enforce, delivered as skills**. This beats the study's symmetric Option B (two maintained profiles = ongoing duplication) and Option C (divergence compounds). The user's decisions during the session (dynamic creation is AI-DLC-compatible; new root `docs/specsmd/`; container = **bolt**) resolved the three tensions that made Option B look necessary.

## Shortlist (all carried to Forge as one concept)

S1-1 core/overlay inversion · S1-2 recipes at run time · S1-3 affordances not pipelines · S1-4 ceremony dial · S1-5 presets · S2-2 three-place recommendation · S2-3 draft bolts · S2-4 phases as lenses · S2-5 root schema · S2-1 naming (resolved: bolt)

## Risks (carried into the brief)

1. **"Bolt" redefinition vs AWS spec** — spec's bolt is planned in Inception, scoped to one unit. Unified bolt is dynamic, may batch items. Mitigated by: draft bolts keep the inception ritual available; recommendation framing; but `.claude/CLAUDE.md` rules 2/3 must be revised — they currently forbid exactly this.
2. **Machine state in a visible docs folder** — `state.yaml` churn will show in every PR diff under `docs/specsmd/`. Options: accept (state visibility is a feature), split state out of docs/, or gitignore state.yaml only.
3. **Recipe abstraction leakage** (from study §5B) — stage catalogs + gate matrix must stay data, not code branches.
4. **Third root for tooling** — dashboard, VS Code extension, flow-detect gain `docs/specsmd/`; legacy roots stay frozen. Study Phase 1 (single parsed flow contract) is the prerequisite.
5. **Skills trigger budget** — unified flow should *reduce* model-invocable descriptions vs today's 8 (one flow, one navigator).
