import * as assert from 'assert';
import { debounce } from '../../watcher/debounce';

suite('Debounce Test Suite', () => {

    suite('debounce', () => {

        test('should call function after delay', (done) => {
            let callCount = 0;
            const debounced = debounce(() => {
                callCount++;
            }, 50);

            debounced.call();

            // Should not be called immediately
            assert.strictEqual(callCount, 0);

            // Should be called after delay
            setTimeout(() => {
                assert.strictEqual(callCount, 1);
                done();
            }, 100);
        });

        test('should only call once for multiple rapid calls', (done) => {
            let callCount = 0;
            const debounced = debounce(() => {
                callCount++;
            }, 50);

            // Make multiple rapid calls
            debounced.call();
            debounced.call();
            debounced.call();
            debounced.call();
            debounced.call();

            // Should be pending
            assert.strictEqual(debounced.isPending(), true);

            // Should still be 0 immediately
            assert.strictEqual(callCount, 0);

            // Should be called only once after delay
            setTimeout(() => {
                assert.strictEqual(callCount, 1);
                assert.strictEqual(debounced.isPending(), false);
                done();
            }, 100);
        });

        test('should reset timer on new call', (done) => {
            let callCount = 0;
            const debounced = debounce(() => {
                callCount++;
            }, 50);

            debounced.call();

            // Call again after 30ms (before the 50ms delay)
            setTimeout(() => {
                debounced.call();
            }, 30);

            // After 60ms from start, should still not be called
            // (because timer was reset at 30ms, so it needs until 80ms)
            setTimeout(() => {
                assert.strictEqual(callCount, 0);
            }, 60);

            // After 100ms, should be called once
            setTimeout(() => {
                assert.strictEqual(callCount, 1);
                done();
            }, 120);
        });

        test('should cancel pending call', (done) => {
            let callCount = 0;
            const debounced = debounce(() => {
                callCount++;
            }, 50);

            debounced.call();
            assert.strictEqual(debounced.isPending(), true);

            debounced.cancel();
            assert.strictEqual(debounced.isPending(), false);

            // After delay, should not be called
            setTimeout(() => {
                assert.strictEqual(callCount, 0);
                done();
            }, 100);
        });

        test('should report pending state correctly', () => {
            const debounced = debounce(() => {}, 50);

            // Not pending initially
            assert.strictEqual(debounced.isPending(), false);

            debounced.call();

            // Pending after call
            assert.strictEqual(debounced.isPending(), true);

            debounced.cancel();

            // Not pending after cancel
            assert.strictEqual(debounced.isPending(), false);
        });

        test('should handle cancel when not pending', () => {
            const debounced = debounce(() => {}, 50);

            // Should not throw
            debounced.cancel();
            debounced.cancel();

            assert.strictEqual(debounced.isPending(), false);
        });

        test('should pass arguments to function', (done) => {
            let receivedArgs: unknown[] = [];
            const debounced = debounce((...args: unknown[]) => {
                receivedArgs = args;
            }, 50);

            debounced.call('arg1', 'arg2', 123);

            setTimeout(() => {
                assert.deepStrictEqual(receivedArgs, ['arg1', 'arg2', 123]);
                done();
            }, 100);
        });

        test('should use latest arguments when called multiple times', (done) => {
            let receivedArg: unknown;
            const debounced = debounce((arg: unknown) => {
                receivedArg = arg;
            }, 50);

            debounced.call('first');
            debounced.call('second');
            debounced.call('third');

            setTimeout(() => {
                assert.strictEqual(receivedArg, 'third');
                done();
            }, 100);
        });
    });
});
