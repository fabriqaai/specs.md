/**
 * File Watcher Module
 *
 * Provides file system watching for memory-bank directory with debounced callbacks.
 *
 * @example
 * ```typescript
 * import { FileWatcher, createFileWatcher } from './watcher';
 *
 * // Option 1: Use class directly
 * const watcher = new FileWatcher('/path/to/workspace', () => {
 *   console.log('Files changed!');
 * });
 * watcher.start();
 *
 * // Option 2: Use convenience function
 * const watcher = createFileWatcher('/path/to/workspace', () => {
 *   console.log('Files changed!');
 * });
 *
 * // Cleanup
 * watcher.dispose();
 * ```
 */

// Types
export {
    FileChangeType,
    FileChangeEvent,
    OnChangeCallback,
    FileWatcherOptions,
    DEFAULT_FILE_WATCHER_OPTIONS
} from './types';

// Debounce utility
export { debounce, DebouncedFunction } from './debounce';

// FileWatcher class
export { FileWatcher, createFileWatcher } from './fileWatcher';
