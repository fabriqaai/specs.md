# Skill: Vibe to Spec

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [ ] Prototype analyzed  ← current
- [ ] Design system extracted
- [ ] Components cataloged
- [ ] Requirements derived
- [ ] Ready for standard inception flow
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 1 | Prototype inventory review | User confirmation |
| Checkpoint 2 | Design system approval | User approval |
| Checkpoint 3 | Derived requirements review | User approval |

---

## Goal

Convert a vibe-coded prototype (screenshots, HTML exports, or design mockups) into formal specsmd artifacts that feed into the standard inception workflow.

---

## Input

- **Required**: Path to prototype folder (e.g., `proto/`, `mockups/`, `discovery/`)
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: Intent name to associate with (creates new if not provided)
- **Optional**: Existing design system to extend

**Supported Prototype Formats**:
- PNG/JPG screenshots
- HTML exports (with associated CSS/JS in `_files` folders)
- Figma exports
- PDF mockups

---

## Process

### Step 1: Inventory Prototype Assets

Scan the prototype folder and catalog all assets:

```text
## Prototype Inventory

Scanning: {prototype-path}

### Screenshots Found
- {filename}.png - {brief description based on visual analysis}
- ...

### HTML Exports Found
- {filename}.html - {title or main heading}
- ...

### Asset Folders
- {filename}_files/ - CSS, JS, images
- ...

Total: {n} screens identified
```

**Checkpoint 1**: Present inventory for user confirmation.

```text
I found {n} screens in your prototype. Here's what I see:

1. {screen-1-description}
2. {screen-2-description}
...

Is this complete? Are there screens I'm missing or misinterpreting?
1 - Yes, continue analysis
2 - Let me clarify (provide corrections)
```

**Wait for user response.**

---

### Step 2: Analyze Each Screen

For each screen, extract:

**Visual Analysis** (use image analysis capabilities):
- Layout structure (sidebar, main content, header, footer)
- Color palette (primary, secondary, accent, background)
- Typography (headings, body text, labels)
- Component patterns (buttons, inputs, cards, lists)
- Interactive elements (forms, menus, modals)

**HTML Analysis** (if available):
- Component structure from markup
- CSS classes and styling patterns
- JavaScript interactions

**Output per screen**:
```markdown
### Screen: {screen-name}
**Source**: {filename}
**Purpose**: {inferred purpose}

#### Layout
- Structure: {e.g., sidebar-main, header-content-footer}
- Responsive hints: {any visible breakpoint patterns}

#### Components Identified
- [ ] {component-1}: {description}
- [ ] {component-2}: {description}

#### Interactions
- {interaction-1}: {trigger} → {result}

#### Design Tokens
- Primary color: {hex}
- Text color: {hex}
- Background: {hex}
- Border radius: {px}
- Spacing unit: {px}
```

---

### Step 3: Synthesize Design System

Combine analysis from all screens into a unified design system:

```markdown
## Design System: {prototype-name}

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| primary | {hex} | Buttons, links, accents |
| secondary | {hex} | Secondary actions |
| background | {hex} | Page background |
| surface | {hex} | Card backgrounds |
| text-primary | {hex} | Main text |
| text-secondary | {hex} | Muted text |
| border | {hex} | Borders, dividers |
| success | {hex} | Success states |
| error | {hex} | Error states |

### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| h1 | {font} | {size} | {weight} |
| h2 | {font} | {size} | {weight} |
| body | {font} | {size} | {weight} |
| label | {font} | {size} | {weight} |
| caption | {font} | {size} | {weight} |

### Spacing Scale
- xs: {px}
- sm: {px}
- md: {px}
- lg: {px}
- xl: {px}

### Border Radius
- sm: {px}
- md: {px}
- lg: {px}
- full: 9999px

### Shadows
- sm: {shadow}
- md: {shadow}
- lg: {shadow}

### Component Patterns
{list of reusable patterns identified}
```

**Checkpoint 2**: Present design system for approval.

```text
### Design System Review

I've extracted the following design system from your prototype:

{full design system}

Does this accurately capture your prototype's visual language?
1 - Yes, continue to derive requirements
2 - Need adjustments (specify what's wrong)
```

**Wait for user response.**

---

### Step 4: Catalog Components

Create a component catalog from the prototype:

