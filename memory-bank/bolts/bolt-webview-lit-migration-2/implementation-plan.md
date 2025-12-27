---
stage: plan
bolt: bolt-webview-lit-migration-2
created: 2025-12-26T20:30:00Z
---

# Implementation Plan: webview-lit-migration Bolt 2

## Objective

Create Lit project structure with base elements, theme styles, and a working tab navigation component. This establishes the component architecture for the full migration while keeping existing view content working via a hybrid approach.

## Integration Strategy

### Hybrid Approach

Rather than rewriting everything at once, we'll use a hybrid approach:

1. **Lit components handle**: Tab navigation, state management, messaging
2. **Existing HTML injected**: View content (Bolts, Specs, Overview) stays server-rendered initially
3. **Progressive migration**: Future bolts migrate view content to Lit components

This ensures the extension remains fully functional while we incrementally migrate.

## Deliverables

### Story 023: Lit Scaffold

- [ ] Install `lit` npm package
- [ ] Create directory structure under `src/webview/`
- [ ] Create `BaseElement` class with shared styles
- [ ] Create theme styles with VS Code CSS variables
- [ ] Create `<specsmd-app>` root component
- [ ] Update entry point to export vscode API
- [ ] Update esbuild to bundle Lit

### Story 024: Tabs Component

- [ ] Create `<view-tabs>` component with tab buttons
- [ ] Implement tab-change custom event
- [ ] Wire tabs to parent app component
- [ ] Connect to VS Code messaging for state persistence
- [ ] Integrate with existing view rendering

## Dependencies

### External

- `lit` - Core Lit library (~5kb gzipped)

### Internal

- `esbuild.webview.mjs` - Already configured from bolt-1
- `src/sidebar/webviewProvider.ts` - Needs update for Lit rendering
- `src/sidebar/webviewMessaging.ts` - Tab messages already defined

## Technical Approach

### 1. Project Structure

```
src/webview/
├── components/
│   ├── app.ts                 # Root <specsmd-app>
│   ├── tabs/
│   │   └── view-tabs.ts       # <view-tabs> component
│   └── shared/
│       └── base-element.ts    # Base class
├── styles/
│   └── theme.ts               # VS Code CSS variables
├── types/
│   └── vscode.ts              # VS Code API types
└── index.ts                   # Entry point
```

### 2. Hybrid Rendering Flow

```
Extension                        Webview (Lit)
---------                        -------------

1. Build WebviewData

2. Generate view HTML
   (Bolts, Specs, Overview)

3. Send to webview via
   postMessage()
                     →→→
                                 4. <specsmd-app> receives
                                    data via message event

                                 5. Injects HTML into
                                    view containers

                                 6. Tab clicks trigger
                                    postMessage() back
                     ←←←
7. Provider handles
   tab change
```

### 3. Component Design

**specsmd-app**
- Root component mounted in webview
- Manages active tab state
- Listens for extension messages
- Renders tabs + view containers

**view-tabs**
- Stateless presentation component
- Receives `activeTab` property
- Dispatches `tab-change` events
- Styled with VS Code theme colors

### 4. Key Implementation Details

**Entry Point** (`index.ts`)
```typescript
// Get VS Code API once at startup
export const vscode = acquireVsCodeApi();

// Import components to register them
import './components/app.js';
```

**App Component** (`app.ts`)
- Use `@state()` for activeTab
- Listen for `message` event from extension
- Use `innerHTML` for view content (temporary)
- Dispatch `tabChange` message on tab change

**WebviewProvider Changes**
- Send initial data via `postMessage()` instead of HTML
- Keep HTML generation for view content
- Handle tab changes same as before

## Acceptance Criteria

### Story 023: Lit Scaffold
- [ ] `npm install lit` succeeds
- [ ] esbuild bundles Lit without errors
- [ ] `<specsmd-app>` renders in webview
- [ ] VS Code theme colors applied
- [ ] Bundle size < 65kb (dev) / < 20kb (prod, gzipped)

### Story 024: Tabs Component
- [ ] Three tabs render with icons (⚡ 📋 📊)
- [ ] Active tab has accent color underline
- [ ] Click fires `tab-change` event
- [ ] Extension receives tab change message
- [ ] Tab state persists across sidebar hide/show

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CSP blocks Lit | Use IIFE bundle, no eval |
| Large bundle size | Lit is ~5kb, monitor size |
| View content regression | Keep existing HTML gen, test manually |
| State sync issues | Test hide/show cycle |

## Implementation Order

1. **Install Lit** - Add dependency, verify esbuild bundles it
2. **Create structure** - Set up directories and base files
3. **Build BaseElement** - Create shared styles class
4. **Build theme** - Create CSS variables module
5. **Build app component** - Root component with tab state
6. **Build tabs component** - Extract to separate component
7. **Update provider** - Change to postMessage approach
8. **Test integration** - Verify full flow works

## Notes

- This bolt keeps existing view content rendering (server-side HTML)
- Future bolts (3, 4, 5) will migrate Bolts/Specs/Overview views to Lit
- The hybrid approach minimizes risk and allows incremental testing
