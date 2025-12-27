import * as assert from 'assert';
import {
    FileWatcherOptions,
    DEFAULT_FILE_WATCHER_OPTIONS
} from '../../watcher/types';

/**
 * Note: Full FileWatcher integration tests require VS Code's extension host.
 * These tests cover the configuration and type aspects that can be tested
 * without the VS Code runtime.
 */

suite('FileWatcher Test Suite', () => {

    suite('FileWatcherOptions', () => {

        test('should have correct default debounce delay', () => {
            assert.strictEqual(DEFAULT_FILE_WATCHER_OPTIONS.debounceDelay, 100);
        });

        test('should have correct default glob pattern', () => {
            assert.strictEqual(DEFAULT_FILE_WATCHER_OPTIONS.globPattern, '**/*.md');
        });

        test('should allow partial options', () => {
            const options: FileWatcherOptions = {
                debounceDelay: 200
            };

            const merged = { ...DEFAULT_FILE_WATCHER_OPTIONS, ...options };

            assert.strictEqual(merged.debounceDelay, 200);
            assert.strictEqual(merged.globPattern, '**/*.md');
        });

        test('should allow custom glob pattern', () => {
            const options: FileWatcherOptions = {
                globPattern: '**/*.yaml'
            };

            const merged = { ...DEFAULT_FILE_WATCHER_OPTIONS, ...options };

            assert.strictEqual(merged.debounceDelay, 100);
            assert.strictEqual(merged.globPattern, '**/*.yaml');
        });

        test('should allow all custom options', () => {
            const options: FileWatcherOptions = {
                debounceDelay: 500,
                globPattern: '**/*'
            };

            const merged = { ...DEFAULT_FILE_WATCHER_OPTIONS, ...options };

            assert.strictEqual(merged.debounceDelay, 500);
            assert.strictEqual(merged.globPattern, '**/*');
        });
    });

    suite('FileWatcher behavior (unit tests)', () => {

        /**
         * These tests validate the expected behavior patterns.
         * Full integration tests with VS Code API are in the vscode test suite.
         */

        test('should debounce with 100ms delay by default', () => {
            // The default options specify 100ms debounce
            assert.strictEqual(DEFAULT_FILE_WATCHER_OPTIONS.debounceDelay, 100);
        });

        test('should watch only markdown files by default', () => {
            // The default glob pattern is for .md files
            assert.ok(DEFAULT_FILE_WATCHER_OPTIONS.globPattern.includes('.md'));
        });
    });
});
