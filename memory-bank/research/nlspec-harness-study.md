# NLSpecs & Harness Engineering — Study for the Unified Bolt Flow

**Date**: 2026-08-09
**Status**: Input to the Unified Bolt Flow (`docs/specsmd/`); companion to `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md`
**Method**: Six parallel research agents over: StrongDM's attractor repo (attractor-spec, coding-agent-loop-spec, unified-llm-spec + factory.strongdm.ai), community nlspec writing (jhugman, TG-Techie NLSpec-Spec, sddiv, SpecOps 2026, the Orchid ambiguity benchmark, GitHub Spec Kit), OpenAI's "Harness engineering" post + ExecPlans spec + ecosystem responses, and three talks/podcasts by Ryan Lopopolo (OpenAI Codex/Frontier).

## TL;DR

The sources converge on one architecture, which is the one specsmd v2 already chose: **the spec is the durable, human-authored artifact; code is a derived, regenerable output; and everything technical that used to live in specs moves into an execution harness that surrounds the agent.** "Natural language spec" does not mean informal — it means *not a programming language*: engineering-grade precision about externally observable behavior, with internal mechanism deliberately left free. The harness enforces invariants mechanically (lints, structural tests, judge agents, goal-gated completion) and teaches through its error messages. Spec quality is *testable* — via the two-implementer property, implement-from-spec-only triangulation, and Definition-of-Done conformance — which is what makes the user's evals-first requirement practical.

---

## 1. What an nlspec is (synthesis)

**StrongDM (origin)**: "a human-readable spec intended to be directly usable by coding agents to implement/validate behavior." The spec is the *distribution format for a system* — their entire build instruction is one prompt pointing at the repo. Code is "opaque weights whose correctness is inferred exclusively from externally observable behavior."

**TG-Techie (sharpest grounding)**: "a prescriptive, generative document written in natural language that fully determines the construction of a software system." Direction is non-negotiable: Intent → NLSpec → Implementation. The spec resolves "every decision that matters for correctness and interoperability while leaving every decision that doesn't matter to the implementer."

**The critical correction to naive readings**: "The word 'natural language' might suggest informality. It does not. The language is natural; the precision is engineering-grade." StrongDM's three specs total ~5,700 lines with attribute tables, BNF grammars, priority algorithms, and 70-item conformance checklists. NLSpec buys *language independence and human reviewability*, not reduced authoring effort. Humans do design; models do implementation.

**Empirical grounding (Orchid benchmark)**: ambiguity in specs measurably degrades generation (−7.2pp Pass@1 average, −31pp worst case), roughly doubles functional divergence between independent implementations, and models silently guess rather than ask in >63% of ambiguous cases. *Every gap becomes a wrong implementation; every missing default becomes a bug.*

### Where the line actually sits: behavior vs. mechanism

The corpus splits on spec depth — GitHub Spec Kit keeps all technical content out of the spec (spec = user journeys; separate plan = stack); the NLSpec lineage puts wire formats, error hierarchies, and pseudocode *in* the spec. The reconciling principle (TG-Techie) is that the boundary is **not** technical-vs-non-technical. It is:

> **Does this decision affect correctness or interoperability? If yes, specify it. If no, leave it to the implementer.**

So a spec legitimately contains: interface contracts, on-disk/on-wire data shapes, defaults and bounds, error categories with recovery, ordered algorithms *as observable behavior*. A spec never contains: file names or module layout of the implementation, language-specific signatures, internal decomposition, real code in any language. StrongDM's one-sentence version: "The externally visible behavior must remain identical; internals are free." The asymmetry that justifies leaning specific: "over-specification produces implementations that are merely constrained; under-specification produces implementations that are incompatible."

### Writing rules with the strongest support

