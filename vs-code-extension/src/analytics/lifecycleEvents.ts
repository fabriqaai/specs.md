/**
 * Lifecycle Events
 *
 * Helper functions for tracking extension lifecycle events including
 * activation, welcome view funnel, and errors.
 */

import * as vscode from 'vscode';
import { tracker } from './tracker';
import type {
    ActivationTrigger,
    ErrorCategory,
    EventProperties,
} from './types';

// Event names
const EVENTS = {
    EXTENSION_ACTIVATED: 'extension_activated',
    WELCOME_VIEW_DISPLAYED: 'welcome_view_displayed',
    WELCOME_COPY_COMMAND_CLICKED: 'welcome_copy_command_clicked',
    WELCOME_INSTALL_CLICKED: 'welcome_install_clicked',
    WELCOME_WEBSITE_CLICKED: 'welcome_website_clicked',
    WELCOME_INSTALL_COMPLETED: 'welcome_install_completed',
    EXTENSION_ERROR: 'extension_error',
} as const;

// GlobalState key for first-activation detection
const HAS_ACTIVATED_BEFORE_KEY = 'specsmd.hasActivatedBefore';

/**
 * Check if this is the first-ever activation of the extension
 *
 * @param context - VS Code extension context
 * @returns true if this is the first activation
 */
export function isFirstActivation(context: vscode.ExtensionContext): boolean {
    try {
        return !context.globalState.get<boolean>(HAS_ACTIVATED_BEFORE_KEY);
    } catch {
        // If we can't read globalState, assume not first activation
        // to avoid false positives in metrics
        return false;
    }
}

/**
 * Mark the extension as having been activated
 * Call this after tracking the activation event
 *
 * @param context - VS Code extension context
 */
export function markAsActivated(context: vscode.ExtensionContext): void {
    try {
        context.globalState.update(HAS_ACTIVATED_BEFORE_KEY, true);
    } catch {
        // Silent failure - analytics should never break extension
    }
}

/**
 * Detect what triggered the extension activation
 *
 * @returns The activation trigger type
 */
export function detectActivationTrigger(): ActivationTrigger {
    try {
        // Check if there's a workspace folder open
        const hasWorkspace = vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length > 0;

        if (hasWorkspace) {
            return 'workspace';
        }

        // If no workspace, check if we might have been activated by URI or command
        // Since we can't reliably detect these, default to 'unknown'
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

/**
 * Track extension activation event
 *
 * @param context - VS Code extension context
 * @param isSpecsmdProject - Whether the workspace is a specsmd project
 */
export function trackActivation(
    context: vscode.ExtensionContext,
    isSpecsmdProject: boolean
): void {
    try {
        const properties: EventProperties = {
            is_specsmd_project: isSpecsmdProject,
            is_first_activation: isFirstActivation(context),
            activation_trigger: detectActivationTrigger(),
        };

        tracker.track(EVENTS.EXTENSION_ACTIVATED, properties);

        // Mark as activated after tracking
        markAsActivated(context);
    } catch {
        // Silent failure
    }
}

/**
 * Track welcome view displayed event
 */
export function trackWelcomeViewDisplayed(): void {
    try {
        const properties: EventProperties = {
            has_workspace: !!(vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length > 0),
        };
        tracker.track(EVENTS.WELCOME_VIEW_DISPLAYED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track welcome copy command clicked event
 */
export function trackWelcomeCopyCommandClicked(): void {
    try {
        tracker.track(EVENTS.WELCOME_COPY_COMMAND_CLICKED, {});
    } catch {
        // Silent failure
    }
}

/**
 * Track welcome install clicked event
 */
export function trackWelcomeInstallClicked(): void {
    try {
        tracker.track(EVENTS.WELCOME_INSTALL_CLICKED, {});
    } catch {
        // Silent failure
    }
}

/**
 * Track welcome website clicked event
 */
export function trackWelcomeWebsiteClicked(): void {
    try {
        tracker.track(EVENTS.WELCOME_WEBSITE_CLICKED, {});
    } catch {
        // Silent failure
    }
}

/**
 * Track welcome install completed event
 *
 * @param durationMs - Duration from install click to completion in milliseconds
 */
export function trackWelcomeInstallCompleted(durationMs?: number): void {
    try {
        const properties: EventProperties = {};
        if (durationMs !== undefined && durationMs > 0) {
            properties.duration_ms = durationMs;
        }
        tracker.track(EVENTS.WELCOME_INSTALL_COMPLETED, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Track an extension error event
 *
 * @param category - Category of the error
 * @param code - Error code (generic, no PII)
 * @param component - Component where error occurred
 * @param recoverable - Whether the extension recovered
 */
export function trackError(
    category: ErrorCategory,
    code: string,
    component: string,
    recoverable: boolean = true
): void {
    try {
        const properties: EventProperties = {
            error_category: category,
            error_code: sanitizeErrorCode(code),
            component: sanitizeComponent(component),
            recoverable,
        };
        tracker.track(EVENTS.EXTENSION_ERROR, properties);
    } catch {
        // Silent failure
    }
}

/**
 * Sanitize error code to ensure no PII
 * Removes file paths, keeps only generic error codes
 *
 * @param code - Raw error code
 * @returns Sanitized error code
 */
function sanitizeErrorCode(code: string): string {
    if (!code) {
        return 'UNKNOWN';
    }

    // Limit length
    let sanitized = code.substring(0, 50);

    // Convert to uppercase and replace spaces/special chars
    sanitized = sanitized.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Remove any potential path segments
    sanitized = sanitized.replace(/^.*[/\\]/g, '');

    return sanitized || 'UNKNOWN';
}

/**
 * Sanitize component name to ensure no PII
 *
 * @param component - Raw component name
 * @returns Sanitized component name
 */
function sanitizeComponent(component: string): string {
    if (!component) {
        return 'unknown';
    }

    // Limit length and lowercase
    let sanitized = component.substring(0, 30).toLowerCase();

    // Keep only alphanumeric and common separators
    sanitized = sanitized.replace(/[^a-z0-9_-]/g, '_');

    // Remove any potential path segments
    sanitized = sanitized.replace(/^.*[/\\]/g, '');

    return sanitized || 'unknown';
}

// Export event names for testing
export { EVENTS };
