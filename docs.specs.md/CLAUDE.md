# specs.md Documentation Website

This is the documentation website for [specs.md](https://github.com/fabriqaai/specsmd), an AI-native software development framework with multi-agent orchestration.

## Tech Stack

- **Framework**: [Mintlify](https://mintlify.com) - Modern documentation platform
- **Content**: MDX (Markdown + JSX)
- **Diagrams**: Mermaid.js for flowcharts and diagrams
- **Hosting**: Mintlify Cloud

## Project Structure

```
specs.md-website/
├── docs.json                 # Mintlify configuration (navigation, theme, etc.)
├── index.mdx                 # Homepage
├── faq.mdx                   # FAQ page
├── getting-started/          # Getting started guides
│   ├── installation.mdx
│   └── quick-start.mdx
├── methodology/              # AI-DLC methodology docs
│   ├── what-is-ai-dlc.mdx
│   ├── ai-dlc-vs-agile.mdx
│   └── three-phases.mdx
├── core-concepts/            # Core concepts
│   ├── intents.mdx
│   ├── units.mdx
│   ├── bolts.mdx
│   ├── memory-bank.mdx
│   └── standards.mdx
├── agents/                   # Agent documentation
│   ├── overview.mdx
│   ├── master-agent.mdx
│   ├── inception-agent.mdx
│   ├── construction-agent.mdx
│   └── operations-agent.mdx
├── architecture/             # Architecture docs
│   └── flows.mdx
├── guides/                   # How-to guides
│   └── bolt-types.mdx
└── images/                   # Static assets
    ├── logo.png
    ├── favicon.png
    ├── hero-dark.svg
    └── hero-light.svg
```

## Running Locally

```bash
# Install Mintlify CLI
npm i -g mintlify

# Start dev server
npx mint dev
```

The site will be available at http://localhost:3000

## Navigation Configuration

Navigation is configured in `docs.json`. The structure uses nested groups:

- **Getting Started**: Installation and quick start
- **Framework**: Architecture overview
- **AI-DLC Flow**: The main methodology section
  - Concepts (Intents, Units, Bolts, Memory Bank, Standards)
  - Agents (Master, Inception, Construction, Operations)
  - Guides

## Writing Content

### MDX Components

Mintlify provides built-in components:

```mdx
<Info>Informational callout</Info>
<Warning>Warning callout</Warning>
<Card title="Title" icon="icon-name" href="/path">Description</Card>
<CardGroup cols={2}>...</CardGroup>
<Tabs><Tab title="Tab 1">...</Tab></Tabs>
<Steps><Step title="Step 1">...</Step></Steps>
<AccordionGroup><Accordion title="Title">...</Accordion></AccordionGroup>
```

### Frontmatter

Every MDX file needs frontmatter:

```yaml
---
title: Page Title
description: Brief description for SEO
---
```

## Mermaid Diagram Theme

Use consistent styling for all Mermaid diagrams. Copy these styles into your diagrams.

### Color Palette

| Role               | Color  | Hex       | Usage                         |
|--------------------|--------|-----------|-------------------------------|
| Master/Primary     | Purple | `#8B5CF6` | Master Agent, primary elements |
| Inception          | Indigo | `#818CF8` | Inception phase, planning     |
| Construction       | Green  | `#34D399` | Construction phase, building  |
| Operations         | Amber  | `#FBBF24` | Operations phase, deployment  |
| Human/Validation   | Pink   | `#F472B6` | Human review, checkpoints     |
| AI/System          | Cyan   | `#22D3EE` | AI actions, automation        |
| Core/Infrastructure| Blue   | `#60A5FA` | Core components               |
| Future/Placeholder | Gray   | `#64748B` | Planned features              |

### Standard Style Definitions

**Agent Flow Diagram:**
```
style MA fill:#8B5CF6,stroke:#7C3AED,color:#fff
style IA fill:#818CF8,stroke:#6366F1,color:#fff
style CA fill:#34D399,stroke:#10B981,color:#fff
style OA fill:#FBBF24,stroke:#F59E0B,color:#fff
```

**Human Checkpoints Diagram:**
```
style Stage fill:#818CF8,stroke:#6366F1,color:#fff
style Gate fill:#F472B6,stroke:#EC4899,color:#fff
```

**Role Comparison (Human vs AI):**
```
style Human fill:#60A5FA,stroke:#3B82F6,color:#fff
style AI fill:#34D399,stroke:#10B981,color:#fff
style Validate fill:#F472B6,stroke:#EC4899,color:#fff
```

**Framework Architecture:**
```
style Framework fill:#1E293B,stroke:#334155,color:#fff
style Core fill:#0C4A6E,stroke:#0EA5E9,color:#fff
style Flows fill:#052E16,stroke:#22C55E,color:#fff
style Active fill:#22C55E,stroke:#16A34A,color:#fff
style Future fill:#475569,stroke:#64748B,color:#fff,stroke-dasharray: 5 5
```

**Bolt Types:**
```
style DDD fill:#8B5CF6,stroke:#7C3AED,color:#fff
style Simple fill:#34D399,stroke:#10B981,color:#fff
style Spike fill:#FBBF24,stroke:#F59E0B,color:#fff
```

## Brand Colors

From `docs.json`:
- Primary: `#CD6B4D` (terracotta/rust)
- Light: `#D17A5E`
- Dark: `#B85A3D`

## Important Notes

1. **Agent commands are NOT CLI commands** - They are prompts typed in AI coding tools (Claude Code, Cursor, GitHub Copilot)
2. **ASCII file trees should stay as ASCII** - They represent directory structures and are more readable than Mermaid
3. **Process flows should use Mermaid** - Flowcharts, state diagrams, and architecture diagrams
4. **Always include frontmatter** - Title and description are required for SEO

## Related Repositories

- Main specs.md CLI: https://github.com/fabriqaai/specsmd
