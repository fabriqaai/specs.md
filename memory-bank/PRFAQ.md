# specsmd PRFAQ

## Press Release

### specs.md Launches Open-Source AI-DLC Implementation for AI-Native Engineers

**specsmd brings AWS AI-Driven Development Lifecycle to Claude Code, Cursor, and GitHub Copilot**

Today, specs.md announces the release of specsmd, an open-source implementation of AWS's AI-Driven Development Lifecycle (AI-DLC) methodology. This tool enables AI-native engineers to leverage a multi-agent orchestration system that transforms how software is built - from intent capture through deployment.

"Traditional development methods were built for human-driven, long-running processes," said the specs.md team. "AI-DLC reimagines the development lifecycle with AI as a central collaborator, enabling rapid cycles measured in hours or days rather than weeks."

specsmd provides four specialized AI agents - Master, Inception, Construction, and Operations - that guide developers through the complete software lifecycle. Each agent is equipped with domain-specific skills and follows the AI-DLC principle that "AI drives workflows by breaking down high-level intents into actionable tasks, while humans serve as approvers, validating and confirming decisions at critical junctures."

Key features include:

- **Multi-Tool Support**: Works with Claude Code, Cursor, and GitHub Copilot
- **Memory Bank System**: File-based artifact storage for project context
- **Bolt Execution**: Rapid iteration cycles with DDD, TDD, BDD, and Spike bolt types
- **Standards-Driven**: Built-in facilitation for tech-stack, coding standards, and architecture decisions
- **Human Oversight**: Validation points at every stage to catch errors early

specsmd is available now at <https://specs.md> and can be installed via npm.

---

## FAQ

### General

**Q: What is specsmd?**
A: specsmd is an open-source implementation of AWS's AI-Driven Development Lifecycle (AI-DLC) methodology. It provides a multi-agent system that orchestrates the software development process from intent capture through deployment.

**Q: What is AI-DLC?**
A: AI-DLC is a reimagined, AI-native software development methodology created by AWS. It differs from traditional methods by having AI drive workflows and break down high-level intents into actionable tasks, while humans validate and approve decisions. It features three phases: Inception, Construction, and Operations.

**Q: Who is specsmd for?**
A: specsmd is designed for AI-native engineers who want to leverage AI throughout the development lifecycle, not just for code generation. It's suited for building complex systems that demand architectural complexity, trade-off management, and scalability.

**Q: What agentic coding tools are supported?**
A: Currently supported:

- Claude Code (Anthropic)
- Cursor
- GitHub Copilot

### Installation & Setup

**Q: How do I install specsmd?**
A: Install via npx:

```bash
npx specsmd install
```

The installer will detect available agentic coding tools and guide you through setup.

**Q: What gets installed?**
A: specsmd installs:

- Agent definitions (markdown files)
- Skills for each agent
- Templates for artifacts
- Slash commands
- Memory bank structure

**Q: Can I use multiple agentic coding tools?**
A: Yes. During installation, you can select multiple tools and specsmd will install to all of them.

### Agents & Skills

**Q: What agents are available?**
A: Four agents:

1. **Master Agent** - Central orchestrator that analyzes project state and routes to specialist agents
2. **Inception Agent** - Handles requirements, decomposition into units, and story creation
3. **Construction Agent** - Executes bolts through domain design, logical design, code, and test stages
4. **Operations Agent** - Manages deployment, verification, and monitoring

**Q: How do I invoke an agent?**
A: Use slash commands in your agentic coding tool:

- `/specsmd-master-agent` - Master agent
- `/specsmd-inception-agent` - Inception agent
- `/specsmd-construction-agent` - Construction agent
- `/specsmd-operations-agent` - Operations agent

**Q: What are skills?**
A: Skills are focused capabilities within each agent. For example, the Inception Agent has skills for creating intents, gathering requirements, defining system context, decomposing into units, and creating stories.

### AI-DLC Concepts

**Q: What is an Intent?**
A: An Intent is a high-level statement of purpose that encapsulates what needs to be achieved - whether a business goal, feature, or technical outcome. It serves as the starting point for AI-driven decomposition.

