---
id: vscode-extension-story-wlm-022
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
implemented: true
priority: must
created: 2025-12-26
---

# Story: Setup esbuild for Webview Bundling

## User Story

**As a** developer
**I want** a fast bundler for webview code
**So that** I can use npm packages (Lit) and have fast rebuilds

## Problem

Currently, webview code is:
- Inline template strings (no npm packages possible)
- No source maps for debugging
- No tree-shaking for bundle size
- No hot reload during development

## Acceptance Criteria

- [ ] **Given** webview source files, **When** build runs, **Then** single bundle.js created
- [ ] **Given** Lit dependency added, **When** bundled, **Then** included in output
- [ ] **Given** development mode, **When** file changes, **Then** rebuild < 100ms
- [ ] **Given** production build, **When** bundled, **Then** minified and tree-shaken
- [ ] **Given** bundle output, **When** loaded in webview, **Then** CSP compatible

## Technical Implementation

### 1. Install Dependencies
```bash
npm install -D esbuild
npm install lit
```

### 2. Create esbuild Config
```javascript
// esbuild.webview.mjs
import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
    entryPoints: ['src/webview/index.ts'],
    bundle: true,
    outfile: 'dist/webview/bundle.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: production,
    sourcemap: !production,
    define: {
        'process.env.NODE_ENV': production ? '"production"' : '"development"'
    }
});

if (watch) {
    await ctx.watch();
    console.log('Watching webview...');
} else {
    await ctx.rebuild();
    await ctx.dispose();
}
```

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "compile": "tsc -p ./ && node esbuild.webview.mjs",
    "watch": "npm-run-all -p watch:*",
    "watch:tsc": "tsc -watch -p ./",
    "watch:webview": "node esbuild.webview.mjs --watch",
    "vscode:prepublish": "npm run compile -- --production"
  }
}
```

### 4. Update Webview Provider to Load Bundle
```typescript
// webviewProvider.ts
private _getWebviewContent(webview: vscode.Webview): string {
    const bundleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview', 'bundle.js')
    );

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';">
    </head>
    <body>
        <specsmd-app></specsmd-app>
        <script src="${bundleUri}"></script>
    </body>
    </html>`;
}
```

### 5. Update .vscodeignore
```
# Don't package source, only dist
src/**
!dist/**
```

## Project Structure After
```
vs-code-extension/
├── src/
│   ├── extension.ts
│   ├── webview/
│   │   ├── index.ts          # Entry point
│   │   └── components/       # Lit components
│   └── ...
├── dist/
│   ├── extension.js          # Compiled extension
│   └── webview/
│       └── bundle.js         # Bundled webview
├── esbuild.webview.mjs
└── package.json
```

## Files to Create

- `esbuild.webview.mjs` - Build configuration

## Files to Modify

- `package.json` - Add scripts and dependencies
- `.vscodeignore` - Exclude src, include dist
- `src/sidebar/webviewProvider.ts` - Load bundle

## Testing

- `npm run compile` - Creates dist/webview/bundle.js
- `npm run watch` - Watch mode works
- Manual: Bundle loads in webview without CSP errors

## Dependencies

### Requires
- 021-remove-duplicate-files

### Enables
- 023-lit-scaffold
