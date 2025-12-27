/**
 * TypeScript interfaces for the file watcher module.
 */

import * as vscode from 'vscode';

/**
 * Type of file change event.
 */
export type FileChangeType = 'create' | 'change' | 'delete';

/**
 * Represents a file change event.
 */
export interface FileChangeEvent {
    /** Type of change */
    type: FileChangeType;
    /** URI of the changed file */
    uri: vscode.Uri;
}

/**
 * Callback function for file changes.
 */
export type OnChangeCallback = () => void;

/**
 * Options for creating a file watcher.
 */
export interface FileWatcherOptions {
    /** Debounce delay in milliseconds (default: 100) */
    debounceDelay?: number;
    /** Glob pattern to watch (default: **\/*.md) */
    globPattern?: string;
}

/**
 * Default options for file watcher.
 */
export const DEFAULT_FILE_WATCHER_OPTIONS: Required<FileWatcherOptions> = {
    debounceDelay: 100,
    globPattern: '**/*.md'
};
