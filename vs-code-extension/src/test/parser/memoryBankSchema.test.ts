import * as assert from 'assert';
import * as path from 'path';
import { MemoryBankSchema } from '../../parser/memoryBankSchema';

suite('MemoryBankSchema Test Suite', () => {

    const workspacePath = '/test/workspace';
    let schema: MemoryBankSchema;

    setup(() => {
        schema = new MemoryBankSchema(workspacePath);
    });

    suite('getMemoryBankPath', () => {

        test('should return correct memory-bank path', () => {
            const result = schema.getMemoryBankPath();
            assert.strictEqual(result, path.join(workspacePath, 'memory-bank'));
        });
    });

    suite('getIntentsPath', () => {

        test('should return correct intents path', () => {
            const result = schema.getIntentsPath();
            assert.strictEqual(result, path.join(workspacePath, 'memory-bank', 'intents'));
        });
    });

    suite('getBoltsPath', () => {

        test('should return correct bolts path', () => {
            const result = schema.getBoltsPath();
            assert.strictEqual(result, path.join(workspacePath, 'memory-bank', 'bolts'));
        });
    });

    suite('getStandardsPath', () => {

        test('should return correct standards path', () => {
            const result = schema.getStandardsPath();
            assert.strictEqual(result, path.join(workspacePath, 'memory-bank', 'standards'));
        });
    });

    suite('getUnitsPath', () => {

        test('should return correct units path for intent', () => {
            const result = schema.getUnitsPath('001-user-auth');
            assert.strictEqual(
                result,
                path.join(workspacePath, 'memory-bank', 'intents', '001-user-auth', 'units')
            );
        });
    });

    suite('getStoriesPath', () => {

        test('should return correct stories path for unit', () => {
            const result = schema.getStoriesPath('001-user-auth', 'auth-service');
            assert.strictEqual(
                result,
                path.join(
                    workspacePath,
                    'memory-bank',
                    'intents',
                    '001-user-auth',
                    'units',
                    'auth-service',
                    'stories'
                )
            );
        });
    });

    suite('getBoltPath', () => {

        test('should return correct bolt folder path', () => {
            const result = schema.getBoltPath('bolt-auth-service-1');
            assert.strictEqual(
                result,
                path.join(workspacePath, 'memory-bank', 'bolts', 'bolt-auth-service-1')
            );
        });
    });

    suite('getSpecsmdPath', () => {

        test('should return correct .specsmd path', () => {
            const result = schema.getSpecsmdPath();
            assert.strictEqual(result, path.join(workspacePath, '.specsmd'));
        });
    });

    suite('getIntentPath', () => {

        test('should return correct intent folder path', () => {
            const result = schema.getIntentPath('001-user-auth');
            assert.strictEqual(
                result,
                path.join(workspacePath, 'memory-bank', 'intents', '001-user-auth')
            );
        });
    });

    suite('getUnitPath', () => {

        test('should return correct unit folder path', () => {
            const result = schema.getUnitPath('001-user-auth', 'auth-service');
            assert.strictEqual(
                result,
                path.join(
                    workspacePath,
                    'memory-bank',
                    'intents',
                    '001-user-auth',
                    'units',
                    'auth-service'
                )
            );
        });
    });

    suite('getUnitBriefPath', () => {

        test('should return correct unit-brief.md path', () => {
            const result = schema.getUnitBriefPath('001-user-auth', 'auth-service');
            assert.strictEqual(
                result,
                path.join(
                    workspacePath,
                    'memory-bank',
                    'intents',
                    '001-user-auth',
                    'units',
                    'auth-service',
                    'unit-brief.md'
                )
            );
        });
    });

    suite('getRequirementsPath', () => {

        test('should return correct requirements.md path', () => {
            const result = schema.getRequirementsPath('001-user-auth');
            assert.strictEqual(
                result,
                path.join(
                    workspacePath,
                    'memory-bank',
                    'intents',
                    '001-user-auth',
                    'requirements.md'
                )
            );
        });
    });

    suite('getBoltFilePath', () => {

        test('should return correct bolt.md path', () => {
            const result = schema.getBoltFilePath('bolt-auth-service-1');
            assert.strictEqual(
                result,
                path.join(
                    workspacePath,
                    'memory-bank',
                    'bolts',
                    'bolt-auth-service-1',
                    'bolt.md'
                )
            );
        });
    });

    suite('cross-platform compatibility', () => {

        test('should use path.join for all paths', () => {
            // All paths should use the platform's separator
            const memoryBankPath = schema.getMemoryBankPath();
            assert.ok(memoryBankPath.includes(path.sep) || memoryBankPath === path.join(workspacePath, 'memory-bank'));
        });
    });
});
