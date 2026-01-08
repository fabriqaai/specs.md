/**
 * Analytics Types
 *
 * TypeScript interfaces for the analytics module.
 */

/**
 * IDE information detected from VS Code environment
 */
export interface IDEInfo {
    /** Normalized IDE name (e.g., 'vscode', 'cursor', 'windsurf') */
    name: string;
    /** IDE version (e.g., '1.85.0') */
    version: string;
    /** IDE host environment (e.g., 'desktop', 'web', 'codespaces') */
    host: string;
}

/**
 * Base properties included with every analytics event
 */
export interface BaseProperties {
    /** Machine identifier (SHA-256 hash) */
    distinct_id: string;
    /** Session identifier (UUID v4) */
    session_id: string;
    /** Normalized IDE name */
    ide_name: string;
    /** IDE version */
    ide_version: string;
    /** IDE host environment */
    ide_host: string;
    /** Operating system platform */
    platform: string;
    /** User locale */
    locale: string;
    /** Extension version */
    extension_version: string;
}

/**
 * Analytics event properties
 */
export type EventProperties = Record<string, unknown>;

/**
 * Mixpanel-compatible tracking interface
 */
export interface MixpanelLike {
    track(eventName: string, properties: Record<string, unknown>, callback?: (err?: Error) => void): void;
}
