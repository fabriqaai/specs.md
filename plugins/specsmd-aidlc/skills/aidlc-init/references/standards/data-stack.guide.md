# Data Stack Facilitation Guide

## Purpose

Define the database and data persistence choices for the project. This guide helps determine what data storage is needed and how the application will interact with it.

---

## Facilitation Approach

You are collaborating with a peer to discover their data persistence needs. This is a conversation, not a form to fill out.

**Adapt your style:**

- If they mention specific databases confidently → treat them as experienced, be concise
- If they seem uncertain → provide more context, examples, and recommendations
- If they have strong preferences → respect them, ask about tradeoffs they've considered

**Your role:**

- Guide discovery, don't dictate choices
- Surface tradeoffs they may not have considered
- Ensure choices are coherent with the tech stack
- Capture rationale, not just the choice

---

## Discovery Areas

### 1. Database

**Goal**: Understand data persistence needs.

**Context:**
> "Database choice affects data modeling, query patterns, scaling, and operational complexity. Some projects don't need a database initially - that's valid too."

**Explore:**

- What kind of data? (Users, products, transactions, documents, time-series, relationships)
- What's the expected scale? (Hundreds, thousands, millions of records)
- Do they need real-time subscriptions?
- Managed service preference or self-hosted?
- Any compliance requirements? (Data residency, encryption at rest)
- Budget constraints?

**Guide by data patterns:**

| Data Pattern | Recommendation | Why |
|--------------|----------------|-----|
| Relational (users, orders, products) | PostgreSQL | Flexible, powerful, great extensions |
| Document-oriented, flexible schema | MongoDB | Schema flexibility, nested data |
| Serverless, auto-scaling | Supabase, PlanetScale, Neon | No ops, scales automatically |
| Real-time collaboration | Supabase, Firebase | Built-in subscriptions |
| Key-value, caching | Redis, DynamoDB | Fast lookups, simple model |
| Time-series (logs, metrics) | TimescaleDB, InfluxDB | Optimized for time-based queries |

**Managed services to consider:**

- **Supabase**: PostgreSQL + auth + real-time + storage (great for startups)
- **PlanetScale**: MySQL-compatible, serverless, branching (great for scaling)
- **Neon**: PostgreSQL, serverless, branching (great for development)
- **MongoDB Atlas**: Managed MongoDB
- **AWS RDS/Aurora**: Enterprise-grade managed databases

**If they're unsure:**
> "For most web applications, PostgreSQL is a safe default. It's relational, has great tooling, and can handle JSON when you need flexibility. If you want managed + auth + real-time, Supabase wraps PostgreSQL nicely."

---

### 2. ORM / Database Client

**Goal**: Determine how they'll interact with the database.

**Explore:**

- Do they prefer type-safe queries or raw SQL?
- How important are migrations and schema management?
- Do they need to support multiple databases?

**Options by language:**

**TypeScript:**

| ORM | Style | Best For |
|-----|-------|----------|
| Prisma | Schema-first, type-safe | Most projects, great DX |
| Drizzle | TypeScript-first, SQL-like | Performance, SQL lovers |
| Kysely | Type-safe query builder | Raw SQL with types |
| TypeORM | Decorator-based | Enterprise, existing TypeORM knowledge |

**Python:**

| ORM | Style | Best For |
|-----|-------|----------|
| SQLAlchemy | Flexible, powerful | Most projects |
| Django ORM | Integrated with Django | Django projects |
| Prisma (Python) | Schema-first | Prisma fans |

**Go:**

| Library | Style | Best For |
|---------|-------|----------|
| GORM | Full ORM | Quick development |
| sqlx | SQL with structs | Performance, SQL control |
| pgx | Low-level PostgreSQL | Maximum performance |

---

## Completing the Discovery

Once you've explored all relevant areas, summarize:

```markdown
## Data Stack Summary

Based on our conversation, here's what I understand:

**Database**: {choice}
{brief rationale}

**ORM / Database Client**: {choice}
{brief rationale}

---

Does this capture your data stack accurately? Any adjustments needed?
```

---

## Output Generation

After confirmation, create `standards/data-stack.md`:

```markdown
# Data Stack

## Overview
{1-2 sentence summary of the data persistence approach}

## Database
{database choice}

{Rationale - why this choice, scaling approach, managed vs self-hosted}

## ORM / Database Client
{orm choice}

{Rationale - why this choice, how it fits with the language/framework}

## Decision Relationships
{Note any important connections, e.g., "Prisma was chosen because it integrates well with TypeScript and provides excellent type-safe database access"}
```

---

## Notes for Agent

- **This standard is only for projects that need data persistence** - skip if not applicable
- **Capture rationale** - "why" is as important as "what"
- **Respect existing choices** - if they say "we're using X", don't try to change their mind unless there's a real issue
- **Consider the tech stack** - ORM choice should align with language/framework from tech-stack
