# Caller-visible contracts

Two implementers, given only the artifact in front of them, must produce products that are interchangeable to a caller. Internal structure may differ. These five hunts catch the gaps that wording reviews miss.

Run this list at **intent** (outcome layer), **task** (slice layer), and **bolt design** (plan / domain-model / design / decisions). Do not start product code while any hunt is **open**.

For each hunt: **pick one reading** and write it as fact, or **name a freedom**. Two stories in the same tree is a contradiction — repair the document; do not implement.

| Hunt | Ask | Defect if |
|---|---|---|
| **Return** | When does the operation become observable to the caller? Accepted-and-preparing, or wait-until-done? | A returns on accept; B blocks until finished |
| **Surfaces** | Which callers must see the same contract in this change? Name each. Which are out, with an extension point? | A changes one surface; B changes all; clients disagree |
| **Set rule** | How is a complete set enumerated? One procedure that two people run to the same list. | A lists live reality; B authors a guessed set |
| **Shape** | Field names and error kinds a client can match. Table them. Kinds need recovery. | A and B pick different keys, codes, or encodings |
| **Credential** | How a caller presents authority. Header, cookie, body — pick one default. | A and B keep different session shapes |

Also hunt **omitted input** (what happens when a field is absent) and **conflict** (what the caller sees on a duplicate or stale write). Those are Shape + Return.

## How to ask (bolt design)

Same rhythm as intent planning. **One hunt per turn.** Do not batch. Do not close a hunt in the same turn you first named it.

For each still-open hunt:

1. Name the hunt and the caller-visible defect if two implementers guess.
2. Offer **A / B / C** (the real alternatives in this tree, not generic ones).
3. One sentence on what a caller observes under each option.
4. **Recommend first**, with why.
5. Wait.

Example shape:

> **Return — when does start become observable?**
> Two implementers can return on accept or wait until the first turn is done. Callers would see two start contracts.
>
> - **A (recommended):** accepted-and-preparing, then ready. The caller can proceed without blocking on the first turn.
> - **B:** wait-until-first-turn-complete. The caller treats start as done only when the turn is done.
> - **C:** named freedom — either is fine; say so on the brief.
>
> I recommend A because {why}. Which do you want?

Repeat until every hunt is a chosen reading or a named freedom.

## Intent conflict

After each pick, read the intent brief (Outcome, Scope, Named freedoms, Definition of Done) and the named task sections.

- **Silent brief** — the design pick is new. Offer to add a DoD line or Named freedom on the brief so later bolts inherit it. Edit the brief **only after an explicit yes**.
- **Contradiction** — quote both readings. Ask: (A) change the design pick (B) update the brief or task *(recommended when the brief was underspecified)* (C) name a freedom on the brief. Edit the brief or `tasks.md` **only after an explicit yes**. Record that permission in the decision Why.
- **Already matches** — write the hunt as fact. Do not touch the brief.

Never silently rewrite the intent to fit the design.

## How to record

Add `## Two-implementer` to the artifact you are writing (brief, task section, `plan.md`, `design.md`, `domain-model.md`, or `decisions.md`).

```markdown
## Two-implementer

- Return: {the chosen reading}
- Surfaces: {named set} — out: {name} attaches later at {point}
- Set rule: {one procedure}
- Shape: see table below / {or: the intent does not prescribe encodings}
- Credential: {chosen default} / {or: named freedom}

Open: none.
```

`Open: none.` is required before implement. An open line is a stop.

## Not this

- "Handle errors appropriately"
- "Keep the existing session"
- "Complete empty database" with two different procedures in the tree
- A decision that forbids one reading but does not name the required reading
