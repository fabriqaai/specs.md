/**
 * Analytics Tracker
 *
 * Mixpanel-based analytics for the specsmd VS Code extension.
 * Tracks anonymous usage patterns while respecting privacy.
 *
 * Features:
 * - Singleton pattern for consistent tracking
 * - Fire-and-forget event delivery (non-blocking)
 * - Silent failures (never breaks extension)
 * - Privacy-first (no PII, respects opt-out)
 * - Compatible with npx installer tracking
 */

import * as vscode from 'vscode';
import { getMachineId, generateSessionId } from './machineId';
import { detectIDE } from './ideDetection';
import { isTelemetryDisabled, getOptOutReason } from './privacyControls';
import type { BaseProperties, EventProperties, MixpanelLike } from './types';

// Mixpanel project token
// This is safe to embed - analytics tokens are public by design
// Same token as npx installer for consistent tracking
const MIXPANEL_TOKEN = 'f405d1fa631f91137f9bb8e0a0277653';

// EU endpoint for GDPR compliance
const MIXPANEL_HOST = 'api-eu.mixpanel.com';

/**
 * AnalyticsTracker - Singleton class for event tracking
 *
 * All methods are wrapped in try-catch to ensure analytics
 * never breaks the extension.
 */
class AnalyticsTracker {
    private static instance: AnalyticsTracker | null = null;

    private mixpanel: MixpanelLike | null = null;
    private enabled = false;
    private developmentMode = false;
    private machineId: string | null = null;
    private sessionId: string | null = null;
    private baseProperties: BaseProperties | null = null;
    private initialized = false;

    /**
     * Private constructor - use getInstance() instead
     */
    private constructor() {
        // Singleton - no direct instantiation
    }

    /**
     * Get the singleton instance
     *
     * @returns The AnalyticsTracker singleton
     */
    public static getInstance(): AnalyticsTracker {
        if (!AnalyticsTracker.instance) {
            AnalyticsTracker.instance = new AnalyticsTracker();
        }
        return AnalyticsTracker.instance;
    }

    /**
     * Reset the singleton instance (for testing only)
     */
    public static resetInstance(): void {
        AnalyticsTracker.instance = null;
    }

    /**
     * Initialize the analytics tracker
     *
     * Must be called during extension activation.
     * Safe to call multiple times - subsequent calls are no-ops.
     *
     * @param context - VS Code extension context
     * @returns true if analytics is enabled, false if disabled
     */
    public init(context: vscode.ExtensionContext): boolean {
        // Don't re-initialize
        if (this.initialized) {
            return this.enabled;
        }

        this.initialized = true;

        // Check if running in development mode (Extension Development Host)
        this.developmentMode = context.extensionMode === vscode.ExtensionMode.Development;
        if (this.developmentMode) {
            console.log('[specsmd] Running in development mode - analytics will log to console');
        }

        try {
            // Check privacy opt-out BEFORE any initialization
            if (isTelemetryDisabled()) {
                const reason = getOptOutReason();
                console.log(`[specsmd] Analytics disabled: ${reason}`);
                this.enabled = false;
                return false;
            }

            // Lazy-load Mixpanel to avoid blocking if not needed
            // Using dynamic require to handle optional dependency
            let Mixpanel: { init: (token: string, config: Record<string, unknown>) => MixpanelLike };
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                Mixpanel = require('mixpanel');
            } catch (e) {
                // Mixpanel not installed - disable analytics
                console.log('[specsmd] Mixpanel not available, analytics disabled', e);
                this.enabled = false;
                return false;
            }

            this.mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {
                protocol: 'https',
                host: MIXPANEL_HOST,
                // Note: geolocate enables IP-based geolocation for analytics.
                // This data is used solely for aggregate usage insights.
                // No personal identifiers are collected. Users can opt out.
                geolocate: true,
            });

            // Generate IDs
            this.machineId = getMachineId(context.globalState);
            this.sessionId = generateSessionId();

            // Detect IDE
            const ide = detectIDE();

