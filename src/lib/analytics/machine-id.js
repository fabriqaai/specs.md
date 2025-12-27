/**
 * Machine ID Generation
 *
 * Generates a stable, anonymous machine identifier using a salted SHA-256 hash
 * of the hostname. This ensures:
 * - Same machine always produces same ID
 * - Cannot reverse-lookup the hostname from the hash
 * - No PII is stored or transmitted
 */

const crypto = require('crypto');
const os = require('os');

// Constant salt prevents rainbow table attacks
// Do not change this value - it would break ID consistency
const SALT = 'specsmd-analytics-v1';

/**
 * Generate a stable machine identifier
 *
 * @returns {string} SHA-256 hash of salted hostname (64 hex characters)
 */
function getMachineId() {
    const hostname = os.hostname();
    return crypto
        .createHash('sha256')
        .update(SALT + hostname)
        .digest('hex');
}

module.exports = {
    getMachineId
};