1. **Definition of Done is the highest-leverage section** (~10% of every StrongDM doc; the basis of their conformance benchmark). Binary, black-box, independently verifiable assertions in present tense, numbered to mirror the body, likely misreadings closed inline ("returns an error result *(not an exception)*"). The DoD↔body loop is auditable: a body section with no DoD items is untestable; a DoD item with no body section is ungrounded — both are spec defects.
2. **Acceptance criteria are behavioral, not structural** (ExecPlans): "navigating to /health returns HTTP 200 with body OK" — never "added a HealthCheck struct."
3. **Defaults are requirements.** Every configurable value has a default; every range has bounds; every error category has a recovery strategy. "Defaults are the behavior most users experience."
4. **Multiple representations kill ambiguity**: "Prose says why, pseudocode says how, tables say what, and checklists say when you're done." Pseudocode is untagged and language-neutral (StrongDM: 380 fences, zero language tags — "this is meaning, not code to copy"). Tables for mappings, because gaps are visible by inspection.
5. **Named intentional ambiguity**: "When you don't care, say so." Silence must be distinguishable from forgetting. Out-of-scope items each name their extension point — bounding scope without architecting the future out.
6. **Spec economy + define-once**: every sentence does work no other sentence does; redundancy creates drift, and drift produces self-contradiction — the worst spec failure class.
7. **Declarative present tense, minimal RFC-2119**: requirements read as statements of fact ("The engine retries these automatically"); obligation is carried by the DoD.
8. **Rationale lives in the spec** ("Why X" sections): agents facing unanticipated constraints will deviate regardless; rationale makes the deviation intelligent instead of arbitrary. "Write for the implementer who disagrees with you."
9. **Properties over templates** (the sddiv 24-hour-rewrite lesson): fixed section counts break on real domains; numbered cross-references shatter when structure flexes; gap detection must be advisory, not blocking. Prescribe *properties* a spec must have, not a box count.
10. **The spec is a vacuum artifact that leads implementation**: prototype learnings enter the spec "as if the exploration never happened" ("It does not say 'based on our prototype, we discovered X.' It says 'X.'"); the spec leads or keeps pace, never trails. Code-first exploration is fine (Lopopolo built Symphony implementation-first, then distilled the spec) — but the distilled spec becomes the authority.

### The failure taxonomy (maps directly to agent escalation)

| Failure | Nature | Resolution | Resolver |
|---|---|---|---|
| Ambiguity | multiple incompatible readings at a point | judgment via interchangeability test, or flag | implementer/agent |
| Malformation | spec contradicts itself | repair the document — never pick a side silently | author only |
| Incorrectness | consistent but prescribes wrong behavior | domain authority | domain expert |

---

## 2. Harness engineering (synthesis)

**Definition in practice** (OpenAI, Lopopolo, Hashimoto): the engineering team's job is "no longer to write code, but to design environments, specify intent, and build feedback loops." The term's origin insight (Hashimoto): every time an agent makes a mistake, engineer a permanent fix into its environment so the mistake cannot recur. The harness lives *in the repo under version control*, not in the agent runtime. Two levers only: **the context you provide and the tools you provide.**

**Core philosophy**:
- *Failure is a specification bug.* "Early progress was slower than we expected — not because Codex was incapable, but because the environment was underspecified." Never respond with "try harder"; ask what capability is missing and make it legible + enforceable.
- *Invariants over implementations.* Constrain properties ("parse at the boundary"), not methods (the model chose Zod itself). "By enforcing invariants, not micromanaging implementations, we let agents ship fast without undermining the foundation."
- *Constraints are multipliers*: "In a human-first workflow these rules might feel pedantic. With agents, once encoded, they apply everywhere at once."
- *Existence is bounded by context*: "anything the agent can't access in-context effectively doesn't exist."
- *"Every time I have to type continue to the agent is a failure of the harness."*

**The mechanism catalog most relevant to specsmd**:

1. **Tiered guardrail escalation ladder** (Lopopolo): principle text → documentation → judge agent scoring changes against docs → deterministic lint/test. Default to the cheapest form; promote only when a violation recurs systematically ("when documentation falls short, we promote the rule into code").
2. **Guardrail messages are remediation instructions**: prose telling the agent what to do next and which runbook to follow — every gate becomes a teaching signal, a self-closing loop. Agent-facing failure output is a distinct message register from human logs.
3. **Just-in-time surfacing over front-loading**: a thin (~100-line) entry map pointing into a deep, indexed knowledge base; specific constraints surface at the moment they're relevant (a failing check), not in one giant upfront prompt. "When everything is 'important,' nothing is."
4. **Goal gates** (StrongDM — the single best structural guardrail): load-bearing criteria are tracked by the *engine*, not the handler, so they can't be bypassed; completion is structurally unreachable until gates pass — the flow reroutes to remediation instead of exiting.
5. **Narrow typed status channel**: the agent reports outcomes and *suggests* routing through a small typed contract (StrongDM's status.json ≈ specsmd's frontmatter-written-by-scripts); deterministic rules resolve the suggestion. The agent influences flow; it never controls it.
6. **Pre-flight validation + checkpoint/resume**: structural lint before tokens are spent; state checkpointed at every step with save/resume equivalence as an explicit conformance item.
7. **Typed error taxonomy**: retryable / terminal / structural — retry budget is never spent on failures that cannot succeed.
8. **Background maintenance agents**: garbage-collection agents converting each week's observed slop into durable rules; doc-gardening agents detecting spec↔code drift and opening small PRs. (OpenAI: the manual version consumed 20% of the week and "didn't scale.")
9. **Non-blocking, severity-gated review**: hard blocks reserved for load-bearing rules; agents may acknowledge, defer, or contest advisory feedback with reasoning — "bias toward code being accepted, not perfect"; don't let agents be bullied into paralysis.
10. **Human attention scales with ambiguity, not with volume**: mandatory human review only for high-ambiguity intent documents ("those documents ARE the prompt — under- or over-specify and you get garbage"); routine well-specified work flows with post-hoc audit. Plans, when produced, are specs: review them line-by-line or don't produce them — "approving a plan without reading it encodes instructions you don't want followed."

