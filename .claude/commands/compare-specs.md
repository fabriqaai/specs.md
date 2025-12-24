# Compare Specs and Implementation

**Command**: `/compare-specs`

Compare specifications in `specs/` with their corresponding implementations in `src/` to identify gaps, inconsistencies, and missing items.

---

## Comparison Modes

Choose a comparison mode based on what you want to analyze:

### Mode 1: Spec → Implementation (Default)
Find what's documented in specs but missing or inconsistent in implementation.
- Identifies incomplete implementations
- Finds mismatches between spec requirements and actual code

### Mode 2: Implementation → Spec
Find what's implemented but not documented in specs.
- Identifies undocumented features
- Finds implementation details that should be in specs

---

## Process

### Step 1: Identify Scope

Ask the user:

> **What would you like to compare?**
>
> 1. **Specific agent** (e.g., inception-agent, construction-agent, master-agent)
> 2. **Specific feature** (e.g., bolt planning, story creation, estimation)
> 3. **Full system** (compare all specs vs all implementations)
>
> **Direction:**
> - A) Spec → Implementation (find missing implementations)
> - B) Implementation → Spec (find missing documentation)
> - C) Both directions

### Step 2: Locate Files

**Spec locations** (`specs/`):
```
specs/
├── intents/
│   ├── 001-multi-agent-orchestration/
│   │   └── units/
│   │       ├── master-agent/unit-brief.md
│   │       ├── inception-agent/unit-brief.md
│   │       ├── construction-agent/unit-brief.md
│   │       └── operations-agent/unit-brief.md
│   ├── 002-ai-dlc-workflow-engine/
│   └── 003-memory-bank-system/
├── core/
│   ├── architecture.md
│   └── glossary.md
├── flows/aidlc/
│   ├── methodology-notes.md
│   ├── workflow.md
│   └── glossary.md
└── term-mappings.md
```

**Implementation locations** (`src/flows/aidlc/`):
```
src/flows/aidlc/
├── agents/
│   ├── master-agent.md
│   ├── inception-agent.md
│   ├── construction-agent.md
│   └── operations-agent.md
├── commands/
├── .specsmd/
│   ├── skills/
│   │   ├── master/
│   │   ├── inception/
│   │   └── construction/
│   ├── templates/
│   └── memory-bank.yaml
```

### Step 3: Compare Content

For each file pair, analyze:

| Aspect | Check |
|--------|-------|
| **Terminology** | Same terms used consistently? |
| **Features** | All spec features implemented? |
| **Naming conventions** | Match between spec and implementation? |
| **Estimation guidance** | Consistent across both? |
| **Dependencies** | All documented dependencies implemented? |
| **Commands** | All spec commands exist in implementation? |
| **Skills** | All spec skills have implementations? |

### Step 4: Report Findings

Generate a gap analysis report:

```markdown
## Gap Analysis Report

### Comparison: {scope}
- Direction: {Spec → Impl | Impl → Spec | Both}
- Files analyzed: {count}

---

### Gaps Found

#### Missing in Implementation (Spec → Impl)
| Spec | Item | Status |
|------|------|--------|
| inception-agent/unit-brief.md | Global story index | Not implemented |
| ... | ... | ... |

#### Missing in Specs (Impl → Spec)
| Implementation | Item | Status |
|----------------|------|--------|
| inception-agent.md | Naming conventions section | Not documented |
| ... | ... | ... |

#### Inconsistencies
| Location | Spec Says | Implementation Says |
|----------|-----------|---------------------|
| Bolt estimation | Hours only | Uses "1-2 days" |
| ... | ... | ... |

---

### Recommended Actions

1. **High Priority** (blocking or incorrect):
   - { action }

2. **Medium Priority** (missing features):
   - { action }

3. **Low Priority** (documentation polish):
   - { action }

---

### Update Plan

Based on chosen direction:

**If updating specs:**
1. { step }
2. { step }

**If updating implementation:**
1. { step }
2. { step }
```

---

## Example Usage

**User**: `/compare-specs`

**Assistant**:
> What would you like to compare?
> 1. Specific agent
> 2. Specific feature
> 3. Full system
>
> And in which direction?
> A) Spec → Implementation
> B) Implementation → Spec
> C) Both

**User**: `1 - inception-agent, C - both`

**Assistant**: *Reads spec and implementation files, generates gap analysis*

---

## Quick Comparisons

For common comparisons, use these shortcuts:

| Shortcut | Scope |
|----------|-------|
| `/compare-specs agents` | All agent specs vs implementations |
| `/compare-specs skills` | All skill specs vs implementations |
| `/compare-specs memory-bank` | Memory bank spec vs implementation |
| `/compare-specs naming` | Naming conventions consistency |
| `/compare-specs estimation` | Estimation guidance consistency |

---

## Output

After analysis, provide:

1. **Summary**: X gaps found (Y in implementation, Z in specs)
2. **Gap table**: Detailed list of discrepancies
3. **Recommended plan**: Steps to resolve gaps
4. **User choice**: Ask if they want to fix specs, implementation, or both
