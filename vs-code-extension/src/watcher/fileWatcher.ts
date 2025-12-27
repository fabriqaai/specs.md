/**
 * FileWatcher class for monitoring memory-bank directory changes.
 * Uses VS Code's FileSystemWatcher for cross-platform compatibility.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { debounce, DebouncedFunction } from './debounce';
import {
    OnChangeCallback,
    FileWatcherOptions,
    DEFAULT_FILE_WATCHER_OPTIONS
} from './types';

/**
 * Watches the memory-bank directory for file changes.
 * Debounces rapid changes to prevent UI flicker.
 */
export class FileWatcher implements vscode.Disposable {
    private readonly workspacePath: string;
    private readonly onChangeCallback: OnChangeCallback;
    private readonly options: Required<FileWatcherOptions>;

    private watcher: vscode.FileSystemWatcher | null = null;
    private debouncedRefresh: DebouncedFunction<OnChangeCallback> | null = null;
    private disposables: vscode.Disposable[] = [];

    /**
     * Creates a new FileWatcher instance.
     *
     * @param workspacePath - Root workspace path
     * @param onChangeCallback - Callback to invoke when files change
     * @param options - Optional configuration
     */
    constructor(
        workspacePath: string,
        onChangeCallback: OnChangeCallback,
        options?: FileWatcherOptions
    ) {
        this.workspacePath = workspacePath;
        this.onChangeCallback = onChangeCallback;
        this.options = { ...DEFAULT_FILE_WATCHER_OPTIONS, ...options };
    }

    /**
     * Starts watching the memory-bank directory.
     * Creates a FileSystemWatcher and attaches event handlers.
     */
    start(): void {
        if (this.watcher) {
            // Already started
            return;
        }

        // Create debounced refresh function
        this.debouncedRefresh = debounce(
            this.onChangeCallback,
            this.options.debounceDelay
        );

        // Build glob pattern for memory-bank
        const memoryBankPath = path.join(this.workspacePath, 'memory-bank');
        const pattern = new vscode.RelativePattern(
            memoryBankPath,
            this.options.globPattern
        );

        // Create file system watcher
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Attach event handlers
        this.disposables.push(
            this.watcher.onDidCreate(() => this.handleChange('create')),
            this.watcher.onDidChange(() => this.handleChange('change')),
            this.watcher.onDidDelete(() => this.handleChange('delete'))
        );

        // Add watcher to disposables
        this.disposables.push(this.watcher);
    }

    /**
     * Handles a file change event.
     * Triggers the debounced refresh callback.
     *
     * @param type - Type of change (create, change, delete)
     */
    private handleChange(_type: string): void {
        if (this.debouncedRefresh) {
            this.debouncedRefresh.call();
        }
    }

    /**
     * Checks if the watcher is currently active.
     */
    isActive(): boolean {
        return this.watcher !== null;
    }

    /**
     * Checks if there's a pending debounced refresh.
     */
    hasPendingRefresh(): boolean {
        return this.debouncedRefresh?.isPending() ?? false;
    }

    /**
     * Disposes the watcher and cleans up resources.
     * Cancels any pending debounced callbacks.
     */
    dispose(): void {
        // Cancel pending debounced callback
        if (this.debouncedRefresh) {
            this.debouncedRefresh.cancel();
            this.debouncedRefresh = null;
        }

        // Dispose all subscriptions
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];

        // Clear watcher reference
        this.watcher = null;
    }
}

/**
 * Creates and starts a file watcher for the given workspace.
 * Convenience function that combines construction and start.
 *
 * @param workspacePath - Root workspace path
 * @param onChangeCallback - Callback to invoke when files change
 * @param options - Optional configuration
 * @returns Started FileWatcher instance
 */
export function createFileWatcher(
    workspacePath: string,
    onChangeCallback: OnChangeCallback,
    options?: FileWatcherOptions
): FileWatcher {
    const watcher = new FileWatcher(workspacePath, onChangeCallback, options);
    watcher.start();
    return watcher;
}
