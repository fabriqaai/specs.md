# Stack — PLAN_ID `2040fa95`

Remote: `https://github.com/fabriqaai/specs.md.git`  
Assembly: plain git (no Graphite). Parent of PR1: `main-v2` @ `17c92386e343e9555678826921e16f347333e0bf`.  
Ancestry: `main-v2` ⊂ PR1 ⊂ PR2 ⊂ … ⊂ PR9. Local and origin SHAs matched when this was written.

## Branches (open these on the new machine)

| # | Branch | Tip | Lands |
|---|---|---|---|
| 1 | `execute-plan/2040fa95-pr-1-evals-and-verifiers` | `6e332fc` | 000 evals harness + holdout CI |
| 2 | `execute-plan/2040fa95-pr-2-flow-contract-four-recipes-state-scripts` | `11679e7` | 001 + 002 + 003; includes foundation commit `3109239` |
| 3 | `execute-plan/2040fa95-pr-3-integrity-validator` | `9045b7f` | 004 |
| 4 | `execute-plan/2040fa95-pr-4-planning-execution-and-navigator-skills` | `82e2ee3` | 005 + 006 + 007 |
| 5 | `execute-plan/2040fa95-pr-5-standards-system` | `8959905` | 008 |
| 6 | `execute-plan/2040fa95-pr-6-memory-lifecycle` | `6d5373e` | 011 |
| 7 | `execute-plan/2040fa95-pr-7-slim-release-step` | `e377b4d` | 012 |
| 8 | `execute-plan/2040fa95-pr-8-plugin-packaging` | `9151310` | 009 |
| 9 | `execute-plan/2040fa95-pr-9-v2-documentation` | `693c8eb` | 010 + stacked test-align fix |

Full SHAs:

```
6e332fc9feefae82df7f0e994a815f6060962203  pr-1
11679e7d2899dd1c8414a35f1a2e23973b14e48f  pr-2
9045b7fc45275abca02e13aa812a083eda89413b  pr-3
82e2ee3da9cc0618f1633223b75679f22fce86b7  pr-4
895990508e54b2620258cef1822e5e729fa1a4f1  pr-5
6d5373ef7dcd25772b5247906362e3632b118812  pr-6
e377b4daacd34ee2b4de8e0dc8afede17a910691  pr-7
915131084a793708957d46782a0d33b900fa2d64  pr-8
693c8eb2bff180252760cd3280cfa18a5a64750e  pr-9
```

## Commits unique to each step

```
pr1: 75911a4 feat: add flow evals harness and holdout isolation
     6e332fc fix: address review feedback for evals harness

pr2: 3109239 wip: unified plugin foundation for execute-plan implementers
     74c29ec feat: land flow contract, four recipes, and state scripts
     11679e7 fix: address review feedback for flow contract and state scripts

pr3: cd190ab feat: add artifact integrity validator
     ec545c2 fix: address review feedback for integrity validator
     9045b7f fix: remediate last-stage stale bolts with complete-bolt

pr4: fccc0ba feat: complete planning, execution, and navigator skills
     b9fc6d3 fix: address review feedback for planning and execution skills
     82e2ee3 fix: preflight relink-work-item before any write

pr5: da060c8 feat: add hierarchical standards system
     8959905 fix: address review feedback for standards system

pr6: 3e50fd8 feat: add memory lifecycle for system truth and episodic history
     6d5373e fix: address review feedback for memory lifecycle

pr7: e377b4d feat: add slim release checklist and verify step

pr8: 251cb6a feat: package the self-contained specsmd plugin
     9151310 fix: address review feedback for plugin packaging

pr9: 1a7f5a8 docs: add v2 unified bolt flow documentation
     693c8eb fix: align stacked memory and skills tests after merge
```

## Compare URLs (no PRs exist yet)

