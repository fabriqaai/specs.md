---
name: flame
description: Multi-perspective idea evaluation using Six Hats analysis, impact/feasibility scoring, and collaborative shortlisting.
version: 1.0.0
---

<objective>
Evaluate ideas fairly through multiple perspectives. Surface hidden value, identify risks, and produce a ranked shortlist for Forge.
</objective>

<triggers>
  - Spark Bank generated and user wants to evaluate
  - User provides ideas directly for evaluation
  - Orchestrator routes to Flame
  - User invokes `/specsmd-flame`
</triggers>

<degrees_of_freedom>
  **MEDIUM** — Structured evaluation with room for user input and collaborative extension.
</degrees_of_freedom>

<llm critical="true">
  <mandate>NEVER skip ideas — evaluate ALL ideas, not just obvious favorites (hidden gems exist)</mandate>
  <mandate>NEVER evaluate through a single lens — always use multiple perspectives</mandate>
  <mandate>ALWAYS pause at Red Hat for user's gut feeling (the one required elicitation)</mandate>
  <mandate>ALWAYS present evaluation as multi-dimensional, not pass/fail</mandate>
  <mandate>NEVER dismiss ideas prematurely — look for the kernel of value in each</mandate>
</llm>

<protocols>
  - `.specsmd/ideation/shared/protocols/interaction-adaptation.md` — Generate:60% / Elicit:15% / Co-build:25%
  - `.specsmd/ideation/shared/protocols/diverge-converge.md` — Convergent mode with structured divergent extensions
</protocols>

<references>
  - `references/six-hats-method.md` — De Bono methodology adapted for AI execution
  - `references/evaluation-criteria.md` — Impact, feasibility, novelty, risk frameworks
</references>

<flow>
  <step n="1" title="Load Ideas">
    <check if="Spark Bank exists in session">
      <action>Load spark-bank.md from current session</action>
      <action>Prioritize favorites but include all ideas</action>
    </check>
    <check if="user provides ideas directly">
      <action>Accept ideas as input</action>
    </check>
    <check if="no ideas available">
      <ask>Which ideas would you like to evaluate? You can list them or I can load from a Spark session.</ask>
    </check>
  </step>

  <step n="2" title="Rapid Six Hats Analysis">
    <action>For each idea (or top 10-15 if many), perform rapid Six Hats analysis:</action>
    <format>
      **{idea title}**

      | Hat | Perspective |
      |-----|------------|
      | White (Facts) | What do we know? What data exists? |
      | Yellow (Benefits) | What's the best case? Why could this work? |
      | Black (Risks) | What could go wrong? What are the dangers? |
      | Green (Creative) | How could this be extended or combined? |
      | Blue (Process) | What would it take to implement? What's the path? |
    </format>
    <critical>Red Hat is handled separately in step 3 — it requires user input</critical>
    <action>Present analysis in batches of 3-5 ideas to avoid overwhelming</action>
  </step>

  <step n="3" title="Red Hat — User Gut Feeling">
    <action>For each batch of analyzed ideas, pause and ask:</action>
    <ask>What's your gut feeling on these? Which ones excite you? Which feel wrong despite looking good on paper?</ask>
    <action>Record user's emotional responses</action>
    <ai_fallback>If user says "you decide" — infer gut feeling from their Spark favorites and engagement patterns</ai_fallback>
  </step>

  <step n="4" title="Impact/Feasibility Scoring">
    <action>Score each evaluated idea on two axes:</action>
    <scoring>
      **Impact** (1-5): How much value would this create if successful?
      - 5: Transformative — changes the game entirely
      - 4: Significant — clear, major improvement
      - 3: Moderate — useful but not remarkable
      - 2: Minor — incremental improvement
      - 1: Negligible — barely noticeable

      **Feasibility** (1-5): How achievable is this?
      - 5: Easy — could start today with existing resources
      - 4: Doable — requires some effort but clearly achievable
      - 3: Challenging — significant effort but realistic
      - 2: Hard — requires major investment or breakthroughs
      - 1: Near-impossible — fundamental barriers exist
    </scoring>
    <action>Present as a 2x2 matrix view: high-impact/high-feasibility quadrant first</action>
  </step>

  <step n="5" title="Shortlist and Flame Report">
    <action>Recommend top 3-5 ideas for Forge based on:</action>
    <criteria>
      - Impact × Feasibility score
      - User's Red Hat gut feelings
      - Green Hat creative extensions
      - Novelty (does this exist already?)
    </criteria>
    <action>Present shortlist with brief rationale for each</action>
    <ask>Does this shortlist feel right? Want to adjust?</ask>
    <action>Generate Flame Report using template: templates/flame-report.md.hbs</action>
    <action>Save to: .specs-ideation/sessions/{session-id}/flame-report.md</action>
    <action>Update session.yaml: phase → "flame-complete"</action>
    <transition>
      Suggest moving to Forge: "Your top {N} ideas are ready to shape into concepts. Ready?"
      If yes → invoke Forge skill
    </transition>
  </step>
</flow>

<output_artifacts>
  | Artifact | Location | Template |
  |----------|----------|----------|
  | Flame Report | `.specs-ideation/sessions/{id}/flame-report.md` | `./templates/flame-report.md.hbs` |
</output_artifacts>

<success_criteria>
  <criterion>All ideas evaluated (not just favorites)</criterion>
  <criterion>Multiple perspectives applied (Six Hats minimum)</criterion>
  <criterion>User's gut feeling captured (Red Hat)</criterion>
  <criterion>Scoring is multi-dimensional (impact + feasibility minimum)</criterion>
  <criterion>Shortlist reflects both data and intuition</criterion>
  <criterion>Flame Report is clear, organized, and immediately useful</criterion>
</success_criteria>
