/**
 * Analytics Module
 *
 * Exports the analytics tracker singleton for use throughout the installer.
 *
 * Usage:
 *   const analytics = require('./analytics');
 *
 *   // Initialize at startup
 *   analytics.init();
 *
 *   // Track events
 *   analytics.trackInstallerStarted();
 *   analytics.trackIdesConfirmed(['claude-code', 'cursor']);
 *   analytics.trackFlowSelected('aidlc');
 *   analytics.trackInstallationCompleted('claude-code', 'aidlc', 1500, 12);
 *   analytics.trackInstallationFailed('cursor', 'file_permission', 'aidlc');
 */

const tracker = require('./tracker');

module.exports = tracker;
