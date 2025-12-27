import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectProject, detectProjectSync, getProjectInfo } from '../../parser/projectDetection';

suite('Project Detection Test Suite', () => {

    let tempDir: string;

    setup(() => {
        // Create a unique temp directory for each test
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specsmd-test-'));
    });

    teardown(() => {
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    suite('detectProject (async)', () => {

        test('should return true for workspace with memory-bank folder', async () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));

            const result = await detectProject(tempDir);

            assert.strictEqual(result, true);
        });

        test('should return true for workspace with .specsmd folder', async () => {
            fs.mkdirSync(path.join(tempDir, '.specsmd'));

            const result = await detectProject(tempDir);

            assert.strictEqual(result, true);
        });

        test('should return true for workspace with both folders', async () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));
            fs.mkdirSync(path.join(tempDir, '.specsmd'));

            const result = await detectProject(tempDir);

            assert.strictEqual(result, true);
        });

        test('should return false for workspace without either folder', async () => {
            // tempDir exists but has no memory-bank or .specsmd

            const result = await detectProject(tempDir);

            assert.strictEqual(result, false);
        });

        test('should return false for undefined workspace path', async () => {
            const result = await detectProject(undefined);

            assert.strictEqual(result, false);
        });

        test('should return false for non-existent workspace path', async () => {
            const result = await detectProject('/non/existent/path');

            assert.strictEqual(result, false);
        });

        test('should return true for empty memory-bank folder', async () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));
            // Folder exists but is empty

            const result = await detectProject(tempDir);

            assert.strictEqual(result, true);
        });
    });

    suite('detectProjectSync', () => {

        test('should return true for workspace with memory-bank folder', () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));

            const result = detectProjectSync(tempDir);

            assert.strictEqual(result, true);
        });

        test('should return false for workspace without folders', () => {
            const result = detectProjectSync(tempDir);

            assert.strictEqual(result, false);
        });

        test('should return false for undefined workspace path', () => {
            const result = detectProjectSync(undefined);

            assert.strictEqual(result, false);
        });
    });

    suite('getProjectInfo', () => {

        test('should return detailed info for specsmd project', () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));
            fs.mkdirSync(path.join(tempDir, '.specsmd'));

            const result = getProjectInfo(tempDir);

            assert.strictEqual(result.isProject, true);
            assert.strictEqual(result.hasMemoryBank, true);
            assert.strictEqual(result.hasSpecsmd, true);
            assert.ok(result.memoryBankPath);
            assert.ok(result.specsmdPath);
        });

        test('should return partial info for memory-bank only', () => {
            fs.mkdirSync(path.join(tempDir, 'memory-bank'));

            const result = getProjectInfo(tempDir);

            assert.strictEqual(result.isProject, true);
            assert.strictEqual(result.hasMemoryBank, true);
            assert.strictEqual(result.hasSpecsmd, false);
            assert.ok(result.memoryBankPath);
            assert.strictEqual(result.specsmdPath, null);
        });

        test('should return false values for non-specsmd project', () => {
            const result = getProjectInfo(tempDir);

            assert.strictEqual(result.isProject, false);
            assert.strictEqual(result.hasMemoryBank, false);
            assert.strictEqual(result.hasSpecsmd, false);
            assert.strictEqual(result.memoryBankPath, null);
            assert.strictEqual(result.specsmdPath, null);
        });

        test('should return false values for undefined path', () => {
            const result = getProjectInfo(undefined);

            assert.strictEqual(result.isProject, false);
            assert.strictEqual(result.hasMemoryBank, false);
            assert.strictEqual(result.hasSpecsmd, false);
        });
    });
});
