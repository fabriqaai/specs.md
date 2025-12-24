# Unified Model: Legacy Modernization + Vibe-to-Spec Conversion

> **Research Date**: 2025-12-09
> **Author**: specsmd research
> **Method**: Sequential Thinking Analysis with Web Search (8 steps)
> **Focus**: Single model for both legacy modernization and vibe-coded prototype conversion

---

## Executive Summary

### The Core Insight

**Legacy modernization and vibe-coding-to-spec conversion are fundamentally the SAME problem:**

| Scenario | What You Have | What You Want | Core Challenge |
|----------|---------------|---------------|----------------|
| **Legacy Modernization** | Old code without specs | Continue with AI-native principles | Preserve embedded business knowledge |
| **Vibe-to-Spec Conversion** | New code without specs | Continue with AI-native principles | Preserve discovered domain knowledge |

**Both cases share:**
- Existing code without formal specifications
- Embedded domain knowledge that must be preserved
- Desire to adopt spec-driven development going forward
- Need for incremental adoption without disruption
- Risk of losing work already done

### The Unified Model: "Code Archaeology → Living Specification"

```
ANY Existing Codebase (Legacy OR Vibe-Coded)
                ↓
    [1. UNDERSTAND] - Code Archaeology
                ↓
    [2. EXTRACT] - Specification Mining
                ↓
    [3. CRYSTALLIZE] - Living Specification
                ↓
    [4. EVOLVE] - Incremental AI-DLC Adoption
                ↓
Production-Ready, Spec-Driven System
```

---

## Part 1: The Research Foundation

### Why This Unification Works

**Key Research Finding** (ACE Paper, arXiv:2507.03536):
> "The bottleneck in software development is not writing code but understanding it; program understanding consumes approximately 70% of developers' time."

This is true for BOTH:
- **Legacy systems**: Developers must understand decades-old code
- **Vibe-coded prototypes**: Even the original author struggles to understand AI-generated code

**Comprehension-Performance Gap** (arXiv:2511.02922):
> "Copilot significantly reduced task time and increased test cases passed. However, comprehension scores did not differ across conditions, revealing a comprehension-performance gap."

Implication: Vibe coding produces code quickly but doesn't build understanding. This makes vibe-coded projects similar to legacy systems - the knowledge is IN the code, not in anyone's head.

### The "Software Archaeology" Paradigm

From Wikipedia and industry practice:
> "Software archaeology is the study of poorly documented or undocumented legacy software implementations. By the 2020s, AI-driven tools adapting large language models enabled automated pattern recognition, documentation generation, and behavioral analysis of undocumented systems."

**This applies equally to:**
- 30-year-old COBOL systems
- 3-week-old vibe-coded prototypes

Both are "undocumented software requiring archaeology."

---

## Part 2: The Unified Model Architecture

### Phase 1: UNDERSTAND (Code Archaeology)

**Objective**: Build comprehensive understanding of the existing codebase

**Sub-phases**:

```
1.1 STRUCTURAL ANALYSIS
    - Dependency graph extraction (RefExpo approach)
    - Component identification
    - Architecture recovery

1.2 BEHAVIORAL ANALYSIS
    - Execution trace analysis
    - Runtime behavior capture
    - API contract discovery

1.3 KNOWLEDGE MAPPING
    - Domain entity identification
    - Business logic flow extraction
    - Technical debt assessment
```

**Academic Foundation**:

| Technique | Paper | Application |
|-----------|-------|-------------|
| Repository-level understanding | LoCoBench-Agent (arXiv:2511.13998) | Evaluate understanding across 2K-41K LOC projects |
| Code comprehension | CodeMap (arXiv:2504.04553) | Hierarchical visualization for cognition support |
| Architecture extraction | ExArch (arXiv:2511.02434) | LLM-assisted component extraction from code |
| Dependency analysis | RefExpo (arXiv:2407.02620) | Unveiling software project structures |

**Output Artifacts**:
- `understanding-report.md` - Comprehensive codebase analysis
- `architecture-diagram.md` - Recovered architecture
- `domain-map.md` - Identified domain concepts
- `knowledge-graph/` - Structured representation

