/**
 * Lit webview entry point.
 *
 * This is the browser entry point for the Lit-based webview.
 * It imports the VS Code API (which acquires it) and registers all Lit components.
 */

// Import the vscode API module first (this acquires the API)
import '../vscode-api.js';

// Import shared components (for future reuse)
import '../components/shared/empty-state.js';
import '../components/shared/progress-bar.js';

// Import main app component (which imports all other components)
import '../components/app.js';
