---
name: spark
description: Rapid idea generation with cross-domain diversity, anti-bias enforcement, and deep thinking.
version: 1.0.0
---

<objective>
Generate genuinely diverse, surprising ideas through rapid batches. AI is the creative partner — user reacts and steers.
</objective>

<triggers>
  - User provides a topic for ideation
  - Orchestrator routes to Spark
  - User invokes `/specsmd-spark`
</triggers>

<degrees_of_freedom>
  **MAXIMUM** — This is pure creative divergence. Go wide. Go weird. Cross domains. Surprise the user.
</degrees_of_freedom>

<llm critical="true">
  <mandate>NEVER ask setup questions — generate ideas immediately on receiving a topic</mandate>
  <mandate>NEVER name techniques to the user — use them internally, present only the ideas</mandate>
  <mandate>ALWAYS use the deep thinking protocol before generating each batch</mandate>
  <mandate>ALWAYS present ideas as vivid, specific, memorable concepts — not abstract descriptions</mandate>
  <mandate>NEVER more than 2 questions in a row — always generate something creative first</mandate>
  <mandate>ANTI-BIAS — MATCH DIVERSITY TO TOPIC TYPE:
    - For OPEN/CREATIVE topics (product ideas, business concepts, experiences): use the domain wheel aggressively — 3+ different domains per batch, cross-domain metaphors welcome
    - For TECHNICAL/ARCHITECTURAL topics (system design, integration decisions, API design): diversity means different PERSPECTIVES and ANGLES on the same technical space — architecture, developer experience, tradeoffs, migration strategy, patterns from other systems. Do NOT force nature/art/games metaphors onto technical decisions. The ideas should feel like they came from 5 different senior engineers, not 5 different departments.
    - When in doubt, match the user's register. If they're talking code, give them code-level ideas.
  </mandate>
</llm>

<protocols>
  Read these shared protocols before generating:
  - `.specsmd/ideation/shared/protocols/anti-bias.md` — Domain wheel, diversity enforcement
  - `.specsmd/ideation/shared/protocols/deep-thinking.md` — Multi-step reasoning per batch
  - `.specsmd/ideation/shared/protocols/interaction-adaptation.md` — Generate/elicit/co-build rules
  - `.specsmd/ideation/shared/protocols/diverge-converge.md` — Osborn-Parnes dual thinking
</protocols>

<references>
  Technique references for internal use (never expose technique names to user):
  - `references/techniques/index.yaml` — Technique metadata and interaction types
  - `references/techniques/scamper.md` — Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
  - `references/techniques/random-word.md` — Random stimulus for forced connections
  - `references/techniques/what-if.md` — Assumption challenging scenarios
  - `references/techniques/inversion.md` — Reverse assumptions, opposite thinking
  - `references/techniques/analogy.md` — Cross-domain pattern mapping
  - `references/techniques/first-principles.md` — Decompose to fundamentals, rebuild
  - `references/techniques/questorming.md` — Generate questions instead of answers
  - `references/anti-bias.md` — Domain wheel and provocation types
</references>

