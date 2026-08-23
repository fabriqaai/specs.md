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
| `decisions` or produces `decisions.md` | One file per decision under **this bolt's** `decisions/` folder. Index row on `docs/specsmd/decisions/index.md`. Rationale names the rejected alternative. A forbid without a required reading is a defect. | No |
| `findings` or produces `findings.md` | What was tried, what is believed, what is unknown. | No |
| `execute` / `implement` / `explore` / `test` / `review` / `walkthrough` | Stop. That is `bolt-execute`. | — |

Honor `no_source_code`. Expired `time_box` completes into findings.

## 4. Two-implementer (required)

Follow `references/caller-contracts.md` in the `flow-runtime` skill — **How to ask** and **Intent conflict**.

Before advancing off a design stage that a later implementer will read (plan, design, decisions, domain-model):

1. List still-open hunts: return, surfaces, set rule, shape, credential.
2. For each open hunt, **one question per turn**: options, what a caller observes under each, recommendation first. Wait.
3. After each pick, check the brief and named tasks. Contradiction or needed inheritance → ask permission before editing the intent.
4. Write the decision under this bolt: `docs/specsmd/intents/{intent}/bolts/{bolt}/decisions/{id}.md`. Add a discovery row to `docs/specsmd/decisions/index.md` (title, summary, consult-when, path).
5. Write `## Two-implementer` with `Open: none.` only when every hunt is closed.
6. Two stories in the tree is a contradiction. Repair. Do not offer `bolt-execute`.

Do not treat user approval of a *summary* as closing a hunt. The full artifact text is what implementers will read.
