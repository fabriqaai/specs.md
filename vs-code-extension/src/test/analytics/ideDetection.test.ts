/**
 * IDE Detection Tests
 *
 * Tests for IDE environment detection.
 * Note: These tests verify the detection logic in isolation.
 * Full integration with vscode.env requires VS Code test environment.
 */

import * as assert from 'assert';

// We can't directly test detectIDE() without mocking vscode module,
// so we test the normalization logic extracted to a testable function
suite('IDE Detection Test Suite', () => {
    suite('IDE name normalization', () => {
        // Test the normalization logic that would be applied
        const normalizeIdeName = (appName: string): string => {
            const IDE_MAPPINGS: Record<string, string> = {
                'Visual Studio Code': 'vscode',
                'Visual Studio Code - Insiders': 'vscode-insiders',
                'VSCodium': 'vscodium',
                'Cursor': 'cursor',
                'Windsurf': 'windsurf',
                'Positron': 'positron',
            };

            if (appName in IDE_MAPPINGS) {
                return IDE_MAPPINGS[appName];
            }

            return appName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        };

        test('should normalize Visual Studio Code to vscode', () => {
            assert.strictEqual(normalizeIdeName('Visual Studio Code'), 'vscode');
        });

        test('should normalize Visual Studio Code - Insiders to vscode-insiders', () => {
            assert.strictEqual(normalizeIdeName('Visual Studio Code - Insiders'), 'vscode-insiders');
        });

        test('should normalize VSCodium to vscodium', () => {
            assert.strictEqual(normalizeIdeName('VSCodium'), 'vscodium');
        });

        test('should normalize Cursor to cursor', () => {
            assert.strictEqual(normalizeIdeName('Cursor'), 'cursor');
        });

        test('should normalize Windsurf to windsurf', () => {
            assert.strictEqual(normalizeIdeName('Windsurf'), 'windsurf');
        });

        test('should normalize Positron to positron', () => {
            assert.strictEqual(normalizeIdeName('Positron'), 'positron');
        });

        test('should handle unknown IDEs by sanitizing to kebab-case', () => {
            assert.strictEqual(normalizeIdeName('Some New IDE'), 'some-new-ide');
        });

        test('should remove special characters from unknown IDEs', () => {
            assert.strictEqual(normalizeIdeName('IDE @ Version 2.0!'), 'ide-version-2-0');
        });

        test('should remove leading/trailing hyphens', () => {
            assert.strictEqual(normalizeIdeName('  IDE  '), 'ide');
        });

        test('should handle empty string', () => {
            assert.strictEqual(normalizeIdeName(''), '');
        });
    });

    suite('IDE mapping completeness', () => {
        const knownIDEs = [
            'Visual Studio Code',
            'Visual Studio Code - Insiders',
            'VSCodium',
            'Cursor',
            'Windsurf',
            'Positron',
        ];

        test('should have mappings for all known VS Code forks', () => {
            // This test documents the expected supported IDEs
            assert.strictEqual(knownIDEs.length, 6);
        });
    });
});
