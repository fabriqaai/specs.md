# SpecsMD VS Code Extension - Developer Guide

This guide covers architecture, development setup, and publishing for maintainers.

## Architecture

The extension uses a hybrid rendering approach:
- **Bolts view**: Lit web components with reactive data binding
- **Specs/Overview views**: Server-rendered HTML with event delegation

This allows for rich interactivity in the Bolts view while keeping Specs/Overview lightweight.

### State Flow

```
File Watcher → Parser → StateStore → Selectors → WebviewProvider → Webview
                              ↓
                       [Computed State]
                              ↓
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
currentIntent            activeBolts              activityFeed
pendingBolts            completedBolts            nextActions
boltStats               overallProgress
```

---

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript and bundle webview
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

## File Structure

```
src/
├── sidebar/           # Extension host code
│   ├── webviewProvider.ts   # Main provider
│   └── webviewMessaging.ts  # Message types
├── webview/           # Webview UI code
│   ├── components/    # Lit components
│   │   ├── app.ts     # Root component
│   │   ├── tabs/      # Tab navigation
│   │   └── bolts/     # Bolts view components
│   ├── html.ts        # Server-rendered HTML generators
│   └── styles.ts      # CSS styles
├── parser/            # Memory bank parsing
│   ├── artifactParser.ts    # Parse intents/units/stories/bolts
│   ├── activityFeed.ts      # Derive activity events
│   └── dependencyComputation.ts  # Compute bolt dependencies
└── state/             # Centralized state management
    ├── stateStore.ts  # State container
    ├── selectors.ts   # Computed state derivation
    └── types.ts       # Type definitions
```

---

## Publishing (Maintainers)

The extension is automatically published to the VS Code Marketplace when changes are merged to `main`.

### Setup VSCE_PAT Secret

To enable automated publishing, configure the `VSCE_PAT` secret:

1. **Create Azure DevOps Organization** (if needed)
   - Go to https://dev.azure.com
   - Sign in with your Microsoft account
   - Create a new organization if you don't have one

2. **Create Personal Access Token**
   - Click your profile icon (top right) → "Personal access tokens"
   - Click "+ New Token"
   - Configure:
     - **Name**: `vscode-marketplace`
     - **Organization**: Select **"All accessible organizations"** (required for CLI publishing)
     - **Expiration**: Set as needed (max 1 year)
     - **Scopes**: Click "Show all scopes" → scroll to "Marketplace" → check **"Manage"**
   - Click "Create" and **copy the token immediately**

3. **Create Publisher** (if needed)
   - Go to https://marketplace.visualstudio.com/manage
   - Sign in with the same Microsoft account
   - Create publisher with ID `specsmd`

4. **Add Secret to GitHub**
   - Go to repository Settings → Secrets → Actions
   - Click "New repository secret"
   - Name: `VSCE_PAT`
   - Value: Paste your token
