# Implementation Walkthrough: Bolt 2 - Lit Scaffold and Tabs Component

## Summary

This bolt implemented the foundational Lit web component infrastructure for the VS Code webview, including the base element class, theming system, tab navigation component, and the root application component with hybrid rendering support.

## Files Created

### Story 023: Lit Component Scaffold

1. **`src/webview/types/vscode.ts`** - VS Code Webview API type declarations
   - Defines `VsCodeApi` interface for `postMessage`, `getState`, `setState`
   - Declares global `acquireVsCodeApi()` function

2. **`src/webview/vscode-api.ts`** - VS Code API singleton instance
   - Acquires the VS Code API once at module load
   - Exports `vscode` for use by Lit components

3. **`src/webview/styles/theme.ts`** - Theme system using VS Code CSS variables
   - `themeStyles`: Maps VS Code CSS variables to component variables
   - `resetStyles`: Consistent reset for all components
   - SpecsMD accent colors for status indicators

4. **`src/webview/components/shared/base-element.ts`** - Base class for all components
   - Extends `LitElement`
   - Provides shared `baseStyles` array with theming and resets
   - All components extend this for consistent styling

5. **`src/webview/lit/index.ts`** - Lit bundle entry point
   - Imports vscode-api module to acquire API
   - Imports app component to register custom elements
   - Entry point for esbuild bundling

6. **`src/webview/utils.ts`** - Utility functions
   - Moved `getNonce` to separate file for testability
   - No dependencies on VS Code module

### Story 024: View Tabs Component

7. **`src/webview/components/tabs/view-tabs.ts`** - Tab navigation component
   - `@customElement('view-tabs')`
   - `activeTab` property for current tab
   - Dispatches `tab-change` custom event
   - Styled tabs with active indicator

8. **`src/webview/components/app.ts`** - Root application component
   - `@customElement('specsmd-app')`
   - State: `_activeTab`, `_boltsHtml`, `_specsHtml`, `_overviewHtml`, `_loaded`
   - Handles `setData` and `setTab` messages from extension
   - Uses `unsafeHTML` for server-rendered view content
   - Communicates tab changes back to extension

## Files Modified

### Build Configuration

1. **`tsconfig.json`** - Exclude Lit components from main compilation
   - Added exclusions for webview/components, styles, types, lit, vscode-api

2. **`tsconfig.test.json`** - Exclude Lit components from test compilation
   - Same exclusions as main tsconfig

3. **`tsconfig.webview.json`** (created) - Separate config for webview code
   - `experimentalDecorators: true` for Lit decorators
   - `useDefineForClassFields: false` for decorator compatibility
   - Browser-targeted lib (`DOM`, `ES2020`)
   - `noEmit: true` (type checking only, esbuild handles transpilation)

4. **`esbuild.webview.mjs`** - Updated entry point
   - Changed from `src/webview/index.ts` to `src/webview/lit/index.ts`

5. **`package.json`** - Added webview type checking to build
   - `compile` now runs both tsc configs before esbuild
   - Added `typecheck:webview` script

### WebView Provider Integration

6. **`src/webview/index.ts`** - Added Lit scaffold function
   - Re-exports `getNonce` from utils for backward compatibility
   - Re-exports view HTML generators
   - Added `getLitWebviewContent()` for Lit-based scaffold

7. **`src/sidebar/webviewProvider.ts`** - Dual-mode support
   - Added `_useLitMode = true` flag
   - Added `_sendDataToWebview()` for postMessage approach
   - Updated `resolveWebviewView()` for Lit scaffold
   - Updated `_updateWebview()` for postMessage in Lit mode
   - Updated `setActiveTab()` to send `setTab` message
   - Updated `_handleMessage('ready')` to send initial data

### Test Updates

8. **`src/test/sidebar/webviewContent.test.ts`** - Updated import path
   - Changed from `../../webview` to `../../webview/utils`

## Architecture Decisions

### Hybrid Rendering Approach
- **Lit handles**: Tab navigation, state management, message passing
- **Server generates**: View HTML content (bolts, specs, overview)
- **Rationale**: Progressive migration without rewriting all HTML generation

### Separate TypeScript Configs
- Main tsconfig for Node/VS Code extension code
- Webview tsconfig with browser settings and decorator support
- esbuild handles actual transpilation for browser

### Feature Flag for Lit Mode
- `_useLitMode` flag in webviewProvider enables easy toggling
- Can be converted to configuration setting later
- Allows A/B testing and gradual rollout

## Verification

- All 263 tests passing
- TypeScript compilation successful
- Webview bundle generated (40.32 KB development)
- No errors in build pipeline

## Next Steps

- Story 025: Focus Card component (Lit)
- Story 026: Activity Feed component (Lit)
- Story 027: Queue List component (Lit)
