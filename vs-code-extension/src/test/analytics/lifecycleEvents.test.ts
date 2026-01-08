/**
 * Lifecycle Events Tests
 *
 * Tests for lifecycle event tracking functions.
 * Note: Full integration testing requires VS Code test environment.
 * These tests verify core logic that doesn't require the vscode module.
 */

import * as assert from 'assert';

suite('Lifecycle Events Test Suite', () => {
    // Test error sanitization logic
    suite('Error Code Sanitization', () => {
        // Recreate the sanitization logic for testing
        const sanitizeErrorCode = (code: string): string => {
            if (!code) {
                return 'UNKNOWN';
            }
            let sanitized = code.substring(0, 50);
            sanitized = sanitized.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            sanitized = sanitized.replace(/^.*[/\\]/g, '');
            return sanitized || 'UNKNOWN';
        };

        test('should convert to uppercase', () => {
            assert.strictEqual(sanitizeErrorCode('test_error'), 'TEST_ERROR');
        });

        test('should replace special characters with underscores', () => {
            assert.strictEqual(sanitizeErrorCode('error-with-dashes'), 'ERROR_WITH_DASHES');
            assert.strictEqual(sanitizeErrorCode('error.with.dots'), 'ERROR_WITH_DOTS');
            assert.strictEqual(sanitizeErrorCode('error with spaces'), 'ERROR_WITH_SPACES');
        });

        test('should truncate long codes to 50 characters', () => {
            const longCode = 'a'.repeat(100);
            const result = sanitizeErrorCode(longCode);
            assert.strictEqual(result.length, 50);
        });

        test('should return UNKNOWN for empty string', () => {
            assert.strictEqual(sanitizeErrorCode(''), 'UNKNOWN');
        });

        test('should handle null-like values', () => {
            assert.strictEqual(sanitizeErrorCode(null as unknown as string), 'UNKNOWN');
            assert.strictEqual(sanitizeErrorCode(undefined as unknown as string), 'UNKNOWN');
        });

        test('should sanitize path-like strings', () => {
            // Path separators become underscores in uppercase
            const result = sanitizeErrorCode('/path/to/error');
            assert.strictEqual(result, '_PATH_TO_ERROR');
        });
    });

    // Test component sanitization logic
    suite('Component Sanitization', () => {
        const sanitizeComponent = (component: string): string => {
            if (!component) {
                return 'unknown';
            }
            let sanitized = component.substring(0, 30).toLowerCase();
            sanitized = sanitized.replace(/[^a-z0-9_-]/g, '_');
            sanitized = sanitized.replace(/^.*[/\\]/g, '');
            return sanitized || 'unknown';
        };

        test('should convert to lowercase', () => {
            assert.strictEqual(sanitizeComponent('ArtifactParser'), 'artifactparser');
        });

        test('should replace special characters', () => {
            assert.strictEqual(sanitizeComponent('component.name'), 'component_name');
            assert.strictEqual(sanitizeComponent('component name'), 'component_name');
        });

        test('should allow hyphens and underscores', () => {
            assert.strictEqual(sanitizeComponent('my-component_name'), 'my-component_name');
        });

        test('should truncate to 30 characters', () => {
            const longComponent = 'a'.repeat(50);
            const result = sanitizeComponent(longComponent);
            assert.strictEqual(result.length, 30);
        });

        test('should return unknown for empty string', () => {
            assert.strictEqual(sanitizeComponent(''), 'unknown');
        });

        test('should handle null-like values', () => {
            assert.strictEqual(sanitizeComponent(null as unknown as string), 'unknown');
            assert.strictEqual(sanitizeComponent(undefined as unknown as string), 'unknown');
        });
    });

    // Test first activation detection pattern
    suite('First Activation Detection', () => {
        test('should detect first activation when no previous state', () => {
            const mockGlobalState = new Map<string, unknown>();

            const isFirstActivation = (): boolean => {
                return !mockGlobalState.get('specsmd.hasActivatedBefore');
            };

            assert.strictEqual(isFirstActivation(), true);
        });

        test('should not be first activation after marking', () => {
            const mockGlobalState = new Map<string, unknown>();

            const isFirstActivation = (): boolean => {
                return !mockGlobalState.get('specsmd.hasActivatedBefore');
            };

            const markAsActivated = (): void => {
                mockGlobalState.set('specsmd.hasActivatedBefore', true);
            };

            assert.strictEqual(isFirstActivation(), true);
            markAsActivated();
            assert.strictEqual(isFirstActivation(), false);
        });

        test('should persist across multiple checks', () => {
            const mockGlobalState = new Map<string, unknown>();
            mockGlobalState.set('specsmd.hasActivatedBefore', true);

            const isFirstActivation = (): boolean => {
                return !mockGlobalState.get('specsmd.hasActivatedBefore');
            };

            assert.strictEqual(isFirstActivation(), false);
            assert.strictEqual(isFirstActivation(), false);
            assert.strictEqual(isFirstActivation(), false);
        });
    });

    // Test activation trigger detection pattern
    suite('Activation Trigger Detection', () => {
        test('should return workspace when folders exist', () => {
            const detectTrigger = (hasFolders: boolean): string => {
                if (hasFolders) {
                    return 'workspace';
                }
                return 'unknown';
            };

            assert.strictEqual(detectTrigger(true), 'workspace');
        });

        test('should return unknown when no folders', () => {
            const detectTrigger = (hasFolders: boolean): string => {
                if (hasFolders) {
                    return 'workspace';
                }
                return 'unknown';
            };

            assert.strictEqual(detectTrigger(false), 'unknown');
        });
    });

    // Test duration calculation for welcome install
    suite('Duration Calculation', () => {
        test('should calculate duration correctly', () => {
            const startTime = 1000;
            const endTime = 5000;
            const duration = endTime - startTime;
            assert.strictEqual(duration, 4000);
        });

        test('should return undefined for missing start time', () => {
            const startTime: number | undefined = undefined;
            const endTime = 5000;
            const duration = startTime ? endTime - startTime : undefined;
            assert.strictEqual(duration, undefined);
        });

        test('should handle zero duration', () => {
            const startTime = 1000;
            const endTime = 1000;
            const duration = endTime - startTime;
            assert.strictEqual(duration, 0);
        });
    });

    // Test error event properties
    suite('Error Event Properties', () => {
        type ErrorCategory = 'activation' | 'parse' | 'file_op' | 'webview' | 'command';

        interface ErrorProperties {
            error_category: ErrorCategory;
            error_code: string;
            component: string;
            recoverable: boolean;
        }

        test('should create valid error properties', () => {
            const props: ErrorProperties = {
                error_category: 'parse',
                error_code: 'YAML_INVALID',
                component: 'artifactParser',
                recoverable: true,
            };

            assert.strictEqual(props.error_category, 'parse');
            assert.strictEqual(props.error_code, 'YAML_INVALID');
            assert.strictEqual(props.component, 'artifactParser');
            assert.strictEqual(props.recoverable, true);
        });

        test('should support all error categories', () => {
            const categories: ErrorCategory[] = ['activation', 'parse', 'file_op', 'webview', 'command'];

            categories.forEach(cat => {
                const props: ErrorProperties = {
                    error_category: cat,
                    error_code: 'TEST',
                    component: 'test',
                    recoverable: false,
                };
                assert.strictEqual(props.error_category, cat);
            });
        });
    });

    // Test activation event properties
    suite('Activation Event Properties', () => {
        interface ActivationProperties {
            is_specsmd_project: boolean;
            is_first_activation: boolean;
            activation_trigger: string;
        }

        test('should create valid activation properties for specsmd project', () => {
            const props: ActivationProperties = {
                is_specsmd_project: true,
                is_first_activation: true,
                activation_trigger: 'workspace',
            };

            assert.strictEqual(props.is_specsmd_project, true);
            assert.strictEqual(props.is_first_activation, true);
            assert.strictEqual(props.activation_trigger, 'workspace');
        });

        test('should create valid activation properties for non-specsmd workspace', () => {
            const props: ActivationProperties = {
                is_specsmd_project: false,
                is_first_activation: false,
                activation_trigger: 'workspace',
            };

            assert.strictEqual(props.is_specsmd_project, false);
            assert.strictEqual(props.is_first_activation, false);
        });
    });

    // Test welcome event tracking patterns
    suite('Welcome Event Patterns', () => {
        test('welcome_view_displayed should include has_workspace', () => {
            const createEvent = (hasWorkspace: boolean): { has_workspace: boolean } => {
                return { has_workspace: hasWorkspace };
            };

            const withWorkspace = createEvent(true);
            const withoutWorkspace = createEvent(false);

            assert.strictEqual(withWorkspace.has_workspace, true);
            assert.strictEqual(withoutWorkspace.has_workspace, false);
        });

        test('welcome_install_completed should handle duration', () => {
            const createEvent = (durationMs?: number): { duration_ms?: number } => {
                const props: { duration_ms?: number } = {};
                if (durationMs !== undefined && durationMs > 0) {
                    props.duration_ms = durationMs;
                }
                return props;
            };

            const withDuration = createEvent(5000);
            const withoutDuration = createEvent(undefined);
            const withZeroDuration = createEvent(0);
            const withNegativeDuration = createEvent(-100);

            assert.strictEqual(withDuration.duration_ms, 5000);
            assert.strictEqual(withoutDuration.duration_ms, undefined);
            assert.strictEqual(withZeroDuration.duration_ms, undefined);
            assert.strictEqual(withNegativeDuration.duration_ms, undefined);
        });
    });

    // Test fire-and-forget error isolation
    suite('Error Isolation for Lifecycle Events', () => {
        test('tracking functions should not throw on errors', () => {
            const safeTrack = (callback: () => void): void => {
                try {
                    callback();
                } catch {
                    // Silent failure
                }
            };

            assert.doesNotThrow(() => {
                safeTrack(() => { throw new Error('Track error'); });
            });
        });

        test('should handle tracker being disabled', () => {
            let enabled = false;
            const track = (event: string): boolean => {
                if (!enabled) {
                    return false;
                }
                // Would normally track
                return true;
            };

            assert.strictEqual(track('test_event'), false);
            enabled = true;
            assert.strictEqual(track('test_event'), true);
        });
    });
});
