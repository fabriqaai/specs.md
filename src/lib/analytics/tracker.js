/**
 * Analytics Tracker
 *
 * Mixpanel-based analytics for the specsmd installer.
 * Tracks anonymous usage patterns while respecting privacy.
 *
 * Features:
 * - Fire-and-forget event delivery (non-blocking)
 * - Silent failures (never breaks installation)
 * - Privacy-first (no PII, respects opt-out)
 */

const crypto = require('crypto');
const { getMachineId } = require('./machine-id');
const { detectShell, isTelemetryDisabled } = require('./env-detector');

// Mixpanel project token
// This is safe to embed - analytics tokens are public by design
const MIXPANEL_TOKEN = 'f405d1fa631f91137f9bb8e0a0277653';

/**
 * AnalyticsTracker - Singleton class for event tracking
 */
class AnalyticsTracker {
    constructor() {
        this.mixpanel = null;
        this.enabled = false;
        this.machineId = null;
        this.sessionId = null;
        this.baseProperties = null;
        this.initialized = false;
    }

    /**
     * Initialize the analytics tracker
     *
     * @param {Object} options - Initialization options
     * @param {boolean} options.noTelemetry - CLI flag to disable telemetry
     * @returns {boolean} True if analytics is enabled
     */
    init(options = {}) {
        if (this.initialized) {
            return this.enabled;
        }

        this.initialized = true;

        // Check if telemetry is disabled
        if (isTelemetryDisabled({ noTelemetryFlag: options.noTelemetry })) {
            this.enabled = false;
            return false;
        }

        try {
            // Lazy-load Mixpanel to avoid blocking if not needed
            const Mixpanel = require('mixpanel');
            this.mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {
                protocol: 'https',
                host: 'api-eu.mixpanel.com'  // EU endpoint for GDPR compliance
            });

            // Generate IDs
            this.machineId = getMachineId();
            this.sessionId = crypto.randomUUID();

            // Build base properties included with every event
            this.baseProperties = {
                distinct_id: this.machineId,
                session_id: this.sessionId,
                $os: process.platform,
                shell: detectShell(),
                node_version: process.version,
                specsmd_version: this._getVersion()
            };

            this.enabled = true;
            return true;
        } catch (error) {
            // Silent failure - analytics should never break installation
            this.enabled = false;
            return false;
        }
    }

    /**
     * Get specsmd version from package.json
     * @private
     */
    _getVersion() {
        try {
            const pkg = require('../../package.json');
            return pkg.version || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Track an event (fire-and-forget)
     * @private
     *
     * @param {string} eventName - Name of the event
     * @param {Object} properties - Additional event properties
     * @param {boolean} waitForDelivery - Wait for event to be sent
     * @returns {Promise<void>} Resolves when event is sent (if waitForDelivery is true)
     */
    track(eventName, properties = {}, waitForDelivery = false) {
        if (!this.enabled || !this.mixpanel) {
            return waitForDelivery ? Promise.resolve() : undefined;
        }

        const eventData = {
            ...this.baseProperties,
            ...properties
        };

        if (waitForDelivery) {
            return new Promise((resolve) => {
                try {
                    this.mixpanel.track(eventName, eventData, (err) => {
                        // Resolve regardless of error - silent failure
                        resolve();
                    });
                } catch {
                    resolve();
                }
            });
        }

        try {
            this.mixpanel.track(eventName, eventData);
        } catch {
            // Silent failure
        }
    }

    /**
     * Track installer_started event
     * Called when the installer begins
     * @returns {Promise<void>} Resolves when event is sent
     */
    trackInstallerStarted() {
        // Wait for delivery - critical funnel event
        return this.track('installer_started', {}, true);
    }

    /**
     * Track ides_confirmed event
     * Called after user confirms IDE/tool selection
     *
     * @param {string[]} ides - Array of selected IDE keys (e.g., ['claude-code', 'cursor'])
     * @returns {Promise<void>} Resolves when event is sent
     */
    trackIdesConfirmed(ides) {
        // Wait for delivery - critical funnel event
        return this.track('ides_confirmed', {
            ide_count: ides.length,
            ides: ides
        }, true);
    }

    /**
     * Track flow_selected event
     * Called after user selects an SDLC flow
     *
     * @param {string} flow - Flow key (e.g., 'aidlc', 'agile')
     * @returns {Promise<void>} Resolves when event is sent
     */
    trackFlowSelected(flow) {
        // Wait for delivery - critical funnel event
        return this.track('flow_selected', {
            flow: flow
        }, true);
    }

    /**
     * Track installation_completed event
     * Called after successful installation for an IDE
     *
     * @param {string} ide - IDE key (e.g., 'claude-code')
     * @param {string} flow - Flow key (e.g., 'aidlc')
     * @param {number} durationMs - Installation duration in milliseconds
     * @param {number} filesCreated - Number of files created
     */
    trackInstallationCompleted(ide, flow, durationMs, filesCreated) {
        this.track('installation_completed', {
            ide: ide,
            flow: flow,
            duration_ms: durationMs,
            files_created: filesCreated
        });
    }

    /**
     * Track installation_failed event
     * Called after failed installation for an IDE
     *
     * @param {string} ide - IDE key (e.g., 'claude-code')
     * @param {string} errorCategory - Error category (e.g., 'file_permission', 'network', 'unknown')
     * @param {string} [flow] - Flow key (optional, may not be selected yet)
     */
    trackInstallationFailed(ide, errorCategory, flow) {
        const properties = {
            ide: ide,
            error_category: errorCategory
        };

        if (flow) {
            properties.flow = flow;
        }

        this.track('installation_failed', properties);
    }

    /**
     * Check if analytics is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }
}

// Export singleton instance
const tracker = new AnalyticsTracker();

module.exports = tracker;
