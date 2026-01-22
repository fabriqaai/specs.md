/**
 * FileWatcher class for monitoring specsmd directory changes.
 * Uses VS Code's FileSystemWatcher for cross-platform compatibility.
 * Watches both memory-bank (AIDLC) and .specs-fire (FIRE) directories.
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
 * Watches specsmd directories (memory-bank and .specs-fire) for file changes.
 * Debounces rapid changes to prevent UI flicker.
 */
export class FileWatcher implements vscode.Disposable {
    private readonly workspacePath: string;
    private readonly onChangeCallback: OnChangeCallback;
    private readonly options: Required<FileWatcherOptions>;

    private watchers: vscode.FileSystemWatcher[] = [];
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
     * Starts watching specsmd directories (memory-bank and .specs-fire).
     * Creates FileSystemWatchers and attaches event handlers.
     */
    start(): void {
        if (this.watchers.length > 0) {
            // Already started
            return;
        }

        // Create debounced refresh function
        this.debouncedRefresh = debounce(
            this.onChangeCallback,
            this.options.debounceDelay
        );

        // Directories to watch
        const watchDirs = [
            { name: 'memory-bank', path: path.join(this.workspacePath, 'memory-bank') },
            { name: '.specs-fire', path: path.join(this.workspacePath, '.specs-fire') }
        ];

        for (const dir of watchDirs) {
            // Build glob pattern for this directory
            const pattern = new vscode.RelativePattern(
                dir.path,
                this.options.globPattern
            );

            // Create file system watcher
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);

            // Attach event handlers
            this.disposables.push(
                watcher.onDidCreate(() => this.handleChange('create')),
                watcher.onDidChange(() => this.handleChange('change')),
                watcher.onDidDelete(() => this.handleChange('delete'))
            );

            // Add watcher to disposables and track
            this.disposables.push(watcher);
            this.watchers.push(watcher);
        }
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
        return this.watchers.length > 0;
    }

    /**
     * Checks if there's a pending debounced refresh.
     */
    hasPendingRefresh(): boolean {
        return this.debouncedRefresh?.isPending() ?? false;
    }

    /**
     * Disposes the watchers and cleans up resources.
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

        // Clear watchers
        this.watchers = [];
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