**Q: What is a Unit?**
A: A Unit is a cohesive, self-contained work element derived from an Intent. Units are loosely coupled and can be developed and deployed independently. They're analogous to Subdomains in DDD or Epics in Scrum.

**Q: What is a Bolt?**
A: A Bolt is the smallest iteration in AI-DLC, designed for rapid implementation. Unlike Sprints (weeks), Bolts are measured in hours or days. They emphasize intense focus and high-velocity delivery.

**Q: What are the AI-DLC phases?**
A: Three phases:

1. **Inception** - Capture intents, elaborate into stories/NFRs, decompose into units, plan bolts
2. **Construction** - Execute bolts through domain design → logical design → code → test
3. **Operations** - Deploy, verify, and monitor

### Bolt Types

**Q: What bolt types are available?**
A: Two bolt types:

1. **DDD Construction Bolt** - Domain-Driven Design stages (model, design, ADR, implement, test)
2. **Simple Construction Bolt** - Lightweight stages for UI, integrations, utilities (plan, implement, test)

**Q: How do I choose a bolt type?**
A: The Construction Agent recommends bolt types based on the unit's requirements. DDD is default for complex business logic, Simple for UI, integrations, and utilities.

### Memory Bank

**Q: What is the Memory Bank?**
A: The Memory Bank is a file-based storage system for all project artifacts. It maintains context across agent sessions and provides traceability between artifacts.

**Q: What's stored in the Memory Bank?**
A:

- `intents/` - Feature intents and their decomposition
- `bolts/` - Bolt execution instances
- `standards/` - Project standards (tech-stack, coding, architecture)
- `operations/` - Deployment and monitoring context

### Standards

**Q: What standards does specsmd support?**
A: Five standards types:

1. **Tech Stack** - Languages, frameworks, databases, infrastructure
2. **Coding Standards** - Formatting, linting, naming, testing strategy
3. **System Architecture** - Architecture style, API design, state management
4. **UX Guide** - Design system, styling, accessibility
5. **API Conventions** - API style, versioning, response formats

**Q: How are standards created?**
A: The Master Agent's `project-init` skill facilitates guided conversations to establish standards. It uses facilitation guides to help users make informed decisions.

### Human Oversight

**Q: Why is human oversight important in AI-DLC?**
A: Human oversight functions as a "loss function" - catching and correcting errors early before they snowball downstream. Each validation step transforms artifacts into semantically rich context for the next stage.

**Q: Where are the validation points?**
A: Key validation points:

- After requirements elaboration
- After unit decomposition
- After story creation
- After each bolt stage (domain design, logical design, code, test)
- Before deployment

### Comparison

**Q: How is AI-DLC different from Agile/Scrum?**
A: Key differences:

| Aspect | Agile/Scrum | AI-DLC |
|--------|-------------|--------|
| Iteration duration | Weeks (Sprints) | Hours/days (Bolts) |
| Driver | Human-driven | AI-driven, human-validated |
| Design techniques | Out of scope | Integrated (DDD, TDD, BDD) |
| Phases | Iterative sprints | Iterative with 3 phases (Inception, Construction, Operations) |
| Rituals | Daily standups, retrospectives | Mob Elaboration, Mob Construction |

**Q: Can I use specsmd with existing Agile workflows?**
A: AI-DLC is designed as a reimagination, not a retrofit. However, familiar concepts (user stories, acceptance criteria) are retained to ease transition.

### Troubleshooting

**Q: Agents don't seem to remember previous context?**
A: Each agent invocation starts fresh. Agents read context from the Memory Bank at startup. Ensure artifacts are saved after each step.

**Q: How do I reset project state?**
A: Clear the `memory-bank/` directory to reset all artifacts. To remove specsmd entirely:

1. Delete the `.specsmd/` directory
2. Delete tool-specific command files (`.claude/commands/specsmd-*.md`, `.cursor/commands/specsmd-*.md`, `.github/copilot/commands/specsmd-*.md`)
3. Optionally delete `memory-bank/` if you don't need to preserve project context

**Q: Where can I get help?**
A:

- Documentation: <https://specs.md>
- Issues: <https://github.com/fabriqaai/specsmd/issues>
