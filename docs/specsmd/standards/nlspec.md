---
id: nlspec
title: The nlspec standard — how intents and work items are written
status: active
kind: overridable
override: allowed
enforcement_tier: review
invariant: "Intents and work items state observable behavior with a behavioral Definition of Done, never mechanism or implementation file names."
remediation: "To satisfy {standard} in {file}, {change}."
created: 2026-08-09
---

# The nlspec standard

Every intent and work item in `docs/specsmd/` is a **natural language spec (nlspec)**: a prescriptive document, written in natural language with engineering-grade precision, that an agent can implement and validate from directly — without asking questions. The spec is the source of truth; code is derived from it. When code and spec conflict, the spec wins or the spec gets fixed — never a silent deviation.

This standard defines *properties* a spec must have, not a template. Structure serves the properties. Gap-checking against this standard is advisory, never blocking.

## The one rule that decides what goes in

> **Does this decision affect correctness or interoperability of the outcome? If yes, specify it. If no, leave it to the implementer — and when the freedom is deliberate, say so.**

The boundary is *behavior vs. mechanism*, not "technical vs. non-technical." A spec may state interface contracts, data shapes, defaults, bounds, and error recovery — these are observable behavior. A spec never states implementation file names, module layout, internal decomposition, language choice, or real code in any language. If pseudocode is needed to kill an ambiguity, it is untagged and language-neutral: it is meaning, not code to copy.

## Required properties

1. **Behavioral completeness.** Two competent implementers building independently from the spec produce implementations that are interchangeable to any caller. Internal structure may differ; observable behavior does not. "Handle errors appropriately" is a defect.
2. **Behavioral acceptance criteria.** Every spec ends in a **Definition of Done**: a checklist of binary, black-box, independently verifiable assertions about observable behavior — "requesting X yields Y" — never internal attributes ("adds a validator"). Close the likely misreading inline: "returns an error result *(not an exception)*". Criteria are marked **gating** (completion is impossible while unmet) or **advisory**. If it isn't in the Definition of Done, it isn't required.
3. **Defaults are requirements.** Every configurable value has a default; every range has bounds; every optional input has documented behavior when omitted; every error category has a recovery expectation. Defaults are the behavior most users experience.
4. **Named intentional ambiguity.** Where the implementer is free, the spec says so ("The flow does not prescribe X"). Silence must be distinguishable from forgetting.
5. **Bounded scope with extension points.** Out-of-scope items are listed, and each names where it would attach later — so agents neither gold-plate nor architect the future out.
6. **Spec economy, defined once.** Every sentence does work no other sentence does; each fact lives in exactly one place. Redundancy creates drift; drift creates self-contradiction — the worst spec failure. Tables carry mappings (gaps are visible by inspection); prose carries why.
7. **Rationale present.** Key decisions carry their why, so an agent hitting an unanticipated constraint deviates intelligently instead of arbitrarily. Write for the implementer who disagrees with you.
8. **Vacuum artifact.** Insights from prototypes enter the spec as plain statements ("X"), never as history ("we discovered X"). The spec leads implementation or keeps pace with it; it never trails.

## Registers

The same properties apply at two depths. Do not flatten them.

**Intent brief** (outcome layer). Short. Always reviewed. It states the problem, the observable outcome, scope, non-goals (each with an extension point), named freedoms, rationale, and an **outcome-level** Definition of Done. It does not decompose into slices, name files or skills, choose a stack, or specify per-slice defaults. A sentence that only a work item can make testable does not belong here.

**Work item** (slice layer). Independently valuable observable behavior. Lives as a `## {id}` section in the intent's `tasks.md` — not a file per slice. Defaults, bounds, omitted-input behavior, error recovery, and a **slice-level** Definition of Done. It must not contradict the owning brief's outcome or DoD.

## Voice

Declarative present tense, stated as fact: "The flow refuses completion while a gating criterion is unmet." No future/conditional tense for core behavior, no RFC-2119 legalese. Define each term once; never use synonyms for defined terms afterward.

## When something goes wrong with a spec

| Failure | What it looks like | Resolution |
|---|---|---|
| **Ambiguity** | multiple incompatible readings | implementer judgment if the readings are interchangeable to a caller; otherwise flag to the author |
| **Contradiction** | the spec disagrees with itself | author repairs the document — an agent never picks a side silently |
| **Incorrectness** | consistent, but prescribes the wrong behavior | escalate to the domain owner; a faithful implementation of a wrong spec is the spec's fault |

## Verification

A spec's sufficiency is tested, not assumed: independent implement-from-spec runs whose observable behavior diverges reveal ambiguity; the Definition of Done doubles as the conformance checklist; verification honestly reports which criteria are machine-checkable and which need a human or a scenario. Acceptance scenarios are held outside the implementing agent's reach so criteria cannot be rewritten to match what was built.
