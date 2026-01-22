/**
 * BaseStateStore - Abstract base class for flow state management.
 *
 * Provides:
 * - Observable pattern for state changes
 * - UI state persistence
 * - Common state management utilities
 *
 * Each flow extends this class with its specific state structure.
 *
 * See: MULTI_FLOW_ARCHITECTURE.md for full documentation.
 */

import * as vscode from 'vscode';
import { FlowStateManager, FlowStateListener, FlowComputedData } from './types';

// ============================================================================
// State Change Event
// ============================================================================

/**
 * Event emitted when state changes.
 */
export interface StateChangeEvent<T> {
    /** New state */
    state: T;
    /** Paths that changed (e.g., ['intents', 'computed.activeBolts']) */
    changedPaths: string[];
}

/**
 * Extended listener type that includes change info.
 */
export type StateChangeListener<T> = (event: StateChangeEvent<T>) => void;

// ============================================================================
// Base State Store Configuration
// ============================================================================

/**
 * Configuration for the base state store.
 */
export interface BaseStateStoreConfig {
    /** Prefix for UI state persistence keys */
    persistencePrefix: string;
    /** Whether to auto-compute derived state on changes */
    autoRecompute: boolean;
    /** Debounce time for notifications (ms) */
    notifyDebounceMs: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_BASE_CONFIG: BaseStateStoreConfig = {
    persistencePrefix: 'specsmd',
    autoRecompute: true,
    notifyDebounceMs: 0
};

// ============================================================================
// Base State Store
// ============================================================================

/**
 * Abstract base class for flow state stores.
 * Implements the Observable pattern and common state management.
 *
 * @template TState - The flow's state type
 * @template TArtifacts - The parsed artifacts type
 */
export abstract class BaseStateStore<TState, TArtifacts = unknown>
    implements FlowStateManager<TState> {

    protected _state: TState;
    protected _listeners: Set<FlowStateListener<TState>> = new Set();
    protected _changeListeners: Set<StateChangeListener<TState>> = new Set();
    protected _config: BaseStateStoreConfig;
    protected _context: vscode.ExtensionContext | null = null;
    protected _disposed: boolean = false;
    protected _notifyTimeout: NodeJS.Timeout | null = null;
    protected _pendingChanges: string[] = [];

    constructor(
        initialState: TState,
        config: Partial<BaseStateStoreConfig> = {}
    ) {
        this._state = initialState;
        this._config = { ...DEFAULT_BASE_CONFIG, ...config };
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    /**
     * Initialize the store with VS Code context for persistence.
     * @param context - VS Code extension context
     */
    initialize(context: vscode.ExtensionContext): void {
        this._context = context;
        this._restoreUIState();
    }

    // ========================================================================
    // State Access (IStateReader)
    // ========================================================================

    /**
     * Get the current state.
     */
    getState(): TState {
        return this._state;
    }

    /**
     * Get a subset of state by path.
     * @param path - Dot-separated path (e.g., 'computed.activeBolts')
     */
    getStatePath<V>(path: string): V | undefined {
        const parts = path.split('.');
        let current: unknown = this._state;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = (current as Record<string, unknown>)[part];
        }

        return current as V;
    }

    // ========================================================================
    // Subscriptions
    // ========================================================================

    /**
     * Subscribe to state changes.
     * @param listener - Callback function for state changes
     * @returns Unsubscribe function
     */
    subscribe(listener: FlowStateListener<TState>): () => void {
        this._listeners.add(listener);
        return () => {
            this._listeners.delete(listener);
        };
    }

    /**
     * Subscribe to state changes with detailed change info.
     * @param listener - Callback function with change event
     * @returns Unsubscribe function
     */
    subscribeWithChanges(listener: StateChangeListener<TState>): () => void {
        this._changeListeners.add(listener);
        return () => {
            this._changeListeners.delete(listener);
        };
    }

    // ========================================================================
    // State Updates
    // ========================================================================

    /**
     * Update state with partial changes.
     * @param updates - Partial state updates
     * @param changedPaths - Paths that changed
     */
    protected setState(updates: Partial<TState>, changedPaths: string[] = []): void {
        this._state = {
            ...this._state,
            ...updates
        };

        if (this._config.autoRecompute) {
            this.recompute();
            changedPaths.push('computed');
        }

        this._notify(changedPaths);
    }

    /**
     * Set a specific state path.
     * @param path - Dot-separated path
     * @param value - Value to set
     */
    protected setStatePath<V>(path: string, value: V): void {
        const parts = path.split('.');
        const newState = { ...this._state } as Record<string, unknown>;

        let current = newState;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            current[part] = { ...(current[part] as Record<string, unknown>) };
            current = current[part] as Record<string, unknown>;
        }

        current[parts[parts.length - 1]] = value;
        this._state = newState as TState;
        this._notify([path]);
    }

    // ========================================================================
    // Abstract Methods (Must be implemented by subclasses)
    // ========================================================================

    /**
     * Load state from parsed artifacts.
     * @param artifacts - Parsed artifact data
     */
    abstract loadFromArtifacts(artifacts: TArtifacts): void;