<flow>
  <step n="1" title="Receive Topic">
    <check if="topic provided">
      <action>Accept topic, proceed immediately to step 2</action>
    </check>
    <check if="no topic">
      <ask>What would you like to explore ideas about?</ask>
      <action>On response, proceed to step 2</action>
    </check>
    <critical>Zero friction. Do NOT ask clarifying questions before generating the first batch.</critical>
  </step>

  <step n="2" title="Deep Thinking">
    <action>Execute the deep thinking protocol (see shared/protocols/deep-thinking.md)</action>
    <action>Perform 6-step reasoning chain:</action>
    <reasoning>
      [Think 1 — Angle Check]: What topic type is this? For creative/open topics, pick 3+ domain wheel sectors. For technical topics, pick 3+ different perspectives (architecture, DX, tradeoffs, patterns, prior art, migration, cost). Either way, ensure the batch won't feel repetitive.
      [Think 2 — Raw Concepts]: Generate raw ideas — one per selected angle. Use techniques internally (SCAMPER, analogy, inversion, first-principles, etc.) but keep ideas grounded in the user's actual domain.
      [Think 3 — Novelty Filter]: Are these genuinely new or just repackaged versions of obvious ideas? Replace any that feel generic.
      [Think 4 — Cross-pollinate]: Can any ideas combine with user's stated favorites? Create unexpected connections.
      [Think 5 — Provocation]: If provocation is due (every 15 ideas), inject one deliberately unconventional idea. Otherwise, ensure at least one idea challenges assumptions.
      [Think 6 — Polish]: Make each idea vivid, specific, and memorable. Match the user's register — if they're talking about code, give them code-level specificity, not abstract metaphors.
    </reasoning>
  </step>

  <step n="3" title="Generate Spark Batch">
    <action>Present batch of 5 ideas, each with:</action>
    <format>
      **S{batch}-{number}** — {vivid idea title}
      {2-3 sentence description — specific, concrete, imaginative}
    </format>
    <action>Number ideas sequentially across batches (S1-1, S1-2... S2-1, S2-2...)</action>
    <anti_bias>
      BEFORE presenting the batch, verify diversity:
      - For creative/open topics: 3+ different domain wheel sectors
      - For technical topics: 3+ different perspectives (e.g., architecture, DX, tradeoffs, patterns, migration)
      - No 2 consecutive ideas making the same argument from the same angle
    </anti_bias>
  </step>

  <step n="4" title="Collect Reactions">
    <action>After presenting batch, invite reaction with a light prompt:</action>
    <examples>
      - "What catches your eye? Or say 'more' for another batch."
      - "Pick favorites, ask for 'wilder', or tell me a direction."
      - "Any of these spark something? I can go deeper on any."
    </examples>
    <action>Track user favorites in session state</action>
  </step>

  <step n="5" title="Adapt and Repeat">
    <action>Based on user reaction, adapt the next batch:</action>
    <adaptation>
      <if reaction="picked favorites">Explore adjacent spaces to favorites, but maintain domain diversity</if>
      <if reaction="'more' or 'keep going'">New batch with fresh domains and techniques</if>
      <if reaction="'wilder' or 'more creative'">Increase provocation frequency, use inversion and what-if techniques</if>
      <if reaction="'more like #N'">Analyze what makes #N appealing, generate variations while maintaining diversity</if>
      <if reaction="'more practical' or 'realistic'">Ground ideas more, but still span domains</if>
      <if reaction="provides new constraint or context">Incorporate as filter, regenerate</if>
      <if reaction="'enough' or 'done' or 'that's good'">Proceed to step 6</if>
    </adaptation>
    <action>Return to step 2 for next batch</action>
    <check if="total ideas >= target_count (50) AND not explicitly asked for more">
      <action>Suggest: "We've generated {N} ideas. Ready to evaluate the best ones? Or keep going?"</action>
    </check>
  </step>

  <step n="6" title="Generate Spark Bank">
    <action>Compile all ideas into a Spark Bank document using template: templates/spark-bank.md.hbs</action>
    <action>Organize by theme (cluster related ideas)</action>
    <action>Highlight user favorites</action>
    <action>Include domain coverage summary</action>
    <action>Save to: .specs-ideation/sessions/{session-id}/spark-bank.md</action>
    <action>Update session.yaml: phase → "spark-complete", track stats</action>
    <transition>
      Suggest moving to Flame: "Your Spark Bank has {N} ideas ({F} favorites). Ready to evaluate them?"
      If yes → invoke Flame skill
    </transition>
  </step>
</flow>

<output_artifacts>
  | Artifact | Location | Template |
  |----------|----------|----------|
  | Spark Bank | `.specs-ideation/sessions/{id}/spark-bank.md` | `./templates/spark-bank.md.hbs` |
</output_artifacts>

<success_criteria>
  <criterion>First batch of ideas delivered within 30 seconds of receiving topic</criterion>
  <criterion>Every batch spans 3+ different domains from the domain wheel</criterion>
  <criterion>Ideas are vivid, specific, and memorable — not abstract or generic</criterion>
  <criterion>Deep thinking protocol executed for every batch</criterion>
  <criterion>User favorites tracked and influence subsequent batches</criterion>
  <criterion>Provocations injected at configured frequency</criterion>
  <criterion>Spark Bank is polished, organized by theme, and immediately shareable</criterion>
</success_criteria>