            // Build base properties included with every event
            this.baseProperties = {
                distinct_id: this.machineId,
                session_id: this.sessionId,
                ide_name: ide.name,
                ide_version: ide.version,
                ide_host: ide.host,
                platform: process.platform,
                locale: vscode.env.language || 'unknown',
                extension_version: this.getExtensionVersion(context),
            };

            this.enabled = true;
            console.log('[specsmd] Analytics initialized successfully');
            return true;
        } catch (error) {
            // Silent failure - analytics should never break extension
            console.debug('[specsmd] Analytics initialization failed:', error);
            this.enabled = false;
            return false;
        }
    }

    /**
     * Get the extension version from package.json
     *
     * @param context - VS Code extension context
     * @returns Extension version string
     */
    private getExtensionVersion(context: vscode.ExtensionContext): string {
        try {
            const extension = vscode.extensions.getExtension(context.extension.id);
            return extension?.packageJSON?.version || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Track an event (fire-and-forget)
     *
     * @param eventName - Name of the event to track
     * @param properties - Additional event properties
     */
    public track(eventName: string, properties: EventProperties = {}): void {
        // CRITICAL: Never throw from this method
        try {
            if (!this.enabled || !this.mixpanel || !this.baseProperties) {
                return;
            }

            const eventData = {
                ...this.baseProperties,
                ...properties,
            };

            // In development mode, log full event data to console
            if (this.developmentMode) {
                console.log(`[specsmd analytics] ${eventName}`, JSON.stringify(eventData, null, 2));
                return; // Don't send to Mixpanel in development mode
            }

            // Fire and forget - don't await, no callback handling
            this.mixpanel.track(eventName, eventData);
        } catch {
            // Silent failure - analytics should never break extension
            // Don't even log to avoid any potential issues
        }
    }

    /**
     * Track an event and wait for delivery
     *
     * Use this for critical events where you need to ensure delivery
     * before the process exits (e.g., deactivation events).
     *
     * @param eventName - Name of the event to track
     * @param properties - Additional event properties
     * @returns Promise that resolves when event is sent (or fails silently)
     */
    public async trackWithDelivery(eventName: string, properties: EventProperties = {}): Promise<void> {
        // CRITICAL: Never throw from this method
        try {
            if (!this.enabled || !this.mixpanel || !this.baseProperties) {
                return;
            }

            const eventData = {
                ...this.baseProperties,
                ...properties,
            };

            // In development mode, log full event data to console
            if (this.developmentMode) {
                console.log(`[specsmd analytics] ${eventName}`, JSON.stringify(eventData, null, 2));
                return; // Don't send to Mixpanel in development mode
            }

            await new Promise<void>((resolve) => {
                try {
                    this.mixpanel!.track(eventName, eventData, () => {
                        // Resolve regardless of error - silent failure
                        resolve();
                    });

                    // Timeout after 2 seconds to avoid blocking
                    setTimeout(resolve, 2000);
                } catch {
                    resolve();
                }
            });
        } catch {
            // Silent failure
        }
    }

    /**
     * Check if analytics is enabled
     *
     * @returns true if tracking is active
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get base properties (for testing/debugging)
     *
     * @returns Base properties object or null if not initialized
     */
    public getBaseProperties(): BaseProperties | null {
        return this.baseProperties;
    }

    /**
     * Get the machine ID (for testing/debugging)
     *
     * @returns Machine ID or null if not initialized
     */
    public getMachineId(): string | null {
        return this.machineId;
    }

    /**
     * Get the session ID (for testing/debugging)
     *
     * @returns Session ID or null if not initialized
     */
    public getSessionId(): string | null {
        return this.sessionId;
    }

    /**
     * Check if running in development mode
     *
     * @returns true if running in Extension Development Host
     */
    public isDevelopmentMode(): boolean {
        return this.developmentMode;
    }
}

// Export singleton getter and class for testing
export { AnalyticsTracker };
export const tracker = AnalyticsTracker.getInstance();
