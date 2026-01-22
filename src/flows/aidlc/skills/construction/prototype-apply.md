# Skill: Prototype Apply

---

## Goal

Apply a vibe-coded prototype's design and components to the real implementation during bolt execution. This skill bridges the gap between extracted prototype specifications and production code.

---

## When to Use

Use this skill when:
- A bolt references a prototype in its scope
- You need to implement UI that matches a prototype screenshot
- The design system from vibe-to-spec should be applied to code
- Visual acceptance criteria reference prototype screens

---

## Input

- **Required**: Bolt ID currently being executed
- **Required**: Prototype reference (path or name)
- **Optional**: Specific screen to implement
- **Optional**: Component to focus on

**Prerequisite**: The **vibe-to-spec** skill must have been run on this prototype during Inception.

---

## Process

### Step 1: Load Prototype Context

Load all relevant prototype artifacts:

```text
## Loading Prototype Context

Prototype: {prototype-name}
Bolt: {bolt-id}

### Available Artifacts
- [ ] design-system.md - {loaded/not found}
- [ ] component-catalog.md - {loaded/not found}
- [ ] screen-inventory.md - {loaded/not found}
- [ ] user-flows.md - {loaded/not found}

### Bolt Scope Match
Matching prototype screens to bolt scope:
- {screen-1} → {story-1}
- {screen-2} → {story-2}
```

---

### Step 2: Extract Implementation Requirements

From the prototype artifacts, extract what needs to be built:

```markdown
## Implementation Requirements

### Screen: {screen-name}
**Prototype Source**: {screenshot-path}
**Target Location**: {src/path/to/component}

### Design Tokens to Apply
```typescript
// From prototype design-system.md
const tokens = {
  colors: {
    primary: '{hex}',
    secondary: '{hex}',
    background: '{hex}',
    // ...
  },
  typography: {
    fontFamily: '{font}',
    // ...
  },
  spacing: {
    xs: '{px}',
    // ...
  }
}
```

### Components to Implement
| Component | Prototype Ref | Target File | Status |
|-----------|---------------|-------------|--------|
| {Sidebar} | screen-2.png | Sidebar.tsx | pending |
| {ChatList} | screen-2.png | ChatList.tsx | pending |
| {MessageBubble} | screen-3.png | MessageBubble.tsx | pending |

### Layout Structure
```
{ASCII representation of layout from prototype}
┌─────────────────────────────────────────┐
│ Header                                  │
├──────────┬──────────────────────────────┤
│ Sidebar  │ Main Content                 │
│          │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│ Footer / Input Area                     │
└─────────────────────────────────────────┘
```
```

---

### Step 3: Map to Project Standards

Cross-reference with project standards:

```markdown
## Standards Alignment

### Tech Stack Match
- **Prototype suggests**: {vanilla CSS / Tailwind / etc.}
- **Project standard**: {from tech-stack.md}
- **Action**: {adapt prototype to use project's styling approach}

### Component Library Match
- **Prototype components**: {custom / Bootstrap / etc.}
- **Project standard**: {from tech-stack.md}
- **Action**: {map prototype components to project's component library}

### Coding Standards
- **File naming**: {from coding-standards.md}
- **Component structure**: {from coding-standards.md}
```

---

### Step 4: Generate Implementation Code

Generate code that matches the prototype while following project standards.

**IMPORTANT**: If the `/frontend-design` skill is available, invoke it for high-quality, production-grade frontend code that avoids generic AI aesthetics. The frontend-design skill specializes in creating distinctive, polished UI components.

**For each component**:

1. **Analyze prototype visually** (use screenshot)
2. **Extract structure from HTML** (if available)
3. **Apply project's styling approach**
4. **Ensure accessibility**
5. **Add responsive behavior**

```typescript
// Example output structure
/**
 * Component: {ComponentName}
 * Prototype: {screenshot-reference}
 *
 * Visual acceptance criteria:
 * - {criterion from prototype}
 * - {criterion from prototype}
 */
export function ComponentName({ props }: Props) {
  // Implementation matching prototype
}
```

---

### Step 5: Visual Verification Checklist

Create a verification checklist comparing implementation to prototype:

```markdown
## Visual Verification: {screen-name}

### Layout
- [ ] Overall structure matches prototype
- [ ] Spacing between elements is consistent
- [ ] Responsive breakpoints work correctly

### Colors
- [ ] Primary color matches: {hex}
- [ ] Background color matches: {hex}
- [ ] Text colors match design system

### Typography
- [ ] Font family applied correctly
- [ ] Font sizes match design system
- [ ] Font weights are correct

### Components
- [ ] {Component-1} matches prototype
- [ ] {Component-2} matches prototype
- [ ] Interactive states (hover, focus, active) implemented

### Interactions
- [ ] {Interaction-1} works as shown in flow
- [ ] {Interaction-2} works as shown in flow

### Screenshots for Comparison
- Prototype: `{prototype-path}`
- Implementation: `{screenshot after implementation}`
```

---

## Output

### Implementation Summary

```markdown
## Prototype Applied: {screen-name}

### Components Implemented
| Component | File | Lines | Status |
|-----------|------|-------|--------|
| {Sidebar} | src/components/Sidebar.tsx | 45-120 | complete |
| {ChatList} | src/components/ChatList.tsx | 1-80 | complete |

### Design System Applied
- Color tokens: {n} applied
- Typography: {n} styles applied
- Spacing: {n} values applied

### Deviations from Prototype
| Aspect | Prototype | Implementation | Reason |
|--------|-----------|----------------|--------|
| {color} | #xxx | #yyy | Project standard |
| {font} | Inter | system-ui | Performance |

### Visual Verification
- [ ] Side-by-side comparison reviewed
- [ ] Responsive behavior verified
- [ ] Accessibility checked

### Files Modified
- `{file-1}` - {description}
- `{file-2}` - {description}

### Next Steps
1 - Continue with next screen
2 - Run visual regression tests
3 - Review with stakeholder
```

---

## Integration with Bolt Workflow

### During DDD Construction Bolt

In the **Implement** stage:
1. Load prototype context for relevant screens
2. Generate components matching prototype
3. Apply design system tokens
4. Create visual verification checklist

### During Simple Construction Bolt

In the **Implement** stage:
1. Reference prototype for UI components
2. Use extracted design tokens
3. Follow component catalog structure

---

## Visual Diff Support

When available, use UI diff tools to compare:

```text
## Visual Diff Report

### Screen: {screen-name}
- Prototype: {prototype-screenshot}
- Implementation: {current-screenshot}
- Diff: {highlighted differences}

### Discrepancies Found
1. {location}: {expected} vs {actual}
2. {location}: {expected} vs {actual}

### Action Required
- [ ] Fix discrepancy 1
- [ ] Fix discrepancy 2
- [ ] Accept as intentional deviation
```

---

## Test Contract

```yaml
input:
  - Bolt ID with prototype reference
  - Prototype artifacts from vibe-to-spec
output:
  - Implementation code matching prototype
  - Visual verification checklist
  - Deviation documentation
integration:
  - Works within bolt execution flow
  - References design-system.md
  - Follows project standards
```