### Phase 2: EXTRACT (Specification Mining)

**Objective**: Mine specifications from code behavior and structure

**Sub-phases**:

```
2.1 INTENT EXTRACTION
    - User story recovery from code
    - Requirements inference
    - Business rule identification

2.2 CONTRACT EXTRACTION
    - API specifications
    - Data schemas
    - Validation rules

2.3 BEHAVIOR EXTRACTION
    - Golden test generation
    - Invariant mining
    - Precondition/postcondition synthesis
```

**Academic Foundation**:

| Technique | Paper | Effectiveness |
|-----------|-------|---------------|
| User story recovery | arXiv:2509.19587 | F1 = 0.8 for code up to 200 NLOC |
| Specification synthesis | AutoSpec (arXiv:2404.00762) | 79% automated verification |
| Requirements traceability | LLM Traceability (arXiv:2506.16440) | F1 = 79-80% for doc-to-code |
| Invariant mining | SmCon (arXiv:2403.13279) | 56% speedup with mined specs |
| Intent vs implementation | Seeking Specs (arXiv:2504.21061) | LLMs distinguish intended vs implemented |

**Output Artifacts**:
- `extracted-intent.md` - High-level intent statement
- `extracted-requirements.md` - Functional & non-functional requirements
- `extracted-contracts/` - API and data contracts
- `golden-tests/` - Behavioral test suite

### Phase 3: CRYSTALLIZE (Living Specification)

**Objective**: Transform extracted knowledge into AI-DLC compatible specifications

**Sub-phases**:

```
3.1 SPECIFICATION SYNTHESIS
    - Generate AI-DLC intent from extracted knowledge
    - Create requirements documents
    - Define system context

3.2 UNIT DECOMPOSITION
    - Identify bounded contexts
    - Define unit boundaries
    - Map to existing code modules

3.3 STORY GENERATION
    - Create user stories with acceptance criteria
    - Link to golden tests
    - Establish traceability
```

**Key Innovation**: Bidirectional Traceability

```
Code ←→ Extracted Specs ←→ AI-DLC Specs ←→ Future Code

Every spec element traces back to:
- Original code location
- Golden test that validates it
- Extraction confidence score
```

**Output Artifacts**:
- `memory-bank/intents/{intent}/` - AI-DLC intent structure
- `memory-bank/intents/{intent}/units/` - Unit decomposition
- `memory-bank/intents/{intent}/stories/` - User stories
- `traceability-matrix.md` - Bidirectional trace links

### Phase 4: EVOLVE (Incremental AI-DLC Adoption)

**Objective**: Incrementally adopt spec-driven development while preserving working code

**Sub-phases**:

```
4.1 ADOPTION PLANNING
    - Identify first unit for AI-DLC adoption
    - Define adoption path (rewrite vs refactor vs wrap)
    - Set validation criteria

4.2 INCREMENTAL MIGRATION
    - Apply Strangler Fig pattern
    - Run old and new in parallel
    - Validate behavioral equivalence

4.3 CONTINUOUS EVOLUTION
    - New features through AI-DLC Construction
    - Existing code through incremental crystallization
    - Unified specification management
```

**Adoption Paths**:

| Path | When to Use | Risk Level |
|------|-------------|------------|
| **Rewrite** | Code is unmaintainable, specs are clear | High |
| **Refactor** | Code is maintainable, needs restructuring | Medium |
| **Wrap** | Code works, needs integration | Low |
| **Parallel** | Gradual migration over time | Lowest |

---

## Part 3: Unified vs Separate Approaches

### Why NOT Two Separate Models?

| Aspect | Two Models | Unified Model |
|--------|------------|---------------|
| User learning curve | Learn 2 workflows | Learn 1 workflow |
| Code reuse | Duplicate tools | Shared tooling |
| Edge cases | "Is this legacy or vibe?" | Doesn't matter |
| Maintenance | 2x maintenance burden | Single codebase |
| Consistency | Different outputs | Consistent artifacts |

### The Spectrum of Existing Code

