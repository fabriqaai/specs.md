# Tech Stack Facilitation Guide

## Purpose

Define the technology choices that will guide code generation, architecture decisions, and ensure consistency across all AI agents working on the project.

---

## Facilitation Approach

You are collaborating with a peer to discover their tech stack preferences. This is a conversation, not a form to fill out.

**Adapt your style:**

- If they mention specific technologies confidently → treat them as experienced, be concise
- If they seem uncertain → provide more context, examples, and recommendations
- If they have strong preferences → respect them, ask about tradeoffs they've considered

**Your role:**

- Guide discovery, don't dictate choices
- Surface tradeoffs they may not have considered
- Ensure choices are coherent (no conflicting technologies)
- Capture rationale, not just the choice

---

## Discovery Areas

### 1. Languages

**Goal**: Understand what programming language(s) they'll use.

**Open with context:**
> "Let's start with languages. This affects everything else - framework options, available libraries, team hiring, and performance characteristics."

**Explore:**

- What languages is the team already comfortable with?
- Are there languages they want to learn vs. use productively?
- Is type safety important? (catches bugs early vs. development speed)
- What's the runtime environment? (Browser, Node.js, Edge functions, Native)
- Any organizational standards or constraints?

**If they're unsure, guide by use case:**

| Use Case | Recommendation | Why |
|----------|----------------|-----|
| Web app (full-stack) | TypeScript | Type safety, React/Next.js ecosystem, great tooling |
| API service | TypeScript or Go | TS for ecosystem, Go for performance |
| ML/AI/Data | Python | Libraries (PyTorch, pandas), community |
| High-performance systems | Go or Rust | Go for simplicity, Rust for safety |
| Scripts/automation | Python or TypeScript | Readability, quick iteration |

**Common signals to listen for:**

- "We're a React shop" → TypeScript
- "We do ML/AI" → Python, possibly with TypeScript frontend
- "Performance is critical" → Go, Rust, or optimized Node.js
- "Small team, move fast" → TypeScript or Python
- "Enterprise environment" → Java/Kotlin or TypeScript

**Validate before moving on:**
> "So we're going with {language}. This means {implication}. Sound right?"

---

### 2. Framework

**Goal**: Understand their application framework choice.

**Context to share:**
> "Your framework shapes project structure, available patterns, and deployment options. It's one of the hardest things to change later."

**Explore:**

- What type of application? (Web app, API only, CLI, Mobile)
- Do they need server-side rendering (SSR) or static generation (SSG)?
- Is this a new project or adding to existing code?
- Where will it be deployed? (This affects framework choice)
- Any real-time requirements? (WebSockets, subscriptions)

**Guide by language and use case:**

**TypeScript - Web Applications:**

| Framework | Best For | Tradeoffs |
|-----------|----------|-----------|
| Next.js | Full-stack, SSR/SSG, Vercel deployment | Opinionated, tied to React |
| Remix | Web standards, nested routing, great DX | Smaller ecosystem |
| Astro | Content-heavy sites, partial hydration | Less suited for highly interactive apps |
| SvelteKit | Performance, smaller bundle, great DX | Smaller ecosystem than React |

**TypeScript - API Only:**

| Framework | Best For | Tradeoffs |
|-----------|----------|-----------|
| Fastify | Performance, low overhead | Less opinionated |
| NestJS | Enterprise, structured, dependency injection | More boilerplate |
| Hono | Edge functions, ultra-lightweight | Newer, smaller ecosystem |
| Express | Simple, huge middleware ecosystem | Older patterns, callback-heavy |

**Python - APIs:**

| Framework | Best For | Tradeoffs |
|-----------|----------|-----------|
| FastAPI | Modern async, auto-docs, type hints | Async complexity |
| Django | Batteries-included, ORM, admin | Heavier, monolithic |
| Flask | Minimal, flexible | Need to add everything yourself |

**Go - APIs:**

| Framework | Best For | Tradeoffs |
|-----------|----------|-----------|
| Gin | Fast, popular, good docs | |
| Echo | Similar to Gin, slightly different API | |
| Chi | Lightweight, idiomatic Go | Less batteries included |
| Standard library | Maximum control | More code to write |

**Questions to surface tradeoffs:**

