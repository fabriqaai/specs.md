# Vibe-Coded Prototype to Specification Migration: Flow Options

> **Research Date**: 2025-12-09
> **Author**: specsmd research
> **Method**: Sequential Thinking Analysis (13 steps)
> **Status**: Proposal - Awaiting Selection

---

## Executive Summary

This document presents three flow options for enabling the transition from vibe-coded prototypes to production-ready specifications within specsmd. The research synthesizes current industry practices (2025), academic papers, and competitive analysis against existing tools (GitHub Spec Kit, AWS Kiro, Tessl).

**Key Finding**: The 2025 software development landscape has shifted from "vibe coding" to "context engineering." specsmd has an opportunity to bridge this gap by supporting both forward (explore-first) and backward (extract-from-code) workflows.

**Recommendation**: Implement **Sandbox Flow** as primary, with **Crystallize** as a companion capability.

---

## Part 1: Industry Landscape Analysis (2025)

### The Rise and Reality of Vibe Coding

**Origin**: Computer scientist Andrej Karpathy coined "vibe coding" in February 2025, describing it as "fully giving in to the vibes, embracing exponentials, and forgetting that the code even exists."

**Adoption**:
- 25% of Y Combinator's Winter 2025 batch has codebases that are 95% AI-generated
- Named Collins Dictionary's Word of the Year for 2025
- 90% of software professionals now rely on AI tools (2025 DORA report)

**Critical Problems Exposed**:
- 45% of vibe-coded projects contain security vulnerabilities (Veracode)
- 70%+ failure rate in Java environments
- "Vibe coding hangover" reported by Fast Company (September 2025)
- Karpathy himself stopped using it for his serious project (Nanochat was "basically entirely hand-written")