**Cautions**: OpenAI's minimal merge gates are explicitly justified only by extreme throughput ("irresponsible in a low-throughput environment"). Much of harness engineering is platform engineering with prior art (Toyota's fix-the-cause rule); the genuinely new element is the *stochastic executor*. And the field has not converged — Lopopolo compares the moment to pre-standardization CI/CD.

---

## 3. Verification & evals (the evals-first foundation)

1. **Spec-sufficiency triangulation** (Lopopolo's Symphony method): Agent A writes the spec → Agent B implements *from the spec only* (no access to any reference) → Agent C judges B's output against the reference and proposes spec corrections → iterate until the spec reliably reproduces the system. Token-intensive; the only known way to make "this spec is sufficient" a tested claim instead of an assumption.
2. **The two-implementer property, mechanized**: functional divergence between independent implementations is an empirical measure of spec ambiguity (Orchid). Cheap version: two independent implement-from-spec runs + diff of observable behavior.
3. **DoD as executable conformance** (AttractorBench): the Definition of Done *is* the benchmark. Calibration: frontier agents score 0.3–0.4 on a 2,000-line spec and that is called "respectable" — full conformance is not the realistic bar.
4. **Coverage honesty**: report which acceptance criteria are machine-verifiable and which need a human or a scenario (~30% machine-testable in StrongDM's own benchmark). A tool that says "6 of your 20 criteria are machine-checked" is more trustworthy than a green check.
5. **Scenarios as holdout**: store end-to-end acceptance scenarios *outside the agent's reach* so criteria can't be rewritten to match what was built ("`return true` is a great way to pass narrowly written tests"); judge satisfaction of trajectories, not boolean pass.
6. **Advisory gap detection**: spec lint (self-containment, defined terms, DoD↔body closure, missing defaults) must warn, not block — zero-tolerance gap-checking stalls real work.

---

## 4. What this means for the Unified Bolt Flow

The layered answer to the spec-depth tension — each layer has its own register:

| Layer | Register | Author | Human review |
|---|---|---|---|
| **Intent brief** | Pure intent: problem, outcome, scope, non-goals (Spec-Kit-shallow) | human + agent dialogue | always (it's short) |
| **Work item** | Behavioral nlspec: observable behavior, defaults, error recovery, Definition of Done — no mechanism | human + agent dialogue | scales with ambiguity/complexity (ceremony dial) |
| **Bolt-time plan/design** | Agent-authored living document (ExecPlans register: progress, surprises, decision log, retrospective) | agent | only at confirm/validate ceremony |
| **Harness** | Standards, invariants, recipes, guardrail checks, remediation messages | human-curated, agent-maintained | on change |

Concrete adoptions (fed into `docs/specsmd/` work items):
- The **nlspec standard** (`docs/specsmd/standards/nlspec.md`) encodes the writing rules of §1 as properties, with advisory linting.
- **Goal-gated completion**: work-item acceptance criteria marked gating vs. advisory; the completion tool refuses while gates are unmet (we already had the phase guard — this generalizes it to criteria).
- **Guardrail messages as remediation instructions** across all flow tooling.
- **Tiered escalation** built into the standards system: principle → doc → judge skill → deterministic check, with violation-count-triggered promotion.
- **Evals-first work item (000)**: triangulation harness + DoD conformance checks + trigger evals, built before flow implementation begins.
- **Spec drift maintenance** as a recurring background flow (pairs with the existing compare-specs idea).

## 5. Bibliography

- github.com/strongdm/attractor (attractor-spec.md, coding-agent-loop-spec.md, unified-llm-spec.md) · github.com/strongdm/attractorbench · factory.strongdm.ai (manifesto, /principles, /techniques)
- jhugman.com/posts/on-nlspecs + github.com/jhugman/nlspec · github.com/TG-Techie/NLSpec-Spec (v0.2.2) · sddiv "From Tokens to Specs" / 24-hour rewrite · SpecOps 2026 workshop (SPLASH/ISSTA) · arXiv 2604.21505 (Orchid ambiguity benchmark) · arXiv 2601.03878 (SANER 2026 registered report) · GitHub Spec Kit
- openai.com/index/harness-engineering + ExecPlans spec (PLANS.md) · Mitchell Hashimoto on harness engineering (term origin) · HumanLayer, Futurice, Böckeler (martinfowler.com), Lilian Weng, Stuart Miller responses
- Ryan Lopopolo: "Harness Engineering" conference keynote (youtube c8bE0cj7vHY / am_oeAoUhew — same talk, two uploads) · The AI Native Dev podcast (youtube MFQIKbr1IEo)