- "Next.js is great but ties you to React. Is that okay?"
- "FastAPI requires understanding async Python. Is the team comfortable with that?"
- "NestJS has more structure but also more boilerplate. Do you prefer convention or flexibility?"

---

### 3. Authentication

**Goal**: Understand authentication needs.

**Optional - some projects don't need auth initially.**

**Explore:**

- Do they need user authentication?
- What methods? (Email/password, social login, magic links, SSO)
- Is this B2C (end users) or B2B (enterprise SSO)?
- Any compliance requirements? (MFA, audit logs)

**Options:**

| Solution | Best For | Tradeoffs |
|----------|----------|-----------|
| Supabase Auth | Supabase users, quick setup | Tied to Supabase |
| NextAuth.js | Next.js apps, flexible | Configuration complexity |
| Clerk | Quick setup, beautiful UI | Cost at scale |
| Auth0 | Enterprise, SSO | Cost, complexity |
| Lucia | Lightweight, self-hosted | More DIY |
| Custom | Full control | Security responsibility |

**If using Supabase for database:**
> "Since you're using Supabase for the database, Supabase Auth integrates seamlessly. It handles email/password, social providers, and row-level security. Worth considering unless you have specific needs."

---

### 4. Infrastructure & Deployment

**Goal**: Understand how they'll deploy and operate.

**Explore:**

- Where do they want to deploy? (Cloud provider preference?)
- Serverless vs. containers vs. VMs?
- Who manages infrastructure? (Solo dev, dedicated DevOps, managed service)
- Budget constraints?
- Any existing infrastructure to integrate with?

**Guide by context:**

| Context | Recommendation | Why |
|---------|----------------|-----|
| Solo dev, startup | Vercel, Railway, Render | Minimal ops, fast deployment |
| Next.js app | Vercel | Optimized for Next.js |
| Need containers | Fly.io, Railway, Render | Simple container hosting |
| Enterprise/compliance | AWS, GCP, Azure | Full control, compliance certifications |
| Cost-sensitive at scale | Fly.io, self-managed k8s | Lower costs, more ops |
| Already in AWS | AWS ecosystem | Consistency, existing knowledge |

**Serverless vs. Containers:**

- **Serverless** (Vercel, Lambda): Pay-per-use, auto-scaling, cold starts
- **Containers** (Fly.io, ECS): Predictable performance, more control
- **VMs** (EC2): Full control, predictable costs at scale

---

### 5. Package Manager

**Goal**: Quick decision on package management.

**For JavaScript/TypeScript:**

| Manager | Best For |
|---------|----------|
| pnpm | Monorepos, disk efficiency, speed |
| npm | Default, widest compatibility |
| yarn | Existing yarn projects |
| bun | Experimental, very fast |

**Default recommendation:** pnpm (fast, efficient, great monorepo support)

---

## Completing the Discovery

Once you've explored all relevant areas, summarize:

```markdown
## Tech Stack Summary

Based on our conversation, here's what I understand:

**Languages**: {choice}
{brief rationale}

**Framework**: {choice}
{brief rationale}

**Authentication**: {choice or "TBD"}
{brief rationale if applicable}

**Infrastructure**: {choice}
{brief rationale}

**Package Manager**: {choice}

---

Does this capture your tech stack accurately? Any adjustments needed?
```

---

## Output Generation

After confirmation, create `standards/tech-stack.md`:

```markdown
# Tech Stack

## Overview
{1-2 sentence summary of the stack and why it fits the project}

## Languages
{language(s)}

{Rationale - why this choice, what it enables}

## Framework
{framework}

{Rationale - why this choice, deployment implications}

## Authentication
{auth solution or "TBD"}

{Rationale if selected}

## Infrastructure & Deployment
{infrastructure choice}

{Rationale - deployment strategy, scaling approach}

## Package Manager
{package manager}

## Decision Relationships
{Note any important connections between choices}
```

---

## Notes for Agent

- **Don't ask all questions linearly** - adapt based on what they've already told you
- **Skip irrelevant decisions** - CLI tools don't need authentication discussion
- **Capture rationale** - "why" is as important as "what"
- **Respect existing choices** - if they say "we're using X", don't try to change their mind unless there's a real issue
- **It's okay to leave things TBD** - not every decision needs to be made upfront
