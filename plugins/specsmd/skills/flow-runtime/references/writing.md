# How to write a specsmd document

Every file the flow writes under `docs/specsmd/` is read by someone who was not in the session that produced it — usually an agent with no memory of that session, sometimes a teammate months later. That reader acts on what the document says and cannot ask a follow-up question. These rules make a document survive that reading.

They apply to every artifact the skills write: briefs, tasks, plans, domain models, designs, decisions, walkthroughs, review briefs, and finding ledgers.

`references/nlspec.md` in this skill decides **what belongs in** an intent or work item. This file decides **how any specsmd document is written**.

## Write for a reader with no history

Every document stands alone. State its facts in full each time, because the reader has no access to the conversation, the earlier draft, or the session that decided anything.

- Name the thing instead of pointing at it: "the bolt's recipe snapshot", not "the one picked earlier".
- Spell out a term or abbreviation the first time it appears on the page, including the ones that feel obvious while writing.
- Point to another document by full path when it settles something. Do not restate it from memory — restatements drift and then contradict.

Finish by reading the document as a stranger and asking one question: **does this stand alone?** Writing suffers from the curse of knowledge — an author cannot see the context they never wrote down, so the gap is invisible until this reread.

## Say what to do

Phrase guidance as the action to take. "Keep the caller's field names stable" is followed and remembered more reliably than "Do not rename the caller's fields", because a prohibition tells the reader where not to go while leaving the destination unnamed.

State a prohibition when the wrong path is genuinely tempting and naming it is the clearest way to close it — then give the action alongside it, so the reader leaves with somewhere to go.

## Choose the wording's slant on purpose

A reader infers the goal from how a request is phrased and pursues that inferred goal rather than the literal words. Three phrasings of one request produce three different searches:

- "Confirm the changes are OK" — the reader hunts for reasons to approve.
- "Find the issues in the changes" — the reader hunts for problems, and under pressure invents them when none exist.
- "Review the changes for issues" — neutral direction.

Default to the neutral form. Choose a slanted one when one kind of error costs more than the other: a review brief may lean toward discovery, because a missed defect ships and a wasted look does not. Lean deliberately, and only that far.

## Give the reason with the rule

A rule carrying its reason survives the situations it did not anticipate. "Leave `brief.md` unchanged during implement — it is the approved outcome, and editing it moves the target after the fact" tells the reader what to do in a case the rule never mentioned. "Leave `brief.md` unchanged" leaves them guessing, and a guessing reader picks the reading that suits the moment.

## Use few examples, and balance them

Readers over-rotate on examples: an example reads as the menu of allowed answers rather than as one illustration of a principle. State the principle first and let it carry the weight.

When an example makes the principle concrete, give a matched pair — one that follows the rule, one that does not — and say plainly that it illustrates the rule rather than bounding it.

## Name where each claim comes from

Every claim carries its authority: the brief line, a Definition of Done criterion, a standard, a recorded decision, a command's output, a file and line, or the user's own words. Once a specified requirement and an agent's guess are both prose on the page, no reader can tell them apart — and an unmarked guess becomes a requirement the next agent implements.

Mark inference as inference: "the brief does not name a limit; this plan assumes ten and records it under Named freedoms." An assumption that is labeled can be corrected. One that reads as fact cannot.

## Remove by deleting

When a decision changes, delete the line that stated the old one. Writing "Do not notify the caller" under an existing "Notify the caller" leaves both in front of the reader with nothing marking which is current, and readers resolve that by choosing one.

This governs **prescriptive** documents — briefs, tasks, plans, designs, standards — where only the current rule matters.

Records of what happened are **append-only**: walkthroughs, decisions, and `review-findings.md` keep every earlier entry, because the history is the value. Correct a record by adding the correction with its date and disposition, never by editing the entry it corrects.

## Voice

Follow the Voice rules in `references/nlspec.md` in this skill: declarative present tense, each term defined once, each fact in exactly one place. Prefer plain words to jargon — the reader may not share the vocabulary — and cut any sentence that does work another sentence already did.
