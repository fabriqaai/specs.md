import * as assert from 'assert';
import { getNonce } from '../../webview/utils';

suite('Webview Content Test Suite', () => {

    suite('getNonce', () => {

        test('should return a string of length 32', () => {
            const nonce = getNonce();
            assert.strictEqual(nonce.length, 32);
        });

        test('should only contain alphanumeric characters', () => {
            const nonce = getNonce();
            const validChars = /^[A-Za-z0-9]+$/;
            assert.ok(validChars.test(nonce), `Nonce contains invalid characters: ${nonce}`);
        });

        test('should generate different nonces on each call', () => {
            const nonces = new Set<string>();
            for (let i = 0; i < 100; i++) {
                nonces.add(getNonce());
            }
            // All 100 nonces should be unique (extremely unlikely to collide)
            assert.strictEqual(nonces.size, 100, 'Generated nonces should be unique');
        });

        test('should contain uppercase letters', () => {
            // Run multiple times to ensure we get uppercase letters
            let hasUppercase = false;
            for (let i = 0; i < 10; i++) {
                const nonce = getNonce();
                if (/[A-Z]/.test(nonce)) {
                    hasUppercase = true;
                    break;
                }
            }
            // With 10 tries of 32 chars each from a 62-char alphabet where 26 are uppercase,
            // probability of no uppercase is essentially zero
            assert.ok(hasUppercase, 'Nonce should contain uppercase letters');
        });

        test('should contain lowercase letters', () => {
            let hasLowercase = false;
            for (let i = 0; i < 10; i++) {
                const nonce = getNonce();
                if (/[a-z]/.test(nonce)) {
                    hasLowercase = true;
                    break;
                }
            }
            assert.ok(hasLowercase, 'Nonce should contain lowercase letters');
        });

        test('should contain digits', () => {
            let hasDigits = false;
            for (let i = 0; i < 10; i++) {
                const nonce = getNonce();
                if (/[0-9]/.test(nonce)) {
                    hasDigits = true;
                    break;
                }
            }
            assert.ok(hasDigits, 'Nonce should contain digits');
        });
    });
});
