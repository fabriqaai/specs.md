---
stage: plan
bolt: bolt-welcome-view-1
created: 2025-12-25T22:00:00Z
---

## Implementation Plan: welcome-view

### Objective

Create an engaging welcome view for non-specsmd workspaces that explains specsmd and provides easy installation via terminal command, with automatic detection when installation completes.

### Deliverables

- `src/welcome/WelcomeViewProvider.ts` - WebviewViewProvider implementation
- `src/welcome/installHandler.ts` - Install button flow logic
- `src/welcome/index.ts` - Public exports
- `resources/logo.png` - Pixel logo for branding
- Update `package.json` with webview contributions

### Dependencies

- **bolt-artifact-parser-1**: `detectProject()` for checking if specsmd is installed
- **bolt-file-watcher-1**: File change events for post-installation detection
- **VS Code API**: WebviewViewProvider, Terminal API, Commands API

### Technical Approach

1. **WebviewViewProvider**: Create custom HTML/CSS view with:
   - Pixel logo (clickable → specs.md)
   - Brief explanation text
   - Copyable command box (`npx specsmd@latest install`)
   - Install button

2. **Install Flow**:
   - Button triggers confirmation modal
   - On confirm: create terminal, paste command (no auto-execute)
   - Terminal name: "specsmd install"

3. **Post-Installation Detection**:
   - Watch for `memory-bank/` or `.specsmd/` folder creation
   - Use `setContext` command to toggle view visibility
   - Integrate with existing file watcher

4. **View Toggle Logic**:
   - `when` clause: `specsmd.isProject` context
   - Welcome view shown when false
   - Tree view shown when true

### File Structure

```
vs-code-extension/
├── resources/
│   └── logo.png              # Pixel logo
└── src/
    └── welcome/
        ├── WelcomeViewProvider.ts   # Webview implementation
        ├── installHandler.ts        # Install button flow
        └── index.ts                 # Exports
```

### Acceptance Criteria

- [ ] Welcome view shows when no specsmd project detected
- [ ] Pixel logo displayed and clickable → specs.md
- [ ] Brief explanation text shown
- [ ] Copyable command box with `npx specsmd@latest install`
- [ ] Copy icon copies command to clipboard
- [ ] Install button shows confirmation modal
- [ ] Terminal opens with command pasted (not auto-executed)
- [ ] Auto-switches to tree when memory-bank/ or .specsmd/ appears
- [ ] Works in both light and dark themes
