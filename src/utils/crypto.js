const crypto = require('crypto');

/**
 * Hashes a plain-text password using the Node.js native crypto module (scrypt).
 * Generates a unique salt for each password and returns the salt + hash combination.
 * 
 * @param {string} password - The plain-text password to hash
 * @returns {Promise<string>} A promise that resolves to the formatted hash string (salt:hash)
 */
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    // Generate a secure 16-byte random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash password using scrypt with a 64-byte key length
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Verifies a plain-text password against a stored salt+hash combination.
 * 
 * @param {string} password - The plain-text password to check
 * @param {string} storedHash - The stored string in format "salt:hash"
 * @returns {Promise<boolean>} A promise that resolves to true if password matches, false otherwise
 */
const verifyPassword = (password, storedHash) => {
  return new Promise((resolve, reject) => {
    if (!storedHash || !storedHash.includes(':')) {
      return resolve(false);
    }
    
    const [salt, hash] = storedHash.split(':');
    
    // Re-hash the incoming password using the extracted salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      // Compare calculated hash with stored hash
      resolve(derivedKey.toString('hex') === hash);
    });
  });
};

module.exports = {
  hashPassword,
  verifyPassword
};
