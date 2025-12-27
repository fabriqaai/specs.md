/**
 * Welcome view module for specsmd VS Code extension.
 *
 * Provides an onboarding experience for non-specsmd workspaces,
 * including installation flow and post-installation detection.
 */

export { WelcomeViewProvider } from './WelcomeViewProvider';
export { handleInstallCommand, createInstallationWatcher } from './installHandler';
