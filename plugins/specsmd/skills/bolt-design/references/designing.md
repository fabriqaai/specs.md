# How to design a bolt

No product code. Close caller-visible contracts. Dispatch on the **current stage's id and `produces`**.

Write every artifact this stage produces per `references/writing.md` in the `flow-runtime` skill. A later implementer reads these files with no memory of this session, so each one names where its claims come from and stands on its own.

## 1. Load context

1. `docs/specsmd/system/` docs whose claimed scope matches this bolt
2. Constitution (root only) and nearest standards. Do not add a standard for a fact that will not outlive this bolt — write a decision.
3. `docs/specsmd/decisions/index.md` — open the linked bolt decision only when `consult_when` matches
4. Intent brief and named `tasks.md` sections
5. This bolt's `current_stage` and `checkpoint_state`

## 2. Show progress

```text
### Bolt progress
- [x] {completed}
- [ ] {current_stage}  ←
- [ ] {later}
```

## 3. Dispatch (design stages only)

| Match | Do this | Source? |
|---|---|---|
| `plan` or produces `plan.md` | Observable change + how we will know. Include `## Two-implementer`. | No |
| `domain-model` or produces `domain-model.md` | Bounded context, ubiquitous language table, invariants. | No |
| `design` or produces `design.md` | Observable contracts: shapes, defaults, errors, recovery. Field and error table. `## Two-implementer`. | No |
| `decisions` or produces `decisions.md` | Reference inherited decisions in `decisions.md`. Write each new or changed decision under **this bolt's** `decisions/` folder, with a discovery row on `docs/specsmd/decisions/index.md`. Rationale names the rejected alternative. A forbid without a required reading is a defect. | No |
| `findings` or produces `findings.md` | What was tried, what is believed, what is unknown. | No |
| `execute` / `implement` / `explore` / `test` / `review` / `walkthrough` | Follow `bolt-execute` when execution is already authorized and design gates passed; otherwise offer it at the requested phase boundary. | — |

Honor `no_source_code`. Expired `time_box` completes into findings.

## 4. Two-implementer (required)

Follow `references/caller-contracts.md` in the `flow-runtime` skill — **Resolve from evidence before asking** and **Intent conflict and capture**.

Before advancing off a design stage (plan, design, decisions, domain-model, findings), assess only the contracts relevant to its role. For findings, assess the authorized exploration and its evidence. Put research unknowns under What remains unknown; they block a dependent implementation until resolved, but do not keep the completed exploration open. Do not require findings before the exploration stage that produces them:

1. List still-open hunts: return, surfaces, set rule, shape, credential.
2. Resolve each relevant check from prior answers, accepted contracts and owning code/tests. Ask only about a remaining material choice; settled checks can close immediately.
3. Inherit and capture authorized decisions without repeated permission. A new scope change or contradiction needs the user's decision before changing the agreed contract.
4. For a new or changed decision, write `docs/specsmd/intents/{intent}/bolts/{bolt}/decisions/{id}.md` and add a discovery row to `docs/specsmd/decisions/index.md` (title, summary, consult-when, path). For an inherited decision, cite the accepted owner in the current artifact; the reference is sufficient and creates no new decision file or index row.
5. Write `## Two-implementer` with `Open: none.` only when every hunt is closed.
6. Two stories in the active contract require repair before dependent execution. Resolve from accepted evidence or ask about the remaining material choice.

The saved artifact must contain the resolved contracts; its review summary does not fill missing decisions. Use **Artifact review** in `references/transitions.md` in the `flow-runtime` skill to present it. Approval of a linked artifact accepts its saved revision, but cannot close a hunt left unresolved in that file.
