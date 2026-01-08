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

// Lifecycle event exports
export {
    trackActivation,
    trackWelcomeViewDisplayed,
    trackWelcomeCopyCommandClicked,
    trackWelcomeInstallClicked,
    trackWelcomeWebsiteClicked,
    trackWelcomeInstallCompleted,
    trackError,
    isFirstActivation,
    markAsActivated,
    detectActivationTrigger,
    EVENTS,
} from './lifecycleEvents';

// Engagement event exports
export {
    trackTabChanged,
    trackBoltAction,
    trackArtifactOpened,
    trackFilterChanged,
    normalizeBoltType,
    normalizeBoltStatus,
    ENGAGEMENT_EVENTS,
} from './engagementEvents';

// Project metrics event exports
export {
    projectMetricsTracker,
    ProjectMetricsTracker,
    PROJECT_EVENTS,
} from './projectMetricsEvents';

// Type exports
export type {
    IDEInfo,
    BaseProperties,
    EventProperties,
    MixpanelLike,
    ActivationTrigger,
    ActivationEventProperties,
    ErrorCategory,
    ErrorEventProperties,
    WelcomeInstallCompletedProperties,
    WelcomeViewDisplayedProperties,
    // Engagement event types
    TabId as AnalyticsTabId,
    BoltAction,
    BoltType,
    BoltStatus,
    ArtifactType,
    FilterType,
    TabChangedEventProperties,
    BoltActionEventProperties,
    ArtifactOpenedEventProperties,
    FilterChangedEventProperties,
    // Project metrics event types
    ProjectCounts,
    ProjectSnapshotEventProperties,
    ProjectChangeType,
    ProjectChangedEventProperties,
} from './types';
