---
name: forge
description: Shape top ideas into actionable concept briefs using Disney Strategy — Dream, Reality, Critique.
version: 1.0.0
---

<objective>
Develop shortlisted ideas into polished, actionable concept briefs. AI and user co-build through the Disney Creative Strategy.
</objective>

<triggers>
  - Flame Report generated with shortlisted ideas
  - User provides ideas directly for shaping
  - Orchestrator routes to Forge
  - User invokes `/specsmd-forge`
</triggers>

<degrees_of_freedom>
  **MEDIUM-LOW** — Structured shaping with high co-build ratio. User and AI refine together.
</degrees_of_freedom>

<llm critical="true">
  <mandate>ALWAYS apply Disney Strategy in sequence: Dreamer → Realist → Critic</mandate>
  <mandate>NEVER mix phases — keep Dreamer, Realist, and Critic strictly separate</mandate>
  <mandate>ALWAYS involve user in Critic phase — this is the primary co-build moment</mandate>
  <mandate>NEVER produce a Concept Brief without user validation of the core concept</mandate>
  <mandate>ALWAYS make Concept Briefs polished enough to share in a meeting</mandate>
</llm>

<protocols>
  - `.specsmd/ideation/shared/protocols/interaction-adaptation.md` — Generate:40% / Elicit:20% / Co-build:40%
  - `.specsmd/ideation/shared/protocols/diverge-converge.md` — Alternating diverge-converge (Disney pattern)
</protocols>

<references>
  - `references/disney-method.md` — Disney Creative Strategy for AI execution
  - `references/pitch-framework.md` — Concept structuring and pitch patterns
</references>

<flow>
  <step n="1" title="Load Top Ideas">
    <check if="Flame Report exists in session">
      <action>Load shortlisted ideas from flame-report.md</action>
      <action>Present the shortlist: "Here are your top ideas. Which one shall we shape first?"</action>
    </check>
    <check if="user provides ideas directly">
      <action>Accept ideas as input</action>
    </check>
    <check if="no ideas available">
      <ask>Which ideas would you like to develop into full concepts?</ask>
    </check>
    <action>Select one idea to forge at a time (depth over breadth)</action>
  </step>

  <step n="2" title="Dreamer Pass">
    <action>Enter Dreamer mode — pure possibility, no limits</action>
    <output>
      Signal the mode: "Let's dream big first — no limits, no criticism, just possibility."
    </output>
    <action>Expand the idea with:</action>
    <dreamer>
      - What's the most ambitious version of this?
      - What would it look like if everything went perfectly?
      - What adjacent possibilities does this unlock?
      - What would make users absolutely love this?
      - How could this grow beyond its initial scope?
    </dreamer>
    <action>Present the expanded vision (3-5 paragraphs)</action>
    <action>Invite user additions: "What else would you dream for this?"</action>
  </step>

  <step n="3" title="Realist Pass">
    <action>Enter Realist mode — practical implementation thinking</action>
    <output>
      Signal the mode: "Now let's get practical. How would this actually work?"
    </output>
    <action>Ground the dream with:</action>
    <realist>
      - What are the core components needed?
      - What's the simplest version that still delivers the magic?
      - What resources are required (time, money, skills, technology)?
      - What's the implementation sequence?
      - What existing solutions or tools can be leveraged?
      - What's the timeline from start to first value?
    </realist>
    <action>Present a practical breakdown</action>
    <action>Ask: "Does this implementation path make sense? What would you adjust?"</action>
  </step>

  <step n="4" title="Critic Pass (Co-build)">
    <action>Enter Critic mode — constructive stress-testing</action>
    <output>
      Signal the mode: "Time to stress-test. Let's find the weak spots — and fix them."
    </output>
    <action>Present AI's concerns:</action>
    <critic>
      - What's the biggest risk?
      - What assumption is most likely wrong?
      - What would a skeptic say?
      - Where could this fail?
      - What's the competitive response?
    </critic>
    <ask>What concerns you most about this concept? What feels risky?</ask>
    <action>For each concern (AI's and user's), co-develop a mitigation:</action>
    <format>
      **Concern**: {concern}
      **Mitigation**: {proposed mitigation}
    </format>
    <action>Iterate until user is satisfied with mitigations</action>
  </step>

  <step n="5" title="Generate Concept Brief">
    <action>Synthesize Dreamer + Realist + Critic into a polished Concept Brief</action>
    <action>Generate using template: templates/concept-brief.md.hbs</action>
    <action>Present the brief to user for final review</action>
    <ask>How does this look? Any final adjustments?</ask>
    <action>Save to: .specs-ideation/sessions/{session-id}/concept-briefs/{concept-name}.md</action>
    <action>Update session.yaml: track concept brief</action>
    <check if="more shortlisted ideas to forge">
      <ask>Ready to shape the next idea?</ask>
      <action>If yes, return to step 1 with next idea</action>
    </check>
    <check if="all ideas shaped">
      <action>Update session.yaml: phase → "complete"</action>
      <output>
        Your ideation session is complete!

        **Created**:
        - Spark Bank: {N} ideas generated
        - Flame Report: {M} ideas evaluated, {K} shortlisted
        - Concept Briefs: {B} concepts shaped

        All artifacts saved in .specs-ideation/sessions/{session-id}/
      </output>
    </check>
  </step>
</flow>

<output_artifacts>
  | Artifact | Location | Template |
  |----------|----------|----------|
  | Concept Brief | `.specs-ideation/sessions/{id}/concept-briefs/{name}.md` | `./templates/concept-brief.md.hbs` |
</output_artifacts>

<success_criteria>
  <criterion>Disney Strategy applied in strict sequence: Dreamer → Realist → Critic</criterion>
  <criterion>User actively involved in Critic phase (co-build)</criterion>
  <criterion>Concept Brief is polished enough to share in a meeting</criterion>
  <criterion>Risks identified AND mitigated (not just listed)</criterion>
  <criterion>Clear next steps included in every brief</criterion>
  <criterion>Session state updated and all artifacts saved</criterion>
</success_criteria>
