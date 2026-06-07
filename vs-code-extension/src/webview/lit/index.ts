/**
 * Lit webview entry point.
 *
 * This is the browser entry point for the Lit-based webview.
 * It registers all Lit components. The host API module now falls back safely
 * when the same bundle is loaded outside VS Code.
 */

// Import shared components (for future reuse)
import '../components/shared/empty-state.js';
import '../components/shared/progress-bar.js';

// Import main app component (which imports all other components)
import '../components/app.js';
