/**
 * Machine ID Generation
 *
 * Generates a stable, anonymous machine identifier using a salted SHA-256 hash
 * of the hostname. This ensures:
 * - Same machine always produces same ID
 * - Cannot reverse-lookup the hostname from the hash
 * - No PII is stored or transmitted
 *
 * Compatible with the npx installer machine ID generation.
 */

import * as crypto from 'crypto';
import * as os from 'os';
import type * as vscode from 'vscode';

// Constant salt prevents rainbow table attacks
// MUST match the npx installer salt for ID consistency
const SALT = 'specsmd-analytics-v1';

// Key used to store machine ID in globalState
const MACHINE_ID_KEY = 'specsmd.machineId';

/**
 * Generate a stable machine identifier
 *
 * @returns SHA-256 hash of salted hostname (64 hex characters)
 */
export function generateMachineId(): string {
    const hostname = os.hostname();
    return crypto
        .createHash('sha256')
        .update(SALT + hostname)
        .digest('hex');
}

/**
 * Get or create a persistent machine ID
 *
 * Retrieves the machine ID from globalState if available,
 * otherwise generates a new one and persists it.
 *
 * @param globalState - VS Code extension global state
 * @returns Machine ID (64 character hex string)
 */
export function getMachineId(globalState: vscode.Memento): string {
    try {
        // Check if we have a stored machine ID
        const storedId = globalState.get<string>(MACHINE_ID_KEY);
        if (storedId && typeof storedId === 'string' && storedId.length === 64) {
            return storedId;
        }

        // Generate and store new machine ID
        const newId = generateMachineId();
        // Fire and forget - don't await, don't block on storage
        globalState.update(MACHINE_ID_KEY, newId).then(
            () => { /* stored successfully */ },
            () => { /* storage failed, will regenerate next time */ }
        );
        return newId;
    } catch {
        // If anything fails, generate a fresh ID
        // This ensures we always return a valid ID
        return generateMachineId();
    }
}

/**
 * Generate a unique session ID
 *
 * Creates a new UUID v4 for each extension activation session.
 *
 * @returns UUID v4 string
 */
export function generateSessionId(): string {
    return crypto.randomUUID();
}