```markdown
## Component Catalog: {prototype-name}

### Navigation Components
- **Sidebar**: {description, screens where found}
- **Header**: {description}
- **Breadcrumb**: {description}

### Form Components
- **Text Input**: {variants, validation states}
- **Button**: {variants: primary, secondary, ghost}
- **Select/Dropdown**: {description}
- **Checkbox/Radio**: {description}

### Display Components
- **Card**: {variants}
- **List**: {variants}
- **Table**: {if present}
- **Modal/Dialog**: {if present}

### Feedback Components
- **Toast/Notification**: {if present}
- **Loading States**: {spinners, skeletons}
- **Empty States**: {if present}
- **Error States**: {if present}

### Layout Components
- **Container**: {max-width, padding}
- **Grid**: {columns, gaps}
- **Stack**: {spacing patterns}
```

---

### Step 5: Map User Flows

Identify user flows from screen sequences:

```markdown
## User Flows

### Flow 1: {flow-name}
**Screens**: {screen-1} → {screen-2} → {screen-3}
**Goal**: {what user accomplishes}
**Steps**:
1. User sees {screen-1}, {action}
2. System shows {screen-2}
3. User {action}
4. System {result}

### Flow 2: {flow-name}
...
```

---

### Step 6: Derive Requirements

Transform visual analysis into formal requirements:

```markdown
## Derived Requirements

### Functional Requirements (from prototype)

#### FR-P1: {Component/Feature Name}
- **Source**: {screenshot reference}
- **Description**: {what it does based on visual}
- **Acceptance Criteria**:
  - [ ] {visual criterion 1}
  - [ ] {visual criterion 2}
- **Components**: {list of components needed}
- **Priority**: {inferred from prominence}

#### FR-P2: {Component/Feature Name}
...

### Non-Functional Requirements (inferred)

#### NFR-P1: Visual Consistency
- Design system must be applied consistently
- All components follow extracted patterns

#### NFR-P2: Responsive Design
- {any responsive hints from prototype}

### Open Questions
- {things that aren't clear from prototype}
- {interactions that need clarification}
```

**Checkpoint 3**: Present derived requirements.

```text
### Derived Requirements Review

Based on your prototype, I've derived these requirements:

{full requirements list}

### Open Questions
{list of clarifications needed}

How should we proceed?
1 - Requirements look good, create intent and continue inception
2 - Need to adjust requirements
3 - Answer open questions first
```

**Wait for user response.**

---

## Output

### Artifacts Created

Save to `memory-bank/prototypes/{prototype-name}/`:

1. **screen-inventory.md** - Catalog of all screens
2. **design-system.md** - Extracted design tokens and patterns
3. **component-catalog.md** - Component inventory
4. **user-flows.md** - Identified user flows
5. **derived-requirements.md** - Requirements ready for inception

### Summary Output

```markdown
## Vibe-to-Spec Complete: {prototype-name}

### Prototype Analysis
- **Screens analyzed**: {n}
- **Components identified**: {n}
- **User flows mapped**: {n}
- **Requirements derived**: {n}

### Artifacts Created
- `memory-bank/prototypes/{name}/screen-inventory.md`
- `memory-bank/prototypes/{name}/design-system.md`
- `memory-bank/prototypes/{name}/component-catalog.md`
- `memory-bank/prototypes/{name}/user-flows.md`
- `memory-bank/prototypes/{name}/derived-requirements.md`

### Next Steps

1 - **intent-create**: Create intent using derived requirements
2 - **requirements**: Refine requirements with standard flow
3 - **review**: Review all prototype artifacts

### Suggested Next Step
→ **intent-create** - Create intent "{suggested-name}" from prototype

**Type a number or press Enter for suggested action.**
```

---

## Integration with Inception Flow

After vibe-to-spec completes:

1. **intent-create** can reference `derived-requirements.md`
2. **requirements** skill can import and refine FR-P* items
3. **context** skill can use component catalog for system boundaries
4. **units** skill can organize by identified flows
5. **stories** skill can generate from user flow mapping

---

## Construction Phase Reference

When Construction Agent starts a bolt that references this prototype:

1. Load `design-system.md` for styling decisions
2. Reference `component-catalog.md` for component specs
3. Use screenshots as visual acceptance criteria
4. Apply extracted design tokens to implementation
5. **Use frontend-design skill if available** - When implementing UI components, invoke the `/frontend-design` skill for high-quality, production-grade frontend code that avoids generic AI aesthetics

---

## Test Contract

```yaml
input: Prototype folder with screenshots/HTML
output:
  - screen-inventory.md
  - design-system.md
  - component-catalog.md
  - user-flows.md
  - derived-requirements.md
checkpoints: 3
  - Checkpoint 1: Prototype inventory confirmed
  - Checkpoint 2: Design system approved
  - Checkpoint 3: Derived requirements approved
```
