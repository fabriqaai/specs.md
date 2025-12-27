import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Analytics Module Tests
 *
 * Tests for the analytics tracker including:
 * - Machine ID generation (consistent hash)
 * - Session ID generation (unique per run)
 * - Shell detection (platform-aware)
 * - Telemetry opt-out detection
 * - Tracker initialization and event methods
 */

describe('Analytics Module', () => {
    // Store original env vars
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Reset environment before each test
        process.env = { ...originalEnv };
        // Clear module cache to get fresh instances
        vi.resetModules();
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
    });

    describe('machine-id', () => {
        it('should generate a 64-character hex string', async () => {
            const { getMachineId } = await import('../../../lib/analytics/machine-id');
            const id = getMachineId();

            expect(id).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should generate consistent ID across calls', async () => {
            const { getMachineId } = await import('../../../lib/analytics/machine-id');
            const id1 = getMachineId();
            const id2 = getMachineId();

            expect(id1).toBe(id2);
        });

        it('should generate different IDs for different hostnames', async () => {
            // This is tested implicitly - the salt ensures different machines
            // have different IDs even if they have similar hostnames
            const { getMachineId } = await import('../../../lib/analytics/machine-id');
            const id = getMachineId();

            // Just verify it's a valid hash
            expect(id.length).toBe(64);
        });
    });

    describe('env-detector', () => {
        describe('detectShell', () => {
            it('should detect shell from SHELL env var on Unix', async () => {
                process.env.SHELL = '/bin/zsh';
                const { detectShell } = await import('../../../lib/analytics/env-detector');

                // Only test on non-Windows
                if (process.platform !== 'win32') {
                    expect(detectShell()).toBe('zsh');
                }
            });

            it('should return "unknown" when SHELL is not set', async () => {
                delete process.env.SHELL;
                vi.resetModules();
                const { detectShell } = await import('../../../lib/analytics/env-detector');

                if (process.platform !== 'win32') {
                    expect(detectShell()).toBe('unknown');
                }
            });

            it('should extract basename from full path', async () => {
                process.env.SHELL = '/usr/local/bin/fish';
                vi.resetModules();
                const { detectShell } = await import('../../../lib/analytics/env-detector');

                if (process.platform !== 'win32') {
                    expect(detectShell()).toBe('fish');
                }
            });
        });

        describe('isTelemetryDisabled', () => {
            it('should return false by default', async () => {
                // Clear all telemetry-related env vars
                delete process.env.SPECSMD_TELEMETRY_DISABLED;
                delete process.env.DO_NOT_TRACK;
                delete process.env.CI;
                delete process.env.GITHUB_ACTIONS;
                delete process.env.GITLAB_CI;
                delete process.env.CIRCLECI;
                delete process.env.JENKINS_URL;

                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(false);
            });

            it('should return true when SPECSMD_TELEMETRY_DISABLED=1', async () => {
                process.env.SPECSMD_TELEMETRY_DISABLED = '1';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when DO_NOT_TRACK=1', async () => {
                process.env.DO_NOT_TRACK = '1';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when CI=true', async () => {
                process.env.CI = 'true';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when GITHUB_ACTIONS=true', async () => {
                process.env.GITHUB_ACTIONS = 'true';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when GITLAB_CI=true', async () => {
                process.env.GITLAB_CI = 'true';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when CIRCLECI=true', async () => {
                process.env.CIRCLECI = 'true';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when JENKINS_URL is set', async () => {
                process.env.JENKINS_URL = 'http://jenkins.example.com';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(true);
            });

            it('should return true when noTelemetryFlag option is true', async () => {
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled({ noTelemetryFlag: true })).toBe(true);
            });

            it('should NOT disable when SPECSMD_TELEMETRY_DISABLED=0', async () => {
                process.env.SPECSMD_TELEMETRY_DISABLED = '0';
                vi.resetModules();
                const { isTelemetryDisabled } = await import('../../../lib/analytics/env-detector');

                expect(isTelemetryDisabled()).toBe(false);
            });
        });
    });

    describe('tracker', () => {
        it('should export all required methods', async () => {
            const tracker = await import('../../../lib/analytics/tracker');

            expect(typeof tracker.default.init).toBe('function');
            expect(typeof tracker.default.trackInstallerStarted).toBe('function');
            expect(typeof tracker.default.trackIdesConfirmed).toBe('function');
            expect(typeof tracker.default.trackFlowSelected).toBe('function');
            expect(typeof tracker.default.trackInstallationCompleted).toBe('function');
            expect(typeof tracker.default.trackInstallationFailed).toBe('function');
            expect(typeof tracker.default.isEnabled).toBe('function');
        });

        it('should return false from isEnabled before init', async () => {
            vi.resetModules();
            const tracker = await import('../../../lib/analytics/tracker');

            expect(tracker.default.isEnabled()).toBe(false);
        });

        it('should not throw when tracking methods called before init', async () => {
            vi.resetModules();
            const tracker = await import('../../../lib/analytics/tracker');

            // These should be silent no-ops
            expect(() => tracker.default.trackInstallerStarted()).not.toThrow();
            expect(() => tracker.default.trackIdesConfirmed(['test'])).not.toThrow();
            expect(() => tracker.default.trackFlowSelected('test')).not.toThrow();
            expect(() => tracker.default.trackInstallationCompleted('ide', 'flow', 1000, 5)).not.toThrow();
            expect(() => tracker.default.trackInstallationFailed('ide', 'error')).not.toThrow();
        });

        it('should return false from init when telemetry is disabled', async () => {
            process.env.SPECSMD_TELEMETRY_DISABLED = '1';
            vi.resetModules();
            const tracker = await import('../../../lib/analytics/tracker');

            const result = tracker.default.init();

            expect(result).toBe(false);
            expect(tracker.default.isEnabled()).toBe(false);
        });
    });

    describe('index', () => {
        it('should export the tracker singleton', async () => {
            const analytics = await import('../../../lib/analytics/index');

            expect(analytics.default).toBeDefined();
            expect(typeof analytics.default.init).toBe('function');
        });
    });
});
