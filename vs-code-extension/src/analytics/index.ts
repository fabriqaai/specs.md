/**
 * Analytics Module
 *
 * Entry point for the specsmd analytics module.
 * Provides anonymous usage tracking while respecting privacy.
 */

// Main tracker export
export { tracker, AnalyticsTracker } from './tracker';

// Utility exports
export { getMachineId, generateSessionId, generateMachineId } from './machineId';
export { detectIDE, isAIEnhancedIDE } from './ideDetection';
export { isTelemetryDisabled, isEnvOptOut, isSettingOptOut, getOptOutReason } from './privacyControls';

// Type exports
export type { IDEInfo, BaseProperties, EventProperties, MixpanelLike } from './types';
