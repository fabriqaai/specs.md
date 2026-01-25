---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant color with intentional accents. Consider gradients, but make them subtle and purposeful.
- **Spacing & Layout**: Generous whitespace creates luxury. Use CSS Grid and Flexbox for sophisticated layouts. Consider asymmetry for visual interest.
- **Micro-interactions**: Thoughtful hover states, transitions, and animations. Make interactions feel alive but not overwhelming. 200-400ms transitions feel natural.
- **Visual Details**: Subtle shadows, borders, and textures add depth. Consider backdrop-blur for modern glass effects. Rounded corners should be consistent throughout.
- **Responsive Design**: Mobile-first approach. Breakpoints at 640px, 768px, 1024px, 1280px. Touch targets minimum 44px.

## Implementation Patterns

### CSS Architecture
```css
:root {
  /* Colors */
  --color-primary: #...;
  --color-secondary: #...;
  --color-background: #...;
  --color-surface: #...;
  --color-text: #...;
  --color-text-muted: #...;

  /* Typography */
  --font-display: '...', serif;
  --font-body: '...', sans-serif;
  --font-mono: '...', monospace;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;

  /* Effects */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --transition: 200ms ease;
}
```

### Animation Principles
- Entrance animations: fade + slight translate (20px max)
- Hover states: scale(1.02-1.05), color shifts, shadow elevation
- Loading states: skeleton screens over spinners
- Scroll animations: intersection observer, staggered reveals

### Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Focus states visible and styled
- Color contrast ratios (4.5:1 minimum)
- Reduced motion preference respected

## Quality Checklist

Before completion, verify:
- [ ] Distinctive visual identity (not generic)
- [ ] Consistent design system applied
- [ ] Responsive across breakpoints
- [ ] Smooth interactions and transitions
- [ ] Accessible (keyboard, screen reader)
- [ ] Performance optimized (no layout shifts)
- [ ] Cross-browser compatible
- [ ] Dark mode support (if applicable)

## Output Format

Deliver complete, production-ready code:
1. HTML structure (semantic, accessible)
2. CSS (organized, using variables)
3. JavaScript (if interactive elements needed)
4. Usage instructions if complex

Focus on quality over quantity. A beautifully crafted component is better than a feature-complete but generic one.
