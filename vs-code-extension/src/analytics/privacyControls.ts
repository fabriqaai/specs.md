/**
 * Privacy Controls
 *
 * Handles telemetry opt-out detection from environment variables
 * and VS Code settings. Respects user privacy preferences.
 *
 * Opt-out methods:
 * 1. DO_NOT_TRACK=1 environment variable (standard)
 * 2. SPECSMD_TELEMETRY_DISABLED=1 environment variable
 * 3. specsmd.telemetry.enabled VS Code setting (default: true)
 */

import * as vscode from 'vscode';

/**
 * Check if telemetry is disabled via environment variables
 *
 * @returns true if any opt-out environment variable is set
 */
export function isEnvOptOut(): boolean {
    // Respect DO_NOT_TRACK standard (https://consoledonottrack.com/)
    if (process.env.DO_NOT_TRACK === '1') {
        return true;
    }

    // specsmd-specific opt-out
    if (process.env.SPECSMD_TELEMETRY_DISABLED === '1') {
        return true;
    }

    return false;
}

/**
 * Check if telemetry is disabled via VS Code settings
 *
 * @returns true if the specsmd.telemetry.enabled setting is false
 */
export function isSettingOptOut(): boolean {
    try {
        const config = vscode.workspace.getConfiguration('specsmd');
        const enabled = config.get<boolean>('telemetry.enabled');

        // Only opt-out if explicitly set to false
        // undefined or true means telemetry is enabled
        return enabled === false;
    } catch {
        // If settings are not available, assume not opted out
        return false;
    }
}

/**
 * Check if telemetry is disabled by any method
 *
 * Checks both environment variables and VS Code settings.
 * Returns true if the user has opted out via any method.
 *
 * @returns true if telemetry should be disabled
 */
export function isTelemetryDisabled(): boolean {
    return isEnvOptOut() || isSettingOptOut();
}

/**
 * Get the reason for telemetry being disabled
 *
 * Useful for debugging and logging why telemetry is off.
 *
 * @returns Reason string or null if telemetry is enabled
 */
export function getOptOutReason(): string | null {
    if (process.env.DO_NOT_TRACK === '1') {
        return 'DO_NOT_TRACK environment variable';
    }

    if (process.env.SPECSMD_TELEMETRY_DISABLED === '1') {
        return 'SPECSMD_TELEMETRY_DISABLED environment variable';
    }

    try {
        const config = vscode.workspace.getConfiguration('specsmd');
        if (config.get<boolean>('telemetry.enabled') === false) {
            return 'VS Code setting specsmd.telemetry.enabled';
        }
    } catch {
        // Ignore settings errors
    }

    return null;
}