1. https://github.com/fabriqaai/specs.md/compare/main-v2...execute-plan/2040fa95-pr-1-evals-and-verifiers?expand=1
2. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-1-evals-and-verifiers...execute-plan/2040fa95-pr-2-flow-contract-four-recipes-state-scripts?expand=1
3. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-2-flow-contract-four-recipes-state-scripts...execute-plan/2040fa95-pr-3-integrity-validator?expand=1
4. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-3-integrity-validator...execute-plan/2040fa95-pr-4-planning-execution-and-navigator-skills?expand=1
5. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-4-planning-execution-and-navigator-skills...execute-plan/2040fa95-pr-5-standards-system?expand=1
6. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-5-standards-system...execute-plan/2040fa95-pr-6-memory-lifecycle?expand=1
7. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-6-memory-lifecycle...execute-plan/2040fa95-pr-7-slim-release-step?expand=1
8. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-7-slim-release-step...execute-plan/2040fa95-pr-8-plugin-packaging?expand=1
9. https://github.com/fabriqaai/specs.md/compare/execute-plan/2040fa95-pr-8-plugin-packaging...execute-plan/2040fa95-pr-9-v2-documentation?expand=1

## Create draft PRs (only if the human asks)

Run **in this order**. Sequential. Base of each is the previous branch.

```bash
gh pr create --base main-v2 --head execute-plan/2040fa95-pr-1-evals-and-verifiers --fill --draft
gh pr create --base execute-plan/2040fa95-pr-1-evals-and-verifiers --head execute-plan/2040fa95-pr-2-flow-contract-four-recipes-state-scripts --fill --draft
gh pr create --base execute-plan/2040fa95-pr-2-flow-contract-four-recipes-state-scripts --head execute-plan/2040fa95-pr-3-integrity-validator --fill --draft
gh pr create --base execute-plan/2040fa95-pr-3-integrity-validator --head execute-plan/2040fa95-pr-4-planning-execution-and-navigator-skills --fill --draft
gh pr create --base execute-plan/2040fa95-pr-4-planning-execution-and-navigator-skills --head execute-plan/2040fa95-pr-5-standards-system --fill --draft
gh pr create --base execute-plan/2040fa95-pr-5-standards-system --head execute-plan/2040fa95-pr-6-memory-lifecycle --fill --draft
gh pr create --base execute-plan/2040fa95-pr-6-memory-lifecycle --head execute-plan/2040fa95-pr-7-slim-release-step --fill --draft
gh pr create --base execute-plan/2040fa95-pr-7-slim-release-step --head execute-plan/2040fa95-pr-8-plugin-packaging --fill --draft
gh pr create --base execute-plan/2040fa95-pr-8-plugin-packaging --head execute-plan/2040fa95-pr-9-v2-documentation --fill --draft
```

Do **not** merge from the agent. Merging is a human decision.

## Design doc and work items

On the **tip** (`pr-9`):

- Plan: `docs/specsmd/decisions/002-unified-flow-pr-plan.md`
- Plugin decision: `docs/specsmd/decisions/001-self-contained-plugin.md`
- Work items: `docs/specsmd/intents/001-unified-bolt-flow/work-items/000` … `012`
- Sufficiency reports that exist: `docs/specsmd/intents/001-unified-bolt-flow/sufficiency/000` … `003` (000 is the controversial “cleared”)

On **current `main-v2`** (without checking out the tip): work items and the nlspec exist; `002-unified-flow-pr-plan.md` and `plugins/specsmd/` do **not**.

## File-count deltas (each vs its parent)

| PR | Files | Lines |
|---|---|---|
| 1 | 18 | +2335 |
| 2 | 74 | +4624 / −11 |
| 3 | 11 | +1229 / −54 |
| 4 | 22 | +895 / −72 |
| 5 | 17 | +1942 / −9 |
| 6 | 20 | +2220 / −16 |
| 7 | 16 | +1140 / −9 |
| 8 | 8 | +201 / −20 |
| 9 | 12 | +1209 / −101 |

## Review notes that affected the stack

During assembly, later PRs had to combine `status.cjs` / contract YAML / bolt skills (integrity + standards + memory + release). Tip needed a last commit (`693c8eb`) because stacked tests expected `ORPHAN_WORK_ITEM` while the validator emits `ORPHAN_REF`, and `changeRecords` had to include `'release'`.

Holdout hole: `src/__tests__/evals/` is **neither** `evals/` **nor** `plugins/specsmd/`. PR2 and PR8 legally edited those tests in the same commit as the plugin.

## How to inspect one PR on the new machine

```bash
git fetch origin
git checkout execute-plan/2040fa95-pr-1-evals-and-verifiers
git log --oneline origin/main-v2..HEAD
# or the tip:
git checkout execute-plan/2040fa95-pr-9-v2-documentation
cd src && npm ci && npm run test
```