> "When vibe coding breaks down, you're left with no tests, no documentation, no architectural plan—just AI-generated code nobody fully understands."
> — [RedMonk Analysis](https://redmonk.com/rstephens/2025/07/31/spec-vs-vibes/)

### The Spec-Driven Development Response

Three major tools emerged to address vibe coding's limitations:

| Tool | Approach | Key Innovation | Weakness |
|------|----------|----------------|----------|
| **GitHub Spec Kit** (Sept 2025) | Agent-agnostic templates | Constitution → Specify → Plan → Tasks → Implement | Doesn't handle existing code |
| **AWS Kiro** | IDE-integrated SDD | EARS notation, property-based testing | Locked to single IDE |
| **Tessl** ($125M funding) | Spec-as-source | Spec Registry (10,000+ specs), code is generated output | Radical paradigm shift |

### The Context Engineering Evolution

> "2025 has seen a significant shift in the use of AI in software engineering—a loose, vibes-based approach has given way to a systematic approach to managing how AI systems process context."
> — [MIT Technology Review](https://www.technologyreview.com/2025/11/05/1127477/from-vibe-coding-to-context-engineering-2025-in-software-development/)

**Key Insight**: Context engineering treats context as a "first-class system with its own architecture, lifecycle, and constraints." This includes:
- Data, metadata, and memory structures
- Compaction (summarizing context at window limits)
- Structured context injection from codebases

---

## Part 2: Academic Research Synthesis

### Code-to-Specification Extraction

**Reverse Engineering User Stories from Code using LLMs**
[arXiv:2509.19587](https://arxiv.org/abs/2509.19587) (September 2025)

- **Result**: F1 score of 0.8 for code up to 200 NLOC
- **Key Finding**: 8B model matches 70B performance with single example (one-shot learning)
- **Implication**: Specification extraction from code is feasible and efficient

**Generating Software Architecture Description from Source Code**
[arXiv:2511.05165](https://arxiv.org/abs/2511.05165) (November 2025)

- Combines reverse engineering with LLM capabilities
- Extracts component diagrams and state machine diagrams
- "Scalable and maintainable alternative to traditional manual architectural documentation"

### AI-Native Development Lifecycle Models

**The AI-Native SDLC: V-Bounce Model**
[arXiv:2408.03416](https://arxiv.org/abs/2408.03416) (August 2024)

- AI integrated in every phase from planning to deployment
- Reduces time in implementation phases
- **Paradigm shift**: Humans become validators/verifiers, AI becomes implementation engine
- Emphasis shifts to requirements gathering, architecture design, continuous validation

**Lifecycle-Aware Code Generation**
[arXiv:2510.24019](https://arxiv.org/abs/2510.24019) (October 2025)

- Four sequential stages: Requirements → Architecture → Pseudocode → Code
- **Result**: 75% improvement in code correctness with lifecycle-level fine-tuning
- State machine modeling yields most substantial impact
- Each intermediate artifact contributes distinctly to final quality

### Multi-Agent Development Frameworks

**FlowGen/SOEN-101**: Emulates Waterfall, TDD, Scrum with role-based agents (requirement engineer, architect, developer, tester)

**ALMAS**: Orchestrates agents as product managers, sprint planners, developers, testers, reviewers

---

## Part 3: Flow Options

### Option 1: Crystallize Flow (Reverse Engineering Approach)

#### Philosophy
> "Extract before you build more"

Treats vibe-coded prototypes as **discovery artifacts** and systematically extracts specifications from working code—running AI-DLC in reverse.

#### Three Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | **Capture** | Analyze existing vibe-coded prototype |
| 2 | **Crystallize** | Extract specifications from code |
| 3 | **Validate** | Confirm specs match intent, promote to AI-DLC |

#### Agents & Skills

**Prototype Analyzer Agent**
- `codebase-scan` - Inventory files, dependencies, architecture
- `behavior-extract` - Generate user stories from code (F1=0.8 validated)
- `architecture-reverse` - Extract SADs from source
- `domain-discover` - Identify bounded contexts, entities, aggregates

**Specification Generator Agent**
- `intent-synthesize` - Create intent from extracted behaviors
- `requirements-generate` - Generate requirements.md from code analysis
- `story-extract` - Convert code paths to user stories with acceptance criteria
- `unit-propose` - Suggest unit decomposition based on code structure

#### Workflow

```
Vibe-Coded Prototype
        ↓
  [Capture Phase]
  - Scan codebase structure
  - Identify architectural patterns
  - Extract behavioral models
        ↓
  [Crystallize Phase]
  - Generate intent definition
  - Extract requirements from behaviors
  - Create user stories from code paths
  - Propose unit decomposition
        ↓
  [Validate Phase]
  - Human reviews extracted specs
  - Confirms/modifies intent alignment
  - Approves for production track
        ↓
  → AI-DLC Inception (specs already exist!)
  → AI-DLC Construction (rebuild properly)
```

#### Memory Bank Extension

```
memory-bank/
├── crystallized/                 # NEW: Reverse-engineered projects
│   └── {project-name}/
│       ├── capture-report.md     # Initial analysis results
│       ├── extracted-behaviors/  # Discovered behaviors
│       ├── extracted-architecture.md
│       └── proposed-specs/       # Generated specifications
│           ├── intent.md
│           ├── requirements.md
│           └── units/
├── intents/                      # Validated specs promote here
```

#### Best For
- Legacy vibe-coded projects needing documentation
- Projects that grew organically without specs
- Teams wanting to understand "what we actually built"
- "Rescue" operations for production-bound prototypes

---

### Option 2: Sandbox Flow (Dual-Track Approach) [RECOMMENDED]

#### Philosophy
> "Explore fast, specify what works"

Runs **exploration and specification in parallel**, with explicit gates between sandbox experimentation and production-track development. Directly implements the "Explore → Specify → Engineer" cycle.

#### Three Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | **Sandbox** | Rapid vibe-coded exploration (explicit throwaway) |
| 2 | **Distill** | Extract learnings into specifications |
| 3 | **Promote** | Hand off to AI-DLC for production build |

#### Agents & Skills

**Sandbox Agent**
- `experiment-start` - Create isolated sandbox environment
- `prototype-build` - Vibe-code with explicit "throwaway" framing
- `insight-capture` - Document discoveries during exploration
- `experiment-conclude` - Summarize what was learned

**Distillation Agent**
- `learning-extract` - Convert sandbox insights to specs
- `pattern-identify` - Recognize reusable patterns from prototypes
- `anti-pattern-flag` - Mark approaches that didn't work
- `spec-draft` - Generate AI-DLC compatible specifications

#### Workflow

```
New Idea/Feature Request
        ↓
  [Sandbox Phase] ← Can iterate multiple times
  - Spin up sandbox environment
  - Vibe-code rapidly (explicit throwaway)
  - Capture insights as you go
  - Conclude when you've learned enough
        ↓
  [Distill Phase]
  - Review sandbox artifacts
  - Extract patterns and anti-patterns
  - Draft specifications from learnings
  - Create AI-DLC intent structure
        ↓
  [Promote Phase]
  - Human approval gate
  - Move specs to memory-bank/intents/
  - Archive or delete sandbox code
        ↓
  → AI-DLC Inception (specs already drafted!)
  → AI-DLC Construction (rebuild properly)
```

#### Memory Bank Extension

```
memory-bank/
├── sandboxes/                    # NEW: Sandbox experiments
│   └── {experiment-name}/
│       ├── experiment.md         # Hypothesis, approach, outcome
│       ├── insights/             # Captured learnings
│       │   ├── insight-001.md
│       │   └── insight-002.md
│       ├── prototype/            # Throwaway code (gitignored)
│       └── distillation.md       # Extracted specs ready for promotion
├── intents/                      # Promoted experiments become intents
│   └── {promoted-from-sandbox}/
```

#### Best For
- Greenfield projects exploring new domains
- Teams that want to "try before they specify"
- Innovation projects with uncertain requirements
- Learning-focused development

#### Why This Option is Recommended

1. **Direct alignment** with "Explore → Specify → Engineer" thesis
2. **Embraces vibe coding** for discovery (doesn't fight the trend)
3. **Clear separation** between throwaway and production code
4. **Natural AI-DLC integration** (promotes to Inception)
5. **Captures learnings** that would otherwise be lost
6. **Matches Thoughtworks findings**: Structure + feedback = quality

---

### Option 3: Lifecycle-Aware Flow (Graduated Rigor Approach)

#### Philosophy
> "Right level of rigor for each stage"

Uses **graduated specification levels** that increase as code moves toward production. Based on V-Bounce model and lifecycle-aware code generation research.

#### Four Phases

| Phase | Spec Level | Code Quality | Purpose |
|-------|------------|--------------|---------|
| 1 | **Sketch** | L0: Idea | Throwaway | Rapid ideation |
| 2 | **Draft** | L1: Functional Spec | Working prototype | Validate concept |
| 3 | **Refine** | L2: Technical Spec | Tested code | Prepare for production |
| 4 | **Harden** | L3: Full AI-DLC | Production-ready | Ship with confidence |

#### Agents & Skills

**Sketch Agent (L0)**
- `idea-capture` - Natural language description only
- `quick-prototype` - Vibe-code without constraints
- `viability-assess` - Quick check: worth pursuing?

**Draft Agent (L1)**
- `functional-spec-generate` - Create user stories from prototype
- `acceptance-criteria-draft` - Define "what done looks like"
- `prototype-refactor` - Clean up code minimally

**Refine Agent (L2)**
- `technical-spec-generate` - Architecture, APIs, schemas
- `test-suite-add` - Add automated tests
- `code-review-ai` - AI reviews for patterns/anti-patterns

**Harden Agent (L3)**
- `ai-dlc-bridge` - Generate full AI-DLC artifacts
- `production-checklist` - Security, performance, observability
- `documentation-generate` - ADRs, runbooks, API docs

#### Quality Gates

```
L0 → L1: "Does this solve a real problem?"
L1 → L2: "Is this worth building properly?"
L2 → L3: "Is this ready for production?"
```

#### Workflow

```
New Idea
    ↓
[Sketch - L0]
- Capture idea in natural language
- Vibe-code quick prototype
- Assess: Worth pursuing?
    ↓ (if yes)
[Draft - L1]
- Generate functional spec from prototype
- Define acceptance criteria
- Clean up prototype minimally
- Gate: Worth building properly?
    ↓ (if yes)
[Refine - L2]
- Generate technical specification
- Add test coverage
- AI code review
- Gate: Ready for production?
    ↓ (if yes)
[Harden - L3]
- Generate full AI-DLC artifacts
- Production readiness checklist
- Generate documentation
    ↓
→ AI-DLC Operations (deploy)
```

#### Memory Bank Extension

```
memory-bank/
├── lifecycle/                    # NEW: Graduated artifacts
│   └── {project-name}/
│       ├── L0-sketch/
│       │   ├── idea.md
│       │   └── prototype/
│       ├── L1-draft/
│       │   ├── functional-spec.md
│       │   └── prototype/
│       ├── L2-refine/
│       │   ├── technical-spec.md
│       │   ├── code/
│       │   └── tests/
│       └── L3-harden/
│           └── → promoted to intents/
├── intents/                      # L3 projects graduate here
```

#### Best For
- Teams that want flexibility in rigor levels
- Projects where not everything needs full AI-DLC treatment
- Organizations transitioning from vibe-coding to structured development
- Mixed-maturity portfolios

---

## Part 4: Comparison & Analysis

### Feature Comparison Matrix

| Aspect | Crystallize | Sandbox | Lifecycle-Aware |
|--------|-------------|---------|-----------------|
| **Starting Point** | Existing vibe-coded code | New idea | New idea |
| **Primary Direction** | Code → Specs (reverse) | Parallel exploration | Forward with gates |
| **Throwaway Code** | Analyzes and documents | Explicit sandbox | Gradually hardens |
| **AI-DLC Integration** | Outputs to Inception | Promotes to Inception | Builds incrementally |
| **Phases** | 3 | 3 | 4 |
| **Complexity** | Medium | Medium | High |
| **Article Alignment** | Moderate | **High** | High |
| **Handles Legacy** | **Yes** | No | No |

### Competitive Differentiation

| vs. Competitor | specsmd Advantage |
|----------------|----------------------|
| **GitHub Spec Kit** | Bi-directional (forward + backward), multi-tool (11+) |
| **AWS Kiro** | Tool-agnostic, not locked to single IDE |
| **Tessl** | Gradual transition, not radical paradigm shift |

### Unique Value Proposition

> "specsmd bridges the gap between vibe-coded exploration and production-ready specifications, supporting both forward (explore-first) and backward (extract-from-code) workflows across any AI coding tool."

---

## Part 5: Recommendation

### Primary Flow: Sandbox Flow

**Rationale**:
1. Directly implements "Explore → Specify → Engineer" cycle from user's article
2. Matches 2025 industry reality (vibe coding is here to stay for exploration)
3. Natural integration with existing AI-DLC architecture
4. Lower complexity than Lifecycle-Aware while achieving same goals
5. Captures learnings that would otherwise be lost

### Companion Capability: Crystallize

**Rationale**:
1. Addresses "rescue" problem for existing vibe-coded projects
2. Research-validated (F1=0.8 for user story extraction)
3. Complements Sandbox Flow (backward vs forward direction)
4. High value for brownfield scenarios

### Implementation Roadmap

**Phase 1: Sandbox Flow (Core)**
- sandbox-agent.md
- distillation-agent.md
- Skills: experiment-start, insight-capture, learning-extract, spec-draft
- Memory bank: sandboxes/
- Templates: experiment.md, insight.md, distillation.md

**Phase 2: Crystallize Capability (Add-on)**
- crystallize-agent.md
- Skills: codebase-scan, behavior-extract, requirements-generate
- Memory bank: crystallized/
- Integration with Sandbox → promote both to AI-DLC Inception

**Phase 3: Tool Integration**
- GitHub Spec Kit .specify/ format compatibility
- Kiro requirements.md/design.md/tasks.md output
- MCP integration for Tessl compatibility

---

## Part 6: Additional Considerations

### Naming Alternatives

"Sandbox" may conflict with existing terminology. Consider:
- **Explore Flow** - matches article terminology
- **Discovery Flow** - emphasizes learning aspect
- **Spike Flow** - familiar to agile teams

### Quality Metrics to Track

| Metric | Description |
|--------|-------------|
| Exploration Efficiency | Time from idea to working prototype |
| Distillation Efficiency | Time from prototype to specification |
| Specification Quality | Completeness, clarity, testability |
| Production Quality Delta | Code quality post-AI-DLC vs original prototype |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Teams skip distillation | Explicit gates/warnings for this anti-pattern |
| Prototype decay | Warnings after X days without distillation |
| Insight loss | Structured insight capture during exploration |

---

## References

### Academic Papers

1. [arXiv:2509.19587](https://arxiv.org/abs/2509.19587) - Reverse Engineering User Stories from Code using LLMs (F1=0.8)
2. [arXiv:2511.05165](https://arxiv.org/abs/2511.05165) - Generating Software Architecture Description from Source Code
3. [arXiv:2408.03416](https://arxiv.org/abs/2408.03416) - AI-Native SDLC V-Bounce Model
4. [arXiv:2510.24019](https://arxiv.org/abs/2510.24019) - Lifecycle-Aware Code Generation (75% improvement)
5. [arXiv:2409.06741](https://arxiv.org/abs/2409.06741) - Generative AI for Requirements Engineering: Systematic Review

### Industry Sources

- [Vibe Coding - Wikipedia](https://en.wikipedia.org/wiki/Vibe_coding)
- [Karpathy's Original Tweet](https://x.com/karpathy/status/1886192184808149383)
- [GitHub Spec Kit Repository](https://github.com/github/spec-kit)
- [GitHub Blog - Spec-Driven Development](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [AWS Kiro Documentation](https://kiro.dev/docs/specs/)
- [Kiro Introduction Blog](https://kiro.dev/blog/introducing-kiro/)
- [Tessl Platform](https://tessl.io/)
- [Martin Fowler - SDD Tools Analysis](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Thoughtworks - Can Vibe Coding Produce Production-Grade Software](https://www.thoughtworks.com/insights/blog/generative-ai/can-vibe-coding-produce-production-grade-software)
- [MIT Technology Review - Vibe Coding to Context Engineering](https://www.technologyreview.com/2025/11/05/1127477/from-vibe-coding-to-context-engineering-2025-in-software-development/)
- [Anthropic - Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Spotify Engineering - Context Engineering for Coding Agents](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2)
- [RedMonk - Vibe Coding vs Spec-Driven Development](https://redmonk.com/rstephens/2025/07/31/spec-vs-vibes/)
- [InfoQ - Beyond Vibe Coding: Kiro](https://www.infoq.com/news/2025/08/aws-kiro-spec-driven-agent/)
- [Augment Code - Vibe Coding & Spec-Driven Dev](https://www.augmentcode.com/guides/ai-prompting-techniques-vibe-coding-spec-driven-dev)

### User Article

- [The AI-Native Way of Building (cengizhan.com)](https://www.cengizhan.com/p/the-ai-native-way-of-building)

---

## Next Steps

1. **Select preferred option** (Sandbox recommended, with Crystallize companion)
2. **Define detailed agent specifications** following AI-DLC agent patterns in `/src/flows/aidlc/agents/`
3. **Design memory bank schema** for new flow artifacts
4. **Create skill implementations** in `/src/flows/{flow-name}/skills/`
5. **Build templates** for new artifact types
6. **Implement installer support** for the new flow

---

*This research document was generated using Sequential Thinking analysis (13 steps) and is part of the specsmd project, implementing AI-native development workflows.*

*Last updated: 2025-12-09*