    /**
     * Get computed data for common UI elements.
     */
    abstract getComputedData(): FlowComputedData;

    /**
     * Recompute derived state.
     * Called automatically if autoRecompute is enabled.
     */
    abstract recompute(): void;

    /**
     * Create an empty/initial state.
     */
    protected abstract createEmptyState(): TState;

    // ========================================================================
    // UI State Persistence
    // ========================================================================

    /**
     * Persist UI state value.
     * @param key - State key (will be prefixed)
     * @param value - Value to persist
     */
    persistUIState(key: string, value: unknown): void {
        if (!this._context) {
            console.warn('BaseStateStore: Cannot persist UI state, no context');
            return;
        }

        const fullKey = `${this._config.persistencePrefix}.${key}`;
        this._context.workspaceState.update(fullKey, value);
    }

    /**
     * Get persisted UI state value.
     * @param key - State key (will be prefixed)
     * @param defaultValue - Default value if not found
     */
    getUIState<V>(key: string, defaultValue: V): V {
        if (!this._context) {
            return defaultValue;
        }

        const fullKey = `${this._config.persistencePrefix}.${key}`;
        const value = this._context.workspaceState.get<V>(fullKey);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Clear all persisted UI state for this store.
     */
    async clearUIState(): Promise<void> {
        if (!this._context) return;

        const keys = this._context.workspaceState.keys();
        const prefix = `${this._config.persistencePrefix}.`;

        for (const key of keys) {
            if (key.startsWith(prefix)) {
                await this._context.workspaceState.update(key, undefined);
            }
        }
    }

    /**
     * Restore UI state from persistence.
     * Override in subclass to restore flow-specific UI state.
     */
    protected _restoreUIState(): void {
        // Base implementation does nothing
        // Subclasses should override to restore specific UI state
    }

    // ========================================================================
    // Notifications
    // ========================================================================

    /**
     * Notify all listeners of state change.
     * @param changedPaths - Paths that changed
     */
    protected _notify(changedPaths: string[]): void {
        if (this._disposed) return;

        // Collect changes for debouncing
        this._pendingChanges.push(...changedPaths);

        // If no debounce, notify immediately
        if (this._config.notifyDebounceMs === 0) {
            this._flushNotifications();
            return;
        }

        // Debounce notifications
        if (this._notifyTimeout) {
            clearTimeout(this._notifyTimeout);
        }

        this._notifyTimeout = setTimeout(() => {
            this._flushNotifications();
        }, this._config.notifyDebounceMs);
    }

    /**
     * Flush pending notifications.
     */
    private _flushNotifications(): void {
        if (this._disposed) return;

        const changedPaths = [...new Set(this._pendingChanges)];
        this._pendingChanges = [];
        this._notifyTimeout = null;

        // Notify simple listeners
        for (const listener of this._listeners) {
            try {
                listener(this._state);
            } catch (error) {
                console.error('BaseStateStore: Error in listener:', error);
            }
        }

        // Notify change listeners with event
        const event: StateChangeEvent<TState> = {
            state: this._state,
            changedPaths
        };

        for (const listener of this._changeListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('BaseStateStore: Error in change listener:', error);
            }
        }
    }

    // ========================================================================
    // Reset & Disposal
    // ========================================================================

    /**
     * Reset state to initial/empty state.
     */
    reset(): void {
        this._state = this.createEmptyState();
        this._notify(['*']);
    }

    /**
     * Dispose the store and release resources.
     */
    dispose(): void {
        this._disposed = true;

        if (this._notifyTimeout) {
            clearTimeout(this._notifyTimeout);
            this._notifyTimeout = null;
        }

        this._listeners.clear();
        this._changeListeners.clear();
        this._pendingChanges = [];
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a Map from an array using a key extractor.
 * @param items - Array of items
 * @param keyFn - Function to extract key from item
 * @returns Map of items indexed by key
 */
export function indexByKey<T, K extends string | number>(
    items: T[],
    keyFn: (item: T) => K
): Map<K, T> {
    const map = new Map<K, T>();
    for (const item of items) {
        map.set(keyFn(item), item);
    }
    return map;
}

/**
 * Create a Map from an array using id property.
 * @param items - Array of items with id property
 * @returns Map of items indexed by id
 */
export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
    return indexByKey(items, item => item.id);
}

/**
 * Convert a Map to an array.
 * @param map - Map to convert
 * @returns Array of values
 */
export function mapToArray<K, V>(map: Map<K, V>): V[] {
    return Array.from(map.values());
}

/**
 * Deep clone an object.
 * @param obj - Object to clone
 * @returns Deep clone of the object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Map) {
        return new Map(obj) as T;
    }

    if (obj instanceof Set) {
        return new Set(obj) as T;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Check if two values are deeply equal.
 * @param a - First value
 * @param b - Second value
 * @returns true if deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, idx) => deepEqual(val, b[idx]));
    }

    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false;
        for (const [key, val] of a) {
            if (!b.has(key) || !deepEqual(val, b.get(key))) {
                return false;
            }
        }
        return true;
    }

    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false;
        for (const val of a) {
            if (!b.has(val)) return false;
        }
        return true;
    }

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}
