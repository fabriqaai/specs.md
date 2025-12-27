/**
 * Environment Detection
 *
 * Detects shell environment and telemetry opt-out settings.
 * Used to enrich analytics events and respect user privacy preferences.
 */

/**
 * Detect the user's shell/terminal environment
 *
 * @returns {string} Shell name (zsh, bash, powershell, cmd, fish, etc.) or 'unknown'
 */
function detectShell() {
    if (process.platform === 'win32') {
        const comspec = (process.env.ComSpec || '').toLowerCase();
        if (comspec.includes('powershell') || comspec.includes('pwsh')) {
            return 'powershell';
        }
        if (comspec.includes('cmd')) {
            return 'cmd';
        }
        return 'unknown';
    }

    // Unix-like systems (macOS, Linux)
    const shell = process.env.SHELL || '';
    const basename = shell.split('/').pop() || 'unknown';
    return basename;
}

/**
 * Check if telemetry is disabled via environment variables or CLI flag
 *
 * Respects:
 * - SPECSMD_TELEMETRY_DISABLED=1
 * - DO_NOT_TRACK=1
 * - CI environments (CI, GITHUB_ACTIONS, GITLAB_CI, CIRCLECI, JENKINS_URL)
 * - --no-telemetry CLI flag
 *
 * @param {Object} options - Optional overrides
 * @param {boolean} options.noTelemetryFlag - CLI flag state
 * @returns {boolean} True if telemetry should be disabled
 */
function isTelemetryDisabled(options = {}) {
    // Check CLI flag first (highest priority)
    if (options.noTelemetryFlag === true) {
        return true;
    }

    // Check process.argv for --no-telemetry flag
    if (process.argv.includes('--no-telemetry')) {
        return true;
    }

    // Check explicit opt-out environment variables
    if (process.env.SPECSMD_TELEMETRY_DISABLED === '1') {
        return true;
    }

    // Respect DO_NOT_TRACK standard (https://consoledonottrack.com/)
    if (process.env.DO_NOT_TRACK === '1') {
        return true;
    }

    // Auto-disable in CI environments
    if (process.env.CI === 'true') {
        return true;
    }

    if (process.env.GITHUB_ACTIONS === 'true') {
        return true;
    }

    if (process.env.GITLAB_CI === 'true') {
        return true;
    }

    if (process.env.CIRCLECI === 'true') {
        return true;
    }

    if (process.env.JENKINS_URL !== undefined) {
        return true;
    }

    return false;
}

module.exports = {
    detectShell,
    isTelemetryDisabled
};
