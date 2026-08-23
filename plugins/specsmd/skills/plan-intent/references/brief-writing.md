# How to write an intent brief

Write every document the flow produces per `references/writing.md` in the `flow-runtime` skill. This file adds what belongs in each section of a brief.

The reader is a coding agent with **zero project context** who **guesses instead of asking**. Every gap becomes a wrong implementation. Write so two such agents, given only this brief, produce the same observable outcome.

This is the **outcome layer**. Why + What + Done. How (defaults, recovery, algorithms) belongs on work items. If a sentence is only testable after you invent a slice, it does not belong here.

## Complementary representations

Use more than one form for the same fact when prose alone can be read two ways:

| Form | Job |
|---|---|
| Prose | Why |
| Table | What (gaps show as empty cells) |
| Checklist | When you are done |

Examples are illustrative. Tables and the Definition of Done are normative.

## No placeholders

These are brief failures. Never write them:

- `TBD`, `TODO`, `later`, `etc.`, `similar to above`
- "handle errors appropriately" / "a good UX" / "as needed"
- "the usual flow" / "make it work"
- a heading with nothing under it except the heading

If you do not know, write `*(thin — not yet specified)*` and say so in the close. That is a named gap. Inventing content is worse.

## Problem = status quo → pain → why it matters

Three beats, in that order. Not a solution.

**Good**

> A teammate who was not in the session cannot tell whether a change is done. They open a folder of notes and guess. Wrong guesses ship incomplete work.

**Bad**

> We need a better planning plugin and a docs folder.

The bad sentence is a solution dressed as a problem. The good sentence is observable today.

## Outcome = what a caller observes, present tense

One to three sentences. Stated as fact. Name the caller. Close the likely misreading inline.

**Good**

> A teammate who was not in the session can open the intent and tell, from the Definition of Done alone, whether the change is complete *(they do not need the chat log)*.

**Bad**

> We will install the plugin and write files under docs/specsmd/ with YAML frontmatter.

The bad sentence is a delivery vehicle. File trees and install commands are mechanism.

## Scope = a bound you can inspect

List what this change covers. Prefer a short table if the bound has parts. Do not list slices (that is decompose). Do not list modules.

If the request names several independent outcomes, this is more than one intent. Stop. Name the outcomes. Write the first brief only.

## Non-goals = four parts each

Every out-of-scope line has all four:

1. **Name**
2. **What it is**
3. **Why it is out**
4. **Where it attaches later**

**Good**

> **Release workflow.** Confirming a change in a target environment. Out because this intent is about capturing and executing a change, not shipping it. Attaches later as an optional shipping ritual over completed bolts.

**Bad**

> - ops
> - polish

A bare "not now" is a defect. Without the extension point, a later agent treats the exclusion as permanent and gold-plates around it — or ignores it and builds it anyway.

## Named freedoms = "we do not prescribe X"

Silence is not a freedom. If two implementations may differ and that is fine, say so.

**Good**

> The intent does not prescribe how the brief is stored on disk beyond the flow contract's path pattern.

**Bad**

> (leave the section empty)

An empty freedoms section means you forgot, not that the implementer is free.

## Rationale = rejected alternative, as a question

Each entry names the path you did **not** take.

**Good**

> **Why an outcome-level brief instead of a task list?** A task list tells an agent what to type. Two agents type different programs. An outcome-level Definition of Done tells them what a caller must observe.

**Bad**

> We decided this in the meeting because it felt cleaner.

Vacuum artifact: write the fact, not the history.

## Definition of Done = closed loop

- At least one `(gating)` line.
- Each line is binary, black-box, present tense: "doing X yields Y".
- Close a likely misreading on the same line: "yields an error result *(not an exception)*".
- Never an internal attribute: "adds a validator", "uses a queue".
- Mirror the body: every Outcome or Scope claim has a DoD line; every DoD line is grounded in Outcome or Scope.
- If a section is long and has no DoD line, the section is too vague. Tighten the body or delete it.

**Good**

> - [ ] (gating) A reader who was not in the session can decide complete vs not-complete from the brief's Definition of Done alone *(not from chat memory)*.
> - [ ] (advisory) Named freedoms list at least one deliberate non-prescription, or state that none remain.

**Bad**

> - [ ] Planning is solid
> - [ ] Tests pass
> - [ ] The code is clean

Density check: if you cannot write the checkbox, you have not specified the outcome yet. Ask; do not pad.

## Two-implementer test

After the draft exists, read it as a stranger. Run the hunts in `references/caller-contracts.md` in the `flow-runtime` skill: **return**, **surfaces**, **set rule**, **shape**, **credential**.

If the outcome has a caller (human or program), each hunt is either a fact in Outcome / DoD / a table, or a line under Named freedoms. Two procedures for the same set, or a forbid without a required reading, is a contradiction.

If two implementers could pass every DoD line and a caller would still see different products, the brief is not done. Ask. Do not write the file.

## Voice

Declarative present tense. "The reader sees X." Not "we will", "should", "might". Define each term once. Never use a synonym for a defined term afterward.
