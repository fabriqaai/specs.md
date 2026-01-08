/**
 * Machine ID Tests
 *
 * Tests for machine ID generation and session ID generation.
 */

import * as assert from 'assert';
import { generateMachineId, generateSessionId, getMachineId } from '../../analytics/machineId';

suite('Machine ID Test Suite', () => {
    suite('generateMachineId', () => {
        test('should generate a 64-character hex string', () => {
            const id = generateMachineId();
            assert.strictEqual(id.length, 64);
            assert.match(id, /^[a-f0-9]+$/);
        });

        test('should be deterministic (same result on multiple calls)', () => {
            const id1 = generateMachineId();
            const id2 = generateMachineId();
            assert.strictEqual(id1, id2);
        });

        test('should be a valid SHA-256 hash', () => {
            const id = generateMachineId();
            // SHA-256 produces 256 bits = 64 hex characters
            assert.strictEqual(id.length, 64);
            // Should be lowercase hex only
            assert.match(id, /^[0-9a-f]{64}$/);
        });
    });

    suite('generateSessionId', () => {
        test('should generate a valid UUID v4', () => {
            const id = generateSessionId();
            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        test('should generate unique IDs on each call', () => {
            const id1 = generateSessionId();
            const id2 = generateSessionId();
            assert.notStrictEqual(id1, id2);
        });

        test('should generate 100 unique IDs', () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(generateSessionId());
            }
            assert.strictEqual(ids.size, 100);
        });
    });

    suite('getMachineId', () => {
        test('should return a stored ID if available', () => {
            const storedId = 'a'.repeat(64);
            const mockGlobalState = {
                get: (key: string) => key === 'specsmd.machineId' ? storedId : undefined,
                update: () => Promise.resolve(),
            };

            const id = getMachineId(mockGlobalState as never);
            assert.strictEqual(id, storedId);
        });

        test('should generate a new ID if none stored', () => {
            const mockGlobalState = {
                get: () => undefined,
                update: () => Promise.resolve(),
            };

            const id = getMachineId(mockGlobalState as never);
            assert.strictEqual(id.length, 64);
            assert.match(id, /^[a-f0-9]+$/);
        });

        test('should generate a new ID if stored value is invalid', () => {
            const mockGlobalState = {
                get: () => 'invalid',
                update: () => Promise.resolve(),
            };

            const id = getMachineId(mockGlobalState as never);
            assert.strictEqual(id.length, 64);
            assert.match(id, /^[a-f0-9]+$/);
        });

        test('should handle globalState errors gracefully', () => {
            const mockGlobalState = {
                get: () => { throw new Error('Storage error'); },
                update: () => Promise.resolve(),
            };

            // Should not throw, should return a valid ID
            const id = getMachineId(mockGlobalState as never);
            assert.strictEqual(id.length, 64);
        });
    });
});