```
Pure Legacy                                              Pure Vibe
(30-year COBOL) ←------------------------→ (Last week's prototype)
        ↑                                          ↑
        |                                          |
    Well-structured                          Ad-hoc structure
    But outdated                             But modern
    Documented (maybe)                       Undocumented
    Domain experts retired                   You wrote it (sort of)
        |                                          |
        +------------------+-------------------+
                           |
                   SAME FUNDAMENTAL PROBLEM
                           |
                   Code without specs
                   Knowledge embedded in code
                   Want to continue working
                   Want spec-driven future
```

---

## Part 4: Academic Paper Appendix

### Code Understanding & Comprehension

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| Understanding Codebase like a Professional | [2504.04553](https://arxiv.org/abs/2504.04553) | CodeMap for hierarchical visualization |
| LoCoBench-Agent | [2511.13998](https://arxiv.org/abs/2511.13998) | Benchmark for 2K-41K LOC projects |
| LongCodeBench | [2505.07897](https://arxiv.org/abs/2505.07897) | 1M context window evaluation |
| How Accurately Do LLMs Understand Code? | [2504.04372](https://arxiv.org/abs/2504.04372) | Code comprehension evaluation framework |
| Comprehension-Performance Gap | [2511.02922](https://arxiv.org/abs/2511.02922) | AI improves speed, not understanding |

### Specification Mining & Extraction

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| Reverse Engineering User Stories | [2509.19587](https://arxiv.org/abs/2509.19587) | F1=0.8 story extraction |
| AutoSpec | [2404.00762](https://arxiv.org/abs/2404.00762) | 79% automated specification synthesis |
| Seeking Specifications | [2504.21061](https://arxiv.org/abs/2504.21061) | Distinguish intended vs implemented |
| SmCon Specification Mining | [2403.13279](https://arxiv.org/abs/2403.13279) | 56% speedup from mined specs |
| Adversarial Specification Mining | [2103.15350](https://arxiv.org/abs/2103.15350) | DICE for spec validation |

### Traceability & Documentation

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| LLMs for Doc-to-Code Traceability | [2506.16440](https://arxiv.org/abs/2506.16440) | F1=79-80% trace links |
| UserTrace | [2509.11238](https://arxiv.org/abs/2509.11238) | Requirements from repositories |
| ExArch | [2511.02434](https://arxiv.org/abs/2511.02434) | Architecture entity recognition |
| LLMs for Requirements Engineering | [2509.11446](https://arxiv.org/abs/2509.11446) | Systematic literature review |

### Legacy Modernization

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| LLMs for Legacy Code Modernization | [2411.14971](https://arxiv.org/abs/2411.14971) | Documentation generation for MUMPS, ALC |
| AI-Driven COBOL to Java | [2504.11335](https://arxiv.org/abs/2504.11335) | $500B market, 60% IT budgets |
| Empowering Application Modernization | [2506.10984](https://arxiv.org/abs/2506.10984) | Human-AI collaboration framework |
| Contemporary Software Modernization | [2407.04017](https://arxiv.org/abs/2407.04017) | 10 research challenges |
| CodeMEnv Migration Benchmark | [2506.00894](https://arxiv.org/abs/2506.00894) | 26.50% pass@1 average |

### Technical Debt & Refactoring

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| ACE: Automated Technical Debt Remediation | [2507.03536](https://arxiv.org/abs/2507.03536) | 70% of time is understanding |
| Reframing Technical Debt | [2505.13009](https://arxiv.org/abs/2505.13009) | Dagstuhl Manifesto |
| LLMs for Automated Refactoring | [2411.04444](https://arxiv.org/abs/2411.04444) | Empirical study |
| AI for Technical Debt Management | [2306.10194](https://arxiv.org/abs/2306.10194) | Comprehensive literature review |

### AI-Native Development

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| AI-Native SDLC: V-Bounce Model | [2408.03416](https://arxiv.org/abs/2408.03416) | AI in every phase |
| SE 3.0: Rise of AI Teammates | [2507.15003](https://arxiv.org/abs/2507.15003) | Agentic software engineering |
| Lost in Code Generation | [2511.02475](https://arxiv.org/abs/2511.02475) | Reverse engineering AI-generated code |
| AI and Agile: XP2025 Workshop | [2508.20563](https://arxiv.org/abs/2508.20563) | Research roadmap |

### Knowledge Transfer & Migration

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| K3Trans | [2503.18305](https://arxiv.org/abs/2503.18305) | Incremental translation with context preservation |
| Migrating Code at Scale (Google) | [2504.09691](https://arxiv.org/abs/2504.09691) | Automated migration at scale |
| MergeNet | [2404.13322](https://arxiv.org/abs/2404.13322) | Knowledge migration across models |
| Knowledge Transfer for Code LLMs | [2308.09895](https://arxiv.org/abs/2308.09895) | High-to-low resource languages |

### Developer Onboarding & Assistance

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| Onboarding Buddy | [2503.23421](https://arxiv.org/abs/2503.23421) | Multi-agent onboarding assistant |
| Human-AI Experience in IDEs | [2503.06195](https://arxiv.org/abs/2503.06195) | Systematic literature review |
| AI Code Assistants at IBM | [2412.06603](https://arxiv.org/abs/2412.06603) | Understanding code is top use case |
| Contextualized AI Coding Assistant | [2311.18452](https://arxiv.org/abs/2311.18452) | Domain-specific assistance |

### Process Mining & Behavior Extraction

| Paper | arXiv ID | Key Contribution |
|-------|----------|------------------|
| Bridging Domain Knowledge & Process Discovery | [2408.17316](https://arxiv.org/abs/2408.17316) | LLMs for process discovery |
| KnowCoder | [2403.07969](https://arxiv.org/abs/2403.07969) | 30,000+ type schema library |
| Process Mining Survey | [2301.10398](https://arxiv.org/abs/2301.10398) | Comprehensive survey |

---

## Part 5: Implementation for specs.md

### Unified Onboarding Flow

```
User arrives with existing codebase
              ↓
     "Import Project" wizard
              ↓
    [Automatic Detection]
    - Is this legacy? (age, tech stack)
    - Is this vibe-coded? (AI patterns, structure)
    - Is this hybrid? (mixed origins)
              ↓
    [SAME PIPELINE regardless of origin]
              ↓
    Phase 1: UNDERSTAND
    - Structural analysis
    - Behavioral analysis
    - Knowledge mapping
              ↓
    Phase 2: EXTRACT
    - Intent extraction
    - Contract extraction
    - Golden test generation
              ↓
    Phase 3: CRYSTALLIZE
    - AI-DLC specification generation
    - Unit decomposition
    - Traceability establishment
              ↓
    Phase 4: EVOLVE
    - Choose adoption path
    - Incremental migration
    - Continuous spec management
              ↓
    User continues with AI-DLC
    (New features via Construction phase)
```

### Agent Architecture

```
specs.md Unified Model
├── Understanding Agents
│   ├── Structure Analyzer Agent
│   ├── Behavior Analyzer Agent
│   └── Knowledge Mapper Agent
│
├── Extraction Agents
│   ├── Intent Extractor Agent
│   ├── Contract Extractor Agent
│   └── Golden Test Generator Agent
│
├── Crystallization Agents
│   ├── Spec Synthesizer Agent
│   ├── Unit Decomposer Agent
│   └── Traceability Builder Agent
│
├── Evolution Agents
│   ├── Adoption Planner Agent
│   ├── Migration Coordinator Agent
│   └── Equivalence Validator Agent
│
└── AI-DLC Agents (existing)
    ├── Master Agent
    ├── Inception Agent
    ├── Construction Agent
    └── Operations Agent
```

### Memory Bank Extension

```
memory-bank/
├── imported/                        # NEW: Imported projects
│   └── {project-name}/
│       ├── origin-analysis.md       # Legacy vs vibe vs hybrid
│       ├── understanding/
│       │   ├── structure-report.md
│       │   ├── behavior-report.md
│       │   └── knowledge-graph/
│       ├── extracted/
│       │   ├── intent.md
│       │   ├── requirements.md
│       │   ├── contracts/
│       │   └── golden-tests/
│       ├── crystallized/
│       │   └── → promoted to intents/
│       └── traceability/
│           └── matrix.md
│
├── intents/                         # AI-DLC intents (existing + crystallized)
├── bolts/                           # AI-DLC bolts
├── standards/                       # Project standards
└── operations/                      # Deployment context
```

### User Choice Points

**1. After UNDERSTAND phase:**
- "This codebase has significant technical debt. What's your priority?"
  - [ ] Modernize architecture first
  - [ ] Extract specs and work with current architecture
  - [ ] Hybrid: extract critical paths, defer rest

**2. After EXTRACT phase:**
- "How do you want to handle the existing code?"
  - [ ] Keep it: Build specs around existing code (wrap)
  - [ ] Refactor it: Use specs to guide restructuring
  - [ ] Replace it: Use specs to rebuild from scratch

**3. After CRYSTALLIZE phase:**
- "Ready to adopt AI-DLC. Where do you want to start?"
  - [ ] New features only (Construction phase for new work)
  - [ ] Specific module (migrate one unit first)
  - [ ] Full migration (strangler fig all units)

---

## Part 6: Key Statistics

### The Scale of the Problem

| Metric | Value | Source |
|--------|-------|--------|
| IT budgets on maintenance | 60% | Gartner 2025 |
| Legacy modernization market | $500 billion | Gartner 2025 |
| Developer time on understanding | 70% | ACE Paper |
| YC startups 95%+ AI-generated | 25% | TechCrunch 2025 |
| GPT-4 repo-level task success | 33.82% | ML-Bench |

### Research Effectiveness

| Technique | Metric | Value |
|-----------|--------|-------|
| User story extraction | F1 score | 0.8 |
| Specification synthesis | Verification rate | 79% |
| Doc-to-code traceability | F1 score | 79-80% |
| Spec mining speedup | Performance gain | 56% |
| Code migration pass@1 | Best LLM | 43.84% |

---

## Part 7: The Unified Value Proposition

### For specs.md

**Single Platform, Any Starting Point**

```
"Whether you're modernizing a 30-year-old COBOL system or
converting last week's vibe-coded prototype, specs.md
provides the same powerful pipeline: Understand → Extract →
Crystallize → Evolve.

One workflow. Any codebase. Spec-driven future."
```

### Key Differentiators

| Competitor | Limitation | specs.md Advantage |
|------------|------------|------------------------|
| GitHub Spec Kit | Forward-only (no existing code) | Bidirectional (any starting point) |
| AWS Kiro | Single IDE lock-in | Tool-agnostic |
| Tessl | Radical paradigm shift | Incremental adoption |
| Traditional modernization | Code-focused | Spec-driven |
| Vibe coding | No specs | Crystallizes specs |

### The Promise

> "You built something. It works. Now you want to do it right.
> specs.md doesn't ask you to throw away your work—it helps
> you understand what you built, extract its essence, crystallize
> it into specifications, and evolve it with AI-native principles.
>
> Legacy or vibe-coded, the path forward is the same."

---

## Conclusion

The research conclusively shows that legacy modernization and vibe-to-spec conversion share the same fundamental challenge: **existing code with embedded knowledge that people want to preserve while adopting spec-driven development**.

The unified model treats ANY existing codebase as input to the same pipeline:
1. **UNDERSTAND** - Code archaeology to build comprehension
2. **EXTRACT** - Specification mining to capture knowledge
3. **CRYSTALLIZE** - Transform to AI-DLC compatible specs
4. **EVOLVE** - Incremental adoption with behavioral validation

This approach is supported by 40+ academic papers showing that code understanding is the primary bottleneck (70% of developer time), specification extraction is feasible (79-80% accuracy), and incremental adoption works (Strangler Fig pattern, golden test validation).

For specs.md, this means: **one workflow, any codebase, spec-driven future**.

---

*This research document synthesizes academic papers on legacy modernization, code comprehension, specification mining, and AI-native development to inform a unified model for specs.md.*

*Last updated: 2025-12-09*
